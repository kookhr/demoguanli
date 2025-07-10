# 🌙 Serv00 环境管理系统 - 后台运行模式指南

## 📋 概述

本指南详细介绍了 Serv00 环境管理系统的后台运行功能，包括启动、管理、监控和故障排除等完整的后台服务管理方案。

---

## 🚀 快速开始

### 启动后台服务

```bash
# 进入项目目录
cd /path/to/your/project

# 启动后台服务
./start-server.sh -d

# 或使用完整参数
./start-server.sh --daemon
```

### 管理后台服务

```bash
# 查看服务状态
./status-server.sh

# 停止后台服务
./stop-server.sh

# 重启后台服务
./restart-server.sh -d
```

---

## 🔧 功能特性

### 1. 后台运行支持

- ✅ **nohup 进程管理**: 确保终端关闭后服务继续运行
- ✅ **PID 文件管理**: 自动生成和管理进程 ID 文件
- ✅ **日志重定向**: 将输出重定向到专用日志文件
- ✅ **进程监控**: 实时监控服务运行状态

### 2. 日志管理系统

```bash
# 日志文件结构
logs/
├── server.log    # 服务主日志
├── error.log     # 错误日志
├── access.log    # 访问日志
└── archive/      # 归档日志目录
```

### 3. 进程管理脚本

| 脚本 | 功能 | 用法 |
|------|------|------|
| `start-server.sh` | 启动服务 | `./start-server.sh -d` |
| `stop-server.sh` | 停止服务 | `./stop-server.sh` |
| `status-server.sh` | 查看状态 | `./status-server.sh -v` |
| `restart-server.sh` | 重启服务 | `./restart-server.sh -d` |

---

## 📖 详细使用说明

### 启动脚本 (start-server.sh)

#### 基本用法

```bash
# 前台运行（默认）
./start-server.sh

# 后台运行
./start-server.sh -d
./start-server.sh --daemon

# 详细输出模式
./start-server.sh -d -v
./start-server.sh --daemon --verbose

# 查看帮助
./start-server.sh -h
./start-server.sh --help
```

#### 功能特性

- 🔍 **智能端口检测**: 自动检查端口占用并建议可用端口
- 📁 **自动日志管理**: 创建日志目录和轮转机制
- ⚡ **快速启动验证**: 启动后自动验证服务状态
- 🛡️ **错误处理**: 完善的错误检测和提示

### 停止脚本 (stop-server.sh)

#### 基本用法

```bash
# 正常停止
./stop-server.sh

# 强制停止
./stop-server.sh -f
./stop-server.sh --force

# 查看帮助
./stop-server.sh -h
```

#### 停止流程

1. **检查服务状态**: 验证服务是否正在运行
2. **发送停止信号**: 使用 TERM 信号正常停止
3. **等待进程结束**: 最多等待 10 秒
4. **强制停止**: 如需要，使用 KILL 信号强制停止
5. **清理 PID 文件**: 删除进程 ID 文件

### 状态脚本 (status-server.sh)

#### 基本用法

```bash
# 基本状态
./status-server.sh

# 详细状态
./status-server.sh -v
./status-server.sh --verbose

# 显示日志
./status-server.sh -l
./status-server.sh --logs

# 详细状态 + 日志
./status-server.sh -v -l
```

#### 状态信息

```bash
# 基本状态显示
🔍 环境管理系统状态

📊 服务状态
✅ 服务正在运行 (PID: 12345)
🌐 访问地址: https://your-domain.serv00.net:8080
✅ 端口 8080 正在监听
✅ 网络连接正常

# 详细状态显示
📈 进程信息
⏰ 启动时间: Wed Jan 10 10:00:00 CST 2025
💻 CPU 使用率: 0.5%
🧠 内存使用率: 2.1%

📋 日志统计
📝 访问日志: 150 行
❌ 错误日志: 0 行
🖥️  服务日志: 45 行
```

### 重启脚本 (restart-server.sh)

#### 基本用法

```bash
# 重启为前台服务
./restart-server.sh

# 重启为后台服务
./restart-server.sh -d
./restart-server.sh --daemon

# 强制重启
./restart-server.sh -f
./restart-server.sh --force

# 详细输出
./restart-server.sh -d -v
```

---

## 📋 日志管理

### 日志管理脚本 (manage-logs.sh)

```bash
# 查看日志
./manage-logs.sh view server      # 服务日志
./manage-logs.sh view error       # 错误日志
./manage-logs.sh view access      # 访问日志
./manage-logs.sh view all         # 所有日志

# 实时查看日志
./manage-logs.sh tail server      # 实时服务日志
./manage-logs.sh tail all         # 实时所有日志

# 日志管理
./manage-logs.sh rotate           # 手动轮转日志
./manage-logs.sh clean            # 清理旧日志
./manage-logs.sh archive          # 归档日志
./manage-logs.sh stats            # 日志统计
```

### 日志轮转机制

- 📏 **大小限制**: 单个日志文件最大 10MB
- 🔄 **自动轮转**: 超过大小限制时自动轮转
- 📦 **压缩归档**: 使用 gzip 压缩归档文件
- 🗂️ **目录结构**: 归档文件存储在 `logs/archive/` 目录

### 日志格式

```bash
# 服务日志格式
2025-01-10 10:00:00 - 服务启动成功 (PID: 12345, PORT: 8080)
2025-01-10 10:05:00 - 服务停止 (PID: 12345)

# 错误日志格式
[Error] 2025-01-10 10:00:00 - 端口 8080 被占用
[Warning] 2025-01-10 10:01:00 - 配置文件格式异常

# 访问日志格式
2025-01-10 10:00:00 - GET / - 200 - 1.2ms
2025-01-10 10:00:01 - GET /api/health - 200 - 0.8ms
```

---

## 🎛️ 服务助手工具

### 交互式管理界面 (server-helper.sh)

```bash
# 启动服务助手
./server-helper.sh
```

#### 功能菜单

```
╔══════════════════════════════════════════════════════════════╗
║              🚀 环境管理系统服务助手                         ║
║                                                              ║
║  简化的服务管理界面，提供一键操作和状态监控                   ║
╚══════════════════════════════════════════════════════════════╝

🔍 当前状态:
  服务状态: 运行中 (PID: 12345)
  访问地址: https://your-domain.serv00.net:8080

📋 可用操作:
  1. 🚀 启动服务 (前台)
  2. 🌙 启动服务 (后台)
  3. 🛑 停止服务
  4. 🔄 重启服务
  5. 📊 查看状态
  6. 📋 查看日志
  7. 🔧 故障排除
  8. ⚙️  系统信息
  9. 📖 帮助文档
  0. 🚪 退出
```

---

## 🔧 故障排除

### 常见问题

#### 1. 服务无法启动

**症状**: 执行启动命令后服务立即退出

**排查步骤**:
```bash
# 1. 检查端口占用
./status-server.sh
netstat -tuln | grep :8080

# 2. 查看错误日志
tail -f logs/error.log

# 3. 检查配置文件
cat demo-config.json

# 4. 手动启动测试
./start-server.sh  # 前台模式查看错误
```

**解决方案**:
- 更换端口配置
- 修复配置文件格式
- 安装缺失的依赖

#### 2. 后台服务意外停止

**症状**: 后台服务运行一段时间后自动停止

**排查步骤**:
```bash
# 1. 查看服务日志
./manage-logs.sh view server -n 100

# 2. 查看错误日志
./manage-logs.sh view error

# 3. 检查系统资源
ps aux | grep serve
free -h  # Linux
top      # 查看资源使用
```

**解决方案**:
- 检查内存使用情况
- 查看系统日志
- 增加错误处理

#### 3. 端口冲突

**症状**: 提示端口被占用

**排查步骤**:
```bash
# 1. 查看端口占用
netstat -tuln | grep :PORT
sockstat -l | grep :PORT  # FreeBSD

# 2. 查找占用进程
lsof -i :PORT  # 如果可用
ps aux | grep PORT
```

**解决方案**:
- 停止占用端口的进程
- 更换服务端口
- 使用端口建议功能

#### 4. 权限问题

**症状**: 脚本无法执行或文件无法创建

**排查步骤**:
```bash
# 1. 检查脚本权限
ls -la *.sh

# 2. 检查目录权限
ls -la logs/

# 3. 检查用户权限
whoami
id
```

**解决方案**:
```bash
# 修复脚本权限
chmod +x *.sh

# 修复目录权限
chmod 755 logs/
```

### 调试模式

```bash
# 启用详细输出
./start-server.sh -d -v

# 查看详细状态
./status-server.sh -v -l

# 实时监控日志
./manage-logs.sh tail all
```

---

## 🛡️ FreeBSD/Serv00 兼容性

### 系统兼容性检查

```bash
# 运行兼容性测试
./test-freebsd-compatibility.sh
```

### FreeBSD 特有功能

- ✅ **sockstat 支持**: 使用 FreeBSD 特有的 sockstat 命令
- ✅ **stat 命令兼容**: 支持 FreeBSD 的 stat 参数格式
- ✅ **进程管理优化**: 针对 FreeBSD 进程管理优化
- ✅ **文件系统兼容**: 完全兼容 FreeBSD 文件系统

### Serv00 平台优化

- 🔧 **端口范围限制**: 自动验证 1024-65535 端口范围
- 📁 **目录结构适配**: 适配 Serv00 的目录结构
- 🌐 **域名配置**: 自动适配 Serv00 域名格式
- 🔒 **权限管理**: 符合 Serv00 权限要求

---

## 📊 性能监控

### 服务监控指标

```bash
# CPU 和内存使用率
./status-server.sh -v

# 网络连接状态
netstat -an | grep :8080

# 日志增长情况
./manage-logs.sh stats
```

### 性能优化建议

1. **日志管理**: 定期清理和归档日志文件
2. **资源监控**: 监控 CPU 和内存使用情况
3. **端口优化**: 选择合适的服务端口
4. **进程管理**: 避免创建过多子进程

---

## 🎯 最佳实践

### 1. 生产环境部署

```bash
# 1. 使用后台模式
./start-server.sh -d

# 2. 设置定时监控
# 添加到 crontab
*/5 * * * * cd /path/to/project && ./status-server.sh >/dev/null 2>&1

# 3. 定期日志清理
0 2 * * 0 cd /path/to/project && ./manage-logs.sh clean
```

### 2. 开发环境调试

```bash
# 1. 使用前台模式
./start-server.sh

# 2. 启用详细输出
./start-server.sh -v

# 3. 实时监控日志
./manage-logs.sh tail all
```

### 3. 安全考虑

- 🔒 **端口安全**: 避免使用默认端口
- 📝 **日志安全**: 定期清理敏感信息
- 🛡️ **权限控制**: 最小权限原则
- 🔐 **访问控制**: 配置防火墙规则

---

## 📚 参考资料

### 相关文档

- [PORT_CONFIGURATION_GUIDE.md](PORT_CONFIGURATION_GUIDE.md) - 端口配置指南
- [SERV00_TECHNICAL_ANALYSIS.md](SERV00_TECHNICAL_ANALYSIS.md) - 技术分析报告
- [CUSTOM_PORT_IMPLEMENTATION_SUMMARY.md](CUSTOM_PORT_IMPLEMENTATION_SUMMARY.md) - 端口实现总结

### 命令速查

```bash
# 服务管理
./start-server.sh -d     # 启动后台服务
./stop-server.sh         # 停止服务
./restart-server.sh -d   # 重启后台服务
./status-server.sh -v    # 查看详细状态

# 日志管理
./manage-logs.sh view all    # 查看所有日志
./manage-logs.sh tail all    # 实时查看日志
./manage-logs.sh rotate      # 轮转日志
./manage-logs.sh clean       # 清理日志

# 工具脚本
./server-helper.sh           # 交互式管理界面
./test-freebsd-compatibility.sh  # 兼容性测试
```

---

**📅 文档更新时间**: 2025-01-10  
**🔄 适用版本**: v2.0.0+  
**🌐 平台支持**: Serv00 FreeBSD  
**👨‍💻 技术支持**: Augment Agent
