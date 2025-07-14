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
 * 基于 img 标签的网络探测方法
 * 适用于 IP+端口 格式的地址检测，可绕过 CORS 限制
 */
const checkImageProbe = async (url, timeout = 3000) => {
  return new Promise((resolve) => {
    const img = new Image();
    let isResolved = false;

    // 超时处理
    const timeoutId = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        img.src = ''; // 清除src避免继续加载
        resolve({
          reachable: false,
          method: 'image-timeout',
          error: '探测超时'
        });
      }
    }, timeout);

    // 成功加载（即使是404等错误，也说明服务可达）
    img.onload = () => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutId);
        resolve({
          reachable: true,
          method: 'image-load',
          details: '图像加载成功'
        });
      }
    };

    // 加载错误（但服务可达，返回了错误响应）
    img.onerror = () => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutId);
        resolve({
          reachable: true,
          method: 'image-error-reachable',
          details: '服务可达但资源不存在'
        });
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
          error: error.message
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
 * 极简网络可达性检测
 */
const checkNetworkReachability = async (url, timeout = SIMPLE_CHECK_CONFIG.timeout) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // 直接使用no-cors模式，只检测网络可达性
    await fetch(url, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal,
      cache: 'no-cache',
      credentials: 'omit'
    });

    clearTimeout(timeoutId);
    return { reachable: true, method: 'fetch-no-cors' };

  } catch {
    clearTimeout(timeoutId);
    return { reachable: false, method: 'fetch-failed' };
  }
};



/**
 * 增强的网络探测方法
 * 结合 fetch 和 img 探测，提供更准确的检测结果
 */
const checkEnhancedReachability = async (url, timeout = SIMPLE_CHECK_CONFIG.timeout) => {
  const isIpPort = isIpPortAddress(url);

  debugLog('开始增强探测', { url, isIpPort, timeout });

  // 对于 IP+端口 地址，优先使用 img 探测
  if (isIpPort) {
    debugLog('检测到IP+端口地址，使用增强探测', url);

    // 1. 首先尝试 fetch 探测
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

    // 2. fetch 失败时，尝试 img 探测
    if (SIMPLE_CHECK_CONFIG.enableImageProbe) {
      debugLog('fetch探测失败，尝试img探测');
      const probeUrls = buildProbeUrls(url);
      debugLog('构建探测URL列表', probeUrls);

      for (const probeUrl of probeUrls) {
        try {
          debugLog('尝试img探测', probeUrl);
          const imgResult = await checkImageProbe(probeUrl, Math.min(timeout, SIMPLE_CHECK_CONFIG.imageProbeTimeout));
          if (imgResult.reachable) {
            debugLog('img探测成功', { probeUrl, result: imgResult });
            return {
              reachable: true,
              method: imgResult.method,
              details: `img探测成功: ${probeUrl}`,
              probeUrl: probeUrl
            };
          }
        } catch (error) {
          debugLog('img探测异常', { probeUrl, error: error.message });
          continue;
        }
      }
    }

    // 3. 所有方法都失败
    debugLog('所有探测方法均失败', url);
    return {
      reachable: false,
      method: 'all-methods-failed',
      details: 'fetch和img探测均失败',
      attemptedUrls: buildProbeUrls(url)
    };
  } else {
    // 对于域名地址，使用标准 fetch 探测
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

/**
 * 启用/禁用调试模式
 */
export const setDebugMode = (enabled) => {
  SIMPLE_CHECK_CONFIG.debugMode = enabled;
  debugLog('调试模式已' + (enabled ? '启用' : '禁用'));
};

/**
 * 获取当前配置
 */
export const getConfig = () => {
  return { ...SIMPLE_CHECK_CONFIG };
};

/**
 * 更新配置
 */
export const updateConfig = (newConfig) => {
  Object.assign(SIMPLE_CHECK_CONFIG, newConfig);
  debugLog('配置已更新', SIMPLE_CHECK_CONFIG);
};
