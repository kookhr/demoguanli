# 缓存管理和快速更新指南

## 🚀 **快速更新缓存的方法**

### **方法1：使用快速部署脚本 (推荐)**

```bash
# 在项目根目录运行
./scripts/quick-deploy.sh
```

**脚本功能**:
- ✅ 自动更新版本号 (2.1.0 → 2.1.1)
- ✅ 更新构建时间戳
- ✅ 重新构建项目
- ✅ 推送到 Git 仓库
- ✅ 触发 Cloudflare Pages 自动部署
- ✅ 尝试自动清除缓存

### **方法2：手动版本更新**

1. **更新版本号**
```bash
# 编辑 wrangler.toml
APP_VERSION = "2.1.1"  # 增加版本号
BUILD_TIME = "2025-01-15T18:45:00Z"  # 更新时间
```

2. **重新构建和部署**
```bash
npm run build
git add .
git commit -m "🚀 版本更新 v2.1.1"
git push origin workers
```

### **方法3：使用缓存管理面板**

在系统管理页面中添加缓存管理组件：

```jsx
import CacheManager from './components/CacheManager';

// 在管理页面中使用
<CacheManager />
```

**功能特性**:
- 🔍 查看当前版本和缓存状态
- 🗑️ 一键清除所有缓存
- ⚡ 启用强制刷新模式
- 🔄 检查版本更新

### **方法4：API 直接调用**

```javascript
// 清除所有缓存
const clearCache = async () => {
  const response = await fetch('/api/cache/clear', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  
  if (response.ok) {
    window.location.reload();
  }
};

// 启用强制刷新
const forceRefresh = async () => {
  await fetch('/api/cache/force-refresh', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
};
```

## 🔧 **缓存机制说明**

### **缓存层级**

1. **浏览器缓存** (客户端)
   - 静态资源: 7天
   - HTML文件: 1小时
   - API响应: 5分钟

2. **Cloudflare Edge缓存** (CDN)
   - 静态资源: 7天
   - 动态内容: 根据 Cache-Control 头

3. **KV存储缓存** (后端)
   - 配置数据: 1小时
   - 用户数据: 实时更新

### **版本控制机制**

```javascript
// 响应头中包含版本信息
X-App-Version: 2.1.0
X-Build-Time: 2025-01-15T18:30:00Z
X-Force-Refresh: false
```

**版本检查逻辑**:
- 前端定期检查服务器版本
- 版本不匹配时提示用户更新
- 支持强制刷新模式

## ⚡ **立即生效的解决方案**

### **紧急更新流程**

1. **立即清除缓存**
```bash
# 使用快速部署脚本
./scripts/quick-deploy.sh

# 或手动执行
curl -X POST "https://your-domain.com/api/cache/clear" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

2. **启用强制刷新模式**
```bash
curl -X POST "https://your-domain.com/api/cache/force-refresh" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

3. **通知用户刷新**
```javascript
// 在前端显示更新通知
if (serverVersion !== clientVersion) {
  showUpdateNotification();
}
```

### **Cloudflare 特定操作**

1. **清除 Cloudflare 缓存**
   - 登录 Cloudflare Dashboard
   - 进入 Pages 项目
   - 点击 "Purge Cache" → "Purge Everything"

2. **强制重新部署**
   - 在 Pages 项目中点击 "Retry deployment"
   - 或推送新的 commit 触发自动部署

## 📊 **缓存状态监控**

### **实时监控指标**

```javascript
// 缓存状态检查
const cacheStatus = {
  version: "2.1.0",
  buildTime: "2025-01-15T18:30:00Z",
  forceRefresh: {
    active: false,
    until: null
  },
  cacheConfig: {
    staticAssets: 604800,  // 7天
    apiResponses: 300,     // 5分钟
    healthCheck: 60,       // 1分钟
    kvCache: 36000         // 1小时
  }
};
```

### **性能指标**

- **缓存命中率**: 目标 >90%
- **更新延迟**: <5分钟
- **用户感知延迟**: <30秒

## 🛠 **故障排除**

### **常见问题**

1. **更新不生效**
   ```bash
   # 检查版本号是否更新
   curl -I https://your-domain.com/api/info
   
   # 清除本地缓存
   localStorage.clear();
   sessionStorage.clear();
   
   # 硬刷新浏览器
   Ctrl + Shift + R (Windows/Linux)
   Cmd + Shift + R (Mac)
   ```

2. **部分用户看到旧版本**
   ```bash
   # 启用强制刷新模式
   curl -X POST "https://your-domain.com/api/cache/force-refresh"
   
   # 清除 CDN 缓存
   # 在 Cloudflare Dashboard 中操作
   ```

3. **API 响应缓存问题**
   ```javascript
   // 添加缓存破坏参数
   fetch(`/api/environments?v=${Date.now()}`);
   
   // 或设置 no-cache 头
   fetch('/api/environments', {
     headers: { 'Cache-Control': 'no-cache' }
   });
   ```

### **调试工具**

1. **浏览器开发者工具**
   - Network 标签查看缓存状态
   - Application 标签清除本地存储
   - Console 检查版本信息

2. **缓存检查命令**
   ```bash
   # 检查响应头
   curl -I https://your-domain.com/
   
   # 检查 API 版本
   curl https://your-domain.com/api/info
   
   # 检查缓存状态
   curl https://your-domain.com/api/cache/status
   ```

## 📋 **最佳实践**

### **部署流程**

1. **开发阶段**
   - 使用 `FORCE_REFRESH=true` 禁用缓存
   - 频繁测试缓存清除功能

2. **测试阶段**
   - 验证版本控制机制
   - 测试缓存清除 API

3. **生产部署**
   - 使用快速部署脚本
   - 监控缓存状态
   - 准备回滚方案

### **缓存策略**

1. **静态资源**: 长期缓存 + 版本控制
2. **API 响应**: 短期缓存 + 实时更新
3. **HTML 文件**: 中期缓存 + 版本检查

### **用户体验**

1. **渐进式更新**: 不强制用户立即刷新
2. **更新通知**: 友好的更新提示
3. **后台更新**: 预加载新版本资源

## 🚀 **快速上线检查清单**

- [ ] 更新版本号
- [ ] 重新构建项目
- [ ] 推送到 Git 仓库
- [ ] 等待自动部署完成
- [ ] 清除 Cloudflare 缓存
- [ ] 启用强制刷新模式
- [ ] 验证更新生效
- [ ] 通知用户刷新

**预计总时间**: 3-5分钟

使用这些方法，您可以在几分钟内让所有用户看到最新版本！
