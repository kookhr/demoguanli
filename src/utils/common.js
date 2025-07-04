/**
 * 公共工具函数
 * 提供应用中常用的工具函数
 */

import { STATUS_TYPES, TAG_COLORS, STATUS_COLORS } from '../constants';

/**
 * 格式化响应时间
 * @param {number} time - 响应时间（毫秒）
 * @returns {string} 格式化后的时间字符串
 */
export const formatResponseTime = (time) => {
  if (!time) return '';
  if (time < 1000) return `${time}ms`;
  return `${(time / 1000).toFixed(2)}s`;
};

/**
 * 格式化最后检测时间
 * @param {string} timestamp - 时间戳
 * @returns {string} 格式化后的时间字符串
 */
export const formatLastChecked = (timestamp) => {
  if (!timestamp) return '';

  const now = new Date();
  const lastChecked = new Date(timestamp);
  const diffMs = now - lastChecked;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}小时前`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}天前`;
};

/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * 深拷贝对象
 * @param {any} obj - 要拷贝的对象
 * @returns {any} 拷贝后的对象
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 限制时间（毫秒）
 * @returns {Function} 节流后的函数
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * 获取标签颜色
 * @param {string} tag - 标签名
 * @returns {string} CSS类名
 */
export const getTagColor = (tag) => {
  const normalizedTag = tag.toLowerCase();
  return TAG_COLORS[normalizedTag] || TAG_COLORS[tag] || 
    'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600';
};

/**
 * 获取状态颜色配置
 * @param {string} status - 状态类型
 * @returns {object} 颜色配置对象
 */
export const getStatusColors = (status) => {
  return STATUS_COLORS[status] || STATUS_COLORS[STATUS_TYPES.UNKNOWN];
};

/**
 * 检查是否是混合内容场景
 * @param {string} url - 目标URL
 * @returns {boolean} 是否是混合内容
 */
export const isMixedContentScenario = (url) => {
  if (window.location.protocol !== 'https:') {
    return false;
  }
  
  if (!url.startsWith('http:')) {
    return false;
  }
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // localhost 和 127.0.0.1 通常被允许
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return false;
    }
    
    return true;
  } catch (error) {
    return true;
  }
};

/**
 * 获取基础URL（去掉路径、查询参数和锚点）
 * @param {string} url - 完整URL
 * @returns {string} 基础URL
 */
export const getBaseUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}`;
  } catch (error) {
    // 如果URL解析失败，尝试简单处理
    return url.split('/').slice(0, 3).join('/');
  }
};

/**
 * 验证URL格式
 * @param {string} url - 要验证的URL
 * @returns {boolean} 是否有效
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * 验证邮箱格式
 * @param {string} email - 要验证的邮箱
 * @returns {boolean} 是否有效
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 安全的JSON解析
 * @param {string} jsonString - JSON字符串
 * @param {any} defaultValue - 默认值
 * @returns {any} 解析结果或默认值
 */
export const safeJsonParse = (jsonString, defaultValue = null) => {
  try {
    return JSON.parse(jsonString);
  } catch {
    return defaultValue;
  }
};

/**
 * 安全的本地存储操作
 */
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * 数组去重
 * @param {Array} array - 要去重的数组
 * @param {string} key - 对象数组的去重键名
 * @returns {Array} 去重后的数组
 */
export const uniqueArray = (array, key = null) => {
  if (!Array.isArray(array)) return [];
  
  if (key) {
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }
  
  return [...new Set(array)];
};

/**
 * 数组分组
 * @param {Array} array - 要分组的数组
 * @param {string|Function} key - 分组键名或函数
 * @returns {Object} 分组后的对象
 */
export const groupBy = (array, key) => {
  if (!Array.isArray(array)) return {};
  
  return array.reduce((groups, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {});
};

/**
 * 获取嵌套对象属性值
 * @param {Object} obj - 对象
 * @param {string} path - 属性路径，如 'a.b.c'
 * @param {any} defaultValue - 默认值
 * @returns {any} 属性值或默认值
 */
export const getNestedValue = (obj, path, defaultValue = undefined) => {
  if (!obj || typeof obj !== 'object') return defaultValue;
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined || !(key in result)) {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result;
};

/**
 * 设置嵌套对象属性值
 * @param {Object} obj - 对象
 * @param {string} path - 属性路径，如 'a.b.c'
 * @param {any} value - 要设置的值
 * @returns {Object} 修改后的对象
 */
export const setNestedValue = (obj, path, value) => {
  const keys = path.split('.');
  const lastKey = keys.pop();
  let current = obj;
  
  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[lastKey] = value;
  return obj;
};
