// Cloudflare KV 存储管理器
import { kvDetector } from './kvDetector.js';

class KVStorageManager {
  constructor() {
    this.fallbackKey = 'environment-configs';
    this.kvBinding = null;
    this.kvAvailable = null; // 缓存检测结果
    this.detectionPromise = null; // 检测 Promise
    this.initKV();
  }

  // 初始化 KV 连接
  initKV() {
    // 避免重复检测
    if (this.detectionPromise) {
      return this.detectionPromise;
    }

    this.detectionPromise = this.runKVDetection();
    return this.detectionPromise;
  }

  // 运行 KV 检测
  async runKVDetection() {
    try {
      console.log('🔍 启动增强型 KV 检测...');

      // 使用专门的检测器
      const result = await kvDetector.runFullDetection();

      if (result.success && result.binding) {
        this.kvBinding = result.binding;
        this.kvAvailable = true;
        console.log('✅ KV 检测成功，绑定已建立');
      } else {
        this.kvAvailable = false;
        console.log('❌ KV 检测失败，将使用 localStorage');

        // 显示诊断建议
        const suggestions = kvDetector.getDiagnosticSuggestions();
        if (suggestions.length > 0) {
          console.log('💡 诊断建议:');
          suggestions.forEach(suggestion => {
            console.log(`- ${suggestion.title}: ${suggestion.description}`);
          });
        }
      }

      return result;
    } catch (error) {
      console.error('KV 检测过程失败:', error);
      this.kvAvailable = false;
      return { success: false, error: error.message };
    }
  }

  // 手动重试 KV 检测
  async retryKVDetection() {
    console.log('🔄 手动重试 KV 检测...');
    this.detectionPromise = null; // 清除缓存
    this.kvAvailable = null;
    this.kvBinding = null;

    return await this.initKV();
  }

  // 检查是否在 Cloudflare 环境中运行
  isKVAvailable() {
    // 如果还在检测中，返回 false（降级到 localStorage）
    if (this.kvAvailable === null) {
      return false;
    }

    return this.kvAvailable;
  }

  // 获取 KV 实例
  getKV() {
    if (!this.isKVAvailable()) {
      return null;
    }
    return this.kvBinding;
  }

  // 获取所有环境配置
  async getEnvironments() {
    try {
      const kv = this.getKV();
      if (kv) {
        console.log('📖 从 KV 读取环境配置...');
        const data = await kv.get('environments', 'json');
        console.log('📖 KV 读取结果:', data ? `${data.length} 个环境` : '无数据');
        return data || [];
      } else {
        // 降级到 localStorage
        console.log('📖 从 localStorage 读取环境配置...');
        const data = localStorage.getItem(this.fallbackKey);
        const result = data ? JSON.parse(data) : [];
        console.log('📖 localStorage 读取结果:', `${result.length} 个环境`);
        return result;
      }
    } catch (error) {
      console.error('获取环境配置失败:', error);

      // 降级到 localStorage
      try {
        const data = localStorage.getItem(this.fallbackKey);
        return data ? JSON.parse(data) : [];
      } catch (localError) {
        console.error('localStorage 读取也失败:', localError);
        return [];
      }
    }
  }

  // 保存环境配置
  async saveEnvironments(environments) {
    try {
      const kv = this.getKV();
      if (kv) {
        console.log('💾 保存到 KV 存储...', `${environments.length} 个环境`);
        await kv.put('environments', JSON.stringify(environments));

        // 同时保存备份到 localStorage
        localStorage.setItem(this.fallbackKey, JSON.stringify(environments));
        console.log('✅ KV 保存成功');

        return { success: true, storage: 'cloudflare-kv' };
      } else {
        // 降级到 localStorage
        console.log('💾 保存到 localStorage...', `${environments.length} 个环境`);
        localStorage.setItem(this.fallbackKey, JSON.stringify(environments));
        console.log('✅ localStorage 保存成功');
        return { success: true, storage: 'localStorage' };
      }
    } catch (error) {
      console.error('保存环境配置失败:', error);

      // KV 失败时降级到 localStorage
      try {
        console.log('🔄 KV 失败，降级到 localStorage...');
        localStorage.setItem(this.fallbackKey, JSON.stringify(environments));
        return { success: true, storage: 'localStorage', error: error.message };
      } catch (localError) {
        console.error('localStorage 保存也失败:', localError);
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
    const kv = this.getKV();
    if (!kv) {
      throw new Error('KV 存储不可用');
    }

    try {
      console.log('🔄 开始同步 localStorage 到 KV...');
      const localData = localStorage.getItem(this.fallbackKey);
      if (localData) {
        const environments = JSON.parse(localData);
        console.log(`📤 同步 ${environments.length} 个环境到 KV...`);
        await kv.put('environments', JSON.stringify(environments));
        console.log('✅ 同步完成');
        return { success: true, synced: environments.length };
      }
      console.log('📭 localStorage 中无数据需要同步');
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
