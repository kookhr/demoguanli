/**
 * 网络检测修复验证脚本
 * 
 * 这个脚本模拟简化的网络检测逻辑，用于验证修复效果
 */

// 简化的网络检测配置
const SIMPLE_CHECK_CONFIG = {
    timeout: 5000,
    concurrency: 4,
    methods: ['HEAD', 'GET'],
    retryCount: 1,
    cacheEnabled: false // 测试时禁用缓存
};

// 基础网络检测
const basicNetworkCheck = async (url, timeout = SIMPLE_CHECK_CONFIG.timeout) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
            cache: 'no-cache',
            credentials: 'omit',
            headers: {
                'Accept': '*/*',
                'User-Agent': 'Environment-Monitor/1.0'
            }
        });

        clearTimeout(timeoutId);
        
        if (response.status >= 200 && response.status < 400) {
            return { success: true, status: response.status, method: 'head' };
        }
        
        if (response.status >= 400) {
            return { success: true, status: response.status, method: 'head' };
        }

        return { success: false, error: `HTTP ${response.status}`, method: 'head' };

    } catch (error) {
        clearTimeout(timeoutId);
        
        // 如果HEAD失败，尝试GET请求
        if (error.name !== 'AbortError') {
            try {
                const getController = new AbortController();
                const getTimeoutId = setTimeout(() => getController.abort(), timeout);

                const getResponse = await fetch(url, {
                    method: 'GET',
                    signal: getController.signal,
                    cache: 'no-cache',
                    credentials: 'omit',
                    headers: {
                        'Accept': '*/*',
                        'User-Agent': 'Environment-Monitor/1.0'
                    }
                });

                clearTimeout(getTimeoutId);
                
                if (getResponse.status >= 200 && getResponse.status < 600) {
                    return { success: true, status: getResponse.status, method: 'get' };
                }

            } catch (getError) {
                // GET也失败了，继续处理原始错误
            }
        }

        // 分析错误类型
        if (error.name === 'AbortError') {
            return { success: false, error: 'timeout', method: 'timeout' };
        }
        
        // 检查是否是CORS相关错误
        if (error.name === 'TypeError') {
            const corsErrorPatterns = [
                'Failed to fetch',
                'Load failed',
                'Network request failed',
                'CORS',
                'cross-origin',
                'Access-Control',
                'blocked by CORS policy'
            ];
            
            const isCorsError = corsErrorPatterns.some(pattern =>
                error.message.toLowerCase().includes(pattern.toLowerCase())
            );
            
            if (isCorsError) {
                return { success: false, error: 'cors_error', method: 'cors_error' };
            } else {
                return { success: false, error: 'network_error', method: 'network_error' };
            }
        }

        return { success: false, error: error.message, method: 'error' };
    }
};

// 备用连通性检测
const fallbackConnectivityCheck = async (url, timeout = SIMPLE_CHECK_CONFIG.timeout) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        await fetch(url, {
            method: 'GET',
            mode: 'no-cors',
            signal: controller.signal,
            cache: 'no-cache',
            credentials: 'omit'
        });

        clearTimeout(timeoutId);
        return { success: true, method: 'no-cors' };

    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            return { success: false, error: 'timeout', method: 'no-cors-timeout' };
        }
        
        return { success: false, error: error.message, method: 'no-cors-error' };
    }
};

// 主检测函数
const checkEnvironmentStatus = async (environment) => {
    const startTime = Date.now();

    try {
        // 策略1: 基础网络检测
        const basicResult = await basicNetworkCheck(environment.url);
        
        if (basicResult.success) {
            return {
                id: environment.id,
                status: 'available',
                responseTime: Date.now() - startTime,
                lastChecked: new Date().toISOString(),
                error: null,
                method: basicResult.method,
                statusCode: basicResult.status
            };
        }

        // 策略2: 备用连通性检测（在CORS错误或网络错误时使用）
        if (basicResult.error === 'cors_error' || basicResult.error === 'network_error') {
            const fallbackResult = await fallbackConnectivityCheck(environment.url);
            
            if (fallbackResult.success) {
                return {
                    id: environment.id,
                    status: 'available',
                    responseTime: Date.now() - startTime,
                    lastChecked: new Date().toISOString(),
                    error: basicResult.error === 'cors_error' ? 'CORS限制但服务可达' : '网络限制但服务可达',
                    method: fallbackResult.method,
                    statusCode: null
                };
            }
        }

        // 所有检测都失败
        return {
            id: environment.id,
            status: basicResult.error === 'timeout' ? 'unknown' : 'unreachable',
            responseTime: Date.now() - startTime,
            lastChecked: new Date().toISOString(),
            error: basicResult.error,
            method: basicResult.method,
            statusCode: null
        };

    } catch (error) {
        return {
            id: environment.id,
            status: 'unknown',
            responseTime: Date.now() - startTime,
            lastChecked: new Date().toISOString(),
            error: `检测异常: ${error.message}`,
            method: 'exception',
            statusCode: null
        };
    }
};

// 测试用例
const testCases = [
    {
        name: 'Google 主页',
        url: 'https://www.google.com',
        expected: 'available'
    },
    {
        name: 'GitHub 主页',
        url: 'https://www.github.com',
        expected: 'available'
    },
    {
        name: 'HTTPBin 200',
        url: 'https://httpbin.org/status/200',
        expected: 'available'
    },
    {
        name: '不存在的域名',
        url: 'https://nonexistent-domain-12345.com',
        expected: 'unreachable'
    }
];

// 运行测试
async function runTests() {
    console.log('🔧 开始网络检测修复验证...\n');
    
    let passed = 0;
    let total = testCases.length;
    
    for (const testCase of testCases) {
        console.log(`测试: ${testCase.name}`);
        console.log(`URL: ${testCase.url}`);
        console.log(`预期: ${testCase.expected}`);
        
        try {
            const environment = { 
                id: 'test', 
                url: testCase.url, 
                name: testCase.name 
            };
            
            const result = await checkEnvironmentStatus(environment);
            
            const success = result.status === testCase.expected;
            if (success) passed++;
            
            console.log(`结果: ${result.status} ${success ? '✅' : '❌'}`);
            console.log(`响应时间: ${result.responseTime}ms`);
            console.log(`检测方法: ${result.method}`);
            console.log(`错误信息: ${result.error || '无'}`);
            
            if (!success) {
                console.log(`⚠️  测试失败: 预期 ${testCase.expected}，实际 ${result.status}`);
            }
            
        } catch (error) {
            console.log(`❌ 测试异常: ${error.message}`);
        }
        
        console.log('---');
    }
    
    console.log(`\n📊 测试总结:`);
    console.log(`总测试数: ${total}`);
    console.log(`通过: ${passed}`);
    console.log(`失败: ${total - passed}`);
    console.log(`通过率: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (passed === total) {
        console.log('🎉 所有测试通过！网络检测修复成功。');
    } else {
        console.log('⚠️  部分测试失败，需要进一步调试。');
    }
}

// 如果是在Node.js环境中运行
if (typeof window === 'undefined') {
    // Node.js环境需要导入fetch
    const { fetch } = await import('node-fetch');
    global.fetch = fetch;
    global.AbortController = AbortController;
    
    runTests().catch(console.error);
} else {
    // 浏览器环境
    window.runNetworkTests = runTests;
    console.log('网络检测测试函数已加载，请调用 runNetworkTests() 开始测试');
}
