/**
 * API客户端 - 与KV存储后端通信
 */

const API_BASE = '/api';

// 检测是否为开发环境
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';

// 开发环境模拟数据
const DEV_USERS = {
  'admin': { username: 'admin', password: 'admin123', role: 'admin' },
  'user': { username: 'user', password: 'user123', role: 'user' }
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
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, email })
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
