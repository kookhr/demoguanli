#!/usr/bin/env node

/**
 * 自动化部署测试脚本
 * 验证Cloudflare Workers KV存储功能
 */

const https = require('https');
const { URL } = require('url');

// 配置
const CONFIG = {
  WORKER_URL: process.env.WORKER_URL || 'https://environment-manager.your-subdomain.workers.dev',
  TIMEOUT: 10000,
  RETRY_COUNT: 3
};

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// HTTP请求工具
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Deployment-Test-Script/1.0',
        ...options.headers
      },
      timeout: CONFIG.TIMEOUT
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            headers: res.headers,
            data: data
          };
          
          // 尝试解析JSON
          if (res.headers['content-type']?.includes('application/json')) {
            result.json = JSON.parse(data);
          }
          
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// 测试用例
class DeploymentTester {
  constructor() {
    this.results = [];
    this.authToken = null;
  }

  async runTest(name, testFn) {
    log(`\n🧪 Testing: ${name}`, 'blue');
    
    try {
      const result = await testFn();
      this.results.push({ name, status: 'PASS', result });
      log(`✅ PASS: ${name}`, 'green');
      return result;
    } catch (error) {
      this.results.push({ name, status: 'FAIL', error: error.message });
      log(`❌ FAIL: ${name} - ${error.message}`, 'red');
      throw error;
    }
  }

  async testWorkerHealth() {
    return this.runTest('Worker Health Check', async () => {
      const response = await makeRequest(`${CONFIG.WORKER_URL}/api/health`);
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      if (!response.json?.success) {
        throw new Error('Health check failed');
      }

      return {
        status: response.json.status,
        version: response.json.version,
        environment: response.json.environment,
        edge: response.json.edge
      };
    });
  }

  async testKVConnection() {
    return this.runTest('KV Storage Connection', async () => {
      const response = await makeRequest(`${CONFIG.WORKER_URL}/api/kv?action=test`);
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      if (!response.json?.available) {
        throw new Error('KV storage not available');
      }

      if (!response.json?.test) {
        throw new Error('KV test operation failed');
      }

      return {
        available: response.json.available,
        test: response.json.test
      };
    });
  }

  async testAdminInit() {
    return this.runTest('Admin Initialization', async () => {
      const response = await makeRequest(`${CONFIG.WORKER_URL}/api/kv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'init_admin' })
      });
      
      // 409 表示管理员已存在，这也是正常的
      if (response.status !== 200 && response.status !== 409) {
        throw new Error(`Expected status 200 or 409, got ${response.status}`);
      }

      return {
        initialized: response.status === 200,
        alreadyExists: response.status === 409
      };
    });
  }

  async testUserLogin() {
    return this.runTest('User Authentication', async () => {
      const response = await makeRequest(`${CONFIG.WORKER_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin123'
        })
      });
      
      if (response.status !== 200) {
        throw new Error(`Login failed with status ${response.status}`);
      }

      if (!response.json?.token) {
        throw new Error('No authentication token received');
      }

      // 保存token用于后续测试
      this.authToken = response.json.token;

      return {
        token: response.json.token.substring(0, 20) + '...',
        user: response.json.user
      };
    });
  }

  async testEnvironmentAPI() {
    return this.runTest('Environment Management API', async () => {
      if (!this.authToken) {
        throw new Error('No authentication token available');
      }

      // 测试获取环境列表
      const response = await makeRequest(`${CONFIG.WORKER_URL}/api/environments`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      const environments = response.json?.environments || [];

      return {
        environmentCount: environments.length,
        hasEnvironments: environments.length > 0
      };
    });
  }

  async testStaticAssets() {
    return this.runTest('Static Assets Serving', async () => {
      const response = await makeRequest(CONFIG.WORKER_URL);
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      if (!response.data.includes('<!DOCTYPE html>')) {
        throw new Error('Invalid HTML response');
      }

      return {
        contentLength: response.data.length,
        hasHTML: response.data.includes('<!DOCTYPE html>'),
        hasReact: response.data.includes('root')
      };
    });
  }

  async testCacheHeaders() {
    return this.runTest('Cache Headers', async () => {
      const response = await makeRequest(`${CONFIG.WORKER_URL}/api/health`);
      
      const cacheControl = response.headers['cache-control'];
      const xCache = response.headers['x-cache'];

      return {
        hasCacheControl: !!cacheControl,
        cacheControl,
        xCache
      };
    });
  }

  async testSecurityHeaders() {
    return this.runTest('Security Headers', async () => {
      const response = await makeRequest(CONFIG.WORKER_URL);
      
      const securityHeaders = {
        'x-content-type-options': response.headers['x-content-type-options'],
        'x-frame-options': response.headers['x-frame-options'],
        'x-xss-protection': response.headers['x-xss-protection'],
        'content-security-policy': response.headers['content-security-policy']
      };

      const hasSecurityHeaders = Object.values(securityHeaders).some(header => !!header);

      return {
        hasSecurityHeaders,
        headers: securityHeaders
      };
    });
  }

  async runAllTests() {
    log(`\n🚀 Starting Deployment Tests for: ${CONFIG.WORKER_URL}`, 'bold');
    log('=' * 60, 'blue');

    try {
      // 基础功能测试
      await this.testWorkerHealth();
      await this.testKVConnection();
      await this.testStaticAssets();

      // 认证功能测试
      await this.testAdminInit();
      await this.testUserLogin();
      await this.testEnvironmentAPI();

      // 性能和安全测试
      await this.testCacheHeaders();
      await this.testSecurityHeaders();

      this.printSummary();
      
    } catch (error) {
      log(`\n💥 Test suite failed: ${error.message}`, 'red');
      this.printSummary();
      process.exit(1);
    }
  }

  printSummary() {
    log('\n📊 Test Summary', 'bold');
    log('=' * 40, 'blue');

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;

    this.results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      const color = result.status === 'PASS' ? 'green' : 'red';
      log(`${icon} ${result.name}`, color);
    });

    log(`\nResults: ${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');

    if (failed === 0) {
      log('\n🎉 All tests passed! Deployment is successful!', 'green');
    } else {
      log(`\n⚠️  ${failed} test(s) failed. Please check the configuration.`, 'red');
    }
  }
}

// 主函数
async function main() {
  const tester = new DeploymentTester();
  
  // 检查Worker URL
  if (!CONFIG.WORKER_URL || CONFIG.WORKER_URL.includes('your-subdomain')) {
    log('❌ Please set WORKER_URL environment variable or update the script', 'red');
    log('Example: WORKER_URL=https://your-worker.your-subdomain.workers.dev node test-deployment.js', 'yellow');
    process.exit(1);
  }

  await tester.runAllTests();
}

// 运行测试
if (require.main === module) {
  main().catch(error => {
    log(`💥 Unexpected error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { DeploymentTester };
