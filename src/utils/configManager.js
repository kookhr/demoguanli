// 配置管理工具 - 现在支持 Cloudflare KV
import { kvStorage } from './kvStorage.js';

const CONFIG_STORAGE_KEY = 'environment_config';

// 默认环境配置
const defaultEnvironments = [
  {
    id: 'dev',
    name: '开发环境',
    type: 'development',
    network: 'internal',
    url: 'https://dev.example.com',
    status: 'online',
    version: 'v1.2.3-dev',
    lastDeployed: '2024-01-15 14:30:00',
    description: '开发环境，用于日常开发和调试',
    services: [
      { name: 'Web应用', url: 'https://dev.example.com', port: 3000 },
      { name: 'API服务', url: 'https://api-dev.example.com', port: 8080 },
      { name: '数据库', url: 'mysql://db-dev.example.com', port: 3306 }
    ]
  },
  {
    id: 'test',
    name: '测试环境',
    type: 'testing',
    network: 'internal',
    url: 'https://test.example.com',
    status: 'online',
    version: 'v1.2.2',
    lastDeployed: '2024-01-14 16:45:00',
    description: '测试环境，用于功能测试和集成测试',
    services: [
      { name: 'Web应用', url: 'https://test.example.com', port: 3000 },
      { name: 'API服务', url: 'https://api-test.example.com', port: 8080 },
      { name: '数据库', url: 'mysql://db-test.example.com', port: 3306 }
    ]
  },
  {
    id: 'staging',
    name: '预生产环境',
    type: 'staging',
    network: 'external',
    url: 'https://staging.example.com',
    status: 'maintenance',
    version: 'v1.2.1',
    lastDeployed: '2024-01-13 10:20:00',
    description: '预生产环境，用于生产前的最终验证',
    services: [
      { name: 'Web应用', url: 'https://staging.example.com', port: 443 },
      { name: 'API服务', url: 'https://api-staging.example.com', port: 443 },
      { name: '数据库', url: 'mysql://db-staging.example.com', port: 3306 }
    ]
  },
  {
    id: 'prod',
    name: '生产环境',
    type: 'production',
    network: 'external',
    url: 'https://www.example.com',
    status: 'online',
    version: 'v1.2.0',
    lastDeployed: '2024-01-12 09:00:00',
    description: '生产环境，对外提供正式服务',
    services: [
      { name: 'Web应用', url: 'https://www.example.com', port: 443 },
      { name: 'API服务', url: 'https://api.example.com', port: 443 },
      { name: '数据库', url: 'mysql://db.example.com', port: 3306 },
      { name: 'CDN', url: 'https://cdn.example.com', port: 443 }
    ]
  }
];

// 获取所有环境配置 - 优先从 KV，降级到 localStorage
export const getEnvironments = async () => {
  try {
    // 尝试从 KV 获取
    const environments = await kvStorage.getEnvironments();

    // 如果 KV 中没有数据且 localStorage 中有数据，则迁移到 KV
    if (environments.length === 0 && kvStorage.isKVAvailable()) {
      const localData = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (localData) {
        const localEnvironments = JSON.parse(localData);
        await kvStorage.saveEnvironments(localEnvironments);
        return localEnvironments;
      }
    }

    // 如果没有任何配置，返回默认配置
    return environments.length > 0 ? environments : defaultEnvironments;
  } catch (error) {
    console.error('获取环境配置失败:', error);

    // 降级到 localStorage
    try {
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
      return stored ? JSON.parse(stored) : defaultEnvironments;
    } catch (localError) {
      console.error('localStorage 也失败了:', localError);
      return defaultEnvironments;
    }
  }
};

// 保存环境配置
export const saveEnvironments = async (environments) => {
  try {
    const result = await kvStorage.saveEnvironments(environments);
    return result.success;
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
      lastDeployed: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };
    const result = await kvStorage.addEnvironment(newEnvironment);
    return result.environment;
  } catch (error) {
    console.error('添加环境失败:', error);
    return null;
  }
};

// 更新环境
export const updateEnvironment = async (id, updatedEnvironment) => {
  try {
    const result = await kvStorage.updateEnvironment(id, updatedEnvironment);
    return result.environment;
  } catch (error) {
    console.error('更新环境失败:', error);
    return null;
  }
};

// 删除环境
export const deleteEnvironment = async (id) => {
  try {
    await kvStorage.deleteEnvironment(id);
    return await getEnvironments(); // 返回更新后的列表
  } catch (error) {
    console.error('删除环境失败:', error);
    return null;
  }
};

// 生成唯一ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 导出配置
export const exportConfig = async () => {
  try {
    const config = await kvStorage.exportConfig();
    return JSON.stringify(config, null, 2);
  } catch (error) {
    console.error('导出配置失败:', error);
    throw error;
  }
};

// 导入配置
export const importConfig = async (configString) => {
  try {
    const config = JSON.parse(configString);
    await kvStorage.importConfig(config);
    return await getEnvironments(); // 返回导入后的环境列表
  } catch (error) {
    console.error('导入配置失败:', error);
    throw error;
  }
};

// 重置为默认配置
export const resetToDefault = async () => {
  return await saveEnvironments(defaultEnvironments);
};

// 获取存储信息
export const getStorageInfo = async () => {
  try {
    return await kvStorage.getStorageInfo();
  } catch (error) {
    console.error('获取存储信息失败:', error);
    return {
      storage: 'localStorage',
      environmentCount: 0,
      isKVAvailable: false,
      lastUpdate: null
    };
  }
};

// 手动同步到 KV（用于迁移）
export const syncToKV = async () => {
  try {
    return await kvStorage.syncLocalStorageToKV();
  } catch (error) {
    console.error('同步到 KV 失败:', error);
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
  
  if (!['development', 'testing', 'staging', 'production', 'demo'].includes(environment.type)) {
    errors.push('环境类型无效');
  }
  
  if (!['internal', 'external'].includes(environment.network)) {
    errors.push('网络类型无效');
  }
  
  if (!['online', 'offline', 'maintenance'].includes(environment.status)) {
    errors.push('环境状态无效');
  }
  
  return errors;
};
