// 用户管理工具
import { kvApi } from './kvApi';
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
      console.log('👥 用户管理器初始化完成');
    } catch (error) {
      console.error('❌ 用户管理器初始化失败:', error);
      this.initialized = true;
    }
  }

  // 加载所有用户数据
  async loadAllUsers() {
    try {
      // 尝试从KV存储获取用户列表
      const userList = await kvApi.get('user_list');
      if (userList && Array.isArray(userList)) {
        // 加载每个用户的详细数据
        for (const username of userList) {
          try {
            const userData = await authManager.getUserFromKV(username);
            if (userData) {
              this.users.set(username, userData);
            }
          } catch (error) {
            console.warn(`⚠️ 无法加载用户 ${username} 的数据:`, error);
          }
        }
      }
    } catch (error) {
      // KV存储不可用时，从本地存储加载
      console.warn('⚠️ KV存储不可用，从本地存储加载用户数据');
      this.loadUsersFromLocalStorage();
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
    const userList = Array.from(this.users.keys());
    
    try {
      await kvApi.put('user_list', userList);
    } catch (error) {
      console.warn('⚠️ 无法保存用户列表到KV存储:', error);
    }
  }

  // 添加用户到管理器
  async addUser(username, userData) {
    await this.init();
    
    this.users.set(username, userData);
    await this.saveUserList();
    
    console.log('👤 用户已添加到管理器:', username);
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
    
    console.log('📝 用户信息已更新:', username);
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

    // 从KV存储删除
    try {
      await kvApi.delete(`user_${username}`);
    } catch (error) {
      console.warn('⚠️ 无法从KV存储删除用户:', error);
    }

    // 从本地缓存删除
    this.users.delete(username);
    
    // 更新用户列表
    await this.saveUserList();
    
    console.log('🗑️ 用户已删除:', username);
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
    
    console.log('📦 批量用户操作完成:', results.length, '个用户');
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
    
    console.log('🗑️ 批量用户删除完成:', results.length, '个用户');
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

export const getUserLoginHistory = (username) => userManager.getUserLoginHistory(username);
