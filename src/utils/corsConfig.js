// CORS 规避配置和策略管理

// CORS 规避策略配置
export const CORS_BYPASS_CONFIG = {
  // 是否启用 CORS 规避
  enabled: true,
  
  // 策略优先级（数字越小优先级越高）
  strategyPriority: [
    'standard-cors',      // 1. 标准 CORS 请求
    'no-cors',           // 2. no-cors 模式
    'image-probe',       // 3. 图片探测
    'multi-port',        // 4. 多端口探测
    'assumed-reachable'  // 5. 假设可达
  ],
  
  // 各策略的配置
  strategies: {
    'standard-cors': {
      enabled: true,
      timeout: 8000,
      methods: ['HEAD', 'GET'],
      headers: {
        'Accept': '*/*',
        'User-Agent': 'Environment-Monitor/1.0'
      }
    },
    
    'no-cors': {
      enabled: true,
      timeout: 10000,
      method: 'GET'
    },
    
    'image-probe': {
      enabled: true,
      timeout: 5000,
      paths: [
        '/favicon.ico',
        '/favicon.png',
        '/apple-touch-icon.png',
        '/logo.png',
        '/assets/logo.png'
      ]
    },
    
    'multi-port': {
      enabled: true,
      timeout: 6000,
      ports: [80, 443, 8080, 8443, 3000, 5000, 9000],
      maxPorts: 3  // 最多测试的端口数量
    },
    
    'assumed-reachable': {
      enabled: true,
      timeout: 8000,
      confidence: 0.7  // 置信度阈值
    }
  },
  
  // 全局超时设置
  globalTimeout: 15000,
  
  // 重试配置
  retry: {
    enabled: true,
    maxAttempts: 2,
    delay: 1000
  },
  
  // 缓存配置
  cache: {
    enabled: true,
    ttl: 30000  // 30秒缓存
  }
};

// 获取 CORS 规避配置
export const getCORSBypassConfig = () => {
  try {
    const stored = localStorage.getItem('cors-bypass-config');
    if (stored) {
      const config = JSON.parse(stored);
      return { ...CORS_BYPASS_CONFIG, ...config };
    }
  } catch (error) {
    console.warn('Failed to load CORS bypass config from localStorage:', error);
  }
  return CORS_BYPASS_CONFIG;
};

// 保存 CORS 规避配置
export const saveCORSBypassConfig = (config) => {
  try {
    localStorage.setItem('cors-bypass-config', JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Failed to save CORS bypass config:', error);
    return false;
  }
};

// 重置 CORS 规避配置
export const resetCORSBypassConfig = () => {
  try {
    localStorage.removeItem('cors-bypass-config');
    return true;
  } catch (error) {
    console.error('Failed to reset CORS bypass config:', error);
    return false;
  }
};

// 检查策略是否启用
export const isStrategyEnabled = (strategyName) => {
  const config = getCORSBypassConfig();
  return config.enabled && 
         config.strategies[strategyName]?.enabled === true;
};

// 获取策略配置
export const getStrategyConfig = (strategyName) => {
  const config = getCORSBypassConfig();
  return config.strategies[strategyName] || {};
};

// 获取启用的策略列表（按优先级排序）
export const getEnabledStrategies = () => {
  const config = getCORSBypassConfig();
  
  if (!config.enabled) {
    return ['standard-cors']; // 如果禁用 CORS 规避，只使用标准请求
  }
  
  return config.strategyPriority.filter(strategy => 
    config.strategies[strategy]?.enabled === true
  );
};

// 获取策略描述
export const getStrategyDescription = (strategyName) => {
  const descriptions = {
    'standard-cors': '使用标准的 CORS 请求，适用于正确配置了 CORS 的服务',
    'no-cors': '使用 no-cors 模式，可以绕过 CORS 限制但无法获取响应内容',
    'image-probe': '通过加载图片资源来探测服务可达性，适用于静态资源服务',
    'multi-port': '尝试多个常用端口来探测服务，适用于端口不确定的情况',
    'assumed-reachable': '基于网络响应假设服务可达，作为最后的备用方案'
  };
  
  return descriptions[strategyName] || '未知策略';
};

// 获取策略状态文本
export const getStrategyStatusText = (strategyName) => {
  const statusTexts = {
    'standard-cors': '标准检测',
    'no-cors': 'CORS规避',
    'image-probe': '图片探测',
    'multi-port': '端口探测',
    'assumed-reachable': '假设可达'
  };
  
  return statusTexts[strategyName] || strategyName;
};

// 验证配置
export const validateCORSConfig = (config) => {
  const errors = [];
  
  if (typeof config.enabled !== 'boolean') {
    errors.push('enabled 必须是布尔值');
  }
  
  if (!Array.isArray(config.strategyPriority)) {
    errors.push('strategyPriority 必须是数组');
  }
  
  if (typeof config.strategies !== 'object') {
    errors.push('strategies 必须是对象');
  }
  
  if (typeof config.globalTimeout !== 'number' || config.globalTimeout <= 0) {
    errors.push('globalTimeout 必须是正数');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// 导出默认配置用于重置
export { CORS_BYPASS_CONFIG as DEFAULT_CORS_CONFIG };
