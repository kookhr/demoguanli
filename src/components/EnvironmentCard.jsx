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

    // 根据检测状态返回描述
    switch (status.status) {
      case 'online': return "服务正常运行";
      case 'offline': return "服务不可达";
      case 'timeout': return "连接超时";
      case 'blocked': return "Mixed Content阻止访问";
      case 'mixed-content': return "混合内容限制：HTTPS页面无法访问HTTP资源。建议：1) 将服务升级为HTTPS，2) 使用HTTP页面访问，3) 配置代理服务器";
      case 'mixed-content-service-reachable': return "通过间接检测发现服务可达，但受混合内容限制无法直接访问";
      case 'mixed-content-service-restricted': return "服务可能在线但拒绝HTTP连接，建议检查服务配置";
      case 'mixed-content-service-unreachable': return "服务不可达或离线，请检查服务状态和网络连接";
      case 'mixed-content-detection-failed': return "混合内容检测失败，无法确定服务状态";
      case 'cors-blocked': return "跨域访问受限";
      case 'cors-bypassed': return "通过CORS规避策略检测可达";
      case 'image-reachable': return "通过图片探测确认可达";
      case 'port-reachable': return "通过端口探测确认可达";
      case 'assumed-reachable': return "基于网络响应假设可达";
      case 'client-error': return "客户端请求错误";
      case 'server-error': return "服务器响应错误";
      case 'reachable-unverified': return "服务响应正常";
      case 'error': return "检测过程出现错误";
      default: return null; // 不显示未知状态
    }
  };

  // 获取状态信息 - 使用useMemo优化
  const statusInfo = useMemo(() => {
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
      case 'mixed-content':
        return {
          icon: Shield,
          color: 'text-amber-600 dark:text-amber-400',
          bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700',
          text: '混合内容限制',
          description: 'HTTPS页面无法访问HTTP资源'
        };
      case 'mixed-content-service-reachable':
        return {
          icon: CheckCircle,
          color: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700',
          text: '间接检测可达',
          description: '通过间接方法检测到服务可达'
        };
      case 'mixed-content-service-restricted':
        return {
          icon: AlertTriangle,
          color: 'text-orange-600 dark:text-orange-400',
          bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700',
          text: '服务受限',
          description: '服务在线但拒绝连接'
        };
      case 'mixed-content-service-unreachable':
        return {
          icon: XCircle,
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700',
          text: '服务不可达',
          description: '服务离线或网络不可达'
        };
      case 'mixed-content-detection-failed':
        return {
          icon: HelpCircle,
          color: 'text-gray-600 dark:text-gray-400',
          bg: 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700',
          text: '检测失败',
          description: '无法确定服务状态'
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
  }, [status]);



  // 获取状态边框颜色 - 使用useMemo优化
  const statusBorderColor = useMemo(() => {
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
      case 'mixed-content':
        return 'border-amber-500 dark:border-amber-400';
      case 'mixed-content-service-reachable':
        return 'border-green-500 dark:border-green-400';
      case 'mixed-content-service-restricted':
        return 'border-orange-500 dark:border-orange-400';
      case 'mixed-content-service-unreachable':
        return 'border-red-500 dark:border-red-400';
      case 'mixed-content-detection-failed':
        return 'border-gray-500 dark:border-gray-400';
      default:
        return 'border-gray-300 dark:border-gray-600';
    }
  }, [status]);

  const isChecking = status?.isChecking || false;
  const StatusIcon = statusInfo.icon;

  return (
    <div className={`card card-hover animate-fade-in border-l-4 ${statusBorderColor} ${
      isChecking ? 'animate-pulse' : ''
    }`}>
      <div className="p-6">
        {/* 头部：环境名称和操作区 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            {/* 环境名称和版本号 */}
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                {environment.name}
              </h3>
              {environment.version && (
                <span className="text-xs text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 px-1.5 py-0.5 rounded font-mono flex-shrink-0">
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
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            {/* 网络类型标签 */}
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700" title={`网络类型: ${environment.network === 'internal' ? '内网' : '外网'} (仅作分类标签)`}>
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
          <div className={`flex items-start gap-3 px-4 py-2.5 rounded-xl border ${statusInfo.bg}`}>
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
                  <div className="flex flex-col items-end gap-1 text-xs text-gray-500 dark:text-gray-400 ml-4">
                    {/* 最后检测时间 */}
                    {status?.lastChecked && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatLastChecked(status.lastChecked)}
                      </span>
                    )}

                    {/* 响应时间 */}
                    {status?.responseTime && (
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {formatResponseTime(status.responseTime)}
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

export default memo(EnvironmentCard);
