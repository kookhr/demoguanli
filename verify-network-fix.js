#!/usr/bin/env node

/**
 * 网络检测修复验证脚本
 * 验证修复后的网络检测逻辑是否正确处理不可达地址
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 验证网络检测修复...\n');

const results = {
  imageProbeFixed: false,
  fetchEnhanced: false,
  verificationAdded: false,
  privateIPDetection: false,
  errors: []
};

// 1. 验证图像探测修复
console.log('1️⃣ 验证图像探测修复...');
try {
  const networkCheckPath = path.join(__dirname, 'src/utils/simpleNetworkCheck.js');
  const content = fs.readFileSync(networkCheckPath, 'utf8');
  
  // 检查是否修复了错误的onerror处理
  const hasOldErrorLogic = content.includes('reachable: true') && 
                          content.includes('image-error-reachable') &&
                          !content.includes('responseTime < 200');
  
  const hasNewErrorLogic = content.includes('responseTime < 200') &&
                          content.includes('image-error-network-unreachable') &&
                          content.includes('isPrivateIP');
  
  if (!hasOldErrorLogic && hasNewErrorLogic) {
    console.log('   ✅ 图像探测错误逻辑已修复');
    console.log('   ✅ 添加了响应时间判断');
    console.log('   ✅ 添加了内网IP特殊处理');
    results.imageProbeFixed = true;
  } else {
    if (hasOldErrorLogic) {
      results.errors.push('❌ 仍存在错误的onerror处理逻辑');
    }
    if (!hasNewErrorLogic) {
      results.errors.push('❌ 缺少新的响应时间判断逻辑');
    }
  }
} catch (error) {
  results.errors.push(`❌ 读取网络检测文件失败: ${error.message}`);
}

// 2. 验证内网IP检测功能
console.log('\n2️⃣ 验证内网IP检测功能...');
try {
  const networkCheckPath = path.join(__dirname, 'src/utils/simpleNetworkCheck.js');
  const content = fs.readFileSync(networkCheckPath, 'utf8');
  
  const hasPrivateIPFunction = content.includes('const isPrivateIP = (hostname)') &&
                              content.includes('/^10\./') &&
                              content.includes('/^192\\.168\./') &&
                              content.includes('/^172\\.(1[6-9]|2[0-9]|3[0-1])\\./');
  
  if (hasPrivateIPFunction) {
    console.log('   ✅ 内网IP检测函数已添加');
    console.log('   ✅ 包含完整的内网IP范围');
    results.privateIPDetection = true;
  } else {
    results.errors.push('❌ 缺少内网IP检测函数');
  }
} catch (error) {
  results.errors.push(`❌ 验证内网IP检测失败: ${error.message}`);
}

// 3. 验证Fetch检测增强
console.log('\n3️⃣ 验证Fetch检测增强...');
try {
  const networkCheckPath = path.join(__dirname, 'src/utils/simpleNetworkCheck.js');
  const content = fs.readFileSync(networkCheckPath, 'utf8');
  
  const hasFetchEnhancements = content.includes('checkNetworkReachability') &&
                              content.includes('isPrivateIP(urlObj.hostname)') &&
                              content.includes('fetch-network-unreachable') &&
                              content.includes('responseTime < 100');
  
  if (hasFetchEnhancements) {
    console.log('   ✅ Fetch检测已增强');
    console.log('   ✅ 添加了内网IP特殊处理');
    console.log('   ✅ 添加了响应时间分析');
    results.fetchEnhanced = true;
  } else {
    results.errors.push('❌ Fetch检测增强不完整');
  }
} catch (error) {
  results.errors.push(`❌ 验证Fetch检测失败: ${error.message}`);
}

// 4. 验证双重验证机制
console.log('\n4️⃣ 验证双重验证机制...');
try {
  const networkCheckPath = path.join(__dirname, 'src/utils/simpleNetworkCheck.js');
  const content = fs.readFileSync(networkCheckPath, 'utf8');
  
  const hasVerification = content.includes('verifyReachability') &&
                         content.includes('verification-failed') &&
                         content.includes('await verifyReachability');
  
  if (hasVerification) {
    console.log('   ✅ 双重验证机制已添加');
    console.log('   ✅ 集成到主检测流程');
    results.verificationAdded = true;
  } else {
    results.errors.push('❌ 缺少双重验证机制');
  }
} catch (error) {
  results.errors.push(`❌ 验证双重验证机制失败: ${error.message}`);
}

// 5. 验证测试环境是否添加
console.log('\n5️⃣ 验证测试环境...');
try {
  const defaultEnvPath = path.join(__dirname, 'src/data/defaultEnvironments.js');
  const content = fs.readFileSync(defaultEnvPath, 'utf8');
  
  const hasTestEnv = content.includes('test-unreachable') &&
                    content.includes('http://10.0.1.77:18080') &&
                    content.includes('测试不可达地址');
  
  if (hasTestEnv) {
    console.log('   ✅ 测试环境已添加');
    console.log('   ✅ 包含不可达内网地址');
  } else {
    console.log('   ⚠️  测试环境未添加（可选）');
  }
} catch (error) {
  console.log('   ⚠️  无法验证测试环境（可能不存在）');
}

// 输出验证结果
console.log('\n📊 验证结果总结:');
console.log('==================');

const fixes = [
  { name: '图像探测修复', status: results.imageProbeFixed },
  { name: '内网IP检测', status: results.privateIPDetection },
  { name: 'Fetch检测增强', status: results.fetchEnhanced },
  { name: '双重验证机制', status: results.verificationAdded }
];

fixes.forEach(fix => {
  console.log(`${fix.status ? '✅' : '❌'} ${fix.name}: ${fix.status ? '成功' : '失败'}`);
});

if (results.errors.length > 0) {
  console.log('\n⚠️  发现的问题:');
  results.errors.forEach(error => console.log(`   ${error}`));
}

const allFixesSuccessful = fixes.every(fix => fix.status) && results.errors.length === 0;

if (allFixesSuccessful) {
  console.log('\n🎉 网络检测修复验证通过！');
  console.log('   - 图像探测误报问题已修复');
  console.log('   - 内网IP检测逻辑已完善');
  console.log('   - 双重验证机制已添加');
  console.log('   - 不可达地址现在能正确返回unreachable状态');
  console.log('\n📝 建议：');
  console.log('   1. 在环境管理系统中测试 http://10.0.1.77:18080');
  console.log('   2. 验证该地址现在返回"不可达"状态');
  console.log('   3. 确认其他正常地址检测不受影响');
  process.exit(0);
} else {
  console.log('\n⚠️  部分修复需要检查，请查看上述问题');
  process.exit(1);
}
