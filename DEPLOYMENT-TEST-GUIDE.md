# 🧪 部署测试指南

## 📋 测试概览

本指南提供完整的部署测试流程，确保KV存储功能在Cloudflare免费计划下正常工作。

## 🎯 测试目标

- ✅ 验证Worker部署成功
- ✅ 确认KV存储连接正常
- ✅ 测试用户认证功能
- ✅ 验证环境管理功能
- ✅ 检查API端点响应
- ✅ 确保免费计划兼容性

## 🚀 部署前检查

### 1. 代码准备
```bash
# 确保在workers分支
git checkout workers

# 拉取最新代码
git pull origin workers

# 验证构建
npm run build
```

### 2. 配置检查
- ✅ `wrangler.toml` 配置正确
- ✅ KV命名空间ID已更新
- ✅ JWT密钥已设置
- ✅ 付费功能已禁用

### 3. 免费计划限制确认
```toml
# 已禁用的付费功能
# [placement] mode = "smart"
# [limits] cpu_ms = 50  
# [observability] enabled = true
```

## 🔧 部署步骤

### 第一步：推送代码
```bash
git add .
git commit -m "Ready for KV deployment"
git push origin workers
```

### 第二步：Cloudflare Dashboard配置
1. **创建KV命名空间**
   - Workers & Pages → KV → Create namespace
   - 名称：`ENV_CONFIG`
   - 记录命名空间ID

2. **配置Worker绑定**
   - Worker Settings → Variables
   - KV Namespace Bindings → Add binding
   - Variable name: `ENV_CONFIG`
   - 选择刚创建的命名空间

3. **更新wrangler.toml**
   - 将实际的KV命名空间ID替换 `your-kv-namespace-id`

4. **触发重新部署**
   - 推送更新后的配置
   - 或在Dashboard中手动部署

## 🧪 功能测试

### 1. 基础连接测试

**测试Worker响应**
```bash
curl https://your-worker-url/api/health
```

**期望响应**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "version": "2.0.0",
  "environment": "production",
  "edge": {
    "colo": "SJC",
    "country": "US",
    "timezone": "America/Los_Angeles"
  }
}
```

### 2. KV存储测试

**测试KV连接**
```bash
curl https://your-worker-url/api/kv?action=test
```

**期望响应**
```json
{
  "success": true,
  "available": true,
  "test": true,
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### 3. 用户认证测试

**初始化管理员账户**
```bash
curl -X POST https://your-worker-url/api/kv \
  -H "Content-Type: application/json" \
  -d '{"action": "init_admin"}'
```

**期望响应**
```json
{
  "success": true,
  "message": "Admin user created successfully",
  "defaultPassword": "admin123"
}
```

**测试登录**
```bash
curl -X POST https://your-worker-url/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

**期望响应**
```json
{
  "success": true,
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "username": "admin",
    "email": "admin@env-mgmt.local",
    "role": "admin"
  }
}
```

### 4. 环境管理测试

**获取认证token**
```bash
TOKEN="your-jwt-token-from-login"
```

**创建环境**
```bash
curl -X POST https://your-worker-url/api/environments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "测试环境",
    "url": "https://test.example.com",
    "description": "测试环境描述",
    "tags": ["测试", "API"],
    "networkType": "external",
    "group": "testing"
  }'
```

**获取环境列表**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://your-worker-url/api/environments
```

### 5. 前端界面测试

**访问主页**
- 打开 `https://your-worker-url`
- 应该显示登录页面

**登录测试**
- 用户名：`admin`
- 密码：`admin123`
- 应该成功登录并显示环境列表

**功能验证**
- ✅ 环境列表加载
- ✅ 状态检测功能
- ✅ 环境添加/编辑
- ✅ 用户信息显示
- ✅ 登出功能

## 📊 性能测试

### 1. 响应时间测试
```bash
# 测试API响应时间
time curl https://your-worker-url/api/health

# 测试静态资源加载
time curl https://your-worker-url/
```

### 2. 并发测试
```bash
# 简单并发测试
for i in {1..10}; do
  curl https://your-worker-url/api/health &
done
wait
```

### 3. 缓存验证
```bash
# 第一次请求
curl -I https://your-worker-url/api/health

# 第二次请求，检查X-Cache头
curl -I https://your-worker-url/api/health
```

## 🔍 故障排除

### 常见问题及解决方案

**1. KV绑定错误**
```
Error: KV binding ENV_CONFIG not configured
```
**解决方案**：
- 检查KV命名空间是否创建
- 验证绑定配置是否正确
- 确认命名空间ID是否匹配

**2. JWT验证失败**
```
Error: Invalid token
```
**解决方案**：
- 检查JWT_SECRET环境变量
- 验证token格式是否正确
- 确认token未过期

**3. 权限错误**
```
Error: Unauthorized
```
**解决方案**：
- 确认用户已登录
- 检查用户角色权限
- 验证API端点权限设置

**4. 静态资源404**
```
Error: 404 Not Found
```
**解决方案**：
- 检查Assets绑定配置
- 验证构建输出目录
- 确认SPA路由处理

## 📈 监控和维护

### 1. 日志监控
- Cloudflare Dashboard → Worker → Logs
- 监控错误和异常
- 分析性能指标

### 2. 使用量监控
- 检查免费计划限制
- 监控请求数量
- 跟踪KV操作次数

### 3. 定期维护
- 清理过期数据
- 更新安全配置
- 备份重要数据

## ✅ 测试清单

### 部署验证
- [ ] Worker部署成功
- [ ] 静态资源可访问
- [ ] API端点响应正常
- [ ] KV存储连接成功

### 功能验证
- [ ] 用户注册/登录
- [ ] 环境CRUD操作
- [ ] 状态历史记录
- [ ] 权限控制正常

### 性能验证
- [ ] 响应时间 < 500ms
- [ ] 缓存策略生效
- [ ] 边缘计算优化
- [ ] 免费计划兼容

### 安全验证
- [ ] JWT认证正常
- [ ] 密码哈希安全
- [ ] API权限控制
- [ ] 安全头配置

## 🎉 部署成功确认

当所有测试通过时，您的环境管理系统已成功部署！

**系统特性**：
- ⚡ 基于Cloudflare Workers的边缘计算
- 🗄️ KV存储的持久化数据管理
- 🔐 完整的用户认证和权限系统
- 📊 实时的环境状态监控
- 🌍 全球CDN加速的静态资源服务

**下一步**：
- 配置自定义域名（可选）
- 设置监控告警
- 优化缓存策略
- 扩展功能模块

恭喜！您现在拥有一个现代化、高性能的环境管理系统！🚀
