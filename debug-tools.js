// 环境管理系统调试工具
// 在浏览器控制台中使用这些函数来调试配置导入和网络检测问题

// 导入必要的模块
import { importConfig, verifyImportResult, debugDatabaseConnection } from './src/utils/configManager.js';
import { checkEnvironmentStatus } from './src/utils/simpleNetworkCheck.js';
import databaseAPI from './src/utils/databaseApi.js';

// 调试工具对象
window.DebugTools = {
  
  // 1. 测试配置导入功能
  async testConfigImport() {
    console.log('🔧 开始测试配置导入功能...');
    
    // 测试配置数据
    const testConfig = {
      environments: [
        {
          id: 'test-env-1',
          name: '测试环境1',
          url: 'https://httpbin.org/status/200',
          description: '用于测试的环境',
          version: '1.0.0',
          network_type: 'external',
          environment_type: 'testing',
          tags: ['测试', 'HTTP']
        },
        {
          id: 'test-env-2',
          name: '测试环境2',
          url: 'https://jsonplaceholder.typicode.com/posts/1',
          description: '另一个测试环境',
          version: '1.0.0',
          network_type: 'external',
          environment_type: 'testing',
          tags: ['测试', 'JSON']
        }
      ]
    };
    
    try {
      // 执行导入
      console.log('📤 执行配置导入...');
      const importResult = await importConfig(JSON.stringify(testConfig));
      console.log('✅ 导入成功:', importResult);
      
      // 验证导入结果
      console.log('🔍 验证导入结果...');
      const verifyResult = await verifyImportResult();
      console.log('📊 验证结果:', verifyResult);
      
      return {
        success: true,
        importResult,
        verifyResult
      };
      
    } catch (error) {
      console.error('❌ 配置导入测试失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // 2. 测试网络检测功能
  async testNetworkDetection() {
    console.log('🌐 开始测试网络检测功能...');
    
    // 测试环境列表
    const testEnvironments = [
      {
        id: 'test-1',
        name: '正常网站',
        url: 'https://httpbin.org/status/200'
      },
      {
        id: 'test-2',
        name: '404错误',
        url: 'https://httpbin.org/status/404'
      },
      {
        id: 'test-3',
        name: '500错误',
        url: 'https://httpbin.org/status/500'
      },
      {
        id: 'test-4',
        name: '不存在的域名',
        url: 'https://this-domain-does-not-exist-12345.com'
      }
    ];
    
    const results = [];
    
    for (const env of testEnvironments) {
      console.log(`🔍 检测: ${env.name} (${env.url})`);
      
      try {
        const result = await checkEnvironmentStatus(env);
        console.log(`📊 结果: ${env.name} - ${result.status}`);
        results.push({
          environment: env.name,
          url: env.url,
          result: result
        });
      } catch (error) {
        console.error(`❌ 检测失败: ${env.name}`, error);
        results.push({
          environment: env.name,
          url: env.url,
          error: error.message
        });
      }
    }
    
    console.log('🎯 网络检测测试完成:', results);
    return results;
  },
  
  // 3. 测试数据库连接
  async testDatabaseConnection() {
    console.log('🗄️ 开始测试数据库连接...');
    
    try {
      // 测试健康检查
      console.log('🔍 执行健康检查...');
      const healthResult = await debugDatabaseConnection();
      console.log('📊 健康检查结果:', healthResult);
      
      // 测试获取环境列表
      console.log('📋 获取环境列表...');
      const environments = await databaseAPI.getEnvironments();
      console.log('📊 环境列表:', environments);
      
      return {
        success: true,
        healthCheck: healthResult,
        environments: environments
      };
      
    } catch (error) {
      console.error('❌ 数据库连接测试失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // 4. 清除缓存
  clearCache() {
    console.log('🧹 清除所有缓存...');
    
    // 清除localStorage
    const keys = Object.keys(localStorage);
    const envKeys = keys.filter(key => key.includes('env') || key.includes('config'));
    
    envKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ 已清除: ${key}`);
    });
    
    // 清除网络检测缓存
    if (window.statusCache) {
      window.statusCache.clear();
      console.log('🗑️ 已清除网络检测缓存');
    }
    
    console.log('✅ 缓存清除完成');
  },
  
  // 5. 获取系统状态
  async getSystemStatus() {
    console.log('📊 获取系统状态...');
    
    const status = {
      timestamp: new Date().toISOString(),
      localStorage: {},
      api: {},
      network: {}
    };
    
    // 检查localStorage
    status.localStorage.environments = localStorage.getItem('environments') ? 'exists' : 'empty';
    status.localStorage.config = localStorage.getItem('config') ? 'exists' : 'empty';
    status.localStorage.auth_token = localStorage.getItem('auth_token') ? 'exists' : 'empty';
    
    // 检查API连接
    try {
      const healthCheck = await databaseAPI.healthCheck();
      status.api.connection = 'ok';
      status.api.response = healthCheck;
    } catch (error) {
      status.api.connection = 'failed';
      status.api.error = error.message;
    }
    
    // 检查网络检测
    try {
      const testResult = await checkEnvironmentStatus({
        id: 'test',
        name: 'Test',
        url: 'https://httpbin.org/status/200'
      });
      status.network.detection = 'ok';
      status.network.testResult = testResult;
    } catch (error) {
      status.network.detection = 'failed';
      status.network.error = error.message;
    }
    
    console.log('📊 系统状态:', status);
    return status;
  },
  
  // 6. 运行完整测试套件
  async runFullTest() {
    console.log('🚀 开始运行完整测试套件...');
    
    const results = {
      timestamp: new Date().toISOString(),
      tests: {}
    };
    
    // 1. 系统状态检查
    console.log('\n1️⃣ 系统状态检查');
    results.tests.systemStatus = await this.getSystemStatus();
    
    // 2. 数据库连接测试
    console.log('\n2️⃣ 数据库连接测试');
    results.tests.database = await this.testDatabaseConnection();
    
    // 3. 网络检测测试
    console.log('\n3️⃣ 网络检测测试');
    results.tests.network = await this.testNetworkDetection();
    
    // 4. 配置导入测试
    console.log('\n4️⃣ 配置导入测试');
    results.tests.configImport = await this.testConfigImport();
    
    console.log('\n🎉 完整测试套件执行完成!');
    console.log('📊 测试结果汇总:', results);
    
    return results;
  }
};

// 使用说明
console.log(`
🔧 环境管理系统调试工具已加载！

使用方法：
1. 测试配置导入：DebugTools.testConfigImport()
2. 测试网络检测：DebugTools.testNetworkDetection()
3. 测试数据库连接：DebugTools.testDatabaseConnection()
4. 清除缓存：DebugTools.clearCache()
5. 获取系统状态：DebugTools.getSystemStatus()
6. 运行完整测试：DebugTools.runFullTest()

示例：
await DebugTools.runFullTest()
`);

export default window.DebugTools;
