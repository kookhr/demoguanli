import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Tag } from 'lucide-react';

const EnvironmentFilter = ({ 
  environments, 
  onFilterChange, 
  className = '' 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // 获取所有可用的选项
  const types = [...new Set(environments.map(env => env.type))];
  const statuses = [...new Set(environments.map(env => env.status))];
  const networks = [...new Set(environments.map(env => env.network))];
  const allTags = [...new Set(environments.flatMap(env => env.tags || []))];

  // 过滤逻辑
  useEffect(() => {
    const filtered = environments.filter(env => {
      const matchesSearch = !searchTerm ||
        env.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        env.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        env.url.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = !selectedType || env.type === selectedType;
      const matchesStatus = !selectedStatus || env.status === selectedStatus;
      const matchesNetwork = !selectedNetwork || env.network === selectedNetwork;

      const matchesTags = selectedTags.length === 0 ||
        selectedTags.every(tag => env.tags?.includes(tag));

      return matchesSearch && matchesType && matchesStatus && matchesNetwork && matchesTags;
    });

    onFilterChange(filtered);
  }, [searchTerm, selectedType, selectedStatus, selectedNetwork, selectedTags, environments]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedStatus('');
    setSelectedNetwork('');
    setSelectedTags([]);
  };

  const hasActiveFilters = searchTerm || selectedType || selectedStatus || selectedNetwork || selectedTags.length > 0;

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const removeTag = (tag) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

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
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
        >
          <Filter className="w-4 h-4" />
          筛选
          {hasActiveFilters && (
            <span className="bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {[selectedType, selectedStatus, selectedNetwork, ...selectedTags].filter(Boolean).length}
            </span>
          )}
        </button>

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
      {showFilters && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {/* 网络筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                网络类型
              </label>
              <select
                value={selectedNetwork}
                onChange={(e) => setSelectedNetwork(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">所有网络</option>
                {networks.map(network => (
                  <option key={network} value={network}>
                    {network === 'internal' ? '内网' : 
                     network === 'external' ? '外网' : network}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 标签筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标签筛选
            </label>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-primary-100 border-primary-300 text-primary-800'
                      : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 已选标签 */}
          {selectedTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                已选标签
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 border border-primary-300 text-primary-800 rounded-full text-sm"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-primary-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
                  const matchesNetwork = !selectedNetwork || env.network === selectedNetwork;
                  const matchesTags = selectedTags.length === 0 || 
                    selectedTags.every(tag => env.tags?.includes(tag));
                  return matchesSearch && matchesType && matchesStatus && matchesNetwork && matchesTags;
                }).length}
              </span> 个
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default EnvironmentFilter;
