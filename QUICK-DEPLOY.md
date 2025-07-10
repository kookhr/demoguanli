# 🚀 Serv00 环境管理系统 - 快速部署

## 一键部署命令

复制以下命令到您的 Serv00 终端中执行：

```bash
bash -i <(curl -SL https://raw.githubusercontent.com/kookhr/demoguanli/serv00/serv00-deploy.sh)
```

## 部署流程

### 1. 自动环境检测
- ✅ FreeBSD 系统检测
- ✅ PHP 版本和扩展检查
- ✅ MySQL 客户端验证
- ✅ Apache 配置检查

### 2. 交互式配置
系统会提示您输入以下信息：

```
请输入安装目录 [默认: ~/domains/用户名.serv00.net/public_html]:
请输入自定义端口 [默认: 62595]:
数据库主机 [默认: mysql14.serv00.com]:
数据库名称 [默认: em9785_environment_manager]:
数据库用户名 [默认: m9785_s14kook]:
数据库密码:
域名 [默认: do.kandy.dpdns.org]:
```

### 3. 自动部署
- ✅ 下载项目文件
- ✅ 检查并修复项目结构
- ✅ 创建 index.html 入口文件
- ✅ 优化 Vite 配置
- ✅ 构建前端项目
- ✅ 部署到根目录
- ✅ 配置数据库连接
- ✅ 设置 Apache 重写规则
- ✅ 导入数据库结构
- ✅ 设置文件权限

## 部署完成后

### 访问地址
- **前端**: `https://do.kandy.dpdns.org`
- **API**: `https://do.kandy.dpdns.org/api/health`

### 默认账户
- **用户名**: `admin`
- **密码**: `admin123`

⚠️ **重要**: 首次登录后立即修改密码！

## 验证部署

### 检查文件
```bash
ls -la index.html
ls -la assets/
ls -la api/
```

### 测试功能
- ✅ 前端页面正常显示
- ✅ 用户登录功能
- ✅ 环境管理功能
- ✅ 状态检测功能

## 故障排除

### 如果部署失败
```bash
# 查看错误日志
tail -f /tmp/serv00-php-errors.log

# 检查 PHP 配置
php -v
php -m

# 测试数据库连接
mysql -h localhost -u username -p
```

### 常见问题
1. **PHP 扩展缺失**: 联系 Serv00 客服启用必要扩展
2. **数据库连接失败**: 检查数据库用户名和密码
3. **权限问题**: 确保文件权限设置正确

## 技术支持

- 📖 [完整部署指南](https://github.com/kookhr/demoguanli/blob/serv00/SERV00-DEPLOYMENT-GUIDE.md)
- 🐛 [问题反馈](https://github.com/kookhr/demoguanli/issues)
- 💬 [讨论区](https://github.com/kookhr/demoguanli/discussions)

---

**仓库地址**: https://github.com/kookhr/demoguanli/tree/serv00
