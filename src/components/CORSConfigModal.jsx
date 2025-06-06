import React, { useState, useEffect } from 'react';
import { X, Shield, Info, RotateCcw, Save, AlertTriangle } from 'lucide-react';
import {
  getCORSBypassConfig,
  saveCORSBypassConfig,
  resetCORSBypassConfig,
  getStrategyDescription,
  validateCORSConfig,
  DEFAULT_CORS_CONFIG
} from '../utils/corsConfig';

const CORSConfigModal = ({ isOpen, onClose, onSave }) => {
  const [config, setConfig] = useState(DEFAULT_CORS_CONFIG);
  const [errors, setErrors] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // 加载配置
  useEffect(() => {
    if (isOpen) {
      const currentConfig = getCORSBypassConfig();
      setConfig(currentConfig);
      setErrors([]);
    }
  }, [isOpen]);

  // 处理配置变更
  const handleConfigChange = (path, value) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      const keys = path.split('.');
      let current = newConfig;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
  };

  // 保存配置
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const validation = validateCORSConfig(config);
      
      if (!validation.isValid) {
        setErrors(validation.errors);
        return;
      }
      
      const success = saveCORSBypassConfig(config);
      
      if (success) {
        onSave && onSave(config);
        onClose();
      } else {
        setErrors(['保存配置失败，请重试']);
      }
    } catch (error) {
      setErrors([`保存失败: ${error.message}`]);
    } finally {
      setIsSaving(false);
    }
  };

  // 重置配置
  const handleReset = () => {
    setConfig(DEFAULT_CORS_CONFIG);
    setErrors([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              CORS 规避配置
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* 错误提示 */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-700 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-danger-600 dark:text-danger-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-danger-600 dark:text-danger-400 mb-2">
                    配置错误
                  </h3>
                  <ul className="text-sm text-danger-600 dark:text-danger-400 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 全局设置 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              全局设置
            </h3>
            
            <div className="space-y-4">
              {/* 启用 CORS 规避 */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    启用 CORS 规避
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    关闭后将只使用标准 CORS 请求
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => handleConfigChange('enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>

              {/* 全局超时 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  全局超时时间 (毫秒)
                </label>
                <input
                  type="number"
                  min="1000"
                  max="60000"
                  step="1000"
                  value={config.globalTimeout}
                  onChange={(e) => handleConfigChange('globalTimeout', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* 策略配置 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              检测策略配置
            </h3>
            
            <div className="space-y-6">
              {config.strategyPriority.map((strategyName, index) => (
                <div key={strategyName} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {index + 1}. {strategyName}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.strategies[strategyName]?.enabled || false}
                            onChange={(e) => handleConfigChange(`strategies.${strategyName}.enabled`, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {getStrategyDescription(strategyName)}
                      </p>
                    </div>
                  </div>

                  {/* 策略特定配置 */}
                  {config.strategies[strategyName]?.enabled && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-600">
                      {strategyName === 'standard-cors' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            超时时间 (毫秒)
                          </label>
                          <input
                            type="number"
                            min="1000"
                            max="30000"
                            step="1000"
                            value={config.strategies[strategyName].timeout || 8000}
                            onChange={(e) => handleConfigChange(`strategies.${strategyName}.timeout`, parseInt(e.target.value))}
                            className="w-32 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                      )}
                      
                      {strategyName === 'multi-port' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            最大端口测试数量
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={config.strategies[strategyName].maxPorts || 3}
                            onChange={(e) => handleConfigChange(`strategies.${strategyName}.maxPorts`, parseInt(e.target.value))}
                            className="w-20 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 说明信息 */}
          <div className="bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-info-600 dark:text-info-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-info-600 dark:text-info-400">
                <p className="font-medium mb-2">CORS 规避说明：</p>
                <ul className="space-y-1 text-xs">
                  <li>• 策略按优先级顺序执行，成功后停止</li>
                  <li>• no-cors 模式无法获取具体状态码，但能检测服务可达性</li>
                  <li>• 图片探测适用于有静态资源的服务</li>
                  <li>• 多端口探测适用于端口不确定的情况</li>
                  <li>• 配置会自动保存到本地存储</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            重置默认
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? '保存中...' : '保存配置'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CORSConfigModal;
