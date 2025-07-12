import { useState, useEffect, createContext, useContext } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X, Wifi, WifiOff, RefreshCw } from 'lucide-react';

// Toast Context
const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast Provider
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      duration: 4000,
      ...toast
    };
    setToasts(prev => [...prev, newToast]);
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearAllToasts = () => {
    setToasts([]);
  };

  // 便捷方法
  const success = (message, options = {}) => addToast({ type: 'success', message, ...options });
  const error = (message, options = {}) => addToast({ type: 'error', message, duration: 6000, ...options });
  const warning = (message, options = {}) => addToast({ type: 'warning', message, ...options });
  const info = (message, options = {}) => addToast({ type: 'info', message, ...options });
  const offline = () => addToast({ 
    type: 'offline', 
    title: '网络连接断开',
    message: '请检查您的网络连接',
    duration: 0, // 不自动消失
    action: {
      label: '重试',
      onClick: () => window.location.reload()
    }
  });
  const online = () => addToast({ 
    type: 'online', 
    title: '网络已恢复',
    message: '连接正常',
    duration: 2000
  });

  const value = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info,
    offline,
    online
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

// Toast Container
const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

// Toast Item
const ToastItem = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // 延迟显示动画
    const showTimer = setTimeout(() => setIsVisible(true), 10);
    
    // 如果duration为0，不自动消失
    if (toast.duration === 0) {
      return () => clearTimeout(showTimer);
    }
    
    // 进度条动画
    const interval = 50;
    const step = (interval / toast.duration) * 100;
    
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - step;
        if (newProgress <= 0) {
          clearInterval(progressTimer);
          setIsVisible(false);
          setTimeout(() => onRemove(toast.id), 300);
          return 0;
        }
        return newProgress;
      });
    }, interval);

    return () => {
      clearTimeout(showTimer);
      clearInterval(progressTimer);
    };
  }, [toast.id, toast.duration, onRemove]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const getToastStyles = () => {
    const baseStyles = "flex flex-col rounded-lg shadow-lg border transition-all duration-300 transform overflow-hidden backdrop-blur-sm";
    
    if (!isVisible) {
      return `${baseStyles} translate-x-full opacity-0 scale-95`;
    }

    return `${baseStyles} translate-x-0 opacity-100 scale-100 bg-white/95 dark:bg-gray-800/95 border-gray-200 dark:border-gray-700`;
  };

  const getIcon = () => {
    const iconClass = "w-5 h-5 flex-shrink-0";
    
    switch (toast.type) {
      case 'success':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'error':
        return <XCircle className={`${iconClass} text-red-500`} />;
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
      case 'info':
        return <Info className={`${iconClass} text-blue-500`} />;
      case 'offline':
        return <WifiOff className={`${iconClass} text-gray-500`} />;
      case 'online':
        return <Wifi className={`${iconClass} text-green-500`} />;
      case 'loading':
        return <RefreshCw className={`${iconClass} text-blue-500 animate-spin`} />;
      default:
        return <Info className={`${iconClass} text-gray-500`} />;
    }
  };

  const getProgressColor = () => {
    switch (toast.type) {
      case 'success':
      case 'online':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
        return 'bg-blue-500';
      case 'offline':
        return 'bg-gray-500';
      case 'loading':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className={getToastStyles()}>
      <div className="flex items-start p-4">
        <div className="mr-3 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          {toast.title && (
            <div className="font-medium text-gray-900 dark:text-white mb-1 text-sm">
              {toast.title}
            </div>
          )}
          <div className="text-sm text-gray-600 dark:text-gray-400 break-words">
            {toast.message}
          </div>
          {toast.action && (
            <button
              onClick={() => {
                toast.action.onClick();
                handleClose();
              }}
              className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          onClick={handleClose}
          className="ml-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="关闭通知"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* 进度条 - 只在有duration时显示 */}
      {toast.duration > 0 && (
        <div className="h-1 bg-gray-200 dark:bg-gray-700">
          <div 
            className={`h-full transition-all duration-50 ease-linear ${getProgressColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

// 网络状态监听Hook
export const useNetworkStatus = () => {
  const { online, offline } = useToast();
  
  useEffect(() => {
    const handleOnline = () => online();
    const handleOffline = () => offline();
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [online, offline]);
};

export default ToastContainer;
