import React, { useState } from 'react';
import {
  Globe,
  Shield,
  Activity,
  Clock,
  ExternalLink,
  CheckCircle,
  XCircle,
  Loader2,
  Wifi,
  Server,
  Database,
  Cloud,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const EnvironmentCard = ({
  environment,
  status,
  isChecking = false,
  onVisit,
  onStatusCheck,
  className = ""
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isServicesExpanded, setIsServicesExpanded] = useState(false);

  // 获取状态相关的样式和图标
  const getStatusInfo = () => {
    if (isChecking) {
      return {
        icon: Loader2,
        color: 'text-blue-500 dark:text-blue-400',
        bgColor: 'bg-blue-50/80 dark:bg-blue-900/20',
        borderColor: 'border-blue-200/50 dark:border-blue-700/50',
        text: '检测中...',
        pulse: true,
        checking: true
      };
    }

    switch (status?.status) {
      case 'available':
        return {
          icon: CheckCircle,
          color: 'text-emerald-500 dark:text-emerald-400',
          bgColor: 'bg-emerald-50/80 dark:bg-emerald-900/20',
          borderColor: 'border-emerald-200/50 dark:border-emerald-700/50',
          text: '可达',
          pulse: false
        };
      case 'unreachable':
        return {
          icon: XCircle,
          color: 'text-red-500 dark:text-red-400',
          bgColor: 'bg-red-50/80 dark:bg-red-900/20',
          borderColor: 'border-red-200/50 dark:border-red-700/50',
          text: '不可达',
          pulse: false
        };
      default:
        return {
          icon: Activity,
          color: 'text-gray-500 dark:text-gray-400',
          bgColor: 'bg-gray-50/80 dark:bg-gray-900/20',
          borderColor: 'border-gray-200/50 dark:border-gray-700/50',
          text: '未知',
          pulse: false
        };
    }
  };

  // 获取环境类型图标
  const getTypeIcon = () => {
    switch (environment.type) {
      case 'production': return Server;
      case 'staging': return Cloud;
      case 'development': return Database;
      default: return Globe;
    }
  };

  // 获取环境类型样式
  const getTypeStyle = () => {
    switch (environment.type) {
      case 'production':
        return 'bg-red-100/80 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'staging':
        return 'bg-yellow-100/80 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'development':
        return 'bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100/80 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  // 获取网络类型样式
  const getNetworkStyle = () => {
    switch (environment.network) {
      case 'internal':
        return 'bg-purple-100/80 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'external':
        return 'bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-gray-100/80 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  // 获取检测方法描述
  const getMethodDescription = (method) => {
    switch (method) {
      case 'fetch-success': return 'Fetch';
      case 'image-load': return 'Image';
      case 'mixed-content-image-probe': return 'Mixed';
      case 'enhanced-check': return 'Enhanced';
      default: return 'Standard';
    }
  };

  // 获取版本号样式
  const getVersionStyle = (version) => {
    if (!version) return '';

    const versionLower = version.toLowerCase();

    if (versionLower.includes('alpha')) {
      return 'bg-red-100/80 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    } else if (versionLower.includes('beta')) {
      return 'bg-orange-100/80 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
    } else if (versionLower.includes('rc')) {
      return 'bg-yellow-100/80 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
    } else {
      return 'bg-indigo-100/80 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300';
    }
  };

  // 格式化响应时间
  const formatResponseTime = (time) => {
    if (!time) return '';
    return time < 1000 ? `${time}ms` : `${(time / 1000).toFixed(1)}s`;
  };

  // 访问服务
  const handleServiceVisit = (service) => {
    try {
      const baseUrl = new URL(environment.url);
      const serviceUrl = `${baseUrl.protocol}//${baseUrl.hostname}:${service.port}`;
      window.open(serviceUrl, '_blank');
    } catch (error) {
      console.error('无法构造服务URL:', error);
      // 如果URL构造失败，尝试简单拼接
      const serviceUrl = `${environment.url.replace(/:\d+$/, '')}:${service.port}`;
      window.open(serviceUrl, '_blank');
    }
  };

  // 获取服务状态样式
  const getServiceStatusStyle = (status) => {
    switch (status) {
      case 'running':
        return 'text-green-600 dark:text-green-400 bg-green-50/80 dark:bg-green-900/20';
      case 'stopped':
        return 'text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-900/20';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50/80 dark:bg-yellow-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50/80 dark:bg-gray-900/20';
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const TypeIcon = getTypeIcon();

  return (
    <div
      className={`
        group relative overflow-hidden
        bg-white/80 dark:bg-gray-800/80
        backdrop-blur-xl backdrop-saturate-150
        border border-gray-200/50 dark:border-gray-700/50
        rounded-2xl
        shadow-sm hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50
        transition-all duration-500 ease-out
        hover:scale-[1.02] hover:-translate-y-2
        ${isHovered ? 'shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50' : ''}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 背景渐变效果 */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent dark:from-gray-700/20 pointer-events-none" />

      {/* 状态指示条 */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${statusInfo.bgColor} ${statusInfo.borderColor}`} />

      <div className="relative p-6">
        {/* 头部区域 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            {/* 环境名称 */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 truncate">
              {environment.name}
            </h3>

            {/* 环境描述 */}
            {environment.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                {environment.description}
              </p>
            )}
          </div>

          {/* 状态指示器 - 可点击按钮 */}
          <button
            onClick={() => onStatusCheck?.(environment)}
            disabled={isChecking}
            className={`
              group/status flex items-center gap-2 px-3 py-1.5 rounded-full
              ${statusInfo.bgColor} ${statusInfo.borderColor} border
              backdrop-blur-sm
              transition-all duration-300 hover:scale-105 active:scale-95
              shadow-sm hover:shadow-lg
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500/20
              disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100
              cursor-pointer hover:brightness-110
              relative overflow-hidden
            `}
            title={isChecking ? '检测中...' : `点击检测 ${environment.name} 的网络状态`}
          >
            {/* 悬停时的光晕效果 */}
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/status:opacity-100 transition-opacity duration-300 rounded-full" />

            <StatusIcon
              className={`w-4 h-4 ${statusInfo.color} ${statusInfo.pulse ? 'animate-spin' : ''} relative z-10`}
            />
            <span className={`text-sm font-medium ${statusInfo.color} relative z-10`}>
              {statusInfo.text}
            </span>

            {/* 检测中的脉冲效果 */}
            {isChecking && (
              <div className="absolute inset-0 rounded-full">
                <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping" />
                <div className="absolute inset-0 rounded-full bg-blue-400/10 animate-pulse" />
              </div>
            )}

            {/* 点击波纹效果指示 */}
            {!isChecking && (
              <div className="absolute inset-0 rounded-full opacity-0 group-hover/status:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
              </div>
            )}
          </button>
        </div>

        {/* 环境信息区域 */}
        <div className="space-y-3 mb-4">
          {/* URL */}
          <div className="flex items-center gap-2 text-sm">
            <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300 truncate font-mono text-xs">
              {environment.url}
            </span>
          </div>

          {/* 类型、网络和版本标签 */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium
              ${getTypeStyle()}
              transition-colors duration-200
            `}>
              <TypeIcon className="w-3.5 h-3.5" />
              <span>{environment.type || 'unknown'}</span>
            </div>

            <div className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium
              ${getNetworkStyle()}
              transition-colors duration-200
            `}>
              <Wifi className="w-3.5 h-3.5" />
              <span>{environment.network || 'unknown'}</span>
            </div>

            {/* 版本号标签 */}
            {environment.version && (
              <div className={`
                flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium
                transition-colors duration-200
                ${getVersionStyle(environment.version)}
              `}>
                <span className="font-mono">v{environment.version}</span>
              </div>
            )}
          </div>

          {/* 标签 */}
          {environment.tags && environment.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {environment.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg
                           bg-gray-100/80 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300
                           border border-gray-200/50 dark:border-gray-600/50
                           backdrop-blur-sm
                           transition-all duration-200 hover:scale-105 hover:bg-gray-200/80 dark:hover:bg-gray-600/50"
                >
                  {tag}
                </span>
              ))}
              {environment.tags.length > 3 && (
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  +{environment.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* 状态详情区域 */}
        {status && (
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
            <div className="flex items-center gap-3">
              {/* 响应时间 */}
              {status.responseTime && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatResponseTime(status.responseTime)}</span>
                </div>
              )}

              {/* 检测方法 */}
              {status.method && (
                <div className="flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" />
                  <span>{getMethodDescription(status.method)}</span>
                </div>
              )}
            </div>

            {/* 最后检测时间 */}
            {status.lastChecked && (
              <span className="text-xs">
                {new Date(status.lastChecked).toLocaleTimeString()}
              </span>
            )}
          </div>
        )}

        {/* 操作按钮区域 */}
        <div className="flex items-center gap-3">
          {/* 访问按钮 */}
          <button
            onClick={() => onVisit?.(environment)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                     bg-blue-500/10 hover:bg-blue-500/20 dark:bg-blue-400/10 dark:hover:bg-blue-400/20
                     text-blue-600 dark:text-blue-400 font-medium text-sm
                     rounded-xl border border-blue-200/50 dark:border-blue-700/50
                     transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                     focus:outline-none focus:ring-2 focus:ring-blue-500/20
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <ExternalLink className="w-4 h-4" />
            <span>访问</span>
          </button>

          {/* 服务详情切换按钮 - 仅在有服务数据时显示 */}
          {environment.services && environment.services.length > 0 && (
            <button
              onClick={() => setIsServicesExpanded(!isServicesExpanded)}
              className="flex items-center justify-center gap-2 px-3 py-2.5 sm:px-4
                       bg-purple-500/10 hover:bg-purple-500/20 dark:bg-purple-400/10 dark:hover:bg-purple-400/20
                       text-purple-600 dark:text-purple-400 font-medium text-sm
                       rounded-xl border border-purple-200/50 dark:border-purple-700/50
                       transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                       focus:outline-none focus:ring-2 focus:ring-purple-500/20
                       min-w-0 flex-shrink-0"
              title={`${isServicesExpanded ? '收起' : '展开'}服务列表 (${environment.services.length}个服务)`}
            >
              <Server className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isServicesExpanded ? '收起服务' : '服务详情'}
              </span>
              <span className="sm:hidden text-xs">
                {environment.services.length}
              </span>
              {isServicesExpanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          )}
        </div>

        {/* 服务列表 - 下拉展示 */}
        {environment.services && environment.services.length > 0 && (
          <div className={`
            overflow-hidden transition-all duration-300 ease-out
            ${isServicesExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
          `}>
            <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <Server className="w-4 h-4" />
                服务列表 ({environment.services.length})
              </h4>
              <div className="space-y-2">
                {environment.services.map((service, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg
                             bg-gray-50/80 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50
                             hover:bg-gray-100/80 dark:hover:bg-gray-600/50
                             transition-all duration-200 hover:scale-[1.01]
                             animate-in slide-in-from-top-2 fade-in duration-300"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                          {service.name}
                        </span>
                        <span className={`
                          px-2 py-0.5 rounded-md text-xs font-medium transition-colors duration-200
                          ${getServiceStatusStyle(service.status)}
                        `}>
                          {service.status === 'running' ? '运行中' :
                           service.status === 'stopped' ? '已停止' :
                           service.status === 'warning' ? '警告' :
                           service.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        端口: {service.port}
                      </div>
                    </div>

                    {/* 服务访问按钮 */}
                    {service.status === 'running' && (
                      <button
                        onClick={() => handleServiceVisit(service)}
                        className="ml-3 flex items-center gap-1 px-2 py-1
                                 bg-blue-500/10 hover:bg-blue-500/20 dark:bg-blue-400/10 dark:hover:bg-blue-400/20
                                 text-blue-600 dark:text-blue-400 text-xs font-medium
                                 rounded-md border border-blue-200/50 dark:border-blue-700/50
                                 transition-all duration-200 hover:scale-105 active:scale-95
                                 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                        title={`访问 ${service.name}`}
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span className="hidden sm:inline">访问</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 悬停时的光晕效果 */}
      <div className={`
        absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
        bg-gradient-to-br from-blue-500/8 via-purple-500/8 to-pink-500/8
        transition-opacity duration-500 pointer-events-none
      `} />

      {/* 顶部光线效果 */}
      <div className={`
        absolute top-0 left-1/4 right-1/4 h-px
        bg-gradient-to-r from-transparent via-white/50 to-transparent
        opacity-0 group-hover:opacity-100
        transition-opacity duration-500 pointer-events-none
      `} />
    </div>
  );
};

export default EnvironmentCard;
