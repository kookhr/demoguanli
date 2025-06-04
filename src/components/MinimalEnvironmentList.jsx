import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Activity, Clock, Wifi, WifiOff } from 'lucide-react';
import { getEnvironments } from '../utils/configManager';
import SimpleEnvironmentFilter from './SimpleEnvironmentFilter';
import SimpleTagList from './SimpleTagList';
import {
  checkMultipleEnvironments,
  checkEnvironmentStatus,
  getStatusText,
  getStatusColor,
  formatResponseTime,
  formatLastChecked
} from '../utils/simpleStatusCheck';

const MinimalEnvironmentList = () => {
  const [environments, setEnvironments] = useState([]);
  const [filteredEnvironments, setFilteredEnvironments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 状态检测相关状态
  const [environmentStatuses, setEnvironmentStatuses] = useState({});
  const [isChecking, setIsChecking] = useState(false);
  const [checkProgress, setCheckProgress] = useState(null);
  const [lastCheckTime, setLastCheckTime] = useState(null);

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
      setFilteredEnvironments(envs);
    } catch (err) {
      console.error('❌ 加载环境配置失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 处理过滤变化 - 使用 useCallback 避免无限循环
  const handleFilterChange = useCallback((filtered) => {
    console.log('🔍 过滤结果更新:', filtered.length, '个环境');
    setFilteredEnvironments(filtered);
  }, []);

  // 检测单个环境状态
  const handleCheckSingle = async (environment) => {
    console.log(`🔍 检测单个环境: ${environment.name}`);

    setEnvironmentStatuses(prev => ({
      ...prev,
      [environment.id]: { ...prev[environment.id], isChecking: true }
    }));

    try {
      const result = await checkEnvironmentStatus(environment);
      setEnvironmentStatuses(prev => ({
        ...prev,
        [environment.id]: { ...result, isChecking: false }
      }));
    } catch (error) {
      console.error(`检测环境 ${environment.name} 失败:`, error);
      setEnvironmentStatuses(prev => ({
        ...prev,
        [environment.id]: {
          id: environment.id,
          status: 'error',
          error: error.message,
          lastChecked: new Date().toISOString(),
          isChecking: false
        }
      }));
    }
  };

  // 批量检测所有环境状态
  const handleCheckAll = async () => {
    if (isChecking || environments.length === 0) return;

    console.log('🚀 开始批量检测所有环境');
    setIsChecking(true);
    setCheckProgress({ completed: 0, total: environments.length, percentage: 0 });

    try {
      const results = await checkMultipleEnvironments(environments, (progress) => {
        setCheckProgress(progress);
      });

      setEnvironmentStatuses(results);
      setLastCheckTime(new Date().toISOString());
      console.log('✅ 批量检测完成');
    } catch (error) {
      console.error('❌ 批量检测失败:', error);
    } finally {
      setIsChecking(false);
      setCheckProgress(null);
    }
  };

  // 获取环境状态
  const getEnvironmentStatus = (envId) => {
    return environmentStatuses[envId] || { status: 'unknown', isChecking: false };
  };

  // 获取状态统计
  const getStatusSummary = () => {
    const summary = {
      total: environments.length,
      online: 0,
      offline: 0,
      timeout: 0,
      error: 0,
      unknown: 0,
      checking: 0
    };

    environments.forEach(env => {
      const status = getEnvironmentStatus(env.id);
      if (status.isChecking) {
        summary.checking++;
      } else {
        summary[status.status] = (summary[status.status] || 0) + 1;
      }
    });

    return summary;
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

        {/* 状态监控面板 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              环境状态监控
            </h3>

            <div className="flex items-center gap-3">
              {lastCheckTime && (
                <span className="text-sm text-gray-500">
                  最后检测: {formatLastChecked(lastCheckTime)}
                </span>
              )}

              <button
                onClick={handleCheckAll}
                disabled={isChecking || environments.length === 0}
                className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                {isChecking ? '检测中...' : '检测所有'}
              </button>
            </div>
          </div>

          {/* 进度条 */}
          {isChecking && checkProgress && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>检测进度: {checkProgress.current || '准备中...'}</span>
                <span>{checkProgress.completed}/{checkProgress.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${checkProgress.percentage || 0}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* 状态统计 */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {(() => {
              const summary = getStatusSummary();
              return (
                <>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
                    <div className="text-sm text-gray-500">总计</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{summary.online}</div>
                    <div className="text-sm text-gray-500">在线</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{summary.offline + summary.error}</div>
                    <div className="text-sm text-gray-500">离线</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{summary.timeout}</div>
                    <div className="text-sm text-gray-500">超时</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{summary.checking}</div>
                    <div className="text-sm text-gray-500">检测中</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{summary.unknown}</div>
                    <div className="text-sm text-gray-500">未知</div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* 搜索和过滤 */}
        <SimpleEnvironmentFilter
          environments={environments}
          onFilterChange={handleFilterChange}
          className="mb-8"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredEnvironments.map(env => {
            const envStatus = getEnvironmentStatus(env.id);
            return (
              <div key={env.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">{env.name}</h3>
                      {/* 状态指示器 */}
                      <div className="flex items-center gap-1">
                        {envStatus.isChecking ? (
                          <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                        ) : envStatus.status === 'online' ? (
                          <Wifi className="w-4 h-4 text-green-600" />
                        ) : envStatus.status === 'unknown' ? (
                          <Clock className="w-4 h-4 text-gray-400" />
                        ) : (
                          <WifiOff className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(envStatus.status)}`}>
                          {getStatusText(envStatus.status)}
                        </span>
                      </div>
                    </div>
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
                {/* 状态详情 */}
                {envStatus.responseTime && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">响应时间:</span>
                    <span className="font-mono">{formatResponseTime(envStatus.responseTime)}</span>
                  </div>
                )}
                {envStatus.lastChecked && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">最后检测:</span>
                    <span>{formatLastChecked(envStatus.lastChecked)}</span>
                  </div>
                )}
                {envStatus.error && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">错误:</span>
                    <span className="text-red-600 text-xs">{envStatus.error}</span>
                  </div>
                )}
              </div>

              {/* 标签显示 */}
              {env.tags && env.tags.length > 0 && (
                <div className="mb-4">
                  <SimpleTagList
                    tags={env.tags}
                    maxVisible={4}
                    size="xs"
                  />
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  最后部署: {env.lastDeployed}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCheckSingle(env)}
                    disabled={envStatus.isChecking}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200 disabled:opacity-50 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${envStatus.isChecking ? 'animate-spin' : ''}`} />
                    检测
                  </button>
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
              </div>
            );
          })}
        </div>

        {filteredEnvironments.length === 0 && environments.length > 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">没有找到匹配的环境</div>
            <p className="text-gray-500">请尝试调整搜索条件或过滤器</p>
          </div>
        )}

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
