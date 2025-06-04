// 激活码管理工具
import { kvApi } from './kvApi';

const ACTIVATION_CODES_KEY = 'activation_codes';
const ACTIVATION_CODE_PREFIX = 'AC';

// 生成随机激活码
const generateActivationCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = ACTIVATION_CODE_PREFIX;
  
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
};

// 激活码管理类
class ActivationCodeManager {
  constructor() {
    this.codes = new Map();
    this.initialized = false;
  }

  // 初始化激活码数据
  async init() {
    if (this.initialized) return;
    
    try {
      const codesData = await this.getCodesFromStorage();
      if (codesData) {
        Object.entries(codesData).forEach(([code, data]) => {
          this.codes.set(code, data);
        });
      }
      this.initialized = true;
      console.log('🎫 激活码管理器初始化完成');
    } catch (error) {
      console.error('❌ 激活码管理器初始化失败:', error);
      this.initialized = true; // 即使失败也标记为已初始化，避免重复尝试
    }
  }

  // 从存储获取激活码数据
  async getCodesFromStorage() {
    try {
      return await kvApi.get(ACTIVATION_CODES_KEY);
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('404')) {
        return null;
      }
      
      // KV存储不可用时，尝试从本地存储获取
      console.warn('⚠️ KV存储不可用，使用本地存储备用方案');
      return this.getCodesFromLocalStorage();
    }
  }

  // 保存激活码数据到存储
  async saveCodesData() {
    const codesData = Object.fromEntries(this.codes);
    
    try {
      await kvApi.put(ACTIVATION_CODES_KEY, codesData);
    } catch (error) {
      // KV存储不可用时，保存到本地存储
      console.warn('⚠️ KV存储不可用，使用本地存储备用方案');
      this.saveCodesDataToLocalStorage(codesData);
    }
  }

  // 本地存储备用方案
  getCodesFromLocalStorage() {
    try {
      const codesData = localStorage.getItem('env_mgmt_activation_codes');
      return codesData ? JSON.parse(codesData) : null;
    } catch (error) {
      console.error('本地激活码数据读取失败:', error);
      return null;
    }
  }

  saveCodesDataToLocalStorage(codesData) {
    try {
      localStorage.setItem('env_mgmt_activation_codes', JSON.stringify(codesData));
    } catch (error) {
      console.error('本地激活码数据保存失败:', error);
      throw error;
    }
  }

  // 生成新的激活码
  async generateCode(createdBy, expiresInDays = 30, description = '') {
    await this.init();
    
    let code;
    let attempts = 0;
    const maxAttempts = 10;
    
    // 确保生成的激活码是唯一的
    do {
      code = generateActivationCode();
      attempts++;
    } while (this.codes.has(code) && attempts < maxAttempts);
    
    if (attempts >= maxAttempts) {
      throw new Error('无法生成唯一的激活码，请重试');
    }
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);
    
    const codeData = {
      code,
      createdBy,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      description,
      status: 'active', // active, used, expired
      usedBy: null,
      usedAt: null
    };
    
    this.codes.set(code, codeData);
    await this.saveCodesData();
    
    console.log('🎫 生成新激活码:', code);
    return codeData;
  }

  // 验证激活码
  async validateCode(code) {
    await this.init();
    
    const codeData = this.codes.get(code);
    if (!codeData) {
      return { valid: false, reason: '激活码不存在' };
    }
    
    if (codeData.status === 'used') {
      return { valid: false, reason: '激活码已被使用' };
    }
    
    if (codeData.status === 'expired') {
      return { valid: false, reason: '激活码已过期' };
    }
    
    // 检查是否过期
    const now = new Date();
    const expiresAt = new Date(codeData.expiresAt);
    
    if (now > expiresAt) {
      // 标记为过期
      codeData.status = 'expired';
      this.codes.set(code, codeData);
      await this.saveCodesData();
      
      return { valid: false, reason: '激活码已过期' };
    }
    
    return { valid: true, data: codeData };
  }

  // 使用激活码
  async useCode(code, usedBy) {
    await this.init();
    
    const validation = await this.validateCode(code);
    if (!validation.valid) {
      throw new Error(validation.reason);
    }
    
    const codeData = validation.data;
    codeData.status = 'used';
    codeData.usedBy = usedBy;
    codeData.usedAt = new Date().toISOString();
    
    this.codes.set(code, codeData);
    await this.saveCodesData();
    
    console.log('🎫 激活码已使用:', code, 'by', usedBy);
    return codeData;
  }

  // 获取所有激活码
  async getAllCodes() {
    await this.init();
    
    // 更新过期状态
    const now = new Date();
    let hasChanges = false;
    
    for (const [code, data] of this.codes) {
      if (data.status === 'active' && new Date(data.expiresAt) < now) {
        data.status = 'expired';
        this.codes.set(code, data);
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      await this.saveCodesData();
    }
    
    return Array.from(this.codes.values()).sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  // 删除激活码
  async deleteCode(code) {
    await this.init();
    
    if (!this.codes.has(code)) {
      throw new Error('激活码不存在');
    }
    
    this.codes.delete(code);
    await this.saveCodesData();
    
    console.log('🗑️ 激活码已删除:', code);
    return true;
  }

  // 批量删除过期激活码
  async cleanupExpiredCodes() {
    await this.init();
    
    const now = new Date();
    let deletedCount = 0;
    
    for (const [code, data] of this.codes) {
      if (data.status === 'expired' || new Date(data.expiresAt) < now) {
        this.codes.delete(code);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      await this.saveCodesData();
      console.log('🧹 清理过期激活码:', deletedCount, '个');
    }
    
    return deletedCount;
  }

  // 获取激活码统计信息
  async getStatistics() {
    await this.init();
    
    const codes = await this.getAllCodes();
    
    return {
      total: codes.length,
      active: codes.filter(c => c.status === 'active').length,
      used: codes.filter(c => c.status === 'used').length,
      expired: codes.filter(c => c.status === 'expired').length
    };
  }
}

// 创建全局激活码管理器实例
export const activationCodeManager = new ActivationCodeManager();

// 导出便捷函数
export const createActivationCode = (createdBy, expiresInDays, description) =>
  activationCodeManager.generateCode(createdBy, expiresInDays, description);

export const validateActivationCode = (code) =>
  activationCodeManager.validateCode(code);

export const useActivationCode = (code, usedBy) =>
  activationCodeManager.useCode(code, usedBy);

export const getAllActivationCodes = () =>
  activationCodeManager.getAllCodes();

export const deleteActivationCode = (code) =>
  activationCodeManager.deleteCode(code);

export const cleanupExpiredActivationCodes = () =>
  activationCodeManager.cleanupExpiredCodes();

export const getActivationCodeStatistics = () =>
  activationCodeManager.getStatistics();
