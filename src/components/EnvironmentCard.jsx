import React, { useState, memo, useMemo } from 'react';
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
import { formatResponseTime, formatLastChecked } from '../utils/common';

const EnvironmentCard = ({ environment, status, onStatusCheck }) => {
  const [isExpanded, setIsExpanded] = useState(false);



  // 合并环境类型和现有标签 - 使用useMemo优化
  const allTags = useMemo(() => {
    const tags = [];

    // 添加环境类型作为第一个标签
    if (environment.type) {
      tags.push(environment.type);
    }

    // 添加现有标签
    if (environment.tags && environment.tags.length > 0) {
      tags.push(...environment.tags);
    }

    return tags;
  }, [environment.type, environment.tags]);

  // 根据HTTP状态码和检测结果获取详细状态描述
  const getDetailedStatusDescription = (status) => {
    if (!status) return null;

    // 如果有具体的HTTP状态码，优先使用状态码描述
    if (status.statusCode) {
      const code = status.statusCode;

      // 2xx 成功状态
      if (code >= 200 && code < 300) {
        switch (code) {
          case 200: return "服务正常运行";
          case 201: return "资源创建成功";
          case 202: return "请求已接受";
          case 204: return "请求成功，无内容返回";
          default: return "服务响应正常";
        }
      }

      // 3xx 重定向状态
      if (code >= 300 && code < 400) {
        switch (code) {
          case 301: return "资源已永久移动";
          case 302: return "资源临时重定向";
          case 304: return "资源未修改";
          default: return "请求被重定向";
        }
      }

      // 4xx 客户端错误
      if (code >= 400 && code < 500) {
        switch (code) {
          case 400: return "请求格式错误";
          case 401: return "需要身份验证";
          case 403: return "访问被拒绝";
          case 404: return "页面未找到";
          case 405: return "请求方法不允许";
          case 408: return "请求超时";
          case 429: return "请求过于频繁";
          default: return "客户端请求错误";
        }
      }

      // 5xx 服务器错误
      if (code >= 500 && code < 600) {
        switch (code) {
          case 500: return "服务器内部错误";
          case 501: return "功能未实现";
          case 502: return "网关错误";
          case 503: return "服务不可用";
          case 504: return "网关超时";
          default: return "服务器错误";
        }
      }
    }

    // 根据检测状态返回描述 - 极简版
    switch (status.status) {
      case 'available':
      case 'online':
      case 'cors-bypassed':
      case 'image-reachable':
      case 'port-reachable':
      case 'assumed-reachable':
      case 'reachable-unverified':
      case 'mixed-content-service-reachable':
        return "网络可达";
      case 'unreachable':
      case 'offline':
      case 'error':
      case 'server-error':
      case 'timeout':
      case 'unknown':
      case 'mixed-content-service-unreachable':
      default:
        return "网络不可达";
    }
  };

  // 获取状态信息 - 极简版
  const statusInfo = useMemo(() => {
    switch (status?.status) {
      case 'available':
      case 'online':
      case 'cors-bypassed':
      case 'image-reachable':
      case 'port-reachable':
      case 'assumed-reachable':
      case 'reachable-unverified':
      case 'mixed-content-service-reachable':
        return {
          icon: CheckCircle,
          color: 'text-success-600 dark:text-success-400',
          border: 'border-success-200 dark:border-success-700',
          text: '可达',
          description: '网络可达'
        };
      case 'unreachable':
      case 'offline':
      case 'error':
      case 'server-error':
      case 'timeout':
      case 'unknown':
      case 'mixed-content-service-unreachable':
      default:
        return {
          icon: XCircle,
          color: 'text-danger-600 dark:text-danger-400',
          border: 'border-danger-200 dark:border-danger-700',
          text: '不可达',
          description: '网络不可达'
        };
    }
  }, [status]);

  // 获取状态样式类
  const getStatusClass = useMemo(() => {
    if (status?.isChecking) {
      return 'status-checking';
    }

    switch (status?.status) {
      case 'available':
      case 'online':
      case 'cors-bypassed':
      case 'image-reachable':
      case 'port-reachable':
      case 'assumed-reachable':
      case 'reachable-unverified':
      case 'mixed-content-service-reachable':
        return 'status-available';
      case 'unreachable':
      case 'offline':
      case 'error':
      case 'server-error':
      case 'timeout':
      case 'unknown':
      case 'mixed-content-service-unreachable':
      default:
        return 'status-unreachable';
    }
  }, [status]);



  // 获取状态边框颜色 - 极简版
  const statusBorderColor = useMemo(() => {
    if (status?.isChecking) {
      return 'border-blue-400 dark:border-blue-500';
    }

    switch (status?.status) {
      case 'available':
      case 'online':
      case 'cors-bypassed':
      case 'image-reachable':
      case 'port-reachable':
      case 'assumed-reachable':
      case 'reachable-unverified':
      case 'mixed-content-service-reachable':
        return 'border-success-500 dark:border-success-400';
      case 'unreachable':
      case 'offline':
      case 'error':
      case 'server-error':
      case 'timeout':
      case 'unknown':
      case 'mixed-content-service-unreachable':
      default:
        return 'border-danger-500 dark:border-danger-400';
    }
  }, [status]);

  const isChecking = status?.isChecking || false;
  const StatusIcon = statusInfo.icon;

  return (
    <div className={`card card-hover liquid-hover inner-glow animate-fade-in border-l-4 hover-lift transition-all duration-300 mobile-env-card ${statusBorderColor} ${
      isChecking ? 'animate-pulse' : ''
    }`}>
      <div className="p-6 mobile-env-card">
        {/* 头部：环境名称和操作区 */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3 mobile-env-header">
          <div className="flex-1 min-w-0">
            {/* 环境名称和版本号 */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate mobile-env-title">
                {environment.name}
              </h3>
              {environment.version && (
                <span className="text-xs text-gray-500 dark:text-gray-400 liquid-glass-surface px-2 py-1 rounded-xl font-mono flex-shrink-0 backdrop-blur-sm self-start sm:self-auto">
                  v{environment.version}
                </span>
              )}
            </div>

            {/* 环境描述 */}
            {environment.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                {environment.description}
              </p>
            )}
          </div>

          {/* 右上角操作区 */}
          <div className="flex items-center gap-2 flex-shrink-0 self-start sm:ml-4">
            {/* 网络类型标签 */}
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 touch-manipulation" title={`网络类型: ${environment.network === 'internal' ? '内网' : '外网'} (仅作分类标签)`}>
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
              className={`p-2 rounded-lg transition-all duration-200 disabled:opacity-50 mobile-env-button touch-manipulation min-h-[44px] min-w-[44px] ${
                isChecking
                  ? 'bg-primary-200 dark:bg-primary-800/50 cursor-wait'
                  : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50 active:scale-90'
              }`}
              title={isChecking ? '检测中...' : '检测状态'}
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 状态信息区 */}
        <div className="mb-4">
          <div className={`flex items-start gap-3 px-4 py-2.5 rounded-2xl status-glass-surface ${getStatusClass}`}>
            <StatusIcon className={`w-5 h-5 ${statusInfo.color} flex-shrink-0 mt-0.5 ${isChecking ? 'animate-spin' : ''}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* 状态文字 */}
                  <div className="mb-0.5">
                    <span className={`text-sm font-semibold ${statusInfo.color} leading-tight`}>
                      {isChecking ? '检测中...' : statusInfo.text}
                    </span>
                  </div>

                  {/* 状态描述 */}
                  {!isChecking && (() => {
                    const description = getDetailedStatusDescription(status);
                    return description ? (
                      <div className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                        {description}
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* 右侧：垂直排列的时间信息 */}
                {!isChecking && (status?.lastChecked || status?.responseTime) && (
                  <div className="flex flex-col sm:items-end gap-1 text-xs text-gray-500 dark:text-gray-400 ml-2 sm:ml-4">
                    {/* 最后检测时间 */}
                    {status?.lastChecked && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span className="truncate max-w-[80px] sm:max-w-none">
                          {formatLastChecked(status.lastChecked)}
                        </span>
                      </span>
                    )}

                    {/* 响应时间 */}
                    {status?.responseTime && (
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        <span className="truncate max-w-[60px] sm:max-w-none">
                          {formatResponseTime(status.responseTime)}
                        </span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 标签区域 */}
        {allTags.length > 0 ? (
            <div className="mb-4">
              <SimpleTagList
                tags={allTags}
                maxVisible={6}
                size="sm"
              />
            </div>
          ) : null}



        {/* 操作按钮区 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mobile-env-actions">
          <a
            href={environment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary flex-1 mobile-env-button touch-manipulation min-h-[48px] sm:min-h-[44px] flex items-center justify-center"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            快速访问
          </a>

          {/* 服务详情按钮 */}
          {environment.services && environment.services.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center justify-center sm:justify-start gap-2 px-4 py-3 sm:py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors mobile-env-button touch-manipulation min-h-[48px] sm:min-h-[44px] w-full sm:w-auto"
            >
              <Server className="w-4 h-4" />
              <span className="sm:hidden">服务详情</span>
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
            <div className="space-y-3">
              {environment.services.map((service, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors gap-3 sm:gap-2">
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
                    className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium transition-colors flex-shrink-0 touch-manipulation py-2 px-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-center sm:text-left sm:bg-transparent sm:p-0"
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

export default memo(EnvironmentCard);
