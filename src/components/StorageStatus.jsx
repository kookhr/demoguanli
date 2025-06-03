import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  HardDrive, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Database,
  CheckCircle,
  AlertCircle,
  Upload
} from 'lucide-react';
import { getStorageInfo, syncToKV } from '../utils/configManager';

const StorageStatus = () => {
  const [storageInfo, setStorageInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const loadStorageInfo = async () => {
    setIsLoading(true);
    try {
      const info = await getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error('获取存储信息失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncToKV = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    
    try {
      const result = await syncToKV();
      setSyncResult({
        success: true,
        message: `成功同步 ${result.synced} 个环境配置到 KV 存储`
      });
      
      // 重新加载存储信息
      await loadStorageInfo();
    } catch (error) {
      setSyncResult({
        success: false,
        message: `同步失败: ${error.message}`
      });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadStorageInfo();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>检测存储状态...</span>
      </div>
    );
  }

  if (!storageInfo) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600">
        <AlertCircle className="w-4 h-4" />
        <span>无法获取存储信息</span>
      </div>
    );
  }

  const StorageIcon = storageInfo.storage === 'cloudflare-kv' ? Cloud : HardDrive;
  const NetworkIcon = storageInfo.isKVAvailable ? Wifi : WifiOff;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Database className="w-5 h-5" />
          存储状态
        </h3>
        
        <button
          onClick={loadStorageInfo}
          disabled={isLoading}
          className="text-sm text-primary-600 hover:text-primary-800 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-3">
        {/* 存储类型 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StorageIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">存储类型</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${
              storageInfo.storage === 'cloudflare-kv' 
                ? 'text-primary-600' 
                : 'text-gray-600'
            }`}>
              {storageInfo.storage === 'cloudflare-kv' ? 'Cloudflare KV' : 'Local Storage'}
            </span>
            {storageInfo.storage === 'cloudflare-kv' && (
              <CheckCircle className="w-4 h-4 text-success-500" />
            )}
          </div>
        </div>

        {/* KV 可用性 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <NetworkIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">KV 连接</span>
          </div>
          <span className={`text-sm font-medium ${
            storageInfo.isKVAvailable ? 'text-success-600' : 'text-gray-600'
          }`}>
            {storageInfo.isKVAvailable ? '可用' : '不可用'}
          </span>
        </div>

        {/* 环境数量 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">环境数量</span>
          <span className="text-sm font-medium text-gray-900">
            {storageInfo.environmentCount} 个
          </span>
        </div>

        {/* 最后更新时间 */}
        {storageInfo.lastUpdate && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">最后更新</span>
            <span className="text-sm text-gray-500">
              {new Date(storageInfo.lastUpdate).toLocaleString()}
            </span>
          </div>
        )}

        {/* 同步到 KV 按钮 */}
        {storageInfo.isKVAvailable && storageInfo.storage !== 'cloudflare-kv' && (
          <div className="pt-3 border-t border-gray-200">
            <button
              onClick={handleSyncToKV}
              disabled={isSyncing}
              className="w-full btn btn-primary text-sm"
            >
              <Upload className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-pulse' : ''}`} />
              {isSyncing ? '同步中...' : '同步到 KV 存储'}
            </button>
          </div>
        )}

        {/* 同步结果 */}
        {syncResult && (
          <div className={`p-3 rounded-lg text-sm ${
            syncResult.success 
              ? 'bg-success-50 text-success-800 border border-success-200'
              : 'bg-danger-50 text-danger-800 border border-danger-200'
          }`}>
            <div className="flex items-center gap-2">
              {syncResult.success ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span>{syncResult.message}</span>
            </div>
          </div>
        )}
      </div>

      {/* 说明文字 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          {storageInfo.storage === 'cloudflare-kv' ? (
            <>
              <strong>Cloudflare KV:</strong> 配置存储在全球边缘网络中，支持多用户共享和实时同步。
            </>
          ) : (
            <>
              <strong>Local Storage:</strong> 配置仅存储在本地浏览器中。部署到 Cloudflare Pages 后可启用 KV 存储。
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default StorageStatus;
