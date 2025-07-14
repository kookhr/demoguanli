import React, { useState, useEffect } from 'react';
import { checkEnvironmentStatus, setDebugMode, getConfig, updateConfig } from '../utils/simpleNetworkCheck';
import { Activity, CheckCircle, XCircle, Loader2, Globe, Shield, Settings, Bug } from 'lucide-react';

const NetworkProbeTest = () => {
  const [testUrl, setTestUrl] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState([]);
  const [config, setConfig] = useState(getConfig());
  const [showSettings, setShowSettings] = useState(false);

  // 初始化配置
  useEffect(() => {
    setConfig(getConfig());
  }, []);

  // 更新配置
  const handleConfigChange = (key, value) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    updateConfig(newConfig);

    // 特殊处理调试模式
    if (key === 'debugMode') {
      setDebugMode(value);
    }
  };

  // 预设的测试地址
  const presetUrls = [
    'http://demo-itam.cloudwise.com:18088', // 您提到的问题地址
    'http://192.168.1.1:80',      // 常见路由器
    'http://127.0.0.1:3000',      // 本地开发服务器
    'http://10.0.0.1:8080',       // 内网服务
    'https://8.8.8.8:443',        // Google DNS HTTPS
    'http://172.16.0.1:80',       // 内网HTTP
    'https://1.1.1.1:443',        // Cloudflare DNS HTTPS
    'http://192.168.0.1:8080',    // 内网服务器
    'https://github.com',         // 外网域名（对比测试）
    'http://httpbin.org',         // 测试API服务
    'https://jsonplaceholder.typicode.com' // 测试API服务
  ];

  // 执行单个URL检测
  const testSingleUrl = async (url) => {
    if (!url.trim()) return;

    setIsChecking(true);
    const startTime = Date.now();

    try {
      const environment = {
        id: `test-${Date.now()}`,
        name: `测试-${url}`,
        url: url.trim()
      };

      const result = await checkEnvironmentStatus(environment);
      const endTime = Date.now();

      const testResult = {
        url: url.trim(),
        ...result,
        testTime: new Date().toISOString(),
        totalTime: endTime - startTime
      };

      setResults(prev => [testResult, ...prev.slice(0, 19)]); // 保留最近20条记录
    } catch (error) {
      const testResult = {
        url: url.trim(),
        status: 'error',
        error: error.message,
        testTime: new Date().toISOString(),
        totalTime: Date.now() - startTime
      };
      setResults(prev => [testResult, ...prev.slice(0, 19)]);
    } finally {
      setIsChecking(false);
    }
  };

  // 批量测试预设URL
  const testAllPresets = async () => {
    setIsChecking(true);
    setResults([]);

    for (const url of presetUrls) {
      await testSingleUrl(url);
      // 添加小延迟避免过于频繁的请求
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsChecking(false);
  };

  // 获取状态图标
  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'unreachable':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  // 获取方法颜色
  const getMethodColor = (method) => {
    switch (method) {
      case 'fetch-success':
      case 'fetch-no-cors':
        return 'bg-blue-100 text-blue-800';
      case 'image-load':
      case 'image-error-reachable':
        return 'bg-green-100 text-green-800';
      case 'mixed-content-image-probe':
        return 'bg-orange-100 text-orange-800';
      case 'mixed-content-blocked':
        return 'bg-red-100 text-red-800';
      case 'enhanced-check':
        return 'bg-purple-100 text-purple-800';
      case 'all-methods-failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 判断是否为IP地址
  const isIpAddress = (url) => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
      return ipv4Regex.test(hostname);
    } catch {
      return false;
    }
  };

  // 判断是否为混合内容
  const isMixedContent = (url) => {
    try {
      const currentProtocol = window.location.protocol;
      const targetProtocol = new URL(url).protocol;
      return currentProtocol === 'https:' && targetProtocol === 'http:';
    } catch {
      return false;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          网络探测测试工具
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          测试基于 img 标签的 IP+端口 探测功能，支持绕过 CORS 限制的网络可达性检测
        </p>

        {/* 混合内容警告 */}
        {window.location.protocol === 'https:' && (
          <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Activity className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  混合内容检测模式
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  当前页面使用 HTTPS，测试 HTTP 地址时会触发混合内容限制。
                  系统会自动使用 img 标签探测来绕过这些限制。
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                  💡 提示：img 探测可以检测服务可达性，但无法获取详细的 HTTP 状态码
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 测试控制面板 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">测试控制</h2>
        
        {/* 单个URL测试 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">测试URL</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="输入要测试的URL，如: http://192.168.1.1:80"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => testSingleUrl(testUrl)}
              disabled={isChecking || !testUrl.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
              测试
            </button>
          </div>
        </div>

        {/* 批量测试 */}
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div>
            <button
              onClick={testAllPresets}
              disabled={isChecking}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
              批量测试预设地址
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              将测试 {presetUrls.length} 个预设地址，包括内网IP和外网域名
            </p>
          </div>

          <div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700
                       flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              {showSettings ? '隐藏设置' : '显示设置'}
            </button>
          </div>
        </div>

        {/* 设置面板 */}
        {showSettings && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border">
            <h3 className="text-md font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              检测配置
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 调试模式 */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.debugMode}
                    onChange={(e) => handleConfigChange('debugMode', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Bug className="w-4 h-4" />
                  <span className="text-sm font-medium">调试模式</span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  启用详细的控制台日志
                </p>
              </div>

              {/* 启用图像探测 */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.enableImageProbe}
                    onChange={(e) => handleConfigChange('enableImageProbe', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">启用图像探测</span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  对IP地址使用img标签探测
                </p>
              </div>

              {/* 超时时间 */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  超时时间 (ms)
                </label>
                <input
                  type="number"
                  value={config.timeout}
                  onChange={(e) => handleConfigChange('timeout', parseInt(e.target.value))}
                  min="1000"
                  max="30000"
                  step="1000"
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* 图像探测超时 */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  图像探测超时 (ms)
                </label>
                <input
                  type="number"
                  value={config.imageProbeTimeout}
                  onChange={(e) => handleConfigChange('imageProbeTimeout', parseInt(e.target.value))}
                  min="1000"
                  max="10000"
                  step="500"
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* 并发数 */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  并发数
                </label>
                <input
                  type="number"
                  value={config.concurrency}
                  onChange={(e) => handleConfigChange('concurrency', parseInt(e.target.value))}
                  min="1"
                  max="20"
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* 缓存启用 */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.cacheEnabled}
                    onChange={(e) => handleConfigChange('cacheEnabled', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">启用缓存</span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  缓存检测结果30秒
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 测试结果 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">测试结果</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            显示最近 20 条测试记录
          </p>
        </div>

        <div className="p-6">
          {results.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              暂无测试结果，请开始测试
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {result.url}
                          </span>
                          {isIpAddress(result.url) ? (
                            <Shield className="w-4 h-4 text-blue-600" title="IP地址" />
                          ) : (
                            <Globe className="w-4 h-4 text-green-600" title="域名" />
                          )}
                          {isMixedContent(result.url) && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                              <Activity className="w-3 h-3" />
                              <span>混合内容</span>
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(result.testTime).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        result.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {result.status === 'available' ? '可达' : '不可达'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">检测方法:</span>
                      <div className={`inline-block ml-2 px-2 py-1 rounded text-xs ${getMethodColor(result.method)}`}>
                        {result.method || 'unknown'}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">响应时间:</span>
                      <span className="ml-2 font-mono">{result.responseTime || result.totalTime}ms</span>
                    </div>
                    
                    {result.details && (
                      <div className="md:col-span-2">
                        <span className="text-gray-500 dark:text-gray-400">详情:</span>
                        <span className="ml-2 text-gray-700 dark:text-gray-300">{result.details}</span>
                      </div>
                    )}
                    
                    {result.error && (
                      <div className="md:col-span-2">
                        <span className="text-gray-500 dark:text-gray-400">错误:</span>
                        <span className="ml-2 text-red-600 dark:text-red-400">{result.error}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkProbeTest;
