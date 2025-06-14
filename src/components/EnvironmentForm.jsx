import React, { useState, useEffect } from 'react';
import { Save, X, AlertCircle } from 'lucide-react';
import { TagEditor } from './SimpleTagList';
import ServiceForm from './ServiceForm';
import { validateEnvironment } from '../utils/configManager';

const EnvironmentForm = ({ environment, onSave, onCancel, isEdit = false }) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    type: '开发环境',
    network: 'internal',
    url: '',
    version: '',
    description: '',
    status: 'online',
    tags: [],
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
    { value: '开发环境', label: '开发环境', color: 'text-green-600' },
    { value: '测试环境', label: '测试环境', color: 'text-blue-600' },
    { value: '预生产环境', label: '预生产环境', color: 'text-orange-600' },
    { value: '生产环境', label: '生产环境', color: 'text-red-600' },
    { value: '演示环境', label: '演示环境', color: 'text-gray-600' }
  ];

  const networkTypes = [
    { value: 'internal', label: '内网 (分类标签)' },
    { value: 'external', label: '外网 (分类标签)' }
  ];



  return (
    <div className="card animate-slide-up">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {isEdit ? '编辑环境' : '添加新环境'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* 错误提示 */}
        {errors.length > 0 && (
          <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-700 rounded-xl p-4 animate-slide-up transition-colors">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-danger-400 dark:text-danger-400 flex-shrink-0" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-danger-800 dark:text-danger-300">
                  请修正以下错误：
                </h3>
                <ul className="mt-2 text-sm text-danger-700 dark:text-danger-300 list-disc list-inside">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              环境ID *
            </label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => handleChange('id', e.target.value)}
              placeholder="例如: dev, test, prod"
              disabled={isEdit}
              className="input-field disabled:bg-gray-100 dark:disabled:bg-gray-700"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {isEdit ? '环境ID不可修改' : '唯一标识符，只能包含字母、数字、下划线'}
            </p>
          </div>

          {/* 环境名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              网络类型 * <span className="text-xs text-gray-500">(仅作分类标签)</span>
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
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              网络类型仅用于分类和视觉识别，不影响实际检测功能
            </p>
          </div>

          {/* 主要URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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



          {/* 版本号 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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

        {/* 标签管理 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            环境标签
          </label>
          <TagEditor
            tags={formData.tags || []}
            onChange={(tags) => handleChange('tags', tags)}
            suggestions={[
              'SaaS', '私有化', 'CMDB', 'DOOP', 'TSB', '日志', '监控', '告警',
              '关键', '重要', '可选'
            ]}
            placeholder="添加标签，用于分类和筛选..."
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            标签用于分类和快速筛选环境，支持自定义标签
          </p>
        </div>

        {/* 服务配置 */}
        <ServiceForm
          services={formData.services}
          onChange={handleServicesChange}
        />

        {/* 操作按钮 */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
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
