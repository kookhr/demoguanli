#!/bin/bash

# 快速测试构建脚本 - 用于验证修复是否成功
# 使用方法: ./test-build.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 测试环境管理系统构建...${NC}"

# 检查是否在项目目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi

# 检查 Node.js 版本
NODE_VERSION=$(node --version 2>/dev/null || echo "未安装")
echo -e "📋 Node.js 版本: ${GREEN}$NODE_VERSION${NC}"

# 检查是否有 kvApi 引用
echo -e "${BLUE}🔍 检查 kvApi 引用...${NC}"
if grep -r "kvApi" src/ 2>/dev/null; then
    echo -e "${RED}❌ 发现 kvApi 引用，需要修复${NC}"
    exit 1
else
    echo -e "${GREEN}✅ 没有发现 kvApi 引用${NC}"
fi

# 检查是否有 ./kvApi 导入
echo -e "${BLUE}🔍 检查 kvApi 导入...${NC}"
if grep -r "from.*kvApi\|import.*kvApi" src/ 2>/dev/null; then
    echo -e "${RED}❌ 发现 kvApi 导入，需要修复${NC}"
    exit 1
else
    echo -e "${GREEN}✅ 没有发现 kvApi 导入${NC}"
fi

# 清理旧的构建
echo -e "${BLUE}🧹 清理旧的构建...${NC}"
rm -rf dist node_modules package-lock.json

# 安装依赖
echo -e "${BLUE}📦 安装依赖...${NC}"
npm cache clean --force
npm install

# 检查关键依赖
echo -e "${BLUE}🔍 检查关键依赖...${NC}"
if npm list vite >/dev/null 2>&1; then
    VITE_VERSION=$(npm list vite --depth=0 | grep vite | cut -d'@' -f2)
    echo -e "✅ Vite: ${GREEN}$VITE_VERSION${NC}"
else
    echo -e "${YELLOW}⚠️  Vite 未找到，尝试安装...${NC}"
    npm install vite --save-dev
fi

if npm list react >/dev/null 2>&1; then
    REACT_VERSION=$(npm list react --depth=0 | grep react | cut -d'@' -f2)
    echo -e "✅ React: ${GREEN}$REACT_VERSION${NC}"
else
    echo -e "${RED}❌ React 未找到${NC}"
    exit 1
fi

# 尝试构建
echo -e "${BLUE}🏗️ 开始构建...${NC}"
if npm run build; then
    echo -e "${GREEN}✅ 构建成功！${NC}"
    
    # 检查构建结果
    if [ -d "dist" ] && [ "$(ls -A dist)" ]; then
        echo -e "${GREEN}📊 构建统计:${NC}"
        echo -e "   • 文件数量: $(find dist -type f | wc -l)"
        echo -e "   • 总大小: $(du -sh dist 2>/dev/null | cut -f1 || echo '未知')"
        echo -e "   • 主要文件:"
        ls -la dist/ | head -5
        
        # 检查关键文件
        if [ -f "dist/index.html" ]; then
            echo -e "   ✅ index.html 存在"
        else
            echo -e "   ${YELLOW}⚠️  index.html 不存在${NC}"
        fi
        
        if [ -d "dist/assets" ]; then
            echo -e "   ✅ assets 目录存在"
        else
            echo -e "   ${YELLOW}⚠️  assets 目录不存在${NC}"
        fi
        
        echo -e "${GREEN}🎉 构建测试通过！${NC}"
        echo -e "${BLUE}💡 现在可以运行完整的部署脚本了${NC}"
        
    else
        echo -e "${RED}❌ 构建目录为空${NC}"
        exit 1
    fi
    
else
    echo -e "${RED}❌ 构建失败${NC}"
    echo -e "${YELLOW}💡 可能的解决方案:${NC}"
    echo -e "   1. 检查 Node.js 版本是否兼容"
    echo -e "   2. 清理 node_modules 并重新安装"
    echo -e "   3. 检查是否还有未修复的 kvApi 引用"
    echo -e "   4. 运行 ./fix-build.sh 尝试修复"
    exit 1
fi

echo -e "${GREEN}🎊 所有测试通过！可以进行部署了${NC}"
