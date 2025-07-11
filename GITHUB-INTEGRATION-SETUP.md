# 🔗 GitHub集成设置指南

Cloudflare Workers与GitHub的完整集成配置

## 📋 目录

- [前置要求](#前置要求)
- [GitHub Secrets配置](#github-secrets配置)
- [Workers Builds设置](#workers-builds设置)
- [自动化工作流](#自动化工作流)
- [部署策略](#部署策略)
- [监控和通知](#监控和通知)

## 🎯 前置要求

### GitHub仓库要求
- ✅ 公开或私有GitHub仓库
- ✅ 管理员权限
- ✅ Actions功能已启用

### Cloudflare账户要求
- ✅ Cloudflare免费或付费账户
- ✅ Workers功能已启用
- ✅ API Token创建权限

## 🔐 GitHub Secrets配置

### 第一步：创建Cloudflare API Token

1. **登录Cloudflare Dashboard**
   - 访问 https://dash.cloudflare.com
   - 点击右上角头像 → "My Profile"

2. **创建API Token**
   - 选择 "API Tokens" 标签
   - 点击 "Create Token"
   - 选择 "Custom token"

3. **配置Token权限**
   ```
   Token name: GitHub Actions Workers Deploy
   
   Permissions:
   - Account: Cloudflare Workers:Edit
   - Zone: Zone:Read
   - Zone: Zone Settings:Edit (如果使用自定义域名)
   
   Account Resources:
   - Include: All accounts
   
   Zone Resources:
   - Include: All zones (或指定域名)
   ```

4. **保存Token**
   - 点击 "Continue to summary"
   - 点击 "Create Token"
   - **重要：立即复制Token，只显示一次**

### 第二步：获取Account ID

1. **在Cloudflare Dashboard**
   - 选择任意域名或直接在右侧栏查看
   - 复制 "Account ID"

### 第三步：配置GitHub Secrets

1. **进入GitHub仓库设置**
   - 访问您的GitHub仓库
   - 点击 "Settings" 标签
   - 选择 "Secrets and variables" → "Actions"

2. **添加Repository Secrets**
   
   **CLOUDFLARE_API_TOKEN**
   ```
   Name: CLOUDFLARE_API_TOKEN
   Secret: 粘贴第一步创建的API Token
   ```
   
   **CLOUDFLARE_ACCOUNT_ID**
   ```
   Name: CLOUDFLARE_ACCOUNT_ID
   Secret: 粘贴第二步获取的Account ID
   ```

3. **验证Secrets配置**
   - 确认两个Secrets都已添加
   - 名称拼写正确（区分大小写）

## 🏗️ Workers Builds设置

### 方式一：通过Cloudflare Dashboard

1. **进入Workers & Pages**
   - 登录Cloudflare Dashboard
   - 选择 "Workers & Pages"
   - 点击 "Create application"

2. **连接GitHub**
   - 选择 "Pages" 标签
   - 点击 "Connect to Git"
   - 选择 "GitHub"
   - 授权Cloudflare访问

3. **选择仓库**
   - 选择您的环境管理系统仓库
   - 点击 "Begin setup"

4. **配置构建设置**
   ```
   Project name: environment-manager
   Production branch: main
   Build command: npm run build
   Build output directory: dist
   Root directory: /
   ```

5. **环境变量配置**
   ```
   NODE_VERSION: 18
   ENVIRONMENT: production
   ```

### 方式二：通过GitHub Actions（推荐）

使用项目中的 `.github/workflows/deploy-workers.yml` 文件：

```yaml
# 自动触发条件
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
```

## 🔄 自动化工作流

### 分支策略

```
develop 分支
    ↓ (自动部署)
开发环境 (environment-manager-dev)
    ↓
main 分支 (PR合并)
    ↓ (自动部署)
预生产环境 (environment-manager-staging)
    ↓ (手动批准)
生产环境 (environment-manager-prod)
```

### 部署环境配置

**开发环境**
```yaml
environment: development
# 自动部署，无需批准
```

**预生产环境**
```yaml
environment: staging
# 自动部署到main分支
```

**生产环境**
```yaml
environment: production
# 需要手动批准
```

### Pull Request预览

每个PR都会自动创建预览部署：
- 🔗 独立的预览URL
- 💬 自动评论PR
- 🔄 代码更新时自动更新

## 🚀 部署策略

### 渐进式部署

1. **功能开发**
   ```bash
   git checkout -b feature/new-feature
   # 开发功能
   git push origin feature/new-feature
   # 创建PR → 自动预览部署
   ```

2. **开发环境测试**
   ```bash
   git checkout develop
   git merge feature/new-feature
   git push origin develop
   # 自动部署到开发环境
   ```

3. **预生产验证**
   ```bash
   git checkout main
   git merge develop
   git push origin main
   # 自动部署到预生产环境
   ```

4. **生产发布**
   - 在GitHub Actions中手动批准
   - 自动部署到生产环境

### 回滚策略

**快速回滚**
```bash
# 回滚到上一个版本
wrangler rollback --env production

# 或者重新部署指定版本
git checkout <previous-commit>
npm run workers:deploy:production
```

## 📊 监控和通知

### GitHub Actions通知

**成功部署通知**
- ✅ 部署状态徽章
- 📝 部署摘要
- 🔗 Worker URL链接

**失败通知**
- ❌ 错误详情
- 📋 调试信息
- 🔧 修复建议

### Slack集成（可选）

在 `.github/workflows/deploy-workers.yml` 中添加：

```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 邮件通知

GitHub默认会发送邮件通知：
- 部署成功/失败
- PR状态更新
- 工作流错误

## 🔧 故障排除

### 常见问题

**1. API Token权限不足**
```
Error: Authentication error
解决：检查Token权限，确保包含Workers:Edit
```

**2. Account ID错误**
```
Error: Account not found
解决：验证Account ID是否正确复制
```

**3. 构建失败**
```
Error: Build command failed
解决：检查package.json中的build脚本
```

**4. KV绑定错误**
```
Error: KV namespace not found
解决：确保wrangler.toml中的KV ID正确
```

### 调试技巧

**查看Actions日志**
1. 进入GitHub仓库
2. 点击 "Actions" 标签
3. 选择失败的工作流
4. 查看详细日志

**本地测试工作流**
```bash
# 安装act工具
npm install -g @nektos/act

# 本地运行GitHub Actions
act push
```

**验证Secrets**
```bash
# 在Actions中添加调试步骤
- name: Debug Secrets
  run: |
    echo "API Token length: ${#CLOUDFLARE_API_TOKEN}"
    echo "Account ID: $CLOUDFLARE_ACCOUNT_ID"
```

## 📋 配置检查清单

部署前请确认：

- [ ] Cloudflare API Token已创建
- [ ] GitHub Secrets已正确配置
- [ ] wrangler.toml配置完整
- [ ] KV命名空间已创建
- [ ] GitHub Actions工作流文件存在
- [ ] 分支保护规则已设置（可选）
- [ ] 环境变量配置正确
- [ ] 构建命令测试通过

## 🎯 最佳实践

### 安全考虑
- 🔐 定期轮换API Token
- 🛡️ 使用最小权限原则
- 🔍 监控API使用情况
- 📝 记录访问日志

### 性能优化
- ⚡ 并行构建和部署
- 📦 缓存依赖项
- 🎯 条件部署
- 📊 监控部署时间

### 团队协作
- 👥 设置代码审查要求
- 📋 使用PR模板
- 🏷️ 标准化提交信息
- 📖 维护部署文档

## 🎉 集成完成

恭喜！您已成功配置GitHub与Cloudflare Workers的完整集成。

**现在您可以：**
- 🚀 推送代码自动部署
- 🔄 PR预览功能
- 📊 监控部署状态
- 🛡️ 安全的环境管理
- ⚡ 快速回滚能力

**下一步：**
- 测试完整的部署流程
- 配置监控告警
- 优化构建性能
- 培训团队成员
