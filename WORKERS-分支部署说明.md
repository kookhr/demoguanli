# 🌿 Workers 分支部署说明

## 📋 重要提醒

您的项目使用 **`workers`** 分支进行部署，不是常见的 `main` 分支。

## 🎯 关键配置信息

### 在Cloudflare Dashboard中的配置

```
Worker名称: environment-manager
GitHub仓库: your-username/your-repo-name
生产分支: workers  ← 重要！选择workers分支
构建命令: npm run build
输出目录: dist
```

## 🔧 部署步骤中的注意事项

### 第一步：连接GitHub时
- 选择您的仓库
- **分支选择：务必选择 `workers` 分支**
- 不要选择 `main` 或 `master` 分支

### 第二步：构建配置时
```
Project name: environment-manager
Production branch: workers  ← 确保这里是workers
Framework preset: None 或 Vite
Build command: npm run build
Build output directory: dist
Root directory: (留空)
```

### 第三步：环境变量
```
NODE_VERSION: 18
ENVIRONMENT: production
```

## 🚀 推送代码到workers分支

确保您的代码推送到正确的分支：

```bash
# 检查当前分支
git branch

# 如果不在workers分支，切换到workers分支
git checkout workers

# 添加新文件
git add .

# 提交更改
git commit -m "Add Cloudflare Workers support"

# 推送到workers分支
git push origin workers
```

## 🔄 自动部署触发

配置完成后，以下操作会触发自动部署：

- 推送代码到 `workers` 分支
- 合并PR到 `workers` 分支
- 在Dashboard中手动触发部署

## 📊 分支策略建议

```
开发流程:
feature分支 → workers分支 → 自动部署到生产环境

或者:
develop分支 → workers分支 → 自动部署到生产环境
```

## ⚠️ 常见错误避免

### 错误1：选择了错误的分支
```
❌ 错误：选择了main分支
✅ 正确：选择workers分支
```

### 错误2：推送到错误的分支
```
❌ 错误：git push origin main
✅ 正确：git push origin workers
```

### 错误3：构建配置中的分支设置
```
❌ 错误：Production branch: main
✅ 正确：Production branch: workers
```

## 🔍 验证部署配置

部署完成后，在Cloudflare Dashboard中验证：

1. **Worker设置页面**
   - 确认连接的分支是 `workers`
   - 检查最新部署的commit来自 `workers` 分支

2. **部署历史**
   - 查看部署记录显示的分支信息
   - 确认部署源是 `workers` 分支

3. **GitHub集成状态**
   - 在GitHub仓库的 `workers` 分支查看commit状态
   - 确认Cloudflare的部署状态显示

## 🎉 部署成功确认

当您看到以下信息时，表示部署成功：

```
✅ 部署成功
📍 分支: workers
🔗 Worker URL: https://environment-manager.your-subdomain.workers.dev
📊 最新commit: 来自workers分支
```

## 📞 故障排除

如果遇到部署问题：

1. **检查分支选择**
   - 确认Dashboard中选择的是 `workers` 分支
   - 重新配置分支设置

2. **检查代码推送**
   - 确认代码已推送到 `workers` 分支
   - 检查GitHub上的分支内容

3. **重新触发部署**
   - 在Dashboard中手动触发部署
   - 或推送新的commit到 `workers` 分支

## 💡 最佳实践

1. **保持分支同步**
   - 定期将其他分支的更改合并到 `workers` 分支
   - 确保 `workers` 分支包含最新的功能

2. **分支保护**
   - 考虑为 `workers` 分支设置保护规则
   - 要求PR审查后才能合并

3. **部署监控**
   - 监控 `workers` 分支的部署状态
   - 设置部署失败的通知

记住：始终使用 **`workers`** 分支进行Cloudflare Workers部署！
