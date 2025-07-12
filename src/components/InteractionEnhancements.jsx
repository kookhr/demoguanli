import { useState, useEffect, useRef } from 'react';
import { Check, X, AlertTriangle, Info, Trash2, Edit3 } from 'lucide-react';

// 确认对话框组件
export const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "确认", 
  cancelText = "取消",
  type = "warning" // warning, danger, info
}) => {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('操作失败:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  if (!isOpen) return null;

  const typeStyles = {
    warning: {
      icon: AlertTriangle,
      iconColor: "text-yellow-500",
      buttonColor: "bg-yellow-500 hover:bg-yellow-600"
    },
    danger: {
      icon: Trash2,
      iconColor: "text-red-500",
      buttonColor: "bg-red-500 hover:bg-red-600"
    },
    info: {
      icon: Info,
      iconColor: "text-blue-500",
      buttonColor: "bg-blue-500 hover:bg-blue-600"
    }
  };

  const { icon: Icon, iconColor, buttonColor } = typeStyles[type];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <Icon className={`w-6 h-6 ${iconColor} mr-3`} />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message}
        </p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isConfirming}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirming}
            className={`px-4 py-2 text-white rounded-lg ${buttonColor} disabled:opacity-50 flex items-center gap-2`}
          >
            {isConfirming && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// 快捷操作按钮组
export const QuickActions = ({ environment, onEdit, onDelete, onToggleStatus }) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowActions(!showActions)}
        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="更多操作"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {showActions && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
          <div className="py-1">
            <button
              onClick={() => {
                onEdit(environment);
                setShowActions(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Edit3 className="w-4 h-4" />
              编辑环境
            </button>
            <button
              onClick={() => {
                onToggleStatus(environment);
                setShowActions(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Check className="w-4 h-4" />
              检查状态
            </button>
            <hr className="my-1 border-gray-200 dark:border-gray-700" />
            <button
              onClick={() => {
                onDelete(environment);
                setShowActions(false);
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
  );
};

// 批量选择组件
export const BatchSelector = ({ 
  items, 
  selectedItems, 
  onSelectionChange, 
  onBatchAction,
  actions = []
}) => {
  const isAllSelected = items.length > 0 && selectedItems.length === items.length;
  const isPartialSelected = selectedItems.length > 0 && selectedItems.length < items.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(items.map(item => item.id));
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isAllSelected}
            ref={input => {
              if (input) input.indeterminate = isPartialSelected;
            }}
            onChange={handleSelectAll}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {selectedItems.length > 0 
              ? `已选择 ${selectedItems.length} 项` 
              : "全选"
            }
          </span>
        </label>
      </div>

      {selectedItems.length > 0 && (
        <div className="flex gap-2">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => onBatchAction(action.type, selectedItems)}
              className={`px-3 py-1 text-sm rounded-lg flex items-center gap-2 ${action.className || 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
              {action.icon && <action.icon className="w-4 h-4" />}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// 键盘快捷键提示
export const KeyboardShortcuts = ({ isOpen, onClose }) => {
  const shortcuts = [
    { key: 'Ctrl + R', description: '刷新环境列表' },
    { key: 'Ctrl + N', description: '新建环境' },
    { key: 'Ctrl + F', description: '搜索环境' },
    { key: 'Ctrl + A', description: '全选环境' },
    { key: 'Delete', description: '删除选中环境' },
    { key: 'Escape', description: '取消当前操作' },
    { key: '?', description: '显示快捷键帮助' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            键盘快捷键
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {shortcut.description}
              </span>
              <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 rounded">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
