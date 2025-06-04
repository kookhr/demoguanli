import { useEffect, useCallback } from 'react';

// 快捷键配置
const SHORTCUTS = {
  'ctrl+r': 'refresh_status',
  'ctrl+shift+r': 'refresh_all',
  'ctrl+f': 'focus_search',
  'ctrl+n': 'new_environment',
  'ctrl+s': 'save_config',
  'escape': 'close_modal',
  'ctrl+shift+c': 'clear_filters',
  'ctrl+shift+e': 'export_config',
  'ctrl+shift+h': 'toggle_history',
  'f5': 'refresh_page'
};

// 快捷键描述
const SHORTCUT_DESCRIPTIONS = {
  'refresh_status': '刷新当前环境状态',
  'refresh_all': '刷新所有环境状态',
  'focus_search': '聚焦搜索框',
  'new_environment': '新建环境',
  'save_config': '保存配置',
  'close_modal': '关闭弹窗',
  'clear_filters': '清除所有筛选',
  'export_config': '导出配置',
  'toggle_history': '切换历史面板',
  'refresh_page': '刷新页面'
};

export const useShortcuts = (handlers = {}) => {
  const handleKeyDown = useCallback((event) => {
    // 构建快捷键字符串
    const keys = [];
    if (event.ctrlKey) keys.push('ctrl');
    if (event.shiftKey) keys.push('shift');
    if (event.altKey) keys.push('alt');
    if (event.metaKey) keys.push('meta');
    
    // 添加主键
    const mainKey = event.key.toLowerCase();
    if (!['control', 'shift', 'alt', 'meta'].includes(mainKey)) {
      keys.push(mainKey);
    }
    
    const shortcut = keys.join('+');
    const action = SHORTCUTS[shortcut];
    
    if (action && handlers[action]) {
      // 检查是否在输入框中
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
      );
      
      // 某些快捷键在输入框中也要生效
      const allowInInput = ['escape', 'ctrl+s', 'f5'];
      
      if (!isInputFocused || allowInInput.includes(shortcut)) {
        event.preventDefault();
        handlers[action](event);
      }
    }
  }, [handlers]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    shortcuts: SHORTCUTS,
    descriptions: SHORTCUT_DESCRIPTIONS
  };
};

// 快捷键帮助组件
export const ShortcutHelp = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">快捷键帮助</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {Object.entries(SHORTCUTS).map(([key, action]) => (
            <div key={key} className="flex justify-between items-center py-1">
              <span className="text-sm text-gray-600">
                {SHORTCUT_DESCRIPTIONS[action]}
              </span>
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
                {key.replace(/\+/g, ' + ').toUpperCase()}
              </kbd>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            按 <kbd className="px-1 bg-gray-100 rounded">ESC</kbd> 关闭此帮助
          </p>
        </div>
      </div>
    </div>
  );
};
