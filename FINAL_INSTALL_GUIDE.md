# 🎉 环境管理系统 - 最终安装指南

## 🚀 一键安装命令

在您的 Serv00 主机 SSH 终端中执行：

```bash
curl -sSL https://raw.githubusercontent.com/kookhr/demoguanli/serv00/install.sh | bash
```

## 📋 完整安装流程

### 1. 登录 Serv00 主机
```bash
ssh your_username@your_domain.serv00.net
```

### 2. 执行一键安装
```bash
bash -i <(curl -SL https://raw.githubusercontent.com/kookhr/demoguanli/serv00/interactive-install.sh)
```

### 3. 等待自动完成
脚本会自动：
- 🔍 检测环境信息
- 📦 克隆项目代码
- 🔨 构建生产版本
- 🚀 部署到网站目录
- ⚙️ 生成配置文件

### 4. 创建数据库
在 Serv00 控制面板中：
1. 进入 "Databases" → "MySQL"
2. 创建数据库：`environment_manager`
3. 记录数据库用户名和密码

### 5. 初始化数据库
```bash
~/init_database.sh
```
输入数据库密码完成初始化。

### 6. 访问网站
```
https://your_domain.serv00.net
```

### 7. 管理员登录
- 用户名：`admin`
- 密码：`admin123`

### 8. 修改默认密码
⚠️ **重要**：登录后立即修改默认密码！

## 🎯 安装成功标志

✅ 看到欢迎页面
✅ 能够正常登录
✅ 环境列表显示正常
✅ 状态检测功能工作

## 🔧 如果遇到问题

### 重新安装
```bash
# 清理并重新安装
rm -rf ~/domains/*/public_html/*
curl -sSL https://raw.githubusercontent.com/kookhr/demoguanli/serv00/install.sh | bash
```

### 手动下载
```bash
# 如果网络问题，手动下载
wget https://raw.githubusercontent.com/kookhr/demoguanli/serv00/serv00-auto-deploy.sh
chmod +x serv00-auto-deploy.sh
./serv00-auto-deploy.sh
```

### 检查日志
```bash
# 查看 PHP 错误日志
tail -f /tmp/php_errors.log

# 查看应用日志
tail -f /tmp/environment_manager.log
```

## 🎊 完成！

现在您拥有了一个完全免费的环境管理系统：

- 🌐 环境管理和状态监控
- 💎 Apple Liquid Glass 设计
- 🌙 暗黑模式支持
- 👥 用户权限管理
- 📊 状态历史统计
- 💰 完全免费使用

## 📚 更多帮助

- 📖 [详细安装指南](SERV00_DIRECT_INSTALL.md)
- 🚀 [完整部署文档](SERV00_DEPLOYMENT_COMPLETE.md)
- ⚡ [快速开始指南](QUICK_START.md)

---

🎉 **享受您的免费环境管理系统！**

如有问题，请查看项目文档或提交 Issue：
https://github.com/kookhr/demoguanli/issues
