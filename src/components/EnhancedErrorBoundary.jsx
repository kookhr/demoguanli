import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, ChevronDown, ChevronUp } from 'lucide-react';

class EnhancedErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // 记录错误到控制台
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // 可以在这里发送错误报告到监控服务
    this.reportError(error, errorInfo);
  }

  reportError = (error, errorInfo) => {
    // 这里可以集成错误监控服务，如 Sentry
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount
    };

    // 暂时只记录到localStorage，实际项目中应该发送到服务器
    try {
      const existingErrors = JSON.parse(localStorage.getItem('error-reports') || '[]');
      existingErrors.push(errorReport);
      // 只保留最近10个错误
      const recentErrors = existingErrors.slice(-10);
      localStorage.setItem('error-reports', JSON.stringify(recentErrors));
    } catch (e) {
      console.warn('Failed to save error report:', e);
    }
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, showDetails, retryCount } = this.state;
      const { fallback: CustomFallback, showRetry = true, showHome = true } = this.props;

      // 如果提供了自定义fallback组件
      if (CustomFallback) {
        return (
          <CustomFallback
            error={error}
            errorInfo={errorInfo}
            onRetry={this.handleRetry}
            retryCount={retryCount}
          />
        );
      }

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
              {/* 错误图标 */}
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>

              {/* 错误标题 */}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                页面出现错误
              </h1>

              {/* 错误描述 */}
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                抱歉，页面遇到了一些问题。这可能是由于网络连接、浏览器兼容性或临时的系统问题导致的。
                {retryCount > 0 && (
                  <span className="block mt-2 text-sm">
                    已重试 {retryCount} 次
                  </span>
                )}
              </p>

              {/* 操作按钮 */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                {showRetry && (
                  <button
                    onClick={this.handleRetry}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 
                             text-white rounded-lg transition-colors duration-200 font-medium"
                  >
                    <RefreshCw className="w-5 h-5" />
                    重新加载
                  </button>
                )}

                {showHome && (
                  <button
                    onClick={this.handleGoHome}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 
                             text-white rounded-lg transition-colors duration-200 font-medium"
                  >
                    <Home className="w-5 h-5" />
                    返回首页
                  </button>
                )}
              </div>

              {/* 错误详情切换 */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <button
                  onClick={this.toggleDetails}
                  className="flex items-center justify-center gap-2 mx-auto text-gray-500 dark:text-gray-400 
                           hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-sm"
                >
                  <Bug className="w-4 h-4" />
                  技术详情
                  {showDetails ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {/* 错误详情 */}
                {showDetails && (
                  <div className="mt-4 text-left">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm">
                      <div className="mb-4">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          错误信息:
                        </h3>
                        <pre className="text-red-600 dark:text-red-400 whitespace-pre-wrap break-words">
                          {error?.message || '未知错误'}
                        </pre>
                      </div>

                      {error?.stack && (
                        <div className="mb-4">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                            错误堆栈:
                          </h3>
                          <pre className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words text-xs max-h-40 overflow-y-auto">
                            {error.stack}
                          </pre>
                        </div>
                      )}

                      {errorInfo?.componentStack && (
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                            组件堆栈:
                          </h3>
                          <pre className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words text-xs max-h-40 overflow-y-auto">
                            {errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>

                    {/* 帮助信息 */}
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                        解决建议:
                      </h3>
                      <ul className="text-blue-800 dark:text-blue-200 text-sm space-y-1">
                        <li>• 刷新页面重新加载</li>
                        <li>• 检查网络连接是否正常</li>
                        <li>• 清除浏览器缓存和Cookie</li>
                        <li>• 尝试使用其他浏览器</li>
                        <li>• 如果问题持续存在，请联系技术支持</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 轻量级错误边界组件
export const LightErrorBoundary = ({ children, fallback }) => {
  return (
    <EnhancedErrorBoundary
      fallback={fallback || (({ onRetry }) => (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            组件加载失败
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            该组件遇到了一些问题
          </p>
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            重试
          </button>
        </div>
      ))}
    >
      {children}
    </EnhancedErrorBoundary>
  );
};

// 异步组件错误边界
export const AsyncErrorBoundary = ({ children }) => {
  return (
    <EnhancedErrorBoundary
      fallback={({ error, onRetry }) => (
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            组件加载失败
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-center max-w-md">
            {error?.message || '异步组件加载时出现错误，请检查网络连接或稍后重试'}
          </p>
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 
                     text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            重新加载
          </button>
        </div>
      )}
    >
      {children}
    </EnhancedErrorBoundary>
  );
};

export default EnhancedErrorBoundary;
