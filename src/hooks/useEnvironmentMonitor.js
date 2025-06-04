import { useState, useEffect, useCallback, useRef } from 'react';

// 简化的状态检测函数
const checkEnvironmentStatus = async (environment) => {
  const startTime = Date.now();
  
  try {
    // 使用 AbortController 来设置超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

    const response = await fetch(environment.url, {
      method: 'HEAD', // 使用 HEAD 请求减少数据传输
      mode: 'no-cors', // 避免 CORS 问题
      signal: controller.signal,
      cache: 'no-cache'
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    return {
      id: environment.id,
      status: 'online',
      responseTime,
      lastChecked: new Date().toISOString(),
      error: null
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    let status = 'offline';
    if (error.name === 'AbortError') {
      status = 'timeout';
    } else if (error.message.includes('network')) {
      status = 'network_error';
    }

    return {
      id: environment.id,
      status,
      responseTime,
      lastChecked: new Date().toISOString(),
      error: error.message
    };
  }
};

// 批量检测环境状态
const checkMultipleEnvironments = async (environments, onProgress) => {
  const results = {};
  const total = environments.length;
  let completed = 0;

  // 并发检测，但限制并发数量
  const concurrency = 3;
  const chunks = [];
  
  for (let i = 0; i < environments.length; i += concurrency) {
    chunks.push(environments.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async (env) => {
      const result = await checkEnvironmentStatus(env);
      results[env.id] = result;
      completed++;
      
      if (onProgress) {
        onProgress({
          completed,
          total,
          percentage: Math.round((completed / total) * 100),
          current: env.name
        });
      }
      
      return result;
    });

    await Promise.all(promises);
  }

  return results;
};

// 环境监控 Hook
export const useEnvironmentMonitor = (environments = [], options = {}) => {
  const {
    autoCheck = false,
    interval = 30000, // 30秒
    enableRealtime = true
  } = options;

  const [statuses, setStatuses] = useState({});
  const [isChecking, setIsChecking] = useState(false);
  const [progress, setProgress] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  // 检测单个环境
  const checkSingle = useCallback(async (environment) => {
    if (!environment) return null;

    setStatuses(prev => ({
      ...prev,
      [environment.id]: {
        ...prev[environment.id],
        isChecking: true
      }
    }));

    try {
      const result = await checkEnvironmentStatus(environment);
      
      if (mountedRef.current) {
        setStatuses(prev => ({
          ...prev,
          [environment.id]: {
            ...result,
            isChecking: false
          }
        }));
      }
      
      return result;
    } catch (error) {
      if (mountedRef.current) {
        setStatuses(prev => ({
          ...prev,
          [environment.id]: {
            id: environment.id,
            status: 'error',
            error: error.message,
            lastChecked: new Date().toISOString(),
            isChecking: false
          }
        }));
      }
      return null;
    }
  }, []);

  // 检测所有环境
  const checkAll = useCallback(async () => {
    if (!environments.length || isChecking) return;

    setIsChecking(true);
    setProgress({ completed: 0, total: environments.length, percentage: 0 });

    try {
      const results = await checkMultipleEnvironments(environments, (progressInfo) => {
        if (mountedRef.current) {
          setProgress(progressInfo);
        }
      });

      if (mountedRef.current) {
        setStatuses(prev => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(results).map(([id, result]) => [
              id,
              { ...result, isChecking: false }
            ])
          )
        }));
        setLastUpdate(new Date().toISOString());
      }
    } catch (error) {
      console.error('批量检测失败:', error);
    } finally {
      if (mountedRef.current) {
        setIsChecking(false);
        setProgress(null);
      }
    }
  }, [environments, isChecking]);

  // 获取环境状态
  const getStatus = useCallback((environmentId) => {
    return statuses[environmentId] || {
      status: 'unknown',
      lastChecked: null,
      responseTime: null,
      isChecking: false
    };
  }, [statuses]);

  // 获取状态统计
  const getStatusSummary = useCallback(() => {
    const summary = {
      total: environments.length,
      online: 0,
      offline: 0,
      timeout: 0,
      error: 0,
      unknown: 0,
      checking: 0
    };

    environments.forEach(env => {
      const status = getStatus(env.id);
      if (status.isChecking) {
        summary.checking++;
      } else {
        summary[status.status] = (summary[status.status] || 0) + 1;
      }
    });

    return summary;
  }, [environments, getStatus]);

  // 自动检测
  useEffect(() => {
    if (!enableRealtime || !autoCheck || !environments.length) {
      return;
    }

    // 立即检测一次
    checkAll();

    // 设置定时检测
    intervalRef.current = setInterval(() => {
      if (mountedRef.current && !isChecking) {
        checkAll();
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoCheck, interval, enableRealtime, environments.length, checkAll, isChecking]);

  // 清理
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    statuses,
    isChecking,
    progress,
    lastUpdate,
    checkSingle,
    checkAll,
    getStatus,
    getStatusSummary
  };
};

export default useEnvironmentMonitor;
