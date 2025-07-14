import React, { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Settings, Monitor, Sparkles, Users, Wifi } from 'lucide-react';
import { UserInfo, useAuth } from './AuthProvider';
import { hasPermission } from '../utils/auth';
import DarkModeToggle from './DarkModeToggle';

const Navigation = () => {
  const location = useLocation();
  const { user } = useAuth();

  // 基础导航项
  const baseNavItems = [
    {
      path: '/',
      label: '环境管理',
      icon: Home,
      description: '查看和访问环境',
      permission: 'environment_access'
    }
  ];

  // 管理员配置项
  const configNavItems = [
    {
      path: '/config',
      label: '配置管理',
      icon: Settings,
      description: '编辑环境配置',
      permission: 'config_management'
    }
  ];

  // 管理员专用导航项
  const adminNavItems = [
    {
      path: '/user-management',
      label: '用户管理',
      icon: Users,
      description: '管理用户账户和权限',
      permission: 'user_management'
    },
    {
      path: '/network-test',
      label: '网络测试',
      icon: Wifi,
      description: '测试IP+端口探测功能',
      permission: 'user_management'
    }
  ];

  // 根据用户权限组合导航项
  const allNavItems = [...baseNavItems, ...configNavItems, ...adminNavItems];
  const navItems = allNavItems.filter(item =>
    !item.permission || hasPermission(user, item.permission)
  );

  return (
    <nav className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center group">
            <div className="relative">
              <Monitor className="w-8 h-8 text-primary-600 mr-3 transition-transform group-hover:scale-110" />
              <Sparkles className="w-3 h-3 text-primary-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                环境管理中心
              </h1>
              <p className="text-xs text-gray-500 -mt-1">Environment Management</p>
            </div>
          </div>

          {/* Navigation Links and User Info */}
          <div className="flex items-center space-x-4">
            {/* Navigation Links */}
            <div className="flex space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group relative flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    title={item.description}
                  >
                    <Icon className={`w-4 h-4 mr-2 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
                    }`} />
                    {item.label}
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-600 dark:bg-primary-400 rounded-full"></div>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* 深色模式切换 */}
            <DarkModeToggle />

            {/* 用户信息 */}
            <UserInfo />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default memo(Navigation);
