import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Activity } from 'lucide-react';
import { getEnvironments } from '../utils/configManager';
import { getNetworkType } from '../utils/networkCheck';
import SimpleEnvironmentFilter from './SimpleEnvironmentFilter';
import StyledEnvironmentCard from './StyledEnvironmentCard';
import {
  checkMultipleEnvironments,
  checkEnvironmentStatus,
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
  const [currentNetwork, setCurrentNetwork] = useState('external');

  useEffect(() => {
    loadEnvironments();
    detectNetwork();
  }, []);

  // 页面加载完成后自动检测状态
  useEffect(() => {
    if (environments.length > 0) {
      console.log('🚀 页面加载完成，开始自动状态检测...');
      // 延迟1秒后开始检测，确保页面渲染完成
      const timer = setTimeout(() => {
        handleCheckAll();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [environments]);

  // 监听页面可见性变化，当用户回到页面时重新检测
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && environments.length > 0) {
        console.log('👀 页面重新可见，开始状态检测...');
        // 延迟500ms后检测，避免频繁切换
        setTimeout(() => {
          if (!isChecking) {
            handleCheckAll();
          }
        }, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [environments, isChecking]);

  // 检测当前网络环境
  const detectNetwork = async () => {
    try {
      const network = await getNetworkType();
      setCurrentNetwork(network);
      console.log('🌐 当前网络环境:', network);
    } catch (error) {
      console.error('网络检测失败:', error);
      setCurrentNetwork('external'); // 默认外网
    }
  };

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
      {/* 头部 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">环境管理中心</h1>
              <p className="text-gray-600 mt-2">
                管理和访问多套环境配置 • 当前网络: {currentNetwork === 'internal' ? '内网' : '外网'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                共 {environments.length} 个环境
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

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
          {filteredEnvironments.map(env => (
            <StyledEnvironmentCard
              key={env.id}
              environment={env}
              currentNetwork={currentNetwork}
              status={getEnvironmentStatus(env.id)}
              onStatusCheck={handleCheckSingle}
            />
          ))}
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
