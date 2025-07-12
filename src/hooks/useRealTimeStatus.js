import { useState, useEffect, useCallback, useRef } from 'react';

const useRealTimeStatus = (environments = [], options = {}) => {
  const {
    checkInterval = 30000, // 30秒检查一次
    enableAutoCheck = true,
    onStatusChange,
    maxConcurrentChecks = 5
  } = options;

  const [statusMap, setStatusMap] = useState(new Map());
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(null);
  const intervalRef = useRef(null);
  const abortControllerRef = useRef(null);

  // 检查单个环境状态
  const checkEnvironmentStatus = useCallback(async (environment) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

      const response = await fetch(environment.url, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'no-cors' // 避免CORS问题
      });

      clearTimeout(timeoutId);

      // 由于no-cors模式，我们只能检查是否有响应
      return {
        id: environment.id,
        status: 'online',
        responseTime: Date.now(),
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        return {
          id: environment.id,
          status: 'timeout',
          error: '请求超时',
          lastChecked: new Date().toISOString()
        };
      }

      return {
        id: environment.id,
        status: 'offline',
        error: error.message,
        lastChecked: new Date().toISOString()
      };
    }
  }, []);

  // 批量检查环境状态
  const checkAllEnvironments = useCallback(async (envList = environments) => {
    if (envList.length === 0) return;

    setIsChecking(true);
    const startTime = Date.now();

    try {
      // 分批处理，避免同时发起太多请求
      const batches = [];
      for (let i = 0; i < envList.length; i += maxConcurrentChecks) {
        batches.push(envList.slice(i, i + maxConcurrentChecks));
      }

      const allResults = [];
      
      for (const batch of batches) {
        const batchPromises = batch.map(env => checkEnvironmentStatus(env));
        const batchResults = await Promise.allSettled(batchPromises);
        
        const processedResults = batchResults.map((result, index) => {
          if (result.status === 'fulfilled') {
            return result.value;
          } else {
            return {
              id: batch[index].id,
              status: 'error',
              error: result.reason?.message || '检查失败',
              lastChecked: new Date().toISOString()
            };
          }
        });

        allResults.push(...processedResults);
      }

      // 更新状态映射
      const newStatusMap = new Map();
      allResults.forEach(result => {
        newStatusMap.set(result.id, result);
      });

      setStatusMap(newStatusMap);
      setLastCheckTime(new Date().toISOString());

      // 触发状态变化回调
      if (onStatusChange) {
        onStatusChange(allResults);
      }

      return allResults;
    } catch (error) {
      console.error('批量状态检查失败:', error);
    } finally {
      setIsChecking(false);
    }
  }, [environments, maxConcurrentChecks, checkEnvironmentStatus, onStatusChange]);

  // 检查特定环境
  const checkSpecificEnvironment = useCallback(async (environmentId) => {
    const environment = environments.find(env => env.id === environmentId);
    if (!environment) return null;

    const result = await checkEnvironmentStatus(environment);
    
    setStatusMap(prev => new Map(prev.set(environmentId, result)));
    
    if (onStatusChange) {
      onStatusChange([result]);
    }

    return result;
  }, [environments, checkEnvironmentStatus, onStatusChange]);

  // 启动自动检查
  const startAutoCheck = useCallback(() => {
    if (!enableAutoCheck || intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      checkAllEnvironments();
    }, checkInterval);
  }, [enableAutoCheck, checkInterval, checkAllEnvironments]);

  // 停止自动检查
  const stopAutoCheck = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // 手动刷新
  const refreshStatus = useCallback(() => {
    return checkAllEnvironments();
  }, [checkAllEnvironments]);

  // 获取环境状态
  const getEnvironmentStatus = useCallback((environmentId) => {
    return statusMap.get(environmentId) || {
      status: 'unknown',
      lastChecked: null
    };
  }, [statusMap]);

  // 获取所有状态统计
  const getStatusStats = useCallback(() => {
    const stats = {
      total: environments.length,
      online: 0,
      offline: 0,
      warning: 0,
      unknown: 0,
      error: 0
    };

    environments.forEach(env => {
      const status = statusMap.get(env.id)?.status || 'unknown';
      if (stats.hasOwnProperty(status)) {
        stats[status]++;
      } else {
        stats.unknown++;
      }
    });

    return stats;
  }, [environments, statusMap]);

  // 组件挂载时初始化
  useEffect(() => {
    if (environments.length > 0) {
      checkAllEnvironments();
      if (enableAutoCheck) {
        startAutoCheck();
      }
    }

    return () => {
      stopAutoCheck();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [environments.length, enableAutoCheck]); // 只在环境数量变化时重新初始化

  // 环境列表变化时更新检查
  useEffect(() => {
    if (environments.length > 0 && statusMap.size === 0) {
      checkAllEnvironments();
    }
  }, [environments, statusMap.size, checkAllEnvironments]);

  // 页面可见性变化时的处理
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAutoCheck();
      } else if (enableAutoCheck) {
        startAutoCheck();
        // 页面重新可见时立即检查一次
        checkAllEnvironments();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enableAutoCheck, startAutoCheck, stopAutoCheck, checkAllEnvironments]);

  return {
    statusMap,
    isChecking,
    lastCheckTime,
    checkAllEnvironments,
    checkSpecificEnvironment,
    refreshStatus,
    getEnvironmentStatus,
    getStatusStats,
    startAutoCheck,
    stopAutoCheck
  };
};

export default useRealTimeStatus;
