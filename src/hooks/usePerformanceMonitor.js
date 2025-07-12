import { useState, useEffect, useRef, useCallback } from 'react';

// 性能监控Hook
export const usePerformanceMonitor = (componentName = 'Unknown') => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    renderCount: 0,
    memoryUsage: 0,
    isSlowRender: false
  });

  const renderStartTime = useRef(Date.now());
  const renderCount = useRef(0);
  const slowRenderThreshold = 16; // 16ms (60fps)

  // 记录渲染开始时间
  const startRender = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  // 记录渲染结束时间
  const endRender = useCallback(() => {
    const renderTime = performance.now() - renderStartTime.current;
    renderCount.current += 1;

    setMetrics(prev => ({
      ...prev,
      renderTime,
      renderCount: renderCount.current,
      isSlowRender: renderTime > slowRenderThreshold
    }));

    // 记录慢渲染
    if (renderTime > slowRenderThreshold) {
      console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }
  }, [componentName, slowRenderThreshold]);

  // 监控内存使用
  useEffect(() => {
    const updateMemoryUsage = () => {
      if (performance.memory) {
        setMetrics(prev => ({
          ...prev,
          memoryUsage: performance.memory.usedJSHeapSize / 1024 / 1024 // MB
        }));
      }
    };

    updateMemoryUsage();
    const interval = setInterval(updateMemoryUsage, 5000); // 每5秒更新一次

    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    startRender,
    endRender
  };
};

// 组件性能监控HOC
export const withPerformanceMonitor = (WrappedComponent, componentName) => {
  return React.forwardRef((props, ref) => {
    const { metrics, startRender, endRender } = usePerformanceMonitor(componentName);

    useEffect(() => {
      startRender();
      return endRender;
    });

    return <WrappedComponent ref={ref} {...props} performanceMetrics={metrics} />;
  });
};

// 懒加载Hook
export const useLazyLoading = (threshold = 100) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setHasLoaded(true);
          observer.unobserve(element);
        }
      },
      {
        rootMargin: `${threshold}px`,
        threshold: 0.1
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold]);

  return {
    elementRef,
    isVisible,
    hasLoaded
  };
};

// 图片懒加载Hook
export const useImageLazyLoading = (src, placeholder = '') => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { elementRef, isVisible } = useLazyLoading();

  useEffect(() => {
    if (!isVisible || !src) return;

    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };

    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
    };

    img.src = src;
  }, [isVisible, src]);

  return {
    elementRef,
    imageSrc,
    isLoading,
    hasError,
    isVisible
  };
};

// 防抖Hook
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// 节流Hook
export const useThrottle = (value, limit) => {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
};

// 内存使用监控Hook
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = useState({
    used: 0,
    total: 0,
    percentage: 0
  });

  useEffect(() => {
    const updateMemoryInfo = () => {
      if (performance.memory) {
        const used = performance.memory.usedJSHeapSize / 1024 / 1024;
        const total = performance.memory.totalJSHeapSize / 1024 / 1024;
        const percentage = (used / total) * 100;

        setMemoryInfo({ used, total, percentage });

        // 内存使用过高警告
        if (percentage > 80) {
          console.warn(`High memory usage detected: ${percentage.toFixed(1)}%`);
        }
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 10000); // 每10秒检查一次

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
};

// 网络状态监控Hook
export const useNetworkMonitor = () => {
  const [networkInfo, setNetworkInfo] = useState({
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0
  });

  useEffect(() => {
    const updateNetworkInfo = () => {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      setNetworkInfo(prev => ({
        ...prev,
        isOnline: navigator.onLine,
        connectionType: connection?.type || 'unknown',
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0
      }));
    };

    const handleOnline = () => setNetworkInfo(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setNetworkInfo(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 监听网络变化
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
    }

    updateNetworkInfo();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, []);

  return networkInfo;
};

// 页面可见性Hook
export const usePageVisibility = () => {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
};

// 性能指标收集Hook
export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState({
    fcp: 0, // First Contentful Paint
    lcp: 0, // Largest Contentful Paint
    fid: 0, // First Input Delay
    cls: 0, // Cumulative Layout Shift
    ttfb: 0 // Time to First Byte
  });

  useEffect(() => {
    // 收集性能指标
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        switch (entry.entryType) {
          case 'paint':
            if (entry.name === 'first-contentful-paint') {
              setMetrics(prev => ({ ...prev, fcp: entry.startTime }));
            }
            break;
          case 'largest-contentful-paint':
            setMetrics(prev => ({ ...prev, lcp: entry.startTime }));
            break;
          case 'first-input':
            setMetrics(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }));
            break;
          case 'layout-shift':
            if (!entry.hadRecentInput) {
              setMetrics(prev => ({ ...prev, cls: prev.cls + entry.value }));
            }
            break;
          case 'navigation':
            setMetrics(prev => ({ ...prev, ttfb: entry.responseStart - entry.requestStart }));
            break;
        }
      }
    });

    // 观察不同类型的性能指标
    try {
      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift', 'navigation'] });
    } catch (e) {
      console.warn('Performance observer not supported:', e);
    }

    return () => observer.disconnect();
  }, []);

  return metrics;
};
