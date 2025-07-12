import { useState, useEffect } from 'react';
import { 
  Globe, 
  Shield, 
  Activity, 
  Clock, 
  ExternalLink, 
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Copy,
  Edit3,
  Trash2
} from 'lucide-react';

const EnhancedEnvironmentCard = ({ 
  environment, 
  onEdit, 
  onDelete, 
  onStatusCheck,
  isSelected,
  onSelect,
  showActions = true
}) => {
  const [status, setStatus] = useState(environment.status || 'unknown');
  const [isChecking, setIsChecking] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [lastChecked, setLastChecked] = useState(environment.lastChecked);

  // 状态检查
  const handleStatusCheck = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      const result = await onStatusCheck(environment);
      setStatus(result.status);
      setLastChecked(new Date().toISOString());
    } catch (error) {
      setStatus('error');
    } finally {
      setIsChecking(false);
    }
  };

  // 复制URL
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(environment.url);
      // 这里可以触发toast通知
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  // 获取状态样式
  const getStatusStyles = () => {
    switch (status) {
      case 'online':
        return {
          dot: 'bg-green-500',
          border: 'border-l-green-500',
          bg: 'bg-green-50 dark:bg-green-900/10',
          text: 'text-green-700 dark:text-green-400'
        };
      case 'offline':
        return {
          dot: 'bg-red-500',
          border: 'border-l-red-500',
          bg: 'bg-red-50 dark:bg-red-900/10',
          text: 'text-red-700 dark:text-red-400'
        };
      case 'warning':
        return {
          dot: 'bg-yellow-500',
          border: 'border-l-yellow-500',
          bg: 'bg-yellow-50 dark:bg-yellow-900/10',
          text: 'text-yellow-700 dark:text-yellow-400'
        };
      default:
        return {
          dot: 'bg-gray-400',
          border: 'border-l-gray-400',
          bg: 'bg-gray-50 dark:bg-gray-800',
          text: 'text-gray-600 dark:text-gray-400'
        };
    }
  };

  const statusStyles = getStatusStyles();

  // 获取状态图标
  const getStatusIcon = () => {
    if (isChecking) {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
    }
    
    switch (status) {
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'offline':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  // 格式化时间
  const formatTime = (timestamp) => {
    if (!timestamp) return '未检查';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`
      group relative bg-white dark:bg-gray-800 rounded-xl shadow-lg border-l-4 ${statusStyles.border}
      transition-all duration-300 hover:shadow-xl hover:scale-[1.02]
      ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
    `}>
      {/* 选择框 */}
      {onSelect && (
        <div className="absolute top-4 left-4 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(environment.id, e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
          />
        </div>
      )}

      {/* 操作菜单 */}
      {showActions && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="py-1">
                <button
                  onClick={() => {
                    handleCopyUrl();
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Copy className="w-4 h-4" />
                  复制链接
                </button>
                <button
                  onClick={() => {
                    onEdit(environment);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Edit3 className="w-4 h-4" />
                  编辑环境
                </button>
                <hr className="my-1 border-gray-200 dark:border-gray-700" />
                <button
                  onClick={() => {
                    onDelete(environment);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                  删除环境
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="p-6">
        {/* 头部信息 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {environment.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {environment.type}
              </span>
              <span className={`w-2 h-2 rounded-full ${statusStyles.dot}`} />
              <span className={`text-sm ${statusStyles.text}`}>
                {status === 'online' ? '在线' : status === 'offline' ? '离线' : status === 'warning' ? '警告' : '未知'}
              </span>
            </div>
          </div>
        </div>

        {/* URL和网络类型 */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <a
              href={environment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate flex-1"
            >
              {environment.url}
            </a>
            <ExternalLink className="w-3 h-3 text-gray-400" />
          </div>
          
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {environment.network === 'internal' ? '内网环境' : '外网环境'}
            </span>
          </div>
        </div>

        {/* 描述 */}
        {environment.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {environment.description}
          </p>
        )}

        {/* 标签 */}
        {environment.tags && environment.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {environment.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full"
              >
                {tag}
              </span>
            ))}
            {environment.tags.length > 3 && (
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                +{environment.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* 底部状态栏 */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <button
              onClick={handleStatusCheck}
              disabled={isChecking}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
            >
              {isChecking ? '检查中...' : '检查状态'}
            </button>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{formatTime(lastChecked)}</span>
          </div>
        </div>
      </div>

      {/* 悬浮效果 */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
};

export default EnhancedEnvironmentCard;
