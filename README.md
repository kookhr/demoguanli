# 环境管理系统 - 开发版本

现代化的环境管理系统开发源码，支持多环境配置、状态监控和用户权限管理。

## 🎯 特性

- 🌐 **多环境管理**: 支持开发、测试、生产等多种环境
- 📊 **实时状态监控**: 自动检测环境可用性和响应时间  
- 🔐 **用户权限管理**: 基于角色的访问控制
- 📱 **响应式设计**: 支持桌面和移动设备
- 🎨 **现代化UI**: Apple Liquid Glass设计风格
- 🔄 **配置导入导出**: 支持JSON格式的配置管理
- 🏷️ **标签系统**: 环境分类和快速筛选
- 🚀 **Serv00优化**: 专为Serv00平台/dist/代理配置优化

## 🛠️ 技术栈

- **前端**: React 18 + Vite + Tailwind CSS
- **后端**: PHP 8+ + MySQL
- **开发工具**: ESLint + PostCSS

## 📦 开发环境结构

```
├── src/                # 前端源码
│   ├── components/     # React组件
│   │   ├── AuthProvider.jsx
│   │   ├── EnvironmentList.jsx
│   │   ├── EnvironmentCard.jsx
│   │   ├── ConfigPage.jsx
│   │   └── ...
│   ├── utils/          # 工具函数
│   │   ├── databaseApi.js
│   │   ├── statusHistory.js
│   │   ├── configManager.js
│   │   └── ...
│   ├── hooks/          # 自定义Hooks
│   ├── config/         # 配置文件
│   └── data/           # 数据文件
├── api/                # 后端API开发
│   ├── index.php       # API入口
│   ├── import.php      # 配置导入
│   ├── controllers/    # 控制器
│   ├── models/         # 数据模型
│   └── config/         # API配置
├── database/           # 数据库
│   └── init.sql        # 数据库结构
├── public/             # 公共资源
├── package.json        # 依赖管理
├── vite.config.js      # 构建配置
└── tailwind.config.js  # 样式配置
```

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置数据库
修改 `api/config/database.php` 中的数据库连接信息：
```php
$this->host = 'localhost';
$this->db_name = 'environment_manager';
$this->username = 'your_username';
$this->password = 'your_password';
```

### 3. 初始化数据库
```bash
mysql -u username -p database_name < database/init.sql
```

### 4. 启动开发服务器
```bash
npm run dev
```

### 5. 访问开发环境
```
http://localhost:5173
```

## 🔧 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 代码检查
npm run lint

# 代码格式化
npm run format
```

## 🔧 开发说明

### 主要组件
- `EnvironmentList`: 环境列表管理
- `EnvironmentCard`: 环境卡片显示
- `ConfigPage`: 配置导入导出
- `UserManagementPage`: 用户管理
- `AuthProvider`: 认证状态管理
- `DarkModeToggle`: 深色模式切换
- `StatusHistoryChart`: 状态历史图表

### 工具函数
- `databaseApi.js`: 数据库API接口
- `statusHistory.js`: 状态历史管理
- `configManager.js`: 配置管理
- `userManagement.js`: 用户管理
- `proxyStatusCheck.js`: 状态检测
- `favorites.js`: 收藏管理

### API接口
- `/api/environments`: 环境管理
- `/api/auth`: 用户认证
- `/api/import`: 配置导入
- `/api/users`: 用户管理

### 开发工作流
1. **修改组件**: 编辑 `src/components/` 下的React组件
2. **添加功能**: 在 `src/utils/` 中添加工具函数
3. **样式调整**: 使用Tailwind CSS类名
4. **API开发**: 修改 `api/` 目录下的PHP文件
5. **数据库**: 更新 `database/init.sql` 结构

## 🔍 故障排除

### 开发环境问题
1. **依赖安装失败**: 删除 `node_modules` 重新安装
2. **端口冲突**: 修改 `vite.config.js` 中的端口配置
3. **热重载失败**: 检查文件权限和防火墙设置
4. **API连接失败**: 确认PHP服务器运行正常
5. **数据库连接**: 检查 `api/config/database.php` 配置

## 📄 许可证

MIT License
