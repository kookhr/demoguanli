import React from 'react';

// 标签颜色配置 - 支持深色模式
const tagColors = {
  'production': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700',
  'staging': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
  'development': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700',
  'testing': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-700',
  'demo': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700',
  'frontend': 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-700',
  'backend': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700',
  'database': 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600',
  'external': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700',
  'internal': 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-700',
  'stable': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
  'local': 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-600',
  'api': 'bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-700',
  'web': 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-700',
  'mobile': 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700',
  'default': 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
};

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

// 获取标签颜色
const getTagColor = (tag, index = 0) => {
  // 首先尝试根据标签内容匹配
  const contentBasedColor = tagColors[tag.toLowerCase()];
  if (contentBasedColor) {
    return contentBasedColor;
  }

  // 如果没有匹配，根据位置分配颜色
  return colorPalette[index % colorPalette.length] || tagColors.default;
};

// 简单标签组件
const SimpleTag = ({ tag, size = 'sm', onClick, className = '', index = 0 }) => {
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm'
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full border font-medium transition-all duration-200
        ${getTagColor(tag, index)}
        ${sizeClasses[size]}
        ${onClick ? 'cursor-pointer hover:opacity-80 hover:scale-105' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {tag}
    </span>
  );
};

// 标签列表组件
const SimpleTagList = ({ 
  tags = [], 
  maxVisible = 3, 
  size = 'sm',
  onTagClick,
  className = ''
}) => {
  if (!tags || tags.length === 0) {
    return (
      <span className="text-xs text-gray-400 italic">
        无标签
      </span>
    );
  }

  const visibleTags = tags.slice(0, maxVisible);
  const hiddenCount = tags.length - maxVisible;

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      {visibleTags.map((tag, index) => (
        <SimpleTag
          key={`${tag}-${index}`}
          tag={tag}
          size={size}
          index={index}
          onClick={onTagClick ? () => onTagClick(tag) : undefined}
        />
      ))}

      {hiddenCount > 0 && (
        <span className="text-xs text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
          +{hiddenCount}
        </span>
      )}
    </div>
  );
};

export { SimpleTag, SimpleTagList };
export default SimpleTagList;
