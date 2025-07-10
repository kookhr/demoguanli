# 🚀 Serv00 环境管理系统 - 使用指南

## 📋 概述

Serv00 环境管理系统是一个完全集成的一键部署解决方案，专为 Serv00 FreeBSD 环境优化。所有功能都集成在一个部署脚本中，无需多个独立脚本。

---

## 🚀 快速开始

### 一键部署

```bash
# 唯一需要的命令 - 一键完成所有部署
bash -i <(curl -SL https://raw.githubusercontent.com/kookhr/demoguanli/serv00/interactive-install.sh)
```

**部署过程自动处理**:
- ✅ 环境检测和配置收集
- ✅ 项目下载和依赖安装（5种重试策略）
- ✅ 智能项目构建（3次重试机制）
- ✅ 域名访问问题自动修复
- ✅ 目录结构自动优化
- ✅ Apache 配置自动生成
- ✅ 数据库初始化
- ✅ 服务脚本创建
- ✅ 部署结果验证

---

## 🔧 服务管理

### 基本操作

```bash
# 启动服务
./start-server.sh           # 前台运行
./start-server.sh -d        # 后台运行

# 停止服务
./start-server.sh stop      # 或 ./stop-server.sh

# 重启服务
./start-server.sh restart   # 或 ./restart-server.sh
./start-server.sh restart -d # 后台重启

# 查看状态
./start-server.sh status    # 或 ./status-server.sh
./start-server.sh status -v # 详细状态
./start-server.sh status -l # 包含日志
```

### 交互式管理

```bash
# 启动服务助手（图形化管理界面）
./start-server.sh helper
```

**服务助手功能**:
- 🚀 启动/停止/重启服务
- 📊 实时状态监控
- 📋 日志查看和管理
- 🔧 故障排除工具
- ⚙️ 系统信息显示
- 📖 帮助文档

---

## 📋 日志管理

### 查看日志

```bash
# 查看所有日志
./start-server.sh manage-logs view all

# 查看特定类型日志
./start-server.sh manage-logs view server    # 服务日志
./start-server.sh manage-logs view error     # 错误日志
./start-server.sh manage-logs view access    # 访问日志

# 指定行数
./start-server.sh manage-logs view all 100   # 查看最近100行
```

### 实时监控

```bash
# 实时查看日志
./start-server.sh manage-logs tail all       # 所有日志
./start-server.sh manage-logs tail server    # 服务日志
./start-server.sh manage-logs tail error     # 错误日志
```

### 日志维护

```bash
# 日志轮转（超过10MB自动轮转）
./start-server.sh manage-logs rotate

# 清理旧日志（删除7天前的日志）
./start-server.sh manage-logs clean

# 查看日志统计
./start-server.sh manage-logs stats
```

---

## 🌐 访问地址

部署完成后，您可以通过以下方式访问：

### 域名访问（推荐）

```bash
# 主域名访问
https://your-domain.serv00.net/

# API 访问
https://your-domain.serv00.net/api/
```

### 带端口访问

```bash
# 如果需要指定端口
https://your-domain.serv00.net:8080/

# API 带端口访问
https://your-domain.serv00.net:8080/api/
```

---

## 🔧 故障排除

### 常见问题

#### 1. 依赖安装失败

**现象**: 脚本在 "安装 Node.js 依赖" 步骤中断

**解决方案**:
```bash
# 重新运行部署脚本（已集成多重试策略）
bash -i <(curl -SL https://raw.githubusercontent.com/kookhr/demoguanli/serv00/interactive-install.sh)

# 或手动修复
npm cache clean --force
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

#### 2. 构建失败

**现象**: 前端构建失败

**解决方案**:
```bash
# 检查依赖
ls node_modules/react node_modules/vite

# 手动构建
npm run build

# 重新部署
bash -i <(curl -SL .../interactive-install.sh)
```

#### 3. 域名访问白屏

**现象**: IP 访问正常，域名访问白屏

**解决方案**:
```bash
# 检查文件位置
ls -la index.html dist/

# 部署脚本已自动修复此问题
# 如需手动修复：
if [ -f "dist/index.html" ] && [ ! -f "index.html" ]; then
    cd dist && mv * ../ && cd .. && rmdir dist
fi
```

#### 4. 服务无法启动

**现象**: 启动脚本执行失败

**解决方案**:
```bash
# 检查权限
chmod +x *.sh

# 检查端口占用
./start-server.sh status -v

# 查看错误日志
./start-server.sh manage-logs view error
```

### 诊断命令

```bash
# 系统信息
./start-server.sh helper  # 选择 "8. 系统信息"

# 详细状态
./start-server.sh status -v

# 故障排除
./start-server.sh helper  # 选择 "7. 故障排除"
```

---

## ⚙️ 配置管理

### 配置文件

**主配置文件**: `demo-config.json`
```json
{
  "deployment": {
    "domain": "your-domain.serv00.net",
    "port": 8080
  },
  "database": {
    "host": "localhost",
    "name": "your_database",
    "user": "your_user",
    "password": "your_password"
  }
}
```

### 修改配置

```bash
# 编辑配置文件
vim demo-config.json

# 重启服务使配置生效
./start-server.sh restart -d
```

---

## 📊 系统要求

### 环境要求

- **操作系统**: FreeBSD (Serv00)
- **Node.js**: 16.0.0 或更高版本
- **npm**: 8.0.0 或更高版本
- **PHP**: 7.4 或更高版本（可选）
- **数据库**: MySQL 或 PostgreSQL（可选）

### 检查环境

```bash
# 检查 Node.js 版本
node --version

# 检查 npm 版本
npm --version

# 检查磁盘空间
df -h

# 检查网络连接
ping registry.npmjs.org
```

---

## 🔄 更新系统

### 自动更新

```bash
# 使用更新脚本（如果存在）
./update.sh

# 或重新运行部署脚本
bash -i <(curl -SL https://raw.githubusercontent.com/kookhr/demoguanli/serv00/interactive-install.sh)
```

### 手动更新

```bash
# 停止服务
./start-server.sh stop

# 备份配置
cp demo-config.json demo-config.json.backup

# 重新部署
bash -i <(curl -SL .../interactive-install.sh)

# 恢复配置（如果需要）
cp demo-config.json.backup demo-config.json

# 启动服务
./start-server.sh -d
```

---

## 📚 高级功能

### 数据库管理

```bash
# 初始化数据库（如果存在初始化脚本）
./init-database.sh

# 检查数据库连接
# 在服务助手中选择相应选项
```

### 性能监控

```bash
# 查看详细状态
./start-server.sh status -v

# 监控日志
./start-server.sh manage-logs tail all

# 系统信息
./start-server.sh helper  # 选择系统信息
```

### 安全配置

- ✅ **HTTPS**: 自动配置 HTTPS 访问
- ✅ **安全头部**: 自动添加安全 HTTP 头部
- ✅ **MIME 类型**: 正确配置 MIME 类型
- ✅ **错误页面**: 自定义错误页面

---

## 🆘 获取帮助

### 内置帮助

```bash
# 服务助手
./start-server.sh helper

# 查看启动脚本帮助
./start-server.sh --help
```

### 常用资源

- **配置文件**: `demo-config.json`
- **日志目录**: `logs/`
- **API 目录**: `api/`
- **前端文件**: 根目录或 `dist/`

### 技术支持

如果遇到问题，请提供以下信息：
- 系统信息（`uname -a`）
- Node.js 版本（`node --version`）
- 错误日志
- 执行的命令
- 项目目录结构

---

## 🎉 总结

Serv00 环境管理系统提供了：

- 🚀 **一键部署**: 单命令完成所有部署
- 🔧 **集成管理**: 所有功能集成在一个脚本中
- 🛡️ **智能修复**: 自动检测和修复常见问题
- 📊 **完整监控**: 日志管理和状态监控
- 🎛️ **友好界面**: 交互式管理界面
- 🔄 **简单维护**: 最小化的维护工作

通过这个系统，您可以轻松在 Serv00 平台上部署和管理环境管理应用，享受企业级的部署和管理体验！

---

**📅 文档更新时间**: 2025-01-10  
**🔄 适用版本**: v3.0.0+  
**🌐 平台支持**: Serv00 FreeBSD  
**👨‍💻 技术支持**: Augment Agent
