// 精确的HTTP状态检测工具
// 优先获取真实HTTP状态码，确保检测准确性

// 检测配置
const ACCURATE_CHECK_CONFIG = {
  // 超时配置
  timeout: 10000,

  // 重试配置
  retry: {
    maxAttempts: 1,
    delay: 1000
  },

  // 请求方法优先级
  methods: ['HEAD', 'GET'],

  // 状态码分类
  statusCategories: {
    success: [200, 201, 202, 203, 204, 205, 206],
    redirect: [300, 301, 302, 303, 304, 307, 308],
    clientError: [400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 421, 422, 423, 424, 425, 426, 428, 429, 431, 451],
    serverError: [500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511]
  }
};

// 获取检测配置
const getCheckConfig = () => {
  try {
    const stored = localStorage.getItem('accurate-check-config');
    if (stored) {
      return { ...ACCURATE_CHECK_CONFIG, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.warn('Failed to load check config:', error);
  }
  return ACCURATE_CHECK_CONFIG;
};

// 保存检测配置
export const saveCheckConfig = (config) => {
  try {
    localStorage.setItem('accurate-check-config', JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Failed to save check config:', error);
    return false;
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

// 主要检测函数 - 精确版
export const checkEnvironmentStatusWithProxy = async (environment) => {
  const startTime = Date.now();

  try {
    console.log(`🔍 精确检测开始: ${environment.name} (${environment.url})`);

    // 策略1: 标准CORS请求（优先策略 - 获取真实状态码）
    const corsResult = await tryStandardRequest(environment, startTime);
    if (corsResult) {
      return corsResult;
    }

    // 策略2: JSONP探测（某些API支持）
    const jsonpResult = await tryJSONPProbe(environment, startTime);
    if (jsonpResult) {
      return jsonpResult;
    }

    // 策略3: 图片探测（静态资源检测）
    const imageResult = await tryImageProbe(environment, startTime);
    if (imageResult) {
      return imageResult;
    }

    // 策略4: 连通性检测（最后备用）
    const connectivityResult = await tryConnectivityCheck(environment, startTime);
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
      error: '服务不可达或网络连接失败',
      method: 'all-failed'
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ 检测异常: ${environment.name}`, error);

    return {
      id: environment.id,
      status: 'error',
      responseTime,
      lastChecked: new Date().toISOString(),
      error: `检测异常: ${error.message}`,
      method: 'error'
    };
  }
};

// 策略1: 标准CORS请求（优先策略）
const tryStandardRequest = async (environment, startTime) => {
  const config = getCheckConfig();

  for (const method of config.methods) {
    try {
      console.log(`🔍 尝试标准${method}请求: ${environment.url}`);

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

      console.log(`✅ 标准${method}请求成功: ${environment.name} - ${statusCode} (${responseTime}ms)`);

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
      console.log(`❌ 标准${method}请求失败: ${error.message}`);

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

      // 如果是网络错误（非CORS），说明服务不可达
      if (error.name === 'TypeError' && !error.message.includes('CORS')) {
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

      // CORS错误，继续尝试下一个方法
      continue;
    }
  }

  return null;
};

// 策略2: JSONP探测（某些API支持）
const tryJSONPProbe = async (environment, startTime) => {
  try {
    console.log(`🔍 尝试JSONP探测: ${environment.url}`);

    // 检查URL是否可能支持JSONP
    const url = new URL(environment.url);
    if (!url.pathname.includes('api') && !url.searchParams.has('callback')) {
      return null; // 不太可能支持JSONP
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // 尝试添加callback参数
    const jsonpUrl = `${environment.url}${environment.url.includes('?') ? '&' : '?'}callback=test&_t=${Date.now()}`;

    const response = await fetch(jsonpUrl, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-cache',
      credentials: 'omit'
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    const statusCode = response.status;
    const statusCategory = categorizeStatus(statusCode);

    console.log(`✅ JSONP探测成功: ${environment.name} - ${statusCode} (${responseTime}ms)`);

    return {
      id: environment.id,
      status: statusCategory,
      responseTime,
      lastChecked: new Date().toISOString(),
      error: statusCategory !== 'online' ? `HTTP ${statusCode}: ${response.statusText}` : null,
      method: 'jsonp-probe',
      statusCode: statusCode,
      statusText: response.statusText
    };

  } catch (error) {
    console.log(`❌ JSONP探测失败: ${error.message}`);
    return null;
  }
};

// 策略3: 图片探测（静态资源检测）
const tryImageProbe = async (environment, startTime) => {
  try {
    console.log(`🔍 尝试图片探测: ${environment.url}`);

    const baseUrl = getBaseUrl(environment.url);
    const imagePaths = ['/favicon.ico', '/favicon.png', '/apple-touch-icon.png'];

    for (const imagePath of imagePaths) {
      try {
        const imageUrl = `${baseUrl}${imagePath}?_t=${Date.now()}`;
        const result = await checkImageLoad(imageUrl, 5000);

        if (result.success) {
          const responseTime = Date.now() - startTime;

          console.log(`✅ 图片探测成功: ${environment.name} via ${imagePath} (${responseTime}ms)`);

          // 图片探测成功，但无法获取确切状态码，标记为可达但需要验证
          return {
            id: environment.id,
            status: 'reachable-unverified',
            responseTime,
            lastChecked: new Date().toISOString(),
            error: '无法获取HTTP状态码，仅确认服务器响应',
            method: 'image-probe',
            statusCode: null
          };
        }
      } catch (error) {
        console.log(`⚠️ 图片路径 ${imagePath} 失败: ${error.message}`);
        continue;
      }
    }

    console.log(`❌ 所有图片路径都失败: ${environment.name}`);

  } catch (error) {
    console.log(`❌ 图片探测异常: ${error.message}`);
  }

  return null;
};

// 策略4: 连通性检测（最后备用）
const tryConnectivityCheck = async (environment, startTime) => {
  try {
    console.log(`🔍 尝试连通性检测: ${environment.url}`);

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

    console.log(`⚠️ 连通性检测成功: ${environment.name} (${responseTime}ms) - 但无法确认HTTP状态`);

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
    console.log(`❌ 连通性检测失败: ${error.message}`);

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
      reject(new Error('Image load timeout'));
    }, timeout);

    img.onload = () => {
      clearTimeout(timeoutId);
      // 图片成功加载，说明服务器返回了200状态
      resolve({ success: true, type: 'loaded' });
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      // 图片加载失败，但收到了响应（可能是404、403等）
      // 这仍然表示服务器是可达的
      resolve({ success: true, type: 'error-response' });
    };

    // 设置图片源，开始加载
    img.src = imageUrl;
  });
};

// 批量检测 - 精确版
export const checkMultipleEnvironmentsWithProxy = async (environments, onProgress) => {
  console.log(`🚀 开始精确批量检测 ${environments.length} 个环境`);

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

  console.log(`✅ 精确批量检测完成，共检测 ${total} 个环境`);
  return results;
};

// 导出配置
export { ACCURATE_CHECK_CONFIG as DEFAULT_CHECK_CONFIG };
