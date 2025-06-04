import React, { useState, useEffect } from 'react';
import { getEnvironments } from '../utils/configManager';

const MinimalEnvironmentList = () => {
  const [environments, setEnvironments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadEnvironments();
  }, []);

  const loadEnvironments = async () => {
    try {
      console.log('🔄 开始加载环境配置...');
      setLoading(true);
      setError(null);
      
      const envs = await getEnvironments();
      console.log('✅ 环境配置加载成功:', envs);
      
      setEnvironments(envs);
    } catch (err) {
      console.error('❌ 加载环境配置失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载环境配置中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">加载失败</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadEnvironments}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">环境管理中心</h1>
          <p className="text-gray-600">
            共找到 {environments.length} 个环境配置
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {environments.map(env => (
            <div key={env.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{env.name}</h3>
                  <p className="text-sm text-gray-600">{env.description}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  env.type === 'production' ? 'bg-red-100 text-red-800' :
                  env.type === 'staging' ? 'bg-yellow-100 text-yellow-800' :
                  env.type === 'development' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {env.type}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">URL:</span>
                  <a 
                    href={env.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 truncate ml-2"
                  >
                    {env.url}
                  </a>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">版本:</span>
                  <span className="font-mono">{env.version}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">网络:</span>
                  <span>{env.network === 'internal' ? '内网' : '外网'}</span>
                </div>
              </div>

              {/* 简化的标签显示 */}
              {env.tags && env.tags.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {env.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {env.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                        +{env.tags.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  最后部署: {env.lastDeployed}
                </span>
                <a
                  href={env.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  访问
                </a>
              </div>
            </div>
          ))}
        </div>

        {environments.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">暂无环境配置</div>
            <p className="text-gray-500">请先添加环境配置</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MinimalEnvironmentList;
