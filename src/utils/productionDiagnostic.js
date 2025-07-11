// 生产环境诊断工具
export const runProductionDiagnostic = async () => {
  console.log('=== 生产环境诊断开始 ===');
  
  const results = {
    environment: null,
    kvApi: null,
    environmentData: null,
    networkCheck: null,
    errors: []
  };

  try {
    // 1. 检查环境类型
    console.log('1. 检查环境类型...');
    results.environment = {
      isDev: import.meta.env.DEV,
      isProd: import.meta.env.PROD,
      mode: import.meta.env.MODE,
      baseUrl: import.meta.env.BASE_URL
    };
    console.log('环境信息:', results.environment);

    // 2. 检查KV API可用性
    console.log('2. 检查KV API可用性...');
    try {
      const kvResponse = await fetch('/api/kv?action=get&key=test');
      results.kvApi = {
        status: kvResponse.status,
        statusText: kvResponse.statusText,
        ok: kvResponse.ok,
        url: kvResponse.url
      };
      
      if (kvResponse.ok) {
        const kvData = await kvResponse.json();
        results.kvApi.response = kvData;
      }
    } catch (error) {
      results.kvApi = { error: error.message };
      results.errors.push(`KV API错误: ${error.message}`);
    }
    console.log('KV API结果:', results.kvApi);

    // 3. 检查环境数据加载
    console.log('3. 检查环境数据加载...');
    try {
      const { getEnvironments } = await import('./configManager.js');
      const environments = await getEnvironments();
      results.environmentData = {
        count: environments?.length || 0,
        hasData: Array.isArray(environments) && environments.length > 0,
        firstEnv: environments?.[0] ? {
          id: environments[0].id,
          name: environments[0].name,
          url: environments[0].url
        } : null
      };
    } catch (error) {
      results.environmentData = { error: error.message };
      results.errors.push(`环境数据错误: ${error.message}`);
    }
    console.log('环境数据结果:', results.environmentData);

    // 4. 检查网络检测功能
    console.log('4. 检查网络检测功能...');
    try {
      const { checkEnvironmentStatus } = await import('./simpleNetworkCheck.js');
      const testEnv = {
        id: 'test',
        name: '测试环境',
        url: 'https://www.google.com'
      };
      const checkResult = await checkEnvironmentStatus(testEnv);
      results.networkCheck = {
        success: true,
        result: checkResult
      };
    } catch (error) {
      results.networkCheck = { error: error.message };
      results.errors.push(`网络检测错误: ${error.message}`);
    }
    console.log('网络检测结果:', results.networkCheck);

    // 5. 检查DOM和事件绑定
    console.log('5. 检查DOM和事件绑定...');
    const checkButton = document.querySelector('button[class*="btn-primary"]');
    results.domCheck = {
      hasCheckButton: !!checkButton,
      buttonDisabled: checkButton?.disabled,
      buttonText: checkButton?.textContent?.trim()
    };
    console.log('DOM检查结果:', results.domCheck);

  } catch (error) {
    results.errors.push(`诊断过程错误: ${error.message}`);
    console.error('诊断过程出错:', error);
  }

  console.log('=== 诊断完成 ===');
  console.log('诊断结果:', results);
  
  // 生成诊断报告
  const report = generateDiagnosticReport(results);
  console.log('=== 诊断报告 ===');
  console.log(report);
  
  return results;
};

const generateDiagnosticReport = (results) => {
  let report = '生产环境诊断报告:\n';
  
  // 环境检查
  if (results.environment) {
    report += `\n✓ 环境类型: ${results.environment.mode} (DEV: ${results.environment.isDev}, PROD: ${results.environment.isProd})\n`;
  }
  
  // KV API检查
  if (results.kvApi?.error) {
    report += `\n✗ KV API不可用: ${results.kvApi.error}\n`;
  } else if (results.kvApi?.ok) {
    report += `\n✓ KV API可用 (状态: ${results.kvApi.status})\n`;
  } else {
    report += `\n⚠ KV API异常 (状态: ${results.kvApi?.status || '未知'})\n`;
  }
  
  // 环境数据检查
  if (results.environmentData?.error) {
    report += `\n✗ 环境数据加载失败: ${results.environmentData.error}\n`;
  } else if (results.environmentData?.hasData) {
    report += `\n✓ 环境数据正常 (数量: ${results.environmentData.count})\n`;
  } else {
    report += `\n⚠ 环境数据异常 (数量: ${results.environmentData?.count || 0})\n`;
  }
  
  // 网络检测检查
  if (results.networkCheck?.error) {
    report += `\n✗ 网络检测功能异常: ${results.networkCheck.error}\n`;
  } else if (results.networkCheck?.success) {
    report += `\n✓ 网络检测功能正常\n`;
  }
  
  // DOM检查
  if (results.domCheck?.hasCheckButton) {
    report += `\n✓ 检测按钮存在 (禁用: ${results.domCheck.buttonDisabled})\n`;
  } else {
    report += `\n✗ 检测按钮不存在\n`;
  }
  
  // 错误汇总
  if (results.errors.length > 0) {
    report += `\n错误汇总:\n`;
    results.errors.forEach((error, index) => {
      report += `${index + 1}. ${error}\n`;
    });
  }
  
  return report;
};

// 在控制台中运行诊断的快捷方式
window.runDiagnostic = runProductionDiagnostic;
