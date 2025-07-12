// 国际化工具函数和配置

// 支持的语言列表
export const SUPPORTED_LANGUAGES = {
  'zh-CN': {
    name: '简体中文',
    nativeName: '简体中文',
    flag: '🇨🇳',
    rtl: false
  },
  'zh-TW': {
    name: '繁體中文',
    nativeName: '繁體中文',
    flag: '🇹🇼',
    rtl: false
  },
  'en-US': {
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    rtl: false
  },
  'ja-JP': {
    name: '日本語',
    nativeName: '日本語',
    flag: '🇯🇵',
    rtl: false
  },
  'ko-KR': {
    name: '한국어',
    nativeName: '한국어',
    flag: '🇰🇷',
    rtl: false
  },
  'ar-SA': {
    name: 'العربية',
    nativeName: 'العربية',
    flag: '🇸🇦',
    rtl: true
  }
};

// 默认语言
export const DEFAULT_LANGUAGE = 'zh-CN';

// 翻译文本映射
export const translations = {
  'zh-CN': {
    // 通用
    common: {
      loading: '加载中...',
      error: '错误',
      success: '成功',
      warning: '警告',
      info: '信息',
      confirm: '确认',
      cancel: '取消',
      save: '保存',
      delete: '删除',
      edit: '编辑',
      add: '添加',
      search: '搜索',
      filter: '筛选',
      refresh: '刷新',
      close: '关闭',
      back: '返回',
      next: '下一步',
      previous: '上一步',
      submit: '提交',
      reset: '重置',
      clear: '清除',
      select: '选择',
      selectAll: '全选',
      none: '无',
      all: '全部',
      yes: '是',
      no: '否',
      ok: '确定',
      copy: '复制',
      copied: '已复制',
      required: '必填',
      optional: '可选'
    },
    
    // 导航
    navigation: {
      environments: '环境管理',
      config: '系统配置',
      users: '用户管理',
      dashboard: '仪表板',
      settings: '设置',
      help: '帮助',
      logout: '退出登录'
    },
    
    // 环境管理
    environments: {
      title: '环境管理',
      addNew: '新建环境',
      editEnvironment: '编辑环境',
      deleteEnvironment: '删除环境',
      checkStatus: '检查状态',
      batchOperations: '批量操作',
      name: '环境名称',
      url: 'URL地址',
      type: '环境类型',
      network: '网络类型',
      description: '描述',
      tags: '标签',
      status: '状态',
      lastChecked: '最后检查',
      online: '在线',
      offline: '离线',
      unknown: '未知',
      internal: '内网',
      external: '外网',
      production: '生产环境',
      staging: '测试环境',
      development: '开发环境',
      noEnvironments: '暂无环境',
      searchPlaceholder: '搜索环境名称、URL或标签...',
      confirmDelete: '确定要删除环境 "{name}" 吗？',
      deleteSuccess: '环境删除成功',
      statusCheckSuccess: '状态检查完成',
      batchDeleteConfirm: '确定要删除选中的 {count} 个环境吗？'
    },
    
    // 用户管理
    users: {
      title: '用户管理',
      addUser: '添加用户',
      editUser: '编辑用户',
      username: '用户名',
      email: '邮箱',
      role: '角色',
      status: '状态',
      lastLogin: '最后登录',
      admin: '管理员',
      user: '普通用户',
      active: '活跃',
      inactive: '非活跃',
      changePassword: '修改密码',
      resetPassword: '重置密码'
    },
    
    // 认证
    auth: {
      login: '登录',
      logout: '退出',
      username: '用户名',
      password: '密码',
      rememberMe: '记住我',
      forgotPassword: '忘记密码？',
      loginSuccess: '登录成功',
      loginFailed: '登录失败',
      invalidCredentials: '用户名或密码错误',
      sessionExpired: '会话已过期，请重新登录'
    },
    
    // 错误消息
    errors: {
      networkError: '网络连接失败',
      serverError: '服务器错误',
      notFound: '页面未找到',
      unauthorized: '未授权访问',
      forbidden: '访问被拒绝',
      validationError: '输入验证失败',
      unknownError: '未知错误'
    },
    
    // 成功消息
    success: {
      saved: '保存成功',
      deleted: '删除成功',
      updated: '更新成功',
      created: '创建成功',
      copied: '复制成功'
    },
    
    // 时间格式
    time: {
      justNow: '刚刚',
      minutesAgo: '{minutes}分钟前',
      hoursAgo: '{hours}小时前',
      daysAgo: '{days}天前',
      weeksAgo: '{weeks}周前',
      monthsAgo: '{months}个月前',
      yearsAgo: '{years}年前'
    },
    
    // 键盘快捷键
    shortcuts: {
      title: '键盘快捷键',
      refresh: '刷新',
      newItem: '新建',
      search: '搜索',
      selectAll: '全选',
      delete: '删除',
      help: '帮助',
      escape: '取消'
    }
  },
  
  'en-US': {
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      info: 'Info',
      confirm: 'Confirm',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      search: 'Search',
      filter: 'Filter',
      refresh: 'Refresh',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      submit: 'Submit',
      reset: 'Reset',
      clear: 'Clear',
      select: 'Select',
      selectAll: 'Select All',
      none: 'None',
      all: 'All',
      yes: 'Yes',
      no: 'No',
      ok: 'OK',
      copy: 'Copy',
      copied: 'Copied',
      required: 'Required',
      optional: 'Optional'
    },
    
    navigation: {
      environments: 'Environments',
      config: 'Configuration',
      users: 'User Management',
      dashboard: 'Dashboard',
      settings: 'Settings',
      help: 'Help',
      logout: 'Logout'
    },
    
    environments: {
      title: 'Environment Management',
      addNew: 'Add Environment',
      editEnvironment: 'Edit Environment',
      deleteEnvironment: 'Delete Environment',
      checkStatus: 'Check Status',
      batchOperations: 'Batch Operations',
      name: 'Name',
      url: 'URL',
      type: 'Type',
      network: 'Network',
      description: 'Description',
      tags: 'Tags',
      status: 'Status',
      lastChecked: 'Last Checked',
      online: 'Online',
      offline: 'Offline',
      unknown: 'Unknown',
      internal: 'Internal',
      external: 'External',
      production: 'Production',
      staging: 'Staging',
      development: 'Development',
      noEnvironments: 'No environments found',
      searchPlaceholder: 'Search environments...',
      confirmDelete: 'Are you sure you want to delete "{name}"?',
      deleteSuccess: 'Environment deleted successfully',
      statusCheckSuccess: 'Status check completed',
      batchDeleteConfirm: 'Are you sure you want to delete {count} selected environments?'
    }
    // ... 其他翻译
  }
};

// 获取浏览器语言
export const getBrowserLanguage = () => {
  const language = navigator.language || navigator.userLanguage;
  
  // 检查是否支持完整的语言代码
  if (SUPPORTED_LANGUAGES[language]) {
    return language;
  }
  
  // 检查是否支持语言的主要部分（如 'zh' 对应 'zh-CN'）
  const primaryLanguage = language.split('-')[0];
  const matchedLanguage = Object.keys(SUPPORTED_LANGUAGES).find(
    lang => lang.startsWith(primaryLanguage)
  );
  
  return matchedLanguage || DEFAULT_LANGUAGE;
};

// 获取当前语言
export const getCurrentLanguage = () => {
  return localStorage.getItem('language') || getBrowserLanguage();
};

// 设置语言
export const setLanguage = (language) => {
  if (SUPPORTED_LANGUAGES[language]) {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
    
    // 设置RTL方向
    if (SUPPORTED_LANGUAGES[language].rtl) {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
    
    return true;
  }
  return false;
};

// 翻译函数
export const t = (key, params = {}) => {
  const language = getCurrentLanguage();
  const keys = key.split('.');
  let value = translations[language];
  
  // 遍历键路径
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // 如果当前语言没有翻译，尝试使用默认语言
      value = translations[DEFAULT_LANGUAGE];
      for (const k2 of keys) {
        if (value && typeof value === 'object' && k2 in value) {
          value = value[k2];
        } else {
          return key; // 返回原始键作为后备
        }
      }
      break;
    }
  }
  
  // 如果找到的值不是字符串，返回原始键
  if (typeof value !== 'string') {
    return key;
  }
  
  // 替换参数
  return value.replace(/\{(\w+)\}/g, (match, param) => {
    return params[param] !== undefined ? params[param] : match;
  });
};

// 格式化数字
export const formatNumber = (number, options = {}) => {
  const language = getCurrentLanguage();
  return new Intl.NumberFormat(language, options).format(number);
};

// 格式化日期
export const formatDate = (date, options = {}) => {
  const language = getCurrentLanguage();
  return new Intl.DateTimeFormat(language, options).format(new Date(date));
};

// 格式化相对时间
export const formatRelativeTime = (date) => {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now - targetDate) / 1000);
  
  if (diffInSeconds < 60) {
    return t('time.justNow');
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return t('time.minutesAgo', { minutes: diffInMinutes });
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return t('time.hoursAgo', { hours: diffInHours });
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return t('time.daysAgo', { days: diffInDays });
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return t('time.weeksAgo', { weeks: diffInWeeks });
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return t('time.monthsAgo', { months: diffInMonths });
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return t('time.yearsAgo', { years: diffInYears });
};

// 初始化国际化
export const initI18n = () => {
  const language = getCurrentLanguage();
  setLanguage(language);
};
