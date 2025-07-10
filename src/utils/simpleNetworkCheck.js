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

// 优化检测配置
const SIMPLE_CHECK_CONFIG = {
  timeout: 8000,           // 调整为8秒超时
  concurrency: 3,          // 降低并发数避免过载
  methods: ['HEAD', 'GET'], // 简化的检测方法
  retryCount: 2,           // 增加重试次数
  cacheEnabled: true       // 启用缓存
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
 * 智能网络可达性检测 - 修复公网IP误报问题
 */
const checkNetworkReachability = async (url, timeout = SIMPLE_CHECK_CONFIG.timeout) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // 检测URL类型
    const urlObj = new URL(url);
    const isIP = /^\d+\.\d+\.\d+\.\d+$/.test(urlObj.hostname);
    const isPublicIP = isIP && !isPrivateIP(urlObj.hostname);

    // 对于公网IP，使用多种策略检测
    if (isPublicIP) {
      return await checkPublicIPReachability(url, controller.signal, timeout);
    }

    // 对于域名，使用标准检测
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-cache',
      credentials: 'omit',
      headers: {
        'Accept': '*/*',
        'User-Agent': 'Environment-Monitor/1.0'
      }
    });

    clearTimeout(timeoutId);

    // 2xx-3xx状态码都认为是可达的
    if (response.status >= 200 && response.status < 400) {
      return { reachable: true, status: response.status, method: 'head' };
    }

    // 4xx状态码表示服务可达但资源不存在
    if (response.status >= 400 && response.status < 500) {
      return { reachable: true, status: response.status, method: 'head' };
    }

    // 5xx状态码表示服务器错误但服务可达
    if (response.status >= 500) {
      return { reachable: true, status: response.status, method: 'head' };
    }

    return { reachable: false, status: response.status };

  } catch (error) {
    clearTimeout(timeoutId);

    // 如果是CORS错误，尝试no-cors模式
    if (error.name === 'TypeError' && error.message.includes('CORS')) {
      return await fallbackNoCorsCheck(url, timeout);
    }

    return { reachable: false, error: error.message };
  }
};

/**
 * 检查是否为私有IP地址
 */
const isPrivateIP = (ip) => {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4) return false;

  // 10.0.0.0/8
  if (parts[0] === 10) return true;

  // 172.16.0.0/12
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

  // 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) return true;

  // 127.0.0.0/8 (localhost)
  if (parts[0] === 127) return true;

  return false;
};

/**
 * 公网IP专用检测策略
 */
const checkPublicIPReachability = async (url, signal, timeout) => {
  try {
    // 策略1: 尝试HEAD请求
    const response = await fetch(url, {
      method: 'HEAD',
      signal,
      cache: 'no-cache',
      credentials: 'omit',
      headers: {
        'Accept': '*/*',
        'User-Agent': 'Environment-Monitor/1.0'
      }
    });

    return {
      reachable: true,
      status: response.status,
      method: 'head-public-ip'
    };

  } catch (headError) {
    // 策略2: 尝试GET请求
    try {
      const response = await fetch(url, {
        method: 'GET',
        signal,
        cache: 'no-cache',
        credentials: 'omit',
        headers: {
          'Accept': 'text/html,*/*',
          'User-Agent': 'Environment-Monitor/1.0'
        }
      });

      return {
        reachable: true,
        status: response.status,
        method: 'get-public-ip'
      };

    } catch (getError) {
      // 策略3: no-cors模式检测
      try {
        await fetch(url, {
          method: 'GET',
          mode: 'no-cors',
          signal,
          cache: 'no-cache',
          credentials: 'omit'
        });

        return {
          reachable: true,
          method: 'no-cors-public-ip'
        };

      } catch (noCorsError) {
        return {
          reachable: false,
          error: `Public IP unreachable: ${noCorsError.message}`,
          method: 'failed-public-ip'
        };
      }
    }
  }
};

/**
 * 备用no-cors检测
 */
const fallbackNoCorsCheck = async (url, timeout) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    await fetch(url, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal,
      cache: 'no-cache',
      credentials: 'omit'
    });

    clearTimeout(timeoutId);
    return { reachable: true, method: 'no-cors-fallback' };

  } catch (error) {
    clearTimeout(timeoutId);
    return { reachable: false, error: error.message, method: 'no-cors-failed' };
  }
};



/**
 * 智能环境检测 - 支持多种检测策略
 */
export const checkEnvironmentStatus = async (environment) => {
  const startTime = Date.now();

  // 检查缓存
  const cached = getCachedResult(environment.id);
  if (cached) {
    return cached;
  }

  // 添加重试机制
  let lastError = null;
  for (let attempt = 0; attempt <= SIMPLE_CHECK_CONFIG.retryCount; attempt++) {
    try {
      const reachabilityResult = await checkNetworkReachability(environment.url);

      const result = {
        id: environment.id,
        status: reachabilityResult.reachable ? 'available' : 'unreachable',
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        error: reachabilityResult.error || null,
        method: reachabilityResult.method || 'unknown',
        statusCode: reachabilityResult.status || null,
        attempt: attempt + 1
      };

      // 只有成功的结果才缓存
      if (reachabilityResult.reachable) {
        setCachedResult(environment.id, result);
      }

      return result;

    } catch (error) {
      lastError = error;

      // 如果不是最后一次尝试，等待一下再重试
      if (attempt < SIMPLE_CHECK_CONFIG.retryCount) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  // 所有重试都失败了
  const result = {
    id: environment.id,
    status: 'unreachable',
    responseTime: Date.now() - startTime,
    lastChecked: new Date().toISOString(),
    error: `检测失败 (${SIMPLE_CHECK_CONFIG.retryCount + 1}次尝试): ${lastError?.message || '未知错误'}`,
    method: 'failed',
    statusCode: null,
    attempt: SIMPLE_CHECK_CONFIG.retryCount + 1
  };

  return result;
};

/**
 * 批量检测多个环境 - 改进进度反馈和错误处理
 */
export const checkMultipleEnvironments = async (environments, onProgress) => {
  const results = {};
  const total = environments.length;
  let completed = 0;
  let errors = 0;

  // 清理过期缓存
  cleanExpiredCache();

  // 初始进度报告
  if (onProgress) {
    onProgress({
      completed: 0,
      total,
      percentage: 0,
      errors: 0,
      status: 'starting'
    });
  }

  // 分批处理，控制并发
  const concurrency = SIMPLE_CHECK_CONFIG.concurrency;
  const chunks = [];

  for (let i = 0; i < environments.length; i += concurrency) {
    chunks.push(environments.slice(i, i + concurrency));
  }

  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const chunk = chunks[chunkIndex];

    const promises = chunk.map(async (env) => {
      try {
        const result = await checkEnvironmentStatus(env);
        completed++;

        // 统计错误
        if (result.status === 'unreachable') {
          errors++;
        }

        // 实时更新进度
        if (onProgress) {
          onProgress({
            completed,
            total,
            percentage: Math.round((completed / total) * 100),
            errors,
            current: env.name,
            status: 'checking'
          });
        }

        return { [env.id]: result };

      } catch (error) {
        completed++;
        errors++;

        // 创建错误结果
        const errorResult = {
          id: env.id,
          status: 'unreachable',
          responseTime: 0,
          lastChecked: new Date().toISOString(),
          error: `批量检测异常: ${error.message}`,
          method: 'batch-error',
          statusCode: null
        };

        if (onProgress) {
          onProgress({
            completed,
            total,
            percentage: Math.round((completed / total) * 100),
            errors,
            current: env.name,
            status: 'error'
          });
        }

        return { [env.id]: errorResult };
      }
    });

    // 等待当前批次完成
    const chunkResults = await Promise.all(promises);
    chunkResults.forEach(result => Object.assign(results, result));

    // 批次间短暂延迟，避免过载
    if (chunkIndex < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // 最终进度报告
  if (onProgress) {
    onProgress({
      completed,
      total,
      percentage: 100,
      errors,
      status: 'completed'
    });
  }

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
