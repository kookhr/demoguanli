# 🚀 Cloudflare Pages 部署指南

## 方法一：通过 Git 仓库部署（推荐）

### 1. 准备 Git 仓库

```bash
# 如果还没有初始化 Git
git init
git add .
git commit -m "Initial commit: Environment Management System"

# 推送到远程仓库（GitHub/GitLab/Bitbucket）
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. 在 Cloudflare Pages 中创建项目

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Pages** 部分
3. 点击 **Create a project**
4. 选择 **Connect to Git**
5. 授权并选择您的仓库

### 3. 创建 KV 命名空间

在部署前，需要创建 KV 命名空间来存储配置：

```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 创建 KV 命名空间
wrangler kv:namespace create "ENV_CONFIG"
wrangler kv:namespace create "ENV_CONFIG" --preview
```

记录返回的命名空间 ID，并更新 `wrangler.toml` 文件中的 `id` 和 `preview_id`。

### 4. 配置构建设置

在 Cloudflare Pages 中设置以下构建配置：

```
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Root directory: (留空)
Environment variables: NODE_VERSION = 18
```

### 5. 绑定 KV 命名空间

在 Cloudflare Pages 项目设置中：
1. 进入 **Functions** 标签页
2. 点击 **KV namespace bindings**
3. 添加绑定：
   - Variable name: `ENV_CONFIG`
   - KV namespace: 选择之前创建的命名空间

### 6. 部署

点击 **Save and Deploy**，Cloudflare 将自动：
- 安装依赖 (`npm install`)
- 构建项目 (`npm run build`)
- 部署到全球 CDN

## 方法二：使用 Wrangler CLI 部署

### 1. 安装 Wrangler

```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

### 3. 构建项目

```bash
npm run build
```

### 4. 部署

```bash
wrangler pages deploy dist --project-name environment-management-system
```

## 方法三：直接上传部署

### 1. 构建项目

```bash
npm run build
```

### 2. 手动上传

1. 访问 [Cloudflare Pages](https://pages.cloudflare.com/)
2. 点击 **Create a project**
3. 选择 **Upload assets**
4. 上传 `dist` 文件夹中的所有文件

## 🗄️ Cloudflare KV 集成

部署到 Cloudflare Pages 后，系统会自动：
- 检测 KV 可用性
- 迁移本地配置到 KV
- 在存储状态面板显示当前存储类型
- 提供手动同步功能

## 🔧 部署后配置

### 自定义域名

1. 在 Cloudflare Pages 项目中点击 **Custom domains**
2. 添加您的域名
3. 配置 DNS 记录

### 环境变量

如果需要设置环境变量：
1. 进入项目设置
2. 点击 **Environment variables**
3. 添加所需变量

### 重定向规则

创建 `public/_redirects` 文件处理 SPA 路由：

```
/*    /index.html   200
```

## 📊 性能优化

### 1. 启用压缩

Cloudflare 自动启用 Gzip 和 Brotli 压缩

### 2. 缓存配置

在 Cloudflare Dashboard 中配置缓存规则：
- 静态资源：缓存 1 年
- HTML 文件：缓存 1 小时

### 3. 安全设置

- 启用 HTTPS
- 配置 Security Headers
- 设置 WAF 规则

## 🌍 全球部署

Cloudflare Pages 自动将您的应用部署到全球 200+ 个数据中心，确保：
- 快速加载速度
- 高可用性
- 自动 SSL 证书
- DDoS 防护

## 📈 监控和分析

### Web Analytics

在 Cloudflare Dashboard 中启用 Web Analytics：
1. 进入 **Analytics & Logs**
2. 启用 **Web Analytics**
3. 查看访问统计

### 实时日志

查看实时访问日志和错误信息

## 🔄 自动部署

### Git 集成

连接 Git 仓库后，每次推送代码都会自动触发部署：
- `main` 分支 → 生产环境
- 其他分支 → 预览环境

### 预览部署

每个 Pull Request 都会创建独立的预览环境

## 🛠 故障排除

### 常见问题

1. **构建失败**
   - 检查 Node.js 版本
   - 确认依赖安装正确
   - 查看构建日志

2. **路由问题**
   - 添加 `_redirects` 文件
   - 配置 SPA 重定向

3. **静态资源 404**
   - 检查构建输出目录
   - 确认资源路径正确

### 调试技巧

- 使用 Cloudflare Pages 的构建日志
- 本地测试构建：`npm run build && npm run preview`
- 检查浏览器开发者工具

## 📞 支持

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Cloudflare 社区](https://community.cloudflare.com/)
- [GitHub Issues](https://github.com/cloudflare/pages-action/issues)
