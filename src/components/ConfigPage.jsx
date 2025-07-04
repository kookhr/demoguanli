import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import EnvironmentForm from './EnvironmentForm';
import StorageStatus from './StorageStatus';
import ErrorBoundary from './ErrorBoundary';
import {
  getEnvironments,
  addEnvironment,
  updateEnvironment,
  deleteEnvironment,
  exportConfig,
  importConfig
} from '../utils/configManager';

const ConfigPage = () => {
  const [environments, setEnvironments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // 加载环境配置
  useEffect(() => {
    loadEnvironments();
  }, []);

  const loadEnvironments = async () => {
    try {
      const envs = await getEnvironments();
      setEnvironments(envs);
    } catch (error) {
      showMessage('error', '加载环境配置失败: ' + error.message);
    }
  };

  // 显示消息
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // 添加新环境
  const handleAddEnvironment = () => {
    setEditingEnvironment(null);
    setShowForm(true);
  };

  // 编辑环境
  const handleEditEnvironment = (env) => {
    setEditingEnvironment(env);
    setShowForm(true);
  };

  // 保存环境
  const handleSaveEnvironment = async (environmentData) => {
    try {
      let result;
      if (editingEnvironment) {
        result = await updateEnvironment(editingEnvironment.id, environmentData);
      } else {
        result = await addEnvironment(environmentData);
      }

      if (result) {
        await loadEnvironments();
        setShowForm(false);
        setEditingEnvironment(null);
        showMessage('success', editingEnvironment ? '环境更新成功' : '环境添加成功');
      } else {
        throw new Error('保存失败');
      }
    } catch (error) {
      showMessage('error', '保存失败: ' + error.message);
    }
  };

  // 删除环境
  const handleDeleteEnvironment = async (id) => {
    try {
      const result = await deleteEnvironment(id);
      if (result) {
        await loadEnvironments();
        setShowDeleteConfirm(null);
        showMessage('success', '环境删除成功');
      } else {
        throw new Error('删除失败');
      }
    } catch (error) {
      showMessage('error', '删除失败: ' + error.message);
    }
  };

  // 导出配置
  const handleExportConfig = async () => {
    try {
      const config = await exportConfig();
      const blob = new Blob([config], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `environment-config-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showMessage('success', '配置导出成功');
    } catch (error) {
      showMessage('error', '导出失败: ' + error.message);
    }
  };

  // 导入配置
  const handleImportConfig = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const result = await importConfig(e.target.result);
        if (result) {
          await loadEnvironments();
          showMessage('success', '配置导入成功');
        } else {
          showMessage('error', '导入失败：配置文件格式不正确');
        }
      } catch (error) {
        showMessage('error', '导入失败: ' + error.message);
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // 清空文件输入
  };



  // 获取环境类型样式
  const getTypeStyle = (type) => {
    switch (type) {
      case '生产环境':
        return 'badge-primary'; // 蓝色 - 表示重要性和稳定性
      case '预生产环境':
        return 'badge-warning'; // 黄色 - 保持不变
      case '测试环境':
        return 'badge-info'; // 青色 - 区分于生产环境的蓝色
      case '开发环境':
        return 'badge-success'; // 绿色 - 保持不变
      case '演示环境':
        return 'badge-gray'; // 灰色 - 演示环境
      default:
        return 'badge-gray';
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-b border-primary-200 dark:border-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">环境配置管理</h1>
              <p className="text-gray-600 dark:text-gray-400">
                管理和配置所有环境信息
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* 导入配置 */}
              <label className="btn btn-secondary cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                导入配置
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportConfig}
                  className="hidden"
                />
              </label>

              {/* 导出配置 */}
              <button
                onClick={handleExportConfig}
                className="btn btn-secondary"
              >
                <Download className="w-4 h-4 mr-2" />
                导出配置
              </button>

              {/* 添加环境 */}
              <button
                onClick={handleAddEnvironment}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                添加环境
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 消息提示 */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl animate-slide-up transition-colors ${
            message.type === 'success'
              ? 'bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-700 text-success-800 dark:text-success-300'
              : 'bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-700 text-danger-800 dark:text-danger-300'
          }`}>
            <div className="flex items-center">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
              )}
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        )}

        {/* 环境表单 */}
        {showForm && (
          <div className="mb-8">
            <EnvironmentForm
              environment={editingEnvironment}
              onSave={handleSaveEnvironment}
              onCancel={() => {
                setShowForm(false);
                setEditingEnvironment(null);
              }}
              isEdit={!!editingEnvironment}
            />
          </div>
        )}

        {/* 存储状态 */}
        <div className="mb-8">
          <StorageStatus />
        </div>

        {/* 环境列表 */}
        <div className="card animate-fade-in">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              环境列表 ({environments.length})
            </h2>
          </div>
          
          {environments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 text-lg mb-2">暂无环境配置</div>
              <p className="text-gray-500 dark:text-gray-400">点击"添加环境"开始配置</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      环境信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      类型/网络
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      URL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      状态/版本
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      服务数量
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {environments.map((env) => (
                    <tr key={env.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {env.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {env.id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className={`badge ${getTypeStyle(env.type)}`}>
                            {env.type}
                          </span>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {env.network === 'internal' ? '内网' : '外网'} (标签)
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300">
                          <a href={env.url} target="_blank" rel="noopener noreferrer">
                            {env.url}
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {env.status === 'online' ? '在线' :
                             env.status === 'offline' ? '离线' : '维护中'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                            {env.version}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {env.services?.length || 0} 个服务
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditEnvironment(env)}
                            className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 p-1 rounded transition-colors"
                            title="编辑"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(env.id)}
                            className="text-danger-600 dark:text-danger-400 hover:text-danger-900 dark:hover:text-danger-300 p-1 rounded transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl animate-bounce-in transition-colors">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-danger-100 dark:bg-danger-900/20 rounded-full flex items-center justify-center mr-4">
                <AlertTriangle className="w-6 h-6 text-danger-600 dark:text-danger-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">确认删除</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              确定要删除这个环境配置吗？此操作不可撤销。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="btn btn-secondary"
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteEnvironment(showDeleteConfirm)}
                className="btn btn-danger"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
};

export default ConfigPage;
