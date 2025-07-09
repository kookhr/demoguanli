#!/bin/bash

# Serv00 环境管理系统一键部署脚本
# 使用方法: ./deploy-serv00-complete.sh

set -e

echo "🚀 开始 Serv00 环境管理系统部署..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量 - 请根据您的实际情况修改
SERV00_USER=""                    # 您的 Serv00 用户名
SERV00_DOMAIN=""                  # 您的域名，如: username.serv00.net
DB_NAME="environment_manager"     # 数据库名称
DB_USER=""                        # 数据库用户名
DB_PASSWORD=""                    # 数据库密码
PROJECT_NAME="environment-manager"

# 高级配置（通常不需要修改）
BACKUP_ENABLED=true               # 是否启用备份
CLEANUP_ENABLED=true              # 是否清理临时文件
VERIFY_DEPLOYMENT=true            # 是否验证部署结果

# 检查配置
check_config() {
    echo -e "${BLUE}📋 检查配置...${NC}"
    
    if [ -z "$SERV00_USER" ]; then
        echo -e "${RED}❌ 错误: 请在脚本中设置 SERV00_USER${NC}"
        exit 1
    fi
    
    if [ -z "$SERV00_DOMAIN" ]; then
        echo -e "${RED}❌ 错误: 请在脚本中设置 SERV00_DOMAIN${NC}"
        exit 1
    fi
    
    if [ -z "$DB_USER" ]; then
        echo -e "${RED}❌ 错误: 请在脚本中设置 DB_USER${NC}"
        exit 1
    fi
    
    if [ -z "$DB_PASSWORD" ]; then
        echo -e "${RED}❌ 错误: 请在脚本中设置 DB_PASSWORD${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 配置检查完成${NC}"
}

# 检查依赖
check_dependencies() {
    echo -e "${BLUE}🔍 检查依赖...${NC}"
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ 错误: 未找到 Node.js${NC}"
        exit 1
    fi
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ 错误: 未找到 npm${NC}"
        exit 1
    fi
    
    # 检查 SSH
    if ! command -v ssh &> /dev/null; then
        echo -e "${RED}❌ 错误: 未找到 SSH${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 依赖检查完成${NC}"
}

# 构建前端项目
build_frontend() {
    echo -e "${BLUE}🔨 构建前端项目...${NC}"
    
    # 安装依赖
    npm install
    
    # 构建项目
    npm run build
    
    if [ ! -d "dist" ]; then
        echo -e "${RED}❌ 错误: 构建失败，未找到 dist 目录${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 前端构建完成${NC}"
}

# 创建环境配置文件
create_env_config() {
    echo -e "${BLUE}📝 创建环境配置文件...${NC}"
    
    # 创建 .env 文件
    cat > api/.env << EOF
# Serv00 数据库配置
DB_HOST=localhost
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_PORT=3306

# API 配置
API_BASE_URL=/api
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRATION=86400

# 应用配置
APP_ENV=production
APP_DEBUG=false
APP_URL=https://${SERV00_DOMAIN}

# 日志配置
LOG_LEVEL=error
LOG_FILE=/tmp/environment_manager.log
EOF
    
    echo -e "${GREEN}✅ 环境配置文件创建完成${NC}"
}

# 创建 .htaccess 文件
create_htaccess() {
    echo -e "${BLUE}📝 创建 .htaccess 文件...${NC}"
    
    # 为前端创建 .htaccess
    cat > dist/.htaccess << 'EOF'
# 启用重写引擎
RewriteEngine On

# SPA 路由支持
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(?!api/).*$ /index.html [L]

# API 路由重写
RewriteRule ^api/(.*)$ /api/index.php [L,QSA]

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
    AddOutputFilterByType DEFLATE application/json
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

# 安全头
<IfModule mod_headers.c>
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set X-XSS-Protection "1; mode=block"
</IfModule>

# 禁止访问敏感文件
<Files ".env">
    Order allow,deny
    Deny from all
</Files>

<Files "*.sql">
    Order allow,deny
    Deny from all
</Files>
EOF
    
    # 为 API 创建 .htaccess
    cat > api/.htaccess << 'EOF'
# 启用重写引擎
RewriteEngine On

# 将所有请求重定向到 index.php
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [L,QSA]

# 设置 PHP 配置
php_value upload_max_filesize 10M
php_value post_max_size 10M
php_value memory_limit 128M
php_value max_execution_time 300

# 安全配置
<Files ".env">
    Order allow,deny
    Deny from all
</Files>

# 启用错误日志
php_flag log_errors on
php_value error_log /tmp/php_errors.log
EOF
    
    echo -e "${GREEN}✅ .htaccess 文件创建完成${NC}"
}

# 准备部署文件
prepare_deployment() {
    echo -e "${BLUE}📦 准备部署文件...${NC}"
    
    # 创建部署目录
    mkdir -p deployment
    
    # 复制前端文件
    cp -r dist/* deployment/
    
    # 复制 API 文件
    cp -r api deployment/
    
    # 复制数据库文件
    cp -r database deployment/
    
    # 创建部署信息文件
    cat > deployment/DEPLOYMENT_INFO.txt << EOF
Environment Manager - Serv00 Deployment
========================================

部署时间: $(date)
版本: 1.0.0
域名: ${SERV00_DOMAIN}
数据库: ${DB_NAME}

文件结构:
- index.html (前端入口)
- assets/ (前端资源)
- api/ (后端 API)
- database/ (数据库脚本)

部署后需要执行的步骤:
1. 创建数据库: ${DB_NAME}
2. 导入数据库结构: mysql -u ${DB_USER} -p ${DB_NAME} < database/init.sql
3. 配置 PHP 环境变量
4. 测试 API 连接: https://${SERV00_DOMAIN}/api/health

管理员账户:
用户名: admin
密码: admin123 (请立即修改)
EOF
    
    echo -e "${GREEN}✅ 部署文件准备完成${NC}"
}

# 上传到 Serv00
upload_to_serv00() {
    echo -e "${BLUE}📤 上传文件到 Serv00...${NC}"
    
    # 使用 rsync 上传文件
    echo -e "${YELLOW}正在上传文件，请输入 SSH 密码...${NC}"
    
    rsync -avz --delete \
        --exclude='.git*' \
        --exclude='node_modules' \
        --exclude='*.log' \
        deployment/ \
        ${SERV00_USER}@${SERV00_DOMAIN}:domains/${SERV00_DOMAIN}/public_html/
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 文件上传完成${NC}"
    else
        echo -e "${RED}❌ 文件上传失败${NC}"
        exit 1
    fi
}

# 远程数据库初始化
remote_database_setup() {
    echo -e "${BLUE}🗄️ 初始化远程数据库...${NC}"
    
    echo -e "${YELLOW}正在连接到 Serv00 执行数据库初始化...${NC}"
    
    ssh ${SERV00_USER}@${SERV00_DOMAIN} << EOF
# 创建数据库
mysql -u ${DB_USER} -p${DB_PASSWORD} -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci;"

# 导入数据库结构
mysql -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} < domains/${SERV00_DOMAIN}/public_html/database/init.sql

# 检查数据库
mysql -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} -e "SHOW TABLES;"

echo "数据库初始化完成"
EOF
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 数据库初始化完成${NC}"
    else
        echo -e "${RED}❌ 数据库初始化失败${NC}"
        exit 1
    fi
}

# 验证部署
verify_deployment() {
    echo -e "${BLUE}🔍 验证部署...${NC}"
    
    # 检查网站是否可访问
    echo -e "${BLUE}📡 检查网站可访问性...${NC}"
    
    if curl -s --head "https://${SERV00_DOMAIN}" | head -n 1 | grep -q "200\|301\|302"; then
        echo -e "${GREEN}✅ 网站可正常访问${NC}"
    else
        echo -e "${YELLOW}⚠️  网站可能需要几分钟才能生效${NC}"
    fi
    
    # 检查 API 健康状态
    echo -e "${BLUE}🔌 检查 API 状态...${NC}"
    
    if curl -s "https://${SERV00_DOMAIN}/api/health" | grep -q "ok"; then
        echo -e "${GREEN}✅ API 正常工作${NC}"
    else
        echo -e "${YELLOW}⚠️  API 可能需要配置或调试${NC}"
    fi
}

# 显示部署信息
show_deployment_info() {
    echo -e "\n${GREEN}🎉 部署完成！${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}📊 部署信息:${NC}"
    echo -e "   🌐 网站地址: https://${SERV00_DOMAIN}"
    echo -e "   🔌 API 地址: https://${SERV00_DOMAIN}/api"
    echo -e "   🗄️ 数据库名: ${DB_NAME}"
    echo -e "   👤 管理员: admin / admin123"
    echo -e "   ⏰ 部署时间: $(date)"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}📋 后续步骤:${NC}"
    echo -e "   1. 访问网站并使用管理员账户登录"
    echo -e "   2. 立即修改默认管理员密码"
    echo -e "   3. 添加您的环境配置"
    echo -e "   4. 测试环境检测功能"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎊 享受您的环境管理系统！${NC}\n"
}

# 清理临时文件
cleanup() {
    echo -e "${BLUE}🧹 清理临时文件...${NC}"
    rm -rf deployment
    echo -e "${GREEN}✅ 清理完成${NC}"
}

# 主函数
main() {
    echo -e "${GREEN}🚀 Serv00 环境管理系统一键部署${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # 检查是否在项目根目录
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ 错误: 请在项目根目录运行此脚本${NC}"
        exit 1
    fi
    
    # 执行部署步骤
    check_config
    check_dependencies
    build_frontend
    create_env_config
    create_htaccess
    prepare_deployment
    upload_to_serv00
    remote_database_setup
    verify_deployment
    show_deployment_info
    cleanup
}

# 错误处理
trap 'echo -e "${RED}❌ 部署过程中发生错误${NC}"; cleanup; exit 1' ERR

# 运行主函数
main "$@"
