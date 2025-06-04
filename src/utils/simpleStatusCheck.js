// 简化但稳定的状态检测工具

// 检测单个环境状态
export const checkEnvironmentStatus = async (environment) => {
  const startTime = Date.now();

  try {
    console.log(`🔍 检测环境状态: ${environment.name} (${environment.url})`);

    // 判断是否为内网地址
    const isInternalUrl = isInternalNetwork(environment.url);

    // 使用 AbortController 设置超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒超时

    let response;

    if (isInternalUrl) {
      // 内网地址：先尝试正常请求，失败后再用 no-cors
      try {
        response = await fetch(environment.url, {
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-cache'
        });
      } catch (corsError) {
        // 如果正常请求失败，尝试 no-cors 模式
        response = await fetch(environment.url, {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal,
          cache: 'no-cache'
        });
      }
    } else {
      // 外网地址：直接使用 no-cors 模式
      response = await fetch(environment.url, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
        cache: 'no-cache'
      });
    }

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    console.log(`✅ ${environment.name} 检测完成: 响应时间 ${responseTime}ms`);

    return {
      id: environment.id,
      status: 'online',
      responseTime,
      lastChecked: new Date().toISOString(),
      error: null
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    let status = 'offline';
    let errorMessage = error.message;

    if (error.name === 'AbortError') {
      status = 'timeout';
      errorMessage = '请求超时';
    } else if (error.message.includes('network')) {
      status = 'network_error';
      errorMessage = '网络错误';
    } else if (error.message.includes('Failed to fetch')) {
      // 对于 Failed to fetch 错误，尝试更详细的判断
      if (isInternalNetwork(environment.url)) {
        errorMessage = '内网服务不可达，请检查服务是否启动或网络连接';
      } else {
        errorMessage = '外网服务不可达或存在网络问题';
      }
    }

    console.log(`❌ ${environment.name} 检测失败: ${errorMessage} (${responseTime}ms)`);

    return {
      id: environment.id,
      status,
      responseTime,
      lastChecked: new Date().toISOString(),
      error: errorMessage
    };
  }
};

// 判断是否为内网地址
const isInternalNetwork = (url) => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // 检测常见的内网IP段和域名
    const internalPatterns = [
      /^192\.168\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^localhost$/,
      /^127\./,
      /\.local$/,
      /\.internal$/,
      /^0\.0\.0\.0$/
    ];

    return internalPatterns.some(pattern => pattern.test(hostname));
  } catch (error) {
    return false;
  }
};

// 批量检测环境状态
export const checkMultipleEnvironments = async (environments, onProgress) => {
  console.log(`🚀 开始批量检测 ${environments.length} 个环境`);
  
  const results = {};
  const total = environments.length;
  let completed = 0;

  // 限制并发数量避免过载
  const concurrency = 3;
  const chunks = [];
  
  for (let i = 0; i < environments.length; i += concurrency) {
    chunks.push(environments.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async (env) => {
      try {
        const result = await checkEnvironmentStatus(env);
        results[env.id] = result;
        completed++;
        
        if (onProgress) {
          onProgress({
            completed,
            total,
            percentage: Math.round((completed / total) * 100),
            current: env.name
          });
        }
        
        return result;
      } catch (error) {
        console.error(`检测环境 ${env.name} 时发生错误:`, error);
        const errorResult = {
          id: env.id,
          status: 'error',
          responseTime: 0,
          lastChecked: new Date().toISOString(),
          error: error.message
        };
        results[env.id] = errorResult;
        completed++;
        
        if (onProgress) {
          onProgress({
            completed,
            total,
            percentage: Math.round((completed / total) * 100),
            current: env.name
          });
        }
        
        return errorResult;
      }
    });

    await Promise.all(promises);
  }

  console.log(`✅ 批量检测完成，共检测 ${total} 个环境`);
  return results;
};

// 获取状态显示文本
export const getStatusText = (status) => {
  const statusMap = {
    'online': '在线',
    'offline': '离线',
    'timeout': '超时',
    'error': '错误',
    'network_error': '网络错误',
    'unknown': '未知'
  };
  return statusMap[status] || status;
};

// 获取状态颜色类
export const getStatusColor = (status) => {
  const colorMap = {
    'online': 'text-green-600 bg-green-100',
    'offline': 'text-red-600 bg-red-100',
    'timeout': 'text-yellow-600 bg-yellow-100',
    'error': 'text-red-600 bg-red-100',
    'network_error': 'text-orange-600 bg-orange-100',
    'unknown': 'text-gray-600 bg-gray-100'
  };
  return colorMap[status] || 'text-gray-600 bg-gray-100';
};

// 格式化响应时间
export const formatResponseTime = (responseTime) => {
  if (!responseTime) return '-';
  if (responseTime < 1000) return `${responseTime}ms`;
  return `${(responseTime / 1000).toFixed(1)}s`;
};

// 格式化最后检测时间
export const formatLastChecked = (lastChecked) => {
  if (!lastChecked) return '未检测';
  
  const date = new Date(lastChecked);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
