#!/bin/bash

# 环境变量设置脚本
echo "🔧 设置Cloudflare Workers环境变量..."

# 检查是否安装了wrangler
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI 未安装，请先运行: npm install -g wrangler"
    exit 1
fi

# 设置JWT密钥
echo "🔑 设置JWT密钥..."
echo "请输入JWT密钥（建议32位随机字符串）:"
wrangler secret put JWT_SECRET

echo "✅ 环境变量设置完成！"
echo ""
echo "📋 其他环境变量已在 wrangler.toml 中配置:"
echo "- APP_VERSION = 2.0.0"
echo "- ENVIRONMENT = production"
echo "- CACHE_STATIC_ASSETS = 86400"
echo "- CACHE_API_RESPONSES = 600"
echo "- CACHE_HEALTH_CHECK = 300"
echo "- CACHE_KV_CACHE = 1800"
echo ""
echo "🚀 现在可以部署项目了: npm run build && wrangler deploy"
