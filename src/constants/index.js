/**
 * 应用常量定义
 * 统一管理应用中使用的常量值
 */

// 环境类型
export const ENVIRONMENT_TYPES = {
  PRODUCTION: '生产环境',
  STAGING: '预生产环境', 
  TESTING: '测试环境',
  DEVELOPMENT: '开发环境',
  DEMO: '演示环境'
};

// 网络类型
export const NETWORK_TYPES = {
  INTERNAL: 'internal',
  EXTERNAL: 'external'
};

// 状态类型 - 极简版
export const STATUS_TYPES = {
  AVAILABLE: 'available',     // 网络可达
  UNREACHABLE: 'unreachable', // 网络不可达
  CHECKING: 'checking'        // 检测中
};

// 检测方法类型
export const DETECTION_METHODS = {
  FETCH_NO_CORS: 'fetch-no-cors',
  FETCH_SUCCESS: 'fetch-success',
  FETCH_FAILED: 'fetch-failed',
  IMAGE_LOAD: 'image-load',
  IMAGE_ERROR_REACHABLE: 'image-error-reachable',
  IMAGE_TIMEOUT: 'image-timeout',
  IMAGE_EXCEPTION: 'image-exception',
  ALL_METHODS_FAILED: 'all-methods-failed',
  ENHANCED_CHECK: 'enhanced-check',
  EXCEPTION: 'exception'
};

// 用户角色
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

// 权限类型
export const PERMISSIONS = {
  CONFIG_MANAGEMENT: 'config_management',
  USER_MANAGEMENT: 'user_management',
  ENVIRONMENT_VIEW: 'environment_view',
  ENVIRONMENT_CHECK: 'environment_check'
};

// 检测配置 - 简化版
export const DETECTION_CONFIG = {
  TIMEOUT: 5000,              // 统一5秒超时
  RETRY_COUNT: 1,             // 重试次数
  CONCURRENCY: 4,             // 并发数
  METHODS: ['HEAD', 'GET'],   // 简化的检测方法
  CACHE_DURATION: 30000       // 缓存时间30秒
};

// 简化网络检测配置
export const SIMPLE_NETWORK_CONFIG = {
  TIMEOUT: 5000,              // 检测超时时间
  RETRY_COUNT: 1,             // 重试次数
  CONCURRENCY: 4,             // 并发数
  CACHE_DURATION: 30000,      // 缓存时间
  IMAGE_PROBE_TIMEOUT: 3000,  // 图像探测超时时间
  ENABLE_IMAGE_PROBE: true,   // 启用图像探测
  PROBE_PATHS: [              // 探测路径
    '/favicon.ico',
    '/ping',
    '/health',
    '/status',
    '/robots.txt',
    '/',
    '/api/health',
    '/actuator/health'
  ]
};

// 标签颜色配置
export const TAG_COLORS = {
  // 环境类型
  'production': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700',
  'staging': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700',
  'development': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700',
  'testing': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-700',
  'demo': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700',
  
  // 中文环境类型
  '生产环境': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700',
  '预生产环境': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700',
  '测试环境': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-700',
  '开发环境': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700',
  '演示环境': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700',
  
  // 其他标签类型
  'frontend': 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-700',
  'backend': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700',
  'database': 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600',
  'external': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700',
  'internal': 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-700',
  'stable': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
  'local': 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-600',
  'api': 'bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-700',
  'web': 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-700',
  'mobile': 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700'
};

// 状态颜色配置 - 极简版
export const STATUS_COLORS = {
  [STATUS_TYPES.AVAILABLE]: {
    text: 'text-success-600 dark:text-success-400',
    bg: 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-700',
    border: 'border-success-500 dark:border-success-400'
  },
  [STATUS_TYPES.UNREACHABLE]: {
    text: 'text-danger-600 dark:text-danger-400',
    bg: 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-700',
    border: 'border-danger-500 dark:border-danger-400'
  },
  [STATUS_TYPES.CHECKING]: {
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700',
    border: 'border-blue-400 dark:border-blue-500'
  }
};

// 本地存储键名
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  DARK_MODE: 'dark_mode',
  FAVORITES: 'environment_favorites',
  STATUS_HISTORY: 'status_history',
  USER_PREFERENCES: 'user_preferences'
};

// API 端点
export const API_ENDPOINTS = {
  ENVIRONMENTS: '/api/environments',
  USERS: '/api/users',
  AUTH: '/api/auth',
  STATUS: '/api/status'
};

// 默认配置
export const DEFAULT_CONFIG = {
  ENVIRONMENT: {
    type: ENVIRONMENT_TYPES.DEVELOPMENT,
    network: NETWORK_TYPES.INTERNAL,
    status: STATUS_TYPES.UNKNOWN,
    tags: [],
    services: []
  },
  USER: {
    role: USER_ROLES.USER,
    permissions: [PERMISSIONS.ENVIRONMENT_VIEW, PERMISSIONS.ENVIRONMENT_CHECK]
  }
};

// 验证规则
export const VALIDATION_RULES = {
  ENVIRONMENT_NAME: {
    required: true,
    minLength: 1,
    maxLength: 100
  },
  ENVIRONMENT_URL: {
    required: true,
    pattern: /^https?:\/\/.+/
  },
  USER_USERNAME: {
    required: true,
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_-]+$/
  },
  USER_PASSWORD: {
    required: true,
    minLength: 6,
    maxLength: 128
  }
};
