#!/bin/bash

# 环境管理系统 - Cloudflare Pages 部署脚本

echo "🚀 开始部署环境管理系统到 Cloudflare Pages..."

# 检查是否安装了必要的工具
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 请先安装 Node.js 和 npm"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 构建项目
echo "🔨 构建项目..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ 构建成功!"
    echo ""
    echo "📁 构建文件位于 dist/ 目录"
    echo ""
    echo "🌐 部署选项:"
    echo "1. Git 仓库部署 (推荐):"
    echo "   - 将代码推送到 GitHub/GitLab/Bitbucket"
    echo "   - 在 Cloudflare Pages 中连接仓库"
    echo ""
    echo "2. Wrangler CLI 部署:"
    echo "   npm install -g wrangler"
    echo "   wrangler login"
    echo "   wrangler pages deploy dist --project-name environment-management-system"
    echo ""
    echo "3. 手动上传:"
    echo "   - 访问 https://pages.cloudflare.com/"
    echo "   - 上传 dist/ 文件夹中的所有文件"
    echo ""
    echo "📖 详细说明请查看 DEPLOYMENT.md 文件"
else
    echo "❌ 构建失败，请检查错误信息"
    exit 1
fi
