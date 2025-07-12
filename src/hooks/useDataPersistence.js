import { useState, useEffect, useCallback, useRef } from 'react';

// 本地存储Hook
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
};

// 会话存储Hook
export const useSessionStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting sessionStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
};

// 用户偏好设置Hook
export const useUserPreferences = () => {
  const [preferences, setPreferences] = useLocalStorage('user-preferences', {
    theme: 'system',
    language: 'zh-CN',
    autoRefresh: true,
    refreshInterval: 30000,
    showNotifications: true,
    compactView: false,
    favoriteEnvironments: [],
    recentSearches: [],
    gridColumns: 'auto',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  const updatePreference = useCallback((key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  }, [setPreferences]);

  const resetPreferences = useCallback(() => {
    setPreferences({
      theme: 'system',
      language: 'zh-CN',
      autoRefresh: true,
      refreshInterval: 30000,
      showNotifications: true,
      compactView: false,
      favoriteEnvironments: [],
      recentSearches: [],
      gridColumns: 'auto',
      sortBy: 'name',
      sortOrder: 'asc'
    });
  }, [setPreferences]);

  return {
    preferences,
    updatePreference,
    resetPreferences
  };
};

// 缓存Hook
export const useCache = (key, fetchFunction, options = {}) => {
  const {
    ttl = 5 * 60 * 1000, // 5分钟默认TTL
    staleWhileRevalidate = true,
    maxRetries = 3
  } = options;

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const retryCount = useRef(0);

  // 从缓存获取数据
  const getCachedData = useCallback(() => {
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const isExpired = Date.now() - timestamp > ttl;
        
        if (!isExpired || staleWhileRevalidate) {
          return { data, isExpired };
        }
      }
    } catch (error) {
      console.warn('Error reading cache:', error);
    }
    return { data: null, isExpired: true };
  }, [key, ttl, staleWhileRevalidate]);

  // 设置缓存数据
  const setCachedData = useCallback((data) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Error setting cache:', error);
    }
  }, [key]);

  // 获取数据
  const fetchData = useCallback(async (force = false) => {
    const { data: cachedData, isExpired } = getCachedData();
    
    // 如果有缓存且未过期，直接返回
    if (cachedData && !isExpired && !force) {
      setData(cachedData);
      return cachedData;
    }

    // 如果有过期的缓存数据，先显示它
    if (cachedData && staleWhileRevalidate) {
      setData(cachedData);
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFunction();
      setData(result);
      setCachedData(result);
      setLastFetch(Date.now());
      retryCount.current = 0;
      return result;
    } catch (err) {
      setError(err);
      retryCount.current += 1;
      
      // 如果有缓存数据，继续使用
      if (cachedData) {
        setData(cachedData);
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunction, getCachedData, setCachedData, staleWhileRevalidate]);

  // 重试
  const retry = useCallback(() => {
    if (retryCount.current < maxRetries) {
      return fetchData(true);
    }
    throw new Error('Max retries exceeded');
  }, [fetchData, maxRetries]);

  // 清除缓存
  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(`cache_${key}`);
      setData(null);
      setLastFetch(null);
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  }, [key]);

  // 初始加载
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    lastFetch,
    refetch: () => fetchData(true),
    retry,
    clearCache
  };
};

// 离线数据同步Hook
export const useOfflineSync = (key, syncFunction) => {
  const [pendingChanges, setPendingChanges] = useLocalStorage(`offline_${key}`, []);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  // 监听网络状态
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 添加待同步的更改
  const addPendingChange = useCallback((change) => {
    setPendingChanges(prev => [...prev, {
      ...change,
      timestamp: Date.now(),
      id: Date.now() + Math.random()
    }]);
  }, [setPendingChanges]);

  // 同步数据
  const syncData = useCallback(async () => {
    if (!isOnline || pendingChanges.length === 0 || isSyncing) {
      return;
    }

    setIsSyncing(true);
    
    try {
      for (const change of pendingChanges) {
        await syncFunction(change);
      }
      
      // 清除已同步的更改
      setPendingChanges([]);
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, pendingChanges, isSyncing, syncFunction, setPendingChanges]);

  // 网络恢复时自动同步
  useEffect(() => {
    if (isOnline && pendingChanges.length > 0) {
      syncData();
    }
  }, [isOnline, pendingChanges.length, syncData]);

  return {
    isOnline,
    pendingChanges: pendingChanges.length,
    isSyncing,
    addPendingChange,
    syncData
  };
};

// 数据版本控制Hook
export const useDataVersioning = (key, initialData = null) => {
  const [versions, setVersions] = useLocalStorage(`versions_${key}`, []);
  const [currentVersion, setCurrentVersion] = useState(0);

  // 保存新版本
  const saveVersion = useCallback((data, description = '') => {
    const newVersion = {
      id: Date.now(),
      data: JSON.parse(JSON.stringify(data)), // 深拷贝
      timestamp: Date.now(),
      description,
      version: versions.length + 1
    };

    setVersions(prev => [...prev.slice(-9), newVersion]); // 保留最近10个版本
    setCurrentVersion(newVersion.version);
    
    return newVersion;
  }, [versions, setVersions]);

  // 恢复到指定版本
  const restoreVersion = useCallback((versionId) => {
    const version = versions.find(v => v.id === versionId);
    if (version) {
      setCurrentVersion(version.version);
      return version.data;
    }
    return null;
  }, [versions]);

  // 获取版本历史
  const getVersionHistory = useCallback(() => {
    return versions.map(v => ({
      id: v.id,
      version: v.version,
      timestamp: v.timestamp,
      description: v.description
    }));
  }, [versions]);

  // 清除版本历史
  const clearHistory = useCallback(() => {
    setVersions([]);
    setCurrentVersion(0);
  }, [setVersions]);

  return {
    versions: getVersionHistory(),
    currentVersion,
    saveVersion,
    restoreVersion,
    clearHistory
  };
};
