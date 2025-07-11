/**
 * Cloudflare Workers 主入口文件
 * 环境管理系统 - 集成高级Workers特性
 */

// 获取缓存配置 - 从Dashboard环境变量读取，如果没有则使用默认值
function getCacheConfig(env) {
  return {
    STATIC_ASSETS: parseInt(env.CACHE_STATIC_ASSETS) || 86400,    // 静态资源缓存24小时
    API_RESPONSES: parseInt(env.CACHE_API_RESPONSES) || 600,      // API响应缓存10分钟
    HEALTH_CHECK: parseInt(env.CACHE_HEALTH_CHECK) || 300,        // 健康检查缓存5分钟
    KV_CACHE: parseInt(env.CACHE_KV_CACHE) || 1800               // KV数据缓存30分钟
  };
}

// 安全配置
const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,   // 最大登录尝试次数
  LOGIN_COOLDOWN: 900,     // 登录冷却时间15分钟
  JWT_EXPIRY: 86400       // JWT过期时间24小时
};

export default {
  async fetch(request, env, ctx) {
    try {
      // 添加安全头
      const response = await handleRequest(request, env, ctx);
      return addSecurityHeaders(response);
    } catch (error) {
      return errorResponse('Internal Server Error', 500);
    }
  }
};

// 主请求处理器
async function handleRequest(request, env, ctx) {
  const url = new URL(request.url);

  // API 路由处理
  if (url.pathname.startsWith('/api/')) {
    return await handleAPI(request, env, ctx);
  }

  // 静态资源处理（带缓存）
  return await handleStaticAssets(request, env, ctx);
}

// API 路由处理器
async function handleAPI(request, env, ctx) {
  const url = new URL(request.url);
  
  // CORS 处理
  if (request.method === 'OPTIONS') {
    return corsResponse();
  }

  // KV API 处理
  if (url.pathname.startsWith('/api/kv')) {
    return await handleKVAPI(request, env);
  }

  // 用户认证API
  if (url.pathname.startsWith('/api/auth')) {
    return await handleAuthAPI(request, env);
  }

  // 环境管理API
  if (url.pathname.startsWith('/api/environments')) {
    return await handleEnvironmentsAPI(request, env);
  }

  // 调试端点 - 检查用户数据
  if (url.pathname === '/api/debug/users') {
    if (!env.ENV_CONFIG) {
      return errorResponse('KV not configured', 503);
    }

    const adminData = await env.ENV_CONFIG.get('user:admin', 'json');
    const userList = await env.ENV_CONFIG.get('user_list', 'json');

    return jsonResponse({
      adminExists: !!adminData,
      adminData: adminData ? {
        username: adminData.username,
        email: adminData.email,
        role: adminData.role,
        enabled: adminData.enabled,
        hasPassword: !!adminData.password
      } : null,
      userList: userList || [],
      timestamp: new Date().toISOString()
    });
  }

  // 临时端点 - 生成密码哈希
  if (url.pathname === '/api/debug/hash') {
    const url_obj = new URL(request.url);
    const password = url_obj.searchParams.get('password') || 'admin123';
    const hash = await hashPassword(password);

    return jsonResponse({
      password: password,
      hash: hash,
      timestamp: new Date().toISOString()
    });
  }

  // 健康检查端点（带缓存）
  if (url.pathname === '/api/health') {
    const cacheConfig = getCacheConfig(env);
    return await handleCachedResponse(
      request,
      () => jsonResponse({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: env.APP_VERSION || '2.0.0',
        environment: env.ENVIRONMENT || 'production',
        edge: {
          colo: request.cf?.colo || 'unknown',
          country: request.cf?.country || 'unknown',
          timezone: request.cf?.timezone || 'unknown'
        }
      }),
      cacheConfig.HEALTH_CHECK,
      ctx
    );
  }

  // 系统信息端点
  if (url.pathname === '/api/info') {
    return jsonResponse({
      worker: 'environment-manager',
      version: env.APP_VERSION || '2.0.0',
      environment: env.ENVIRONMENT || 'production',
      features: {
        kv: !!env.ENV_CONFIG,
        assets: !!env.ASSETS,
        smartPlacement: true
      },
      message: env.ENV_CONFIG ? 'KV storage available' : 'KV storage not configured (can be added later)'
    });
  }



  return errorResponse('API endpoint not found', 404);
}

// 用户认证API处理
async function handleAuthAPI(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/auth', '');

  try {
    if (!env.ENV_CONFIG) {
      return errorResponse('KV binding not configured', 503);
    }

    if (request.method === 'POST') {
      if (path === '/login') {
        const response = await handleLogin(request, env);
        // 确保登录响应不被缓存
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
        return response;
      } else if (path === '/register') {
        const response = await handleRegister(request, env);
        // 确保注册响应不被缓存
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
        return response;
      } else if (path === '/logout') {
        return await handleLogout(request, env);
      }
    } else if (request.method === 'GET') {
      if (path === '/verify') {
        return await handleVerifyToken(request, env);
      } else if (path === '/user') {
        return await handleGetUser(request, env);
      }
    }

    return errorResponse('Auth endpoint not found', 404);
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

// 环境管理API处理
async function handleEnvironmentsAPI(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/environments', '');

  try {
    if (!env.ENV_CONFIG) {
      return errorResponse('KV binding not configured', 503);
    }

    // 验证用户权限
    const authResult = await verifyAuthToken(request, env);
    if (!authResult.valid) {
      return errorResponse('Unauthorized', 401);
    }

    if (request.method === 'GET') {
      if (path === '' || path === '/') {
        return await handleGetEnvironments(request, env);
      } else if (path.startsWith('/')) {
        const envId = path.substring(1);
        return await handleGetEnvironment(envId, env);
      }
    } else if (request.method === 'POST') {
      if (path === '' || path === '/') {
        return await handleCreateEnvironment(request, env, authResult.user);
      }
    } else if (request.method === 'PUT') {
      if (path.startsWith('/')) {
        const envId = path.substring(1);
        return await handleUpdateEnvironment(envId, request, env, authResult.user);
      }
    } else if (request.method === 'DELETE') {
      if (path.startsWith('/')) {
        const envId = path.substring(1);
        return await handleDeleteEnvironment(envId, env, authResult.user);
      }
    }

    return errorResponse('Environment endpoint not found', 404);
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

// KV API 处理
async function handleKVAPI(request, env) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const key = url.searchParams.get('key');

  try {
    // 检查 KV 绑定
    if (!env.ENV_CONFIG) {
      return errorResponse('KV binding ENV_CONFIG not configured. Please configure KV namespace in Cloudflare Dashboard.', 503, {
        available: false,
        setup_required: true
      });
    }

    if (request.method === 'GET') {
      return await handleKVGet(action, key, env);
    } else if (request.method === 'POST') {
      return await handleKVPost(request, env);
    }

    return errorResponse('Method not allowed', 405);
  } catch (error) {
    return errorResponse(error.message, 500, { available: false });
  }
}

// 处理 KV GET 请求
async function handleKVGet(action, key, env) {
  switch (action) {
    case 'test':
      // 测试 KV 连接
      const testKey = `test_${Date.now()}`;
      await env.ENV_CONFIG.put(testKey, 'test_value');
      const testValue = await env.ENV_CONFIG.get(testKey);
      await env.ENV_CONFIG.delete(testKey);

      return jsonResponse({
        available: true,
        test: testValue === 'test_value',
        timestamp: new Date().toISOString()
      });

    case 'get':
      if (!key) {
        return errorResponse('Key parameter required', 400);
      }

      const value = await env.ENV_CONFIG.get(key, 'json');
      return jsonResponse({ data: value });

    case 'list':
      // 列出指定前缀的所有键
      const prefix = key || '';
      const listResult = await env.ENV_CONFIG.list({ prefix });
      return jsonResponse({
        keys: listResult.keys.map(k => k.name),
        list_complete: listResult.list_complete
      });

    case 'exists':
      if (!key) {
        return errorResponse('Key parameter required', 400);
      }

      const existsValue = await env.ENV_CONFIG.get(key);
      return jsonResponse({ exists: existsValue !== null });

    default:
      return errorResponse('Invalid action', 400);
  }
}

// 处理 KV POST 请求
async function handleKVPost(request, env) {
  const body = await request.json();
  const { action, key, value, envId, statusData } = body;

  switch (action) {
    case 'put':
      if (!key || value === undefined) {
        return errorResponse('Key and value required', 400);
      }

      await env.ENV_CONFIG.put(key, JSON.stringify(value));
      return jsonResponse({ success: true });

    case 'delete':
      if (!key) {
        return errorResponse('Key required', 400);
      }

      await env.ENV_CONFIG.delete(key);
      return jsonResponse({ success: true });

    case 'save_status':
      if (!envId || !statusData) {
        return errorResponse('Environment ID and status data required', 400);
      }

      await saveEnvironmentStatus(envId, statusData, env);
      return jsonResponse({ success: true });

    case 'get_history':
      if (!envId) {
        return errorResponse('Environment ID required', 400);
      }

      const history = await getEnvironmentHistory(envId, env);
      return jsonResponse({ history });

    case 'init_admin':
      // 初始化管理员账户
      const adminExists = await env.ENV_CONFIG.get('user:admin');
      if (adminExists) {
        return errorResponse('Admin already exists', 409);
      }

      const adminPassword = await hashPassword('admin123');
      const adminData = {
        username: 'admin',
        email: 'admin@env-mgmt.local',
        password: adminPassword,
        role: 'admin',
        createdAt: new Date().toISOString(),
        enabled: true,
        loginCount: 0
      };

      await env.ENV_CONFIG.put('user:admin', JSON.stringify(adminData));

      const userList = await env.ENV_CONFIG.get('user_list', 'json') || [];
      if (!userList.includes('admin')) {
        userList.push('admin');
        await env.ENV_CONFIG.put('user_list', JSON.stringify(userList));
      }

      return jsonResponse({
        message: 'Admin user created successfully',
        defaultPassword: 'admin123'
      });

    default:
      return errorResponse('Invalid action', 400);
  }
}

// 静态资源处理（带智能缓存）
async function handleStaticAssets(request, env, ctx) {
  const url = new URL(request.url);

  try {
    // 使用最新的Assets绑定
    if (env.ASSETS) {
      // 尝试获取静态资源
      const response = await env.ASSETS.fetch(request);

      // 如果是404且不是API路径，返回index.html用于SPA路由
      if (response.status === 404 && !url.pathname.startsWith('/api/')) {
        const indexRequest = new Request(new URL('/index.html', request.url), request);
        const indexResponse = await env.ASSETS.fetch(indexRequest);

        // 为SPA路由添加适当的缓存头
        return new Response(indexResponse.body, {
          status: indexResponse.status,
          headers: {
            ...Object.fromEntries(indexResponse.headers),
            'Cache-Control': 'public, max-age=300',
            'X-SPA-Route': 'true'
          }
        });
      }

      // 为静态资源添加优化的缓存头
      if (response.ok) {
        const isAsset = url.pathname.includes('/assets/') ||
                       url.pathname.endsWith('.js') ||
                       url.pathname.endsWith('.css') ||
                       url.pathname.endsWith('.svg') ||
                       url.pathname.endsWith('.png') ||
                       url.pathname.endsWith('.jpg');

        const cacheConfig = getCacheConfig(env);
        const cacheControl = isAsset
          ? `public, max-age=${cacheConfig.STATIC_ASSETS}, immutable`
          : 'public, max-age=3600';

        return new Response(response.body, {
          status: response.status,
          headers: {
            ...Object.fromEntries(response.headers),
            'Cache-Control': cacheControl,
            'X-Edge-Cache': 'optimized'
          }
        });
      }

      return response;
    }

    // 降级处理 - 返回基础HTML
    return new Response(getIndexHTML(), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    // SPA 路由处理 - 返回 index.html
    return new Response(getIndexHTML(), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300'
      }
    });
  }
}

// 成功响应
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify({
    success: true,
    ...data
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders()
    }
  });
}

// 错误响应
function errorResponse(message, status = 500, additionalData = {}) {
  return new Response(JSON.stringify({
    success: false,
    error: message,
    ...additionalData
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders()
    }
  });
}

// CORS 预检响应
function corsResponse() {
  return new Response(null, {
    status: 200,
    headers: getCorsHeaders()
  });
}

// CORS 头配置
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// 智能缓存处理
async function handleCachedResponse(request, responseGenerator, maxAge, ctx = null) {
  const cache = caches.default;
  const cacheKey = new Request(request.url, request);

  // 尝试从缓存获取
  let response = await cache.match(cacheKey);

  if (!response) {
    // 缓存未命中，生成新响应
    response = await responseGenerator();

    // 添加缓存头
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers),
        'Cache-Control': `public, max-age=${maxAge}`,
        'X-Cache': 'MISS'
      }
    });

    // 存入缓存（如果有ctx）
    if (ctx) {
      ctx.waitUntil(cache.put(cacheKey, newResponse.clone()));
    }
    return newResponse;
  }

  // 缓存命中
  const cachedResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...Object.fromEntries(response.headers),
      'X-Cache': 'HIT'
    }
  });

  return cachedResponse;
}

// 添加安全头
function addSecurityHeaders(response) {
  const newHeaders = new Headers(response.headers);

  // 安全头配置
  newHeaders.set('X-Content-Type-Options', 'nosniff');
  newHeaders.set('X-Frame-Options', 'DENY');
  newHeaders.set('X-XSS-Protection', '1; mode=block');
  newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  newHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // CSP for production
  if (!response.headers.get('Content-Security-Policy')) {
    newHeaders.set('Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https:; " +
      "font-src 'self' data:;"
    );
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

// 用户认证相关函数
async function handleLogin(request, env) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return errorResponse('Username and password required', 400);
  }

  // 获取用户数据
  const userData = await env.ENV_CONFIG.get(`user:${username}`, 'json');
  if (!userData) {
    return errorResponse('Invalid credentials', 401);
  }

  // 验证密码
  const isValidPassword = await verifyPassword(password, userData.password);
  if (!isValidPassword) {
    return errorResponse('Invalid credentials', 401);
  }

  // 生成JWT token
  const token = await generateJWT({ username, role: userData.role }, env);

  // 更新登录信息
  userData.lastLogin = new Date().toISOString();
  userData.loginCount = (userData.loginCount || 0) + 1;
  await env.ENV_CONFIG.put(`user:${username}`, JSON.stringify(userData));

  return jsonResponse({
    token,
    user: {
      username: userData.username,
      email: userData.email,
      role: userData.role,
      lastLogin: userData.lastLogin
    }
  });
}

async function handleRegister(request, env) {
  const { username, password, email } = await request.json();

  if (!username || !password || !email) {
    return errorResponse('Username, password and email required', 400);
  }

  // 检查用户是否已存在
  const existingUser = await env.ENV_CONFIG.get(`user:${username}`);
  if (existingUser) {
    return errorResponse('User already exists', 409);
  }

  // 创建用户数据
  const hashedPassword = await hashPassword(password);
  const userData = {
    username,
    email,
    password: hashedPassword,
    role: 'user', // 默认角色
    createdAt: new Date().toISOString(),
    enabled: true,
    loginCount: 0
  };

  // 存储用户数据
  await env.ENV_CONFIG.put(`user:${username}`, JSON.stringify(userData));

  // 更新用户列表
  const userList = await env.ENV_CONFIG.get('user_list', 'json') || [];
  userList.push(username);
  await env.ENV_CONFIG.put('user_list', JSON.stringify(userList));

  return jsonResponse({
    message: 'User created successfully',
    user: {
      username: userData.username,
      email: userData.email,
      role: userData.role
    }
  });
}

async function handleLogout(request, env) {
  // 在无状态JWT系统中，登出主要是客户端删除token
  return jsonResponse({ message: 'Logged out successfully' });
}

async function handleVerifyToken(request, env) {
  const authResult = await verifyAuthToken(request, env);

  if (!authResult.valid) {
    return errorResponse('Invalid token', 401);
  }

  return jsonResponse({
    valid: true,
    user: authResult.user
  });
}

async function handleGetUser(request, env) {
  const authResult = await verifyAuthToken(request, env);

  if (!authResult.valid) {
    return errorResponse('Unauthorized', 401);
  }

  const userData = await env.ENV_CONFIG.get(`user:${authResult.user.username}`, 'json');
  if (!userData) {
    return errorResponse('User not found', 404);
  }

  return jsonResponse({
    user: {
      username: userData.username,
      email: userData.email,
      role: userData.role,
      lastLogin: userData.lastLogin,
      createdAt: userData.createdAt
    }
  });
}

// 密码哈希和验证
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyPassword(password, hashedPassword) {
  const hashedInput = await hashPassword(password);
  return hashedInput === hashedPassword;
}

// JWT 相关函数
async function generateJWT(payload, env) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    ...payload,
    iat: now,
    exp: now + (24 * 60 * 60) // 24小时过期
  };

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(jwtPayload));
  const signature = await signJWT(`${encodedHeader}.${encodedPayload}`, env);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

async function verifyAuthToken(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false };
  }

  const token = authHeader.substring(7);
  try {
    const [header, payload, signature] = token.split('.');
    const expectedSignature = await signJWT(`${header}.${payload}`, env);

    if (signature !== expectedSignature) {
      return { valid: false };
    }

    const decodedPayload = JSON.parse(atob(payload));
    const now = Math.floor(Date.now() / 1000);

    if (decodedPayload.exp < now) {
      return { valid: false };
    }

    return {
      valid: true,
      user: {
        username: decodedPayload.username,
        role: decodedPayload.role
      }
    };
  } catch (error) {
    return { valid: false };
  }
}

async function signJWT(data, env) {
  const secret = env.JWT_SECRET || 'default-secret-key';
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// 环境管理相关函数
async function handleGetEnvironments(request, env) {
  const environments = await env.ENV_CONFIG.get('environments', 'json') || [];
  return jsonResponse({ environments });
}

async function handleGetEnvironment(envId, env) {
  const environment = await env.ENV_CONFIG.get(`environment:${envId}`, 'json');
  if (!environment) {
    return errorResponse('Environment not found', 404);
  }
  return jsonResponse({ environment });
}

async function handleCreateEnvironment(request, env, user) {
  const environmentData = await request.json();

  // 验证必需字段
  if (!environmentData.name || !environmentData.url) {
    return errorResponse('Name and URL are required', 400);
  }

  // 生成环境ID
  const envId = generateId();
  const now = new Date().toISOString();

  const environment = {
    id: envId,
    name: environmentData.name,
    url: environmentData.url,
    description: environmentData.description || '',
    tags: environmentData.tags || [],
    networkType: environmentData.networkType || 'external',
    group: environmentData.group || 'default',
    createdAt: now,
    updatedAt: now,
    createdBy: user.username,
    enabled: true
  };

  // 存储环境数据
  await env.ENV_CONFIG.put(`environment:${envId}`, JSON.stringify(environment));

  // 更新环境列表
  const environments = await env.ENV_CONFIG.get('environments', 'json') || [];
  environments.push(envId);
  await env.ENV_CONFIG.put('environments', JSON.stringify(environments));

  return jsonResponse({ environment }, 201);
}

async function handleUpdateEnvironment(envId, request, env, user) {
  const existingEnv = await env.ENV_CONFIG.get(`environment:${envId}`, 'json');
  if (!existingEnv) {
    return errorResponse('Environment not found', 404);
  }

  const updateData = await request.json();
  const updatedEnv = {
    ...existingEnv,
    ...updateData,
    id: envId, // 确保ID不被修改
    updatedAt: new Date().toISOString(),
    updatedBy: user.username
  };

  await env.ENV_CONFIG.put(`environment:${envId}`, JSON.stringify(updatedEnv));
  return jsonResponse({ environment: updatedEnv });
}

async function handleDeleteEnvironment(envId, env, user) {
  const existingEnv = await env.ENV_CONFIG.get(`environment:${envId}`, 'json');
  if (!existingEnv) {
    return errorResponse('Environment not found', 404);
  }

  // 删除环境数据
  await env.ENV_CONFIG.delete(`environment:${envId}`);

  // 从环境列表中移除
  const environments = await env.ENV_CONFIG.get('environments', 'json') || [];
  const updatedEnvironments = environments.filter(id => id !== envId);
  await env.ENV_CONFIG.put('environments', JSON.stringify(updatedEnvironments));

  // 删除相关的状态历史
  await deleteEnvironmentHistory(envId, env);

  return jsonResponse({ message: 'Environment deleted successfully' });
}

// 状态历史管理
async function saveEnvironmentStatus(envId, statusData, env) {
  const historyKey = `status_history:${envId}`;
  const history = await env.ENV_CONFIG.get(historyKey, 'json') || [];

  // 添加新状态记录
  history.push({
    ...statusData,
    timestamp: new Date().toISOString()
  });

  // 保持最近24小时的记录（假设每5分钟检测一次，最多288条记录）
  const maxRecords = 288;
  if (history.length > maxRecords) {
    history.splice(0, history.length - maxRecords);
  }

  await env.ENV_CONFIG.put(historyKey, JSON.stringify(history));
}

async function getEnvironmentHistory(envId, env) {
  const historyKey = `status_history:${envId}`;
  return await env.ENV_CONFIG.get(historyKey, 'json') || [];
}

async function deleteEnvironmentHistory(envId, env) {
  const historyKey = `status_history:${envId}`;
  await env.ENV_CONFIG.delete(historyKey);
}



// 工具函数
function generateId() {
  return 'env_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 基础HTML页面（降级使用）
function getIndexHTML() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>环境管理系统</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0; padding: 2rem; background: #f5f5f5; 
        }
        .container { 
            max-width: 600px; margin: 0 auto; background: white; 
            padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        h1 { color: #333; margin-bottom: 1rem; }
        .status { padding: 1rem; background: #e3f2fd; border-radius: 4px; margin: 1rem 0; }
        .success { background: #e8f5e8; color: #2e7d32; }
        .error { background: #ffebee; color: #c62828; }
        button { 
            background: #1976d2; color: white; border: none; 
            padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; margin: 0.5rem; 
        }
        button:hover { background: #1565c0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌐 环境管理系统</h1>
        <div class="status success">
            <strong>✅ Cloudflare Workers 运行正常</strong>
            <p>基于2025年最新Workers技术构建</p>
        </div>
        <div class="status">
            <strong>📊 系统信息</strong>
            <p>Worker: environment-manager</p>
            <p>版本: 2.0.0</p>
            <p>API端点: /api/kv</p>
        </div>
        <button onclick="testKV()">测试 KV 连接</button>
        <button onclick="testAPI()">测试 API 端点</button>
        <div id="result" style="margin-top: 1rem; padding: 1rem; background: #f5f5f5; border-radius: 4px; display: none;"></div>
        <p style="margin-top: 2rem; color: #666;">
            请确保已正确构建和部署前端资源。如果看到此页面，说明Worker正在运行，但静态资源可能需要重新构建。
        </p>
    </div>

    <script>
        async function testKV() {
            const resultDiv = document.getElementById('result');
            resultDiv.style.display = 'block';
            resultDiv.textContent = '🔄 测试中...';
            
            try {
                const response = await fetch('/api/kv?action=test');
                const result = await response.json();
                
                resultDiv.innerHTML = \`<strong>KV 连接测试结果:</strong><br>
                <pre>\${JSON.stringify(result, null, 2)}</pre>\`;
                resultDiv.className = result.success ? 'status success' : 'status error';
            } catch (error) {
                resultDiv.innerHTML = \`<strong>测试失败:</strong> \${error.message}\`;
                resultDiv.className = 'status error';
            }
        }
        
        async function testAPI() {
            const resultDiv = document.getElementById('result');
            resultDiv.style.display = 'block';
            resultDiv.textContent = '🔄 测试中...';
            
            try {
                const response = await fetch('/api/health');
                const result = await response.json();
                
                resultDiv.innerHTML = \`<strong>API 健康检查结果:</strong><br>
                <pre>\${JSON.stringify(result, null, 2)}</pre>\`;
                resultDiv.className = result.success ? 'status success' : 'status error';
            } catch (error) {
                resultDiv.innerHTML = \`<strong>测试失败:</strong> \${error.message}\`;
                resultDiv.className = 'status error';
            }
        }
    </script>
</body>
</html>`;
}
