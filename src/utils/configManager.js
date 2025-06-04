// 配置管理工具 - 使用 Cloudflare KV
import { kvApi } from './kvApi.js';
import { environments as defaultEnvironments } from '../data/environments.js';

const CONFIG_STORAGE_KEY = 'environment_config';
const KV_KEY = 'environments';

// 获取所有环境配置
export const getEnvironments = async () => {
  try {
    // 尝试从 KV 获取
    const environments = await kvApi.get(KV_KEY);
    if (environments && Array.isArray(environments) && environments.length > 0) {
      console.log('✅ 从 KV 获取到环境配置:', environments.length, '个');
      return environments;
    } else {
      console.log('📋 KV 中无数据，使用默认配置');
      return defaultEnvironments;
    }
  } catch (error) {
    console.error('❌ 从 KV 获取环境配置失败，使用默认配置:', error);
    return defaultEnvironments;
  }
};

// 保存环境配置
export const saveEnvironments = async (environments) => {
  try {
    await kvApi.put(KV_KEY, environments);
    return true;
  } catch (error) {
    console.error('保存环境配置失败:', error);
    return false;
  }
};

// 添加新环境
export const addEnvironment = async (environment) => {
  try {
    const environments = await getEnvironments();
    const newEnvironment = {
      ...environment,
      id: environment.id || generateId(),
      lastDeployed: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };
    environments.push(newEnvironment);
    await saveEnvironments(environments);
    return newEnvironment;
  } catch (error) {
    console.error('添加环境失败:', error);
    return null;
  }
};

// 更新环境
export const updateEnvironment = async (id, updatedEnvironment) => {
  try {
    const environments = await getEnvironments();
    const index = environments.findIndex(env => env.id === id);
    if (index !== -1) {
      environments[index] = { ...environments[index], ...updatedEnvironment };
      await saveEnvironments(environments);
      return environments[index];
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
    const environments = await getEnvironments();
    const filtered = environments.filter(env => env.id !== id);
    await saveEnvironments(filtered);
    return filtered;
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
    const environments = await getEnvironments();
    const config = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      environments
    };
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
    if (config.environments && Array.isArray(config.environments)) {
      await saveEnvironments(config.environments);
      return config.environments;
    }
    return false;
  } catch (error) {
    console.error('导入配置失败:', error);
    throw error;
  }
};

// 重置为默认配置
export const resetToDefault = async () => {
  return await saveEnvironments(defaultEnvironments);
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
