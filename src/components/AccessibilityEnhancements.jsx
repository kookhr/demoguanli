import { useEffect, useRef, useState } from 'react';

// 焦点管理Hook
export const useFocusManagement = () => {
  const focusableElementsSelector = 
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  const trapFocus = (container) => {
    const focusableElements = container.querySelectorAll(focusableElementsSelector);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    // 自动聚焦到第一个元素
    if (firstElement) {
      firstElement.focus();
    }

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  };

  const restoreFocus = (element) => {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  };

  return { trapFocus, restoreFocus };
};

// 屏幕阅读器公告组件
export const ScreenReaderAnnouncement = ({ message, priority = 'polite' }) => {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (message) {
      setAnnouncement(message);
      // 清除消息以便下次公告
      const timer = setTimeout(() => setAnnouncement(''), 1000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
};

// 跳过链接组件
export const SkipLink = ({ targetId, children = "跳到主要内容" }) => {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                 bg-blue-600 text-white px-4 py-2 rounded-lg z-50 
                 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {children}
    </a>
  );
};

// 可访问的按钮组件
export const AccessibleButton = ({
  children,
  onClick,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  variant = 'primary',
  size = 'medium',
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
  };

  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      {...props}
    >
      {children}
    </button>
  );
};

// 可访问的输入框组件
export const AccessibleInput = ({
  label,
  id,
  error,
  helpText,
  required = false,
  ...props
}) => {
  const errorId = error ? `${id}-error` : undefined;
  const helpId = helpText ? `${id}-help` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="必填">
            *
          </span>
        )}
      </label>
      
      <input
        id={id}
        aria-describedby={describedBy}
        aria-invalid={error ? 'true' : 'false'}
        className={`
          block w-full px-3 py-2 border rounded-lg shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${error 
            ? 'border-red-300 text-red-900 placeholder-red-300' 
            : 'border-gray-300 dark:border-gray-600'
          }
          bg-white dark:bg-gray-700 text-gray-900 dark:text-white
        `}
        {...props}
      />
      
      {helpText && (
        <p id={helpId} className="text-sm text-gray-600 dark:text-gray-400">
          {helpText}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// 可访问的模态框组件
export const AccessibleModal = ({
  isOpen,
  onClose,
  title,
  children,
  closeOnEscape = true,
  closeOnOverlayClick = true
}) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  const { trapFocus, restoreFocus } = useFocusManagement();

  useEffect(() => {
    if (isOpen) {
      // 保存当前焦点
      previousFocusRef.current = document.activeElement;
      
      // 设置焦点陷阱
      const cleanup = trapFocus(modalRef.current);
      
      return cleanup;
    } else if (previousFocusRef.current) {
      // 恢复焦点
      restoreFocus(previousFocusRef.current);
    }
  }, [isOpen, trapFocus, restoreFocus]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />
      
      {/* 模态框内容 */}
      <div
        ref={modalRef}
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <h2 id="modal-title" className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {title}
          </h2>
          
          {children}
        </div>
      </div>
    </div>
  );
};

// 键盘导航指示器
export const KeyboardNavigationIndicator = () => {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  useEffect(() => {
    if (isKeyboardUser) {
      document.body.classList.add('keyboard-navigation');
    } else {
      document.body.classList.remove('keyboard-navigation');
    }
  }, [isKeyboardUser]);

  return null;
};

// 高对比度模式检测
export const useHighContrastMode = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    
    setIsHighContrast(mediaQuery.matches);
    
    const handleChange = (e) => {
      setIsHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return isHighContrast;
};

// 减少动画偏好检测
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
};
