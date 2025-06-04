import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Download
} from 'lucide-react';
import { 
  generateTrendData, 
  calculateAvailabilityStats, 
  getStatusChangeEvents,
  exportHistory 
} from '../utils/statusHistory';

const StatusHistoryChart = ({ environmentId, environment }) => {
  const [trendData, setTrendData] = useState([]);
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [timeRange, setTimeRange] = useState(24);
  const [viewMode, setViewMode] = useState('availability'); // availability, responseTime, events

  useEffect(() => {
    if (environmentId) {
      updateData();
    }
  }, [environmentId, timeRange]);

  const updateData = () => {
    const trend = generateTrendData(environmentId, timeRange);
    const statistics = calculateAvailabilityStats(environmentId, timeRange);
    const statusEvents = getStatusChangeEvents(environmentId, timeRange);
    
    setTrendData(trend);
    setStats(statistics);
    setEvents(statusEvents);
  };

  const formatTime = (hourKey) => {
    const date = new Date(hourKey + ':00:00Z');
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
      case 'reachable':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'offline':
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'timeout':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'online': '在线',
      'offline': '离线',
      'timeout': '超时',
      'error': '错误',
      'reachable': '可达'
    };
    return statusMap[status] || status;
  };

  if (!stats) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-500">加载历史数据中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* 头部控制 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {environment?.name} - 状态历史
          </h3>
          
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value={1}>最近1小时</option>
              <option value={6}>最近6小时</option>
              <option value={24}>最近24小时</option>
            </select>
            
            <button
              onClick={() => exportHistory(environmentId)}
              className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
              title="导出历史数据"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 视图模式切换 */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('availability')}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === 'availability' 
                ? 'bg-blue-100 text-blue-800' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            可用性
          </button>
          <button
            onClick={() => setViewMode('responseTime')}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === 'responseTime' 
                ? 'bg-blue-100 text-blue-800' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            响应时间
          </button>
          <button
            onClick={() => setViewMode('events')}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === 'events' 
                ? 'bg-blue-100 text-blue-800' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            状态变化
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* 统计概览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.availability}%
            </div>
            <div className="text-sm text-gray-500">可用性</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.averageResponseTime}ms
            </div>
            <div className="text-sm text-gray-500">平均响应时间</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalChecks}
            </div>
            <div className="text-sm text-gray-500">总检测次数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {stats.downtimeCount}
            </div>
            <div className="text-sm text-gray-500">故障次数</div>
          </div>
        </div>

        {/* 图表区域 */}
        {viewMode === 'availability' && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">可用性趋势</h4>
            <div className="h-32 flex items-end gap-1">
              {trendData.map((data, index) => {
                const availability = data.total > 0 ? (data.online / data.total) * 100 : 0;
                const height = Math.max(availability, 5); // 最小高度5%
                
                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center group relative"
                  >
                    <div
                      className={`w-full rounded-t transition-all duration-200 ${
                        availability >= 95 ? 'bg-green-500' :
                        availability >= 80 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                    
                    {/* 悬浮提示 */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                      {formatTime(data.hour)}<br/>
                      可用性: {availability.toFixed(1)}%<br/>
                      检测: {data.online}/{data.total}
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-left">
                      {formatTime(data.hour)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'responseTime' && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">响应时间趋势</h4>
            <div className="h-32 flex items-end gap-1">
              {trendData.map((data, index) => {
                const maxResponseTime = Math.max(...trendData.map(d => d.avgResponseTime));
                const height = maxResponseTime > 0 ? (data.avgResponseTime / maxResponseTime) * 100 : 0;
                
                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center group relative"
                  >
                    <div
                      className={`w-full rounded-t transition-all duration-200 ${
                        data.avgResponseTime <= 200 ? 'bg-green-500' :
                        data.avgResponseTime <= 1000 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                    
                    {/* 悬浮提示 */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                      {formatTime(data.hour)}<br/>
                      响应时间: {data.avgResponseTime}ms
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-left">
                      {formatTime(data.hour)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'events' && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">状态变化事件</h4>
            <div className="max-h-64 overflow-y-auto">
              {events.length > 0 ? (
                <div className="space-y-2">
                  {events.map((event, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(event.from)}
                        <span className="text-sm">→</span>
                        {getStatusIcon(event.to)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm">
                          {getStatusText(event.from)} → {getStatusText(event.to)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(event.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  在选定时间范围内没有状态变化
                </div>
              )}
            </div>
          </div>
        )}

        {/* 最后故障时间 */}
        {stats.lastDowntime && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">
                最后故障时间: {formatDate(stats.lastDowntime)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusHistoryChart;
