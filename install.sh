#!/bin/bash

# 环境管理系统一行安装脚本
# 使用方法: curl -sSL https://raw.githubusercontent.com/your-repo/demo/serv00/install.sh | bash

# 设置脚本 URL（请替换为您的实际仓库地址）
SCRIPT_URL="https://raw.githubusercontent.com/your-username/your-repo/serv00/serv00-auto-deploy.sh"

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 环境管理系统 - 一键安装${NC}"
echo -e "${YELLOW}正在下载并执行部署脚本...${NC}"
echo ""

# 下载并执行部署脚本
if curl -sSL "$SCRIPT_URL" | bash; then
    echo -e "${GREEN}✅ 安装完成！${NC}"
else
    echo -e "${RED}❌ 安装失败，请检查网络连接或联系支持${NC}"
    exit 1
fi
