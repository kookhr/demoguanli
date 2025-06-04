// Cloudflare KV 绑定检测器
// 专门用于检测和调试 KV 绑定问题

export class KVDetector {
  constructor() {
    this.detectionResults = [];
    this.kvBinding = null;
  }

  // 运行完整的 KV 检测
  async runFullDetection() {
    console.log('🔍 开始完整的 KV 绑定检测...');
    this.detectionResults = [];

    // 1. 基础环境检测
    this.detectEnvironment();

    // 2. 全局变量检测
    this.detectGlobalVariables();

    // 3. 绑定访问检测
    await this.detectBindingAccess();

    // 4. 功能测试
    if (this.kvBinding) {
      await this.testKVFunctionality();
    }

    // 5. 生成报告
    this.generateReport();

    return {
      success: !!this.kvBinding,
      binding: this.kvBinding,
      results: this.detectionResults
    };
  }

  // 检测环境
  detectEnvironment() {
    const env = {
      url: window.location.href,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      userAgent: navigator.userAgent,
      isSecure: window.isSecureContext,
      hasServiceWorker: 'serviceWorker' in navigator,
      hasCaches: typeof caches !== 'undefined',
      hasRequest: typeof Request !== 'undefined',
      hasResponse: typeof Response !== 'undefined',
      hasFetch: typeof fetch !== 'undefined'
    };

    this.detectionResults.push({
      category: '环境检测',
      status: 'info',
      details: env
    });

    // 判断是否在 Cloudflare 环境
    const isCloudflare = env.hostname.includes('.pages.dev') || 
                        env.hostname.includes('.workers.dev') ||
                        (env.hasCaches && env.hasRequest && env.hasResponse);

    this.detectionResults.push({
      category: 'Cloudflare 环境',
      status: isCloudflare ? 'success' : 'warning',
      message: isCloudflare ? '检测到 Cloudflare 环境' : '可能不在 Cloudflare 环境中',
      details: { isCloudflare }
    });

    console.log('🌍 环境检测完成:', env);
  }

  // 检测全局变量
  detectGlobalVariables() {
    const globalVars = [
      'ENV_CONFIG',
      'ASSETS', 
      '__STATIC_CONTENT_MANIFEST',
      'CF_PAGES',
      'CF_PAGES_BRANCH',
      'CF_PAGES_COMMIT_SHA',
      'CF_PAGES_URL'
    ];

    const results = {};
    
    globalVars.forEach(varName => {
      try {
        // 检查多个作用域
        const checks = [
          { scope: 'window', value: typeof window !== 'undefined' ? window[varName] : undefined },
          { scope: 'globalThis', value: typeof globalThis !== 'undefined' ? globalThis[varName] : undefined },
          { scope: 'self', value: typeof self !== 'undefined' ? self[varName] : undefined },
          { scope: 'global', value: typeof global !== 'undefined' ? global[varName] : undefined }
        ];

        const available = checks.filter(check => check.value !== undefined);
        
        results[varName] = {
          available: available.length > 0,
          scopes: available.map(check => check.scope),
          type: available.length > 0 ? typeof available[0].value : 'undefined'
        };

        if (varName === 'ENV_CONFIG' && available.length > 0) {
          this.kvBinding = available[0].value;
          console.log(`✅ 找到 ${varName} 在 ${available[0].scope} 作用域`);
        }

      } catch (error) {
        results[varName] = {
          available: false,
          error: error.message
        };
      }
    });

    this.detectionResults.push({
      category: '全局变量检测',
      status: results.ENV_CONFIG?.available ? 'success' : 'error',
      message: results.ENV_CONFIG?.available ? 'ENV_CONFIG 绑定找到' : 'ENV_CONFIG 绑定未找到',
      details: results
    });

    console.log('🔍 全局变量检测完成:', results);
  }

  // 检测绑定访问
  async detectBindingAccess() {
    if (!this.kvBinding) {
      this.detectionResults.push({
        category: '绑定访问',
        status: 'error',
        message: '无法访问 ENV_CONFIG 绑定',
        details: { reason: '绑定对象不存在' }
      });
      return;
    }

    try {
      // 检查绑定对象的属性和方法
      const bindingInfo = {
        type: typeof this.kvBinding,
        constructor: this.kvBinding.constructor?.name,
        hasGet: typeof this.kvBinding.get === 'function',
        hasPut: typeof this.kvBinding.put === 'function',
        hasDelete: typeof this.kvBinding.delete === 'function',
        hasList: typeof this.kvBinding.list === 'function',
        hasGetWithMetadata: typeof this.kvBinding.getWithMetadata === 'function'
      };

      // 检查是否是有效的 KV 绑定
      const isValidKV = bindingInfo.hasGet && bindingInfo.hasPut;

      this.detectionResults.push({
        category: '绑定访问',
        status: isValidKV ? 'success' : 'error',
        message: isValidKV ? 'KV 绑定有效' : 'KV 绑定无效或不完整',
        details: bindingInfo
      });

      console.log('🔗 绑定访问检测完成:', bindingInfo);

    } catch (error) {
      this.detectionResults.push({
        category: '绑定访问',
        status: 'error',
        message: '绑定访问失败',
        details: { error: error.message }
      });
      console.error('❌ 绑定访问检测失败:', error);
    }
  }

  // 测试 KV 功能
  async testKVFunctionality() {
    if (!this.kvBinding) return;

    const testKey = `kv_test_${Date.now()}`;
    const testValue = 'test_value_' + Math.random().toString(36).substr(2, 9);

    try {
      console.log('🧪 开始 KV 功能测试...');

      // 测试 PUT 操作
      console.log('📤 测试 PUT 操作...');
      await this.kvBinding.put(testKey, testValue);
      
      // 等待一小段时间确保数据写入
      await new Promise(resolve => setTimeout(resolve, 100));

      // 测试 GET 操作
      console.log('📥 测试 GET 操作...');
      const retrievedValue = await this.kvBinding.get(testKey);

      // 验证结果
      const putGetSuccess = retrievedValue === testValue;
      
      this.detectionResults.push({
        category: 'KV 功能测试',
        status: putGetSuccess ? 'success' : 'warning',
        message: putGetSuccess ? 'PUT/GET 操作成功' : 'PUT/GET 操作异常',
        details: {
          testKey,
          expectedValue: testValue,
          retrievedValue,
          match: putGetSuccess
        }
      });

      // 测试 DELETE 操作
      if (typeof this.kvBinding.delete === 'function') {
        console.log('🗑️ 测试 DELETE 操作...');
        await this.kvBinding.delete(testKey);
        
        // 验证删除
        const deletedValue = await this.kvBinding.get(testKey);
        const deleteSuccess = deletedValue === null;
        
        this.detectionResults.push({
          category: 'DELETE 测试',
          status: deleteSuccess ? 'success' : 'warning',
          message: deleteSuccess ? 'DELETE 操作成功' : 'DELETE 操作异常',
          details: { deletedValue, deleteSuccess }
        });
      }

      console.log('✅ KV 功能测试完成');

    } catch (error) {
      this.detectionResults.push({
        category: 'KV 功能测试',
        status: 'error',
        message: 'KV 操作失败',
        details: { error: error.message, stack: error.stack }
      });
      
      console.error('❌ KV 功能测试失败:', error);
      
      // 尝试清理测试数据
      try {
        await this.kvBinding.delete(testKey);
      } catch (cleanupError) {
        console.warn('⚠️ 清理测试数据失败:', cleanupError);
      }
    }
  }

  // 生成检测报告
  generateReport() {
    const summary = {
      total: this.detectionResults.length,
      success: this.detectionResults.filter(r => r.status === 'success').length,
      warning: this.detectionResults.filter(r => r.status === 'warning').length,
      error: this.detectionResults.filter(r => r.status === 'error').length,
      info: this.detectionResults.filter(r => r.status === 'info').length
    };

    const hasKV = !!this.kvBinding;
    const allTestsPassed = summary.error === 0;

    console.log('📊 KV 检测报告:');
    console.log('- KV 绑定:', hasKV ? '✅ 找到' : '❌ 未找到');
    console.log('- 测试结果:', `✅ ${summary.success} 成功, ⚠️ ${summary.warning} 警告, ❌ ${summary.error} 错误`);
    console.log('- 整体状态:', allTestsPassed && hasKV ? '✅ 正常' : '❌ 异常');

    this.detectionResults.push({
      category: '检测总结',
      status: allTestsPassed && hasKV ? 'success' : 'error',
      message: `检测完成: ${hasKV ? 'KV 可用' : 'KV 不可用'}`,
      details: summary
    });

    return summary;
  }

  // 获取诊断建议
  getDiagnosticSuggestions() {
    const suggestions = [];

    if (!this.kvBinding) {
      suggestions.push({
        type: 'error',
        title: 'KV 绑定未找到',
        description: 'ENV_CONFIG 绑定在所有作用域中都不可用',
        actions: [
          '检查 Cloudflare Pages 项目设置中的 KV 绑定配置',
          '确认绑定变量名为 "ENV_CONFIG"',
          '验证 KV 命名空间是否正确选择',
          '重新部署应用以应用绑定更改'
        ]
      });
    }

    const errorResults = this.detectionResults.filter(r => r.status === 'error');
    if (errorResults.length > 0) {
      suggestions.push({
        type: 'warning',
        title: '检测到错误',
        description: `${errorResults.length} 个检测项目失败`,
        actions: [
          '查看详细的错误信息',
          '检查网络连接',
          '确认 KV 命名空间权限设置'
        ]
      });
    }

    return suggestions;
  }
}

// 创建全局检测器实例
export const kvDetector = new KVDetector();
