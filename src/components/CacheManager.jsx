import { useState, useEffect } from 'react';
import { RefreshCw, Trash2, Zap, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from './EnhancedToast';

const CacheManager = () => {
  const [cacheStatus, setCacheStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const { success, error, info } = useToast();

  // 获取缓存状态
  const fetchCacheStatus = async () => {
    try {
      const response = await fetch('/api/cache/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCacheStatus(data);
        setLastUpdate(new Date().toISOString());
      }
    } catch (err) {
      console.error('获取缓存状态失败:', err);
    }
  };

  // 清除所有缓存
  const clearAllCaches = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cache/clear', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        success('所有缓存已清除', { 
          action: { 
            label: '刷新页面', 
            onClick: () => window.location.reload() 
          } 
        });
        await fetchCacheStatus();
      } else {
        const errorData = await response.json();
        error(errorData.error || '清除缓存失败');
      }
    } catch (err) {
      error('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 启用强制刷新
  const enableForceRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cache/force-refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        success(`强制刷新已启用，持续${data.duration / 60}分钟`, {
          action: { 
            label: '刷新页面', 
            onClick: () => window.location.reload() 
          }
        });
        await fetchCacheStatus();
      } else {
        const errorData = await response.json();
        error(errorData.error || '启用强制刷新失败');
      }
    } catch (err) {
      error('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 清除特定URL缓存
  const purgeSpecificCache = async (urls) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cache/purge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ urls })
      });

      if (response.ok) {
        const data = await response.json();
        const successCount = data.results.filter(r => r.deleted).length;
        success(`已清除 ${successCount} 个URL的缓存`);
        await fetchCacheStatus();
      } else {
        const errorData = await response.json();
        error(errorData.error || '清除特定缓存失败');
      }
    } catch (err) {
      error('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 检查版本更新
  const checkForUpdates = async () => {
    try {
      const response = await fetch('/api/info');
      if (response.ok) {
        const data = await response.json();
        const serverVersion = data.version;
        const clientVersion = window.__APP_VERSION__ || 'unknown';
        
        if (serverVersion !== clientVersion) {
          info(`发现新版本 ${serverVersion}，当前版本 ${clientVersion}`, {
            duration: 0,
            action: {
              label: '立即更新',
              onClick: () => {
                clearAllCaches();
                setTimeout(() => window.location.reload(), 1000);
              }
            }
          });
        } else {
          success('当前已是最新版本');
        }
      }
    } catch (err) {
      error('检查更新失败');
    }
  };

  useEffect(() => {
    fetchCacheStatus();
    
    // 每30秒检查一次缓存状态
    const interval = setInterval(fetchCacheStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (timestamp) => {
    if (!timestamp) return '未知';
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时`;
    return `${Math.floor(seconds / 86400)}天`;
  };

  if (!cacheStatus) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              缓存管理
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              管理系统缓存和版本更新
            </p>
          </div>
        </div>
        
        <button
          onClick={fetchCacheStatus}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 版本信息 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-blue-500" />
            <span className="font-medium text-gray-900 dark:text-white">版本信息</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">当前版本:</span>
              <span className="font-mono text-gray-900 dark:text-white">{cacheStatus.version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">构建时间:</span>
              <span className="text-gray-900 dark:text-white">{formatTime(cacheStatus.buildTime)}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            {cacheStatus.forceRefresh.active ? (
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
            <span className="font-medium text-gray-900 dark:text-white">刷新状态</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">强制刷新:</span>
              <span className={`font-medium ${
                cacheStatus.forceRefresh.active 
                  ? 'text-yellow-600 dark:text-yellow-400' 
                  : 'text-green-600 dark:text-green-400'
              }`}>
                {cacheStatus.forceRefresh.active ? '启用中' : '未启用'}
              </span>
            </div>
            {cacheStatus.forceRefresh.active && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">结束时间:</span>
                <span className="text-gray-900 dark:text-white">
                  {formatTime(cacheStatus.forceRefresh.until)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 缓存配置 */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">缓存配置</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(cacheStatus.cacheConfig).map(([key, value]) => (
            <div key={key} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                {key === 'staticAssets' ? '静态资源' :
                 key === 'apiResponses' ? 'API响应' :
                 key === 'healthCheck' ? '健康检查' :
                 key === 'kvCache' ? 'KV缓存' : key}
              </div>
              <div className="font-mono text-sm text-gray-900 dark:text-white">
                {formatDuration(value)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={checkForUpdates}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Info className="w-4 h-4" />
          检查更新
        </button>

        <button
          onClick={enableForceRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
        >
          <Zap className="w-4 h-4" />
          强制刷新
        </button>

        <button
          onClick={clearAllCaches}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          清除缓存
        </button>

        <button
          onClick={() => purgeSpecificCache([window.location.origin])}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          清除当前页面
        </button>
      </div>

      {lastUpdate && (
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          最后更新: {formatTime(lastUpdate)}
        </div>
      )}
    </div>
  );
};

export default CacheManager;
