#!/usr/bin/env node

/**
 * Cloudflare Workers 配置验证脚本
 * 验证迁移后的配置正确性
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 验证必要文件
function validateFiles() {
  log('\n📁 验证必要文件...', 'cyan');
  
  const requiredFiles = [
    { path: 'wrangler.toml', description: 'Workers 配置文件' },
    { path: 'src/worker.js', description: 'Worker 主入口文件' },
    { path: 'package.json', description: '项目配置文件' },
    { path: 'dist/index.html', description: '构建输出文件' },
    { path: '.github/workflows/deploy-workers.yml', description: 'GitHub Actions 工作流' },
    { path: '.assetsignore', description: '静态资源忽略文件' }
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    if (existsSync(file.path)) {
      log(`✅ ${file.description}: ${file.path}`, 'green');
    } else {
      log(`❌ ${file.description}: ${file.path} 不存在`, 'red');
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

// 验证 wrangler.toml 配置
function validateWranglerConfig() {
  log('\n⚙️  验证 wrangler.toml 配置...', 'cyan');
  
  try {
    const config = readFileSync('wrangler.toml', 'utf8');
    
    // 检查必要配置项
    const checks = [
      { pattern: /name\s*=\s*"[^"]+"/g, name: 'Worker 名称', required: true },
      { pattern: /main\s*=\s*"src\/worker\.js"/g, name: '主入口文件', required: true },
      { pattern: /compatibility_date\s*=\s*"2025-01-15"/g, name: '兼容性日期', required: true },
      { pattern: /\[assets\]/g, name: '静态资源配置', required: true },
      { pattern: /directory\s*=\s*"\.\/dist"/g, name: '静态资源目录', required: true },
      { pattern: /binding\s*=\s*"ASSETS"/g, name: '静态资源绑定', required: true },
      { pattern: /\[\[kv_namespaces\]\]/g, name: 'KV 命名空间配置', required: true },
      { pattern: /binding\s*=\s*"ENV_CONFIG"/g, name: 'KV 绑定名称', required: true },
      { pattern: /id\s*=\s*"[a-f0-9-]+"/g, name: 'KV 命名空间 ID', required: true },
      { pattern: /preview_id\s*=\s*"[a-f0-9-]+"/g, name: 'KV 预览 ID', required: true },
      { pattern: /\[placement\]/g, name: '智能放置配置', required: false },
      { pattern: /mode\s*=\s*"smart"/g, name: '智能放置模式', required: false }
    ];
    
    let allValid = true;
    
    checks.forEach(check => {
      if (check.pattern.test(config)) {
        log(`✅ ${check.name}`, 'green');
      } else {
        const status = check.required ? '❌' : '⚠️ ';
        const color = check.required ? 'red' : 'yellow';
        log(`${status} ${check.name} ${check.required ? '配置缺失' : '配置可选'}`, color);
        if (check.required) allValid = false;
      }
    });
    
    // 检查是否还有占位符
    const placeholders = [
      { text: 'your-kv-namespace-id', name: 'KV 命名空间 ID 占位符' },
      { text: 'your-preview-kv-namespace-id', name: 'KV 预览 ID 占位符' },
      { text: 'your-subdomain', name: '子域名占位符' }
    ];
    
    placeholders.forEach(placeholder => {
      if (config.includes(placeholder.text)) {
        log(`⚠️  发现未替换的${placeholder.name}`, 'yellow');
        allValid = false;
      }
    });
    
    return allValid;
  } catch (error) {
    log(`❌ 读取 wrangler.toml 失败: ${error.message}`, 'red');
    return false;
  }
}

// 验证 Worker 脚本
function validateWorkerScript() {
  log('\n🔍 验证 Worker 脚本...', 'cyan');
  
  try {
    const workerCode = readFileSync('src/worker.js', 'utf8');
    
    // 检查必要的导入和类
    const checks = [
      { pattern: /import.*WorkerEntrypoint.*from.*cloudflare:workers/g, name: 'WorkerEntrypoint 导入' },
      { pattern: /class.*extends WorkerEntrypoint/g, name: 'WorkerEntrypoint 继承' },
      { pattern: /async fetch\(request, env, ctx\)/g, name: 'fetch 方法' },
      { pattern: /handleAPI\(request, env, ctx\)/g, name: 'API 处理方法' },
      { pattern: /handleStaticAssets\(request, env, ctx\)/g, name: '静态资源处理方法' },
      { pattern: /handleKVAPI\(request, env\)/g, name: 'KV API 处理方法' },
      { pattern: /env\.ENV_CONFIG/g, name: 'KV 绑定使用' },
      { pattern: /env\.ASSETS/g, name: '静态资源绑定使用' },
      { pattern: /Access-Control-Allow-Origin/g, name: 'CORS 头配置' }
    ];
    
    let allValid = true;
    
    checks.forEach(check => {
      if (check.pattern.test(workerCode)) {
        log(`✅ ${check.name}`, 'green');
      } else {
        log(`❌ ${check.name} 缺失`, 'red');
        allValid = false;
      }
    });
    
    // 语法检查
    try {
      execSync('node --check src/worker.js', { stdio: 'pipe' });
      log('✅ Worker 脚本语法正确', 'green');
    } catch (error) {
      log(`❌ Worker 脚本语法错误`, 'red');
      allValid = false;
    }
    
    return allValid;
  } catch (error) {
    log(`❌ 读取 Worker 脚本失败: ${error.message}`, 'red');
    return false;
  }
}

// 验证 package.json
function validatePackageJson() {
  log('\n📦 验证 package.json...', 'cyan');
  
  try {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    
    // 检查必要的脚本
    const requiredScripts = [
      'workers:dev',
      'workers:deploy',
      'workers:deploy:staging',
      'workers:deploy:production',
      'migrate:pages-to-workers',
      'validate:workers'
    ];
    
    let allValid = true;
    
    requiredScripts.forEach(script => {
      if (pkg.scripts && pkg.scripts[script]) {
        log(`✅ 脚本: ${script}`, 'green');
      } else {
        log(`❌ 缺少脚本: ${script}`, 'red');
        allValid = false;
      }
    });
    
    // 检查 Wrangler 依赖
    if (pkg.devDependencies && pkg.devDependencies.wrangler) {
      log(`✅ Wrangler 依赖: ${pkg.devDependencies.wrangler}`, 'green');
    } else {
      log('❌ 缺少 Wrangler 依赖', 'red');
      allValid = false;
    }
    
    return allValid;
  } catch (error) {
    log(`❌ 读取 package.json 失败: ${error.message}`, 'red');
    return false;
  }
}

// 验证 GitHub Actions 工作流
function validateGitHubActions() {
  log('\n🔗 验证 GitHub Actions 工作流...', 'cyan');
  
  try {
    const workflow = readFileSync('.github/workflows/deploy-workers.yml', 'utf8');
    
    const checks = [
      { pattern: /name:\s*Deploy to Cloudflare Workers/g, name: '工作流名称' },
      { pattern: /cloudflare\/wrangler-action@v3/g, name: 'Wrangler Action 版本' },
      { pattern: /CLOUDFLARE_API_TOKEN/g, name: 'API Token 配置' },
      { pattern: /CLOUDFLARE_ACCOUNT_ID/g, name: 'Account ID 配置' },
      { pattern: /environment:\s*development/g, name: '开发环境配置' },
      { pattern: /environment:\s*staging/g, name: '预生产环境配置' },
      { pattern: /environment:\s*production/g, name: '生产环境配置' }
    ];
    
    let allValid = true;
    
    checks.forEach(check => {
      if (check.pattern.test(workflow)) {
        log(`✅ ${check.name}`, 'green');
      } else {
        log(`❌ ${check.name} 配置缺失`, 'red');
        allValid = false;
      }
    });
    
    return allValid;
  } catch (error) {
    log(`❌ 读取 GitHub Actions 工作流失败: ${error.message}`, 'red');
    return false;
  }
}

// 验证构建输出
function validateBuild() {
  log('\n🔨 验证构建输出...', 'cyan');
  
  const buildFiles = [
    'dist/index.html',
    'dist/assets'
  ];
  
  let allValid = true;
  
  buildFiles.forEach(file => {
    if (existsSync(file)) {
      log(`✅ ${file}`, 'green');
    } else {
      log(`❌ ${file} 不存在，请运行 npm run build`, 'red');
      allValid = false;
    }
  });
  
  return allValid;
}

// 验证 Wrangler 认证
function validateAuth() {
  log('\n🔐 验证 Wrangler 认证...', 'cyan');
  
  try {
    const output = execSync('wrangler whoami', { encoding: 'utf8', stdio: 'pipe' });
    if (output.includes('You are logged in')) {
      log('✅ Wrangler 已认证', 'green');
      return true;
    } else {
      log('❌ Wrangler 未认证，请运行 wrangler login', 'red');
      return false;
    }
  } catch (error) {
    log('❌ Wrangler 未安装或认证失败', 'red');
    return false;
  }
}

// 生成验证报告
function generateValidationReport(results) {
  const timestamp = new Date().toISOString();
  const allPassed = Object.values(results).every(result => result);
  
  const report = `# Workers 配置验证报告

## 验证时间
${timestamp}

## 验证结果
${allPassed ? '✅ 所有验证通过' : '❌ 存在配置问题'}

## 详细结果
- 必要文件: ${results.files ? '✅' : '❌'}
- Wrangler 配置: ${results.wranglerConfig ? '✅' : '❌'}
- Worker 脚本: ${results.workerScript ? '✅' : '❌'}
- Package.json: ${results.packageJson ? '✅' : '❌'}
- GitHub Actions: ${results.githubActions ? '✅' : '❌'}
- 构建输出: ${results.build ? '✅' : '❌'}
- Wrangler 认证: ${results.auth ? '✅' : '❌'}

## 建议操作
${allPassed ? 
  '🎉 配置验证通过！可以进行部署。' : 
  '⚠️  请修复上述问题后重新验证。'
}

## 下一步
${allPassed ? 
  `- 运行 \`npm run workers:deploy\` 部署到生产环境
- 配置 GitHub Secrets 启用自动部署
- 访问 Worker URL 验证功能` :
  `- 修复配置问题
- 重新运行验证: \`npm run validate:workers\`
- 查看详细错误信息`
}
`;

  return report;
}

// 主验证函数
function main() {
  log('🔍 Cloudflare Workers 配置验证', 'blue');
  log('基于2025年最新技术标准', 'cyan');
  log('=' .repeat(40), 'cyan');
  
  const results = {
    files: validateFiles(),
    wranglerConfig: validateWranglerConfig(),
    workerScript: validateWorkerScript(),
    packageJson: validatePackageJson(),
    githubActions: validateGitHubActions(),
    build: validateBuild(),
    auth: validateAuth()
  };
  
  const allValid = Object.values(results).every(result => result);
  
  log('\n📊 验证汇总:', 'cyan');
  Object.entries(results).forEach(([key, valid]) => {
    const status = valid ? '✅' : '❌';
    const color = valid ? 'green' : 'red';
    log(`${status} ${key}`, color);
  });
  
  // 生成报告
  const report = generateValidationReport(results);
  console.log('\n' + report);
  
  if (allValid) {
    log('\n🎉 所有验证通过！可以进行部署', 'green');
    log('🚀 运行 npm run workers:deploy 开始部署', 'cyan');
    process.exit(0);
  } else {
    log('\n❌ 验证失败，请修复上述问题后重试', 'red');
    process.exit(1);
  }
}

// 运行验证
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
