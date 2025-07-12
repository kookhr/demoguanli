import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

const VirtualizedList = ({
  items = [],
  itemHeight = 120,
  containerHeight = 600,
  renderItem,
  overscan = 5,
  className = "",
  onScroll
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: containerHeight });
  const containerRef = useRef(null);
  const scrollElementRef = useRef(null);

  // 计算可见范围
  const visibleRange = useMemo(() => {
    const visibleHeight = containerSize.height;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + visibleHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, containerSize.height, itemHeight, items.length, overscan]);

  // 可见项目
  const visibleItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    const visible = [];
    
    for (let i = startIndex; i <= endIndex; i++) {
      if (items[i]) {
        visible.push({
          index: i,
          item: items[i],
          offsetTop: i * itemHeight
        });
      }
    }
    
    return visible;
  }, [visibleRange, items, itemHeight]);

  // 总高度
  const totalHeight = items.length * itemHeight;

  // 处理滚动
  const handleScroll = useCallback((e) => {
    const newScrollTop = e.target.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  // 监听容器大小变化
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // 滚动到指定项目
  const scrollToItem = useCallback((index, align = 'auto') => {
    if (!scrollElementRef.current) return;

    const itemTop = index * itemHeight;
    const itemBottom = itemTop + itemHeight;
    const containerTop = scrollTop;
    const containerBottom = scrollTop + containerSize.height;

    let newScrollTop = scrollTop;

    if (align === 'start' || (align === 'auto' && itemTop < containerTop)) {
      newScrollTop = itemTop;
    } else if (align === 'end' || (align === 'auto' && itemBottom > containerBottom)) {
      newScrollTop = itemBottom - containerSize.height;
    } else if (align === 'center') {
      newScrollTop = itemTop - (containerSize.height - itemHeight) / 2;
    }

    newScrollTop = Math.max(0, Math.min(newScrollTop, totalHeight - containerSize.height));
    
    scrollElementRef.current.scrollTop = newScrollTop;
  }, [itemHeight, scrollTop, containerSize.height, totalHeight]);

  // 暴露方法给父组件
  React.useImperativeHandle(scrollElementRef, () => ({
    scrollToItem,
    scrollToTop: () => scrollElementRef.current?.scrollTo({ top: 0, behavior: 'smooth' }),
    scrollToBottom: () => scrollElementRef.current?.scrollTo({ 
      top: totalHeight, 
      behavior: 'smooth' 
    })
  }));

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ height: containerHeight }}
    >
      <div
        ref={scrollElementRef}
        className="h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent touch-pan-y"
        onScroll={handleScroll}
        style={{
          WebkitOverflowScrolling: 'touch', // iOS 平滑滚动
          overscrollBehavior: 'contain' // 防止过度滚动
        }}
      >
        {/* 虚拟容器 */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* 可见项目 */}
          {visibleItems.map(({ index, item, offsetTop }) => (
            <div
              key={index}
              style={{
                position: 'absolute',
                top: offsetTop,
                left: 0,
                right: 0,
                height: itemHeight
              }}
            >
              {renderItem({ item, index })}
            </div>
          ))}
        </div>
      </div>

      {/* 滚动指示器 */}
      {items.length > 0 && (
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs sm:text-sm px-2 py-1 rounded pointer-events-none z-10">
          {Math.floor(scrollTop / itemHeight) + 1} / {items.length}
        </div>
      )}
    </div>
  );
};

// 高阶组件：为现有列表添加虚拟滚动
export const withVirtualization = (WrappedComponent, options = {}) => {
  return React.forwardRef((props, ref) => {
    const {
      items = [],
      itemHeight = 120,
      containerHeight = 600,
      threshold = 50, // 超过多少项目时启用虚拟滚动
      ...restProps
    } = props;

    // 如果项目数量少于阈值，使用原组件
    if (items.length < threshold) {
      return <WrappedComponent ref={ref} {...props} />;
    }

    // 使用虚拟滚动
    return (
      <VirtualizedList
        ref={ref}
        items={items}
        itemHeight={itemHeight}
        containerHeight={containerHeight}
        renderItem={({ item, index }) => (
          <WrappedComponent
            key={item.id || index}
            item={item}
            index={index}
            {...restProps}
          />
        )}
        {...options}
      />
    );
  });
};

// Hook：使用虚拟滚动
export const useVirtualization = (items, options = {}) => {
  const {
    itemHeight = 120,
    containerHeight = 600,
    overscan = 5
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    return items.slice(startIndex, endIndex + 1).map((item, i) => ({
      item,
      index: startIndex + i,
      offsetTop: (startIndex + i) * itemHeight
    }));
  }, [visibleRange, items, itemHeight]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    containerRef,
    handleScroll,
    scrollTop
  };
};

export default VirtualizedList;
