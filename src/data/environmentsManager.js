// 环境数据管理 - 使用KV存储
import { environmentsAPI } from '../utils/apiClient';
import { environments as staticEnvironments } from './defaultEnvironments';

// 将静态环境数据转换为KV格式
function convertStaticToKVFormat(staticEnv) {
  return {
    name: staticEnv.name,
    url: staticEnv.url,
    description: staticEnv.description,
    tags: staticEnv.tags || [],
    networkType: staticEnv.network || 'external',
    group: staticEnv.type || 'default',
    version: staticEnv.version,
    services: staticEnv.services
  };
}

// 从KV存储获取环境数据
export async function getEnvironments() {
  try {
    const environments = await environmentsAPI.getAll();
    
    // 如果没有环境数据，初始化默认数据
    if (environments.length === 0) {
      await initializeDefaultEnvironments();
      return await environmentsAPI.getAll();
    }
    
    return environments;
  } catch (error) {
    console.error('获取环境数据失败:', error);
    // 降级到静态数据
    return getLocalEnvironments();
  }
}

// 初始化默认环境数据
async function initializeDefaultEnvironments() {
  try {
    for (const staticEnv of staticEnvironments) {
      const envData = convertStaticToKVFormat(staticEnv);
      await environmentsAPI.create(envData);
    }
  } catch (error) {
    console.error('初始化默认环境失败:', error);
  }
}

// 降级到本地存储
function getLocalEnvironments() {
  try {
    const stored = localStorage.getItem('environments');
    if (stored) {
      return JSON.parse(stored);
    }
    // 返回转换后的静态数据
    return staticEnvironments.map(env => ({
      id: env.id,
      ...convertStaticToKVFormat(env),
      createdAt: new Date().toISOString()
    }));
  } catch (error) {
    return staticEnvironments.map(env => ({
      id: env.id,
      ...convertStaticToKVFormat(env),
      createdAt: new Date().toISOString()
    }));
  }
}

// 添加新环境
export async function addEnvironment(environmentData) {
  try {
    return await environmentsAPI.create(environmentData);
  } catch (error) {
    console.error('添加环境失败:', error);
    throw error;
  }
}

// 更新环境
export async function updateEnvironment(id, updates) {
  try {
    return await environmentsAPI.update(id, updates);
  } catch (error) {
    console.error('更新环境失败:', error);
    throw error;
  }
}

// 删除环境
export async function deleteEnvironment(id) {
  try {
    await environmentsAPI.delete(id);
    return true;
  } catch (error) {
    console.error('删除环境失败:', error);
    throw error;
  }
}

// 根据ID获取环境
export async function getEnvironmentById(id) {
  try {
    return await environmentsAPI.getById(id);
  } catch (error) {
    console.error('获取环境详情失败:', error);
    return null;
  }
}

// 保存环境状态历史
export async function saveEnvironmentStatus(envId, statusData) {
  try {
    const { kvAPI } = await import('../utils/apiClient');
    await kvAPI.saveStatus(envId, statusData);
  } catch (error) {
    console.error('保存状态历史失败:', error);
  }
}

// 获取环境状态历史
export async function getEnvironmentHistory(envId) {
  try {
    const { kvAPI } = await import('../utils/apiClient');
    return await kvAPI.getHistory(envId);
  } catch (error) {
    console.error('获取状态历史失败:', error);
    return [];
  }
}

// 兼容性函数 - 同步版本（用于不支持async的地方）
export function getEnvironmentsSync() {
  try {
    const stored = localStorage.getItem('environments');
    if (stored) {
      return JSON.parse(stored);
    }
    return staticEnvironments.map(env => ({
      id: env.id,
      ...convertStaticToKVFormat(env),
      createdAt: new Date().toISOString()
    }));
  } catch (error) {
    return staticEnvironments.map(env => ({
      id: env.id,
      ...convertStaticToKVFormat(env),
      createdAt: new Date().toISOString()
    }));
  }
}
