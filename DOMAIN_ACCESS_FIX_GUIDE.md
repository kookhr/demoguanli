# 🌐 Serv00 域名访问修复指南

## 📋 问题描述

**问题**: 域名访问时没有指向 `dist` 目录，而是指向了根目录，导致前端无法正确加载。

**现象**:
- ✅ 公网 IP 访问正常
- ❌ 域名访问显示错误或白屏
- 🔍 域名访问指向根目录而非 `dist` 目录

---

## 🎯 解决方案

### 方案 1: 移动 dist 内容到根目录（推荐）

这是最简单有效的解决方案：

```bash
# 1. 运行自动修复脚本
./fix-directory-structure.sh -b

# 2. 验证修复结果
./verify-domain-access.sh -v
```

**优点**:
- ✅ 最简单，无需复杂配置
- ✅ 兼容性最好
- ✅ 性能最优

**操作步骤**:
1. 备份当前配置
2. 将 `dist/*` 移动到根目录
3. 更新启动脚本路径
4. 重启服务

### 方案 2: 配置 Apache 重写规则

保持 `dist` 目录结构，通过 `.htaccess` 重写：

```bash
# 运行 Apache 配置脚本
./configure-apache-docroot.sh
```

**配置内容**:
```apache
<IfModule mod_rewrite.c>
RewriteEngine On

# API requests to api/index.php
RewriteRule ^api/(.*)$ api/index.php [L]

# Redirect all other requests to dist directory
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/dist/
RewriteCond %{REQUEST_URI} !^/api/
RewriteRule ^(.*)$ dist/$1 [L]

# Handle dist directory requests
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} ^/dist/
RewriteRule ^dist/(.*)$ dist/index.html [L]

</IfModule>
```

---

## 🔧 快速修复

### 一键修复命令

```bash
# 检查当前状态
./verify-domain-access.sh

# 自动修复（推荐）
./fix-directory-structure.sh -f

# 或者选择配置方案
./configure-apache-docroot.sh
```

### 手动修复步骤

如果您想手动操作：

```bash
# 1. 检查当前目录结构
ls -la
ls -la dist/

# 2. 备份重要文件
cp -r dist dist_backup

# 3. 移动 dist 内容到根目录
cd dist
mv * ../
mv .* ../ 2>/dev/null || true
cd ..

# 4. 删除空的 dist 目录
rmdir dist

# 5. 更新启动脚本
sed -i 's|cd dist|# cd dist|g' start-server.sh

# 6. 重启服务
./restart-server.sh -d
```

---

## 📊 目录结构对比

### 修复前（问题状态）

```
~/domains/your-domain.serv00.net/public_html/
├── dist/                    # 前端文件在这里
│   ├── index.html          # 实际的应用入口
│   ├── assets/             # 静态资源
│   └── .htaccess
├── api/                    # API 后端
├── start-server.sh         # 启动脚本
└── demo-config.json        # 配置文件

访问流程：
域名访问 → public_html/ → 找不到 index.html → 错误
```

### 修复后（正确状态）

```
~/domains/your-domain.serv00.net/public_html/
├── index.html              # 应用入口（从 dist 移动）
├── assets/                 # 静态资源（从 dist 移动）
├── .htaccess               # 路由配置
├── api/                    # API 后端
├── start-server.sh         # 启动脚本
└── demo-config.json        # 配置文件

访问流程：
域名访问 → public_html/ → index.html → React 应用加载 ✅
```

---

## 🧪 验证修复

### 自动验证

```bash
# 运行验证脚本
./verify-domain-access.sh -v

# 预期输出
✅ index.html 在根目录
✅ assets 目录在根目录
✅ api 目录存在
✅ .htaccess 文件存在
✅ 找到 SPA 路由配置
```

### 手动验证

```bash
# 1. 检查文件结构
ls -la | grep -E "(index.html|assets|api)"

# 2. 测试域名访问
curl -I https://your-domain.serv00.net/

# 3. 测试 API 访问
curl https://your-domain.serv00.net/api/health

# 4. 检查服务状态
./status-server.sh -v
```

---

## 🔄 部署脚本更新

新的部署脚本已包含目录结构选择：

```bash
# 重新部署时会询问目录结构配置
bash -i <(curl -SL https://raw.githubusercontent.com/kookhr/demoguanli/serv00/interactive-install.sh)

# 部署过程中会看到：
⚠️  重要：Serv00 目录结构配置

域名访问需要正确的目录结构。请选择配置方案：
  1. 移动 dist 内容到根目录 (推荐，最简单)
  2. 保持 dist 目录结构 (需要额外配置)

请选择 [1-2]:
```

---

## 🛠️ 工具脚本说明

### 1. fix-directory-structure.sh

**功能**: 将 dist 内容移动到根目录

```bash
# 基本用法
./fix-directory-structure.sh

# 创建备份
./fix-directory-structure.sh -b

# 强制执行
./fix-directory-structure.sh -f

# 恢复备份
./fix-directory-structure.sh -r
```

### 2. configure-apache-docroot.sh

**功能**: 配置 Apache 重写规则

```bash
# 交互式配置
./configure-apache-docroot.sh

# 提供多种方案选择：
# 1. .htaccess 重写规则
# 2. 符号链接方案
# 3. HTML 重定向方案
# 4. 移动 dist 内容（推荐）
```

### 3. verify-domain-access.sh

**功能**: 验证域名访问配置

```bash
# 基本验证
./verify-domain-access.sh

# 详细模式
./verify-domain-access.sh -v

# 自动修复
./verify-domain-access.sh -f

# 指定域名
./verify-domain-access.sh your-domain.serv00.net
```

### 4. check-deployment.sh

**功能**: 检查整体部署状态

```bash
# 全面检查
./check-deployment.sh

# 检查内容：
# - 目录结构
# - 配置文件
# - 服务状态
# - 访问地址
```

---

## 🚨 故障排除

### 常见问题

#### 1. 移动文件后服务无法启动

**原因**: 启动脚本仍然尝试进入 dist 目录

**解决**:
```bash
# 检查启动脚本
grep "cd dist" start-server.sh

# 修复启动脚本
sed -i 's|cd dist|# cd dist|g' start-server.sh
```

#### 2. 静态资源 404 错误

**原因**: assets 目录路径不正确

**解决**:
```bash
# 检查 assets 目录位置
ls -la assets/

# 如果不存在，检查是否还在 dist 中
ls -la dist/assets/

# 移动到根目录
mv dist/assets ./
```

#### 3. API 路由不工作

**原因**: .htaccess 配置问题

**解决**:
```bash
# 检查 .htaccess 配置
grep "api" .htaccess

# 确保包含 API 路由规则
RewriteRule ^api/(.*)$ api/index.php [L]
```

### 调试命令

```bash
# 1. 检查 Apache 错误日志
tail -f /var/log/httpd/error_log

# 2. 检查访问日志
tail -f /var/log/httpd/access_log

# 3. 测试重写规则
curl -v https://your-domain.serv00.net/

# 4. 检查文件权限
ls -la index.html assets/ api/
```

---

## 📋 检查清单

修复完成后，请确认以下项目：

- [ ] `index.html` 在根目录
- [ ] `assets/` 目录在根目录
- [ ] `api/` 目录存在
- [ ] `.htaccess` 配置正确
- [ ] 服务正常运行
- [ ] 域名访问正常
- [ ] API 路由工作
- [ ] 静态资源加载正常

---

## 🎉 总结

通过以上解决方案，您的 Serv00 环境管理系统现在应该能够：

- ✅ **域名访问正常**: 直接访问前端应用
- ✅ **目录结构正确**: 文件在正确位置
- ✅ **路由配置完善**: SPA 和 API 路由都正常
- ✅ **部署流程优化**: 新部署自动处理目录结构

如果仍有问题，请运行 `./verify-domain-access.sh -v -f` 进行全面检查和自动修复。

---

**📅 文档更新时间**: 2025-01-10  
**🔄 适用版本**: v2.1.0+  
**🌐 平台支持**: Serv00 FreeBSD  
**👨‍💻 技术支持**: Augment Agent
