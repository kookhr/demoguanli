import React, { useState } from 'react';
import {
  Globe,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Server,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Wifi,
  Clock,
  Activity
} from 'lucide-react';
import { SimpleTagList } from './SimpleTagList';
import { 
  getStatusText, 
  getStatusColor, 
  formatResponseTime, 
  formatLastChecked 
} from '../utils/simpleStatusCheck';

const OptimizedEnvironmentCard = ({ environment, status, onStatusCheck }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // 获取状态信息
  const getStatusInfo = (status) => {
    switch (status?.status) {
      case 'online':
        return {
          icon: CheckCircle,
          color: 'text-success-600 dark:text-success-400',
          bg: 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-700',
          text: '在线',
          description: '服务正常运行'
        };
      case 'offline':
        return {
          icon: XCircle,
          color: 'text-danger-600 dark:text-danger-400',
          bg: 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-700',
          text: '离线',
          description: '服务无法访问'
        };
      case 'timeout':
        return {
          icon: AlertTriangle,
          color: 'text-warning-600 dark:text-warning-400',
          bg: 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-700',
          text: '超时',
          description: '响应超时'
        };
      case 'blocked':
        return {
          icon: Shield,
          color: 'text-purple-600 dark:text-purple-400',
          bg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700',
          text: '被阻止',
          description: 'Mixed Content阻止'
        };
      case 'error':
        return {
          icon: XCircle,
          color: 'text-danger-600 dark:text-danger-400',
          bg: 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-700',
          text: '错误',
          description: '检测出错'
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-500 dark:text-gray-400',
          bg: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600',
          text: '未知',
          description: '状态未知'
        };
    }
  };

  // 获取环境类型样式
  const getTypeStyle = (type) => {
    switch (type) {
      case '生产环境':
        return 'badge-primary';
      case '预生产环境':
        return 'badge-warning';
      case '测试环境':
        return 'badge-info';
      case '开发环境':
        return 'badge-success';
      case '演示环境':
        return 'badge-gray';
      default:
        return 'badge-gray';
    }
  };

  // 获取状态边框颜色
  const getStatusBorderColor = (status) => {
    if (status?.isChecking) {
      return 'border-blue-400 dark:border-blue-500';
    }

    switch (status?.status) {
      case 'online':
        return 'border-success-500 dark:border-success-400';
      case 'offline':
      case 'error':
        return 'border-danger-500 dark:border-danger-400';
      case 'timeout':
        return 'border-warning-500 dark:border-warning-400';
      case 'blocked':
        return 'border-purple-500 dark:border-purple-400';
      case 'reachable':
        return 'border-primary-500 dark:border-primary-400';
      default:
        return 'border-gray-300 dark:border-gray-600';
    }
  };

  const isChecking = status?.isChecking || false;
  const statusInfo = getStatusInfo(status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className={`card card-hover animate-fade-in border-l-4 ${getStatusBorderColor(status)} ${
      isChecking ? 'animate-pulse' : ''
    }`}>
      <div className="p-4">
        {/* 主要信息区 - 水平布局 */}
        <div className="flex items-center justify-between mb-3">
          {/* 左侧：环境信息 */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* 环境名称和类型 */}
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                {environment.name}
              </h3>
              <span className={`badge ${getTypeStyle(environment.type)} flex-shrink-0`}>
                {environment.type}
              </span>
            </div>

            {/* 状态信息 - 内联显示 */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${statusInfo.bg}`}>
              <StatusIcon className={`w-4 h-4 ${statusInfo.color} flex-shrink-0 ${isChecking ? 'animate-spin' : ''}`} />
              <span className={`text-sm font-medium ${statusInfo.color}`}>
                {isChecking ? '检测中...' : statusInfo.text}
              </span>
              {!isChecking && status?.responseTime && (
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  {formatResponseTime(status.responseTime)}
                </span>
              )}
            </div>

            {/* 版本信息 */}
            {environment.version && (
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono flex-shrink-0">
                v{environment.version}
              </span>
            )}
          </div>

          {/* 右侧：操作区 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* 网络类型 */}
            <div className="p-1.5 rounded bg-gray-100 dark:bg-gray-700" title={environment.network === 'internal' ? '内网环境' : '外网环境'}>
              {environment.network === 'internal' ? (
                <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              ) : (
                <Globe className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              )}
            </div>

            {/* 检测按钮 */}
            <button
              onClick={() => onStatusCheck && onStatusCheck(environment)}
              disabled={isChecking}
              className="p-1.5 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors disabled:opacity-50"
              title="检测状态"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 描述和标签区 - 紧凑布局 */}
        <div className="flex items-center justify-between gap-4 mb-3">
          {/* 环境描述 */}
          <div className="flex-1 min-w-0">
            {environment.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                {environment.description}
              </p>
            )}
          </div>

          {/* 标签 - 水平显示 */}
          {environment.tags && environment.tags.length > 0 && (
            <div className="flex-shrink-0">
              <SimpleTagList
                tags={environment.tags}
                maxVisible={3}
                size="xs"
              />
            </div>
          )}
        </div>

        {/* 辅助信息和操作区 - 水平布局 */}
        <div className="flex items-center justify-between gap-4">
          {/* 左侧：辅助信息 */}
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            {status?.lastChecked && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatLastChecked(status.lastChecked)}
              </span>
            )}
            {status?.error && (
              <span className="text-danger-600 dark:text-danger-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                错误
              </span>
            )}
          </div>

          {/* 右侧：操作按钮 */}
          <div className="flex items-center gap-2">
            <a
              href={environment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary text-sm px-3 py-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              快速访问
            </a>

            {/* 服务详情按钮 */}
            {environment.services && environment.services.length > 0 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <Server className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">服务</span>
                <span className="bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded text-xs">
                  {environment.services.length}
                </span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* 错误详情（如果有） */}
        {status?.error && (
          <div className="mt-2 p-2 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-700 rounded text-xs text-danger-600 dark:text-danger-400">
            {status.error}
          </div>
        )}

        {/* 服务详情（可展开） - 紧凑布局 */}
        {isExpanded && environment.services && environment.services.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 animate-slide-up">
            <div className="space-y-1.5">
              {environment.services.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Server className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium truncate">{service.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded flex-shrink-0">
                      :{service.port}
                    </span>
                  </div>
                  <a
                    href={service.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium transition-colors flex-shrink-0 ml-2"
                  >
                    访问
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OptimizedEnvironmentCard;
