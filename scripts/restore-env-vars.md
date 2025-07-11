# 环境变量恢复指南

如果环境变量在部署后丢失，请在Cloudflare Dashboard中重新添加以下变量：

## 🔧 Cloudflare Dashboard 设置路径
Workers & Pages → 选择项目 → Settings → Variables

## 📋 需要添加的环境变量

### 基础配置
```
APP_VERSION = 2.0.0
ENVIRONMENT = production
```

### 缓存配置（秒）
```
CACHE_STATIC_ASSETS = 86400    # 24小时
CACHE_API_RESPONSES = 600      # 10分钟  
CACHE_HEALTH_CHECK = 300       # 5分钟
CACHE_KV_CACHE = 1800         # 30分钟
```

### 安全配置（必需）
```
JWT_SECRET = your-secret-key-here
```

## ⚠️ 重要提醒

1. **JWT_SECRET**: 必须是一个强随机字符串，建议32位以上
2. **缓存时间**: 根据需要调整，单位为秒
3. **保存后**: 需要重新部署才能生效

## 🚀 快速设置命令

如果使用Wrangler CLI，可以用以下命令：

```bash
wrangler secret put JWT_SECRET
# 然后输入您的密钥
```

## 📝 常用时间换算

```
1分钟 = 60
5分钟 = 300
10分钟 = 600
30分钟 = 1800
1小时 = 3600
6小时 = 21600
12小时 = 43200
1天 = 86400
7天 = 604800
```
