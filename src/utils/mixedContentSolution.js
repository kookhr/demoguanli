/**
 * 混合内容问题的综合解决方案
 * 
 * 这个模块提供了多种技术手段来绕过或缓解HTTPS页面访问HTTP服务的限制
 * 包括：间接检测、时间差分析、资源探测等方法
 */

// 配置选项
const MIXED_CONTENT_CONFIG = {
  // 检测超时时间
  timeout: 5000,
  
  // 重试次数
  retryCount: 2,
  
  // 时间差分析的测试次数
  timingTestCount: 3,
  
  // 快速失败阈值（毫秒）
  fastFailureThreshold: 100,
  
  // 支持的检测方法
  detectionMethods: {
    image: true,
    script: true,
    css: true,
    iframe: false, // iframe在混合内容下通常被阻止
    websocket: true,
    timing: true
  },
  
  // 常见的静态资源路径
  staticPaths: [
    'favicon.ico',
    'favicon.png',
    'robots.txt',
    'manifest.json',
    'apple-touch-icon.png'
  ],
  
  // WebSocket路径
  websocketPaths: [
    '/',
    '/ws',
    '/websocket',
    '/socket.io'
  ]
};

/**
 * 主要的混合内容检测函数
 * @param {Object} environment - 环境配置对象
 * @returns {Promise<Object>} 检测结果
 */
export const detectMixedContentService = async (environment) => {
  const startTime = Date.now();
  
  // 检查是否是混合内容场景
  if (!isMixedContentScenario(environment.url)) {
    return {
      id: environment.id,
      status: 'not-mixed-content',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: null,
      method: 'mixed-content-check'
    };
  }

  // 执行多种检测方法
  const detectionResults = await Promise.allSettled([
    MIXED_CONTENT_CONFIG.detectionMethods.image ? detectViaImageProbe(environment.url) : Promise.resolve(null),
    MIXED_CONTENT_CONFIG.detectionMethods.script ? detectViaScriptProbe(environment.url) : Promise.resolve(null),
    MIXED_CONTENT_CONFIG.detectionMethods.websocket ? detectViaWebSocket(environment.url) : Promise.resolve(null),
    MIXED_CONTENT_CONFIG.detectionMethods.timing ? detectViaTiming(environment.url) : Promise.resolve(null)
  ]);

  // 分析检测结果
  const analysis = analyzeDetectionResults(detectionResults);
  
  const responseTime = Date.now() - startTime;
  
  return {
    id: environment.id,
    status: analysis.status,
    responseTime,
    lastChecked: new Date().toISOString(),
    error: analysis.error,
    method: analysis.method,
    confidence: analysis.confidence,
    details: analysis.details
  };
};

/**
 * 检查是否是混合内容场景
 */
function isMixedContentScenario(url) {
  if (window.location.protocol !== 'https:') {
    return false;
  }
  
  if (!url.startsWith('http:')) {
    return false;
  }
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // localhost 和 127.0.0.1 通常被允许
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return false;
    }
    
    return true;
  } catch (error) {
    return true;
  }
}

/**
 * 图片探测方法
 */
function detectViaImageProbe(baseUrl) {
  return new Promise((resolve) => {
    const results = [];
    let completedTests = 0;
    const totalTests = MIXED_CONTENT_CONFIG.staticPaths.length;
    
    if (totalTests === 0) {
      resolve({ method: 'image-probe', success: false, error: 'No paths to test' });
      return;
    }
    
    MIXED_CONTENT_CONFIG.staticPaths.forEach((path, index) => {
      const img = new Image();
      const startTime = Date.now();
      const testUrl = `${baseUrl}${path}?_mc_test=${Date.now()}`;
      
      const timeout = setTimeout(() => {
        results[index] = { success: false, time: Date.now() - startTime, timeout: true };
        completedTests++;
        checkImageProbeComplete();
      }, MIXED_CONTENT_CONFIG.timeout);
      
      img.onload = () => {
        clearTimeout(timeout);
        results[index] = { success: true, time: Date.now() - startTime };
        completedTests++;
        checkImageProbeComplete();
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        results[index] = { success: false, time: Date.now() - startTime };
        completedTests++;
        checkImageProbeComplete();
      };
      
      img.src = testUrl;
    });
    
    function checkImageProbeComplete() {
      if (completedTests >= totalTests) {
        const successCount = results.filter(r => r.success).length;
        const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
        
        resolve({
          method: 'image-probe',
          success: successCount > 0,
          successRate: successCount / totalTests,
          averageTime: avgTime,
          details: results
        });
      }
    }
  });
}

/**
 * 脚本探测方法
 */
function detectViaScriptProbe(baseUrl) {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    const startTime = Date.now();
    const testUrl = `${baseUrl}js/nonexistent.js?_mc_test=${Date.now()}`;
    
    const timeout = setTimeout(() => {
      if (script.parentNode) {
        document.head.removeChild(script);
      }
      resolve({
        method: 'script-probe',
        success: false,
        time: Date.now() - startTime,
        timeout: true
      });
    }, MIXED_CONTENT_CONFIG.timeout);
    
    script.onload = () => {
      clearTimeout(timeout);
      document.head.removeChild(script);
      resolve({
        method: 'script-probe',
        success: true,
        time: Date.now() - startTime
      });
    };
    
    script.onerror = () => {
      clearTimeout(timeout);
      document.head.removeChild(script);
      resolve({
        method: 'script-probe',
        success: false,
        time: Date.now() - startTime,
        error: 'Script load failed'
      });
    };
    
    script.src = testUrl;
    document.head.appendChild(script);
  });
}

/**
 * WebSocket探测方法
 */
function detectViaWebSocket(baseUrl) {
  return new Promise((resolve) => {
    try {
      const url = new URL(baseUrl);
      const wsUrl = `ws://${url.host}/`;
      const startTime = Date.now();
      
      const ws = new WebSocket(wsUrl);
      
      const timeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
        resolve({
          method: 'websocket-probe',
          success: false,
          time: Date.now() - startTime,
          timeout: true
        });
      }, MIXED_CONTENT_CONFIG.timeout);
      
      ws.onopen = () => {
        clearTimeout(timeout);
        ws.close();
        resolve({
          method: 'websocket-probe',
          success: true,
          time: Date.now() - startTime
        });
      };
      
      ws.onerror = () => {
        clearTimeout(timeout);
        resolve({
          method: 'websocket-probe',
          success: false,
          time: Date.now() - startTime,
          error: 'WebSocket connection failed'
        });
      };
      
    } catch (error) {
      resolve({
        method: 'websocket-probe',
        success: false,
        time: 0,
        error: error.message
      });
    }
  });
}

/**
 * 时间差分析方法
 */
function detectViaTiming(baseUrl) {
  return new Promise((resolve) => {
    const tests = [];
    let completedTests = 0;
    const totalTests = MIXED_CONTENT_CONFIG.timingTestCount;
    
    for (let i = 0; i < totalTests; i++) {
      setTimeout(() => {
        const img = new Image();
        const startTime = performance.now();
        const testUrl = `${baseUrl}favicon.ico?_timing_test=${Date.now()}_${i}`;
        
        const timeout = setTimeout(() => {
          tests[i] = { success: false, time: performance.now() - startTime, timeout: true };
          completedTests++;
          checkTimingComplete();
        }, MIXED_CONTENT_CONFIG.timeout);
        
        img.onload = () => {
          clearTimeout(timeout);
          tests[i] = { success: true, time: performance.now() - startTime };
          completedTests++;
          checkTimingComplete();
        };
        
        img.onerror = () => {
          clearTimeout(timeout);
          tests[i] = { success: false, time: performance.now() - startTime };
          completedTests++;
          checkTimingComplete();
        };
        
        img.src = testUrl;
      }, i * 100); // 间隔100ms
    }
    
    function checkTimingComplete() {
      if (completedTests >= totalTests) {
        const successTimes = tests.filter(t => t.success).map(t => t.time);
        const failureTimes = tests.filter(t => !t.success).map(t => t.time);
        
        const avgFailureTime = failureTimes.length > 0 ? 
          failureTimes.reduce((a, b) => a + b, 0) / failureTimes.length : 0;
        
        // 快速失败通常表明服务在线但拒绝连接
        const isFastFailure = avgFailureTime < MIXED_CONTENT_CONFIG.fastFailureThreshold;
        
        resolve({
          method: 'timing-analysis',
          success: successTimes.length > 0,
          fastFailure: isFastFailure && failureTimes.length > 0,
          averageFailureTime: avgFailureTime,
          successCount: successTimes.length,
          totalTests: totalTests,
          details: tests
        });
      }
    }
  });
}

/**
 * 分析检测结果
 */
function analyzeDetectionResults(detectionResults) {
  const results = detectionResults
    .filter(result => result.status === 'fulfilled' && result.value)
    .map(result => result.value);
  
  if (results.length === 0) {
    return {
      status: 'mixed-content-detection-failed',
      error: '所有检测方法均失败',
      method: 'mixed-content-analysis',
      confidence: 0,
      details: 'No detection methods succeeded'
    };
  }
  
  // 统计成功的检测方法
  const successfulMethods = results.filter(r => r.success);
  const timingResult = results.find(r => r.method === 'timing-analysis');
  
  if (successfulMethods.length > 0) {
    return {
      status: 'mixed-content-service-reachable',
      error: null,
      method: 'mixed-content-bypass',
      confidence: Math.min(0.9, successfulMethods.length / results.length),
      details: `通过 ${successfulMethods.map(m => m.method).join(', ')} 检测到服务可达`
    };
  }
  
  // 如果没有成功的方法，但有快速失败，可能服务在线但拒绝连接
  if (timingResult && timingResult.fastFailure) {
    return {
      status: 'mixed-content-service-restricted',
      error: '服务可能在线但拒绝HTTP连接',
      method: 'mixed-content-timing-analysis',
      confidence: 0.6,
      details: `平均失败时间: ${timingResult.averageFailureTime.toFixed(2)}ms (快速失败模式)`
    };
  }
  
  return {
    status: 'mixed-content-service-unreachable',
    error: '服务不可达或离线',
    method: 'mixed-content-analysis',
    confidence: 0.8,
    details: '所有检测方法均表明服务不可达'
  };
}

// 导出配置以供外部使用
export { MIXED_CONTENT_CONFIG };
