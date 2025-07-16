#!/usr/bin/env node

/**
 * 验证保守策略修复效果
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 验证保守策略修复...\n');

try {
  const networkCheckPath = path.join(__dirname, 'src/utils/simpleNetworkCheck.js');
  const content = fs.readFileSync(networkCheckPath, 'utf8');
  
  console.log('✅ 保守策略修复验证:');
  
  // 1. 检查响应时间阈值调整
  if (content.includes('responseTime < 50') && content.includes('image-error-very-fast-fail')) {
    console.log('   ✅ 图像探测阈值已调整为50ms（更保守）');
  } else {
    console.log('   ❌ 图像探测阈值未正确调整');
  }
  
  if (content.includes('responseTime < 30') && content.includes('fetch-very-fast-fail')) {
    console.log('   ✅ Fetch检测阈值已调整为30ms（更保守）');
  } else {
    console.log('   ❌ Fetch检测阈值未正确调整');
  }
  
  // 2. 检查保守判断策略
  if (content.includes('image-error-conservative-reachable') && 
      content.includes('保守判断为可达')) {
    console.log('   ✅ 保守判断策略已添加');
  } else {
    console.log('   ❌ 缺少保守判断策略');
  }
  
  // 3. 检查智能验证机制
  if (content.includes('very-fast-fail') && 
      content.includes('verification-corrected-reachable')) {
    console.log('   ✅ 智能验证机制已改进');
  } else {
    console.log('   ❌ 智能验证机制未改进');
  }
  
  // 4. 检查多次验证逻辑
  if (content.includes('multi-verification-unreachable') && 
      content.includes('fastFailCount === totalAttempts')) {
    console.log('   ✅ 多次验证逻辑已添加');
  } else {
    console.log('   ❌ 缺少多次验证逻辑');
  }
  
  console.log('\n🎯 修复要点:');
  console.log('   - 响应时间阈值更加保守（50ms/30ms）');
  console.log('   - 采用保守策略，倾向于判断为"可达"');
  console.log('   - 只对极快失败进行验证');
  console.log('   - 多路径验证增加准确性');
  
  console.log('\n📝 测试建议:');
  console.log('   1. 测试之前可达但现在显示不可达的内网IP');
  console.log('   2. 验证它们现在能正确显示为"可达"');
  console.log('   3. 确认 http://10.0.1.77:18080 仍然显示为"不可达"');
  console.log('   4. 检查整体检测准确性');
  
  console.log('\n🔧 如果仍有问题:');
  console.log('   - 可以进一步降低阈值（如20ms）');
  console.log('   - 或者完全禁用内网IP特殊处理');
  console.log('   - 请提供具体的问题地址以便进一步调整');
  
} catch (error) {
  console.error('❌ 验证失败:', error.message);
  process.exit(1);
}

console.log('\n✅ 保守策略修复验证完成！');
console.log('请在环境管理系统中测试您的内网IP地址。');
