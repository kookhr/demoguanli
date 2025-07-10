# Serv00 环境管理系统部署指南

## 📋 项目概述

这是一个专为 Serv00 主机优化的现代化环境管理系统，支持多环境配置、实时状态监控和用户权限管理。

### 🎯 核心特性
- **多环境管理**: 开发、测试、生产环境统一管理
- **实时监控**: HTTP(S) 状态检测和响应时间统计
- **用户权限**: 基于角色的访问控制 (admin/user)
- **Apple Liquid Glass UI**: 现代化玻璃质感设计
- **Serv00 优化**: 专为 FreeBSD 环境和 `/dist/` 代理配置优化

### 🛠️ 技术栈
- **前端**: React 19 + Vite 5 + Tailwind CSS 3
- **后端**: PHP 8+ + MySQL/MariaDB
- **部署**: Apache + .htaccess 重写规则

## 🚀 快速部署

### 方法一：一键安装（推荐）

```bash
bash -i <(curl -SL https://raw.githubusercontent.com/kookhr/demoguanli/serv00/serv00-deploy.sh)
```

### 方法二：手动部署

1. **下载项目文件**
   ```bash
   git clone -b serv00 https://github.com/kookhr/demoguanli.git
   cd demoguanli
   ```

2. **运行部署测试**
   ```bash
   chmod +x test-deployment.sh
   ./test-deployment.sh
   ```

3. **创建生产包**
   ```bash
   chmod +x create-production-package.sh
   ./create-production-package.sh
   ```

4. **上传到 Serv00**
   - 将生成的 `serv00-demoguanli-1.0.0.tar.gz` 上传到您的域名目录
   - 解压文件：`tar -xzf serv00-demoguanli-1.0.0.tar.gz`

5. **运行安装脚本**
   ```bash
   ./serv00-deploy.sh
   ```

## 🔧 详细配置

### 1. 系统要求

**必需组件**:
- PHP 8.0+ (支持 PDO, MySQL, JSON, cURL, mbstring)
- MySQL 5.7+ 或 MariaDB 10.3+
- Apache 2.4+ (支持 .htaccess 重写)

**可选组件**:
- Node.js 18+ (用于前端构建)
- Git (用于版本控制)

### 2. 数据库配置

创建数据库和用户：
```sql
CREATE DATABASE environment_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'env_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON environment_manager.* TO 'env_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. 环境变量配置

创建 `.env` 文件：
```env
# 数据库配置
DB_HOST=localhost
DB_NAME=environment_manager
DB_USER=env_user
DB_PASSWORD=your_secure_password

# 应用配置
APP_DEBUG=false
APP_URL=https://yourdomain.serv00.net
APP_PORT=3000

# 安全配置
JWT_SECRET=your-random-secret-key-here

# 邮件配置 (可选)
MAIL_DRIVER=smtp
MAIL_HOST=mail.serv00.com
MAIL_PORT=587
MAIL_USERNAME=your_email@serv00.net
MAIL_PASSWORD=your_email_password
MAIL_ENCRYPTION=tls
```

### 4. Serv00 特定配置

#### 域名配置
直接域名访问配置：
1. Serv00 面板中代理路径保持为空
2. 前端文件直接部署到域名根目录

#### 文件权限
```bash
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
chmod +x *.sh
```

## 📁 文件结构

```
serv00-deployment/
├── index.html              # 前端主页面
├── assets/                 # 前端资源文件
│   ├── *.js
│   ├── *.css
│   └── ...
├── api/                    # 后端 API
│   ├── index.php           # API 入口
│   ├── config/
│   │   ├── database.php
│   │   └── serv00-config.php
│   ├── controllers/
│   ├── models/
│   └── .htaccess
├── database/               # 数据库
│   └── init.sql
├── .htaccess              # Apache 配置
├── .env                   # 环境配置
├── serv00-deploy.sh       # 部署脚本
└── README.md              # 说明文档
```

## 🔐 安全配置

### 1. 默认账户
- **用户名**: `admin`
- **密码**: `admin123`

⚠️ **重要**: 首次登录后立即修改密码！

### 2. 安全建议
- 定期更新 JWT 密钥
- 启用 HTTPS
- 限制数据库用户权限
- 定期备份数据
- 监控访问日志

## 🔍 故障排除

### 常见问题

1. **API 无法访问**
   - 检查 `.htaccess` 文件是否正确
   - 验证 PHP 扩展是否完整
   - 查看错误日志：`/tmp/serv00-php-errors.log`

2. **数据库连接失败**
   - 验证数据库配置
   - 检查用户权限
   - 测试连接：`mysql -u username -p`

3. **前端页面空白**
   - 检查 `index.html` 是否存在于根目录
   - 验证静态资源路径
   - 查看浏览器控制台错误

4. **MIME 类型错误**
   - 确保 `.htaccess` 包含 MIME 类型设置
   - 检查 Apache 模块是否启用

### 调试工具

1. **健康检查**
   ```
   https://yourdomain.com/api/health
   ```

2. **环境信息**
   ```php
   <?php
   require_once 'api/config/serv00-config.php';
   print_r(Serv00Config::getEnvironmentInfo());
   ?>
   ```

3. **日志查看**
   ```bash
   tail -f /tmp/serv00-php-errors.log
   ```

## 📊 性能优化

### 1. 缓存配置
- 静态资源缓存：1个月
- HTML 文件缓存：1小时
- API 响应：不缓存

### 2. 压缩设置
- 启用 Gzip 压缩
- 压缩 CSS、JS、HTML
- 优化图片资源

### 3. 数据库优化
- 使用连接池
- 启用查询缓存
- 定期清理历史数据

## 🔄 更新和维护

### 1. 系统更新
```bash
# 备份当前版本
cp -r current-installation backup-$(date +%Y%m%d)

# 下载新版本
curl -L https://github.com/kookhr/demoguanli/releases/latest/download/serv00-demoguanli.tar.gz -o update.tar.gz

# 解压并更新
tar -xzf update.tar.gz
./update-script.sh
```

### 2. 数据备份
```bash
# 数据库备份
mysqldump -u username -p environment_manager > backup-$(date +%Y%m%d).sql

# 文件备份
tar -czf files-backup-$(date +%Y%m%d).tar.gz uploads/ logs/ .env
```

### 3. 监控建议
- 设置状态检查定时任务
- 监控磁盘空间使用
- 定期检查错误日志
- 监控数据库性能

## 📞 技术支持

### 获取帮助
1. 查看项目文档：[GitHub Repository](https://github.com/kookhr/demoguanli/tree/serv00)
2. 提交问题：[Issues](https://github.com/kookhr/demoguanli/issues)
3. 社区讨论：[Discussions](https://github.com/kookhr/demoguanli/discussions)

### 联系方式
- 邮箱：support@yourdomain.com
- QQ群：123456789
- 微信群：扫描二维码加入

## 📄 许可证

本项目采用 MIT 许可证，详见 [LICENSE](LICENSE) 文件。

---

**版本**: 1.0.0  
**更新时间**: 2025-01-10  
**适用平台**: Serv00 FreeBSD
