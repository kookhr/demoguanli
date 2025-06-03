import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Settings, Monitor, Sparkles } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    {
      path: '/',
      label: '环境管理',
      icon: Home,
      description: '查看和访问环境'
    },
    {
      path: '/config',
      label: '配置管理',
      icon: Settings,
      description: '编辑环境配置'
    }
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
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
                      ? 'bg-primary-100 text-primary-700 shadow-sm'
                      : 'text-gray-600 hover:text-primary-700 hover:bg-gray-50'
                  }`}
                  title={item.description}
                >
                  <Icon className={`w-4 h-4 mr-2 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-primary-600' : 'text-gray-500'
                  }`} />
                  {item.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-600 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
