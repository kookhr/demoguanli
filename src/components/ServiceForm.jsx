import React, { useState } from 'react';
import { Plus, Trash2, Server } from 'lucide-react';

const ServiceForm = ({ services = [], onChange }) => {
  const [localServices, setLocalServices] = useState(services);

  // 添加新服务
  const addService = () => {
    const newService = {
      name: '',
      url: '',
      port: 80
    };
    const updated = [...localServices, newService];
    setLocalServices(updated);
    onChange(updated);
  };

  // 更新服务
  const updateService = (index, field, value) => {
    const updated = localServices.map((service, i) => 
      i === index ? { ...service, [field]: value } : service
    );
    setLocalServices(updated);
    onChange(updated);
  };

  // 删除服务
  const removeService = (index) => {
    const updated = localServices.filter((_, i) => i !== index);
    setLocalServices(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          服务列表
        </label>
        <button
          type="button"
          onClick={addService}
          className="btn btn-primary text-sm px-3 py-1"
        >
          <Plus className="w-4 h-4" />
          添加服务
        </button>
      </div>

      {localServices.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Server className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p>暂无服务，点击"添加服务"开始配置</p>
        </div>
      ) : (
        <div className="space-y-3">
          {localServices.map((service, index) => (
            <div key={index} className="card p-4 bg-gray-50 animate-slide-up">
              <div className="flex items-start gap-4">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 服务名称 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      服务名称
                    </label>
                    <input
                      type="text"
                      value={service.name}
                      onChange={(e) => updateService(index, 'name', e.target.value)}
                      placeholder="例如: Web应用"
                      className="input-field text-sm"
                    />
                  </div>

                  {/* 服务URL */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      服务URL
                    </label>
                    <input
                      type="url"
                      value={service.url}
                      onChange={(e) => updateService(index, 'url', e.target.value)}
                      placeholder="https://example.com"
                      className="input-field text-sm"
                    />
                  </div>

                  {/* 端口号 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      端口号
                    </label>
                    <input
                      type="number"
                      value={service.port}
                      onChange={(e) => updateService(index, 'port', parseInt(e.target.value) || 80)}
                      placeholder="80"
                      min="1"
                      max="65535"
                      className="input-field text-sm"
                    />
                  </div>
                </div>

                {/* 删除按钮 */}
                <button
                  type="button"
                  onClick={() => removeService(index)}
                  className="flex-shrink-0 p-2 text-danger-600 hover:text-danger-800 hover:bg-danger-50 rounded-lg transition-colors"
                  title="删除服务"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 服务配置提示 */}
      <div className="text-xs text-gray-600 bg-primary-50 border border-primary-200 p-4 rounded-xl">
        <p className="font-semibold mb-2 text-primary-800">配置说明：</p>
        <ul className="space-y-1">
          <li>• 服务名称：用于显示的服务标识，如"Web应用"、"API服务"等</li>
          <li>• 服务URL：服务的完整访问地址，包含协议（http/https）</li>
          <li>• 端口号：服务监听的端口，常用端口：80(HTTP)、443(HTTPS)、3000(开发)、8080(API)</li>
        </ul>
      </div>
    </div>
  );
};

export default ServiceForm;
