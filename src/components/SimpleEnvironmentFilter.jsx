import React, { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';

const SimpleEnvironmentFilter = ({ 
  environments, 
  onFilterChange, 
  className = '' 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // 获取所有可用的选项
  const types = [...new Set(environments.map(env => env.type))];
  const statuses = [...new Set(environments.map(env => env.status))];

  // 过滤逻辑 - 移除 onFilterChange 依赖避免无限循环
  useEffect(() => {
    console.log('🔍 执行过滤逻辑...');
    
    const filtered = environments.filter(env => {
      const matchesSearch = !searchTerm || 
        env.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        env.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        env.url.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = !selectedType || env.type === selectedType;
      const matchesStatus = !selectedStatus || env.status === selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
    });

    console.log('🔍 过滤结果:', filtered.length, '个环境');
    onFilterChange(filtered);
  }, [searchTerm, selectedType, selectedStatus, environments]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedStatus('');
  };

  const hasActiveFilters = searchTerm || selectedType || selectedStatus;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* 搜索栏 */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="搜索环境名称、描述或URL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="btn btn-secondary flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            清除
          </button>
        )}
      </div>

      {/* 筛选器 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 类型筛选 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            环境类型
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">所有类型</option>
            {types.map(type => (
              <option key={type} value={type}>
                {type === 'production' ? '生产环境' :
                 type === 'staging' ? '预生产' :
                 type === 'development' ? '开发环境' :
                 type === 'testing' ? '测试环境' :
                 type === 'demo' ? '演示环境' : type}
              </option>
            ))}
          </select>
        </div>

        {/* 状态筛选 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            运行状态
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">所有状态</option>
            {statuses.map(status => (
              <option key={status} value={status}>
                {status === 'online' ? '在线' :
                 status === 'offline' ? '离线' :
                 status === 'maintenance' ? '维护中' :
                 status === 'error' ? '错误' :
                 status === 'timeout' ? '超时' : status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 结果统计 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          显示 <span className="font-medium text-gray-900">{environments.length}</span> 个环境
          {hasActiveFilters && (
            <span>
              ，筛选后 <span className="font-medium text-primary-600">
                {environments.filter(env => {
                  const matchesSearch = !searchTerm || 
                    env.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    env.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    env.url.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesType = !selectedType || env.type === selectedType;
                  const matchesStatus = !selectedStatus || env.status === selectedStatus;
                  return matchesSearch && matchesType && matchesStatus;
                }).length}
              </span> 个
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default SimpleEnvironmentFilter;
