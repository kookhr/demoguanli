/**
 * Cloudflare Workers 主入口文件
 * 环境管理系统 - 兼容现有项目结构
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    try {
      // API 路由处理
      if (url.pathname.startsWith('/api/')) {
        return await handleAPI(request, env, ctx);
      }

      // 静态资源处理
      return await handleStaticAssets(request, env, ctx);
    } catch (error) {
      console.error('Worker Error:', error);
      return errorResponse('Internal Server Error', 500);
    }
  }
};

// API 路由处理器
async function handleAPI(request, env, ctx) {
  const url = new URL(request.url);
  
  // CORS 处理
  if (request.method === 'OPTIONS') {
    return corsResponse();
  }

  // KV API 处理
  if (url.pathname === '/api/kv') {
    return await handleKVAPI(request, env);
  }

  // 健康检查端点
  if (url.pathname === '/api/health') {
    return jsonResponse({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: env.APP_VERSION || '2.0.0',
      environment: env.ENVIRONMENT || 'production'
    });
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
    console.error('KV API Error:', error);
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

    default:
      return errorResponse('Invalid action', 400);
  }
}

// 处理 KV POST 请求
async function handleKVPost(request, env) {
  const body = await request.json();
  const { action, key, value } = body;

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

    default:
      return errorResponse('Invalid action', 400);
  }
}

// 静态资源处理
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
        return await env.ASSETS.fetch(indexRequest);
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
    console.error('Static Assets Error:', error);

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
