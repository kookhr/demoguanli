// 增强的CORS绕过检测工具
// 简化版 - 3策略检测，专注核心功能
//
// 包含的检测策略：
// 1. 标准CORS请求（HEAD, GET, OPTIONS）
// 2. 增强静态资源探测（favicon.ico等）
// 3. 智能连通性检测（no-cors模式）
//
// 已移除的策略（不适用于当前部署环境）：
// - 健康检查端点探测（/health, /ping等）
// - WebSocket探测
// - JSONP探测

// 检测配置
const ENHANCED_CHECK_CONFIG = {
  // 超时配置
  timeout: 12000,
  quickTimeout: 5000,
  imageTimeout: 3000,

  // 重试配置
  retry: {
    maxAttempts: 2,
    delay: 1000
  },

  // 请求方法优先级
  methods: ['HEAD', 'GET', 'OPTIONS'],

  // 状态码分类
  statusCategories: {
    success: [200, 201, 202, 203, 204, 205, 206],
    redirect: [300, 301, 302, 303, 304, 307, 308],
    clientError: [400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 421, 422, 423, 424, 425, 426, 428, 429, 431, 451],
    serverError: [500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511]
  },

  // 常见静态资源路径
  staticPaths: [
    '/favicon.ico',
    '/favicon.png',
    '/apple-touch-icon.png',
    '/robots.txt',
    '/sitemap.xml',
    '/manifest.json',
    '/.well-known/security.txt'
  ],

  // 混合内容检测配置
  mixedContent: {
    // 是否严格检查混合内容（false = 尝试检测，true = 直接标记为限制）
    strictMode: true,
    // 允许的本地主机名
    allowedLocalHosts: ['localhost', '127.0.0.1', '::1'],
    // 是否允许内网IP（如果为false，内网IP也会被标记为混合内容）
    allowPrivateNetworks: false
  }
};

// 获取检测配置
const getCheckConfig = () => {
  try {
    const stored = localStorage.getItem('enhanced-check-config');
    if (stored) {
      return { ...ENHANCED_CHECK_CONFIG, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.warn('Failed to load check config:', error);
  }
  return ENHANCED_CHECK_CONFIG;
};

// 保存检测配置
export const saveCheckConfig = (config) => {
  try {
    localStorage.setItem('enhanced-check-config', JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Failed to save check config:', error);
    return false;
  }
};

// 统一的混合内容检测函数
const checkMixedContent = (url) => {
  // 如果当前页面不是HTTPS，则不存在混合内容问题
  if (window.location.protocol !== 'https:') {
    return false;
  }

  // 如果目标URL不是HTTP，则不存在混合内容问题
  if (!url.startsWith('http:')) {
    return false;
  }

  const config = getCheckConfig();
  const mixedContentConfig = config.mixedContent;

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // 检查是否在允许的本地主机列表中
    if (mixedContentConfig.allowedLocalHosts.includes(hostname)) {
      return false;
    }

    // 检查是否是内网IP地址
    const isPrivateNetwork = hostname.match(/^192\.168\.\d+\.\d+$/) ||
                            hostname.match(/^10\.\d+\.\d+\.\d+$/) ||
                            hostname.match(/^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/);

    if (isPrivateNetwork) {
      // 根据配置决定是否允许内网IP
      return !mixedContentConfig.allowPrivateNetworks;
    }

    // 其他HTTP URL在HTTPS页面中会被阻止
    return true;
  } catch (error) {
    // URL解析失败，保守起见认为是混合内容
    return true;
  }
};

// 分类HTTP状态码
const categorizeStatus = (statusCode) => {
  const config = getCheckConfig();

  if (config.statusCategories.success.includes(statusCode)) {
    return 'online';
  } else if (config.statusCategories.redirect.includes(statusCode)) {
    return 'online'; // 重定向也算正常
  } else if (config.statusCategories.clientError.includes(statusCode)) {
    return 'client-error';
  } else if (config.statusCategories.serverError.includes(statusCode)) {
    return 'server-error';
  } else {
    return 'unknown-status';
  }
};

// 主要检测函数 - 简化版（移除健康检查、WebSocket、JSONP策略）
export const checkEnvironmentStatusWithProxy = async (environment) => {
  const startTime = Date.now();

  try {
    // 预先检查是否是混合内容问题
    const isMixedContent = checkMixedContent(environment.url);

    if (isMixedContent) {
      // 对于混合内容，直接返回相应状态，不尝试任何网络请求
      const responseTime = Date.now() - startTime;
      return {
        id: environment.id,
        status: 'mixed-content',
        responseTime,
        lastChecked: new Date().toISOString(),
        error: '混合内容限制：HTTPS页面无法访问HTTP资源',
        method: 'mixed-content-blocked',
        statusCode: null
      };
    }

    // 策略1: 标准CORS请求（优先策略 - 获取真实状态码）
    const corsResult = await tryStandardRequest(environment, startTime);
    if (corsResult) {
      // 如果是真正的网络错误（offline）或超时，直接返回
      if (corsResult.status === 'offline' || corsResult.status === 'timeout') {
        return corsResult;
      }
      // 如果是成功的结果，也直接返回
      if (corsResult.status === 'online' || corsResult.status === 'client-error' || corsResult.status === 'server-error') {
        return corsResult;
      }
    }

    // 策略2: 增强静态资源探测（多种静态资源）
    const staticResult = await tryEnhancedStaticProbe(environment, startTime);
    if (staticResult) {
      return staticResult;
    }

    // 策略3: 智能连通性检测（最后备用）
    const connectivityResult = await trySmartConnectivityCheck(environment, startTime);
    if (connectivityResult) {
      return connectivityResult;
    }

    // 所有策略都失败
    const responseTime = Date.now() - startTime;
    return {
      id: environment.id,
      status: 'offline',
      responseTime,
      lastChecked: new Date().toISOString(),
      error: '所有检测策略均失败，服务可能不可达',
      method: 'all-strategies-failed'
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;

    return {
      id: environment.id,
      status: 'error',
      responseTime,
      lastChecked: new Date().toISOString(),
      error: `检测异常: ${error.message}`,
      method: 'exception'
    };
  }
};

// 策略1: 标准CORS请求（优先策略）
const tryStandardRequest = async (environment, startTime) => {
  const config = getCheckConfig();

  // 检查是否是混合内容问题（HTTPS页面访问HTTP资源）
  const isMixedContent = checkMixedContent(environment.url);

  if (isMixedContent) {
    // 对于混合内容，浏览器会阻止请求，直接跳过标准请求
    console.log(`跳过混合内容检测: ${environment.url} (HTTPS页面无法访问HTTP资源)`);
    return null;
  }

  for (const method of config.methods) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      const response = await fetch(environment.url, {
        method: method,
        signal: controller.signal,
        cache: 'no-cache',
        credentials: 'omit',
        headers: {
          'Accept': '*/*',
          'User-Agent': 'Environment-Monitor/1.0'
        }
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      const statusCode = response.status;
      const statusCategory = categorizeStatus(statusCode);

      return {
        id: environment.id,
        status: statusCategory,
        responseTime,
        lastChecked: new Date().toISOString(),
        error: statusCategory !== 'online' ? `HTTP ${statusCode}: ${response.statusText}` : null,
        method: `standard-${method.toLowerCase()}`,
        statusCode: statusCode,
        statusText: response.statusText
      };

    } catch (error) {
      // 如果是超时错误，直接返回
      if (error.name === 'AbortError') {
        const responseTime = Date.now() - startTime;
        return {
          id: environment.id,
          status: 'timeout',
          responseTime,
          lastChecked: new Date().toISOString(),
          error: '请求超时',
          method: `standard-${method.toLowerCase()}-timeout`
        };
      }

      // 对于TypeError，需要更仔细地判断是否真的是网络错误
      if (error.name === 'TypeError') {
        // 检查错误消息中的关键词来判断是否是CORS错误
        // 常见的CORS相关错误消息模式
        const corsErrorPatterns = [
          'CORS',
          'cross-origin',
          'Access-Control',
          'Failed to fetch',
          'Load failed',           // Safari和其他浏览器的CORS错误
          'Network request failed', // 另一种常见模式
          'blocked by CORS policy',
          'No \'Access-Control-Allow-Origin\'',
          'has been blocked by CORS policy'
        ];

        const isCorsError = corsErrorPatterns.some(pattern =>
          error.message.toLowerCase().includes(pattern.toLowerCase())
        );

        // 对于跨域请求，大多数"Load failed"都是CORS错误
        const isLikelyCorsError = isCorsError || (
          error.message.includes('Load failed') &&
          (environment.url.startsWith('https://') || environment.url.startsWith('http://')) &&
          !environment.url.includes('localhost') &&
          !environment.url.includes('127.0.0.1')
        );

        if (!isLikelyCorsError) {
          // 真正的网络错误（如DNS解析失败、连接拒绝等）
          const responseTime = Date.now() - startTime;
          return {
            id: environment.id,
            status: 'offline',
            responseTime,
            lastChecked: new Date().toISOString(),
            error: '网络连接失败',
            method: `standard-${method.toLowerCase()}-network-error`
          };
        }
      }

      // CORS错误，继续尝试下一个方法
      continue;
    }
  }

  return null;
};

// 策略2: 增强静态资源探测
const tryEnhancedStaticProbe = async (environment, startTime) => {
  const config = getCheckConfig();
  const baseUrl = getBaseUrl(environment.url);

  // 注意：混合内容检查已在主函数中处理，这里不应该到达混合内容的情况

  // 尝试多种静态资源
  for (const staticPath of config.staticPaths) {
    try {
      const staticUrl = `${baseUrl}${staticPath}?_t=${Date.now()}`;
      const result = await checkImageLoad(staticUrl, config.imageTimeout);

      if (result.success) {
        const responseTime = Date.now() - startTime;

        return {
          id: environment.id,
          status: result.type === 'loaded' ? 'image-reachable' : 'reachable-unverified',
          responseTime,
          lastChecked: new Date().toISOString(),
          error: result.type === 'loaded' ? null : '静态资源可达但状态未知',
          method: 'enhanced-static-probe',
          statusCode: result.type === 'loaded' ? 200 : null,
          resource: staticPath
        };
      }
    } catch (error) {
      continue;
    }
  }

  return null;
};

// 策略3: 智能连通性检测（最后备用）
const trySmartConnectivityCheck = async (environment, startTime) => {
  // 注意：混合内容检查已在主函数中处理，这里不应该到达混合内容的情况

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    // 使用 no-cors 模式进行基本连通性检测
    await fetch(environment.url, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal,
      cache: 'no-cache',
      credentials: 'omit'
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    // 对于 no-cors 请求，我们需要更保守的判断
    // 只有在响应时间合理的情况下才认为服务可达
    if (responseTime < 5000) {
      return {
        id: environment.id,
        status: 'cors-bypassed',
        responseTime,
        lastChecked: new Date().toISOString(),
        error: 'CORS限制但服务可达',
        method: 'smart-connectivity',
        statusCode: null
      };
    } else {
      return null;
    }

  } catch (error) {
    if (error.name === 'AbortError') {
      const responseTime = Date.now() - startTime;
      return {
        id: environment.id,
        status: 'timeout',
        responseTime,
        lastChecked: new Date().toISOString(),
        error: '连接超时',
        method: 'smart-connectivity-timeout'
      };
    }

    // 对于 TypeError，通常表示网络错误（DNS解析失败等）
    if (error.name === 'TypeError') {
      const responseTime = Date.now() - startTime;
      return {
        id: environment.id,
        status: 'offline',
        responseTime,
        lastChecked: new Date().toISOString(),
        error: '网络连接失败，服务不可达',
        method: 'smart-connectivity-network-error'
      };
    }

    return null;
  }
};

// 旧的连通性检测（保留兼容性）
const tryConnectivityCheck = async (environment, startTime) => {
  try {

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // 使用 no-cors 模式进行基本连通性检测
    await fetch(environment.url, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal,
      cache: 'no-cache',
      credentials: 'omit'
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    return {
      id: environment.id,
      status: 'cors-blocked',
      responseTime,
      lastChecked: new Date().toISOString(),
      error: 'CORS限制阻止获取状态码，服务可能正常但无法确认',
      method: 'connectivity-check',
      statusCode: null
    };

  } catch (error) {

    if (error.name === 'AbortError') {
      const responseTime = Date.now() - startTime;
      return {
        id: environment.id,
        status: 'timeout',
        responseTime,
        lastChecked: new Date().toISOString(),
        error: '连接超时',
        method: 'connectivity-timeout'
      };
    }

    return null;
  }
};

// 获取基础 URL（去掉路径、查询参数和锚点）
const getBaseUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}`;
  } catch (error) {
    // 如果 URL 解析失败，尝试简单处理
    return url.split('/').slice(0, 3).join('/');
  }
};

// 图片加载检测 - 增强版
const checkImageLoad = (imageUrl, timeout) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timeoutId = setTimeout(() => {
      clearTimeout(timeoutId);
      resolve({ success: false, error: 'Image load timeout' });
    }, timeout);

    img.onload = () => {
      clearTimeout(timeoutId);
      // 图片成功加载，说明服务器返回了200状态
      resolve({ success: true, type: 'loaded' });
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      // 图片加载失败，保守地认为加载失败
      resolve({ success: false, error: 'Image load failed' });
    };

    // 设置图片源，开始加载
    img.src = imageUrl;
  });
};

// 批量检测 - 精确版
export const checkMultipleEnvironmentsWithProxy = async (environments, onProgress) => {

  const results = {};
  const total = environments.length;
  let completed = 0;

  // 限制并发数量为 3，平衡速度和准确性
  const concurrency = 3;
  const chunks = [];

  for (let i = 0; i < environments.length; i += concurrency) {
    chunks.push(environments.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async (env) => {
      try {
        const result = await checkEnvironmentStatusWithProxy(env);
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
          error: error.message,
          method: 'exception'
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

  return results;
};

// 导出配置
export { ENHANCED_CHECK_CONFIG as DEFAULT_CHECK_CONFIG };
