# 🌐 环境管理系统 - Serv00 版本

一个专为 Serv00 主机优化的现代化环境管理和监控系统，使用 MySQL/PostgreSQL 数据库存储，完全免费部署。

## 🌟 主要特性

### 核心功能
- 🌐 **环境管理**：添加、编辑、删除环境配置
- 🔍 **状态检测**：实时网络可达性检测，支持多种检测策略
- 📊 **状态历史**：24小时状态记录和趋势分析
- 🏷️ **标签管理**：彩色标签分类和筛选
- 👥 **用户管理**：基于角色的权限控制
- 📱 **响应式设计**：完美适配各种设备

### UI 特色
- 💎 **Apple Liquid Glass 设计**：现代化液态玻璃效果
- 🌙 **暗黑模式**：完整的明暗主题切换
- 🎨 **状态色彩区分**：绿色=可达，红色=不可达，蓝色=检测中
- 📱 **3列响应式布局**：优雅的卡片网格设计

## 🏗️ 技术架构

### 前端技术栈
- **React 18** + **Vite** - 现代化前端框架
- **Tailwind CSS** - 原子化CSS框架
- **Lucide React** - 现代图标库
- **React Router** - 客户端路由

### 后端技术栈
- **PHP 8.0+** - 服务端语言
- **MySQL/PostgreSQL** - 关系型数据库
- **RESTful API** - 标准化接口设计
- **JWT 认证** - 安全的用户认证

### 部署环境
- **Serv00 免费主机** - 静态文件托管
- **Apache/Nginx** - Web服务器
- **SSL/HTTPS** - 安全传输协议

## 🚀 一键部署

### 快速部署（推荐）

1. **配置部署脚本**
   ```bash
   # 编辑 deploy-serv00-complete.sh
   SERV00_USER="your_username"           # 您的Serv00用户名
   SERV00_DOMAIN="your_domain.serv00.net" # 您的域名
   DB_USER="your_db_user"                # 数据库用户名
   DB_PASSWORD="your_db_password"        # 数据库密码
   ```

2. **执行一键部署**
   ```bash
   chmod +x deploy-serv00-complete.sh
   ./deploy-serv00-complete.sh
   ```

3. **访问您的网站**
   - 🌐 网站地址：https://your_domain.serv00.net
   - 👤 管理员登录：admin / admin123

### 手动部署

#### 步骤1：构建项目
```bash
npm install
npm run build
```

#### 步骤2：数据库设置
1. 在 Serv00 控制面板创建 MySQL 数据库
2. 上传并执行 `database/init.sql`

#### 步骤3：上传文件
```bash
# 上传 dist/ 和 api/ 目录到 public_html/
rsync -avz dist/ user@domain.serv00.net:domains/domain.serv00.net/public_html/
rsync -avz api/ user@domain.serv00.net:domains/domain.serv00.net/public_html/api/
```

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

## 🗄️ 数据库设计

### 核心表结构
- **environments** - 环境配置表
- **users** - 用户管理表
- **status_history** - 状态历史表
- **user_sessions** - 用户会话表
- **environment_groups** - 环境分组表

### 默认数据
- **管理员账户**：admin / admin123
- **默认分组**：开发环境、生产环境
- **示例环境**：包含4个示例环境配置

## 🔧 配置说明

### 环境变量配置
```bash
# 数据库配置
DB_HOST=localhost
DB_NAME=environment_manager
DB_USER=your_username
DB_PASSWORD=your_password

# API配置
API_BASE_URL=/api
JWT_SECRET=your_secret_key
JWT_EXPIRATION=86400

# 应用配置
APP_ENV=production
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
```

## 🎯 功能特性

### 环境管理
- ✅ 添加/编辑/删除环境
- ✅ 环境分组管理
- ✅ 标签分类系统
- ✅ 批量操作支持

### 状态监控
- ✅ 实时状态检测
- ✅ 历史记录追踪
- ✅ 响应时间统计
- ✅ 可用率分析

### 用户系统
- ✅ 用户注册/登录
- ✅ 角色权限管理
- ✅ 密码安全策略
- ✅ 会话管理

### UI/UX
- ✅ 液态玻璃设计
- ✅ 暗黑模式切换
- ✅ 响应式布局
- ✅ 平滑动画效果

## 🔒 安全特性

- 🔐 **JWT 认证**：安全的用户认证
- 🛡️ **XSS 防护**：输入验证和转义
- 🔒 **CSRF 保护**：跨站请求伪造防护
- 🚫 **SQL 注入防护**：参数化查询

## 📊 性能优化

- 🚀 **代码分割**：按需加载组件
- 📦 **资源压缩**：Gzip + Brotli 压缩
- 🎯 **缓存策略**：智能缓存管理
- ⚡ **懒加载**：图片和组件懒加载

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
- 检查 .htaccess 配置
- 检查 PHP 错误日志
- 验证 JWT 配置

**3. 前端加载失败**
- 检查构建输出
- 验证静态资源路径
- 检查浏览器控制台

## 📚 相关文档

- 📖 [完整部署指南](SERV00_DEPLOYMENT_COMPLETE.md)
- 🔀 [分支对比说明](BRANCH_COMPARISON.md)
- 🔧 [API 文档](API_DOCUMENTATION.md)

## 💰 成本优势

### Serv00 免费方案
```
✅ 免费主机空间：3GB
✅ 免费数据库：MySQL/PostgreSQL
✅ 免费SSL证书：Let's Encrypt
✅ 免费域名：*.serv00.net
✅ 无流量限制
✅ 无时间限制
总成本：$0
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🆘 技术支持

- 📧 **Issues**：[GitHub Issues](https://github.com/your-repo/issues)
- 💬 **讨论**：[GitHub Discussions](https://github.com/your-repo/discussions)
- 📖 **文档**：查看项目文档目录

---

⭐ 如果这个项目对您有帮助，请给它一个星标！

🎉 **立即开始使用完全免费的环境管理系统！**
