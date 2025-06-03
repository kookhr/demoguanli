import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  Terminal,
  Copy,
  ExternalLink,
  Settings,
  Database
} from 'lucide-react';

const KVDiagnostics = () => {
  const [diagnostics, setDiagnostics] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results = {
      timestamp: new Date().toISOString(),
      environment: {},
      kvBinding: {},
      globalObjects: {},
      recommendations: []
    };

    try {
      // 检查环境信息
      results.environment = {
        userAgent: navigator.userAgent,
        location: window.location.href,
        isSecureContext: window.isSecureContext,
        hasServiceWorker: 'serviceWorker' in navigator,
        hasCaches: typeof caches !== 'undefined',
        hasRequest: typeof Request !== 'undefined',
        hasResponse: typeof Response !== 'undefined'
      };

      // 检查 KV 绑定
      const kvChecks = [
        { name: 'ENV_CONFIG (global)', check: () => typeof ENV_CONFIG !== 'undefined' && ENV_CONFIG },
        { name: 'globalThis.ENV_CONFIG', check: () => typeof globalThis !== 'undefined' && globalThis.ENV_CONFIG },
        { name: 'window.ENV_CONFIG', check: () => typeof window !== 'undefined' && window.ENV_CONFIG },
        { name: 'self.ENV_CONFIG', check: () => typeof self !== 'undefined' && self.ENV_CONFIG }
      ];

      results.kvBinding = {};
      for (const kvCheck of kvChecks) {
        try {
          const available = kvCheck.check();
          results.kvBinding[kvCheck.name] = {
            available: !!available,
            type: available ? typeof available : 'undefined',
            hasGet: available && typeof available.get === 'function',
            hasPut: available && typeof available.put === 'function',
            hasDelete: available && typeof available.delete === 'function'
          };
        } catch (error) {
          results.kvBinding[kvCheck.name] = {
            available: false,
            error: error.message
          };
        }
      }

      // 检查全局对象
      const globalChecks = {
        'ENV_CONFIG': () => typeof ENV_CONFIG !== 'undefined' ? ENV_CONFIG : undefined,
        'ASSETS': () => typeof ASSETS !== 'undefined' ? ASSETS : undefined,
        '__STATIC_CONTENT_MANIFEST': () => typeof __STATIC_CONTENT_MANIFEST !== 'undefined' ? __STATIC_CONTENT_MANIFEST : undefined,
        'addEventListener': () => typeof addEventListener !== 'undefined' ? addEventListener : undefined,
        'fetch': () => typeof fetch !== 'undefined' ? fetch : undefined,
        'caches': () => typeof caches !== 'undefined' ? caches : undefined,
        'crypto': () => typeof crypto !== 'undefined' ? crypto : undefined
      };

      results.globalObjects = {};
      for (const [globalName, getter] of Object.entries(globalChecks)) {
        try {
          const obj = getter();
          results.globalObjects[globalName] = {
            available: typeof obj !== 'undefined',
            type: typeof obj
          };
        } catch (error) {
          results.globalObjects[globalName] = {
            available: false,
            error: error.message
          };
        }
      }

      // 生成建议
      const hasAnyKV = Object.values(results.kvBinding).some(binding => binding.available);
      
      if (!hasAnyKV) {
        results.recommendations.push({
          type: 'error',
          title: 'KV 绑定未找到',
          description: 'ENV_CONFIG 绑定在任何作用域中都不可用',
          actions: [
            '检查 wrangler.toml 中的 KV 绑定配置',
            '确认在 Cloudflare Pages 设置中添加了 KV 绑定',
            '验证绑定名称是否为 "ENV_CONFIG"',
            '重新部署应用'
          ]
        });
      }

      if (results.environment.location.includes('localhost')) {
        results.recommendations.push({
          type: 'info',
          title: '本地开发环境',
          description: 'KV 绑定在本地开发中不可用，这是正常的',
          actions: [
            '本地开发时会自动使用 localStorage',
            '部署到 Cloudflare Pages 后 KV 将可用'
          ]
        });
      }

      if (!results.environment.isSecureContext) {
        results.recommendations.push({
          type: 'warning',
          title: '非安全上下文',
          description: '某些 Web API 在非 HTTPS 环境中可能不可用',
          actions: ['确保使用 HTTPS 访问应用']
        });
      }

    } catch (error) {
      results.error = error.message;
    }

    setDiagnostics(results);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('诊断信息已复制到剪贴板');
    });
  };

  const getStatusIcon = (status) => {
    if (status === true) return <CheckCircle className="w-4 h-4 text-success-500" />;
    if (status === false) return <AlertCircle className="w-4 h-4 text-danger-500" />;
    return <AlertCircle className="w-4 h-4 text-warning-500" />;
  };

  const getRecommendationIcon = (type) => {
    switch (type) {
      case 'error': return <AlertCircle className="w-5 h-5 text-danger-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-warning-500" />;
      case 'info': return <CheckCircle className="w-5 h-5 text-primary-500" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  if (!diagnostics) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-primary-500" />
          <span>运行 KV 诊断...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Terminal className="w-6 h-6 text-primary-500" />
          <h3 className="text-lg font-semibold text-gray-900">KV 连接诊断</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => copyToClipboard(JSON.stringify(diagnostics, null, 2))}
            className="btn btn-secondary text-sm"
          >
            <Copy className="w-4 h-4 mr-2" />
            复制报告
          </button>
          
          <button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="btn btn-primary text-sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            重新检测
          </button>
        </div>
      </div>

      {/* KV 绑定状态 */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Database className="w-4 h-4" />
          KV 绑定检测
        </h4>
        <div className="space-y-2">
          {Object.entries(diagnostics.kvBinding).map(([name, binding]) => (
            <div key={name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(binding.available)}
                <span className="text-sm font-medium">{name}</span>
              </div>
              <div className="text-sm text-gray-600">
                {binding.available ? (
                  <span className="text-success-600">
                    可用 ({binding.hasGet && binding.hasPut ? '完整功能' : '部分功能'})
                  </span>
                ) : (
                  <span className="text-danger-600">不可用</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 建议 */}
      {diagnostics.recommendations.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">建议和解决方案</h4>
          <div className="space-y-4">
            {diagnostics.recommendations.map((rec, index) => (
              <div key={index} className={`p-4 rounded-lg border ${
                rec.type === 'error' ? 'bg-danger-50 border-danger-200' :
                rec.type === 'warning' ? 'bg-warning-50 border-warning-200' :
                'bg-primary-50 border-primary-200'
              }`}>
                <div className="flex items-start gap-3">
                  {getRecommendationIcon(rec.type)}
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 mb-1">{rec.title}</h5>
                    <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                    <ul className="text-sm space-y-1">
                      {rec.actions.map((action, actionIndex) => (
                        <li key={actionIndex} className="flex items-start gap-2">
                          <span className="text-gray-400 mt-1">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 快速链接 */}
      <div className="pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">相关文档</h4>
        <div className="flex flex-wrap gap-2">
          <a
            href="https://developers.cloudflare.com/pages/functions/bindings/#kv-namespaces"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800"
          >
            <ExternalLink className="w-3 h-3" />
            KV 绑定文档
          </a>
          <a
            href="https://developers.cloudflare.com/kv/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800"
          >
            <ExternalLink className="w-3 h-3" />
            KV 存储文档
          </a>
          <a
            href="https://dash.cloudflare.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800"
          >
            <Settings className="w-3 h-3" />
            Cloudflare 控制台
          </a>
        </div>
      </div>

      {/* 诊断时间 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          诊断时间: {new Date(diagnostics.timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default KVDiagnostics;
