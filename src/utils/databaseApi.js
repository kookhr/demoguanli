// Serv00 数据库 API 工具类
import { API_CONFIG } from '../config/database.js';

class DatabaseAPI {
  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
    this.token = localStorage.getItem('auth_token');
  }

  // 设置认证令牌
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  // 获取请求头
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // 通用请求方法
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          // 认证失败，清除令牌
          this.setToken(null);
          throw new Error('认证失败，请重新登录');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      console.error('API 请求失败:', error);
      throw error;
    }
  }

  // GET 请求
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST 请求
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT 请求
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE 请求
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // 环境管理 API
  async getEnvironments() {
    return this.get(API_CONFIG.endpoints.environments);
  }

  async getEnvironmentById(id) {
    return this.get(API_CONFIG.endpoints.environmentById.replace(':id', id));
  }

  async createEnvironment(environment) {
    return this.post(API_CONFIG.endpoints.environments, environment);
  }

  async updateEnvironment(id, environment) {
    return this.put(API_CONFIG.endpoints.environmentById.replace(':id', id), environment);
  }

  async deleteEnvironment(id) {
    return this.delete(API_CONFIG.endpoints.environmentById.replace(':id', id));
  }

  async updateEnvironmentStatus(id, status) {
    return this.post(API_CONFIG.endpoints.environmentStatus.replace(':id', id), status);
  }

  // 用户管理 API
  async login(credentials) {
    const response = await this.post(API_CONFIG.endpoints.login, credentials);
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async logout() {
    try {
      await this.post(API_CONFIG.endpoints.logout);
    } finally {
      this.setToken(null);
    }
  }

  async register(userData) {
    return this.post(API_CONFIG.endpoints.register, userData);
  }

  async getUsers() {
    return this.get(API_CONFIG.endpoints.users);
  }

  async getUserById(id) {
    return this.get(API_CONFIG.endpoints.userById.replace(':id', id));
  }

  async updateUser(id, userData) {
    return this.put(API_CONFIG.endpoints.userById.replace(':id', id), userData);
  }

  async deleteUser(id) {
    return this.delete(API_CONFIG.endpoints.userById.replace(':id', id));
  }

  // 状态历史 API
  async getStatusHistory(envId = null, limit = 100) {
    const endpoint = envId 
      ? API_CONFIG.endpoints.statusHistoryByEnv.replace(':envId', envId)
      : API_CONFIG.endpoints.statusHistory;
    
    return this.get(`${endpoint}?limit=${limit}`);
  }

  async addStatusRecord(envId, statusData) {
    return this.post(API_CONFIG.endpoints.statusHistoryByEnv.replace(':envId', envId), statusData);
  }

  // 分组管理 API
  async getGroups() {
    return this.get(API_CONFIG.endpoints.groups);
  }

  async createGroup(group) {
    return this.post(API_CONFIG.endpoints.groups, group);
  }

  async updateGroup(id, group) {
    return this.put(API_CONFIG.endpoints.groupById.replace(':id', id), group);
  }

  async deleteGroup(id) {
    return this.delete(API_CONFIG.endpoints.groupById.replace(':id', id));
  }

  // 批量操作
  async batchUpdateEnvironmentStatus(environments) {
    return this.post('/environments/batch-status', { environments });
  }

  // 数据导入导出
  async exportData() {
    return this.get('/export');
  }

  async importData(data) {
    return this.post('/import', data);
  }

  // 健康检查
  async healthCheck() {
    return this.get('/health');
  }
}

// 创建单例实例
const databaseAPI = new DatabaseAPI();

export default databaseAPI;

// 导出类以便测试
export { DatabaseAPI };
