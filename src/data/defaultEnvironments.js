// 默认环境数据
export const environments = [
  {
    id: 'google',
    name: 'Google 搜索',
    type: '生产环境',
    network: 'external',
    url: 'https://www.google.com',
    version: 'v1.0.0',
    description: '谷歌搜索引擎 - 用于测试在线状态',
    tags: ['搜索', '外网', '稳定版', '生产环境'],
    services: [
      { name: 'Web应用', url: 'https://www.google.com', port: 443 },
      { name: 'API服务', url: 'https://www.googleapis.com', port: 443 }
    ]
  },
  {
    id: 'github',
    name: 'GitHub',
    type: '生产环境',
    network: 'external',
    url: 'https://github.com',
    version: 'v2.0.0',
    description: 'GitHub 代码托管平台 - 用于测试在线状态',
    tags: ['代码', '平台', '外网', '稳定版', '生产环境'],
    services: [
      { name: 'Web应用', url: 'https://github.com', port: 443 },
      { name: 'API服务', url: 'https://api.github.com', port: 443 }
    ]
  },
  {
    id: 'localhost',
    name: '本地开发服务器',
    type: '开发环境',
    network: 'internal',
    url: 'http://localhost:5173',
    version: 'v1.0.0-dev',
    description: '本地Vite开发服务器 - 用于测试内网环境',
    tags: ['开发环境', '本地', '前端', '工具'],
    services: [
      { name: 'Web应用', url: 'http://localhost:5173', port: 5173 },
      { name: 'HMR', url: 'ws://localhost:5173', port: 5173 }
    ]
  },
  {
    id: 'test-unreachable',
    name: '测试不可达地址',
    type: '测试环境',
    network: 'internal',
    url: 'http://10.0.1.77:18080',
    version: 'v1.0.0-test',
    description: '用于测试网络检测修复的不可达内网地址',
    tags: ['测试', '内网', '不可达', '验证'],
    services: [
      { name: '测试服务', url: 'http://10.0.1.77:18080', port: 18080 }
    ]
  }
];
