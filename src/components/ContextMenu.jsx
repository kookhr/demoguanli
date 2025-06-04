import React, { useState, useEffect, useRef } from 'react';
import { 
  RefreshCw, 
  Edit, 
  Trash2, 
  Copy, 
  ExternalLink, 
  Star, 
  StarOff,
  BarChart3,
  Download,
  Settings
} from 'lucide-react';

const ContextMenu = ({ 
  isOpen, 
  position, 
  onClose, 
  environment, 
  onAction,
  isFavorite = false 
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !environment) return null;

  const menuItems = [
    {
      icon: RefreshCw,
      label: '检测状态',
      action: 'check_status',
      shortcut: 'Ctrl+R'
    },
    {
      icon: ExternalLink,
      label: '访问环境',
      action: 'visit',
      shortcut: null
    },
    { type: 'divider' },
    {
      icon: isFavorite ? StarOff : Star,
      label: isFavorite ? '取消收藏' : '添加收藏',
      action: 'toggle_favorite',
      shortcut: null
    },
    {
      icon: BarChart3,
      label: '查看历史',
      action: 'view_history',
      shortcut: 'Ctrl+Shift+H'
    },
    { type: 'divider' },
    {
      icon: Edit,
      label: '编辑环境',
      action: 'edit',
      shortcut: null
    },
    {
      icon: Copy,
      label: '复制配置',
      action: 'copy',
      shortcut: 'Ctrl+C'
    },
    {
      icon: Download,
      label: '导出配置',
      action: 'export',
      shortcut: null
    },
    { type: 'divider' },
    {
      icon: Trash2,
      label: '删除环境',
      action: 'delete',
      shortcut: 'Delete',
      danger: true
    }
  ];

  const handleItemClick = (action) => {
    onAction(action, environment);
    onClose();
  };

  // 确保菜单不会超出屏幕边界
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 200),
    y: Math.min(position.y, window.innerHeight - 300)
  };

  return (
    <div
      ref={menuRef}
      className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 z-50 min-w-48 transition-colors duration-300"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y
      }}
    >
      {/* 环境信息头部 */}
      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
          {environment.name}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {environment.type} • {environment.network === 'internal' ? '内网' : '外网'}
        </div>
      </div>

      {/* 菜单项 */}
      {menuItems.map((item, index) => {
        if (item.type === 'divider') {
          return (
            <div key={index} className="border-t border-gray-100 dark:border-gray-700 my-1" />
          );
        }

        const Icon = item.icon;

        return (
          <button
            key={index}
            onClick={() => handleItemClick(item.action)}
            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between group transition-colors ${
              item.danger
                ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </div>

            {item.shortcut && (
              <kbd className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-1 rounded group-hover:bg-white dark:group-hover:bg-gray-600 transition-colors">
                {item.shortcut}
              </kbd>
            )}
          </button>
        );
      })}
    </div>
  );
};

// 右键菜单Hook
export const useContextMenu = () => {
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    environment: null
  });

  const openContextMenu = (event, environment) => {
    event.preventDefault();
    event.stopPropagation();
    
    setContextMenu({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY },
      environment
    });
  };

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, isOpen: false }));
  };

  return {
    contextMenu,
    openContextMenu,
    closeContextMenu
  };
};

export default ContextMenu;
