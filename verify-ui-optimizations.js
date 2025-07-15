#!/usr/bin/env node

/**
 * UI优化验证脚本
 * 验证导航栏卡片设计按钮移除和Toast通知禁用是否正确实施
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 开始验证UI优化...\n');

// 验证结果
const results = {
  navigationOptimization: false,
  toastOptimization: false,
  errors: []
};

// 1. 验证导航栏优化
console.log('1️⃣ 验证导航栏优化...');
try {
  const navigationPath = path.join(__dirname, 'src/components/Navigation.jsx');
  const navigationContent = fs.readFileSync(navigationPath, 'utf8');
  
  // 检查是否移除了卡片设计相关内容
  const hasCardDesignRoute = navigationContent.includes('card-design-test');
  const hasPaletteImport = navigationContent.includes('Palette');
  
  if (!hasCardDesignRoute && !hasPaletteImport) {
    console.log('   ✅ 卡片设计按钮已成功移除');
    console.log('   ✅ Palette图标导入已清理');
    results.navigationOptimization = true;
  } else {
    if (hasCardDesignRoute) {
      results.errors.push('❌ 仍然存在卡片设计路由引用');
    }
    if (hasPaletteImport) {
      results.errors.push('❌ 仍然存在Palette图标导入');
    }
  }
} catch (error) {
  results.errors.push(`❌ 读取Navigation.jsx失败: ${error.message}`);
}

// 2. 验证Toast通知优化
console.log('\n2️⃣ 验证Toast通知优化...');
try {
  const environmentListPath = path.join(__dirname, 'src/components/EnvironmentList.jsx');
  const environmentListContent = fs.readFileSync(environmentListPath, 'utf8');
  
  // 检查Toast通知是否被正确注释
  const hasCommentedShowInfo = environmentListContent.includes('// showInfo(`开始检测');
  const hasCommentedShowSuccess = environmentListContent.includes('// showSuccess(`检测完成');
  const hasCommentedShowError = environmentListContent.includes('// showError(\'检测过程中出现错误');
  const hasConsoleError = environmentListContent.includes('console.error(\'[CHECK] 检测过程中出现错误');
  
  if (hasCommentedShowInfo && hasCommentedShowSuccess && hasCommentedShowError && hasConsoleError) {
    console.log('   ✅ 状态检测开始通知已禁用');
    console.log('   ✅ 状态检测完成通知已禁用');
    console.log('   ✅ 状态检测错误通知已禁用');
    console.log('   ✅ 错误日志已保留在控制台');
    results.toastOptimization = true;
  } else {
    if (!hasCommentedShowInfo) {
      results.errors.push('❌ 检测开始通知未正确禁用');
    }
    if (!hasCommentedShowSuccess) {
      results.errors.push('❌ 检测完成通知未正确禁用');
    }
    if (!hasCommentedShowError) {
      results.errors.push('❌ 检测错误通知未正确禁用');
    }
    if (!hasConsoleError) {
      results.errors.push('❌ 控制台错误日志缺失');
    }
  }
} catch (error) {
  results.errors.push(`❌ 读取EnvironmentList.jsx失败: ${error.message}`);
}

// 3. 验证其他重要Toast通知是否保留
console.log('\n3️⃣ 验证其他Toast通知保留...');
try {
  const environmentListPath = path.join(__dirname, 'src/components/EnvironmentList.jsx');
  const environmentListContent = fs.readFileSync(environmentListPath, 'utf8');
  
  // 检查Toast系统是否仍然可用
  const hasToastImport = environmentListContent.includes('useToast');
  const hasToastDeclaration = environmentListContent.includes('const { success: showSuccess, info: showInfo, error: showError } = useToast()');
  
  if (hasToastImport && hasToastDeclaration) {
    console.log('   ✅ Toast系统仍然可用');
    console.log('   ✅ 其他重要通知功能保留');
  } else {
    results.errors.push('❌ Toast系统可能被意外移除');
  }
} catch (error) {
  results.errors.push(`❌ 验证Toast系统失败: ${error.message}`);
}

// 输出验证结果
console.log('\n📊 验证结果总结:');
console.log('==================');

if (results.navigationOptimization) {
  console.log('✅ 导航栏优化: 成功');
} else {
  console.log('❌ 导航栏优化: 失败');
}

if (results.toastOptimization) {
  console.log('✅ Toast通知优化: 成功');
} else {
  console.log('❌ Toast通知优化: 失败');
}

if (results.errors.length > 0) {
  console.log('\n⚠️  发现的问题:');
  results.errors.forEach(error => console.log(`   ${error}`));
}

const allOptimizationsSuccessful = results.navigationOptimization && results.toastOptimization && results.errors.length === 0;

if (allOptimizationsSuccessful) {
  console.log('\n🎉 所有UI优化验证通过！');
  console.log('   - 导航栏已简化，移除了卡片设计按钮');
  console.log('   - 状态检测过程更加静默，不显示弹窗通知');
  console.log('   - 核心功能保持完整');
  process.exit(0);
} else {
  console.log('\n⚠️  部分优化需要检查，请查看上述问题');
  process.exit(1);
}
