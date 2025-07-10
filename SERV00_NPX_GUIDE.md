# 🚀 Serv00 NPX Serve 部署指南

## 🎯 **解决方案概述**

由于 Serv00 环境可能没有启用 Apache httpd，传统的 .htaccess 配置无效。我们采用 **npx serve** 作为轻量级解决方案：

- ✅ **无需 Apache 配置**：绕过 .htaccess 限制
- ✅ **自动 MIME 类型**：npx serve 自动处理正确的 MIME 类型
- ✅ **轻量级部署**：资源占用少，启动快
- ✅ **开发友好**：支持热重载和 CORS

## 🚀 **一键部署**

```bash
bash <(curl -sSL https://raw.githubusercontent.com/kookhr/demoguanli/serv00/interactive-install.sh)
```

## 📋 **手动启动步骤**

### 1. 安装完成后启动服务

```bash
cd ~/domains/your-domain/public_html
./start-serve.sh
```

### 2. 访问应用

- **本地访问**: http://localhost:3000
- **外部访问**: https://your-domain:3000

### 3. 后台运行（可选）

```bash
# 安装 PM2（如果没有）
npm install -g pm2

# 启动后台服务
npx pm2 start ecosystem.config.js

# 查看状态
npx pm2 status

# 停止服务
npx pm2 stop environment-manager
```

## 🔧 **配置说明**

### serve.json 配置

```json
{
  "public": "./dist",
  "rewrites": [
    { "source": "/api/**", "destination": "/api/index.php" },
    { "source": "**", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "**/*.js",
      "headers": [{"key": "Content-Type", "value": "application/javascript; charset=utf-8"}]
    }
  ]
}
```

### 启动脚本功能

- 🔍 **自动端口检测**：从 3000 开始寻找可用端口
- 🌐 **CORS 支持**：允许跨域请求
- 📱 **SPA 支持**：单页应用路由支持
- 🔄 **自动重启**：文件变化时自动重启

## 🧪 **测试和验证**

### 检查服务状态

```bash
# 测试静态文件服务
curl -I http://localhost:3000

# 测试 JavaScript MIME 类型
curl -I http://localhost:3000/assets/index-*.js

# 测试 API
curl http://localhost:3000/api/health
```

### 浏览器测试

1. 打开 http://localhost:3000
2. 检查浏览器控制台是否有错误
3. 验证所有功能正常工作

## 🔧 **故障排除**

### 常见问题

1. **端口被占用**
   ```bash
   # 查看端口占用
   netstat -tuln | grep :3000
   
   # 杀死占用进程
   pkill -f "serve"
   ```

2. **Node.js 版本问题**
   ```bash
   # 检查版本
   node --version
   npm --version
   
   # 更新 npm
   npm install -g npm@latest
   ```

3. **权限问题**
   ```bash
   # 修复权限
   chmod +x start-serve.sh
   chmod +x test-mime-types.sh
   ```

### 备用方案

如果 npx serve 不工作，可以使用：

```bash
# 使用 Python 简单服务器
cd dist
python3 -m http.server 3000

# 或使用 PHP 内置服务器
cd dist
php -S localhost:3000
```

## 📊 **性能优化**

### 生产环境建议

1. **使用 PM2 管理进程**
2. **配置 Nginx 反向代理**（如果可用）
3. **启用 Gzip 压缩**
4. **设置适当的缓存头**

### 监控和日志

```bash
# PM2 日志
npx pm2 logs environment-manager

# 系统资源监控
npx pm2 monit
```

## 🎉 **优势总结**

- 🚀 **快速部署**：无需复杂配置
- 🔧 **易于维护**：简单的启动/停止命令
- 📱 **现代化**：支持最新的 Web 标准
- 🛡️ **稳定可靠**：成熟的 serve 包
- 💡 **开发友好**：支持开发和生产环境

这个方案完美解决了 Serv00 环境下的 MIME 类型问题，提供了轻量级、高效的部署方案！
