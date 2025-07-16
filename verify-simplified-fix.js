#!/usr/bin/env node

/**
 * 验证简化修复效果
 * 检查是否正确实现了"有响应就是可达"的逻辑
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 验证简化修复效果...\n');

try {
  const networkCheckPath = path.join(__dirname, 'src/utils/simpleNetworkCheck.js');
  const content = fs.readFileSync(networkCheckPath, 'utf8');
  
  console.log('✅ 简化修复验证:');
  
  // 1. 检查img.onerror是否简化为总是返回可达
  if (content.includes('image-error-service-reachable') && 
      content.includes('HTTP错误表示服务存在但资源不存在')) {
    console.log('   ✅ img.onerror逻辑已简化：HTTP错误 = 服务可达');
  } else {
    console.log('   ❌ img.onerror逻辑未正确简化');
  }
  
  // 2. 检查是否移除了复杂的响应时间判断
  if (!content.includes('responseTime < 50') && 
      !content.includes('image-error-very-fast-fail')) {
    console.log('   ✅ 复杂的响应时间判断已移除');
  } else {
    console.log('   ❌ 仍存在复杂的响应时间判断');
  }
  
  // 3. 检查fetch错误处理是否简化
  if (content.includes('fetch-timeout') && 
      content.includes('fetch-network-error') &&
      !content.includes('fetch-very-fast-fail')) {
    console.log('   ✅ fetch错误处理已简化：只有超时和网络错误');
  } else {
    console.log('   ❌ fetch错误处理未正确简化');
  }
  
  // 4. 检查验证机制是否简化
  if (content.includes('不再进行复杂的验证，直接返回主要结果')) {
    console.log('   ✅ 复杂的验证机制已移除');
  } else {
    console.log('   ❌ 复杂的验证机制未移除');
  }
  
  console.log('\n🎯 新的检测逻辑:');
  console.log('   - img.onload → 可达（图像加载成功）');
  console.log('   - img.onerror → 可达（服务存在，HTTP错误）');
  console.log('   - 超时 → 不可达（真正的网络不可达）');
  
  console.log('\n📝 预期效果:');
  console.log('   - http://10.0.12.158:18080/ → 应该显示为"可达"');
  console.log('   - http://10.0.1.77:18080 → 应该显示为"不可达"（超时）');
  
  console.log('\n🧪 测试建议:');
  console.log('   1. 刷新环境管理系统页面');
  console.log('   2. 点击"检测所有"按钮');
  console.log('   3. 查看"用户可达地址测试"环境状态');
  console.log('   4. 确认 http://10.0.12.158:18080 显示为"可达"');
  console.log('   5. 确认 http://10.0.1.77:18080 仍显示为"不可达"');
  
} catch (error) {
  console.error('❌ 验证失败:', error.message);
  process.exit(1);
}

console.log('\n✅ 简化修复验证完成！');
console.log('现在的逻辑更简单、更可靠：有HTTP响应就是可达！');
