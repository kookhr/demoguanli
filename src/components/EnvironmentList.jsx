import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, Activity, Star, BarChart3 } from 'lucide-react';
import { getEnvironments } from '../utils/configManager';
import { addStatusRecord } from '../utils/statusHistory';
import { formatLastChecked } from '../utils/common';
import {
  getFavorites,
  toggleFavorite,
  isFavorite,
  sortEnvironments
} from '../utils/favorites';
import {
  checkEnvironmentStatus,
  checkMultipleEnvironments
} from '../utils/simpleNetworkCheck';
import EnvironmentFilter from './EnvironmentFilter';
import EnvironmentCard from './EnvironmentCard';
import StatusHistoryChart from './StatusHistoryChart';
import ContextMenu, { useContextMenu } from './ContextMenu';

const EnvironmentList = () => {
  const [environments, setEnvironments] = useState([]);
  const [filteredEnvironments, setFilteredEnvironments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 状态检测相关状态
  const [environmentStatuses, setEnvironmentStatuses] = useState({});
  const [isChecking, setIsChecking] = useState(false);
  const [checkProgress, setCheckProgress] = useState(null);
  const [lastCheckTime, setLastCheckTime] = useState(null);

  // 新功能状态
  const [favorites, setFavorites] = useState([]);
  const [sortBy, setSortBy] = useState('custom');
  const [showHistory, setShowHistory] = useState(false);
  const [selectedEnvironmentForHistory, setSelectedEnvironmentForHistory] = useState(null);



  // 右键菜单
  const { contextMenu, openContextMenu, closeContextMenu } = useContextMenu();

  useEffect(() => {
    loadEnvironments();
    setFavorites(getFavorites());
  }, []);



  // 页面加载完成后自动检测状态
  useEffect(() => {
    if (environments.length > 0) {
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



  const loadEnvironments = async () => {
    try {
      setLoading(true);
      setError(null);

      const envs = await getEnvironments();

      setEnvironments(envs);
      setFilteredEnvironments(envs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 处理过滤变化 - 使用 useCallback 避免无限循环
  const handleFilterChange = useCallback((filtered) => {
    setFilteredEnvironments(filtered);
  }, []);

  // 检测单个环境状态
  const handleCheckSingle = useCallback(async (environment) => {

    setEnvironmentStatuses(prev => ({
      ...prev,
      [environment.id]: { ...prev[environment.id], isChecking: true }
    }));

    try {
      // 使用精确检测方法
      const result = await checkEnvironmentStatus(environment);

      setEnvironmentStatuses(prev => ({
        ...prev,
        [environment.id]: { ...result, isChecking: false }
      }));

      // 记录状态历史
      addStatusRecord(environment.id, result);
    } catch (error) {
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
  }, []);

  // 批量检测所有环境状态
  const handleCheckAll = useCallback(async () => {
    if (isChecking || environments.length === 0) return;
    setIsChecking(true);
    setCheckProgress({ completed: 0, total: environments.length, percentage: 0 });

    try {
      // 使用精确检测方法
      const results = await checkMultipleEnvironments(environments, (progress) => {
        setCheckProgress(progress);
      });

      setEnvironmentStatuses(results);
      setLastCheckTime(new Date().toISOString());
    } catch {
      // 批量检测失败，保持静默
    } finally {
      setIsChecking(false);
      setCheckProgress(null);
    }
  }, [environments]);

  // 获取环境状态 - 使用useCallback优化
  const getEnvironmentStatus = useCallback((envId) => {
    return environmentStatuses[envId] || { status: 'unknown', isChecking: false };
  }, [environmentStatuses]);

  // 获取状态统计 - 极简版
  const statusSummary = useMemo(() => {
    const summary = {
      total: environments.length,
      available: 0,
      unreachable: 0,
      checking: 0
    };

    environments.forEach(env => {
      const status = getEnvironmentStatus(env.id);
      if (status.isChecking) {
        summary.checking++;
      } else {
        // 只有两种状态：可达或不可达
        switch (status.status) {
          case 'available':
          case 'online':
          case 'cors-bypassed':
          case 'image-reachable':
          case 'port-reachable':
          case 'assumed-reachable':
          case 'reachable-unverified':
          case 'mixed-content-service-reachable':
            summary.available++;
            break;
          case 'unreachable':
          case 'offline':
          case 'error':
          case 'server-error':
          case 'timeout':
          case 'unknown':
          case 'mixed-content-service-unreachable':
          default:
            summary.unreachable++;
            break;
        }
      }
    });

    return summary;
  }, [environments, environmentStatuses, getEnvironmentStatus]);

  // 右键菜单操作处理 - 使用useCallback优化
  const handleContextMenuAction = useCallback((action, environment) => {
    switch (action) {
      case 'check_status':
        handleCheckSingle(environment);
        break;
      case 'visit':
        window.open(environment.url, '_blank');
        break;
      case 'toggle_favorite': {
        const newFavorites = toggleFavorite(environment.id);
        setFavorites(newFavorites);
        break;
      }
      case 'view_history':
        setSelectedEnvironmentForHistory(environment);
        setShowHistory(true);
        break;
      default:
        break;
    }
  }, [handleCheckSingle]);

  // 应用排序和收藏 - 使用useMemo优化
  const sortedEnvironments = useMemo(() => {
    return sortEnvironments(filteredEnvironments, sortBy);
  }, [filteredEnvironments, sortBy]);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* 头部 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">环境管理中心</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                管理和访问多套环境配置
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                共 {environments.length} 个环境 • {favorites.length} 个收藏
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="custom">自定义排序</option>
                  <option value="favorites">收藏优先</option>
                  <option value="name">按名称</option>
                  <option value="type">按类型</option>
                  <option value="network">按网络</option>
                </select>

                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={`p-2 rounded transition-colors ${
                    showHistory
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title="切换历史面板 (Ctrl+Shift+H)"
                >
                  <BarChart3 className="w-4 h-4" />
                </button>




              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* 状态监控面板 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 transition-colors duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              环境状态监控
            </h3>

            <div className="flex items-center gap-3">
              {lastCheckTime && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
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
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>检测进度: {checkProgress.current || '准备中...'}</span>
                <span>{checkProgress.completed}/{checkProgress.total}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${checkProgress.percentage || 0}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* 状态统计 - 极简版 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{statusSummary.total}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">总计</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{statusSummary.available}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">可达</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{statusSummary.unreachable}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">不可达</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{statusSummary.checking}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">检测中</div>
            </div>
          </div>
        </div>

        {/* 搜索和过滤 */}
        <EnvironmentFilter
          environments={environments}
          onFilterChange={handleFilterChange}
          className="mb-8"
        />

        {/* 历史面板 */}
        {showHistory && selectedEnvironmentForHistory && (
          <div className="mb-6">
            <StatusHistoryChart
              environmentId={selectedEnvironmentForHistory.id}
              environment={selectedEnvironmentForHistory}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedEnvironments.map(env => (
            <div
              key={env.id}
              onContextMenu={(e) => openContextMenu(e, env)}
              className="relative"
            >
              <EnvironmentCard
                environment={env}
                status={getEnvironmentStatus(env.id)}
                onStatusCheck={handleCheckSingle}
              />

              {/* 收藏标识 */}
              {isFavorite(env.id) && (
                <div className="absolute top-2 right-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredEnvironments.length === 0 && environments.length > 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-lg mb-2">没有找到匹配的环境</div>
            <p className="text-gray-500 dark:text-gray-400">请尝试调整搜索条件或过滤器</p>
          </div>
        )}

        {environments.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-lg mb-2">暂无环境配置</div>
            <p className="text-gray-500 dark:text-gray-400">请先添加环境配置</p>
          </div>
        )}

        {/* 右键菜单 */}
        <ContextMenu
          isOpen={contextMenu.isOpen}
          position={contextMenu.position}
          environment={contextMenu.environment}
          onClose={closeContextMenu}
          onAction={handleContextMenuAction}
          isFavorite={contextMenu.environment ? isFavorite(contextMenu.environment.id) : false}
        />




      </div>
    </div>
  );
};

export default EnvironmentList;
