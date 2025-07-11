# 🌐 Cloudflare Dashboard 可视化部署指南

通过Cloudflare网站界面部署GitHub上的环境管理系统

## 🎯 部署概览

```
GitHub仓库 → Cloudflare Dashboard → Workers Builds → 自动部署
```

## 📋 前置准备

### 确认GitHub仓库状态
- ✅ 代码已推送到GitHub
- ✅ 包含 `wrangler.toml` 配置文件
- ✅ 包含 `src/worker.js` Worker代码
- ✅ 包含构建后的 `dist/` 目录（或能够构建）

### 确认Cloudflare账户
- ✅ 已登录Cloudflare Dashboard
- ✅ 账户有Workers权限

## 🚀 第一步：创建Workers项目

### 1.1 进入Workers & Pages
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 在左侧菜单选择 **"Workers & Pages"**
3. 点击 **"Create application"** 按钮

### 1.2 选择创建方式
1. 在弹出页面中选择 **"Workers"** 标签
2. 点击 **"Create Worker"** 按钮

### 1.3 配置Worker基本信息
```
Worker名称: environment-manager
```
1. 输入Worker名称：`environment-manager`
2. 点击 **"Deploy"** 按钮

## 🔗 第二步：连接GitHub仓库

### 2.1 进入Worker设置
1. Worker创建成功后，进入Worker详情页面
2. 点击 **"Settings"** 标签
3. 选择 **"Builds"** 部分

### 2.2 连接Git仓库
1. 点击 **"Connect to Git"** 按钮
2. 选择 **"GitHub"** 作为Git提供商
3. 如果首次使用，需要授权Cloudflare访问GitHub

### 2.3 授权GitHub访问
1. 在GitHub授权页面，选择要授权的仓库
2. 可以选择 **"All repositories"** 或 **"Selected repositories"**
3. 如果选择特定仓库，找到您的环境管理系统仓库
4. 点击 **"Install & Authorize"**

### 2.4 选择仓库和分支
1. 返回Cloudflare页面后，选择您的仓库
2. 选择主分支（通常是 `main` 或 `master`）
3. 点击 **"Begin setup"**

## ⚙️ 第三步：配置构建设置

### 3.1 基本构建配置
```
Project name: environment-manager
Production branch: main
Framework preset: None (或 Vite)
Build command: npm run build
Build output directory: dist
Root directory: / (留空)
```

### 3.2 详细配置步骤
1. **Project name**: 确认为 `environment-manager`
2. **Production branch**: 选择 `main`
3. **Framework preset**: 选择 `None` 或 `Vite`
4. **Build command**: 输入 `npm run build`
5. **Build output directory**: 输入 `dist`
6. **Root directory**: 留空（表示根目录）

### 3.3 环境变量配置
在 **"Environment variables"** 部分添加：
```
NODE_VERSION = 18
ENVIRONMENT = production
```

点击 **"Add variable"** 按钮添加每个变量。

## 🗄️ 第四步：创建KV存储

### 4.1 创建KV命名空间
1. 在Cloudflare Dashboard左侧菜单选择 **"Workers & Pages"**
2. 点击 **"KV"** 标签
3. 点击 **"Create a namespace"** 按钮
4. 输入命名空间名称：`ENV_CONFIG`
5. 点击 **"Add"** 按钮

### 4.2 记录命名空间ID
创建成功后，页面会显示：
```
Namespace ID: abcd1234-5678-90ef-ghij-klmnopqrstuv
```
**重要：请复制并保存这个ID，稍后需要用到**

## 🔧 第五步：配置Worker绑定

### 5.1 返回Worker设置
1. 回到您的Worker详情页面
2. 点击 **"Settings"** 标签
3. 选择 **"Variables"** 部分

### 5.2 添加KV绑定
1. 在 **"KV Namespace Bindings"** 部分
2. 点击 **"Add binding"** 按钮
3. 配置绑定：
   ```
   Variable name: ENV_CONFIG
   KV namespace: 选择刚创建的 ENV_CONFIG 命名空间
   ```
4. 点击 **"Save"** 按钮

### 5.3 添加环境变量（可选）
在 **"Environment Variables"** 部分可以添加：
```
ENVIRONMENT = production
APP_VERSION = 2.0.0
```

## 🚀 第六步：触发首次部署

### 6.1 手动触发部署
1. 回到Worker的 **"Builds"** 设置页面
2. 点击 **"Trigger deployment"** 按钮
3. 或者推送新代码到GitHub触发自动部署

### 6.2 监控部署进度
1. 在 **"Deployments"** 标签查看部署状态
2. 可以查看构建日志和部署详情
3. 等待部署完成（通常需要1-3分钟）

## ✅ 第七步：验证部署

### 7.1 获取Worker URL
1. 在Worker详情页面顶部可以看到Worker URL
2. 格式通常为：`https://environment-manager.your-subdomain.workers.dev`

### 7.2 测试功能
1. **访问主页**：直接访问Worker URL
2. **测试API**：访问 `https://your-worker-url/api/health`
3. **测试KV**：访问 `https://your-worker-url/api/kv?action=test`

### 7.3 功能验证清单
- [ ] 主页正常显示
- [ ] 静态资源加载正常
- [ ] API端点响应正常
- [ ] KV存储连接成功
- [ ] 环境管理功能正常

## 🔄 第八步：设置自动部署

### 8.1 配置Webhook（自动完成）
连接GitHub后，Cloudflare会自动配置Webhook，实现：
- 推送到主分支自动部署
- Pull Request预览部署
- 部署状态回传到GitHub

### 8.2 分支部署策略
```
main分支 → 生产环境自动部署
develop分支 → 可配置为预览环境
Pull Request → 自动创建预览部署
```

## 📊 第九步：监控和管理

### 9.1 查看部署历史
1. 在Worker详情页面点击 **"Deployments"** 标签
2. 查看所有部署记录和状态
3. 可以回滚到任意历史版本

### 9.2 查看实时日志
1. 点击 **"Logs"** 标签
2. 点击 **"Begin log stream"** 开始查看实时日志
3. 监控Worker运行状态和错误信息

### 9.3 查看分析数据
1. 点击 **"Analytics"** 标签
2. 查看请求量、响应时间、错误率等指标
3. 分析Worker性能和使用情况

## 🔧 故障排除

### 常见问题及解决方案

**1. 构建失败**
```
错误：Build command failed
解决：
- 检查package.json中是否有build脚本
- 确认Node.js版本兼容性
- 查看构建日志中的具体错误
```

**2. KV绑定错误**
```
错误：KV binding ENV_CONFIG not found
解决：
- 确认KV命名空间已创建
- 检查绑定名称是否为ENV_CONFIG
- 重新保存绑定配置
```

**3. 静态资源404**
```
错误：Static assets not found
解决：
- 确认dist目录已正确构建
- 检查wrangler.toml中的assets配置
- 验证构建输出目录设置
```

**4. GitHub连接问题**
```
错误：Repository access denied
解决：
- 重新授权GitHub访问
- 确认仓库权限设置
- 检查Cloudflare GitHub App安装
```

## 📋 部署检查清单

完成部署前请确认：

- [ ] GitHub仓库代码最新
- [ ] Worker项目已创建
- [ ] GitHub仓库已连接
- [ ] 构建设置已配置
- [ ] KV命名空间已创建
- [ ] KV绑定已配置
- [ ] 首次部署已完成
- [ ] Worker URL可访问
- [ ] 所有功能测试通过
- [ ] 自动部署已启用

## 🎉 部署完成

恭喜！您已成功通过Cloudflare Dashboard完成了环境管理系统的部署。

**现在您拥有：**
- 🌍 全球边缘网络部署
- ⚡ 零冷启动性能
- 🔄 GitHub自动部署
- 📊 实时监控和日志
- 🛡️ 企业级安全性

**下一步操作：**
1. 配置自定义域名（可选）
2. 设置监控告警
3. 优化性能配置
4. 培训团队使用

**重要提醒：**
- 保存Worker URL以便访问
- 定期检查部署状态
- 监控资源使用情况
- 及时更新依赖版本
