// Cloudflare Pages Function for KV operations
// 这个函数在服务端运行，可以访问 KV 绑定

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const key = url.searchParams.get('key');

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    // 检查 KV 绑定是否可用
    if (!env.ENV_CONFIG) {
      return new Response(JSON.stringify({
        success: false,
        error: 'KV binding ENV_CONFIG not found',
        available: false
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    switch (action) {
      case 'test':
        // 测试 KV 连接
        const testKey = `test_${Date.now()}`;
        await env.ENV_CONFIG.put(testKey, 'test_value');
        const testValue = await env.ENV_CONFIG.get(testKey);
        await env.ENV_CONFIG.delete(testKey);
        
        return new Response(JSON.stringify({
          success: true,
          available: true,
          test: testValue === 'test_value'
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });

      case 'get':
        if (!key) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Key parameter required'
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        const value = await env.ENV_CONFIG.get(key, 'json');
        return new Response(JSON.stringify({
          success: true,
          data: value
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });

      default:
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid action'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      available: false
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    if (!env.ENV_CONFIG) {
      return new Response(JSON.stringify({
        success: false,
        error: 'KV binding ENV_CONFIG not found'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    const body = await request.json();
    const { action, key, value } = body;

    switch (action) {
      case 'put':
        if (!key || value === undefined) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Key and value required'
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        await env.ENV_CONFIG.put(key, JSON.stringify(value));
        return new Response(JSON.stringify({
          success: true
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });

      case 'delete':
        if (!key) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Key required'
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        await env.ENV_CONFIG.delete(key);
        return new Response(JSON.stringify({
          success: true
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });

      default:
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid action'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// Handle OPTIONS requests for CORS
export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
