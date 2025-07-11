/**
 * 本地存储管理器
 * 用于管理用户偏好、状态历史、收藏等临时数据
 */

class LocalStorageManager {
  constructor() {
    this.prefix = 'env-manager-';
    this.version = '2.0.0';
    this.maxHistoryRecords = 1000;
    this.maxFavorites = 50;
  }

  /**
   * 通用存储方法
   */
  set(key, value) {
    try {
      const data = {
        value,
        timestamp: Date.now(),
        version: this.version
      };
      localStorage.setItem(this.prefix + key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('LocalStorage set error:', error);
      return false;
    }
  }

  /**
   * 通用读取方法
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return defaultValue;

      const data = JSON.parse(item);
      
      // 检查版本兼容性
      if (data.version !== this.version) {
        console.warn(`Version mismatch for ${key}, clearing data`);
        this.remove(key);
        return defaultValue;
      }

      return data.value;
    } catch (error) {
      console.error('LocalStorage get error:', error);
      return defaultValue;
    }
  }

  /**
   * 删除存储项
   */
  remove(key) {
    try {
      localStorage.removeItem(this.prefix + key);
      return true;
    } catch (error) {
      console.error('LocalStorage remove error:', error);
      return false;
    }
  }

  /**
   * 清除所有相关数据
   */
  clear() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('LocalStorage clear error:', error);
      return false;
    }
  }

  /**
   * 用户偏好管理
   */
  getUserPreferences() {
    return this.get('preferences', {
      theme: 'light',
      language: 'zh-CN',
      gridColumns: 'auto',
      showInactiveEnvironments: true,
      autoRefresh: true,
      refreshInterval: 300000, // 5分钟
      notifications: true,
      soundEnabled: false,
      compactMode: false,
      showGroupHeaders: true,
      defaultView: 'grid', // grid, list, table
      sortBy: 'name', // name, type, status, lastUpdated
      sortOrder: 'asc' // asc, desc
    });
  }

  setUserPreferences(preferences) {
    const current = this.getUserPreferences();
    const updated = { ...current, ...preferences };
    return this.set('preferences', updated);
  }

  /**
   * 收藏环境管理
   */
  getFavorites() {
    return this.get('favorites', []);
  }

  addFavorite(environmentId) {
    const favorites = this.getFavorites();
    if (!favorites.includes(environmentId)) {
      if (favorites.length >= this.maxFavorites) {
        favorites.shift(); // 移除最旧的收藏
      }
      favorites.push(environmentId);
      this.set('favorites', favorites);
    }
    return favorites;
  }

  removeFavorite(environmentId) {
    const favorites = this.getFavorites();
    const updated = favorites.filter(id => id !== environmentId);
    this.set('favorites', updated);
    return updated;
  }

  toggleFavorite(environmentId) {
    const favorites = this.getFavorites();
    if (favorites.includes(environmentId)) {
      return this.removeFavorite(environmentId);
    } else {
      return this.addFavorite(environmentId);
    }
  }

  isFavorite(environmentId) {
    return this.getFavorites().includes(environmentId);
  }

  /**
   * 状态检测历史管理
   */
  getStatusHistory(environmentId = null) {
    const allHistory = this.get('statusHistory', {});
    
    if (environmentId) {
      return allHistory[environmentId] || [];
    }
    
    return allHistory;
  }

  addStatusRecord(environmentId, statusData) {
    const allHistory = this.getStatusHistory();
    
    if (!allHistory[environmentId]) {
      allHistory[environmentId] = [];
    }

    const record = {
      ...statusData,
      timestamp: Date.now(),
      id: `${environmentId}-${Date.now()}`
    };

    allHistory[environmentId].unshift(record);

    // 限制历史记录数量
    if (allHistory[environmentId].length > this.maxHistoryRecords) {
      allHistory[environmentId] = allHistory[environmentId].slice(0, this.maxHistoryRecords);
    }

    this.set('statusHistory', allHistory);
    return record;
  }

  clearStatusHistory(environmentId = null) {
    if (environmentId) {
      const allHistory = this.getStatusHistory();
      delete allHistory[environmentId];
      this.set('statusHistory', allHistory);
    } else {
      this.remove('statusHistory');
    }
  }

  /**
   * 搜索历史管理
   */
  getSearchHistory() {
    return this.get('searchHistory', []);
  }

  addSearchTerm(term) {
    if (!term || term.trim().length < 2) return;

    const history = this.getSearchHistory();
    const trimmedTerm = term.trim();
    
    // 移除重复项
    const filtered = history.filter(item => item !== trimmedTerm);
    
    // 添加到开头
    filtered.unshift(trimmedTerm);
    
    // 限制数量
    const limited = filtered.slice(0, 20);
    
    this.set('searchHistory', limited);
    return limited;
  }

  clearSearchHistory() {
    this.remove('searchHistory');
  }

  /**
   * 过滤器状态管理
   */
  getFilterState() {
    return this.get('filterState', {
      type: '',
      network: '',
      status: '',
      group: '',
      tags: [],
      showFavoritesOnly: false,
      showActiveOnly: true
    });
  }

  setFilterState(filterState) {
    return this.set('filterState', filterState);
  }

  /**
   * 分组折叠状态管理
   */
  getGroupCollapseState() {
    return this.get('groupCollapseState', {});
  }

  setGroupCollapsed(groupId, collapsed) {
    const state = this.getGroupCollapseState();
    state[groupId] = collapsed;
    return this.set('groupCollapseState', state);
  }

  isGroupCollapsed(groupId) {
    const state = this.getGroupCollapseState();
    return state[groupId] || false;
  }

  /**
   * 最近访问的环境
   */
  getRecentEnvironments() {
    return this.get('recentEnvironments', []);
  }

  addRecentEnvironment(environmentId) {
    const recent = this.getRecentEnvironments();
    const filtered = recent.filter(id => id !== environmentId);
    filtered.unshift(environmentId);
    
    const limited = filtered.slice(0, 10);
    this.set('recentEnvironments', limited);
    return limited;
  }

  /**
   * 导出所有本地数据
   */
  exportData() {
    const data = {
      version: this.version,
      exportedAt: new Date().toISOString(),
      preferences: this.getUserPreferences(),
      favorites: this.getFavorites(),
      statusHistory: this.getStatusHistory(),
      searchHistory: this.getSearchHistory(),
      filterState: this.getFilterState(),
      groupCollapseState: this.getGroupCollapseState(),
      recentEnvironments: this.getRecentEnvironments()
    };

    return data;
  }

  /**
   * 导入数据
   */
  importData(data) {
    try {
      if (data.preferences) this.set('preferences', data.preferences);
      if (data.favorites) this.set('favorites', data.favorites);
      if (data.statusHistory) this.set('statusHistory', data.statusHistory);
      if (data.searchHistory) this.set('searchHistory', data.searchHistory);
      if (data.filterState) this.set('filterState', data.filterState);
      if (data.groupCollapseState) this.set('groupCollapseState', data.groupCollapseState);
      if (data.recentEnvironments) this.set('recentEnvironments', data.recentEnvironments);
      
      return true;
    } catch (error) {
      console.error('Import data error:', error);
      return false;
    }
  }

  /**
   * 获取存储使用情况
   */
  getStorageInfo() {
    try {
      const keys = Object.keys(localStorage);
      const ourKeys = keys.filter(key => key.startsWith(this.prefix));
      
      let totalSize = 0;
      const items = {};

      ourKeys.forEach(key => {
        const value = localStorage.getItem(key);
        const size = new Blob([value]).size;
        totalSize += size;
        
        const shortKey = key.replace(this.prefix, '');
        items[shortKey] = {
          size,
          sizeFormatted: this.formatBytes(size)
        };
      });

      return {
        totalSize,
        totalSizeFormatted: this.formatBytes(totalSize),
        itemCount: ourKeys.length,
        items
      };
    } catch (error) {
      console.error('Get storage info error:', error);
      return null;
    }
  }

  /**
   * 格式化字节数
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// 创建全局实例
const localStorageManager = new LocalStorageManager();

export default localStorageManager;
export { LocalStorageManager };
