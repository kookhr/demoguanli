# 🚀 Serv00 快速部署指南

## 📋 准备工作

### 1. 注册 Serv00 账户
- 访问 [serv00.com](https://serv00.com) 注册免费账户
- 记录您的用户名，例如：`myusername`
- 您的网站将部署到：`https://myusername.serv00.net`

### 2. 获取 FTP 凭据
- 用户名：您的 Serv00 用户名
- 密码：您的 Serv00 密码
- FTP 服务器：`ftp.serv00.com`

## 🎯 三种部署方式

### 方式一：手动部署（最简单）

1. **构建项目**
   ```bash
   npm run build
   ```

2. **上传文件**
   - 使用 FileZilla 或其他 FTP 客户端
   - 连接到 `ftp.serv00.com`
   - 将 `dist` 目录中的所有文件上传到 `/domains/yourusername.serv00.net/public_html/`

3. **完成**
   - 访问 `https://yourusername.serv00.net` 查看网站

### 方式二：脚本自动部署

1. **配置部署脚本**
   ```bash
   # 编辑 deploy-serv00.sh
   SERV00_USER="yourusername"  # 替换为您的用户名
   SERV00_PASS="yourpassword"  # 替换为您的密码
   ```

2. **运行部署脚本**
   ```bash
   chmod +x deploy-serv00.sh
   ./deploy-serv00.sh
   ```

### 方式三：GitHub Actions 自动部署

1. **设置 GitHub Secrets**
   在 GitHub 仓库设置中添加：
   - `SERV00_USERNAME`: 您的 Serv00 用户名
   - `SERV00_PASSWORD`: 您的 Serv00 密码
   - `SERV00_DOMAIN`: 您的域名（如 `myusername.serv00.net`）

2. **推送代码**
   ```bash
   git add .
   git commit -m "Deploy to Serv00"
   git push origin main
   ```

3. **自动部署**
   - GitHub Actions 将自动构建和部署
   - 查看 Actions 页面了解部署状态

## ⚡ 快速开始（推荐）

如果您是第一次部署，推荐使用手动方式：

```bash
# 1. 构建项目
npm run build

# 2. 安装 lftp（如果没有）
# macOS: brew install lftp
# Ubuntu: sudo apt-get install lftp

# 3. 使用 lftp 上传（替换用户名和密码）
lftp ftp://yourusername:yourpassword@ftp.serv00.com -e "
cd /domains/yourusername.serv00.net/public_html;
lcd dist;
mirror --reverse --delete --verbose;
quit"
```

## 🔧 常见问题

### Q: 网站显示 404 错误
**A:** 检查以下内容：
- 确保 `index.html` 在 `public_html` 根目录
- 确保 `.htaccess` 文件已上传
- 等待几分钟让更改生效

### Q: 样式或脚本加载失败
**A:** 检查文件路径：
- 确保所有文件都已上传
- 检查文件名大小写是否正确
- 确保 `vite.config.js` 中 `base: './'` 配置正确

### Q: 功能不正常
**A:** 检查浏览器控制台：
- 按 F12 打开开发者工具
- 查看 Console 和 Network 标签页
- 检查是否有 JavaScript 错误

## 📊 部署检查清单

- [ ] Serv00 账户已注册
- [ ] 项目构建成功 (`npm run build`)
- [ ] 所有文件已上传到 `public_html`
- [ ] `.htaccess` 文件已创建
- [ ] 网站可以访问 (`https://yourusername.serv00.net`)
- [ ] 所有功能正常工作
- [ ] 环境检测功能正常
- [ ] 暗黑模式切换正常

## 🎉 部署完成

恭喜！您的环境管理系统现在已经部署到 Serv00 上了。

**网站地址：** `https://yourusername.serv00.net`

### 后续步骤

1. **绑定自定义域名**（可选）
   - 在 Serv00 控制面板添加域名
   - 配置 DNS 记录指向 Serv00

2. **启用 SSL**
   - Serv00 提供免费 Let's Encrypt SSL 证书
   - 在控制面板中启用

3. **设置监控**
   - 使用 UptimeRobot 等服务监控网站可用性

4. **定期备份**
   - 定期导出环境配置数据
   - 备份重要设置

## 📞 获取帮助

如果遇到问题：
1. 查看 [Serv00 官方文档](https://serv00.com/help)
2. 检查项目的 GitHub Issues
3. 联系 Serv00 技术支持

祝您使用愉快！🎊
