import React, { useState, useEffect } from 'react';
import { Save, X, AlertCircle } from 'lucide-react';
import ServiceForm from './ServiceForm';
import { validateEnvironment } from '../utils/configManager';

const EnvironmentForm = ({ environment, onSave, onCancel, isEdit = false }) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    type: 'development',
    network: 'internal',
    url: '',
    status: 'online',
    version: '',
    description: '',
    services: []
  });
  const [errors, setErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 初始化表单数据
  useEffect(() => {
    if (environment) {
      setFormData(environment);
    }
  }, [environment]);

  // 处理表单字段变化
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // 清除相关错误
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  // 处理服务列表变化
  const handleServicesChange = (services) => {
    setFormData(prev => ({
      ...prev,
      services
    }));
  };

  // 提交表单
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 验证表单
    const validationErrors = validateEnvironment(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      await onSave(formData);
    } catch (error) {
      setErrors(['保存失败: ' + error.message]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const environmentTypes = [
    { value: 'development', label: '开发环境', color: 'text-green-600' },
    { value: 'testing', label: '测试环境', color: 'text-blue-600' },
    { value: 'staging', label: '预生产环境', color: 'text-orange-600' },
    { value: 'production', label: '生产环境', color: 'text-red-600' },
    { value: 'demo', label: '演示环境', color: 'text-gray-600' }
  ];

  const networkTypes = [
    { value: 'internal', label: '内网环境' },
    { value: 'external', label: '外网环境' }
  ];

  const statusTypes = [
    { value: 'online', label: '在线' },
    { value: 'offline', label: '离线' },
    { value: 'maintenance', label: '维护中' }
  ];

  return (
    <div className="card animate-slide-up">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
        <h2 className="text-xl font-semibold text-gray-900">
          {isEdit ? '编辑环境' : '添加新环境'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* 错误提示 */}
        {errors.length > 0 && (
          <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 animate-slide-up">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-danger-400 flex-shrink-0" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-danger-800">
                  请修正以下错误：
                </h3>
                <ul className="mt-2 text-sm text-danger-700 list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 基本信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 环境ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              环境ID *
            </label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => handleChange('id', e.target.value)}
              placeholder="例如: dev, test, prod"
              disabled={isEdit}
              className="input-field disabled:bg-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              {isEdit ? '环境ID不可修改' : '唯一标识符，只能包含字母、数字、下划线'}
            </p>
          </div>

          {/* 环境名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              环境名称 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="例如: 开发环境"
              className="input-field"
            />
          </div>

          {/* 环境类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              环境类型 *
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="input-field"
            >
              {environmentTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* 网络类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              网络类型 *
            </label>
            <select
              value={formData.network}
              onChange={(e) => handleChange('network', e.target.value)}
              className="input-field"
            >
              {networkTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* 主要URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              主要URL *
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => handleChange('url', e.target.value)}
              placeholder="https://example.com"
              className="input-field"
            />
          </div>

          {/* 环境状态 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              环境状态
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="input-field"
            >
              {statusTypes.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* 版本号 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              版本号
            </label>
            <input
              type="text"
              value={formData.version}
              onChange={(e) => handleChange('version', e.target.value)}
              placeholder="例如: v1.0.0"
              className="input-field"
            />
          </div>
        </div>

        {/* 环境描述 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            环境描述
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="描述这个环境的用途和特点..."
            rows={3}
            className="input-field resize-none"
          />
        </div>

        {/* 服务配置 */}
        <ServiceForm
          services={formData.services}
          onChange={handleServicesChange}
        />

        {/* 操作按钮 */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
          >
            <X className="w-4 h-4 mr-2" />
            取消
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EnvironmentForm;
