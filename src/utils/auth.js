// 用户认证管理工具
import { kvApi } from './kvApi';

const AUTH_STORAGE_KEY = 'auth_token';
const USER_STORAGE_KEY = 'current_user';
const REMEMBER_ME_KEY = 'remember_me';

// 简单的JWT工具函数
const createToken = (payload) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + (7 * 24 * 60 * 60) // 7天过期
  };
  
  // 简化的JWT实现（仅用于客户端状态管理）
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(tokenPayload));
  const signature = btoa(`${encodedHeader}.${encodedPayload}.secret`);
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

const parseToken = (token) => {
  try {
    if (!token) return null;
    
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    
    // 检查是否过期
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Token解析失败:', error);
    return null;
  }
};

// 密码哈希函数（简单实现）
const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt_env_mgmt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// 用户认证类
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.token = null;
    this.listeners = [];
    this.init();
  }

  // 初始化认证状态
  async init() {
    const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
    const storage = rememberMe ? localStorage : sessionStorage;

    const token = storage.getItem(AUTH_STORAGE_KEY);
    const userStr = storage.getItem(USER_STORAGE_KEY);

    if (token && userStr) {
      const payload = parseToken(token);
      if (payload) {
        this.token = token;
        this.currentUser = JSON.parse(userStr);
        console.log('🔐 自动登录成功:', this.currentUser.username);
      } else {
        this.clearAuth();
      }
    }

    // 初始化默认管理员账户
    await this.initDefaultAdmin();
  }

  // 初始化默认管理员账户
  async initDefaultAdmin() {
    try {
      const adminUsername = 'admin';
      const existingAdmin = await this.getUserFromKV(adminUsername);

      if (!existingAdmin) {
        console.log('🔧 创建默认管理员账户...');
        const defaultPassword = 'admin123';
        const hashedPassword = await hashPassword(defaultPassword);

        const adminData = {
          username: adminUsername,
          email: 'admin@env-mgmt.local',
          password: hashedPassword,
          createdAt: new Date().toISOString(),
          lastLogin: null,
          role: 'admin',
          enabled: true,
          loginCount: 0
        };

        await this.saveUserToKV(adminUsername, adminData);

        // 添加到用户管理器
        try {
          const { userManager } = await import('./userManagement');
          await userManager.addUser(adminUsername, adminData);
        } catch (error) {
          console.warn('⚠️ 无法将管理员添加到用户管理器:', error);
        }

        console.log('✅ 默认管理员账户创建成功');
        console.log('📝 默认登录信息: admin / admin123');
      } else {
        // 确保现有管理员账户在用户管理器中
        try {
          const { userManager } = await import('./userManagement');
          await userManager.addUser(adminUsername, existingAdmin);
        } catch (error) {
          console.warn('⚠️ 无法将现有管理员添加到用户管理器:', error);
        }
      }
    } catch (error) {
      console.warn('⚠️ 无法创建默认管理员账户:', error.message);
      console.log('💡 提示：您可以手动注册账户或检查KV存储配置');
    }
  }

  // 添加认证状态监听器
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // 通知状态变化
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.currentUser));
  }

  // 检查注册是否被禁用
  async isRegistrationDisabled() {
    try {
      const settings = await kvApi.get('system_settings');
      return settings?.registrationDisabled || false;
    } catch (error) {
      // KV存储不可用时，从本地存储检查
      try {
        const settings = localStorage.getItem('env_mgmt_system_settings');
        return settings ? JSON.parse(settings).registrationDisabled || false : false;
      } catch {
        return false;
      }
    }
  }

  // 用户注册
  async register(username, password, email = '') {
    try {
      console.log('📝 用户注册:', username);

      // 检查注册是否被禁用
      const registrationDisabled = await this.isRegistrationDisabled();
      if (registrationDisabled) {
        throw new Error('当前系统已禁止新用户注册，请联系管理员');
      }

      // 检查用户是否已存在
      const existingUser = await this.getUserFromKV(username);
      if (existingUser) {
        throw new Error('用户名已存在');
      }

      // 创建用户数据
      const hashedPassword = await hashPassword(password);
      const userData = {
        username,
        email,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        role: 'user',
        enabled: true,
        loginCount: 0
      };

      // 保存到KV存储
      await this.saveUserToKV(username, userData);

      // 添加到用户管理器
      const { userManager } = await import('./userManagement');
      await userManager.addUser(username, userData);

      console.log('✅ 用户注册成功:', username);
      return { success: true, message: '注册成功' };
    } catch (error) {
      console.error('❌ 用户注册失败:', error);
      throw error;
    }
  }

  // 用户登录
  async login(username, password, rememberMe = false) {
    try {
      console.log('🔐 用户登录:', username);

      // 从KV存储获取用户数据
      const userData = await this.getUserFromKV(username);
      if (!userData) {
        throw new Error('用户不存在');
      }

      // 检查用户是否被禁用
      if (userData.enabled === false) {
        throw new Error('账户已被禁用，请联系管理员');
      }

      // 验证密码
      const hashedPassword = await hashPassword(password);
      if (userData.password !== hashedPassword) {
        throw new Error('密码错误');
      }

      // 更新最后登录时间和登录次数
      userData.lastLogin = new Date().toISOString();
      userData.loginCount = (userData.loginCount || 0) + 1;
      await this.saveUserToKV(username, userData);

      // 记录用户登录到用户管理器
      try {
        const { recordUserLogin } = await import('./userManagement');
        await recordUserLogin(username);
      } catch (error) {
        console.warn('⚠️ 无法记录用户登录:', error);
      }

      // 创建用户会话
      const userSession = {
        id: userData.username,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        loginTime: new Date().toISOString()
      };

      // 生成token
      const token = createToken(userSession);

      // 保存认证信息
      this.token = token;
      this.currentUser = userSession;

      // 根据"记住我"选择存储方式
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem(AUTH_STORAGE_KEY, token);
      storage.setItem(USER_STORAGE_KEY, JSON.stringify(userSession));
      localStorage.setItem(REMEMBER_ME_KEY, rememberMe.toString());

      // 清理另一种存储方式的数据
      const otherStorage = rememberMe ? sessionStorage : localStorage;
      otherStorage.removeItem(AUTH_STORAGE_KEY);
      otherStorage.removeItem(USER_STORAGE_KEY);

      console.log('✅ 登录成功:', username);
      this.notifyListeners();
      
      return { success: true, user: userSession };
    } catch (error) {
      console.error('❌ 登录失败:', error);
      throw error;
    }
  }

  // 用户登出
  logout() {
    console.log('👋 用户登出:', this.currentUser?.username);
    
    this.clearAuth();
    this.notifyListeners();
  }

  // 清理认证信息
  clearAuth() {
    this.token = null;
    this.currentUser = null;
    
    // 清理所有存储
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(USER_STORAGE_KEY);
  }

  // 检查是否已登录
  isAuthenticated() {
    return !!this.currentUser && !!this.token;
  }

  // 获取当前用户
  getCurrentUser() {
    return this.currentUser;
  }

  // 获取认证token
  getToken() {
    return this.token;
  }

  // 从KV存储获取用户数据（带本地存储备用）
  async getUserFromKV(username) {
    try {
      const userKey = `user_${username}`;
      return await kvApi.get(userKey);
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('404')) {
        return null;
      }

      // KV存储不可用时，尝试从本地存储获取
      console.warn('⚠️ KV存储不可用，使用本地存储备用方案');
      return this.getUserFromLocalStorage(username);
    }
  }

  // 保存用户数据到KV存储（带本地存储备用）
  async saveUserToKV(username, userData) {
    try {
      const userKey = `user_${username}`;
      await kvApi.put(userKey, userData);
    } catch (error) {
      // KV存储不可用时，保存到本地存储
      console.warn('⚠️ KV存储不可用，使用本地存储备用方案');
      this.saveUserToLocalStorage(username, userData);
    }
  }

  // 本地存储备用方案
  getUserFromLocalStorage(username) {
    try {
      const usersData = localStorage.getItem('env_mgmt_users');
      if (!usersData) return null;

      const users = JSON.parse(usersData);
      return users[username] || null;
    } catch (error) {
      console.error('本地用户数据读取失败:', error);
      return null;
    }
  }

  saveUserToLocalStorage(username, userData) {
    try {
      const usersData = localStorage.getItem('env_mgmt_users');
      const users = usersData ? JSON.parse(usersData) : {};

      users[username] = userData;
      localStorage.setItem('env_mgmt_users', JSON.stringify(users));
    } catch (error) {
      console.error('本地用户数据保存失败:', error);
      throw error;
    }
  }

  // 修改密码
  async changePassword(username, currentPassword, newPassword) {
    try {
      console.log('🔑 修改密码:', username);

      // 获取用户数据
      const userData = await this.getUserFromKV(username);
      if (!userData) {
        throw new Error('用户不存在');
      }

      // 验证当前密码
      const hashedCurrentPassword = await hashPassword(currentPassword);
      if (userData.password !== hashedCurrentPassword) {
        throw new Error('当前密码错误');
      }

      // 更新密码
      const hashedNewPassword = await hashPassword(newPassword);
      userData.password = hashedNewPassword;
      userData.passwordChangedAt = new Date().toISOString();

      // 保存到存储
      await this.saveUserToKV(username, userData);

      // 如果是当前用户，更新会话信息
      if (this.currentUser && this.currentUser.username === username) {
        this.currentUser.passwordChangedAt = userData.passwordChangedAt;
      }

      console.log('✅ 密码修改成功:', username);
      return { success: true, message: '密码修改成功' };
    } catch (error) {
      console.error('❌ 密码修改失败:', error);
      throw error;
    }
  }

  // 获取系统设置
  async getSystemSettings() {
    try {
      return await kvApi.get('system_settings') || {};
    } catch (error) {
      // KV存储不可用时，从本地存储获取
      try {
        const settings = localStorage.getItem('env_mgmt_system_settings');
        return settings ? JSON.parse(settings) : {};
      } catch {
        return {};
      }
    }
  }

  // 保存系统设置
  async saveSystemSettings(settings) {
    try {
      await kvApi.put('system_settings', settings);
    } catch (error) {
      // KV存储不可用时，保存到本地存储
      localStorage.setItem('env_mgmt_system_settings', JSON.stringify(settings));
    }
  }

  // 切换注册状态
  async toggleRegistration(disabled) {
    try {
      const settings = await this.getSystemSettings();
      settings.registrationDisabled = disabled;
      await this.saveSystemSettings(settings);

      console.log('⚙️ 注册状态已更新:', disabled ? '已禁用' : '已启用');
      return { success: true, disabled };
    } catch (error) {
      console.error('❌ 更新注册状态失败:', error);
      throw error;
    }
  }

  // 检查KV存储是否可用
  async checkKVAvailability() {
    try {
      // 尝试测试KV连接
      const response = await fetch('/api/kv?action=test');
      const result = await response.json();
      return result.success && result.available;
    } catch (error) {
      console.warn('⚠️ KV存储不可用，将使用本地存储模式');
      return false;
    }
  }
}

// 创建全局认证管理器实例
export const authManager = new AuthManager();

// 用户角色定义
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

// 权限检查函数
export const hasPermission = (user, permission) => {
  if (!user) return false;

  switch (permission) {
    case 'user_management':
    case 'system_settings':
      return user.role === USER_ROLES.ADMIN;
    case 'config_management':
      return user.role === USER_ROLES.ADMIN;
    case 'environment_access':
      return user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.USER;
    default:
      return false;
  }
};

// 检查是否为管理员
export const isAdmin = (user = null) => {
  const currentUser = user || authManager.getCurrentUser();
  return currentUser?.role === USER_ROLES.ADMIN;
};

// 导出便捷函数
export const login = (username, password, rememberMe) =>
  authManager.login(username, password, rememberMe);

export const register = (username, password, email) =>
  authManager.register(username, password, email);

export const logout = () => authManager.logout();

export const isAuthenticated = () => authManager.isAuthenticated();

export const getCurrentUser = () => authManager.getCurrentUser();

export const addAuthListener = (callback) => authManager.addListener(callback);

export const changePassword = (username, currentPassword, newPassword) =>
  authManager.changePassword(username, currentPassword, newPassword);

export const getSystemSettings = () => authManager.getSystemSettings();

export const toggleRegistration = (disabled) => authManager.toggleRegistration(disabled);

export const isRegistrationDisabled = () => authManager.isRegistrationDisabled();
