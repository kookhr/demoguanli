export const environments = [
  {
    id: 'google',
    name: 'Google 搜索',
    type: 'production',
    network: 'external',
    url: 'https://www.google.com',
    version: 'v1.0.0',
    description: '谷歌搜索引擎 - 用于测试在线状态',
    tags: ['search', 'external', 'stable', 'production'],
    services: [
      { name: 'Web应用', url: 'https://www.google.com', port: 443 },
      { name: 'API服务', url: 'https://www.googleapis.com', port: 443 }
    ]
  },
  {
    id: 'github',
    name: 'GitHub',
    type: 'production',
    network: 'external',
    url: 'https://github.com',
    version: 'v2.0.0',
    description: 'GitHub 代码托管平台 - 用于测试在线状态',
    tags: ['git', 'code', 'external', 'stable', 'production'],
    services: [
      { name: 'Web应用', url: 'https://github.com', port: 443 },
      { name: 'API服务', url: 'https://api.github.com', port: 443 }
    ]
  },
  {
    id: 'localhost',
    name: '本地开发服务器',
    type: 'development',
    network: 'internal',
    url: 'http://localhost:5173',
    version: 'v1.0.0-dev',
    description: '本地Vite开发服务器 - 用于测试内网环境',
    tags: ['development', 'local', 'frontend', 'vite'],
    services: [
      { name: 'Web应用', url: 'http://localhost:5173', port: 5173 },
      { name: 'HMR', url: 'ws://localhost:5173', port: 5173 }
    ]
  },
  {
    id: 'nonexistent',
    name: '不存在的服务',
    type: 'testing',
    network: 'external',
    url: 'https://this-domain-does-not-exist-12345.com',
    version: 'v0.0.1',
    description: '不存在的域名 - 用于测试离线状态',
    tags: ['testing', 'offline', 'demo'],
    services: [
      { name: 'Web应用', url: 'https://this-domain-does-not-exist-12345.com', port: 443 }
    ]
  },
  {
    id: 'timeout',
    name: '超时测试服务',
    type: 'staging',
    network: 'external',
    url: 'https://httpstat.us/200?sleep=15000',
    version: 'v1.1.0',
    description: '模拟超时的服务 - 用于测试超时状态',
    tags: ['testing', 'timeout', 'staging', 'demo'],
    services: [
      { name: 'Web应用', url: 'https://httpstat.us/200?sleep=15000', port: 443 }
    ]
  },
  {
    id: 'error',
    name: '错误测试服务',
    type: 'demo',
    network: 'external',
    url: 'https://httpstat.us/500',
    version: 'v0.5.0',
    description: '返回500错误的服务 - 用于测试错误状态',
    tags: ['testing', 'error', 'demo'],
    services: [
      { name: 'Web应用', url: 'https://httpstat.us/500', port: 443 }
    ]
  }
];

export const getEnvironmentsByNetwork = (network) => {
  return environments.filter(env => env.network === network);
};

export const getEnvironmentsByStatus = (status) => {
  return environments.filter(env => env.status === status);
};

export const getEnvironmentById = (id) => {
  return environments.find(env => env.id === id);
};
