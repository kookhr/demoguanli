import React, { createContext, useContext, useState, useEffect } from 'react';
import { Key } from 'lucide-react';
import { authManager, addAuthListener, isAdmin } from '../utils/auth';

// 创建认证上下文
const AuthContext = createContext(null);

// 认证提供者组件
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 初始化认证状态
    const initAuth = () => {
      const currentUser = authManager.getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };

    // 添加认证状态监听器
    const removeListener = addAuthListener((newUser) => {
      setUser(newUser);
    });

    initAuth();

    return removeListener;
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login: authManager.login.bind(authManager),
    logout: authManager.logout.bind(authManager),
    register: authManager.register.bind(authManager)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 使用认证上下文的Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 路由保护组件
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // 将由App.jsx处理重定向到登录页
  }

  return children;
};

// 用户信息显示组件
export const UserInfo = ({ className = '', onChangePassword }) => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
  };

  const handleChangePassword = () => {
    setShowDropdown(false);
    if (onChangePassword) {
      onChangePassword();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <span className="hidden sm:block">{user.username}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <>
          {/* 背景遮罩 */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* 下拉菜单 */}
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.username}</p>
              {user.email && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {user.role === 'admin' ? '管理员' : '用户'}
              </p>
            </div>
            
            <div className="p-1">
              {isAdmin(user) && onChangePassword && (
                <button
                  onClick={handleChangePassword}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200 flex items-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  修改密码
                </button>
              )}

              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors duration-200"
              >
                退出登录
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
