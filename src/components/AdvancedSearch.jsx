import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, X, ChevronDown, Tag, Globe, Shield, CheckCircle, XCircle, Clock } from 'lucide-react';
import { debounce } from '../utils/common';

const AdvancedSearch = ({ 
  environments = [], 
  onFilteredResults, 
  className = "" 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    status: [],
    network: [],
    tags: [],
    hasServices: null
  });
  const [searchHistory, setSearchHistory] = useState([]);

  // 从localStorage加载搜索历史
  useEffect(() => {
    const saved = localStorage.getItem('env-search-history');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (error) {
        console.warn('Failed to load search history:', error);
      }
    }
  }, []);

  // 保存搜索历史
  const saveSearchHistory = useCallback((term) => {
    if (!term.trim() || searchHistory.includes(term)) return;
    
    const newHistory = [term, ...searchHistory.slice(0, 4)]; // 保留最近5个
    setSearchHistory(newHistory);
    localStorage.setItem('env-search-history', JSON.stringify(newHistory));
  }, [searchHistory]);

  // 防抖搜索
  const debouncedSearch = useCallback(
    debounce((term, filters) => {
      const filtered = filterEnvironments(term, filters);
      onFilteredResults(filtered);
      
      if (term.trim()) {
        saveSearchHistory(term.trim());
      }
    }, 300),
    [environments, saveSearchHistory, onFilteredResults]
  );

  // 搜索和过滤逻辑
  const filterEnvironments = useCallback((term, filters) => {
    return environments.filter(env => {
      // 文本搜索
      const searchMatch = !term || 
        env.name.toLowerCase().includes(term.toLowerCase()) ||
        env.url.toLowerCase().includes(term.toLowerCase()) ||
        env.description?.toLowerCase().includes(term.toLowerCase()) ||
        env.tags?.some(tag => tag.toLowerCase().includes(term.toLowerCase()));

      if (!searchMatch) return false;

      // 状态过滤
      if (filters.status.length > 0) {
        const envStatus = getEnvironmentStatus(env.id);
        if (!filters.status.includes(envStatus)) return false;
      }

      // 网络类型过滤
      if (filters.network.length > 0 && !filters.network.includes(env.network)) {
        return false;
      }

      // 标签过滤
      if (filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => 
          env.tags?.includes(tag)
        );
        if (!hasMatchingTag) return false;
      }

      // 服务过滤
      if (filters.hasServices !== null) {
        const hasServices = env.services && env.services.length > 0;
        if (filters.hasServices !== hasServices) return false;
      }

      return true;
    });
  }, [environments]);

  // 获取环境状态（简化版）
  const getEnvironmentStatus = useCallback((envId) => {
    // 这里应该从状态管理中获取，暂时返回默认值
    return 'unknown';
  }, []);

  // 执行搜索
  useEffect(() => {
    debouncedSearch(searchTerm, activeFilters);
  }, [searchTerm, activeFilters, debouncedSearch]);

  // 获取所有可用的标签
  const availableTags = useMemo(() => {
    const tags = new Set();
    environments.forEach(env => {
      if (env.tags) {
        env.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [environments]);

  // 切换过滤器
  const toggleFilter = (category, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(item => item !== value)
        : [...prev[category], value]
    }));
  };

  // 清除所有过滤器
  const clearFilters = () => {
    setSearchTerm('');
    setActiveFilters({
      status: [],
      network: [],
      tags: [],
      hasServices: null
    });
  };

  // 活跃过滤器数量
  const activeFilterCount = useMemo(() => {
    return activeFilters.status.length + 
           activeFilters.network.length + 
           activeFilters.tags.length + 
           (activeFilters.hasServices !== null ? 1 : 0);
  }, [activeFilters]);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* 搜索栏 */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索环境名称、URL、描述或标签..."
            className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     placeholder-gray-500 dark:placeholder-gray-400"
          />
          
          {/* 过滤器按钮 */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-md transition-colors
                      ${showFilters || activeFilterCount > 0 
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            <Filter className="w-5 h-5" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* 搜索历史 */}
        {searchHistory.length > 0 && searchTerm === '' && (
          <div className="mt-3">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">最近搜索</div>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((term, index) => (
                <button
                  key={index}
                  onClick={() => setSearchTerm(term)}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                           rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 过滤器面板 */}
      {showFilters && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
          {/* 状态过滤 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              状态
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'online', label: '在线', icon: CheckCircle, color: 'text-green-600' },
                { value: 'offline', label: '离线', icon: XCircle, color: 'text-red-600' },
                { value: 'unknown', label: '未知', icon: Clock, color: 'text-gray-600' }
              ].map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => toggleFilter('status', value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors
                            ${activeFilters.status.includes(value)
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                              : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                            }`}
                >
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 网络类型过滤 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              网络类型
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'internal', label: '内网', icon: Shield },
                { value: 'external', label: '外网', icon: Globe }
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => toggleFilter('network', value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors
                            ${activeFilters.network.includes(value)
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                              : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                            }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 标签过滤 */}
          {availableTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                标签
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleFilter('tags', tag)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors
                              ${activeFilters.tags.includes(tag)
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                                : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                              }`}
                  >
                    <Tag className="w-4 h-4" />
                    <span className="text-sm">{tag}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 清除过滤器 */}
          {activeFilterCount > 0 && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 
                         hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
                清除所有过滤器
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
