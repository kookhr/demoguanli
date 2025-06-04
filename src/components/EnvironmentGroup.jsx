import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Edit2, 
  Trash2, 
  Check, 
  X,
  Folder,
  FolderOpen
} from 'lucide-react';

const EnvironmentGroup = ({ 
  group, 
  isExpanded, 
  onToggle, 
  onRename, 
  onDelete, 
  children,
  environmentCount = 0 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(group?.name || '');

  const handleStartEdit = () => {
    setEditName(group?.name || '');
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editName.trim() && editName !== group?.name) {
      onRename(group.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(group?.name || '');
    setIsEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="mb-6">
      {/* 分组标题 */}
      <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 flex-1">
          {/* 展开/折叠按钮 */}
          <button
            onClick={onToggle}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title={isExpanded ? '折叠分组' : '展开分组'}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          {/* 分组图标 */}
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30">
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            ) : (
              <Folder className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            )}
          </div>

          {/* 分组名称 */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={handleSaveEdit}
                className="w-full px-2 py-1 text-lg font-semibold bg-white dark:bg-gray-700 border border-primary-300 dark:border-primary-600 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-gray-100"
                autoFocus
              />
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {group?.name || '未分组'}
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  {environmentCount} 个环境
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        {group && (
          <div className="flex items-center gap-1">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveEdit}
                  className="p-1.5 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 transition-colors"
                  title="保存"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                  title="取消"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleStartEdit}
                  className="p-1.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                  title="重命名分组"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(group.id)}
                  className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                  title="删除分组"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* 分组内容 */}
      {isExpanded && (
        <div className="animate-slide-up">
          {children}
        </div>
      )}
    </div>
  );
};

export default EnvironmentGroup;
