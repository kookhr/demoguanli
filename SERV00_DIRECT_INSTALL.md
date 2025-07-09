# 🚀 Serv00 主机直接安装指南

## 📋 概述

这个方案允许您在 Serv00 主机上直接执行安装脚本，无需预先配置任何账号密码信息。脚本会自动检测环境、克隆代码、构建项目并完成部署。

## ✨ 特性

- 🔄 **自动检测**：自动识别 Serv00 用户名、域名和路径
- 📦 **一键部署**：从 Git 克隆到部署完成全自动
- 🗄️ **智能配置**：自动生成数据库和 API 配置
- 🔐 **安全设置**：自动设置文件权限和安全配置
- 🧹 **自动清理**：部署完成后自动清理临时文件

## 🚀 使用方法

### 方法一：一行命令安装（推荐）

在 Serv00 主机的 SSH 终端中执行：

```bash
curl -sSL https://raw.githubusercontent.com/kookhr/demoguanli/serv00/install.sh | bash
```

### 方法二：下载脚本后执行

```bash
# 下载脚本
wget https://raw.githubusercontent.com/kookhr/demoguanli/serv00/serv00-auto-deploy.sh

# 添加执行权限
chmod +x serv00-auto-deploy.sh

# 执行安装
./serv00-auto-deploy.sh
```

### 方法三：手动克隆后执行

```bash
# 克隆项目
git clone -b serv00 https://github.com/kookhr/demoguanli.git

# 进入目录
cd demoguanli

# 执行安装脚本
./serv00-auto-deploy.sh
```

## 📋 安装过程

### 1. 环境检测
脚本会自动检测：
- ✅ Serv00 用户名
- ✅ 可用域名列表
- ✅ 部署路径
- ✅ 系统依赖

### 2. 项目构建
- 📦 克隆 Git 仓库
- 🔧 安装 npm 依赖
- 🏗️ 构建生产版本
- 📝 生成配置文件

### 3. 文件部署
- 📁 复制前端文件到 public_html
- 🔌 部署 PHP API
- 🗄️ 复制数据库脚本
- 🔐 设置文件权限

### 4. 配置生成
- ⚙️ 自动生成 .env 配置
- 🌐 创建 .htaccess 文件
- 🗄️ 生成数据库初始化脚本

## 🗄️ 数据库设置

安装完成后，您需要手动完成数据库设置：

### 1. 在 Serv00 面板中创建数据库
1. 登录 Serv00 控制面板
2. 进入 "Databases" → "MySQL"
3. 创建新数据库：`environment_manager`
4. 记录数据库用户名和密码

### 2. 运行数据库初始化脚本
```bash
# 脚本会自动创建在您的主目录
~/init_database.sh
```

### 3. 验证数据库
```bash
# 检查数据库表
mysql -u your_username -p environment_manager -e "SHOW TABLES;"
```

## 📁 部署结构

安装完成后的文件结构：

```
/usr/home/username/domains/domain.serv00.net/public_html/
├── index.html                 # 前端入口
├── assets/                    # 前端资源
│   ├── css/
│   └── js/
├── api/                       # PHP API
│   ├── config/
│   ├── models/
│   ├── controllers/
│   ├── index.php
│   ├── .env
│   └── .htaccess
├── database/                  # 数据库脚本
│   └── init.sql
└── .htaccess                  # 前端路由配置
```

## 🔧 自动生成的配置

### API 环境配置 (api/.env)
```bash
DB_HOST=localhost
DB_NAME=environment_manager
DB_USER=your_username
DB_PASSWORD=your_password
API_BASE_URL=/api
JWT_SECRET=auto_generated_secret
APP_URL=https://your_domain.serv00.net
```

### 前端路由配置 (.htaccess)
- SPA 路由支持
- API 路由重写
- Gzip 压缩
- 缓存策略
- 安全头设置

## 🎯 安装后步骤

### 1. 访问网站
```
https://your_domain.serv00.net
```

### 2. 管理员登录
- 用户名：`admin`
- 密码：`admin123`

### 3. 立即修改密码
1. 登录后进入用户管理
2. 修改管理员密码
3. 配置其他安全设置

### 4. 添加环境配置
1. 点击"添加环境"
2. 填写环境信息
3. 测试状态检测

## 🔍 故障排除

### 常见问题

**1. 脚本下载失败**
```bash
# 检查网络连接
ping github.com

# 手动下载
wget --no-check-certificate https://raw.githubusercontent.com/kookhr/demoguanli/serv00/serv00-auto-deploy.sh
```

**2. 依赖缺失**
```bash
# 检查 Node.js
node --version

# 检查 npm
npm --version

# 检查 PHP
php --version
```

**3. 权限问题**
```bash
# 检查文件权限
ls -la ~/domains/*/public_html/

# 修复权限
chmod -R 755 ~/domains/*/public_html/
```

**4. 数据库连接失败**
```bash
# 测试数据库连接
mysql -u username -p

# 检查数据库配置
cat ~/domains/*/public_html/api/.env
```

### 日志查看

**PHP 错误日志**
```bash
tail -f /tmp/php_errors.log
```

**应用日志**
```bash
tail -f /tmp/environment_manager.log
```

**Apache 错误日志**
```bash
tail -f ~/domains/*/logs/error.log
```

## 🔄 更新和维护

### 更新到最新版本
```bash
# 重新运行安装脚本即可
curl -sSL https://raw.githubusercontent.com/kookhr/demoguanli/serv00/install.sh | bash
```

### 备份数据
```bash
# 备份数据库
mysqldump -u username -p environment_manager > backup.sql

# 备份配置文件
cp ~/domains/*/public_html/api/.env ~/backup_env
```

### 恢复数据
```bash
# 恢复数据库
mysql -u username -p environment_manager < backup.sql

# 恢复配置
cp ~/backup_env ~/domains/*/public_html/api/.env
```

## 📊 性能优化

### 启用缓存
脚本已自动配置：
- ✅ Gzip 压缩
- ✅ 浏览器缓存
- ✅ 静态资源缓存

### 数据库优化
```sql
-- 添加索引（如需要）
ALTER TABLE status_history ADD INDEX idx_checked_at (checked_at);
ALTER TABLE environments ADD INDEX idx_name (name);
```

## 🔒 安全建议

### 1. 立即修改默认密码
- 管理员密码：admin123 → 强密码

### 2. 定期备份
- 数据库备份
- 配置文件备份

### 3. 监控日志
- 定期检查错误日志
- 监控异常访问

### 4. 更新维护
- 定期更新到最新版本
- 关注安全公告

## 💡 高级配置

### 自定义域名
如果您有自己的域名：
1. 在 Serv00 面板中添加域名
2. 重新运行安装脚本
3. 脚本会自动检测新域名

### 多环境部署
可以在不同子目录部署多个实例：
```bash
# 修改脚本中的 PROJECT_NAME
PROJECT_NAME="env-manager-dev"
```

### SSL 证书
Serv00 自动提供 Let's Encrypt 证书，无需额外配置。

## 🆘 技术支持

如果遇到问题：

1. **查看日志**：检查错误日志文件
2. **重新安装**：删除文件后重新运行脚本
3. **联系支持**：提供详细的错误信息

---

🎉 **享受您的免费环境管理系统！**
