// 网络检测工具

// 状态缓存，避免频繁请求
const statusCache = new Map();
const CACHE_DURATION = 30000; // 30秒缓存

// 检测环境状态的多种方法
export const checkEnvironmentStatus = async (url, options = {}) => {
  const { useCache = true, timeout = 8000 } = options;

  // 检查缓存
  if (useCache) {
    const cached = statusCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.status;
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // 方法1: 尝试正常请求
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);

      const status = response.ok ? 'online' : 'error';

      // 缓存结果
      if (useCache) {
        statusCache.set(url, { status, timestamp: Date.now() });
      }

      return status;
    } catch (corsError) {
      // 如果是CORS错误，尝试其他方法
      if (corsError.name === 'TypeError' && corsError.message.includes('CORS')) {
        clearTimeout(timeoutId);
        return await checkWithAlternativeMethods(url, useCache);
      }
      throw corsError;
    }

  } catch (error) {
    let status;

    if (error.name === 'AbortError') {
      status = 'timeout';
    } else if (error.name === 'TypeError') {
      // 网络错误或CORS问题，尝试替代方法
      status = await checkWithAlternativeMethods(url, useCache);
    } else {
      status = 'offline';
    }

    // 缓存结果
    if (useCache) {
      statusCache.set(url, { status, timestamp: Date.now() });
    }

    return status;
  }
};

// 替代检测方法
const checkWithAlternativeMethods = async (url, useCache = true) => {
  try {
    // 方法2: 使用no-cors模式检测
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // no-cors模式下，如果没有抛出错误，通常表示服务可达
    const status = 'online';

    if (useCache) {
      statusCache.set(url, { status, timestamp: Date.now() });
    }

    return status;
  } catch (error) {
    // 方法3: 尝试创建Image对象检测（适用于支持图片的服务）
    try {
      const status = await checkWithImagePing(url);
      if (useCache) {
        statusCache.set(url, { status, timestamp: Date.now() });
      }
      return status;
    } catch (imgError) {
      return 'offline';
    }
  }
};

// 使用Image对象进行检测
const checkWithImagePing = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timeout = setTimeout(() => {
      reject(new Error('Image ping timeout'));
    }, 3000);

    img.onload = () => {
      clearTimeout(timeout);
      resolve('online');
    };

    img.onerror = () => {
      clearTimeout(timeout);
      // 即使图片加载失败，也可能表示服务器可达
      resolve('reachable');
    };

    // 尝试加载favicon或根路径
    const testUrl = new URL(url);
    img.src = `${testUrl.origin}/favicon.ico?_t=${Date.now()}`;
  });
};

// 检测是否在内网环境
export const isInternalNetwork = () => {
  // 简单的内网检测逻辑，可以根据实际情况调整
  const hostname = window.location.hostname;
  
  // 检测常见的内网IP段
  const internalPatterns = [
    /^192\.168\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^localhost$/,
    /^127\./,
    /\.local$/,
    /\.internal$/
  ];
  
  return internalPatterns.some(pattern => pattern.test(hostname));
};

// 获取网络类型标识
export const getNetworkType = () => {
  return isInternalNetwork() ? 'internal' : 'external';
};

// 批量检测环境状态
export const checkMultipleEnvironments = async (environments, options = {}) => {
  const {
    maxConcurrent = 3, // 最大并发数
    useCache = true,
    timeout = 8000,
    onProgress = null // 进度回调
  } = options;

  const results = {};
  const chunks = [];

  // 将环境分组，控制并发数
  for (let i = 0; i < environments.length; i += maxConcurrent) {
    chunks.push(environments.slice(i, i + maxConcurrent));
  }

  let completed = 0;

  for (const chunk of chunks) {
    const chunkPromises = chunk.map(async (env) => {
      try {
        const status = await checkEnvironmentStatus(env.url, { useCache, timeout });
        results[env.id] = status;
        completed++;

        // 调用进度回调
        if (onProgress) {
          onProgress({
            completed,
            total: environments.length,
            current: env,
            status
          });
        }

        return { id: env.id, status };
      } catch (error) {
        console.error(`检测环境 ${env.name} 失败:`, error);
        results[env.id] = 'error';
        completed++;

        if (onProgress) {
          onProgress({
            completed,
            total: environments.length,
            current: env,
            status: 'error',
            error
          });
        }

        return { id: env.id, status: 'error' };
      }
    });

    // 等待当前批次完成
    await Promise.allSettled(chunkPromises);
  }

  return results;
};

// 清除状态缓存
export const clearStatusCache = () => {
  statusCache.clear();
};

// 获取缓存状态
export const getCachedStatus = (url) => {
  const cached = statusCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.status;
  }
  return null;
};

// 预热检测（在后台检测所有环境）
export const preWarmEnvironments = async (environments) => {
  // 使用较长的超时时间进行后台检测
  return checkMultipleEnvironments(environments, {
    maxConcurrent: 2,
    timeout: 10000,
    useCache: true
  });
};

// 格式化最后部署时间
export const formatLastDeployed = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffDays > 0) {
    return `${diffDays}天前`;
  } else if (diffHours > 0) {
    return `${diffHours}小时前`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes}分钟前`;
  } else {
    return '刚刚';
  }
};
