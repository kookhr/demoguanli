// 配置管理工具 - 使用 Cloudflare KV
import { kvApi } from './kvApi.js';
import { environments as defaultEnvironments } from '../data/environments.js';

const CONFIG_STORAGE_KEY = 'environment_config';
const KV_KEY = 'environments';
const GROUPS_KV_KEY = 'environment_groups';
const GROUP_STATES_KEY = 'group_states';

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
  
  if (!['internal', 'external'].includes(environment.network)) {
    errors.push('网络类型无效');
  }
  
  if (!['online', 'offline', 'maintenance'].includes(environment.status)) {
    errors.push('环境状态无效');
  }
  
  return errors;
};

// ==================== 分组管理功能 ====================

// 获取所有分组
export const getGroups = async () => {
  try {
    const groups = await kvApi.get(GROUPS_KV_KEY);
    if (groups && Array.isArray(groups)) {
      return groups;
    }
    return [];
  } catch (error) {
    console.error('获取分组失败:', error);
    return [];
  }
};

// 保存分组
export const saveGroups = async (groups) => {
  try {
    await kvApi.put(GROUPS_KV_KEY, groups);
    return true;
  } catch (error) {
    console.error('保存分组失败:', error);
    return false;
  }
};

// 添加新分组
export const addGroup = async (groupName) => {
  try {
    const groups = await getGroups();
    const newGroup = {
      id: generateId(),
      name: groupName,
      createdAt: new Date().toISOString(),
      environmentIds: []
    };
    groups.push(newGroup);
    await saveGroups(groups);
    return newGroup;
  } catch (error) {
    console.error('添加分组失败:', error);
    return null;
  }
};

// 更新分组
export const updateGroup = async (groupId, updates) => {
  try {
    const groups = await getGroups();
    const index = groups.findIndex(group => group.id === groupId);
    if (index !== -1) {
      groups[index] = { ...groups[index], ...updates };
      await saveGroups(groups);
      return groups[index];
    }
    return null;
  } catch (error) {
    console.error('更新分组失败:', error);
    return null;
  }
};

// 删除分组
export const deleteGroup = async (groupId) => {
  try {
    const groups = await getGroups();
    const environments = await getEnvironments();

    // 将分组中的环境移到未分组
    const updatedEnvironments = environments.map(env =>
      env.groupId === groupId ? { ...env, groupId: null } : env
    );

    const filteredGroups = groups.filter(group => group.id !== groupId);

    await saveGroups(filteredGroups);
    await saveEnvironments(updatedEnvironments);

    return { groups: filteredGroups, environments: updatedEnvironments };
  } catch (error) {
    console.error('删除分组失败:', error);
    return null;
  }
};

// 将环境分配到分组
export const assignEnvironmentToGroup = async (environmentId, groupId) => {
  try {
    const environments = await getEnvironments();
    const index = environments.findIndex(env => env.id === environmentId);
    if (index !== -1) {
      environments[index].groupId = groupId;
      await saveEnvironments(environments);
      return environments[index];
    }
    return null;
  } catch (error) {
    console.error('分配环境到分组失败:', error);
    return null;
  }
};

// 获取分组状态（展开/折叠）
export const getGroupStates = () => {
  try {
    const states = localStorage.getItem(GROUP_STATES_KEY);
    return states ? JSON.parse(states) : {};
  } catch (error) {
    console.error('获取分组状态失败:', error);
    return {};
  }
};

// 保存分组状态
export const saveGroupStates = (states) => {
  try {
    localStorage.setItem(GROUP_STATES_KEY, JSON.stringify(states));
    return true;
  } catch (error) {
    console.error('保存分组状态失败:', error);
    return false;
  }
};

// 获取分组化的环境数据
export const getGroupedEnvironments = async () => {
  try {
    const [environments, groups] = await Promise.all([
      getEnvironments(),
      getGroups()
    ]);

    const groupedData = {
      groups: [],
      ungrouped: []
    };

    // 创建分组映射
    const groupMap = new Map(groups.map(group => [group.id, { ...group, environments: [] }]));

    // 分配环境到分组
    environments.forEach(env => {
      if (env.groupId && groupMap.has(env.groupId)) {
        groupMap.get(env.groupId).environments.push(env);
      } else {
        groupedData.ungrouped.push(env);
      }
    });

    // 转换为数组
    groupedData.groups = Array.from(groupMap.values());

    return groupedData;
  } catch (error) {
    console.error('获取分组化环境数据失败:', error);
    return { groups: [], ungrouped: [] };
  }
};
