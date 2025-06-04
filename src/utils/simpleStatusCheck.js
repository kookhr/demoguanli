// 简化但稳定的状态检测工具

// 检测单个环境状态
export const checkEnvironmentStatus = async (environment) => {
  const startTime = Date.now();
  
  try {
    console.log(`🔍 检测环境状态: ${environment.name} (${environment.url})`);
    
    // 使用 AbortController 设置超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒超时

    const response = await fetch(environment.url, {
      method: 'HEAD', // 使用 HEAD 请求减少数据传输
      mode: 'no-cors', // 避免 CORS 问题
      signal: controller.signal,
      cache: 'no-cache'
    });

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
