# Serv00 环境管理系统 - 简化部署指南

## 🎯 部署概述

本项目已针对 **Serv00 代理路径为空** 的配置进行优化，前端文件直接部署到域名根目录。

### 📁 最终文件结构
```
yourdomain.serv00.net/
├── index.html              # 前端主页面
├── assets/                 # 前端资源 (CSS/JS)
│   ├── index-*.js
│   ├── index-*.css
│   └── ...
├── api/                    # 后端 API
│   ├── index.php
│   ├── config/
│   ├── controllers/
│   └── models/
├── database/               # 数据库文件
│   └── init.sql
├── .htaccess              # Apache 配置
└── .env                   # 环境配置
```

## 🚀 一键部署

### 方法一：直接运行（推荐）
```bash
bash -i <(curl -SL https://raw.githubusercontent.com/kookhr/demoguanli/serv00/serv00-deploy.sh)
```

### 方法二：下载后运行
```bash
# 下载部署脚本
curl -O https://raw.githubusercontent.com/kookhr/demoguanli/serv00/serv00-deploy.sh
chmod +x serv00-deploy.sh

# 运行部署
./serv00-deploy.sh
```

## 🔧 部署流程

### 1. 自动检测环境
- ✅ FreeBSD 系统检测
- ✅ PHP 版本和扩展检查
- ✅ MySQL 客户端验证
- ✅ Apache 配置检查

### 2. 交互式配置
```
请输入安装目录 [默认: ~/domains/用户名.serv00.net/public_html]: 
请输入自定义端口 [默认: 3000]: 
数据库主机 [默认: localhost]: 
数据库名称 [默认: environment_manager]: 
数据库用户名: your_db_user
数据库密码: ********
域名 [默认: 用户名.serv00.net]: 
```

### 3. 自动部署
- ✅ 下载项目文件
- ✅ 构建前端项目
- ✅ 部署到根目录
- ✅ 配置数据库连接
- ✅ 设置 Apache 重写规则
- ✅ 导入数据库结构
- ✅ 设置文件权限

## 📋 关键配置

### Apache .htaccess
```apache
# API 路由
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ api/index.php [QSA,L]

# 前端路由 (React Router)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api/
RewriteRule . /index.html [L]
```

### 环境变量 (.env)
```env
DB_HOST=localhost
DB_NAME=environment_manager
DB_USER=your_username
DB_PASSWORD=your_password
APP_URL=https://yourdomain.serv00.net
APP_PORT=3000
```

## 🔐 默认账户

部署完成后使用以下账户登录：
- **用户名**: `admin`
- **密码**: `admin123`

⚠️ **重要**: 首次登录后立即修改密码！

## 🔍 验证部署

### 1. 检查文件
确保以下文件存在：
- ✅ `index.html` (根目录)
- ✅ `assets/` 目录
- ✅ `api/index.php`
- ✅ `.htaccess`

### 2. 测试访问
- **前端**: `https://yourdomain.serv00.net`
- **API健康检查**: `https://yourdomain.serv00.net/api/health`

### 3. 功能测试
- ✅ 用户登录
- ✅ 环境列表显示
- ✅ 状态检测功能
- ✅ 配置管理

## 🛠️ 故障排除

### 常见问题

**1. 页面显示空白**
```bash
# 检查文件是否存在
ls -la index.html
ls -la assets/

# 检查 .htaccess 配置
cat .htaccess
```

**2. API 无法访问**
```bash
# 检查 PHP 错误日志
tail -f /tmp/serv00-php-errors.log

# 测试 API 健康检查
curl https://yourdomain.serv00.net/api/health
```

**3. 数据库连接失败**
```bash
# 测试数据库连接
mysql -h localhost -u username -p database_name
```

**4. 静态资源 404**
- 检查 MIME 类型配置
- 验证文件路径
- 查看 Apache 错误日志

### 调试命令
```bash
# 查看 PHP 配置
php -i | grep -E "(version|extension)"

# 检查文件权限
find . -type f -name "*.php" -exec ls -la {} \;

# 测试重写规则
curl -I https://yourdomain.serv00.net/api/health
```

## 📊 性能优化

### 已启用的优化
- ✅ 静态资源缓存 (1个月)
- ✅ Gzip 压缩
- ✅ PHP OPcache (如果可用)
- ✅ 数据库连接池

### 建议设置
```apache
# 在 .htaccess 中已包含
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

## 🔄 更新部署

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
# 备份数据库
mysqldump -u username -p environment_manager > backup-$(date +%Y%m%d).sql

# 备份配置文件
cp .env .env.backup
```

## 📞 技术支持

### 获取帮助
- 📖 [完整文档](SERV00-DEPLOYMENT-GUIDE.md)
- 🐛 [问题反馈](https://github.com/kookhr/demoguanli/issues)
- 💬 [讨论区](https://github.com/kookhr/demoguanli/discussions)

### 日志位置
- PHP 错误: `/tmp/serv00-php-errors.log`
- Apache 错误: `/usr/local/www/apache24/logs/error.log`
- 应用日志: `/tmp/serv00-logs/`

## ✅ 部署检查清单

部署完成后请确认：

- [ ] 前端页面正常显示
- [ ] API 健康检查返回正常
- [ ] 用户登录功能正常
- [ ] 环境管理功能可用
- [ ] 状态检测功能正常
- [ ] 数据库连接正常
- [ ] 文件权限设置正确
- [ ] 已修改默认密码
- [ ] 已配置备份策略

---

**部署方案**: 直接域名访问 (无代理路径)  
**适用环境**: Serv00 FreeBSD  
**版本**: 1.0.0
