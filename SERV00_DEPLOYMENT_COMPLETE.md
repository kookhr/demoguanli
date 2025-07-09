# 🚀 Serv00 环境管理系统完整部署指南

## 📋 项目概述

本项目是专为 Serv00 主机优化的环境管理系统，使用 MySQL/PostgreSQL 数据库替代 Cloudflare KV 存储，提供完整的环境监控和管理功能。

## 🎯 主要特性

### ✨ 核心功能
- 🌐 **环境管理**：添加、编辑、删除环境配置
- 🔍 **状态检测**：实时网络可达性检测
- 📊 **状态历史**：24小时状态记录和趋势分析
- 🏷️ **标签管理**：彩色标签分类和筛选
- 👥 **用户管理**：基于角色的权限控制
- 📱 **响应式设计**：完美适配各种设备

### 🎨 UI 特性
- 💎 **Apple Liquid Glass 设计**：现代化液态玻璃效果
- 🌙 **暗黑模式**：完整的明暗主题切换
- 🎨 **彩色状态区分**：绿色=可达，红色=不可达，蓝色=检测中
- 📱 **3列响应式布局**：优雅的卡片网格设计

## 🏗️ 技术架构

### 前端技术栈
- **React 18** + **Vite** - 现代化前端框架
- **Tailwind CSS** - 原子化CSS框架
- **Lucide React** - 现代图标库
- **Liquid Glass UI** - Apple风格设计系统

### 后端技术栈
- **PHP 8.0+** - 服务端语言
- **MySQL/PostgreSQL** - 关系型数据库
- **RESTful API** - 标准化接口设计
- **JWT 认证** - 安全的用户认证

### 部署环境
- **Serv00 免费主机** - 静态文件托管
- **Apache/Nginx** - Web服务器
- **SSL/HTTPS** - 安全传输协议

## 📁 项目结构

```
environment-manager/
├── src/                          # 前端源码
│   ├── components/              # React组件
│   ├── utils/                   # 工具函数
│   ├── config/                  # 配置文件
│   └── data/                    # 默认数据
├── api/                         # 后端API
│   ├── config/                  # 数据库配置
│   ├── models/                  # 数据模型
│   ├── controllers/             # 控制器
│   └── index.php               # API入口
├── database/                    # 数据库脚本
│   └── init.sql                # 初始化脚本
├── deploy-serv00-complete.sh   # 一键部署脚本
└── dist/                       # 构建输出
```

## 🚀 快速部署

### 方法一：一键部署脚本（推荐）

1. **配置部署脚本**
   ```bash
   # 编辑 deploy-serv00-complete.sh
   SERV00_USER="your_username"           # 您的Serv00用户名
   SERV00_DOMAIN="your_domain.serv00.net" # 您的域名
   DB_USER="your_db_user"                # 数据库用户名
   DB_PASSWORD="your_db_password"        # 数据库密码
   ```

2. **执行部署**
   ```bash
   chmod +x deploy-serv00-complete.sh
   ./deploy-serv00-complete.sh
   ```

3. **等待完成**
   - 脚本会自动完成所有部署步骤
   - 包括构建、上传、数据库初始化等

### 方法二：手动部署

#### 步骤1：准备环境
```bash
# 安装依赖
npm install

# 构建项目
npm run build
```

#### 步骤2：数据库设置
1. 在 Serv00 控制面板创建 MySQL 数据库
2. 记录数据库连接信息
3. 上传并执行 `database/init.sql`

#### 步骤3：配置API
```bash
# 创建 api/.env 文件
DB_HOST=localhost
DB_NAME=environment_manager
DB_USER=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your_secret_key
```

#### 步骤4：上传文件
```bash
# 使用 FTP/SFTP 上传
# 目标目录: /domains/yourdomain.serv00.net/public_html/
```

## 🗄️ 数据库配置

### 数据库结构
- **environments** - 环境配置表
- **users** - 用户管理表
- **status_history** - 状态历史表
- **user_sessions** - 用户会话表
- **environment_groups** - 环境分组表

### 默认数据
- **管理员账户**：admin / admin123
- **默认分组**：开发环境、生产环境
- **示例环境**：包含4个示例环境配置

### 数据库优化
- 自动索引优化
- 定期清理过期数据
- 连接池管理
- 查询性能优化

## 🔧 配置说明

### 环境变量配置
```bash
# 数据库配置
DB_HOST=localhost
DB_NAME=environment_manager
DB_USER=your_username
DB_PASSWORD=your_password
DB_PORT=3306

# API配置
API_BASE_URL=/api
JWT_SECRET=your_secret_key
JWT_EXPIRATION=86400

# 应用配置
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.serv00.net
```

### Apache配置 (.htaccess)
```apache
# SPA路由支持
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(?!api/).*$ /index.html [L]

# API路由
RewriteRule ^api/(.*)$ /api/index.php [L,QSA]

# 安全配置
Header always set X-Frame-Options DENY
Header always set X-Content-Type-Options nosniff
```

## 🔐 安全配置

### 用户认证
- JWT Token 认证
- 密码哈希存储
- 会话管理
- 权限控制

### 数据安全
- SQL注入防护
- XSS攻击防护
- CSRF保护
- 输入验证

### 服务器安全
- HTTPS强制
- 安全头设置
- 敏感文件保护
- 错误日志管理

## 📊 性能优化

### 前端优化
- 代码分割和懒加载
- 资源压缩和缓存
- CDN加速
- 图片优化

### 后端优化
- 数据库查询优化
- 连接池管理
- 缓存策略
- API响应压缩

### 网络优化
- Gzip压缩
- 浏览器缓存
- 静态资源优化
- 减少HTTP请求

## 🔍 监控和维护

### 健康检查
- API健康状态监控
- 数据库连接检查
- 系统资源监控
- 错误日志分析

### 数据备份
- 自动数据库备份
- 配置文件备份
- 定期备份验证
- 灾难恢复计划

### 更新维护
- 版本更新流程
- 数据迁移脚本
- 回滚策略
- 维护窗口管理

## 🐛 故障排除

### 常见问题

**1. 数据库连接失败**
```bash
# 检查数据库配置
mysql -u username -p database_name

# 检查API配置
curl https://yourdomain.serv00.net/api/health
```

**2. API请求失败**
```bash
# 检查.htaccess配置
# 检查PHP错误日志
# 验证JWT配置
```

**3. 前端加载失败**
```bash
# 检查构建输出
# 验证静态资源路径
# 检查浏览器控制台
```

### 调试工具
- 浏览器开发者工具
- PHP错误日志
- MySQL慢查询日志
- 网络请求分析

## 📞 技术支持

### 文档资源
- [Serv00官方文档](https://serv00.com/help)
- [PHP官方文档](https://php.net/docs.php)
- [MySQL官方文档](https://dev.mysql.com/doc/)
- [React官方文档](https://react.dev/)

### 社区支持
- GitHub Issues
- 技术论坛
- 开发者社区
- 在线文档

## 🎉 部署完成

部署完成后，您将拥有一个功能完整的环境管理系统：

- 🌐 **访问地址**：https://yourdomain.serv00.net
- 👤 **管理员登录**：admin / admin123
- 🔧 **API接口**：https://yourdomain.serv00.net/api
- 📊 **健康检查**：https://yourdomain.serv00.net/api/health

立即开始管理您的环境配置，享受现代化的监控体验！🎊
