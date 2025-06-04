import { useState, useEffect } from 'react';

const DARK_MODE_KEY = 'darkMode';

export const useDarkMode = () => {
  // 初始化深色模式状态
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // 优先级：localStorage > 系统偏好 > 默认浅色
    const stored = localStorage.getItem(DARK_MODE_KEY);
    if (stored !== null) {
      return JSON.parse(stored);
    }
    
    // 检查系统偏好
    if (window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    return false;
  });

  // 切换深色模式
  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem(DARK_MODE_KEY, JSON.stringify(newMode));
      return newMode;
    });
  };

  // 设置深色模式
  const setDarkMode = (enabled) => {
    setIsDarkMode(enabled);
    localStorage.setItem(DARK_MODE_KEY, JSON.stringify(enabled));
  };

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // 只有在用户没有手动设置过时才跟随系统
      const stored = localStorage.getItem(DARK_MODE_KEY);
      if (stored === null) {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // 应用深色模式到 document
  useEffect(() => {
    const root = document.documentElement;
    
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // 更新 meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDarkMode ? '#1f2937' : '#ffffff');
    }
  }, [isDarkMode]);

  return {
    isDarkMode,
    toggleDarkMode,
    setDarkMode
  };
};
