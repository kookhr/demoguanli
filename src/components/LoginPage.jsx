import React, { useState, useEffect } from 'react';
import { Monitor, Sparkles, Eye, EyeOff, User, Lock, Mail, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { login, register, isRegistrationDisabled } from '../utils/auth';

const LoginPage = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [registrationDisabled, setRegistrationDisabled] = useState(false);

  // 检测深色模式
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark') ||
                    window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };

    checkDarkMode();
    
    // 监听深色模式变化
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // 检查注册状态
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      try {
        const disabled = await isRegistrationDisabled();
        setRegistrationDisabled(disabled);
      } catch (error) {
        console.warn('检查注册状态失败:', error);
      }
    };

    checkRegistrationStatus();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // 清除错误信息
    if (error) setError('');
    if (success) setSuccess('');
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('请输入用户名');
      return false;
    }
    
    if (formData.username.length < 3) {
      setError('用户名至少需要3个字符');
      return false;
    }
    
    if (!formData.password) {
      setError('请输入密码');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('密码至少需要6个字符');
      return false;
    }
    
    if (!isLogin && formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      setError('请输入有效的邮箱地址');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      if (isLogin) {
        // 登录
        const result = await login(formData.username, formData.password, formData.rememberMe);
        console.log('✅ 登录成功:', result);
        setSuccess('登录成功！');
        
        // 延迟一下再跳转，让用户看到成功消息
        setTimeout(() => {
          onLoginSuccess && onLoginSuccess(result.user);
        }, 500);
      } else {
        // 注册
        await register(formData.username, formData.password, formData.email);
        setSuccess('注册成功！请登录');

        // 自动切换到登录模式
        setTimeout(() => {
          setIsLogin(true);
          setFormData(prev => ({ ...prev, password: '', email: '' }));
        }, 1500);
      }
    } catch (error) {
      console.error('❌ 认证失败:', error);
      setError(error.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setFormData(prev => ({
      ...prev,
      password: '',
      email: ''
    }));
  };

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50'
    }`}>
      <div className="max-w-md w-full space-y-8">
        {/* Logo和标题 */}
        <div className="text-center">
          <div className="flex items-center justify-center group mb-4">
            <div className="relative">
              <Monitor className={`w-12 h-12 mr-3 transition-all duration-300 group-hover:scale-110 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`} />
              <Sparkles className={`w-4 h-4 absolute -top-1 -right-1 animate-pulse ${
                isDarkMode ? 'text-blue-300' : 'text-blue-500'
              }`} />
            </div>
          </div>
          
          <h2 className={`text-3xl font-bold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            环境管理中心
          </h2>
          
          <p className={`mt-2 text-sm transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {isLogin ? '登录您的账户' : '创建新账户'}
          </p>
        </div>

        {/* 登录/注册表单 */}
        <div className={`rounded-xl shadow-xl p-8 transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gray-800/80 backdrop-blur-sm border border-gray-700' 
            : 'bg-white/80 backdrop-blur-sm border border-gray-200'
        }`}>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* 用户名输入 */}
            <div>
              <label htmlFor="username" className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                用户名
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className={`h-5 w-5 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="请输入用户名"
                />
              </div>
            </div>

            {/* 邮箱输入（仅注册时显示） */}
            {!isLogin && (
              <div>
                <label htmlFor="email" className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  邮箱 (可选)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className={`h-5 w-5 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="请输入邮箱地址"
                  />
                </div>
              </div>
            )}

            {/* 注册禁用提示 */}
            {!isLogin && registrationDisabled && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">注册功能已禁用</p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                      当前系统已禁止新用户注册，请联系管理员获取账户
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 密码输入 */}
            <div>
              <label htmlFor="password" className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute inset-y-0 right-0 pr-3 flex items-center transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* 记住我（仅登录时显示） */}
            {isLogin && (
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className={`ml-2 block text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  记住我
                </label>
              </div>
            )}

            {/* 错误和成功消息 */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
              </div>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={loading || (!isLogin && registrationDisabled)}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                loading || (!isLogin && registrationDisabled)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
              }`}
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {isLogin ? (
                  <LogIn className={`h-5 w-5 transition-transform duration-300 ${
                    loading ? 'animate-spin' : 'group-hover:translate-x-1'
                  }`} />
                ) : (
                  <UserPlus className={`h-5 w-5 transition-transform duration-300 ${
                    loading ? 'animate-spin' : 'group-hover:translate-x-1'
                  }`} />
                )}
              </span>
              {loading ? '处理中...' : (isLogin ? '登录' : (registrationDisabled ? '注册已禁用' : '注册'))}
            </button>

            {/* 切换登录/注册模式 */}
            <div className="text-center">
              <button
                type="button"
                onClick={switchMode}
                className={`text-sm font-medium transition-colors duration-300 hover:underline ${
                  isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                }`}
              >
                {isLogin ? '没有账户？立即注册' : '已有账户？立即登录'}
              </button>
            </div>
          </form>
        </div>

        {/* 底部信息 */}
        <div className="text-center">
          <p className={`text-xs transition-colors duration-300 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Environment Management System v1.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
