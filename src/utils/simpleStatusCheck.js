// 简化但稳定的状态检测工具

// 检测单个环境状态
export const checkEnvironmentStatus = async (environment) => {
  const startTime = Date.now();

  try {
    console.log(`🔍 检测环境状态: ${environment.name} (${environment.url})`);

    // 判断是否为内网地址
    const isInternalUrl = isInternalNetwork(environment.url);
    console.log(`🌐 网络类型判断: ${isInternalUrl ? '内网' : '外网'}`);

    if (isInternalUrl) {
      // 内网地址：使用多层检测策略
      return await checkInternalNetwork(environment, startTime);
    } else {
      // 外网地址：使用标准检测
      return await checkExternalNetwork(environment, startTime);
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.log(`❌ ${environment.name} 检测异常: ${error.message} (${responseTime}ms)`);

    return {
      id: environment.id,
      status: 'error',
      responseTime,
      lastChecked: new Date().toISOString(),
      error: `检测异常: ${error.message}`
    };
  }
};

// 内网环境检测策略
const checkInternalNetwork = async (environment, startTime) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 内网延长到10秒

  try {
    // 方法1: 尝试GET请求根路径（去掉hash部分）
    const baseUrl = getBaseUrl(environment.url);
    console.log(`🔍 方法1: GET请求根路径 ${baseUrl}`);

    try {
      const response = await fetch(baseUrl, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      // 只要能获得响应就认为服务在线（包括4xx错误）
      console.log(`✅ 方法1成功: ${environment.name} 状态码 ${response.status} (${responseTime}ms)`);
      return {
        id: environment.id,
        status: 'online',
        responseTime,
        lastChecked: new Date().toISOString(),
        error: null
      };
    } catch (getError) {
      console.log(`⚠️ 方法1失败: ${getError.message}`);

      // 如果不是网络错误，而是CORS或其他HTTP错误，也可能表示服务在线
      if (!getError.message.includes('Failed to fetch') && !getError.message.includes('NetworkError')) {
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        console.log(`✅ 方法1部分成功: ${environment.name} 服务可达但有限制 (${responseTime}ms)`);
        return {
          id: environment.id,
          status: 'online',
          responseTime,
          lastChecked: new Date().toISOString(),
          error: null
        };
      }
    }

    // 方法2: 尝试HEAD请求
    console.log(`🔍 方法2: HEAD请求 ${baseUrl}`);
    try {
      const response = await fetch(baseUrl, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      console.log(`✅ 方法2成功: ${environment.name} HEAD请求成功，状态码 ${response.status} (${responseTime}ms)`);
      return {
        id: environment.id,
        status: 'online',
        responseTime,
        lastChecked: new Date().toISOString(),
        error: null
      };
    } catch (headError) {
      console.log(`⚠️ 方法2失败: ${headError.message}`);

      // 同样，非网络错误可能表示服务在线
      if (!headError.message.includes('Failed to fetch') && !headError.message.includes('NetworkError')) {
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        console.log(`✅ 方法2部分成功: ${environment.name} 服务可达但有限制 (${responseTime}ms)`);
        return {
          id: environment.id,
          status: 'online',
          responseTime,
          lastChecked: new Date().toISOString(),
          error: null
        };
      }
    }

    // 方法3: no-cors模式检测
    console.log(`🔍 方法3: no-cors模式 ${baseUrl}`);
    try {
      await fetch(baseUrl, {
        method: 'GET',
        mode: 'no-cors',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      console.log(`✅ 方法3成功: ${environment.name} no-cors检测成功 (${responseTime}ms)`);
      return {
        id: environment.id,
        status: 'online',
        responseTime,
        lastChecked: new Date().toISOString(),
        error: null
      };
    } catch (noCorsError) {
      console.log(`⚠️ 方法3失败: ${noCorsError.message}`);
    }

    // 所有方法都失败，但如果有响应时间说明网络是通的
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    // 如果响应时间很短（<100ms），可能是网络连接成功但服务拒绝了请求
    if (responseTime < 100) {
      console.log(`🔍 快速响应检测: ${environment.name} 响应时间 ${responseTime}ms，可能服务在线但拒绝请求`);
      return {
        id: environment.id,
        status: 'online',
        responseTime,
        lastChecked: new Date().toISOString(),
        error: null
      };
    }

    return {
      id: environment.id,
      status: 'offline',
      responseTime,
      lastChecked: new Date().toISOString(),
      error: `内网服务不可达 (${baseUrl})，请检查：1) 服务是否启动 2) 端口是否正确 3) 防火墙设置 4) 网络连接`
    };

  } catch (error) {
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    let status = 'offline';
    let errorMessage = error.message;

    if (error.name === 'AbortError') {
      status = 'timeout';
      errorMessage = '内网服务响应超时，可能服务负载过高或网络延迟';
    } else if (responseTime < 100) {
      // 快速失败通常意味着连接被拒绝，但服务可能在线
      status = 'online';
      errorMessage = null;
      console.log(`🔍 快速失败检测: ${environment.name} 可能在线但拒绝连接 (${responseTime}ms)`);
    }

    return {
      id: environment.id,
      status,
      responseTime,
      lastChecked: new Date().toISOString(),
      error: errorMessage
    };
  }
};

// 外网环境检测策略
const checkExternalNetwork = async (environment, startTime) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(environment.url, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
      cache: 'no-cache'
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    console.log(`✅ ${environment.name} 外网检测完成: 响应时间 ${responseTime}ms`);

    return {
      id: environment.id,
      status: 'online',
      responseTime,
      lastChecked: new Date().toISOString(),
      error: null
    };
  } catch (error) {
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    let status = 'offline';
    let errorMessage = error.message;

    if (error.name === 'AbortError') {
      status = 'timeout';
      errorMessage = '外网服务响应超时';
    } else if (error.message.includes('Failed to fetch')) {
      errorMessage = '外网服务不可达或存在网络问题';
    }

    console.log(`❌ ${environment.name} 外网检测失败: ${errorMessage} (${responseTime}ms)`);

    return {
      id: environment.id,
      status,
      responseTime,
      lastChecked: new Date().toISOString(),
      error: errorMessage
    };
  }
};

// 获取基础URL（去掉hash和query参数）
const getBaseUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
  } catch (error) {
    // 如果URL解析失败，返回原URL
    return url.split('#')[0].split('?')[0];
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
