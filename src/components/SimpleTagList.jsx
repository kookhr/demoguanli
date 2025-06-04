import React from 'react';

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

// 简单标签组件
const SimpleTag = ({ tag, size = 'sm', onClick, className = '' }) => {
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm'
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full border font-medium
        ${getTagColor(tag)}
        ${sizeClasses[size]}
        ${onClick ? 'cursor-pointer hover:opacity-80' : ''}
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
          onClick={onTagClick ? () => onTagClick(tag) : undefined}
        />
      ))}
      
      {hiddenCount > 0 && (
        <span className="text-xs text-gray-500 px-2 py-1 rounded border border-dashed border-gray-300">
          +{hiddenCount}
        </span>
      )}
    </div>
  );
};

export { SimpleTag, SimpleTagList };
export default SimpleTagList;
