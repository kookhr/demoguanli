# 🚀 Serv00 环境管理系统交互式安装指南

## 📋 概述

这是一个全新的交互式安装脚本，专为 Serv00 主机环境设计，支持自定义域名、数据库配置和完整的系统部署。

## ✨ 主要特性

### 🔧 交互式配置
- **自定义域名支持**: 支持 Cloudflare 托管的域名
- **数据库配置**: 自动配置远程 MySQL 数据库
- **端口配置**: 支持 Serv00 自定义端口
- **配置验证**: 实时验证输入的有效性

### 🛡️ 安全特性
- **配置预览**: 安装前确认所有配置
- **数据库连接测试**: 验证数据库连接
- **密码安全输入**: 密码输入时不显示明文
- **权限管理**: 自动设置正确的文件权限

### 🎯 Serv00 优化
- **FreeBSD 兼容**: 针对 FreeBSD 环境优化
- **Node.js 版本检测**: 自动处理版本兼容性
- **域名目录结构**: 符合 Serv00 标准结构
- **管理脚本**: 自动生成数据库和站点管理工具

## 🚀 快速开始

### 方法1: 直接运行（推荐）

```bash
curl -sSL https://raw.githubusercontent.com/kookhr/demoguanli/serv00/interactive-install.sh | bash
```

### 方法2: 下载后运行

```bash
# 下载脚本
wget https://raw.githubusercontent.com/kookhr/demoguanli/serv00/interactive-install.sh

# 添加执行权限
chmod +x interactive-install.sh

# 运行安装
./interactive-install.sh
```

## 📝 安装流程

### 步骤1: 系统环境检查
脚本会自动检查：
- 操作系统类型（FreeBSD 优化）
- 必要工具（curl, git, npm, node）
- Node.js 版本兼容性

### 步骤2: 配置信息收集
交互式输入以下信息：

#### 🌐 域名配置
```
请输入自定义域名 [默认: username.serv00.net]: your-domain.com
```

#### 🗄️ 数据库配置
```
数据库服务器地址 [默认: localhost]: mysql14.serv00.com
数据库名称 [默认: environment_manager]: m9785_environment_manager
数据库用户名: m9785_username
数据库密码: ****
```

#### ⚙️ 其他配置
```
自定义端口号 (1024-65535) [默认: 3000]: 3000
API 基础路径 [默认: /api]: /api
```

### 步骤3: 配置验证
- 显示配置预览
- 测试数据库连接
- 用户确认配置

### 步骤4-10: 自动安装
- 设置安装目录
- 下载项目文件
- 生成配置文件
- 构建项目
- 初始化数据库
- 设置权限
- 生成管理脚本

## 🎯 安装完成后

### 🌐 访问网站
- **网站地址**: https://your-domain.com
- **API 地址**: https://your-domain.com/api/health
- **默认登录**: admin / admin123

### 🔧 管理工具

#### 数据库管理
```bash
# 连接数据库
~/manage_database.sh connect

# 备份数据库
~/manage_database.sh backup

# 重新初始化数据库
~/manage_database.sh init
```

#### 站点管理
```bash
# 更新站点
~/manage_site.sh update

# 检查状态
~/manage_site.sh status

# 查看日志
~/manage_site.sh logs
```

## 🌐 Cloudflare DNS 配置

如果使用自定义域名，需要在 Cloudflare 中配置 DNS：

### A 记录配置
```
Type: A
Name: @ (或子域名，如 env)
Content: [Serv00服务器IP]
Proxy status: 可选择开启或关闭
```

### SSL/TLS 设置
- **加密模式**: Full 或 Full (strict)
- **边缘证书**: 启用
- **HSTS**: 可选启用

## 🔍 故障排除

### 常见问题

#### 1. 数据库连接失败
```bash
# 检查数据库配置
cat ~/domains/your-domain.com/public_html/api/.env

# 手动测试连接
mysql -h mysql14.serv00.com -u username -p database_name
```

#### 2. 构建失败
```bash
# 检查 Node.js 版本
node --version

# 清理并重新安装
cd ~/domains/your-domain.com/public_html
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### 3. 权限问题
```bash
# 重新设置权限
cd ~/domains/your-domain.com/public_html
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
chmod -R 755 api/
```

### 重新安装
如果需要重新安装：

```bash
# 删除现有安装
rm -rf ~/domains/your-domain.com/public_html

# 重新运行安装脚本
curl -sSL https://raw.githubusercontent.com/kookhr/demoguanli/serv00/interactive-install.sh | bash
```

## 📞 支持

如果遇到问题：

1. **检查日志**: `tail -f /tmp/environment_manager.log`
2. **查看 API 状态**: `curl https://your-domain.com/api/health`
3. **重新运行安装**: 使用交互式脚本重新配置

## 🎉 功能特性

安装完成后，您将拥有：

- ✅ 现代化的环境管理界面
- ✅ 实时状态检测
- ✅ 用户认证和权限管理
- ✅ 环境分组和标签
- ✅ 状态历史记录
- ✅ 深色模式支持
- ✅ 响应式设计
- ✅ API 接口

立即开始使用您的环境管理系统吧！🚀
