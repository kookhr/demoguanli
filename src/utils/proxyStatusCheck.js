// 兼容性检测工具 - 保持向后兼容
//
// 这个文件保留了旧的检测函数接口，但内部使用简化的检测逻辑
// 主要用于向后兼容，新代码应该使用 simpleNetworkCheck.js

// 导入简化的检测工具
import {
  checkEnvironmentStatus as simpleCheckEnvironmentStatus,
  checkMultipleEnvironments as simpleCheckMultipleEnvironments
} from './simpleNetworkCheck';

// 兼容性配置保存（简化版）
export const saveCheckConfig = (config) => {
  try {
    localStorage.setItem('simple-check-config', JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Failed to save check config:', error);
    return false;
  }
};

// 兼容性接口 - 使用简化检测
export const checkEnvironmentStatusWithProxy = async (environment) => {
  // 直接使用简化的检测逻辑
  return await simpleCheckEnvironmentStatus(environment);
};

// 兼容性接口 - 批量检测
export const checkMultipleEnvironmentsWithProxy = async (environments, onProgress) => {
  // 直接使用简化的批量检测逻辑
  return await simpleCheckMultipleEnvironments(environments, onProgress);
};
