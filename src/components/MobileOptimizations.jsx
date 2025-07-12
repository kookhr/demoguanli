import { useState, useEffect, useRef } from 'react';
import { ChevronUp, Menu, X, Search, Filter } from 'lucide-react';

// 移动端底部导航
export const MobileBottomNav = ({ 
  currentView, 
  onViewChange, 
  onNewEnvironment,
  onRefresh,
  hasSelection 
}) => {
  const navItems = [
    { id: 'environments', label: '环境', icon: '🏠' },
    { id: 'config', label: '配置', icon: '⚙️' },
    { id: 'users', label: '用户', icon: '👥' },
    { id: 'more', label: '更多', icon: '⋯' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              currentView === item.id
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <span className="text-lg mb-1">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
      
      {/* 浮动操作按钮 */}
      <button
        onClick={onNewEnvironment}
        className="absolute -top-6 right-4 w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
      >
        <span className="text-xl">+</span>
      </button>
    </div>
  );
};

// 移动端搜索栏
export const MobileSearchBar = ({ 
  searchTerm, 
  onSearchChange, 
  onFilterToggle, 
  hasActiveFilters,
  placeholder = "搜索环境..." 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 md:hidden">
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{ fontSize: '16px' }} // 防止iOS缩放
            />
          </div>
          
          <button
            onClick={onFilterToggle}
            className={`p-3 rounded-lg border transition-colors ${
              hasActiveFilters
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// 移动端滑动操作
export const SwipeActions = ({ 
  children, 
  onEdit, 
  onDelete, 
  onStatusCheck,
  disabled = false 
}) => {
  const [swipeX, setSwipeX] = useState(0);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleTouchStart = (e) => {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
    setIsSwipeActive(true);
  };

  const handleTouchMove = (e) => {
    if (disabled || !isSwipeActive) return;
    
    currentX.current = e.touches[0].clientX;
    const deltaX = currentX.current - startX.current;
    
    // 只允许向左滑动
    if (deltaX < 0) {
      setSwipeX(Math.max(deltaX, -120));
    }
  };

  const handleTouchEnd = () => {
    if (disabled) return;
    
    setIsSwipeActive(false);
    
    // 如果滑动距离超过阈值，保持显示操作按钮
    if (swipeX < -60) {
      setSwipeX(-120);
    } else {
      setSwipeX(0);
    }
  };

  const resetSwipe = () => {
    setSwipeX(0);
  };

  return (
    <div className="relative overflow-hidden">
      <div
        className="transition-transform duration-200 ease-out"
        style={{ transform: `translateX(${swipeX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
      
      {/* 操作按钮 */}
      <div 
        className="absolute top-0 right-0 h-full flex items-center"
        style={{ transform: `translateX(${120 + swipeX}px)` }}
      >
        <button
          onClick={() => {
            onStatusCheck();
            resetSwipe();
          }}
          className="h-full px-4 bg-blue-500 text-white flex items-center justify-center"
        >
          检查
        </button>
        <button
          onClick={() => {
            onEdit();
            resetSwipe();
          }}
          className="h-full px-4 bg-green-500 text-white flex items-center justify-center"
        >
          编辑
        </button>
        <button
          onClick={() => {
            onDelete();
            resetSwipe();
          }}
          className="h-full px-4 bg-red-500 text-white flex items-center justify-center"
        >
          删除
        </button>
      </div>
      
      {/* 遮罩层 */}
      {swipeX < 0 && (
        <div
          className="absolute inset-0 bg-transparent"
          onClick={resetSwipe}
        />
      )}
    </div>
  );
};

// 移动端抽屉菜单
export const MobileDrawer = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  position = 'bottom' // 'bottom', 'right', 'left'
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getDrawerStyles = () => {
    switch (position) {
      case 'bottom':
        return {
          container: 'items-end',
          drawer: 'w-full max-h-[80vh] rounded-t-xl',
          animation: isOpen ? 'translate-y-0' : 'translate-y-full'
        };
      case 'right':
        return {
          container: 'items-center justify-end',
          drawer: 'h-full max-w-sm w-full rounded-l-xl',
          animation: isOpen ? 'translate-x-0' : 'translate-x-full'
        };
      case 'left':
        return {
          container: 'items-center justify-start',
          drawer: 'h-full max-w-sm w-full rounded-r-xl',
          animation: isOpen ? 'translate-x-0' : '-translate-x-full'
        };
      default:
        return {
          container: 'items-end',
          drawer: 'w-full max-h-[80vh] rounded-t-xl',
          animation: isOpen ? 'translate-y-0' : 'translate-y-full'
        };
    }
  };

  const styles = getDrawerStyles();

  return (
    <div className="fixed inset-0 z-50 flex md:hidden">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* 抽屉内容 */}
      <div className={`relative flex ${styles.container} w-full h-full`}>
        <div className={`
          bg-white dark:bg-gray-800 shadow-xl transition-transform duration-300 ease-out
          ${styles.drawer} ${styles.animation}
        `}>
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* 内容 */}
          <div className="flex-1 overflow-y-auto p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// 移动端下拉刷新
export const PullToRefresh = ({ 
  onRefresh, 
  children, 
  threshold = 80,
  isRefreshing = false 
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef(null);

  const handleTouchStart = (e) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!isPulling || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, (currentY - startY.current) * 0.5);
    
    if (distance > 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, threshold * 1.5));
    }
  };

  const handleTouchEnd = () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    
    if (pullDistance >= threshold) {
      onRefresh();
    }
    
    setPullDistance(0);
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 下拉指示器 */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-transform duration-200"
        style={{
          transform: `translateY(${pullDistance - threshold}px)`,
          height: `${threshold}px`
        }}
      >
        <div className={`
          flex items-center gap-2 text-gray-600 dark:text-gray-400 transition-opacity
          ${pullDistance > 0 ? 'opacity-100' : 'opacity-0'}
        `}>
          <ChevronUp 
            className={`w-5 h-5 transition-transform ${
              pullDistance >= threshold ? 'rotate-180' : ''
            }`} 
          />
          <span className="text-sm">
            {isRefreshing ? '刷新中...' : pullDistance >= threshold ? '释放刷新' : '下拉刷新'}
          </span>
        </div>
      </div>
      
      {/* 内容 */}
      <div
        className="transition-transform duration-200"
        style={{ transform: `translateY(${Math.min(pullDistance, threshold)}px)` }}
      >
        {children}
      </div>
    </div>
  );
};

export default {
  MobileBottomNav,
  MobileSearchBar,
  SwipeActions,
  MobileDrawer,
  PullToRefresh
};
