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
  Wifi
} from 'lucide-react';
import { SimpleTagList } from './SimpleTagList';
import { 
  getStatusText, 
  getStatusColor, 
  formatResponseTime, 
  formatLastChecked 
} from '../utils/simpleStatusCheck';

const StyledEnvironmentCard = ({ environment, currentNetwork, status, onStatusCheck }) => {
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
      case 'error':
        return {
          icon: XCircle,
          color: 'text-danger-600 dark:text-danger-400',
          bg: 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-700',
          text: '错误',
          description: '检测出错'
        };
      case 'reachable':
        return {
          icon: Wifi,
          color: 'text-primary-600 dark:text-primary-400',
          bg: 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700',
          text: '可达',
          description: '服务器可达，但状态未知'
        };
      case 'unknown':
        return {
          icon: AlertCircle,
          color: 'text-gray-500 dark:text-gray-400',
          bg: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600',
          text: '未检测',
          description: '尚未检测状态'
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
      case 'production':
        return 'badge-primary'; // 蓝色 - 表示重要性和稳定性
      case 'staging':
        return 'badge-warning'; // 黄色 - 保持不变
      case 'testing':
        return 'badge-info'; // 青色 - 区分于生产环境的蓝色
      case 'development':
        return 'badge-success'; // 绿色 - 保持不变
      default:
        return 'badge-gray';
    }
  };



  // 获取状态边框颜色
  const getStatusBorderColor = (status) => {
    if (status?.isChecking) {
      return 'border-blue-400 dark:border-blue-500'; // 检测中 - 蓝色动画
    }

    switch (status?.status) {
      case 'online':
        return 'border-success-500 dark:border-success-400'; // 在线 - 绿色
      case 'offline':
      case 'error':
        return 'border-danger-500 dark:border-danger-400'; // 离线/错误 - 红色
      case 'timeout':
        return 'border-warning-500 dark:border-warning-400'; // 超时 - 黄色
      case 'reachable':
        return 'border-primary-500 dark:border-primary-400'; // 可达 - 蓝色
      default:
        return 'border-gray-300 dark:border-gray-600'; // 未知 - 灰色
    }
  };

  // 检查网络可访问性
  const isAccessible = environment.network === currentNetwork || environment.network === 'external';
  const isChecking = status?.isChecking || false;
  const statusInfo = getStatusInfo(status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className={`card card-hover animate-fade-in border-l-4 ${getStatusBorderColor(status)} ${
      isChecking ? 'animate-pulse' : ''
    }`}>
      <div className="p-6">
        {/* 头部信息 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{environment.name}</h3>
              <span className={`badge ${getTypeStyle(environment.type)}`}>
                {environment.type}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">{environment.description}</p>

            {/* 标签 */}
            {environment.tags && environment.tags.length > 0 && (
              <div className="mb-3">
                <SimpleTagList 
                  tags={environment.tags} 
                  maxVisible={4}
                  size="xs"
                />
              </div>
            )}
          </div>
          
          {/* 网络类型标识 */}
          <div className="flex items-center gap-2">
            {environment.network === 'internal' ? (
              <Shield className="w-4 h-4 text-blue-500" title="内网环境" />
            ) : (
              <Globe className="w-4 h-4 text-green-500" title="外网环境" />
            )}
          </div>
        </div>

        {/* 状态和版本信息 */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${statusInfo.bg}`}>
                <StatusIcon className={`w-4 h-4 ${statusInfo.color} ${isChecking ? 'animate-spin' : ''}`} />
                <div className="flex flex-col">
                  <span className={`text-sm font-medium ${statusInfo.color}`}>
                    {isChecking ? '检测中...' : statusInfo.text}
                  </span>
                  {!isChecking && (
                    <span className="text-xs text-gray-500">
                      {statusInfo.description}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-sm text-gray-500">
                版本: <span className="font-mono font-medium">{environment.version}</span>
              </div>
            </div>

            <button
              onClick={() => onStatusCheck && onStatusCheck(environment)}
              disabled={isChecking}
              className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800 disabled:opacity-50 font-medium transition-colors px-2 py-1 rounded hover:bg-primary-50"
              title="重新检测状态"
            >
              <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? '检测中' : '检测'}
            </button>
          </div>

          {/* 检测时间和错误信息 */}
          {(status?.lastChecked || status?.error) && (
            <div className="flex items-center justify-between text-xs text-gray-500">
              {status?.lastChecked && (
                <span>
                  最后检测: {formatLastChecked(status.lastChecked)}
                </span>
              )}
              {status?.responseTime && (
                <span>
                  响应时间: {formatResponseTime(status.responseTime)}
                </span>
              )}
              {status?.error && (
                <span className="text-danger-600 bg-danger-50 px-2 py-1 rounded">
                  错误: {status.error}
                </span>
              )}
            </div>
          )}
        </div>



        {/* 快速访问按钮 */}
        <div className="flex items-center justify-between">
          <a
            href={environment.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn ${
              isAccessible
                ? 'btn-primary'
                : 'btn-secondary cursor-not-allowed opacity-50'
            }`}
            onClick={(e) => !isAccessible && e.preventDefault()}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            {isAccessible ? '快速访问' : '网络不可达'}
          </a>

          {/* 展开/收起按钮 */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors font-medium"
          >
            <Server className="w-4 h-4" />
            服务详情
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* 服务详情（可展开） */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 animate-slide-up">
            <h4 className="text-sm font-medium text-gray-900 mb-3">服务列表</h4>
            <div className="space-y-2">
              {environment.services.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700 font-medium">{service.name}</span>
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">:{service.port}</span>
                  </div>
                  <a
                    href={service.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-600 hover:text-primary-800 font-medium transition-colors"
                  >
                    访问
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 网络不可达提示 */}
        {!isAccessible && (
          <div className="mt-3 p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-700 rounded-lg text-sm text-warning-800 dark:text-warning-300 animate-slide-up transition-colors">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>当前网络环境无法访问此{environment.network === 'internal' ? '内网' : '外网'}环境</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StyledEnvironmentCard;
