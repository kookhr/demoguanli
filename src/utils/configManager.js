// 配置管理工具 - Serv00 数据库版本
import { environments as defaultEnvironments } from '../data/environments.js';
import databaseAPI from './databaseApi.js';

// 存储键名（用于本地缓存）
const STORAGE_KEYS = {
  environments: 'environments_cache',
  settings: 'app_settings',
  lastSync: 'last_sync_time'
};

// 缓存过期时间（5分钟）
const CACHE_EXPIRY = 5 * 60 * 1000;

// 本地缓存工具函数
const saveToCache = (key, data) => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(cacheData));
  } catch (error) {
    console.warn('保存到本地缓存失败:', error);
  }
};

const getFromCache = (key) => {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS[key]);
    if (!cached) return null;

    const cacheData = JSON.parse(cached);
    const isExpired = Date.now() - cacheData.timestamp > CACHE_EXPIRY;

    if (isExpired) {
      localStorage.removeItem(STORAGE_KEYS[key]);
      return null;
    }

    return cacheData.data;
  } catch (error) {
    console.warn('从本地缓存读取失败:', error);
    return null;
  }
};

const getFromCacheIgnoreExpiry = (key) => {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS[key]);
    if (!cached) return null;

    const cacheData = JSON.parse(cached);
    return cacheData.data;
  } catch (error) {
    return null;
  }
};

// 获取所有环境配置
export const getEnvironments = async () => {
  try {
    // 检查本地缓存
    const cached = getFromCache('environments');
    if (cached) {
      return cached;
    }

    // 从数据库获取
    const environments = await databaseAPI.getEnvironments();

    if (environments && Array.isArray(environments)) {
      // 缓存到本地
      saveToCache('environments', environments);
      return environments;
    }

    // 如果数据库中没有数据，返回默认数据
    return defaultEnvironments;
  } catch (error) {
    console.warn('从数据库获取环境配置失败，使用本地缓存或默认配置:', error);

    // 尝试使用本地缓存（忽略过期时间）
    const cached = getFromCacheIgnoreExpiry('environments');
    if (cached) {
      return cached;
    }

    return defaultEnvironments;
  }
};

// 保存环境配置（批量更新）
export const saveEnvironments = async (environments) => {
  try {
    // 这个函数主要用于导入，实际应该逐个调用 API
    // 为了兼容性，这里先缓存到本地
    saveToCache('environments', environments);
    return true;
  } catch (error) {
    console.error('保存环境配置失败:', error);
    return false;
  }
};

// 添加新环境
export const addEnvironment = async (environment) => {
  try {
    const newEnvironment = {
      ...environment,
      id: environment.id || generateId(),
      created_at: new Date().toISOString()
    };

    // 调用数据库 API 创建环境
    const result = await databaseAPI.createEnvironment(newEnvironment);

    if (result) {
      // 清除缓存以强制重新获取
      localStorage.removeItem(STORAGE_KEYS.environments);
      return result;
    }

    return null;
  } catch (error) {
    console.error('添加环境失败:', error);
    return null;
  }
};

// 更新环境
export const updateEnvironment = async (id, updatedEnvironment) => {
  try {
    // 调用数据库 API 更新环境
    const result = await databaseAPI.updateEnvironment(id, updatedEnvironment);

    if (result) {
      // 清除缓存以强制重新获取
      localStorage.removeItem(STORAGE_KEYS.environments);
      return result;
    }

    return null;
  } catch (error) {
    console.error('更新环境失败:', error);
    return null;
  }
};

// 删除环境
export const deleteEnvironment = async (id) => {
  try {
    // 调用数据库 API 删除环境
    const result = await databaseAPI.deleteEnvironment(id);

    if (result) {
      // 清除缓存以强制重新获取
      localStorage.removeItem(STORAGE_KEYS.environments);
      return true;
    }

    return false;
  } catch (error) {
    console.error('删除环境失败:', error);
    return false;
  }
};

// 生成唯一ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 导出配置
export const exportConfig = async () => {
  try {
    const environments = await getEnvironments();
    const config = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      environments
    };
    return JSON.stringify(config, null, 2);
  } catch (error) {
    throw error;
  }
};

// 导入配置
export const importConfig = async (configString) => {
  try {
    const config = JSON.parse(configString);
    if (config.environments && Array.isArray(config.environments)) {
      await saveEnvironments(config.environments);
      return config.environments;
    }
    return false;
  } catch (error) {
    throw error;
  }
};



// 验证环境配置
export const validateEnvironment = (environment) => {
  const errors = [];
  
  if (!environment.id || environment.id.trim() === '') {
    errors.push('环境ID不能为空');
  }
  
  if (!environment.name || environment.name.trim() === '') {
    errors.push('环境名称不能为空');
  }
  
  if (!environment.url || environment.url.trim() === '') {
    errors.push('环境URL不能为空');
  }
  
  if (!['开发环境', '测试环境', '预生产环境', '生产环境', '演示环境'].includes(environment.type)) {
    errors.push('环境类型无效');
  }
  
  // 网络类型现在仅作为分类标签，不进行严格验证
  // 允许任何网络类型值，但建议使用 'internal' 或 'external'
  if (!environment.network || environment.network.trim() === '') {
    errors.push('网络类型不能为空');
  }
  
  if (!['online', 'offline', 'maintenance'].includes(environment.status)) {
    errors.push('环境状态无效');
  }
  
  return errors;
};
