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
  Clock,
  Activity,
  HelpCircle
} from 'lucide-react';
import { SimpleTagList } from './SimpleTagList';
import {
  formatResponseTime,
  formatLastChecked
} from '../utils/simpleStatusCheck';

const EnvironmentCard = ({ environment, status, onStatusCheck }) => {
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

      case 'cors-bypassed':
        return {
          icon: CheckCircle,
          color: 'text-emerald-600 dark:text-emerald-400',
          bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700',
          text: '可达(CORS规避)',
          description: '通过CORS规避策略检测到服务可达'
        };
      case 'image-reachable':
        return {
          icon: CheckCircle,
          color: 'text-teal-600 dark:text-teal-400',
          bg: 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-700',
          text: '可达(图片探测)',
          description: '通过图片探测确认服务可达'
        };
      case 'port-reachable':
        return {
          icon: CheckCircle,
          color: 'text-cyan-600 dark:text-cyan-400',
          bg: 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-700',
          text: '可达(端口探测)',
          description: '通过端口探测确认服务可达'
        };
      case 'assumed-reachable':
        return {
          icon: CheckCircle,
          color: 'text-indigo-600 dark:text-indigo-400',
          bg: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700',
          text: '可达(假设)',
          description: '基于网络响应假设服务可达'
        };
      case 'client-error':
        return {
          icon: AlertTriangle,
          color: 'text-orange-600 dark:text-orange-400',
          bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700',
          text: '客户端错误',
          description: '请求错误'
        };
      case 'server-error':
        return {
          icon: XCircle,
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700',
          text: '服务器错误',
          description: '服务器异常'
        };
      case 'reachable-unverified':
        return {
          icon: CheckCircle,
          color: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700',
          text: '可达',
          description: '服务响应正常'
        };
      case 'cors-blocked':
        return {
          icon: Shield,
          color: 'text-yellow-600 dark:text-yellow-400',
          bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700',
          text: '受限',
          description: '访问受限'
        };
      case 'unknown-status':
        return {
          icon: HelpCircle,
          color: 'text-purple-600 dark:text-purple-400',
          bg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700',
          text: '未知',
          description: '状态未知'
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
      case 'cors-bypassed':
        return 'border-emerald-500 dark:border-emerald-400';
      case 'image-reachable':
        return 'border-teal-500 dark:border-teal-400';
      case 'port-reachable':
        return 'border-cyan-500 dark:border-cyan-400';
      case 'assumed-reachable':
        return 'border-indigo-500 dark:border-indigo-400';
      case 'client-error':
        return 'border-orange-500 dark:border-orange-400';
      case 'server-error':
        return 'border-red-500 dark:border-red-400';
      case 'reachable-unverified':
        return 'border-blue-500 dark:border-blue-400';
      case 'cors-blocked':
        return 'border-yellow-500 dark:border-yellow-400';
      case 'unknown-status':
        return 'border-purple-500 dark:border-purple-400';
      case 'offline':
      case 'error':
        return 'border-danger-500 dark:border-danger-400';
      case 'timeout':
        return 'border-warning-500 dark:border-warning-400';
      case 'blocked':
        return 'border-purple-500 dark:border-purple-400';
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
      <div className="p-6">
        {/* 头部：环境名称和操作区 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            {/* 环境名称和类型 */}
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                {environment.name}
              </h3>
              <span className={`badge ${getTypeStyle(environment.type)} flex-shrink-0`}>
                {environment.type}
              </span>
            </div>
            
            {/* 环境描述 */}
            {environment.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                {environment.description}
              </p>
            )}
          </div>

          {/* 右上角操作区 */}
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            {/* 网络类型 */}
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700" title={environment.network === 'internal' ? '内网环境' : '外网环境'}>
              {environment.network === 'internal' ? (
                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <Globe className="w-4 h-4 text-green-600 dark:text-green-400" />
              )}
            </div>
            
            {/* 检测按钮 */}
            <button
              onClick={() => onStatusCheck && onStatusCheck(environment)}
              disabled={isChecking}
              className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors disabled:opacity-50"
              title="检测状态"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 状态信息区 */}
        <div className="mb-4">
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${statusInfo.bg}`}>
            <StatusIcon className={`w-5 h-5 ${statusInfo.color} flex-shrink-0 ${isChecking ? 'animate-spin' : ''}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-semibold ${statusInfo.color}`}>
                  {isChecking ? '检测中...' : statusInfo.text}
                </span>
                {environment.version && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md font-mono">
                    v{environment.version}
                  </span>
                )}
              </div>
              {!isChecking && status?.responseTime && (
                <div className="flex items-center justify-end text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    {formatResponseTime(status.responseTime)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 标签区域 */}
        {environment.tags && environment.tags.length > 0 && (
          <div className="mb-4">
            <SimpleTagList 
              tags={environment.tags} 
              maxVisible={5}
              size="sm"
            />
          </div>
        )}

        {/* 辅助信息 */}
        {status?.lastChecked && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
            <Clock className="w-3 h-3" />
            <span>最后检测: {formatLastChecked(status.lastChecked)}</span>
          </div>
        )}



        {/* 操作按钮区 */}
        <div className="flex items-center justify-between gap-3">
          <a
            href={environment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary flex-1"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            快速访问
          </a>

          {/* 服务详情按钮 */}
          {environment.services && environment.services.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Server className="w-4 h-4" />
              <span className="hidden sm:inline">服务详情</span>
              <span className="text-xs bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded">
                {environment.services.length}
              </span>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* 服务详情（可展开） */}
        {isExpanded && environment.services && environment.services.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 animate-slide-up">
            <div className="space-y-2">
              {environment.services.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Server className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium truncate">{service.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded flex-shrink-0">
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

export default EnvironmentCard;
