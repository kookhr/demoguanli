/**
 * API客户端 - 与KV存储后端通信
 */

const API_BASE = '/api';

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

// 通用API请求函数
async function apiRequest(endpoint, options = {}) {
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
