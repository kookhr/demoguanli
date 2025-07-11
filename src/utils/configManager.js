// 配置管理工具 - 使用 Cloudflare KV
import { kvApi } from './kvApi.js';
import { environments as defaultEnvironments } from '../data/environments.js';
import { generateId } from './common.js';

const KV_KEY = 'environments';

// 获取所有环境配置
export const getEnvironments = async () => {
  // 检查是否强制使用默认数据
  if (localStorage.getItem('forceDefaultData') === 'true') {
    console.log('[FORCE] 强制使用默认环境数据，数量:', defaultEnvironments.length);
    return defaultEnvironments;
  }

  // 在开发环境中直接使用默认数据
  if (import.meta.env.DEV) {
    console.log('[DEV] 使用默认环境数据，数量:', defaultEnvironments.length);
    return defaultEnvironments;
  }

  console.log('[PROD] 生产环境，尝试从KV获取数据...');
  try {
    // 尝试从 KV 获取
    const environments = await kvApi.get(KV_KEY);
    console.log('[PROD] KV返回数据:', environments);
    if (environments && Array.isArray(environments) && environments.length > 0) {
      console.log('[PROD] 使用KV数据，数量:', environments.length);
      return environments;
    } else {
      console.log('[PROD] KV无数据，使用默认数据，数量:', defaultEnvironments.length);
      return defaultEnvironments;
    }
  } catch (error) {
    console.error('[PROD] KV获取失败，使用默认数据:', error);
    console.log('[PROD] 默认数据数量:', defaultEnvironments.length);
    return defaultEnvironments;
  }
};

// 保存环境配置
export const saveEnvironments = async (environments) => {
  try {
    await kvApi.put(KV_KEY, environments);
    return true;
  } catch (error) {
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
    return null;
  }
};



// 导出配置
export const exportConfig = async () => {
  const environments = await getEnvironments();
  const config = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    environments
  };
  return JSON.stringify(config, null, 2);
};

// 导入配置
export const importConfig = async (configString) => {
  const config = JSON.parse(configString);
  if (config.environments && Array.isArray(config.environments)) {
    await saveEnvironments(config.environments);
    return config.environments;
  }
  return false;
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
