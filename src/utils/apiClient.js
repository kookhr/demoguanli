/**
 * API客户端 - 与KV存储后端通信
 */

const API_BASE = '/api';

// 检测是否为开发环境
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';

// 开发环境模拟数据
const DEV_USERS = {
  'admin': {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    email: 'admin@example.com',
    enabled: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    lastLogin: '2024-12-20T10:00:00.000Z',
    loginCount: 15
  },
  'user': {
    username: 'user',
    password: 'user123',
    role: 'user',
    email: null, // 测试无邮箱用户
    enabled: true,
    createdAt: '2024-01-15T00:00:00.000Z',
    lastLogin: '2024-12-19T15:30:00.000Z',
    loginCount: 8
  },
  'testuser': {
    username: 'testuser',
    password: 'test123',
    role: 'user',
    email: 'test@example.com',
    enabled: false,
    createdAt: '2024-02-01T00:00:00.000Z',
    lastLogin: null,
    loginCount: 0
  }
};

const DEV_ENVIRONMENTS = [
  {
    id: 'env_1',
    name: '生产环境',
    url: 'https://example.com',
    type: 'production',
    network: 'external',
    description: '主要生产环境',
    tags: ['重要', '生产']
  },
  {
    id: 'env_2',
    name: '测试环境',
    url: 'https://test.example.com',
    type: 'staging',
    network: 'internal',
    description: '测试环境',
    tags: ['测试']
  }
];

// 获取认证token
function getAuthToken() {
  return localStorage.getItem('auth_token');
}

// 设置认证token
function setAuthToken(token) {
  localStorage.setItem('auth_token', token);
}

// 清除认证token
function clearAuthToken() {
  localStorage.removeItem('auth_token');
}

// 开发环境模拟API响应
async function mockApiRequest(endpoint, options = {}) {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body) : null;

  // 模拟登录
  if (endpoint === '/auth/login' && method === 'POST') {
    const { username, password } = body;
    const user = DEV_USERS[username];

    if (user && user.password === password) {
      const token = `dev_token_${username}_${Date.now()}`;
      return {
        success: true,
        user: { username: user.username, role: user.role },
        token
      };
    } else {
      throw new Error('用户名或密码错误');
    }
  }

  // 模拟注册
  if (endpoint === '/auth/register' && method === 'POST') {
    const { username, password, email } = body;

    if (DEV_USERS[username]) {
      throw new Error('用户已存在');
    }

    // 模拟创建新用户
    DEV_USERS[username] = {
      username,
      password,
      email: email || null,
      role: 'user',
      enabled: true,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      loginCount: 0
    };

    return {
      success: true,
      message: 'User created successfully',
      user: {
        username,
        email: email || null,
        role: 'user'
      }
    };
  }

  // 模拟获取所有用户
  if (endpoint === '/users' && method === 'GET') {
    const users = Object.values(DEV_USERS).map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });
    return {
      success: true,
      users
    };
  }

  // 模拟获取单个用户
  if (endpoint.startsWith('/users/') && method === 'GET') {
    const username = endpoint.split('/')[2];
    const user = DEV_USERS[username];
    if (!user) {
      throw new Error('用户不存在');
    }
    const { password, ...safeUser } = user;
    return {
      success: true,
      user: safeUser
    };
  }

  // 模拟更新用户
  if (endpoint.startsWith('/users/') && method === 'PUT') {
    const username = endpoint.split('/')[2];
    const user = DEV_USERS[username];
    if (!user) {
      throw new Error('用户不存在');
    }

    // 更新用户数据
    Object.assign(user, body, { updatedAt: new Date().toISOString() });
    const { password, ...safeUser } = user;
    return {
      success: true,
      message: 'User updated successfully',
      user: safeUser
    };
  }

  // 模拟删除用户
  if (endpoint.startsWith('/users/') && method === 'DELETE') {
    const username = endpoint.split('/')[2];
    if (!DEV_USERS[username]) {
      throw new Error('用户不存在');
    }
    delete DEV_USERS[username];
    return {
      success: true,
      message: `User ${username} deleted successfully`
    };
  }

  // 模拟获取环境列表
  if (endpoint === '/environments' && method === 'GET') {
    return {
      success: true,
      environments: DEV_ENVIRONMENTS
    };
  }

  // 模拟其他API
  return { success: true, message: '开发环境模拟响应' };
}

// 通用API请求函数
async function apiRequest(endpoint, options = {}) {
  // 开发环境使用模拟API
  if (isDevelopment) {
    return mockApiRequest(endpoint, options);
  }

  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// 认证API
export const authAPI = {
  async login(username, password) {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    
    if (result.token) {
      setAuthToken(result.token);
    }
    
    return result;
  },

  async register(username, password, email) {
    const requestBody = { username, password };
    // 只有当邮箱不为空时才添加到请求体中
    if (email) {
      requestBody.email = email;
    }

    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });
  },

  async logout() {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      clearAuthToken();
    }
  },

  async verifyToken() {
    try {
      return await apiRequest('/auth/verify');
    } catch (error) {
      clearAuthToken();
      throw error;
    }
  },

  async getCurrentUser() {
    return apiRequest('/auth/user');
  },

  isAuthenticated() {
    return !!getAuthToken();
  }
};

// 环境管理API
export const environmentsAPI = {
  async getAll() {
    const result = await apiRequest('/environments');
    return result.environments || [];
  },

  async getById(id) {
    const result = await apiRequest(`/environments/${id}`);
    return result.environment;
  },

  async create(environmentData) {
    const result = await apiRequest('/environments', {
      method: 'POST',
      body: JSON.stringify(environmentData)
    });
    return result.environment;
  },

  async update(id, environmentData) {
    const result = await apiRequest(`/environments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(environmentData)
    });
    return result.environment;
  },

  async delete(id) {
    return apiRequest(`/environments/${id}`, {
      method: 'DELETE'
    });
  }
};

// KV存储API
export const kvAPI = {
  async test() {
    return apiRequest('/kv?action=test');
  },

  async get(key) {
    const result = await apiRequest(`/kv?action=get&key=${encodeURIComponent(key)}`);
    return result.data;
  },

  async put(key, value) {
    return apiRequest('/kv', {
      method: 'POST',
      body: JSON.stringify({ action: 'put', key, value })
    });
  },

  async delete(key) {
    return apiRequest('/kv', {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', key })
    });
  },

  async list(prefix = '') {
    const result = await apiRequest(`/kv?action=list&key=${encodeURIComponent(prefix)}`);
    return result.keys || [];
  },

  async saveStatus(envId, statusData) {
    return apiRequest('/kv', {
      method: 'POST',
      body: JSON.stringify({ action: 'save_status', envId, statusData })
    });
  },

  async getHistory(envId) {
    const result = await apiRequest('/kv', {
      method: 'POST',
      body: JSON.stringify({ action: 'get_history', envId })
    });
    return result.history || [];
  },

  async initAdmin() {
    return apiRequest('/kv', {
      method: 'POST',
      body: JSON.stringify({ action: 'init_admin' })
    });
  }
};

// 用户管理API
export const usersAPI = {
  async getAll() {
    const result = await apiRequest('/users');
    return result.users || [];
  },

  async getByUsername(username) {
    const result = await apiRequest(`/users/${username}`);
    return result.user;
  },

  async update(username, userData) {
    const result = await apiRequest(`/users/${username}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
    return result.user;
  },

  async delete(username) {
    return apiRequest(`/users/${username}`, {
      method: 'DELETE'
    });
  }
};

// 健康检查API
export const healthAPI = {
  async check() {
    return apiRequest('/health');
  },

  async info() {
    return apiRequest('/info');
  }
};

export { getAuthToken, setAuthToken, clearAuthToken };
