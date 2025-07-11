import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';

const DarkModeToggle = ({ className = '', showLabel = false, variant = 'button' }) => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <select
          value={isDarkMode ? 'dark' : 'light'}
          onChange={(e) => {
            if (e.target.value === 'dark') {
              if (!isDarkMode) toggleDarkMode();
            } else {
              if (isDarkMode) toggleDarkMode();
            }
          }}
          className="appearance-none bg-transparent text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1 pr-8 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-200"
        >
          <option value="light">浅色</option>
          <option value="dark">深色</option>
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          {isDarkMode ? (
            <Moon className="w-4 h-4 text-gray-500" />
          ) : (
            <Sun className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={toggleDarkMode}
      className={`
        flex items-center gap-2 p-2 rounded-lg transition-all duration-200
        hover:bg-gray-100 dark:hover:bg-gray-700
        focus:outline-none focus:ring-2 focus:ring-primary-500
        ${className}
      `}
      title={isDarkMode ? '切换到浅色模式' : '切换到深色模式'}
      aria-label={isDarkMode ? '切换到浅色模式' : '切换到深色模式'}
    >
      <div className="relative w-5 h-5">
        {/* 太阳图标 */}
        <Sun 
          className={`
            absolute inset-0 w-5 h-5 transition-all duration-300 transform
            ${isDarkMode 
              ? 'opacity-0 rotate-90 scale-0' 
              : 'opacity-100 rotate-0 scale-100'
            }
            text-yellow-500
          `}
        />
        
        {/* 月亮图标 */}
        <Moon 
          className={`
            absolute inset-0 w-5 h-5 transition-all duration-300 transform
            ${isDarkMode 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 -rotate-90 scale-0'
            }
            text-blue-400
          `}
        />
      </div>
      
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isDarkMode ? '深色模式' : '浅色模式'}
        </span>
      )}
    </button>
  );
};

// 高级三态切换组件（浅色/深色/跟随系统）
export const AdvancedDarkModeToggle = ({ className = '' }) => {
  const { setDarkMode } = useDarkMode();
  const [mode, setMode] = React.useState(() => {
    const stored = localStorage.getItem('darkMode');
    if (stored === null) return 'system';
    return JSON.parse(stored) ? 'dark' : 'light';
  });

  const handleModeChange = (newMode) => {
    setMode(newMode);
    
    switch (newMode) {
      case 'light':
        setDarkMode(false);
        break;
      case 'dark':
        setDarkMode(true);
        break;
      case 'system': {
        localStorage.removeItem('darkMode');
        // 跟随系统偏好
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDarkMode(systemDark);
        break;
      }
    }
  };

  const modes = [
    { key: 'light', label: '浅色', icon: Sun },
    { key: 'dark', label: '深色', icon: Moon },
    { key: 'system', label: '跟随系统', icon: Monitor }
  ];

  return (
    <div className={`flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 ${className}`}>
      {modes.map(({ key, label, icon: IconComponent }, index) => (
        <button
          key={key || index}
          onClick={() => handleModeChange(key)}
          className={`
            flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-all duration-200
            ${mode === key
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }
          `}
          title={label}
        >
          <IconComponent className="w-3 h-3" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
};

export default DarkModeToggle;
