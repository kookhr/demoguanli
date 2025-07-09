#!/bin/bash

# Serv00 部署脚本
# 使用方法: ./deploy-serv00.sh

set -e

echo "🚀 开始部署到 Serv00..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量（请根据您的实际情况修改）
SERV00_HOST="ftp.serv00.com"
SERV00_USER=""  # 您的 Serv00 用户名
SERV00_PASS="" # 您的 Serv00 密码
REMOTE_DIR="/domains/yourdomain.serv00.net/public_html"
LOCAL_BUILD_DIR="./dist"

# 检查配置
check_config() {
    echo -e "${BLUE}📋 检查配置...${NC}"
    
    if [ -z "$SERV00_USER" ]; then
        echo -e "${RED}❌ 错误: 请在脚本中设置 SERV00_USER${NC}"
        exit 1
    fi
    
    if [ -z "$SERV00_PASS" ]; then
        echo -e "${RED}❌ 错误: 请在脚本中设置 SERV00_PASS${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 配置检查完成${NC}"
}

# 检查依赖
check_dependencies() {
    echo -e "${BLUE}🔍 检查依赖...${NC}"
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ 错误: 未找到 Node.js，请先安装 Node.js${NC}"
        exit 1
    fi
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ 错误: 未找到 npm${NC}"
        exit 1
    fi
    
    # 检查 lftp (用于 FTP 上传)
    if ! command -v lftp &> /dev/null; then
        echo -e "${YELLOW}⚠️  警告: 未找到 lftp，正在尝试安装...${NC}"
        
        # 尝试安装 lftp
        if command -v brew &> /dev/null; then
            brew install lftp
        elif command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y lftp
        elif command -v yum &> /dev/null; then
            sudo yum install -y lftp
        else
            echo -e "${RED}❌ 错误: 无法自动安装 lftp，请手动安装${NC}"
            exit 1
        fi
    fi
    
    echo -e "${GREEN}✅ 依赖检查完成${NC}"
}

# 安装依赖
install_dependencies() {
    echo -e "${BLUE}📦 安装项目依赖...${NC}"
    
    if [ ! -d "node_modules" ]; then
        npm install
    else
        echo -e "${YELLOW}📦 node_modules 已存在，跳过安装${NC}"
    fi
    
    echo -e "${GREEN}✅ 依赖安装完成${NC}"
}

# 构建项目
build_project() {
    echo -e "${BLUE}🔨 构建项目...${NC}"
    
    # 清理旧的构建文件
    if [ -d "$LOCAL_BUILD_DIR" ]; then
        rm -rf "$LOCAL_BUILD_DIR"
        echo -e "${YELLOW}🗑️  清理旧的构建文件${NC}"
    fi
    
    # 执行构建
    npm run build
    
    # 检查构建是否成功
    if [ ! -d "$LOCAL_BUILD_DIR" ]; then
        echo -e "${RED}❌ 错误: 构建失败，未找到 dist 目录${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 项目构建完成${NC}"
}

# 创建 .htaccess 文件
create_htaccess() {
    echo -e "${BLUE}📝 创建 .htaccess 文件...${NC}"
    
    cat > "$LOCAL_BUILD_DIR/.htaccess" << 'EOF'
# 启用 Gzip 压缩
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# 设置缓存
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# SPA 路由支持
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>

# 安全头
<IfModule mod_headers.c>
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
EOF
    
    echo -e "${GREEN}✅ .htaccess 文件创建完成${NC}"
}

# 上传文件到 Serv00
upload_files() {
    echo -e "${BLUE}📤 上传文件到 Serv00...${NC}"
    
    # 创建 lftp 脚本
    cat > /tmp/lftp_script << EOF
set ftp:ssl-allow no
set ftp:ssl-force no
set ssl:verify-certificate no
open ftp://$SERV00_USER:$SERV00_PASS@$SERV00_HOST
cd $REMOTE_DIR
lcd $LOCAL_BUILD_DIR
mirror --reverse --delete --verbose --exclude-glob .git* --exclude-glob .DS_Store
quit
EOF
    
    # 执行上传
    if lftp -f /tmp/lftp_script; then
        echo -e "${GREEN}✅ 文件上传完成${NC}"
    else
        echo -e "${RED}❌ 错误: 文件上传失败${NC}"
        rm -f /tmp/lftp_script
        exit 1
    fi
    
    # 清理临时文件
    rm -f /tmp/lftp_script
}

# 验证部署
verify_deployment() {
    echo -e "${BLUE}🔍 验证部署...${NC}"
    
    # 构造网站 URL
    SITE_URL="https://${SERV00_USER}.serv00.net"
    
    echo -e "${BLUE}🌐 网站地址: ${SITE_URL}${NC}"
    
    # 检查网站是否可访问
    if command -v curl &> /dev/null; then
        echo -e "${BLUE}📡 检查网站可访问性...${NC}"
        
        if curl -s --head "$SITE_URL" | head -n 1 | grep -q "200 OK"; then
            echo -e "${GREEN}✅ 网站可正常访问${NC}"
        else
            echo -e "${YELLOW}⚠️  警告: 网站可能需要几分钟才能生效${NC}"
        fi
    fi
}

# 显示部署信息
show_deployment_info() {
    echo -e "\n${GREEN}🎉 部署完成！${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}📊 部署信息:${NC}"
    echo -e "   🌐 网站地址: https://${SERV00_USER}.serv00.net"
    echo -e "   📁 远程目录: $REMOTE_DIR"
    echo -e "   📦 本地构建: $LOCAL_BUILD_DIR"
    echo -e "   ⏰ 部署时间: $(date)"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}💡 提示:${NC}"
    echo -e "   • 如果网站无法访问，请等待几分钟后重试"
    echo -e "   • 可以在 Serv00 控制面板中查看详细信息"
    echo -e "   • 如需绑定自定义域名，请在控制面板中配置"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# 主函数
main() {
    echo -e "${GREEN}🚀 Serv00 部署脚本${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # 检查是否在项目根目录
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ 错误: 请在项目根目录运行此脚本${NC}"
        exit 1
    fi
    
    # 执行部署步骤
    check_config
    check_dependencies
    install_dependencies
    build_project
    create_htaccess
    upload_files
    verify_deployment
    show_deployment_info
}

# 运行主函数
main "$@"
