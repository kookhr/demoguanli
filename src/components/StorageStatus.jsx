import React, { useState, useEffect } from 'react';
import {
  Cloud,
  RefreshCw,
  Database,
  CheckCircle
} from 'lucide-react';
import { getEnvironments } from '../utils/configManager';

const StorageStatus = () => {
  const [environmentCount, setEnvironmentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadInfo = async () => {
    setIsLoading(true);
    try {
      const environments = await getEnvironments();
      setEnvironmentCount(environments.length);
    } catch (error) {
      console.error('获取环境信息失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInfo();
  }, []);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Database className="w-5 h-5" />
          存储状态
        </h3>

        <button
          onClick={loadInfo}
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
            <Cloud className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">存储类型</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-primary-600">
              Cloudflare KV
            </span>
            <CheckCircle className="w-4 h-4 text-success-500" />
          </div>
        </div>

        {/* 环境数量 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">环境数量</span>
          <span className="text-sm font-medium text-gray-900">
            {environmentCount} 个
          </span>
        </div>
      </div>

      {/* 说明文字 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          <strong>Cloudflare KV:</strong> 配置存储在全球边缘网络中，通过 Pages Functions API 访问，确保安全性和稳定性。
        </p>
      </div>
    </div>
  );
};

export default StorageStatus;
