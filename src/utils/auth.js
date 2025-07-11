// 用户认证管理工具
import { authAPI, getAuthToken, setAuthToken, clearAuthToken } from './apiClient';

// 简化的认证管理器
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.listeners = [];
  }

  // 登录
  async login(username, password, rememberMe = false) {
    try {
      const result = await authAPI.login(username, password);
      this.currentUser = result.user;
      this.notifyListeners(this.currentUser);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // 注册
  async register(username, password, email) {
    try {
      return await authAPI.register(username, password, email);
    } catch (error) {
      throw error;
    }
  }

  // 登出
  async logout() {
    try {
      await authAPI.logout();
    } finally {
      this.currentUser = null;
      this.notifyListeners(null);
    }
  }

  // 获取当前用户
  getCurrentUser() {
    return this.currentUser;
  }

  // 检查是否已认证
  isAuthenticated() {
    return !!this.currentUser;
  }

  // 添加认证状态监听器
  addListener(listener) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // 通知所有监听器
  notifyListeners(user) {
    this.listeners.forEach(listener => {
      try {
        listener(user);
      } catch (error) {
        console.error('Auth listener error:', error);
      }
    });
  }

  // 初始化认证状态
  async init() {
    try {
      if (authAPI.isAuthenticated()) {
        const result = await authAPI.verifyToken();
        if (result.valid) {
          const userData = await authAPI.getCurrentUser();
          this.currentUser = userData.user;
          this.notifyListeners(this.currentUser);
        }
      }
    } catch (error) {
      // Token无效，清除认证状态
      this.currentUser = null;
      this.notifyListeners(null);
    }
  }
}

// 创建全局认证管理器实例
export const authManager = new AuthManager();

// 权限检查函数
export function isAdmin(user) {
  return user && user.role === 'admin';
}

export function hasPermission(user, permission) {
  if (!user) return false;
  if (isAdmin(user)) return true;

  // 基础权限检查
  const userPermissions = user.permissions || [];
  return userPermissions.includes(permission);
}

// 添加认证监听器的便捷函数
export function addAuthListener(listener) {
  return authManager.addListener(listener);
}

// 兼容性函数 - 为了保持与现有代码的兼容性
export async function getSystemSettings() {
  // 简化实现，返回默认设置
  return {
    registrationDisabled: false
  };
}

export async function toggleRegistration(disabled) {
  // 简化实现，暂时不支持
  return { success: true, disabled };
}

export async function changePassword(username, currentPassword, newPassword) {
  // 简化实现，暂时不支持
  throw new Error('密码修改功能暂未实现，请联系管理员');
}

export async function isRegistrationDisabled() {
  return false;
}

// 便捷函数导出
export const login = (username, password, rememberMe) =>
  authManager.login(username, password, rememberMe);

export const register = (username, password, email) =>
  authManager.register(username, password, email);

export const logout = () => authManager.logout();

export const isAuthenticated = () => authManager.isAuthenticated();

export const getCurrentUser = () => authManager.getCurrentUser();

// 初始化认证管理器
authManager.init();
