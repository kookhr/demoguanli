# 环境管理系统 - Serv00 部署版本

[![Serv00 部署](https://img.shields.io/badge/Serv00-部署就绪-green)](https://github.com/kookhr/demoguanli/tree/serv00)
[![版本](https://img.shields.io/badge/版本-1.0.0-blue)](https://github.com/kookhr/demoguanli/releases)
[![许可证](https://img.shields.io/badge/许可证-MIT-yellow)](LICENSE)

专为 Serv00 主机优化的现代化环境管理系统，支持多环境配置、实时状态监控和用户权限管理。

## 🎯 特性

- 🌐 **多环境管理**: 支持开发、测试、生产等多种环境
- 📊 **实时状态监控**: 自动检测环境可用性和响应时间  
- 🔐 **用户权限管理**: 基于角色的访问控制
- 📱 **响应式设计**: 支持桌面和移动设备
- 🎨 **Apple Liquid Glass UI**: 现代化玻璃质感设计
- 🔄 **配置导入导出**: 支持JSON格式的配置管理
- 🏷️ **标签系统**: 环境分类和快速筛选
- 🚀 **Serv00 优化**: 专为 Serv00 FreeBSD 环境优化

## 🛠️ 技术栈

- **前端**: React 19 + Vite 5 + Tailwind CSS 3
- **后端**: PHP 8+ + MySQL/MariaDB
- **部署**: Apache + .htaccess 重写规则

## 🚀 一键部署

### 快速部署（推荐）

```bash
bash -i <(curl -SL https://raw.githubusercontent.com/kookhr/demoguanli/serv00/serv00-deploy.sh)
```

### 手动部署

```bash
# 1. 克隆项目
git clone -b serv00 https://github.com/kookhr/demoguanli.git
cd demoguanli

# 2. 运行部署测试
./test-deployment.sh

# 3. 创建生产包
./create-production-package.sh

# 4. 上传到 Serv00 并运行安装
./serv00-deploy.sh
```

## 📋 系统要求

### 必需组件
- **PHP**: 8.0+ (支持 PDO, MySQL, JSON, cURL, mbstring)
- **数据库**: MySQL 5.7+ 或 MariaDB 10.3+
- **Web服务器**: Apache 2.4+ (支持 .htaccess 重写)

### 推荐配置
- **内存**: 256MB+
- **磁盘**: 100MB+
- **带宽**: 无特殊要求

## 📁 部署后文件结构

```
yourdomain.serv00.net/
├── index.html              # 前端主页面
├── assets/                 # 前端资源文件
│   ├── index-*.js
│   ├── index-*.css
│   └── ...
├── api/                    # 后端 API
│   ├── index.php           # API 入口
│   ├── config/
│   │   ├── database.php
│   │   └── serv00-config.php
│   ├── controllers/
│   │   ├── AuthController.php
│   │   ├── EnvironmentController.php
│   │   └── UserController.php
│   ├── models/
│   │   ├── Environment.php
│   │   ├── User.php
│   │   └── StatusHistory.php
│   └── .htaccess
├── database/               # 数据库文件
│   └── init.sql
├── .htaccess              # Apache 配置
└── .env                   # 环境配置
```

## 🔧 配置说明

### 数据库配置
```env
DB_HOST=localhost
DB_NAME=environment_manager
DB_USER=your_username
DB_PASSWORD=your_password
```

### 应用配置
```env
APP_URL=https://yourdomain.serv00.net
APP_PORT=3000
APP_DEBUG=false
JWT_SECRET=your-secret-key
```

## 🔐 默认账户

- **用户名**: `admin`
- **密码**: `admin123`

⚠️ **重要**: 首次登录后立即修改密码！

## 🔍 验证部署

### 访问地址
- **前端**: `https://yourdomain.serv00.net`
- **API健康检查**: `https://yourdomain.serv00.net/api/health`

### 功能检查
- ✅ 用户登录
- ✅ 环境列表显示
- ✅ 状态检测功能
- ✅ 配置管理
- ✅ 用户权限管理

## 🛠️ 故障排除

### 常见问题

**页面显示空白**
```bash
# 检查文件
ls -la index.html assets/

# 检查 .htaccess
cat .htaccess
```

**API 无法访问**
```bash
# 查看 PHP 错误日志
tail -f /tmp/serv00-php-errors.log

# 测试 API
curl https://yourdomain.serv00.net/api/health
```

**数据库连接失败**
```bash
# 测试数据库连接
mysql -h localhost -u username -p database_name
```

### 调试工具
- **健康检查**: `/api/health`
- **错误日志**: `/tmp/serv00-php-errors.log`
- **环境信息**: `Serv00Config::getEnvironmentInfo()`

## 📊 性能优化

### 已启用优化
- ✅ 静态资源缓存 (1个月)
- ✅ Gzip 压缩
- ✅ PHP OPcache (如果可用)
- ✅ 数据库连接池
- ✅ MIME 类型优化

### 缓存设置
```apache
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

## 🔄 更新维护

### 更新步骤
```bash
# 1. 备份当前版本
cp -r current-installation backup-$(date +%Y%m%d)

# 2. 下载新版本
curl -L https://github.com/kookhr/demoguanli/releases/latest/download/serv00-demoguanli.tar.gz -o update.tar.gz

# 3. 解压并更新
tar -xzf update.tar.gz
./serv00-deploy.sh
```

### 数据备份
```bash
# 数据库备份
mysqldump -u username -p environment_manager > backup-$(date +%Y%m%d).sql

# 配置备份
cp .env .env.backup
```

## 📞 技术支持

### 获取帮助
- 📖 [完整部署指南](SERV00-DEPLOYMENT-GUIDE.md)
- 📖 [简化部署指南](SERV00-SIMPLE-DEPLOY.md)
- 🐛 [问题反馈](https://github.com/kookhr/demoguanli/issues)
- 💬 [讨论区](https://github.com/kookhr/demoguanli/discussions)

### 相关文档
- [部署测试脚本](test-deployment.sh)
- [生产包创建脚本](create-production-package.sh)
- [Serv00 专用配置](serv00-config.php)

## 📄 许可证

本项目采用 MIT 许可证，详见 [LICENSE](LICENSE) 文件。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发环境
```bash
# 克隆开发分支
git clone https://github.com/kookhr/demoguanli.git
cd demoguanli

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 📈 版本历史

- **v1.0.0** - Serv00 优化版本
  - 专为 Serv00 FreeBSD 环境优化
  - 一键部署脚本
  - 直接域名访问支持
  - 完整的测试和验证工具

---

**仓库地址**: https://github.com/kookhr/demoguanli/tree/serv00  
**部署分支**: serv00  
**适用平台**: Serv00 FreeBSD  
**版本**: 1.0.0
