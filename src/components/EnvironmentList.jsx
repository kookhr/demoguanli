import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Globe, Shield, Activity } from 'lucide-react';
import EnvironmentCard from './EnvironmentCard';
import EnvironmentFilter from './EnvironmentFilter';
import { getEnvironments } from '../utils/configManager';
import { getNetworkType } from '../utils/networkCheck';

const EnvironmentList = () => {
  const [environments, setEnvironments] = useState([]);
  const [filteredEnvironments, setFilteredEnvironments] = useState([]);
  const [currentNetwork, setCurrentNetwork] = useState('external');

  // 暂时禁用实时监控，使用简单状态管理
  const [environmentStatuses, setEnvironmentStatuses] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);

  // 简单的状态检测函数
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    setRefreshProgress({ completed: 0, total: environments.length, percentage: 0 });

    try {
      // 模拟检测过程
      for (let i = 0; i < environments.length; i++) {
        const env = environments[i];
        setEnvironmentStatuses(prev => ({
          ...prev,
          [env.id]: { status: 'online', lastChecked: new Date().toISOString() }
        }));

        setRefreshProgress({
          completed: i + 1,
          total: environments.length,
          percentage: Math.round(((i + 1) / environments.length) * 100),
          current: env.name
        });

        // 模拟延迟
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setLastRefreshTime(new Date().toISOString());
    } catch (error) {
      console.error('检测失败:', error);
    } finally {
      setIsRefreshing(false);
      setRefreshProgress(null);
    }
  };

  // 简单的状态统计
  const getStatusSummary = () => {
    const summary = {
      total: environments.length,
      online: Object.values(environmentStatuses).filter(s => s.status === 'online').length,
      offline: Object.values(environmentStatuses).filter(s => s.status === 'offline').length,
      timeout: 0,
      error: 0,
      unknown: environments.length - Object.keys(environmentStatuses).length,
      checking: 0
    };
    return summary;
  };

  // 加载环境配置
  useEffect(() => {
    loadEnvironments();
  }, []);

  // 检测当前网络环境
  useEffect(() => {
    const networkType = getNetworkType();
    setCurrentNetwork(networkType);
  }, []);

  const loadEnvironments = async () => {
    try {
      const envs = await getEnvironments();
      setEnvironments(envs);
      setFilteredEnvironments(envs);
    } catch (error) {
      console.error('加载环境配置失败:', error);
      setEnvironments([]);
      setFilteredEnvironments([]);
    }
  };

  // 处理过滤变化 - 使用 useCallback 避免无限循环
  const handleFilterChange = useCallback((filtered) => {
    setFilteredEnvironments(filtered);
  }, []);

  // 获取统计信息
  const statusSummary = getStatusSummary();
  const stats = {
    total: environments.length,
    online: statusSummary.online,
    internal: environments.filter(env => env.network === 'internal').length,
    external: environments.filter(env => env.network === 'external').length,
    offline: statusSummary.offline + statusSummary.timeout + statusSummary.error,
    checking: statusSummary.checking
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 border-b border-primary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">环境管理中心</h1>
              <p className="text-gray-600">
                快速访问和管理多套环境，当前网络:
                <span className={`ml-1 font-semibold px-2 py-1 rounded-full text-xs ${
                  currentNetwork === 'internal'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-success-100 text-success-700'
                }`}>
                  {currentNetwork === 'internal' ? '内网环境' : '外网环境'}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isRefreshing && refreshProgress.total > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Activity className="w-4 h-4 animate-pulse" />
                  <span>
                    {refreshProgress.completed}/{refreshProgress.total}
                  </span>
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 transition-all duration-300"
                      style={{ width: `${(refreshProgress.completed / refreshProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleRefreshAll}
                disabled={isRefreshing}
                className="btn btn-primary"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? '检测中...' : '检测所有'}
              </button>

              {lastRefreshTime && !isRefreshing && (
                <span className="text-xs text-gray-500">
                  上次检测: {lastRefreshTime.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card card-hover p-6 animate-fade-in">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">{stats.total}</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">总环境数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="card card-hover p-6 animate-fade-in" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">{stats.online}</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">在线环境</p>
                <p className="text-2xl font-bold text-gray-900">{stats.online}</p>
              </div>
            </div>
          </div>

          <div className="card card-hover p-6 animate-fade-in" style={{animationDelay: '0.2s'}}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">内网环境</p>
                <p className="text-2xl font-bold text-gray-900">{stats.internal}</p>
              </div>
            </div>
          </div>

          <div className="card card-hover p-6 animate-fade-in" style={{animationDelay: '0.3s'}}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-success-400 to-success-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Globe className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">外网环境</p>
                <p className="text-2xl font-bold text-gray-900">{stats.external}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 搜索和过滤 */}
        <EnvironmentFilter
          environments={environments}
          onFilterChange={handleFilterChange}
          className="mb-8"
        />

        {/* 旧的搜索和过滤 - 暂时保留 */}
        <div className="card p-6 mb-8 animate-fade-in" style={{display: 'none'}}>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="搜索环境名称、描述或类型..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>

            {/* 网络过滤 */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterNetwork}
                onChange={(e) => setFilterNetwork(e.target.value)}
                className="input-field w-auto min-w-[120px]"
              >
                <option value="all">所有网络</option>
                <option value="internal">内网</option>
                <option value="external">外网</option>
              </select>
            </div>

            {/* 状态过滤 */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field w-auto min-w-[120px]"
              >
                <option value="all">所有状态</option>
                <option value="online">在线</option>
                <option value="offline">离线</option>
                <option value="timeout">超时</option>
                <option value="error">错误</option>
                <option value="reachable">可达</option>
                <option value="unknown">未检测</option>
              </select>
            </div>
          </div>
        </div>

        {/* 环境列表 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredEnvironments.length > 0 ? (
            filteredEnvironments.map(env => (
              <EnvironmentCard
                key={env.id}
                environment={env}
                currentNetwork={currentNetwork}
                status={environmentStatuses[env.id]}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 text-lg mb-2">没有找到匹配的环境</div>
              <p className="text-gray-500">请尝试调整搜索条件或过滤器</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnvironmentList;
