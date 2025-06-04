// 简单的 KV API 客户端
class KVApiClient {
  constructor() {
    this.baseUrl = '/api/kv';
  }

  // 获取数据
  async get(key, type = 'json') {
    try {
      console.log('📡 KV GET 请求:', key);
      const response = await fetch(`${this.baseUrl}?action=get&key=${encodeURIComponent(key)}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📡 KV GET 响应:', result);

      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'KV GET 操作失败');
      }
    } catch (error) {
      console.error('❌ KV GET 错误:', error);
      throw error;
    }
  }

  // 存储数据
  async put(key, value) {
    try {
      console.log('📡 KV PUT 请求:', key, '数据长度:', JSON.stringify(value).length);
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
      console.log('📡 KV PUT 响应:', result);

      if (!result.success) {
        throw new Error(result.error || 'KV PUT 操作失败');
      }

      return true;
    } catch (error) {
      console.error('❌ KV PUT 错误:', error);
      throw error;
    }
  }

  // 删除数据
  async delete(key) {
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
}

// 创建全局实例
export const kvApi = new KVApiClient();

export default kvApi;
