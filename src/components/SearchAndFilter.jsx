import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  SortAsc, 
  SortDesc,
  Grid,
  List,
  RefreshCw
} from 'lucide-react';

const SearchAndFilter = ({
  environments = [],
  onFilteredResults,
  onViewModeChange,
  viewMode = 'grid',
  onRefresh,
  isRefreshing = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    status: [],
    type: [],
    network: [],
    tags: []
  });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const searchInputRef = useRef(null);

  // 提取所有可用的筛选选项
  const filterOptions = {
    status: ['online', 'offline', 'warning', 'unknown'],
    type: [...new Set(environments.map(env => env.type).filter(Boolean))],
    network: ['internal', 'external'],
    tags: [...new Set(environments.flatMap(env => env.tags || []))]
  };

  // 筛选和排序逻辑
  useEffect(() => {
    let filtered = environments.filter(env => {
      // 搜索过滤
      const searchMatch = !searchTerm || 
        env.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        env.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        env.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        env.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      // 状态过滤
      const statusMatch = selectedFilters.status.length === 0 || 
        selectedFilters.status.includes(env.status || 'unknown');

      // 类型过滤
      const typeMatch = selectedFilters.type.length === 0 || 
        selectedFilters.type.includes(env.type);

      // 网络过滤
      const networkMatch = selectedFilters.network.length === 0 || 
        selectedFilters.network.includes(env.network);

      // 标签过滤
      const tagMatch = selectedFilters.tags.length === 0 || 
        selectedFilters.tags.some(tag => env.tags?.includes(tag));

      return searchMatch && statusMatch && typeMatch && networkMatch && tagMatch;
    });

    // 排序
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'status':
          aValue = a.status || 'unknown';
          bValue = b.status || 'unknown';
          break;
        case 'type':
          aValue = a.type || '';
          bValue = b.type || '';
          break;
        case 'lastChecked':
          aValue = new Date(a.lastChecked || 0);
          bValue = new Date(b.lastChecked || 0);
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    onFilteredResults(filtered);
  }, [environments, searchTerm, selectedFilters, sortBy, sortOrder, onFilteredResults]);

  // 处理筛选器变化
  const handleFilterChange = (category, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(item => item !== value)
        : [...prev[category], value]
    }));
  };

  // 清除所有筛选器
  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedFilters({
      status: [],
      type: [],
      network: [],
      tags: []
    });
  };

  // 获取活跃筛选器数量
  const getActiveFiltersCount = () => {
    return Object.values(selectedFilters).reduce((count, filters) => count + filters.length, 0);
  };

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setShowFilters(false);
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="space-y-4">
      {/* 搜索栏和工具栏 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* 搜索框 */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="搜索环境名称、URL、描述或标签..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                     placeholder-gray-500 dark:placeholder-gray-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 工具栏 */}
        <div className="flex items-center gap-2">
          {/* 筛选器按钮 */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              showFilters || getActiveFiltersCount() > 0
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>筛选</span>
            {getActiveFiltersCount() > 0 && (
              <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {getActiveFiltersCount()}
              </span>
            )}
          </button>

          {/* 排序 */}
          <div className="relative">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="name-asc">名称 A-Z</option>
              <option value="name-desc">名称 Z-A</option>
              <option value="status-asc">状态 ↑</option>
              <option value="status-desc">状态 ↓</option>
              <option value="type-asc">类型 A-Z</option>
              <option value="lastChecked-desc">最近检查</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* 视图模式切换 */}
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 ${
                viewMode === 'grid'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 ${
                viewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* 刷新按钮 */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 筛选器面板 */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">筛选条件</h3>
            {getActiveFiltersCount() > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                清除全部
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 状态筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                状态
              </label>
              <div className="space-y-2">
                {filterOptions.status.map(status => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedFilters.status.includes(status)}
                      onChange={() => handleFilterChange('status', status)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {status === 'online' ? '在线' : status === 'offline' ? '离线' : status === 'warning' ? '警告' : '未知'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 类型筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                环境类型
              </label>
              <div className="space-y-2">
                {filterOptions.type.map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedFilters.type.includes(type)}
                      onChange={() => handleFilterChange('type', type)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      {type}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 网络类型筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                网络类型
              </label>
              <div className="space-y-2">
                {filterOptions.network.map(network => (
                  <label key={network} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedFilters.network.includes(network)}
                      onChange={() => handleFilterChange('network', network)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      {network === 'internal' ? '内网' : '外网'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 标签筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                标签
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {filterOptions.tags.slice(0, 10).map(tag => (
                  <label key={tag} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedFilters.tags.includes(tag)}
                      onChange={() => handleFilterChange('tags', tag)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400 truncate">
                      {tag}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 活跃筛选器标签 */}
      {getActiveFiltersCount() > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(selectedFilters).map(([category, filters]) =>
            filters.map(filter => (
              <span
                key={`${category}-${filter}`}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm rounded-full"
              >
                {filter}
                <button
                  onClick={() => handleFilterChange(category, filter)}
                  className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAndFilter;
