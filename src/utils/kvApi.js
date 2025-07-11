// 简单的 KV API 客户端
class KVApiClient {
  constructor() {
    this.baseUrl = '/api/kv';
  }

  // 获取数据
  async get(key) {
    const url = `${this.baseUrl}?action=get&key=${encodeURIComponent(key)}`;
    console.log('[KV] GET请求:', url);

    try {
      const response = await fetch(url);
      console.log('[KV] 响应状态:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[KV] 响应数据:', result);

      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'KV GET 操作失败');
      }
    } catch (error) {
      console.error('[KV] 请求失败:', error);
      throw error;
    }
  }

  // 存储数据
  async put(key, value) {
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
  }

  // 删除数据
  async delete(key) {
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
  }
}

// 创建全局实例
export const kvApi = new KVApiClient();

export default kvApi;
