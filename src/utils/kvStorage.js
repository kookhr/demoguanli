// Cloudflare KV 存储管理器

class KVStorageManager {
  constructor() {
    this.isCloudflare = typeof ENV_CONFIG !== 'undefined';
    this.fallbackKey = 'environment-configs';
  }

  // 检查是否在 Cloudflare 环境中运行
  isKVAvailable() {
    return this.isCloudflare && typeof ENV_CONFIG !== 'undefined';
  }

  // 获取所有环境配置
  async getEnvironments() {
    try {
      if (this.isKVAvailable()) {
        // 从 Cloudflare KV 获取
        const data = await ENV_CONFIG.get('environments', 'json');
        return data || [];
      } else {
        // 降级到 localStorage
        const data = localStorage.getItem(this.fallbackKey);
        return data ? JSON.parse(data) : [];
      }
    } catch (error) {
      console.error('获取环境配置失败:', error);
      return [];
    }
  }

  // 保存环境配置
  async saveEnvironments(environments) {
    try {
      if (this.isKVAvailable()) {
        // 保存到 Cloudflare KV
        await ENV_CONFIG.put('environments', JSON.stringify(environments));
        
        // 同时保存备份到 localStorage
        localStorage.setItem(this.fallbackKey, JSON.stringify(environments));
        
        return { success: true, storage: 'kv' };
      } else {
        // 降级到 localStorage
        localStorage.setItem(this.fallbackKey, JSON.stringify(environments));
        return { success: true, storage: 'localStorage' };
      }
    } catch (error) {
      console.error('保存环境配置失败:', error);
      
      // KV 失败时降级到 localStorage
      try {
        localStorage.setItem(this.fallbackKey, JSON.stringify(environments));
        return { success: true, storage: 'localStorage', error: error.message };
      } catch (localError) {
        return { success: false, error: localError.message };
      }
    }
  }

  // 获取单个环境配置
  async getEnvironment(id) {
    const environments = await this.getEnvironments();
    return environments.find(env => env.id === id);
  }

  // 添加环境配置
  async addEnvironment(environment) {
    const environments = await this.getEnvironments();
    const newEnvironment = {
      ...environment,
      id: environment.id || `env_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    environments.push(newEnvironment);
    const result = await this.saveEnvironments(environments);
    
    return { ...result, environment: newEnvironment };
  }

  // 更新环境配置
  async updateEnvironment(id, updates) {
    const environments = await this.getEnvironments();
    const index = environments.findIndex(env => env.id === id);
    
    if (index === -1) {
      throw new Error(`环境 ${id} 不存在`);
    }
    
    environments[index] = {
      ...environments[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    const result = await this.saveEnvironments(environments);
    return { ...result, environment: environments[index] };
  }

  // 删除环境配置
  async deleteEnvironment(id) {
    const environments = await this.getEnvironments();
    const filteredEnvironments = environments.filter(env => env.id !== id);
    
    if (filteredEnvironments.length === environments.length) {
      throw new Error(`环境 ${id} 不存在`);
    }
    
    return await this.saveEnvironments(filteredEnvironments);
  }

  // 导出配置
  async exportConfig() {
    const environments = await this.getEnvironments();
    const config = {
      version: '1.0',
      exportTime: new Date().toISOString(),
      storage: this.isKVAvailable() ? 'cloudflare-kv' : 'localStorage',
      environments
    };
    
    return config;
  }

  // 导入配置
  async importConfig(config) {
    try {
      let environments = [];
      
      if (config.environments && Array.isArray(config.environments)) {
        environments = config.environments.map(env => ({
          ...env,
          importedAt: new Date().toISOString()
        }));
      } else if (Array.isArray(config)) {
        // 兼容旧格式
        environments = config;
      } else {
        throw new Error('无效的配置格式');
      }
      
      const result = await this.saveEnvironments(environments);
      return { ...result, imported: environments.length };
    } catch (error) {
      console.error('导入配置失败:', error);
      throw error;
    }
  }

  // 获取存储信息
  async getStorageInfo() {
    const environments = await this.getEnvironments();
    
    return {
      storage: this.isKVAvailable() ? 'cloudflare-kv' : 'localStorage',
      environmentCount: environments.length,
      isKVAvailable: this.isKVAvailable(),
      lastUpdate: environments.length > 0 
        ? Math.max(...environments.map(env => new Date(env.updatedAt || env.createdAt || 0).getTime()))
        : null
    };
  }

  // 同步 localStorage 到 KV（用于迁移）
  async syncLocalStorageToKV() {
    if (!this.isKVAvailable()) {
      throw new Error('KV 存储不可用');
    }

    try {
      const localData = localStorage.getItem(this.fallbackKey);
      if (localData) {
        const environments = JSON.parse(localData);
        await ENV_CONFIG.put('environments', JSON.stringify(environments));
        return { success: true, synced: environments.length };
      }
      return { success: true, synced: 0 };
    } catch (error) {
      console.error('同步到 KV 失败:', error);
      throw error;
    }
  }
}

// 创建全局实例
export const kvStorage = new KVStorageManager();

// 兼容性函数，保持与现有代码的兼容
export const getEnvironments = () => kvStorage.getEnvironments();
export const saveEnvironments = (environments) => kvStorage.saveEnvironments(environments);
export const addEnvironment = (environment) => kvStorage.addEnvironment(environment);
export const updateEnvironment = (id, updates) => kvStorage.updateEnvironment(id, updates);
export const deleteEnvironment = (id) => kvStorage.deleteEnvironment(id);
export const exportConfig = () => kvStorage.exportConfig();
export const importConfig = (config) => kvStorage.importConfig(config);

export default kvStorage;
