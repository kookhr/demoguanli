// Cloudflare KV API 客户端包装器
// 通过 Pages Functions 访问 KV 存储

class KVApiClient {
  constructor() {
    this.baseUrl = '/api/kv';
    this.available = null;
    this.testPromise = null;
  }

  // 测试 KV 可用性
  async testAvailability() {
    if (this.testPromise) {
      return this.testPromise;
    }

    this.testPromise = this._performTest();
    return this.testPromise;
  }

  async _performTest() {
    try {
      console.log('🧪 测试 KV API 可用性...');
      
      const response = await fetch(`${this.baseUrl}?action=test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.available && result.test) {
        console.log('✅ KV API 测试成功');
        this.available = true;
        return true;
      } else {
        console.log('❌ KV API 测试失败:', result);
        this.available = false;
        return false;
      }
    } catch (error) {
      console.error('❌ KV API 测试错误:', error);
      this.available = false;
      return false;
    }
  }

  // 检查是否可用
  isAvailable() {
    return this.available === true;
  }

  // 获取数据
  async get(key, type = 'json') {
    if (!this.isAvailable()) {
      throw new Error('KV API 不可用');
    }

    try {
      const response = await fetch(`${this.baseUrl}?action=get&key=${encodeURIComponent(key)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'KV GET 操作失败');
      }
    } catch (error) {
      console.error('KV GET 错误:', error);
      throw error;
    }
  }

  // 存储数据
  async put(key, value) {
    if (!this.isAvailable()) {
      throw new Error('KV API 不可用');
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'put',
          key,
          value
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'KV PUT 操作失败');
      }

      return true;
    } catch (error) {
      console.error('KV PUT 错误:', error);
      throw error;
    }
  }

  // 删除数据
  async delete(key) {
    if (!this.isAvailable()) {
      throw new Error('KV API 不可用');
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'delete',
          key
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'KV DELETE 操作失败');
      }

      return true;
    } catch (error) {
      console.error('KV DELETE 错误:', error);
      throw error;
    }
  }

  // 重置可用性状态
  resetAvailability() {
    this.available = null;
    this.testPromise = null;
  }

  // 获取详细状态
  async getStatus() {
    try {
      const isAvailable = await this.testAvailability();
      
      return {
        available: isAvailable,
        type: 'pages-function-api',
        endpoint: this.baseUrl,
        lastTest: new Date().toISOString()
      };
    } catch (error) {
      return {
        available: false,
        type: 'pages-function-api',
        endpoint: this.baseUrl,
        error: error.message,
        lastTest: new Date().toISOString()
      };
    }
  }
}

// 创建全局实例
export const kvApi = new KVApiClient();

// 兼容性包装器，模拟 KV 绑定接口
export class KVApiWrapper {
  constructor(apiClient) {
    this.api = apiClient;
  }

  async get(key, type = 'json') {
    return await this.api.get(key, type);
  }

  async put(key, value) {
    return await this.api.put(key, value);
  }

  async delete(key) {
    return await this.api.delete(key);
  }

  // 检查是否可用
  isAvailable() {
    return this.api.isAvailable();
  }

  // 测试连接
  async test() {
    return await this.api.testAvailability();
  }
}

// 创建包装器实例
export const kvWrapper = new KVApiWrapper(kvApi);

export default kvApi;
