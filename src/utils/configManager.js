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
    if (!config.environments || !Array.isArray(config.environments)) {
      throw new Error('配置文件格式不正确：缺少 environments 数组');
    }

    // 验证配置数据格式
    const validEnvironments = config.environments.filter(env => {
      return env.name && env.url && typeof env.name === 'string' && typeof env.url === 'string';
    });

    if (validEnvironments.length === 0) {
      throw new Error('配置文件中没有有效的环境数据');
    }

    console.log(`准备导入 ${validEnvironments.length} 个环境配置`);

    // 调用数据库API进行导入
    const importData = {
      environments: validEnvironments.map(env => ({
        id: env.id || generateId(),
        name: env.name,
        url: env.url,
        description: env.description || '',
        version: env.version || '',
        network_type: env.network_type || 'external',
        environment_type: env.environment_type || 'development',
        tags: env.tags || [],
        group_id: env.group_id || null
      }))
    };

    const result = await databaseAPI.importData(importData);

    if (result) {
      // 清除缓存以强制重新获取
      localStorage.removeItem(STORAGE_KEYS.environments);
      console.log('配置导入成功，已清除本地缓存');
      return validEnvironments;
    }

    throw new Error('数据库导入失败');
  } catch (error) {
    console.error('配置导入失败:', error);
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

// 生成唯一ID
const generateId = () => {
  return 'env_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// 验证导入结果
export const verifyImportResult = async () => {
  try {
    console.log('开始验证导入结果...');

    // 从数据库重新获取环境列表
    const environments = await databaseAPI.getEnvironments();

    if (environments && environments.length > 0) {
      console.log(`验证成功：数据库中有 ${environments.length} 个环境`);

      // 更新本地缓存
      localStorage.setItem(STORAGE_KEYS.environments, JSON.stringify(environments));

      return {
        success: true,
        count: environments.length,
        environments: environments
      };
    } else {
      console.warn('验证失败：数据库中没有环境数据');
      return {
        success: false,
        count: 0,
        error: '数据库中没有找到环境数据'
      };
    }
  } catch (error) {
    console.error('验证导入结果失败:', error);
    return {
      success: false,
      count: 0,
      error: error.message
    };
  }
};

// 调试数据库连接
export const debugDatabaseConnection = async () => {
  try {
    console.log('测试数据库连接...');

    const result = await databaseAPI.healthCheck();
    console.log('数据库连接测试结果:', result);

    return result;
  } catch (error) {
    console.error('数据库连接测试失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
