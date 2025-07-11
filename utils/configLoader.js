/**
 * 配置文件加载器
 * 负责从静态 JSON 文件加载配置数据
 */

class ConfigLoader {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
    this.baseUrl = window.location.origin;
  }

  /**
   * 通用文件加载方法
   */
  async loadFile(filePath, useCache = true) {
    const cacheKey = filePath;
    const now = Date.now();

    // 检查缓存
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (now - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/${filePath}?t=${now}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load ${filePath}: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // 缓存数据
      if (useCache) {
        this.cache.set(cacheKey, {
          data,
          timestamp: now
        });
      }

      return data;
    } catch (error) {
      console.error(`Error loading config file ${filePath}:`, error);
      
      // 如果有缓存数据，返回缓存（即使过期）
      if (this.cache.has(cacheKey)) {
        console.warn(`Using stale cache for ${filePath}`);
        return this.cache.get(cacheKey).data;
      }

      throw error;
    }
  }

  /**
   * 加载环境配置
   */
  async loadEnvironments() {
    try {
      const config = await this.loadFile('config/environments.json');
      return {
        version: config.version,
        lastUpdated: config.lastUpdated,
        environments: config.environments || []
      };
    } catch (error) {
      console.error('Failed to load environments:', error);
      return {
        version: '2.0.0',
        lastUpdated: new Date().toISOString(),
        environments: []
      };
    }
  }

  /**
   * 加载分组配置
   */
  async loadGroups() {
    try {
      const config = await this.loadFile('config/groups.json');
      return {
        version: config.version,
        lastUpdated: config.lastUpdated,
        groups: config.groups || []
      };
    } catch (error) {
      console.error('Failed to load groups:', error);
      return {
        version: '2.0.0',
        lastUpdated: new Date().toISOString(),
        groups: []
      };
    }
  }

  /**
   * 加载应用设置
   */
  async loadSettings() {
    try {
      const config = await this.loadFile('config/settings.json');
      return config;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * 获取默认设置
   */
  getDefaultSettings() {
    return {
      version: '2.0.0',
      app: {
        name: '环境管理系统',
        version: '2.0.0'
      },
      ui: {
        theme: {
          default: 'light',
          allowToggle: true
        },
        layout: {
          gridColumns: { mobile: 1, tablet: 2, desktop: 3 }
        }
      },
      features: {
        statusCheck: { enabled: true, timeout: 10000 },
        search: { enabled: true },
        filters: { enabled: true },
        favorites: { enabled: true },
        history: { enabled: true }
      }
    };
  }

  /**
   * 加载所有配置
   */
  async loadAllConfigs() {
    try {
      const [environments, groups, settings] = await Promise.all([
        this.loadEnvironments(),
        this.loadGroups(),
        this.loadSettings()
      ]);

      return {
        environments,
        groups,
        settings,
        loadedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to load configurations:', error);
      throw error;
    }
  }

  /**
   * 重新加载配置（清除缓存）
   */
  async reloadConfigs() {
    this.clearCache();
    return await this.loadAllConfigs();
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * 验证配置文件格式
   */
  validateConfig(config, type) {
    const validators = {
      environments: (data) => {
        if (!data.environments || !Array.isArray(data.environments)) {
          throw new Error('Invalid environments config: missing environments array');
        }
        
        data.environments.forEach((env, index) => {
          if (!env.id || !env.name || !env.url) {
            throw new Error(`Invalid environment at index ${index}: missing required fields`);
          }
        });
        
        return true;
      },
      
      groups: (data) => {
        if (!data.groups || !Array.isArray(data.groups)) {
          throw new Error('Invalid groups config: missing groups array');
        }
        
        data.groups.forEach((group, index) => {
          if (!group.id || !group.name) {
            throw new Error(`Invalid group at index ${index}: missing required fields`);
          }
        });
        
        return true;
      },
      
      settings: (data) => {
        if (!data.app || !data.ui || !data.features) {
          throw new Error('Invalid settings config: missing required sections');
        }
        
        return true;
      }
    };

    const validator = validators[type];
    if (validator) {
      return validator(config);
    }

    return true;
  }

  /**
   * 导出当前配置
   */
  async exportConfigs() {
    const configs = await this.loadAllConfigs();
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '2.0.0',
      ...configs
    };

    return exportData;
  }

  /**
   * 生成配置文件下载链接
   */
  generateDownloadLink(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    return { url, link, cleanup: () => URL.revokeObjectURL(url) };
  }
}

// 创建全局实例
const configLoader = new ConfigLoader();

// 导出实例和类
export default configLoader;
export { ConfigLoader };

// 便捷方法
export const loadEnvironments = () => configLoader.loadEnvironments();
export const loadGroups = () => configLoader.loadGroups();
export const loadSettings = () => configLoader.loadSettings();
export const loadAllConfigs = () => configLoader.loadAllConfigs();
export const reloadConfigs = () => configLoader.reloadConfigs();
