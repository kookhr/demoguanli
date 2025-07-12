import { useEffect, useCallback } from 'react';

const useKeyboardShortcuts = ({
  onRefresh,
  onNewEnvironment,
  onSearch,
  onSelectAll,
  onDeleteSelected,
  onToggleHelp,
  onEscape,
  isInputFocused = false
}) => {
  const handleKeyDown = useCallback((event) => {
    // 如果正在输入，只处理 Escape 键
    if (isInputFocused && event.key !== 'Escape') {
      return;
    }

    // 检查是否按下了修饰键
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;
    const isAlt = event.altKey;

    // 防止默认行为的快捷键
    const preventDefaultKeys = ['r', 'n', 'f', 'a', '?'];
    if (isCtrlOrCmd && preventDefaultKeys.includes(event.key.toLowerCase())) {
      event.preventDefault();
    }

    // 处理快捷键
    switch (event.key.toLowerCase()) {
      case 'r':
        if (isCtrlOrCmd) {
          event.preventDefault();
          onRefresh?.();
        }
        break;

      case 'n':
        if (isCtrlOrCmd) {
          event.preventDefault();
          onNewEnvironment?.();
        }
        break;

      case 'f':
        if (isCtrlOrCmd) {
          event.preventDefault();
          onSearch?.();
        }
        break;

      case 'a':
        if (isCtrlOrCmd) {
          event.preventDefault();
          onSelectAll?.();
        }
        break;

      case 'delete':
      case 'backspace':
        if (!isInputFocused) {
          event.preventDefault();
          onDeleteSelected?.();
        }
        break;

      case 'escape':
        onEscape?.();
        break;

      case '?':
        if (!isCtrlOrCmd && !isShift && !isAlt) {
          event.preventDefault();
          onToggleHelp?.();
        }
        break;

      case 'h':
        if (isCtrlOrCmd && isShift) {
          event.preventDefault();
          onToggleHelp?.();
        }
        break;

      default:
        break;
    }
  }, [
    onRefresh,
    onNewEnvironment,
    onSearch,
    onSelectAll,
    onDeleteSelected,
    onToggleHelp,
    onEscape,
    isInputFocused
  ]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // 返回快捷键列表供显示
  const shortcuts = [
    { key: 'Ctrl + R', description: '刷新环境列表', action: 'refresh' },
    { key: 'Ctrl + N', description: '新建环境', action: 'new' },
    { key: 'Ctrl + F', description: '搜索环境', action: 'search' },
    { key: 'Ctrl + A', description: '全选环境', action: 'selectAll' },
    { key: 'Delete', description: '删除选中环境', action: 'delete' },
    { key: 'Escape', description: '取消当前操作', action: 'escape' },
    { key: '?', description: '显示快捷键帮助', action: 'help' },
    { key: 'Ctrl + Shift + H', description: '显示快捷键帮助', action: 'help' }
  ];

  return { shortcuts };
};

export default useKeyboardShortcuts;
