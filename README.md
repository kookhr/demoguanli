# 环境管理系统 - 配置文件版

一个基于配置文件的现代化环境管理系统，零依赖、极简架构，完美适配 Serv00 静态托管。

## ✨ 特性

### 🎨 现代化设计
- **Apple Liquid Glass 风格** - 透明玻璃质感设计
- **Tailwind CSS** - 完整的响应式布局
- **3列网格布局** - `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`
- **深色模式** - 完整的明暗主题切换

### 🚀 核心功能
- **环境监控** - 实时 HTTP 状态检测
- **智能搜索** - 多维度搜索和过滤
- **分组管理** - 环境分组和折叠功能
- **收藏系统** - 标记重要环境
- **标签系统** - 彩色标签分类
- **状态历史** - 本地存储检测历史

### 🛡️ 技术优势
- **零依赖** - 无需数据库或外部服务
- **纯静态** - 完全适合静态托管
- **配置驱动** - 通过 JSON 文件管理环境
- **本地存储** - 用户数据保存在浏览器

## 📁 项目结构

```
├── config-examples/           # 配置文件示例
│   ├── environments.json     # 环境配置
│   ├── groups.json          # 分组配置
│   └── settings.json        # 应用设置
├── utils/                   # 工具函数
│   ├── configLoader.js      # 配置文件加载器
│   └── localStorage.js      # 本地存储管理
├── serv00-config-deploy.sh  # Serv00 部署脚本
└── README.md               # 项目说明
```

## 🚀 快速部署

### Serv00 一键部署

在 Serv00 终端中运行：

```bash
bash -i <(curl -SL https://raw.githubusercontent.com/kookhr/demoguanli/serv00/serv00-config-deploy.sh)
```

### 手动部署

1. **下载项目文件**
```bash
git clone https://github.com/kookhr/demoguanli.git
cd demoguanli
```

2. **复制配置文件**
```bash
cp -r config-examples config
```

3. **上传到 Serv00**
```bash
# 上传到您的域名目录
scp -r * username@s0.serv00.com:~/domains/yourdomain.com/public_html/
```

## ⚙️ 配置管理

### 环境配置 (config/environments.json)

```json
{
  "version": "2.0.0",
  "environments": [
    {
      "id": "env-001",
      "name": "开发环境",
      "url": "https://dev.example.com",
      "description": "主要开发环境",
      "type": "development",
      "network": "external",
      "groupId": "group-dev",
      "tags": ["开发", "前端", "API"],
      "isActive": true
    }
  ]
}
```


### 分组配置 (config/groups.json)

```json
{
  "version": "2.0.0",
  "groups": [
    {
      "id": "group-dev",
      "name": "开发环境",
      "description": "开发阶段使用的环境",
      "color": "#10B981",
      "icon": "code",
      "sortOrder": 1
    }
  ]
}
```

### 应用设置 (config/settings.json)

```json
{
  "version": "2.0.0",
  "app": {
    "name": "环境管理系统",
    "version": "2.0.0"
  },
  "ui": {
    "theme": {
      "default": "light",
      "allowToggle": true
    }
  },
  "features": {
    "statusCheck": { "enabled": true },
    "search": { "enabled": true },
    "favorites": { "enabled": true }
  }
}
```

## � 使用说明

### 添加新环境

1. 编辑 `config/environments.json`
2. 在 `environments` 数组中添加新环境对象
3. 刷新页面查看更新

### 修改分组

1. 编辑 `config/groups.json`
2. 添加或修改分组配置
3. 更新环境的 `groupId` 字段

### 自定义设置

1. 编辑 `config/settings.json`
2. 修改应用名称、主题、功能开关等
3. 保存后自动生效

## 🛠️ 开发指南

### 配置文件加载

```javascript
import configLoader from './utils/configLoader.js';

// 加载所有配置
const configs = await configLoader.loadAllConfigs();

// 加载单个配置
const environments = await configLoader.loadEnvironments();
const groups = await configLoader.loadGroups();
const settings = await configLoader.loadSettings();
```

### 本地存储管理

```javascript
import localStorageManager from './utils/localStorage.js';

// 用户偏好
const preferences = localStorageManager.getUserPreferences();
localStorageManager.setUserPreferences({ theme: 'dark' });

// 收藏管理
localStorageManager.addFavorite('env-001');
const favorites = localStorageManager.getFavorites();

// 状态历史
localStorageManager.addStatusRecord('env-001', {
  status: 'available',
  responseTime: 120
});
```

## 🎯 架构优势

### vs 数据库方案

| 特性 | 配置文件版 | 数据库版 |
|------|-----------|----------|
| 部署复杂度 | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| 维护成本 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 性能 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 扩展性 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 备份恢复 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

### 适用场景

✅ **适合**:
- 中小型团队环境管理
- 静态托管平台部署
- 快速原型和演示
- 配置变更不频繁的场景

❌ **不适合**:
- 大规模环境管理
- 频繁的配置变更
- 多用户协作编辑
- 复杂的权限控制

## 📊 功能对比

| 功能 | 支持状态 | 实现方式 |
|------|---------|----------|
| 环境列表 | ✅ | JSON 配置 |
| 状态检测 | ✅ | 实时 HTTP 请求 |
| 搜索过滤 | ✅ | 前端 JavaScript |
| 分组管理 | ✅ | JSON 配置 |
| 收藏功能 | ✅ | localStorage |
| 深色模式 | ✅ | CSS + localStorage |
| 状态历史 | ✅ | localStorage |
| 用户认证 | ❌ | 不支持 |
| 在线编辑 | ❌ | 需手动编辑文件 |

## � 故障排除

### 配置文件不生效

1. 检查 JSON 语法是否正确
2. 确认文件路径是否正确
3. 清除浏览器缓存重新加载

### 状态检测失败

1. 检查目标 URL 是否可访问
2. 确认 CORS 设置
3. 查看浏览器控制台错误信息

### 样式显示异常

1. 确认 Tailwind CSS 正确加载
2. 检查浏览器兼容性
3. 清除浏览器缓存

## 📄 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**配置文件版环境管理系统** - 简单、快速、可靠的环境监控解决方案
