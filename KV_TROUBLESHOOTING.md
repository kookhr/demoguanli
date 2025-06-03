# 🔧 Cloudflare KV 故障排除指南

## 🚨 常见问题：KV 显示不可用

### 问题症状
- 部署到 Cloudflare Pages 后，存储状态显示 "KV 不可用"
- 配置仍然使用 localStorage 而不是 KV
- 控制台显示 "KV 绑定不可用" 的消息

### 🔍 排查步骤

#### 1. 检查 KV 命名空间是否创建

```bash
# 登录 Cloudflare
wrangler login

# 列出所有 KV 命名空间
wrangler kv:namespace list

# 如果没有，创建新的命名空间
wrangler kv:namespace create "ENV_CONFIG"
wrangler kv:namespace create "ENV_CONFIG" --preview
```

#### 2. 验证 wrangler.toml 配置

确保 `wrangler.toml` 文件包含正确的 KV 绑定：

```toml
# wrangler.toml
name = "environment-management-system"
compatibility_date = "2024-01-15"

[build]
command = "npm run build"
cwd = "."
watch_dir = "src"

[build.environment_variables]
NODE_VERSION = "18"

pages_build_output_dir = "dist"

# KV 命名空间绑定 - 重要！
[[kv_namespaces]]
binding = "ENV_CONFIG"
id = "your-actual-kv-namespace-id"
preview_id = "your-actual-preview-kv-namespace-id"
```

**注意**: 将 `your-actual-kv-namespace-id` 替换为实际的命名空间 ID。

#### 3. 在 Cloudflare Pages 中配置 KV 绑定

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Pages** → 选择您的项目
3. 点击 **Settings** 标签页
4. 找到 **Functions** 部分
5. 点击 **KV namespace bindings**
6. 添加绑定：
   - **Variable name**: `ENV_CONFIG`
   - **KV namespace**: 选择您创建的命名空间

#### 4. 检查部署日志

在 Cloudflare Pages 的部署页面查看构建日志，确认：
- 构建成功完成
- 没有 KV 相关的错误信息
- 绑定配置被正确识别

### 🛠️ 解决方案

#### 方案 1: 重新配置 KV 绑定

```bash
# 1. 获取命名空间 ID
wrangler kv:namespace list

# 2. 更新 wrangler.toml 中的 ID
# 3. 重新部署
git add wrangler.toml
git commit -m "Update KV namespace IDs"
git push
```

#### 方案 2: 通过 Cloudflare Dashboard 手动配置

1. **创建 KV 命名空间**:
   - Dashboard → Workers & Pages → KV
   - 点击 "Create a namespace"
   - 名称: `ENV_CONFIG`

2. **绑定到 Pages 项目**:
   - Pages → 您的项目 → Settings → Functions
   - KV namespace bindings → Add binding
   - Variable name: `ENV_CONFIG`
   - KV namespace: 选择刚创建的命名空间

3. **重新部署**:
   - 触发新的部署或推送代码更改

#### 方案 3: 使用 Wrangler CLI 部署

```bash
# 确保 wrangler.toml 配置正确
wrangler pages deploy dist --project-name environment-management-system
```

### 🔍 验证 KV 连接

部署后，打开浏览器开发者工具的控制台，查看：

1. **成功连接的日志**:
   ```
   ✅ KV 绑定检测成功 (全局变量)
   📖 从 KV 读取环境配置...
   💾 保存到 KV 存储...
   ```

2. **失败的日志**:
   ```
   ❌ KV 绑定不可用，将使用 localStorage
   🌐 检测到 Cloudflare 环境，但 KV 绑定不可用
   ```

### 📋 检查清单

- [ ] KV 命名空间已创建
- [ ] `wrangler.toml` 包含正确的绑定配置
- [ ] Cloudflare Pages 项目中已添加 KV 绑定
- [ ] 绑定变量名为 `ENV_CONFIG`
- [ ] 已重新部署应用
- [ ] 浏览器控制台显示 KV 连接成功

### 🚀 高级故障排除

#### 检查绑定是否正确注入

在应用中添加调试代码：

```javascript
// 在浏览器控制台中运行
console.log('ENV_CONFIG:', typeof ENV_CONFIG, ENV_CONFIG);
console.log('globalThis.ENV_CONFIG:', typeof globalThis.ENV_CONFIG, globalThis.ENV_CONFIG);
console.log('window.ENV_CONFIG:', typeof window.ENV_CONFIG, window.ENV_CONFIG);
```

#### 测试 KV 操作

```javascript
// 在浏览器控制台中测试
if (typeof ENV_CONFIG !== 'undefined') {
  ENV_CONFIG.put('test', 'hello').then(() => {
    console.log('KV put 成功');
    return ENV_CONFIG.get('test');
  }).then(value => {
    console.log('KV get 结果:', value);
  }).catch(error => {
    console.error('KV 操作失败:', error);
  });
}
```

### 📞 获取帮助

如果问题仍然存在：

1. **查看应用内诊断**:
   - 访问配置管理页面
   - 查看 "KV 连接诊断" 面板
   - 复制诊断报告

2. **Cloudflare 社区**:
   - [Cloudflare Community](https://community.cloudflare.com/)
   - [Workers Discord](https://discord.gg/cloudflaredev)

3. **官方文档**:
   - [KV 存储文档](https://developers.cloudflare.com/kv/)
   - [Pages Functions 绑定](https://developers.cloudflare.com/pages/functions/bindings/)

### 💡 最佳实践

1. **始终使用降级策略**: 应用应该在 KV 不可用时自动降级到 localStorage
2. **添加详细日志**: 在开发和调试时启用详细的控制台日志
3. **测试部署**: 在生产环境中测试 KV 功能
4. **监控存储状态**: 定期检查存储状态面板

### 🔄 自动恢复

应用已内置自动恢复机制：
- KV 不可用时自动使用 localStorage
- 定期重试 KV 连接
- 数据自动同步和备份
- 错误时的优雅降级
