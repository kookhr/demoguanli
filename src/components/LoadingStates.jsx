import { RefreshCw, Activity, Loader2 } from 'lucide-react';

// 骨架屏加载组件
export const EnvironmentCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
      <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
    </div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      <div className="flex gap-2">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
      </div>
    </div>
  </div>
);

// 列表骨架屏
export const EnvironmentListSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }, (_, i) => (
      <EnvironmentCardSkeleton key={i} />
    ))}
  </div>
);

// 智能加载状态
export const SmartLoadingIndicator = ({ 
  isLoading, 
  hasData, 
  error, 
  loadingText = "加载中...",
  children 
}) => {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <AlertTriangle className="w-12 h-12 mb-4 text-red-500" />
        <p className="text-lg font-medium mb-2">加载失败</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (isLoading && !hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">{loadingText}</p>
      </div>
    );
  }

  if (!isLoading && !hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <Activity className="w-12 h-12 mb-4" />
        <p className="text-lg font-medium mb-2">暂无数据</p>
        <p className="text-sm">点击刷新按钮重新加载</p>
      </div>
    );
  }

  return children;
};

// 进度条组件
export const ProgressBar = ({ progress, showPercentage = true, className = "" }) => (
  <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 ${className}`}>
    <div 
      className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
    />
    {showPercentage && (
      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">
        {Math.round(progress)}%
      </div>
    )}
  </div>
);

// 批量操作加载状态
export const BatchOperationProgress = ({ 
  current, 
  total, 
  currentItem, 
  operation = "处理" 
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
      <div className="flex items-center mb-4">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-3" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          批量{operation}中...
        </h3>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>进度: {current} / {total}</span>
          <span>{Math.round((current / total) * 100)}%</span>
        </div>
        <ProgressBar progress={(current / total) * 100} showPercentage={false} />
      </div>
      
      {currentItem && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          正在{operation}: {currentItem}
        </p>
      )}
    </div>
  </div>
);

// 延迟加载包装器
export const LazyWrapper = ({ children, fallback = <EnvironmentCardSkeleton /> }) => {
  return (
    <div className="min-h-[200px]">
      {children || fallback}
    </div>
  );
};
