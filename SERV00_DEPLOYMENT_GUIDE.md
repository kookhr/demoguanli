# Serv00 主机部署指南

## 📋 部署方案概述

Serv00 是一个免费的静态网站托管服务，非常适合部署我们的环境管理系统。由于这是一个纯前端应用，可以完美运行在 Serv00 上。

## 🚀 部署步骤

### 1. 准备工作

#### 1.1 注册 Serv00 账户
- 访问 [serv00.com](https://serv00.com)
- 注册免费账户
- 记录您的用户名和密码

#### 1.2 本地构建项目
```bash
# 在项目根目录执行
npm run build
```

这将在 `dist` 目录生成生产版本的文件。

### 2. 文件上传方式

#### 方式一：通过 File Manager（推荐新手）

1. **登录 Serv00 控制面板**
   - 访问 `https://panel.serv00.com`
   - 使用您的账户登录

2. **进入 File Manager**
   - 在控制面板中找到 "File Manager"
   - 进入 `domains/yourdomain.serv00.net/public_html` 目录

3. **上传文件**
   - 将 `dist` 目录中的所有文件上传到 `public_html` 目录
   - 确保 `index.html` 在根目录

#### 方式二：通过 FTP/SFTP

1. **FTP 连接信息**
   ```
   主机: ftp.serv00.com
   端口: 21 (FTP) 或 22 (SFTP)
   用户名: 您的serv00用户名
   密码: 您的serv00密码
   ```

2. **使用 FileZilla 或其他 FTP 客户端**
   - 连接到服务器
   - 导航到 `domains/yourdomain.serv00.net/public_html`
   - 上传 `dist` 目录中的所有文件

#### 方式三：通过 Git（推荐开发者）

1. **在 Serv00 上设置 Git**
   ```bash
   # SSH 连接到 Serv00
   ssh username@s1.serv00.com
   
   # 进入网站目录
   cd domains/yourdomain.serv00.net/public_html
   
   # 克隆仓库（如果代码在 GitHub 上）
   git clone https://github.com/yourusername/your-repo.git .
   
   # 安装依赖并构建
   npm install
   npm run build
   
   # 将构建文件移到根目录
   mv dist/* .
   rm -rf dist
   ```

### 3. 配置优化

#### 3.1 创建 .htaccess 文件
在 `public_html` 目录创建 `.htaccess` 文件：

```apache
# 启用 Gzip 压缩
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# 设置缓存
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# SPA 路由支持
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>

# 安全头
<IfModule mod_headers.c>
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
```

#### 3.2 优化构建配置
修改 `vite.config.js` 以适配 Serv00：

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // 使用相对路径
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lucide-react']
        }
      }
    }
  }
})
```

### 4. 数据存储配置

由于 Serv00 是静态托管，我们需要配置数据存储：

#### 4.1 使用 localStorage（默认）
无需额外配置，数据存储在浏览器本地。

#### 4.2 集成 Cloudflare KV（推荐）
如果需要云端存储，可以集成 Cloudflare KV：

1. **注册 Cloudflare 账户**
2. **创建 KV 命名空间**
3. **获取 API 密钥**
4. **修改 `src/utils/kvApi.js`**

```javascript
// 配置 Cloudflare KV API
const KV_CONFIG = {
  accountId: 'your-account-id',
  namespaceId: 'your-namespace-id',
  apiToken: 'your-api-token'
};
```

### 5. 自动化部署

#### 5.1 GitHub Actions 部署脚本
创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Serv00

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Deploy to Serv00
      uses: SamKirkland/FTP-Deploy-Action@4.3.3
      with:
        server: ftp.serv00.com
        username: ${{ secrets.SERV00_USERNAME }}
        password: ${{ secrets.SERV00_PASSWORD }}
        local-dir: ./dist/
        server-dir: /domains/yourdomain.serv00.net/public_html/
```

#### 5.2 设置 GitHub Secrets
在 GitHub 仓库设置中添加：
- `SERV00_USERNAME`: 您的 Serv00 用户名
- `SERV00_PASSWORD`: 您的 Serv00 密码

### 6. 域名配置

#### 6.1 使用 Serv00 子域名
- 默认域名：`yourusername.serv00.net`
- 无需额外配置

#### 6.2 绑定自定义域名
1. **在 Serv00 控制面板添加域名**
2. **配置 DNS 记录**
   ```
   类型: A
   名称: @
   值: Serv00服务器IP
   
   类型: CNAME  
   名称: www
   值: yourusername.serv00.net
   ```

### 7. SSL 证书

Serv00 提供免费的 Let's Encrypt SSL 证书：

1. **在控制面板中启用 SSL**
2. **等待证书自动生成**
3. **强制 HTTPS 重定向**

### 8. 性能优化

#### 8.1 资源压缩
```bash
# 构建时自动压缩
npm run build
```

#### 8.2 CDN 加速
可以将静态资源托管到 CDN：
- 图片：使用 Cloudinary 或 ImageKit
- 字体：使用 Google Fonts
- 图标：使用 CDN 版本的 Lucide React

### 9. 监控和维护

#### 9.1 网站监控
- 使用 UptimeRobot 监控网站可用性
- 配置邮件/短信告警

#### 9.2 定期备份
```bash
# 定期备份配置数据
# 可以通过导出功能下载配置文件
```

### 10. 故障排除

#### 10.1 常见问题
1. **404 错误**：检查 `.htaccess` 文件配置
2. **资源加载失败**：确认文件路径正确
3. **功能异常**：检查浏览器控制台错误

#### 10.2 调试方法
1. **查看服务器日志**
2. **使用浏览器开发者工具**
3. **检查网络请求**

## 🎯 部署检查清单

- [ ] 本地构建成功 (`npm run build`)
- [ ] 文件上传到 `public_html` 目录
- [ ] `.htaccess` 文件配置正确
- [ ] 网站可以正常访问
- [ ] 所有功能正常工作
- [ ] SSL 证书已启用
- [ ] 性能优化已完成
- [ ] 监控已设置

## 📞 技术支持

如果遇到问题，可以：
1. 查看 Serv00 官方文档
2. 联系 Serv00 技术支持
3. 在项目 GitHub 仓库提交 Issue

部署完成后，您的环境管理系统将在 `https://yourusername.serv00.net` 上运行！🎉
