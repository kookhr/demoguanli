import React from 'react';

const TestPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">测试页面</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">基础功能测试</h2>
          <p className="text-gray-600 mb-4">如果您能看到这个页面，说明基础 React 组件正常工作。</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900">CSS 样式</h3>
              <p className="text-blue-700 text-sm">Tailwind CSS 正常加载</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900">React 组件</h3>
              <p className="text-green-700 text-sm">组件渲染正常</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">导航测试</h2>
          <div className="space-y-2">
            <a href="/" className="block text-blue-600 hover:text-blue-800">
              → 返回首页
            </a>
            <a href="/config" className="block text-blue-600 hover:text-blue-800">
              → 配置页面
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
