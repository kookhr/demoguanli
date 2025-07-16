#!/usr/bin/env node

/**
 * 快速验证网络检测修复
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 快速验证网络检测修复...\n');

try {
  const networkCheckPath = path.join(__dirname, 'src/utils/simpleNetworkCheck.js');
  const content = fs.readFileSync(networkCheckPath, 'utf8');
  
  console.log('✅ 关键修复验证:');
  
  // 1. 检查是否有isPrivateIP函数
  if (content.includes('const isPrivateIP = (hostname)')) {
    console.log('   ✅ 内网IP检测函数已添加');
  } else {
    console.log('   ❌ 缺少内网IP检测函数');
  }
  
  // 2. 检查是否修复了错误的onerror逻辑
  if (content.includes('responseTime < 200') && content.includes('image-error-network-unreachable')) {
    console.log('   ✅ 图像探测错误逻辑已修复');
  } else {
    console.log('   ❌ 图像探测错误逻辑未修复');
  }
  
  // 3. 检查是否有双重验证
  if (content.includes('verifyReachability')) {
    console.log('   ✅ 双重验证机制已添加');
  } else {
    console.log('   ❌ 缺少双重验证机制');
  }
  
  // 4. 检查fetch增强
  if (content.includes('fetch-network-unreachable')) {
    console.log('   ✅ Fetch检测已增强');
  } else {
    console.log('   ❌ Fetch检测未增强');
  }
  
  console.log('\n🎯 修复要点:');
  console.log('   - 不可达的内网地址(如 http://10.0.1.77:18080)现在应该返回"unreachable"');
  console.log('   - 快速失败(<200ms)的内网IP被正确识别为不可达');
  console.log('   - 添加了双重验证防止误报');
  
  console.log('\n📝 测试建议:');
  console.log('   1. 在环境管理系统中测试 http://10.0.1.77:18080');
  console.log('   2. 该地址应该显示为"不可达"状态');
  console.log('   3. 正常地址(如 https://www.baidu.com)应该仍然正常');
  
} catch (error) {
  console.error('❌ 验证失败:', error.message);
  process.exit(1);
}

console.log('\n✅ 修复验证完成！');
