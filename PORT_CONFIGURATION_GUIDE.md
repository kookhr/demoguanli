# 🌐 Serv00 环境管理系统 - 自定义端口配置指南

## 📋 概述

本指南详细说明了如何在 Serv00 环境管理系统中配置和使用自定义服务端口。系统现已支持完全自定义的端口配置，包括端口验证、占用检查和智能端口建议功能。

---

## 🚀 快速开始

### 一键部署时配置端口

```bash
# 执行一键部署脚本
bash -i <(curl -SL https://raw.githubusercontent.com/kookhr/demoguanli/serv00/interactive-install.sh)

# 在配置收集阶段，系统会提示输入服务端口
# 请输入服务端口 (1024-65535) [默认: 3000]: 8080
```

### 手动配置端口

```bash
# 使用端口配置更新脚本
./update-port-config.sh /path/to/install/dir 8080

# 或者直接编辑配置文件
vim demo-config.json
```

---

## 🔧 端口配置功能

### 1. 端口验证

系统会自动验证端口的有效性：

- ✅ **端口范围**: 1024-65535（避免系统保留端口）
- ✅ **数字格式**: 只接受纯数字端口
- ✅ **FreeBSD 兼容**: 针对 Serv00 FreeBSD 环境优化

```bash
# 有效端口示例
3000, 8080, 9000, 8443, 5000

# 无效端口示例
80, 443, 1023, 65536, abc, -1
```

### 2. 端口占用检查

系统使用多种方法检查端口占用状态：

```bash
# FreeBSD netstat 检查
netstat -tuln | grep ":PORT "

# FreeBSD sockstat 检查（特有）
sockstat -l | grep ":PORT "

# nc 连接测试（备用）
nc -z localhost PORT
```

### 3. 智能端口建议

当指定端口被占用时，系统会：

1. 🔍 从指定端口开始向上搜索可用端口
2. 📋 提供可用端口建议
3. ❓ 询问用户是否使用建议端口
4. ⚠️ 允许强制使用被占用端口（高级用户）

---

## 📁 配置文件结构

### demo-config.json

```json
{
  "apiUrl": "https://your-domain.serv00.net/api",
  "version": "2.0.0",
  "environment": "production",
  "features": {
    "darkMode": true,
    "statusHistory": true,
    "userManagement": true,
    "environmentGrouping": true
  },
  "deployment": {
    "platform": "serv00",
    "domain": "your-domain.serv00.net",
    "port": 8080,
    "installedAt": "2025-01-10T10:00:00Z"
  }
}
```

### start-server.sh

启动脚本会自动读取配置文件中的端口设置：

```bash
# 读取配置文件中的端口
PORT=$(grep '"port"' demo-config.json | sed 's/.*: *\([0-9]*\).*/\1/')

# 验证端口有效性
if ! validate_port "$PORT"; then
    PORT=3000  # 使用默认端口
fi

# 检查端口占用并启动服务
npx serve -s dist -p $PORT --cors --single
```

---

## 🔄 更新模式端口保留

### 自动配置保留

在更新模式下，系统会：

1. 📖 **读取现有配置**: 从 `demo-config.json` 读取当前端口
2. 🔍 **验证端口有效性**: 确保端口在有效范围内
3. 💾 **保留用户设置**: 默认使用现有端口配置
4. ❓ **询问修改意愿**: 提供修改配置的选项

```bash
# 更新模式配置显示示例
--- 当前配置 ---
域名: your-domain.serv00.net
数据库主机: mysql14.serv00.com
数据库名称: your_db
数据库用户: your_user
服务端口: 8080
------------------

是否需要修改配置? [y/N]:
```

### 配置迁移

系统支持从旧版本配置迁移：

```bash
# 检查并迁移旧配置文件
.port              -> demo-config.json
server.conf        -> demo-config.json
config.json        -> demo-config.json
```

---

## 🛠️ 高级配置

### 环境变量支持

```bash
# 设置环境变量
export CUSTOM_PORT=8080
export CUSTOM_DOMAIN=your-domain.serv00.net

# 在部署脚本中使用
./interactive-install.sh
```

### 批量端口配置

```bash
# 使用配置更新脚本批量更新
./update-port-config.sh /path/to/install1 8080
./update-port-config.sh /path/to/install2 8081
./update-port-config.sh /path/to/install3 8082
```

### 端口配置测试

```bash
# 运行端口配置测试
./test-port-config.sh

# 测试内容包括：
# ✅ 端口验证函数测试
# ✅ 端口占用检查测试
# ✅ 配置文件读取测试
# ✅ 启动脚本逻辑测试
```

---

## 🔍 故障排除

### 常见问题

#### 1. 端口被占用

```bash
# 问题：端口 8080 已被占用
# 解决方案：
1. 使用系统建议的可用端口
2. 手动选择其他端口
3. 停止占用端口的服务
4. 强制使用被占用端口（不推荐）
```

#### 2. 端口验证失败

```bash
# 问题：端口 80 验证失败
# 原因：端口在系统保留范围内 (1-1023)
# 解决方案：使用 1024-65535 范围内的端口
```

#### 3. 配置文件损坏

```bash
# 问题：demo-config.json 格式错误
# 解决方案：
1. 使用备份文件恢复：cp demo-config.json.backup demo-config.json
2. 重新运行部署脚本生成新配置
3. 手动修复 JSON 格式错误
```

### 调试命令

```bash
# 检查端口占用
netstat -tuln | grep :8080
sockstat -l | grep :8080

# 测试端口连接
nc -z localhost 8080

# 验证配置文件
cat demo-config.json | python -m json.tool

# 检查启动脚本
bash -x start-server.sh
```

---

## 📊 最佳实践

### 1. 端口选择建议

```bash
# 推荐端口范围
开发环境: 3000-3999
测试环境: 4000-4999
预发布环境: 5000-5999
生产环境: 8000-8999
```

### 2. 安全考虑

- 🔒 **避免默认端口**: 不使用 3000, 8080 等常见端口
- 🛡️ **防火墙配置**: 确保端口在防火墙中正确开放
- 📝 **文档记录**: 记录使用的端口和用途

### 3. 监控和维护

```bash
# 定期检查端口状态
./test-port-config.sh

# 监控服务运行状态
ps aux | grep serve

# 检查端口监听状态
sockstat -l | grep :8080
```

---

## 🎯 总结

Serv00 环境管理系统的自定义端口配置功能提供了：

- ✅ **完整的端口验证和检查机制**
- ✅ **智能的端口建议和冲突解决**
- ✅ **更新模式下的配置保留**
- ✅ **FreeBSD/Serv00 环境优化**
- ✅ **全面的故障排除支持**

通过这些功能，您可以灵活地配置和管理服务端口，确保系统在 Serv00 平台上稳定运行。

---

**📅 文档更新时间**: 2025-01-10  
**🔄 适用版本**: v2.0.0+  
**🌐 平台支持**: Serv00 FreeBSD
