import React, { useState } from 'react';
import EnvironmentCard from './EnvironmentCard';
import { checkEnvironmentStatus } from '../utils/simpleNetworkCheck';
import { Monitor, Palette, Eye, EyeOff } from 'lucide-react';

const CardDesignTest = () => {
  const [showOriginal, setShowOriginal] = useState(true);
  const [selectedDemo, setSelectedDemo] = useState('all');
  const [simulateChecking, setSimulateChecking] = useState(false);
  const [individualChecking, setIndividualChecking] = useState(new Set());
  const [currentStatuses, setCurrentStatuses] = useState({});
  const [toast, setToast] = useState(null);

  // 测试数据
  const testEnvironments = [
    {
      id: '1',
      name: 'Production API',
      description: '生产环境主要API服务，处理所有用户请求和核心业务逻辑',
      url: 'https://api.example.com',
      type: 'production',
      network: 'external',
      version: '2.1.3',
      tags: ['API', 'Core', 'Critical', 'High-Traffic'],
      services: [
        { name: 'User API', port: 8080, status: 'running' },
        { name: 'Auth Service', port: 8081, status: 'running' },
        { name: 'Payment Gateway', port: 8082, status: 'running' }
      ]
    },
    {
      id: '2',
      name: 'Staging Web',
      description: '预发布环境，用于最终测试和验证',
      url: 'https://staging.example.com',
      type: 'staging',
      network: 'internal',
      version: '2.2.0-rc.1',
      tags: ['Web', 'Testing']
    },
    {
      id: '3',
      name: 'Dev Database',
      description: '开发环境数据库服务',
      url: 'http://192.168.1.100:5432',
      type: 'development',
      network: 'internal',
      version: '1.8.2',
      tags: ['Database', 'PostgreSQL'],
      services: [
        { name: 'PostgreSQL', port: 5432, status: 'running' },
        { name: 'Redis Cache', port: 6379, status: 'running' }
      ]
    },
    {
      id: '4',
      name: 'Monitoring Dashboard',
      description: '系统监控和告警平台',
      url: 'https://monitor.example.com',
      type: 'production',
      network: 'external',
      version: '3.0.1',
      tags: ['Monitoring', 'Grafana', 'Alerts'],
      services: [
        { name: 'Grafana', port: 3000, status: 'running' },
        { name: 'Prometheus', port: 9090, status: 'running' },
        { name: 'AlertManager', port: 9093, status: 'running' }
      ]
    },
    {
      id: '5',
      name: 'Internal Service',
      description: '内部微服务，处理后台任务',
      url: 'http://demo-itam.cloudwise.com:18088',
      type: 'production',
      network: 'internal',
      version: '1.5.7',
      tags: ['Microservice', 'Background']
    },
    {
      id: '6',
      name: 'Test Environment',
      description: '自动化测试环境',
      url: 'http://test.local:3000',
      type: 'development',
      network: 'internal',
      version: '0.9.12-alpha',
      tags: ['Testing', 'Automation', 'CI/CD'],
      services: [
        { name: 'Test Runner', port: 3000, status: 'running' },
        { name: 'Mock Server', port: 3001, status: 'stopped' },
        { name: 'Coverage Server', port: 3002, status: 'warning' }
      ]
    }
  ];

  // 测试状态数据
  const testStatuses = {
    '1': {
      status: 'available',
      responseTime: 245,
      lastChecked: new Date().toISOString(),
      method: 'fetch-success'
    },
    '2': {
      status: 'available',
      responseTime: 156,
      lastChecked: new Date().toISOString(),
      method: 'enhanced-check'
    },
    '3': {
      status: 'unreachable',
      responseTime: 5000,
      lastChecked: new Date().toISOString(),
      method: 'all-methods-failed',
      error: '连接超时'
    },
    '4': {
      status: 'available',
      responseTime: 89,
      lastChecked: new Date().toISOString(),
      method: 'image-load'
    },
    '5': {
      status: 'available',
      responseTime: 1200,
      lastChecked: new Date().toISOString(),
      method: 'mixed-content-image-probe'
    },
    '6': {
      status: 'unreachable',
      responseTime: null,
      lastChecked: new Date().toISOString(),
      method: 'fetch-failed',
      error: '网络不可达'
    }
  };

  // 初始化状态
  React.useEffect(() => {
    setCurrentStatuses(testStatuses);
  }, []);

  // Toast显示函数
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 模拟操作函数
  const handleVisit = (env) => {
    console.log('访问环境:', env.url);
    window.open(env.url, '_blank');
  };

  // 单独状态检测
  const handleStatusCheck = async (environment) => {
    console.log('开始检测环境:', environment.name);

    // 添加到检测中的集合
    setIndividualChecking(prev => new Set([...prev, environment.id]));

    try {
      // 执行网络检测
      const result = await checkEnvironmentStatus(environment);

      // 更新状态
      setCurrentStatuses(prev => ({
        ...prev,
        [environment.id]: result
      }));

      console.log('检测完成:', environment.name, result);

      // 显示检测结果提示
      const statusText = result.status === 'available' ? '可达' : '不可达';
      const responseTime = result.responseTime ? ` (${result.responseTime}ms)` : '';
      const statusIcon = result.status === 'available' ? '✅' : '❌';
      showToast(`${statusIcon} ${environment.name}: ${statusText}${responseTime}`, result.status === 'available' ? 'success' : 'error');

    } catch (error) {
      console.error('检测失败:', error);
      showToast(`❌ ${environment.name}: 检测失败`, 'error');
    } finally {
      // 从检测中的集合移除
      setIndividualChecking(prev => {
        const newSet = new Set(prev);
        newSet.delete(environment.id);
        return newSet;
      });
    }
  };

  // 过滤演示数据
  const getFilteredEnvironments = () => {
    switch (selectedDemo) {
      case 'available':
        return testEnvironments.filter(env => testStatuses[env.id]?.status === 'available');
      case 'unreachable':
        return testEnvironments.filter(env => testStatuses[env.id]?.status === 'unreachable');
      case 'production':
        return testEnvironments.filter(env => env.type === 'production');
      case 'development':
        return testEnvironments.filter(env => env.type === 'development');
      default:
        return testEnvironments;
    }
  };

  const filteredEnvironments = getFilteredEnvironments();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Toast 提示 */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className={`
            px-4 py-3 rounded-xl shadow-lg backdrop-blur-xl border
            ${toast.type === 'success'
              ? 'bg-green-50/90 border-green-200 text-green-800 dark:bg-green-900/90 dark:border-green-700 dark:text-green-200'
              : toast.type === 'error'
              ? 'bg-red-50/90 border-red-200 text-red-800 dark:bg-red-900/90 dark:border-red-700 dark:text-red-200'
              : 'bg-blue-50/90 border-blue-200 text-blue-800 dark:bg-blue-900/90 dark:border-blue-700 dark:text-blue-200'
            }
          `}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* 页面头部 */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <Palette className="w-7 h-7 text-green-500" />
                Apple 风格环境卡片 - 替换完成 ✅
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                新的 Apple 风格设计已成功替换原始组件，包含完整的交互功能
              </p>
            </div>

            {/* 控制面板 */}
            <div className="flex items-center gap-4">
              {/* 显示切换 */}
              <button
                onClick={() => setShowOriginal(!showOriginal)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm
                  transition-all duration-200
                  ${showOriginal 
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }
                `}
              >
                {showOriginal ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {showOriginal ? '显示对比' : '仅新设计'}
              </button>

              {/* 模拟检测状态 */}
              <button
                onClick={() => setSimulateChecking(!simulateChecking)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm
                  transition-all duration-200
                  ${simulateChecking
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }
                `}
              >
                <Monitor className="w-4 h-4" />
                {simulateChecking ? '停止检测' : '模拟检测'}
              </button>

              {/* 演示类型选择 */}
              <select
                value={selectedDemo}
                onChange={(e) => setSelectedDemo(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                         transition-all duration-200"
              >
                <option value="all">全部环境</option>
                <option value="available">可达环境</option>
                <option value="unreachable">不可达环境</option>
                <option value="production">生产环境</option>
                <option value="development">开发环境</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 设计说明 */}
        <div className="mb-8 p-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-blue-500" />
            Apple 设计语言特性
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">视觉效果</h3>
              <ul className="text-gray-600 dark:text-gray-400 space-y-0.5">
                <li>• 毛玻璃背景模糊</li>
                <li>• 圆角设计 (rounded-2xl)</li>
                <li>• 微妙阴影和渐变</li>
                <li>• 半透明元素</li>
              </ul>
            </div>
            <div className="space-y-1">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">智能功能</h3>
              <ul className="text-gray-600 dark:text-gray-400 space-y-0.5">
                <li>• 点击状态标签即时检测</li>
                <li>• 下拉式服务列表</li>
                <li>• 快速服务访问</li>
                <li>• 智能URL构造</li>
              </ul>
            </div>
            <div className="space-y-1">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">信息展示</h3>
              <ul className="text-gray-600 dark:text-gray-400 space-y-0.5">
                <li>• 环境版本号显示</li>
                <li>• 清晰的信息层级</li>
                <li>• 语义化标签设计</li>
                <li>• 响应式布局</li>
              </ul>
            </div>
            <div className="space-y-1">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">色彩系统</h3>
              <ul className="text-gray-600 dark:text-gray-400 space-y-0.5">
                <li>• 语义化颜色</li>
                <li>• 深色模式适配</li>
                <li>• 高对比度</li>
                <li>• 无障碍访问</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 卡片展示区域 */}
        <div className="space-y-8">
          {showOriginal && (
            <>
              {/* 新设计 */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  Apple 风格设计 (新)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEnvironments.map((env) => (
                    <EnvironmentCard
                      key={`new-${env.id}`}
                      environment={env}
                      status={currentStatuses[env.id] || testStatuses[env.id]}
                      isChecking={simulateChecking || individualChecking.has(env.id)}
                      onVisit={handleVisit}
                      onStatusCheck={handleStatusCheck}
                    />
                  ))}
                </div>
              </div>

              {/* 原设计 */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                  原始设计 (对比)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEnvironments.map((env) => (
                    <EnvironmentCard
                      key={`old-${env.id}`}
                      environment={env}
                      status={testStatuses[env.id]}
                      onStatusCheck={() => console.log('状态检测:', env.name)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {!showOriginal && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                Apple 风格设计
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEnvironments.map((env) => (
                  <EnvironmentCard
                    key={env.id}
                    environment={env}
                    status={currentStatuses[env.id] || testStatuses[env.id]}
                    isChecking={simulateChecking || individualChecking.has(env.id)}
                    onVisit={handleVisit}
                    onStatusCheck={handleStatusCheck}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 测试说明 */}
        <div className="mt-12 space-y-6">
          {/* 测试指南 */}
          <div className="p-6 bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-xl rounded-2xl border border-blue-200/50 dark:border-blue-700/50">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
              测试指南
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
              <div>
                <h4 className="font-medium mb-2">视觉测试</h4>
                <ul className="space-y-1">
                  <li>• 检查毛玻璃效果是否正常</li>
                  <li>• 验证深色模式适配</li>
                  <li>• 测试不同状态的颜色显示</li>
                  <li>• 确认响应式布局</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">交互测试</h4>
                <ul className="space-y-1">
                  <li>• 悬停动画效果</li>
                  <li>• 按钮点击反馈</li>
                  <li>• 过渡动画流畅性</li>
                  <li>• 无障碍访问性</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 状态检测功能说明 */}
          <div className="p-6 bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-xl rounded-2xl border border-blue-200/50 dark:border-blue-700/50">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
              即时状态检测
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
              <div>
                <h4 className="font-medium mb-2">使用方法</h4>
                <ul className="space-y-1">
                  <li>• 点击右上角的状态标签（可达/不可达）</li>
                  <li>• 系统会立即对该环境进行网络检测</li>
                  <li>• 检测过程中显示旋转加载图标</li>
                  <li>• 检测完成后更新状态显示</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">检测特性</h4>
                <ul className="space-y-1">
                  <li>• 使用真实的网络检测逻辑</li>
                  <li>• 支持混合内容检测（HTTPS→HTTP）</li>
                  <li>• 显示响应时间和检测方法</li>
                  <li>• 独立检测，不影响其他环境</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 服务功能说明 */}
          <div className="p-6 bg-purple-50/80 dark:bg-purple-900/20 backdrop-blur-xl rounded-2xl border border-purple-200/50 dark:border-purple-700/50">
            <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-3">
              服务管理功能
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-800 dark:text-purple-200">
              <div>
                <h4 className="font-medium mb-2">交互功能</h4>
                <ul className="space-y-1">
                  <li>• 点击状态标签进行即时网络检测</li>
                  <li>• 点击"服务详情"展开/收起服务列表</li>
                  <li>• 运行中的服务可直接访问</li>
                  <li>• 智能构造服务访问URL</li>
                  <li>• 环境版本号标签显示</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">版本标识</h4>
                <ul className="space-y-1">
                  <li>• <span className="text-indigo-600">正式版本</span>：如 v2.1.3（蓝色）</li>
                  <li>• <span className="text-yellow-600">RC版本</span>：如 v2.2.0-rc.1（黄色）</li>
                  <li>• <span className="text-orange-600">Beta版本</span>：如 v2.1.4-beta（橙色）</li>
                  <li>• <span className="text-red-600">Alpha版本</span>：如 v0.9.12-alpha（红色）</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 替换完成总结 */}
          <div className="p-6 bg-green-50/80 dark:bg-green-900/20 backdrop-blur-xl rounded-2xl border border-green-200/50 dark:border-green-700/50">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3">
              ✅ 组件替换完成
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-green-800 dark:text-green-200">
              <div>
                <h4 className="font-medium mb-2">视觉升级</h4>
                <ul className="space-y-1">
                  <li>• 毛玻璃背景效果</li>
                  <li>• 更大的圆角设计</li>
                  <li>• 精致的阴影系统</li>
                  <li>• 渐变光晕效果</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">交互优化</h4>
                <ul className="space-y-1">
                  <li>• 流畅的悬停动画</li>
                  <li>• 按钮微交互反馈</li>
                  <li>• 状态指示器动效</li>
                  <li>• 标签悬停效果</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">替换成果</h4>
                <ul className="space-y-1">
                  <li>• EnvironmentCard 组件已完全替换</li>
                  <li>• 保留所有原有功能接口</li>
                  <li>• 新增 Apple 风格设计</li>
                  <li>• 完整的交互功能支持</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDesignTest;
