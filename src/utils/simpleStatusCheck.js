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
      console.log(`📋 发送GET请求到: ${baseUrl}`);
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

      // 详细记录响应信息
      console.log(`📊 GET响应详情:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        type: response.type,
        url: response.url,
        redirected: response.redirected,
        responseTime: responseTime
      });

      // 记录响应头
      const headers = {};
      for (let [key, value] of response.headers.entries()) {
        headers[key] = value;
      }
      console.log(`📋 响应头:`, headers);

      // 严格检查状态码
      if (response.ok) {
        console.log(`✅ 方法1成功: ${environment.name} 状态码 ${response.status} (${responseTime}ms)`);
        return {
          id: environment.id,
          status: 'online',
          responseTime,
          lastChecked: new Date().toISOString(),
          error: null
        };
      } else {
        console.log(`⚠️ 方法1状态码不符合: ${response.status} ${response.statusText}`);
      }
    } catch (getError) {
      console.log(`❌ 方法1异常:`, {
        name: getError.name,
        message: getError.message,
        stack: getError.stack?.split('\n')[0]
      });
    }

    // 方法2: 尝试HEAD请求
    console.log(`🔍 方法2: HEAD请求 ${baseUrl}`);
    try {
      console.log(`📋 发送HEAD请求到: ${baseUrl}`);
      const response = await fetch(baseUrl, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      // 详细记录HEAD响应信息
      console.log(`📊 HEAD响应详情:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        type: response.type,
        url: response.url,
        redirected: response.redirected,
        responseTime: responseTime
      });

      if (response.ok) {
        console.log(`✅ 方法2成功: ${environment.name} HEAD状态码 ${response.status} (${responseTime}ms)`);
        return {
          id: environment.id,
          status: 'online',
          responseTime,
          lastChecked: new Date().toISOString(),
          error: null
        };
      } else {
        console.log(`⚠️ 方法2状态码不符合: ${response.status} ${response.statusText}`);
      }
    } catch (headError) {
      console.log(`❌ 方法2异常:`, {
        name: headError.name,
        message: headError.message,
        stack: headError.stack?.split('\n')[0]
      });
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

    // 方法4: Mixed Content 检测（使用Image对象绕过HTTPS限制）
    console.log(`🔍 方法4: Mixed Content绕过检测 ${baseUrl}`);
    try {
      await checkWithImagePing(baseUrl);
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      console.log(`✅ 方法4成功: ${environment.name} Image ping检测成功 (${responseTime}ms)`);
      return {
        id: environment.id,
        status: 'online',
        responseTime,
        lastChecked: new Date().toISOString(),
        error: null
      };
    } catch (imageError) {
      console.log(`⚠️ 方法4失败: ${imageError.message}`);
    }

    // 所有方法都失败，检查是否是Mixed Content问题
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    // 检查是否是Mixed Content问题
    const isMixedContentIssue = window.location.protocol === 'https:' && baseUrl.startsWith('http:');

    if (isMixedContentIssue) {
      return {
        id: environment.id,
        status: 'blocked',
        responseTime,
        lastChecked: new Date().toISOString(),
        error: `Mixed Content阻止: HTTPS页面无法访问HTTP服务 (${baseUrl})。解决方案：1) 在浏览器中允许不安全内容 2) 使用HTTPS访问服务 3) 使用HTTP访问本页面`
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
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 外网延长到10秒

  try {
    // 方法1: 尝试正常的GET请求（获取真实状态码）
    console.log(`🔍 外网方法1: GET请求 ${environment.url}`);
    try {
      const response = await fetch(environment.url, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache',
        credentials: 'omit'
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      // 检查状态码
      if (response.ok || response.status === 401 || response.status === 403) {
        // 200, 401, 403 都表示服务可达
        console.log(`✅ 外网方法1成功: ${environment.name} 状态码 ${response.status} (${responseTime}ms)`);
        return {
          id: environment.id,
          status: 'online',
          responseTime,
          lastChecked: new Date().toISOString(),
          error: null
        };
      } else {
        console.log(`⚠️ 外网方法1状态码异常: ${response.status} ${response.statusText}`);
      }
    } catch (getError) {
      console.log(`❌ 外网方法1失败: ${getError.message}`);

      // 如果不是CORS错误，直接抛出
      if (!getError.message.includes('CORS') && !getError.message.includes('Failed to fetch')) {
        throw getError;
      }
    }

    // 方法2: 尝试HEAD请求
    console.log(`🔍 外网方法2: HEAD请求 ${environment.url}`);
    try {
      const response = await fetch(environment.url, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
        credentials: 'omit'
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (response.ok || response.status === 401 || response.status === 403) {
        console.log(`✅ 外网方法2成功: ${environment.name} 状态码 ${response.status} (${responseTime}ms)`);
        return {
          id: environment.id,
          status: 'online',
          responseTime,
          lastChecked: new Date().toISOString(),
          error: null
        };
      }
    } catch (headError) {
      console.log(`❌ 外网方法2失败: ${headError.message}`);
    }

    // 方法3: no-cors模式检测（作为最后的备用方案）
    console.log(`🔍 外网方法3: no-cors模式 ${environment.url}`);
    try {
      await fetch(environment.url, {
        method: 'GET',
        mode: 'no-cors',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      console.log(`✅ 外网方法3成功: ${environment.name} no-cors检测成功 (${responseTime}ms)`);
      return {
        id: environment.id,
        status: 'online',
        responseTime,
        lastChecked: new Date().toISOString(),
        error: null
      };
    } catch (noCorsError) {
      console.log(`❌ 外网方法3失败: ${noCorsError.message}`);
    }

    // 方法4: 尝试图片ping检测
    console.log(`🔍 外网方法4: 图片ping检测`);
    try {
      const baseUrl = getBaseUrl(environment.url);
      await checkWithImagePing(baseUrl);

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      console.log(`✅ 外网方法4成功: ${environment.name} 图片ping检测成功 (${responseTime}ms)`);
      return {
        id: environment.id,
        status: 'online',
        responseTime,
        lastChecked: new Date().toISOString(),
        error: null
      };
    } catch (imageError) {
      console.log(`❌ 外网方法4失败: ${imageError.message}`);
    }

    // 所有方法都失败
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    return {
      id: environment.id,
      status: 'offline',
      responseTime,
      lastChecked: new Date().toISOString(),
      error: `外网服务不可达，请检查：1) 服务是否正常运行 2) 网络连接是否正常 3) 防火墙或代理设置`
    };

  } catch (error) {
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    let status = 'offline';
    let errorMessage = error.message;

    if (error.name === 'AbortError') {
      status = 'timeout';
      errorMessage = '外网服务响应超时，请检查网络连接或服务负载';
    } else if (error.message.includes('Failed to fetch')) {
      errorMessage = '网络连接失败，请检查网络设置或服务状态';
    } else if (error.message.includes('CORS')) {
      errorMessage = 'CORS策略阻止，但服务可能正常运行';
      status = 'blocked';
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

// 使用Image对象进行Mixed Content绕过检测
const checkWithImagePing = (baseUrl) => {
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
    try {
      const testUrl = new URL(baseUrl);
      img.src = `${testUrl.origin}/favicon.ico?_t=${Date.now()}`;
    } catch (error) {
      reject(error);
    }
  });
};

// 判断是否为内网地址
const isInternalNetwork = (url) => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // 检测常见的内网IP段和域名
    const internalPatterns = [
      /^192\.168\./,           // 192.168.x.x
      /^10\./,                 // 10.x.x.x
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.x.x - 172.31.x.x
      /^localhost$/,           // localhost
      /^127\./,                // 127.x.x.x
      /^169\.254\./,           // 169.254.x.x (链路本地地址)
      /\.local$/,              // .local域名
      /\.internal$/,           // .internal域名
      /^0\.0\.0\.0$/,          // 0.0.0.0
      /^::1$/,                 // IPv6 localhost
      /^fe80:/,                // IPv6 链路本地地址
      /^fc00:/,                // IPv6 唯一本地地址
      /^fd00:/                 // IPv6 唯一本地地址
    ];

    const isInternal = internalPatterns.some(pattern => pattern.test(hostname));

    // 额外检查：如果是IP地址，确保不是公网IP
    if (!isInternal && /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      const parts = hostname.split('.').map(Number);

      // 检查是否为保留IP段
      if (parts[0] === 0 ||                           // 0.x.x.x
          parts[0] === 127 ||                         // 127.x.x.x
          (parts[0] === 169 && parts[1] === 254) ||   // 169.254.x.x
          (parts[0] === 192 && parts[1] === 168) ||   // 192.168.x.x
          parts[0] === 10 ||                          // 10.x.x.x
          (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)) { // 172.16-31.x.x
        return true;
      }
    }

    console.log(`🌐 网络类型判断: ${hostname} -> ${isInternal ? '内网' : '外网'}`);
    return isInternal;
  } catch (error) {
    console.warn('网络类型判断失败:', error);
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
    'blocked': '被阻止',
    'unknown': '未知',
    'checking': '检测中'
  };
  return statusMap[status] || status;
};

// 获取状态颜色类
export const getStatusColor = (status) => {
  const colorMap = {
    'online': 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20',
    'offline': 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20',
    'timeout': 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20',
    'error': 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20',
    'network_error': 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20',
    'blocked': 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20',
    'unknown': 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700',
    'checking': 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20'
  };
  return colorMap[status] || 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700';
};

// 获取状态图标
export const getStatusIcon = (status) => {
  const iconMap = {
    'online': '🟢',
    'offline': '🔴',
    'timeout': '🟡',
    'error': '❌',
    'network_error': '🟠',
    'blocked': '🟣',
    'unknown': '⚪',
    'checking': '🔵'
  };
  return iconMap[status] || '⚪';
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
