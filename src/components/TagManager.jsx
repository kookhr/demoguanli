import React, { useState } from 'react';
import { Tag, Plus, X, Edit3, Check } from 'lucide-react';

// 标签颜色配置
const tagColors = {
  'production': 'bg-blue-100 text-blue-800 border-blue-200', // 蓝色 - 生产环境
  'staging': 'bg-yellow-100 text-yellow-800 border-yellow-200', // 黄色 - 预生产环境
  'development': 'bg-green-100 text-green-800 border-green-200', // 绿色 - 开发环境
  'testing': 'bg-cyan-100 text-cyan-800 border-cyan-200', // 青色 - 测试环境
  'demo': 'bg-purple-100 text-purple-800 border-purple-200',
  'frontend': 'bg-pink-100 text-pink-800 border-pink-200',
  'backend': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'database': 'bg-gray-100 text-gray-800 border-gray-200',
  'external': 'bg-orange-100 text-orange-800 border-orange-200',
  'internal': 'bg-teal-100 text-teal-800 border-teal-200',
  'stable': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'local': 'bg-slate-100 text-slate-800 border-slate-200',
  'default': 'bg-gray-100 text-gray-700 border-gray-200'
};

// 获取标签颜色
const getTagColor = (tag) => {
  return tagColors[tag.toLowerCase()] || tagColors.default;
};

// 单个标签组件
export const TagBadge = ({ 
  tag, 
  size = 'sm', 
  removable = false, 
  onRemove,
  onClick,
  className = ''
}) => {
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-3 py-2 text-sm'
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full border font-medium
        ${getTagColor(tag)}
        ${sizeClasses[size]}
        ${onClick ? 'cursor-pointer hover:opacity-80' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <Tag className="w-3 h-3" />
      {tag}
      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(tag);
          }}
          className="ml-1 hover:text-red-600 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};

// 标签列表组件
export const TagList = ({ 
  tags = [], 
  maxVisible = 3, 
  size = 'sm',
  removable = false,
  onRemove,
  onTagClick,
  className = ''
}) => {
  const [showAll, setShowAll] = useState(false);
  
  if (!tags || tags.length === 0) {
    return (
      <span className="text-xs text-gray-400 italic">
        无标签
      </span>
    );
  }

  const visibleTags = showAll ? tags : tags.slice(0, maxVisible);
  const hiddenCount = tags.length - maxVisible;

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      {visibleTags.map((tag, index) => (
        <TagBadge
          key={`${tag}-${index}`}
          tag={tag}
          size={size}
          removable={removable}
          onRemove={onRemove}
          onClick={onTagClick ? () => onTagClick(tag) : undefined}
        />
      ))}
      
      {!showAll && hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-dashed border-gray-300 hover:border-gray-400"
        >
          +{hiddenCount} 更多
        </button>
      )}
      
      {showAll && hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(false)}
          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-dashed border-gray-300 hover:border-gray-400"
        >
          收起
        </button>
      )}
    </div>
  );
};

// 标签编辑器组件
export const TagEditor = ({ 
  tags = [], 
  onChange, 
  suggestions = [],
  placeholder = "添加标签...",
  className = ''
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    // 过滤建议
    if (value.trim()) {
      const filtered = suggestions.filter(suggestion => 
        suggestion.toLowerCase().includes(value.toLowerCase()) &&
        !tags.includes(suggestion)
      );
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions([]);
    }
  };

  const addTag = (tag) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onChange([...tags, trimmedTag]);
    }
    setInputValue('');
    setFilteredSuggestions([]);
  };

  const removeTag = (tagToRemove) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      e.stopPropagation(); // 阻止事件冒泡，防止触发表单提交
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    addTag(suggestion);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="border border-gray-300 rounded-lg p-3 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500">
        {/* 已有标签 */}
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag, index) => (
            <TagBadge
              key={`${tag}-${index}`}
              tag={tag}
              size="sm"
              removable
              onRemove={removeTag}
            />
          ))}
        </div>

        {/* 输入框 */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsEditing(true)}
            onBlur={() => {
              // 延迟关闭以允许点击建议
              setTimeout(() => setIsEditing(false), 200);
            }}
            placeholder={placeholder}
            className="flex-1 outline-none text-sm"
          />
          
          {inputValue && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addTag(inputValue);
              }}
              className="text-primary-600 hover:text-primary-800"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 建议列表 */}
      {isEditing && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSuggestionClick(suggestion);
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <Tag className="w-3 h-3 text-gray-400" />
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* 常用标签建议 */}
      {isEditing && !inputValue && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <span className="text-xs text-gray-500 font-medium">常用标签</span>
          </div>
          <div className="p-2 max-h-32 overflow-y-auto">
            <div className="flex flex-wrap gap-1">
              {suggestions
                .filter(suggestion => !tags.includes(suggestion))
                .slice(0, 10)
                .map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSuggestionClick(suggestion);
                    }}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded border text-gray-700"
                  >
                    {suggestion}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagEditor;
