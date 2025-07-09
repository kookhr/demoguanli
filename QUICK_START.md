# ⚡ 快速开始 - Serv00 环境管理系统

## 🚀 一键安装

在您的 Serv00 主机 SSH 终端中执行以下命令：

```bash
curl -sSL https://raw.githubusercontent.com/your-username/your-repo/serv00/install.sh | bash
```

> 💡 **提示**：请将 `your-username/your-repo` 替换为您的实际 GitHub 仓库地址

## 📋 安装过程

脚本会自动完成以下步骤：

1. **🔍 环境检测**
   - 自动识别 Serv00 用户名
   - 检测可用域名
   - 验证系统依赖

2. **📦 项目构建**
   - 克隆 Git 仓库
   - 安装 npm 依赖
   - 构建生产版本

3. **🚀 自动部署**
   - 复制文件到网站目录
   - 生成配置文件
   - 设置文件权限

4. **🗄️ 数据库准备**
   - 创建初始化脚本
   - 生成配置文件

## 🎯 安装后步骤

### 1. 创建数据库
在 Serv00 控制面板中：
- 进入 "Databases" → "MySQL"
- 创建数据库：`environment_manager`
- 记录用户名和密码

### 2. 初始化数据库
```bash
~/init_database.sh
```

### 3. 访问网站
```
https://your-domain.serv00.net
```

### 4. 管理员登录
- 用户名：`admin`
- 密码：`admin123`

### 5. 修改密码
登录后立即修改默认密码！

## 🎉 完成！

现在您拥有了一个完全免费的环境管理系统：

- ✅ 环境管理和状态监控
- ✅ Apple Liquid Glass 设计
- ✅ 暗黑模式支持
- ✅ 用户权限管理
- ✅ 状态历史统计

## 📚 更多信息

- 📖 [详细安装指南](SERV00_DIRECT_INSTALL.md)
- 🚀 [完整部署文档](SERV00_DEPLOYMENT_COMPLETE.md)
- 🔧 [故障排除指南](TROUBLESHOOTING.md)

---

🎊 **享受您的免费环境管理系统！**
