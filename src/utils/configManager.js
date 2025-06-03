// 配置管理工具
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

// 获取所有环境配置
export const getEnvironments = () => {
  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('读取配置失败:', error);
  }
  return defaultEnvironments;
};

// 保存环境配置
export const saveEnvironments = (environments) => {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(environments));
    return true;
  } catch (error) {
    console.error('保存配置失败:', error);
    return false;
  }
};

// 添加新环境
export const addEnvironment = (environment) => {
  const environments = getEnvironments();
  const newEnvironment = {
    ...environment,
    id: environment.id || generateId(),
    lastDeployed: new Date().toISOString().slice(0, 19).replace('T', ' ')
  };
  environments.push(newEnvironment);
  return saveEnvironments(environments);
};

// 更新环境
export const updateEnvironment = (id, updatedEnvironment) => {
  const environments = getEnvironments();
  const index = environments.findIndex(env => env.id === id);
  if (index !== -1) {
    environments[index] = { ...environments[index], ...updatedEnvironment };
    return saveEnvironments(environments);
  }
  return false;
};

// 删除环境
export const deleteEnvironment = (id) => {
  const environments = getEnvironments();
  const filtered = environments.filter(env => env.id !== id);
  return saveEnvironments(filtered);
};

// 生成唯一ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 导出配置
export const exportConfig = () => {
  const environments = getEnvironments();
  const config = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    environments
  };
  return JSON.stringify(config, null, 2);
};

// 导入配置
export const importConfig = (configString) => {
  try {
    const config = JSON.parse(configString);
    if (config.environments && Array.isArray(config.environments)) {
      return saveEnvironments(config.environments);
    }
    return false;
  } catch (error) {
    console.error('导入配置失败:', error);
    return false;
  }
};

// 重置为默认配置
export const resetToDefault = () => {
  return saveEnvironments(defaultEnvironments);
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
