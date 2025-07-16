/**
 * 极简网络可达性检测工具
 *
 * 只检测网络是否可达，支持两种状态：
 * - available: 网络可达
 * - unreachable: 网络不可达
 */

// 缓存管理
const statusCache = new Map();
const CACHE_DURATION = 30000; // 30秒缓存

// 简化检测配置
const SIMPLE_CHECK_CONFIG = {
  timeout: 5000,           // 统一5秒超时
  concurrency: 6,          // 提升并发数到6
  methods: ['HEAD', 'GET'], // 简化的检测方法
  retryCount: 1,           // 重试次数
  cacheEnabled: true,      // 启用缓存
  imageProbeTimeout: 3000, // 图像探测超时时间
  enableImageProbe: true,  // 启用图像探测
  debugMode: false         // 调试模式
};

/**
 * 获取缓存的检测结果
 */
const getCachedResult = (environmentId) => {
  if (!SIMPLE_CHECK_CONFIG.cacheEnabled) return null;
  
  const cached = statusCache.get(environmentId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.result;
  }
  return null;
};

/**
 * 设置缓存结果
 */
const setCachedResult = (environmentId, result) => {
  if (!SIMPLE_CHECK_CONFIG.cacheEnabled) return;
  
  statusCache.set(environmentId, {
    result,
    timestamp: Date.now()
  });
};

/**
 * 调试日志函数
 */
const debugLog = (message, data = null) => {
  if (SIMPLE_CHECK_CONFIG.debugMode) {
    console.log(`[NETWORK-DEBUG] ${message}`, data || '');
  }
};

/**
 * 清理过期缓存
 */
const cleanExpiredCache = () => {
  const now = Date.now();
  for (const [key, value] of statusCache.entries()) {
    if (now - value.timestamp >= CACHE_DURATION) {
      statusCache.delete(key);
    }
  }
};

/**
 * 检测是否为内网IP地址
 */
const isPrivateIP = (hostname) => {
  // IPv4 内网地址范围
  const privateRanges = [
    /^10\./,                    // 10.0.0.0/8
    /^192\.168\./,              // 192.168.0.0/16
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
    /^127\./,                   // 127.0.0.0/8 (localhost)
    /^169\.254\./,              // 169.254.0.0/16 (link-local)
  ];

  return privateRanges.some(range => range.test(hostname));
};

/**
 * 基于 img 标签的网络探测方法（修复版）
 * 适用于 IP+端口 格式的地址检测，可绕过 CORS 限制
 * 修复了错误地将网络不可达判断为可达的问题
 */
const checkImageProbe = async (url, timeout = 3000) => {
  return new Promise((resolve) => {
    const img = new Image();
    let isResolved = false;
    const startTime = Date.now();

    // 超时处理
    const timeoutId = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        img.src = ''; // 清除src避免继续加载
        resolve({
          reachable: false,
          method: 'image-timeout',
          error: '探测超时',
          responseTime: Date.now() - startTime
        });
      }
    }, timeout);

    // 成功加载（图像资源存在且可访问）
    img.onload = () => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        resolve({
          reachable: true,
          method: 'image-load',
          details: '图像加载成功',
          responseTime
        });
      }
    };

    // 加载错误 - 需要根据响应时间和URL类型判断是否可达
    img.onerror = () => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        try {
          const urlObj = new URL(url);
          const isPrivate = isPrivateIP(urlObj.hostname);

          // 对于内网IP，只有极快失败才可能表示网络不可达
          // 调整阈值为50ms，避免误判真正可达的内网服务
          if (isPrivate && responseTime < 50) {
            resolve({
              reachable: false,
              method: 'image-error-very-fast-fail',
              error: '内网地址极快失败，可能不存在',
              responseTime,
              details: `响应时间: ${responseTime}ms，需要进一步验证`
            });
            return;
          }

          // 对于其他情况，采用保守策略：倾向于判断为可达
          // 这样可以避免误杀真正可达的服务
          if (responseTime > 100) {
            resolve({
              reachable: true,
              method: 'image-error-likely-reachable',
              details: `服务可达但资源不存在 (响应时间: ${responseTime}ms)`,
              responseTime
            });
          } else {
            // 对于50-100ms的响应时间，采用保守策略判断为可达
            // 避免误判真正可达的内网服务
            resolve({
              reachable: true,
              method: 'image-error-conservative-reachable',
              details: `保守判断为可达 (响应时间: ${responseTime}ms)`,
              responseTime,
              warning: '响应时间较短，但采用保守策略判断为可达'
            });
          }
        } catch (parseError) {
          // URL解析失败，判断为不可达
          resolve({
            reachable: false,
            method: 'image-error-invalid-url',
            error: 'URL解析失败',
            responseTime
          });
        }
      }
    };

    // 开始探测
    try {
      img.src = url;
    } catch (error) {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutId);
        resolve({
          reachable: false,
          method: 'image-exception',
          error: error.message,
          responseTime: Date.now() - startTime
        });
      }
    }
  });
};

/**
 * 为 IP+端口 地址构造探测URL
 */
const buildProbeUrls = (baseUrl) => {
  const urls = [];

  try {
    const urlObj = new URL(baseUrl);
    const base = `${urlObj.protocol}//${urlObj.host}`;

    // 常见的探测路径
    const probePaths = [
      '/favicon.ico',    // 最常见的图标文件
      '/ping',           // 常见的健康检查端点
      '/health',         // 健康检查端点
      '/status',         // 状态检查端点
      '/robots.txt',     // 机器人文件
      '/',               // 根路径
      '/api/health',     // API健康检查
      '/actuator/health' // Spring Boot健康检查
    ];

    probePaths.forEach(path => {
      urls.push(`${base}${path}`);
    });

  } catch (error) {
    // 如果URL解析失败，尝试直接添加路径
    urls.push(`${baseUrl}/favicon.ico`);
    urls.push(`${baseUrl}/ping`);
  }

  return urls;
};

/**
 * 检测是否为混合内容（HTTPS页面访问HTTP资源）
 */
const isMixedContent = (targetUrl) => {
  try {
    const currentProtocol = window.location.protocol;
    const targetProtocol = new URL(targetUrl).protocol;

    return currentProtocol === 'https:' && targetProtocol === 'http:';
  } catch {
    return false;
  }
};

/**
 * 检测是否为 IP+端口 格式的地址
 */
const isIpPortAddress = (url) => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // 检测IPv4地址格式
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;

    // 检测IPv6地址格式（简化版）
    const ipv6Regex = /^\[?([0-9a-fA-F:]+)\]?$/;

    return ipv4Regex.test(hostname) || ipv6Regex.test(hostname);
  } catch {
    return false;
  }
};

/**
 * 改进的网络可达性检测（修复版）
 * 添加了更严格的错误判断和内网IP特殊处理
 */
const checkNetworkReachability = async (url, timeout = SIMPLE_CHECK_CONFIG.timeout) => {
  const controller = new AbortController();
  const startTime = Date.now();

  // 设置超时
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const urlObj = new URL(url);
    const isPrivate = isPrivateIP(urlObj.hostname);

    // 对于内网IP，使用更严格的检测
    if (isPrivate) {
      // 先尝试HEAD请求（更轻量）
      try {
        const response = await fetch(url, {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal,
          cache: 'no-cache',
          credentials: 'omit'
        });

        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        // 对于内网，快速响应通常表示真正可达
        if (responseTime < 1000) {
          return {
            reachable: true,
            method: 'fetch-head-success',
            responseTime,
            details: `内网地址HEAD请求成功 (${responseTime}ms)`
          };
        }
      } catch (headError) {
        // HEAD失败，尝试GET
        debugLog('HEAD请求失败，尝试GET', { url, error: headError.message });
      }
    }

    // 标准GET请求
    await fetch(url, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal,
      cache: 'no-cache',
      credentials: 'omit'
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    return {
      reachable: true,
      method: 'fetch-no-cors',
      responseTime,
      details: `fetch请求成功 (${responseTime}ms)`
    };

  } catch (error) {
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    // 分析错误类型
    if (error.name === 'AbortError') {
      return {
        reachable: false,
        method: 'fetch-timeout',
        error: '请求超时',
        responseTime
      };
    }

    // 对于内网IP的极快失败，可能是网络不可达
    // 调整阈值为30ms，避免误判真正可达的内网服务
    try {
      const urlObj = new URL(url);
      if (isPrivateIP(urlObj.hostname) && responseTime < 30) {
        return {
          reachable: false,
          method: 'fetch-very-fast-fail',
          error: '内网地址极快失败，可能不存在',
          responseTime,
          details: `响应时间: ${responseTime}ms，建议进一步验证`
        };
      }
    } catch (parseError) {
      // URL解析失败
    }

    return {
      reachable: false,
      method: 'fetch-failed',
      error: error.message,
      responseTime
    };
  }
};



/**
 * 智能验证机制 - 对可疑结果进行二次确认
 * 现在更加保守，主要验证极快失败的情况
 */
const verifyReachability = async (url, primaryResult, timeout = 2000) => {
  debugLog('开始智能验证', { url, primaryResult });

  try {
    const urlObj = new URL(url);
    const isPrivate = isPrivateIP(urlObj.hostname);

    // 只对内网IP的极快失败进行验证，避免误判正常服务
    if (!isPrivate || primaryResult.reachable ||
        !primaryResult.method?.includes('very-fast-fail')) {
      return primaryResult;
    }

    // 对极快失败进行多次验证，确保不是偶然的网络抖动
    const verifyUrls = [
      `${urlObj.protocol}//${urlObj.host}/`,
      `${urlObj.protocol}//${urlObj.host}/favicon.ico`,
      `${urlObj.protocol}//${urlObj.host}/ping`
    ];

    let fastFailCount = 0;
    let totalAttempts = 0;

    for (const verifyUrl of verifyUrls) {
      try {
        totalAttempts++;
        const result = await checkImageProbe(verifyUrl, timeout);

        // 如果任何一次验证成功或响应时间正常，判断为可达
        if (result.reachable || result.responseTime > 50) {
          debugLog('验证发现服务可达，修正结果', { url, verifyUrl, result });
          return {
            reachable: true,
            method: 'verification-corrected-reachable',
            details: `验证发现服务可达: ${verifyUrl}`,
            responseTime: result.responseTime,
            originalResult: primaryResult,
            corrected: true
          };
        }

        if (result.responseTime < 50) {
          fastFailCount++;
        }
      } catch (error) {
        totalAttempts++;
        fastFailCount++;
      }
    }

    // 只有所有验证都极快失败才判断为真正不可达
    if (fastFailCount === totalAttempts && totalAttempts >= 2) {
      debugLog('多次验证确认不可达', { url, fastFailCount, totalAttempts });
      return {
        reachable: false,
        method: 'multi-verification-unreachable',
        error: '多次验证确认不可达',
        details: `${totalAttempts}次验证均快速失败`,
        originalResult: primaryResult
      };
    }

    // 如果验证结果不确定，采用保守策略判断为可达
    debugLog('验证结果不确定，采用保守策略', { url, primaryResult, fastFailCount, totalAttempts });
    return {
      reachable: true,
      method: 'verification-conservative-reachable',
      details: '验证结果不确定，采用保守策略判断为可达',
      responseTime: primaryResult.responseTime,
      originalResult: primaryResult,
      warning: '验证结果不确定，可能存在网络抖动'
    };

  } catch (error) {
    debugLog('双重验证异常', { url, error: error.message });
    return primaryResult;
  }
};

/**
 * 增强的网络探测方法（修复版）
 * 结合 fetch 和 img 探测，提供更准确的检测结果
 * 添加了双重验证机制防止误报
 */
const checkEnhancedReachability = async (url, timeout = SIMPLE_CHECK_CONFIG.timeout) => {
  const isIpPort = isIpPortAddress(url);
  const isMixedContentIssue = isMixedContent(url);

  debugLog('开始增强探测', { url, isIpPort, isMixedContentIssue, timeout });

  // 对于混合内容或IP+端口地址，优先使用 img 探测
  if (isMixedContentIssue || isIpPort) {
    debugLog('检测到混合内容或IP+端口地址，优先使用img探测', { url, isMixedContentIssue, isIpPort });

    // 1. 对于混合内容，直接使用 img 探测（跳过fetch避免被阻止）
    if (isMixedContentIssue && SIMPLE_CHECK_CONFIG.enableImageProbe) {
      debugLog('混合内容检测，直接使用img探测', url);
      const probeUrls = buildProbeUrls(url);
      debugLog('构建探测URL列表', probeUrls);

      for (const probeUrl of probeUrls) {
        try {
          debugLog('尝试img探测（混合内容）', probeUrl);
          const imgResult = await checkImageProbe(probeUrl, Math.min(timeout, SIMPLE_CHECK_CONFIG.imageProbeTimeout));
          if (imgResult.reachable) {
            debugLog('img探测成功（混合内容）', { probeUrl, result: imgResult });
            return {
              reachable: true,
              method: 'mixed-content-image-probe',
              details: `混合内容img探测成功: ${probeUrl}`,
              probeUrl: probeUrl,
              mixedContent: true
            };
          }
        } catch (error) {
          debugLog('img探测异常（混合内容）', { probeUrl, error: error.message });
          continue;
        }
      }

      // 混合内容img探测失败
      return {
        reachable: false,
        method: 'mixed-content-blocked',
        details: '混合内容被阻止，img探测也失败',
        mixedContent: true,
        attemptedUrls: probeUrls
      };
    }

    // 2. 对于IP地址（非混合内容），先尝试 fetch
    if (!isMixedContentIssue) {
      debugLog('尝试fetch探测', url);
      const fetchResult = await checkNetworkReachability(url, timeout);
      if (fetchResult.reachable) {
        debugLog('fetch探测成功', fetchResult);
        return {
          ...fetchResult,
          method: 'fetch-success',
          details: 'fetch探测成功'
        };
      }
    }

    // 3. fetch失败或跳过时，尝试 img 探测
    if (SIMPLE_CHECK_CONFIG.enableImageProbe) {
      debugLog('fetch探测失败或跳过，尝试img探测');
      const probeUrls = buildProbeUrls(url);
      debugLog('构建探测URL列表', probeUrls);

      for (const probeUrl of probeUrls) {
        try {
          debugLog('尝试img探测', probeUrl);
          const imgResult = await checkImageProbe(probeUrl, Math.min(timeout, SIMPLE_CHECK_CONFIG.imageProbeTimeout));
          if (imgResult.reachable) {
            debugLog('img探测成功，进行双重验证', { probeUrl, result: imgResult });
            const verifiedResult = await verifyReachability(url, {
              reachable: true,
              method: imgResult.method,
              details: `img探测成功: ${probeUrl}`,
              probeUrl: probeUrl,
              responseTime: imgResult.responseTime
            });

            if (verifiedResult.reachable) {
              return verifiedResult;
            } else {
              debugLog('双重验证失败，继续尝试其他探测路径', { probeUrl, verifiedResult });
              continue;
            }
          }
        } catch (error) {
          debugLog('img探测异常', { probeUrl, error: error.message });
          continue;
        }
      }
    }

    // 4. 所有方法都失败
    debugLog('所有探测方法均失败', url);
    return {
      reachable: false,
      method: 'all-methods-failed',
      details: isMixedContentIssue ? '混合内容限制，所有探测方法失败' : 'fetch和img探测均失败',
      attemptedUrls: buildProbeUrls(url),
      mixedContent: isMixedContentIssue
    };
  } else {
    // 对于域名地址（非混合内容），使用标准 fetch 探测
    debugLog('域名地址，使用标准fetch探测', url);
    return await checkNetworkReachability(url, timeout);
  }
};

/**
 * 极简环境检测 - 只检测网络可达性
 */
export const checkEnvironmentStatus = async (environment) => {
  const startTime = Date.now();

  // 检查缓存
  const cached = getCachedResult(environment.id);
  if (cached) {
    return cached;
  }

  try {
    const reachabilityResult = await checkEnhancedReachability(environment.url);

    const result = {
      id: environment.id,
      status: reachabilityResult.reachable ? 'available' : 'unreachable',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: reachabilityResult.error || null,
      method: reachabilityResult.method || 'enhanced-check',
      details: reachabilityResult.details || null,
      probeUrl: reachabilityResult.probeUrl || null,
      statusCode: null
    };

    setCachedResult(environment.id, result);
    return result;

  } catch (error) {
    const result = {
      id: environment.id,
      status: 'unreachable',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: `检测异常: ${error.message}`,
      method: 'exception',
      statusCode: null
    };

    setCachedResult(environment.id, result);
    return result;
  }
};

/**
 * 批量检测多个环境
 */
export const checkMultipleEnvironments = async (environments, onProgress) => {
  const results = {};
  const total = environments.length;
  let completed = 0;

  // 清理过期缓存
  cleanExpiredCache();

  // 分批处理，控制并发
  const concurrency = SIMPLE_CHECK_CONFIG.concurrency;
  const chunks = [];

  for (let i = 0; i < environments.length; i += concurrency) {
    chunks.push(environments.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    console.log('[NETWORK] 处理批次，环境数量:', chunk.length);
    const promises = chunk.map(async (env) => {
      console.log('[NETWORK] 检测环境:', env.name, env.url);
      const result = await checkEnvironmentStatus(env);
      console.log('[NETWORK] 检测结果:', env.name, result);
      completed++;

      // 更新进度
      if (onProgress) {
        onProgress({
          completed,
          total,
          percentage: Math.round((completed / total) * 100)
        });
      }

      return { [env.id]: result };
    });

    const chunkResults = await Promise.all(promises);
    chunkResults.forEach(result => Object.assign(results, result));
  }

  console.log('[NETWORK] 批量检测完成，结果:', results);
  return results;
};

/**
 * 清除所有缓存
 */
export const clearCache = () => {
  statusCache.clear();
};

/**
 * 获取缓存统计信息
 */
export const getCacheStats = () => {
  return {
    size: statusCache.size,
    entries: Array.from(statusCache.keys())
  };
};

// 调试模式可以通过修改配置启用（生产环境建议关闭）
// SIMPLE_CHECK_CONFIG.debugMode = true;
