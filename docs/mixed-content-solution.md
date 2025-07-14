# 混合内容问题解决方案

## 问题描述

您遇到的问题是典型的**混合内容（Mixed Content）**安全限制：

- **开发环境**：`http://localhost:5173` → `http://demo-itam.cloudwise.com:18088` ✅ 正常
- **线上环境**：`https://your-domain.com` → `http://demo-itam.cloudwise.com:18088` ❌ 被阻止

## 原因分析

### 浏览器安全策略
现代浏览器实施严格的混合内容安全策略：
- **HTTPS 页面**不能访问 **HTTP 资源**
- 这是为了防止中间人攻击和数据泄露
- 包括 fetch、XMLHttpRequest 等所有网络请求

### 具体表现
```javascript
// 在 HTTPS 页面中执行会被阻止
fetch('http://demo-itam.cloudwise.com:18088')
  .catch(error => {
    // TypeError: Failed to fetch
    // 或者 Mixed Content 错误
  });
```

## 解决方案

### 1. img 标签探测（已实现）

我们的系统使用 `<img>` 标签来绕过混合内容限制：

```javascript
// img 标签可以跨协议加载资源
const img = new Image();
img.onload = () => console.log('服务可达');
img.onerror = () => console.log('服务可达但资源不存在');
img.src = 'http://demo-itam.cloudwise.com:18088/favicon.ico';
```

### 2. 探测逻辑优化

系统会自动检测混合内容并调整策略：

```javascript
const isMixedContent = (url) => {
  const currentProtocol = window.location.protocol;
  const targetProtocol = new URL(url).protocol;
  return currentProtocol === 'https:' && targetProtocol === 'http:';
};

// 对于混合内容，直接使用 img 探测
if (isMixedContent(url)) {
  return await checkImageProbe(url);
}
```

### 3. 多路径探测

系统会尝试多个常见路径来提高成功率：

```javascript
const probePaths = [
  '/favicon.ico',    // 网站图标（最常见）
  '/ping',           // 健康检查端点
  '/health',         // 健康检查端点
  '/status',         // 状态检查端点
  '/robots.txt',     // 机器人文件
  '/',               // 根路径
  '/api/health',     // API健康检查
  '/actuator/health' // Spring Boot健康检查
];
```

## 测试验证

### 1. 使用网络测试工具
访问 `/network-test` 页面：
1. 输入 `http://demo-itam.cloudwise.com:18088`
2. 点击测试
3. 观察检测结果和使用的方法

### 2. 预期结果
- **开发环境**：可能使用 `fetch-success` 方法
- **线上环境**：应该使用 `mixed-content-image-probe` 方法

### 3. 结果解读
```javascript
// 成功的混合内容探测结果
{
  reachable: true,
  method: 'mixed-content-image-probe',
  details: '混合内容img探测成功: http://demo-itam.cloudwise.com:18088/favicon.ico',
  probeUrl: 'http://demo-itam.cloudwise.com:18088/favicon.ico',
  mixedContent: true
}
```

## 限制和注意事项

### 1. img 探测的限制
- **无法获取 HTTP 状态码**：只能判断可达/不可达
- **依赖目标服务**：需要目标服务有可访问的资源
- **浏览器差异**：不同浏览器的行为可能略有不同

### 2. 可能的失败情况
- 目标服务完全阻止跨域请求
- 目标服务没有任何可访问的静态资源
- 网络防火墙阻止图像请求

### 3. 最佳实践
- **优先使用 HTTPS**：如果目标服务支持 HTTPS，建议使用
- **配置代理**：在服务器端配置代理来避免混合内容问题
- **使用相对协议**：如果可能，使用 `//domain.com` 格式

## 配置选项

### 启用调试模式
```javascript
// 在测试页面中启用调试模式
setDebugMode(true);
```

### 调整探测参数
```javascript
updateConfig({
  enableImageProbe: true,        // 启用图像探测
  imageProbeTimeout: 3000,       // 图像探测超时
  debugMode: true                // 调试模式
});
```

## 实际测试步骤

### 1. 本地测试（HTTP）
```bash
# 启动开发服务器
npm run dev
# 访问 http://localhost:5173/network-test
# 测试 http://demo-itam.cloudwise.com:18088
```

### 2. 线上测试（HTTPS）
```bash
# 部署到 HTTPS 环境
# 访问 https://your-domain.com/network-test
# 测试相同地址，观察方法差异
```

### 3. 对比结果
- 开发环境：应该显示 `fetch-success` 或类似方法
- 线上环境：应该显示 `mixed-content-image-probe` 方法

## 故障排除

### 1. 如果 img 探测也失败
```javascript
// 检查目标服务是否有可访问的资源
const testUrls = [
  'http://demo-itam.cloudwise.com:18088/',
  'http://demo-itam.cloudwise.com:18088/favicon.ico',
  'http://demo-itam.cloudwise.com:18088/ping'
];

// 手动测试
testUrls.forEach(url => {
  const img = new Image();
  img.onload = () => console.log(`✅ ${url} 可达`);
  img.onerror = () => console.log(`⚠️ ${url} 可达但资源不存在`);
  img.src = url;
});
```

### 2. 检查浏览器控制台
- 查看是否有混合内容警告
- 检查网络请求是否被阻止
- 观察具体的错误信息

### 3. 验证目标服务
```bash
# 直接访问目标服务
curl -I http://demo-itam.cloudwise.com:18088/
curl -I http://demo-itam.cloudwise.com:18088/favicon.ico
```

## 总结

通过 img 标签探测，我们可以有效绕过混合内容限制，检测 HTTP 服务的可达性。虽然无法获取详细的 HTTP 状态信息，但对于基本的连通性检测已经足够。

系统会自动识别混合内容情况并选择最适合的探测方法，确保在各种环境下都能正常工作。
