// 用户管理工具 - Serv00 数据库版本
import databaseAPI from './databaseApi.js';
import { authManager } from './auth';

// 用户管理类
class UserManager {
  constructor() {
    this.users = new Map();
    this.initialized = false;
  }

  // 初始化用户数据
  async init() {
    if (this.initialized) return;

    try {
      // 获取所有用户数据
      await this.loadAllUsers();
      this.initialized = true;
    } catch (error) {
      this.initialized = true;
    }
  }

  // 强制重新初始化
  async forceReinit() {
    this.initialized = false;
    this.users.clear();
    await this.init();
  }

  // 加载所有用户数据
  async loadAllUsers() {
    try {
      // 尝试从数据库获取用户列表
      const users = await databaseAPI.getUsers();
      if (users && Array.isArray(users)) {
        // 加载每个用户的详细数据
        for (const userData of users) {
          try {
            if (userData && userData.username) {
              this.users.set(userData.username, userData);
            }
          } catch (error) {
            // 静默处理错误
          }
        }
      } else {
        // 如果没有用户列表，尝试扫描已知用户
        await this.scanExistingUsers();
      }
    } catch (error) {
      // 数据库不可用时，从本地存储加载
      this.loadUsersFromLocalStorage();
    }
  }

  // 扫描已知用户（当用户列表丢失时）
  async scanExistingUsers() {
    const knownUsers = ['admin']; // 已知的用户名列表

    for (const username of knownUsers) {
      try {
        const userData = await authManager.getUserFromKV(username);
        if (userData) {
          this.users.set(username, userData);
        }
      } catch (error) {
        console.warn(`⚠️ 无法加载用户 ${username}:`, error);
      }
    }

    // 重建用户列表
    if (this.users.size > 0) {
      await this.saveUserList();
    }
  }

  // 从本地存储加载用户数据
  loadUsersFromLocalStorage() {
    try {
      const usersData = localStorage.getItem('env_mgmt_users');
      if (usersData) {
        const users = JSON.parse(usersData);
        Object.entries(users).forEach(([username, userData]) => {
          this.users.set(username, userData);
        });
      }
    } catch (error) {
      console.error('本地用户数据加载失败:', error);
    }
  }

  // 保存用户列表到存储
  async saveUserList() {
    // 在数据库版本中，用户列表通过数据库自动维护，无需单独保存
    try {
      // 可以在这里添加一些缓存逻辑，但通常不需要
      console.log('用户列表已通过数据库自动维护');
    } catch (error) {
      console.warn('⚠️ 用户列表维护警告:', error);
    }
  }

  // 添加用户到管理器
  async addUser(username, userData) {
    await this.init();

    // 检查用户是否已存在，避免重复添加
    const existingUser = this.users.get(username);
    if (existingUser) {
      // 更新用户数据
      this.users.set(username, userData);
    } else {
      // 添加新用户
      this.users.set(username, userData);
      await this.saveUserList();
    }
  }

  // 获取所有用户
  async getAllUsers() {
    await this.init();
    
    return Array.from(this.users.values()).sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  // 获取单个用户
  async getUser(username) {
    await this.init();
    
    return this.users.get(username);
  }

  // 更新用户信息
  async updateUser(username, updates) {
    await this.init();
    
    const userData = this.users.get(username);
    if (!userData) {
      throw new Error('用户不存在');
    }

    // 合并更新数据
    const updatedUser = {
      ...userData,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // 保存到存储
    await authManager.saveUserToKV(username, updatedUser);
    
    // 更新本地缓存
    this.users.set(username, updatedUser);

    return updatedUser;
  }

  // 删除用户
  async deleteUser(username, currentUser) {
    await this.init();
    
    // 防止删除自己
    if (currentUser && currentUser.username === username) {
      throw new Error('不能删除自己的账户');
    }

    // 防止删除不存在的用户
    if (!this.users.has(username)) {
      throw new Error('用户不存在');
    }

    // 从数据库删除
    try {
      const user = this.users.get(username);
      if (user && user.id) {
        await databaseAPI.deleteUser(user.id);
      }
    } catch (error) {
      // 静默处理错误
    }

    // 从本地缓存删除
    this.users.delete(username);
    
    // 更新用户列表
    await this.saveUserList();

    return true;
  }

  // 启用/禁用用户
  async toggleUserStatus(username, enabled) {
    return await this.updateUser(username, { 
      enabled,
      statusChangedAt: new Date().toISOString()
    });
  }

  // 批量操作用户
  async batchUpdateUsers(usernames, updates) {
    await this.init();
    
    const results = [];
    
    for (const username of usernames) {
      try {
        const updatedUser = await this.updateUser(username, updates);
        results.push({ username, success: true, user: updatedUser });
      } catch (error) {
        results.push({ username, success: false, error: error.message });
      }
    }

    return results;
  }

  // 批量删除用户
  async batchDeleteUsers(usernames, currentUser) {
    await this.init();
    
    const results = [];
    
    for (const username of usernames) {
      try {
        await this.deleteUser(username, currentUser);
        results.push({ username, success: true });
      } catch (error) {
        results.push({ username, success: false, error: error.message });
      }
    }

    return results;
  }

  // 搜索用户
  async searchUsers(query) {
    await this.init();
    
    if (!query || query.trim() === '') {
      return await this.getAllUsers();
    }
    
    const searchTerm = query.toLowerCase();
    const allUsers = await this.getAllUsers();
    
    return allUsers.filter(user => 
      user.username.toLowerCase().includes(searchTerm) ||
      (user.email && user.email.toLowerCase().includes(searchTerm)) ||
      user.role.toLowerCase().includes(searchTerm)
    );
  }

  // 获取用户统计信息
  async getUserStatistics() {
    await this.init();
    
    const users = await this.getAllUsers();
    
    return {
      total: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      users: users.filter(u => u.role === 'user').length,
      enabled: users.filter(u => u.enabled !== false).length,
      disabled: users.filter(u => u.enabled === false).length,
      recentLogins: users.filter(u => {
        if (!u.lastLogin) return false;
        const lastLogin = new Date(u.lastLogin);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return lastLogin > weekAgo;
      }).length
    };
  }

  // 记录用户登录
  async recordUserLogin(username) {
    try {
      await this.updateUser(username, {
        lastLogin: new Date().toISOString(),
        loginCount: (this.users.get(username)?.loginCount || 0) + 1
      });
    } catch (error) {
      console.warn('⚠️ 无法记录用户登录:', error);
    }
  }

  // 获取用户登录历史（简化版）
  async getUserLoginHistory(username) {
    await this.init();
    
    const userData = this.users.get(username);
    if (!userData) {
      throw new Error('用户不存在');
    }

    // 返回基本登录信息
    return {
      username: userData.username,
      lastLogin: userData.lastLogin,
      loginCount: userData.loginCount || 0,
      createdAt: userData.createdAt,
      enabled: userData.enabled !== false
    };
  }
}

// 创建全局用户管理器实例
export const userManager = new UserManager();

// 导出便捷函数
export const getAllUsers = () => userManager.getAllUsers();

export const getUser = (username) => userManager.getUser(username);

export const updateUser = (username, updates) => userManager.updateUser(username, updates);

export const deleteUser = (username, currentUser) => userManager.deleteUser(username, currentUser);

export const toggleUserStatus = (username, enabled) => userManager.toggleUserStatus(username, enabled);

export const batchUpdateUsers = (usernames, updates) => userManager.batchUpdateUsers(usernames, updates);

export const batchDeleteUsers = (usernames, currentUser) => userManager.batchDeleteUsers(usernames, currentUser);

export const searchUsers = (query) => userManager.searchUsers(query);

export const getUserStatistics = () => userManager.getUserStatistics();

export const recordUserLogin = (username) => userManager.recordUserLogin(username);

export const forceReinitUserManager = () => userManager.forceReinit();

export const getUserLoginHistory = (username) => userManager.getUserLoginHistory(username);
