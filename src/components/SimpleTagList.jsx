import React, { useState, memo, useMemo } from 'react';
import { Tag, Plus, X } from 'lucide-react';
import { getTagColor } from '../utils/common';
// 预定义颜色数组，用于基于位置分配颜色
const colorPalette = [
  'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700',
  'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700',
  'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700',
  'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-700',
  'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700',
  'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-700',
  'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700',
  'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-700',
  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
  'bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-700',
  'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-700',
  'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700'
];

// 获取标签颜色（增强版，支持位置分配）
const getTagColorWithIndex = (tag, index = 0) => {
  // 首先尝试根据标签内容匹配
  const contentBasedColor = getTagColor(tag);
  if (contentBasedColor !== 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600') {
    return contentBasedColor;
  }

  // 如果没有匹配，根据位置分配颜色
  return colorPalette[index % colorPalette.length] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
};

// 简单标签组件
const SimpleTag = ({ tag, size = 'sm', onClick, className = '', index = 0, removable = false, onRemove }) => {
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm'
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full border font-medium transition-all duration-200
        ${getTagColorWithIndex(tag, index)}
        ${sizeClasses[size]}
        ${onClick ? 'cursor-pointer hover:opacity-80 hover:scale-105' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <Tag className="w-3 h-3 mr-1" />
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
const SimpleTagList = ({
  tags = [],
  maxVisible = 3,
  size = 'sm',
  onTagClick,
  className = '',
  removable = false,
  onRemove,
  expandable = false
}) => {
  if (!tags || tags.length === 0) {
    return (
      <span className="text-xs text-gray-400 italic">
        无标签
      </span>
    );
  }

  const [showAll, setShowAll] = useState(false);
  const visibleTags = (expandable && showAll) ? tags : tags.slice(0, maxVisible);
  const hiddenCount = tags.length - maxVisible;

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      {visibleTags.map((tag, index) => (
        <SimpleTag
          key={`${tag}-${index}`}
          tag={tag}
          size={size}
          index={index}
          removable={removable}
          onRemove={onRemove}
          onClick={onTagClick ? () => onTagClick(tag) : undefined}
        />
      ))}

      {expandable && !showAll && hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-1.5 py-0.5 rounded border border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          +{hiddenCount} 更多
        </button>
      )}

      {expandable && showAll && hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(false)}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-1.5 py-0.5 rounded border border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          收起
        </button>
      )}

      {!expandable && hiddenCount > 0 && (
        <span className="text-xs text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
          +{hiddenCount}
        </span>
      )}
    </div>
  );
};

// 标签编辑器组件
const TagEditor = ({
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
      e.stopPropagation();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 bg-white dark:bg-gray-800">
        {/* 已有标签 */}
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag, index) => (
            <SimpleTag
              key={`${tag}-${index}`}
              tag={tag}
              size="sm"
              index={index}
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
              setTimeout(() => setIsEditing(false), 200);
            }}
            placeholder={placeholder}
            className="flex-1 outline-none text-sm bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />

          {inputValue && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addTag(inputValue);
              }}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 搜索建议 */}
      {isEditing && inputValue && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <div className="p-2 max-h-32 overflow-y-auto">
            {filteredSuggestions.slice(0, 5).map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addTag(suggestion);
                }}
                className="w-full text-left text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded border text-gray-700 dark:text-gray-300 mb-1 last:mb-0"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 常用标签建议 */}
      {isEditing && !inputValue && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">常用标签</span>
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
                      addTag(suggestion);
                    }}
                    className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded border text-gray-700 dark:text-gray-300"
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

// 使用memo优化组件
const MemoizedSimpleTag = memo(SimpleTag);
const MemoizedSimpleTagList = memo(SimpleTagList);
const MemoizedTagEditor = memo(TagEditor);

export { MemoizedSimpleTag as SimpleTag, MemoizedSimpleTagList as SimpleTagList, MemoizedTagEditor as TagEditor };
export default MemoizedSimpleTagList;
