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
  concurrency: 4,          // 并发数
  methods: ['HEAD', 'GET'], // 简化的检测方法
  retryCount: 1,           // 重试次数
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
    return { reachable: true };

  } catch (error) {
    clearTimeout(timeoutId);
    return { reachable: false };
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
    const reachabilityResult = await checkNetworkReachability(environment.url);

    const result = {
      id: environment.id,
      status: reachabilityResult.reachable ? 'available' : 'unreachable',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: null,
      method: 'no-cors',
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
    const promises = chunk.map(async (env) => {
      const result = await checkEnvironmentStatus(env);
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
