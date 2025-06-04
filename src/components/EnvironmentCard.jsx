import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  Globe,
  Shield,
  Clock,
  Server,
  AlertCircle,
  CheckCircle,
  XCircle,
  Settings,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { checkEnvironmentStatus, formatLastDeployed, getCachedStatus } from '../utils/networkCheck';
import { TagList } from './TagManager';

const EnvironmentCard = ({ environment, status: externalStatus }) => {
  const [status, setStatus] = useState(externalStatus?.status || 'unknown');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState(externalStatus?.lastChecked || null);
  const [checkError, setCheckError] = useState(null);

  // 初始化时检查缓存状态
  useEffect(() => {
    const cachedStatus = getCachedStatus(environment.url);
    if (cachedStatus) {
      setStatus(cachedStatus);
      setLastChecked(new Date());
    } else {
      // 如果没有缓存，自动检测一次
      handleStatusCheck(true);
    }
  }, [environment.url]);

  // 检测环境状态
  const handleStatusCheck = async (silent = false) => {
    if (!silent) setIsChecking(true);
    setCheckError(null);

    try {
      const newStatus = await checkEnvironmentStatus(environment.url, {
        useCache: false, // 手动检测时不使用缓存
        timeout: 10000
      });

      setStatus(newStatus);
      setLastChecked(new Date());

    } catch (error) {
      console.error(`检测环境 ${environment.name} 失败:`, error);
      setStatus('error');
      setCheckError(error.message);
    } finally {
      if (!silent) setIsChecking(false);
    }
  };

  // 获取状态图标和颜色
  const getStatusInfo = (status) => {
    switch (status) {
      case 'online':
        return {
          icon: CheckCircle,
          color: 'text-success-600',
          bg: 'bg-success-50 border-success-200',
          text: '在线',
          description: '服务正常运行'
        };
      case 'offline':
        return {
          icon: XCircle,
          color: 'text-danger-600',
          bg: 'bg-danger-50 border-danger-200',
          text: '离线',
          description: '服务不可访问'
        };
      case 'timeout':
        return {
          icon: AlertCircle,
          color: 'text-warning-600',
          bg: 'bg-warning-50 border-warning-200',
          text: '超时',
          description: '响应时间过长'
        };
      case 'error':
        return {
          icon: WifiOff,
          color: 'text-danger-600',
          bg: 'bg-danger-50 border-danger-200',
          text: '错误',
          description: '检测过程中出现错误'
        };
      case 'reachable':
        return {
          icon: Wifi,
          color: 'text-primary-600',
          bg: 'bg-primary-50 border-primary-200',
          text: '可达',
          description: '服务器可达，但状态未知'
        };
      case 'unknown':
        return {
          icon: AlertCircle,
          color: 'text-gray-500',
          bg: 'bg-gray-50 border-gray-200',
          text: '未检测',
          description: '尚未检测状态'
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-500',
          bg: 'bg-gray-50 border-gray-200',
          text: '未知',
          description: '状态未知'
        };
    }
  };

  // 获取环境类型样式
  const getTypeStyle = (type) => {
    switch (type) {
      case '生产环境':
        return 'badge-primary'; // 蓝色 - 表示重要性和稳定性
      case '预生产环境':
        return 'badge-warning'; // 黄色 - 保持不变
      case '测试环境':
        return 'badge-info'; // 青色 - 区分于生产环境的蓝色
      case '开发环境':
        return 'badge-success'; // 绿色 - 保持不变
      case '演示环境':
        return 'badge-gray'; // 灰色 - 演示环境
      default:
        return 'badge-gray';
    }
  };

  // 获取状态边框颜色
  const getStatusBorderColor = (status) => {
    if (status?.isChecking) {
      return 'border-blue-400'; // 检测中 - 蓝色动画
    }

    switch (status?.status) {
      case 'online':
        return 'border-success-500'; // 在线 - 绿色
      case 'offline':
      case 'error':
        return 'border-danger-500'; // 离线/错误 - 红色
      case 'timeout':
        return 'border-warning-500'; // 超时 - 黄色
      case 'reachable':
        return 'border-primary-500'; // 可达 - 蓝色
      default:
        return 'border-gray-300'; // 未知 - 灰色
    }
  };



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
                <TagList
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
              onClick={() => handleStatusCheck(false)}
              disabled={isChecking}
              className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800 disabled:opacity-50 font-medium transition-colors px-2 py-1 rounded hover:bg-primary-50"
              title="重新检测状态"
            >
              <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? '检测中' : '检测'}
            </button>
          </div>

          {/* 检测时间和错误信息 */}
          {(lastChecked || checkError) && (
            <div className="flex items-center justify-between text-xs text-gray-500">
              {lastChecked && (
                <span>
                  最后检测: {lastChecked.toLocaleTimeString()}
                </span>
              )}
              {checkError && (
                <span className="text-danger-600 bg-danger-50 px-2 py-1 rounded">
                  错误: {checkError}
                </span>
              )}
            </div>
          )}
        </div>

        {/* 部署时间 */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Clock className="w-4 h-4" />
          <span>最后部署: {formatLastDeployed(environment.lastDeployed)}</span>
        </div>

        {/* 快速访问按钮 */}
        <div className="flex items-center justify-between">
          <a
            href={environment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            快速访问
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
      </div>
    </div>
  );
};

export default EnvironmentCard;
