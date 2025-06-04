import React, { useState, useEffect } from 'react';
import { X, Plus, Folder, Users, Edit2, Trash2 } from 'lucide-react';

const GroupManagementModal = ({ 
  isOpen, 
  onClose, 
  groups = [], 
  environments = [],
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onAssignEnvironment
}) => {
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedEnvironments, setSelectedEnvironments] = useState({});

  useEffect(() => {
    if (isOpen) {
      // 初始化选中状态
      const initialSelection = {};
      environments.forEach(env => {
        initialSelection[env.id] = env.groupId || '';
      });
      setSelectedEnvironments(initialSelection);
    }
  }, [isOpen, environments]);

  const handleCreateGroup = async () => {
    if (newGroupName.trim()) {
      await onCreateGroup(newGroupName.trim());
      setNewGroupName('');
    }
  };

  const handleAssignEnvironment = async (environmentId, groupId) => {
    setSelectedEnvironments(prev => ({
      ...prev,
      [environmentId]: groupId
    }));
    await onAssignEnvironment(environmentId, groupId || null);
  };

  const getGroupEnvironmentCount = (groupId) => {
    return environments.filter(env => env.groupId === groupId).length;
  };

  const getUngroupedCount = () => {
    return environments.filter(env => !env.groupId).length;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Folder className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              分组管理
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧：分组列表 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                分组列表
              </h3>

              {/* 创建新分组 */}
              <div className="mb-4 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="输入分组名称"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
                  />
                  <button
                    onClick={handleCreateGroup}
                    disabled={!newGroupName.trim()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    创建
                  </button>
                </div>
              </div>

              {/* 分组列表 */}
              <div className="space-y-2">
                {groups.map(group => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Folder className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {group.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                        {getGroupEnvironmentCount(group.id)} 个环境
                      </span>
                    </div>
                    <button
                      onClick={() => onDeleteGroup(group.id)}
                      className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                      title="删除分组"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* 未分组 */}
                <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-600 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      未分组
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                      {getUngroupedCount()} 个环境
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧：环境分配 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                环境分配
              </h3>

              <div className="space-y-3">
                {environments.map(env => (
                  <div
                    key={env.id}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {env.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {env.type}
                      </div>
                    </div>
                    <select
                      value={selectedEnvironments[env.id] || ''}
                      onChange={(e) => handleAssignEnvironment(env.id, e.target.value)}
                      className="ml-3 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">未分组</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupManagementModal;
