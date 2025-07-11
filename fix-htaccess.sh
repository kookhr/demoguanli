#!/bin/bash
# 快速修复 .htaccess API 路由问题

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_message() {
    echo -e "${2}${1}${NC}"
}

print_step() {
    print_message "🔄 $1" $BLUE
}

print_success() {
    print_message "✅ $1" $GREEN
}

print_warning() {
    print_message "⚠️  $1" $YELLOW
}

print_error() {
    print_message "❌ $1" $RED
}

echo
print_message "🔧 修复 .htaccess API 路由" $BLUE
echo

# 备份现有 .htaccess
if [ -f ".htaccess" ]; then
    print_step "备份现有 .htaccess..."
    cp .htaccess .htaccess.backup.$(date +%Y%m%d_%H%M%S)
    print_success "备份完成"
fi

# 创建优化的 .htaccess
print_step "创建优化的 .htaccess..."

cat > .htaccess << 'EOF'
# Serv00 环境管理系统 Apache 配置
RewriteEngine On

# 安全设置 - 隐藏敏感文件
<Files ".env">
    Order allow,deny
    Deny from all
</Files>

<Files "*.backup">
    Order allow,deny
    Deny from all
</Files>

<Files "*.log">
    Order allow,deny
    Deny from all
</Files>

# 强制 MIME 类型 - Serv00 FreeBSD Apache 需要
<FilesMatch "\.(js)$">
    ForceType application/javascript
    Header set Content-Type "application/javascript; charset=utf-8"
</FilesMatch>

<FilesMatch "\.(css)$">
    ForceType text/css
    Header set Content-Type "text/css; charset=utf-8"
</FilesMatch>

<FilesMatch "\.(svg)$">
    ForceType image/svg+xml
    Header set Content-Type "image/svg+xml; charset=utf-8"
</FilesMatch>

<FilesMatch "\.(json)$">
    ForceType application/json
    Header set Content-Type "application/json; charset=utf-8"
</FilesMatch>

# PHP 配置
<FilesMatch "\.(php)$">
    Header set Content-Type "application/json; charset=utf-8"
</FilesMatch>

# API 路由重写 - 优先级最高
RewriteCond %{REQUEST_URI} ^/api/
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ api/index.php [QSA,L]

# React Router 支持 - 前端路由
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api/
RewriteCond %{REQUEST_URI} !\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json)$
RewriteRule . /index.html [L]

# CORS 设置 - 全局
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, X-API-Key"
Header always set Access-Control-Max-Age "3600"

# 处理 OPTIONS 预检请求
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# 缓存控制
<IfModule mod_expires.c>
    ExpiresActive On
    
    # 静态资源长期缓存
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
    ExpiresByType image/svg+xml "access plus 1 month"
    
    # HTML 文件短期缓存
    ExpiresByType text/html "access plus 1 hour"
    
    # API 响应不缓存
    ExpiresByType application/json "access plus 0 seconds"
</IfModule>

# 压缩设置
<IfModule mod_deflate.c>
    SetOutputFilter DEFLATE
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

# 错误页面
ErrorDocument 404 /index.html
ErrorDocument 403 /index.html

# 目录浏览禁用
Options -Indexes

# 符号链接跟随
Options +FollowSymLinks

# 字符集设置
AddDefaultCharset UTF-8

# 默认文档
DirectoryIndex index.html index.php
EOF

print_success ".htaccess 已更新"

# 创建 API 目录的 .htaccess
if [ -d "api" ]; then
    print_step "创建 API 目录 .htaccess..."
    
    cat > api/.htaccess << 'EOF'
# API 目录配置
RewriteEngine On

# 所有请求都转发到 index.php
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]

# CORS 设置
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, X-API-Key"

# 处理 OPTIONS 请求
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# 强制 JSON 内容类型
<FilesMatch "\.(php)$">
    Header set Content-Type "application/json; charset=utf-8"
</FilesMatch>

# 安全设置
<Files ".env">
    Order allow,deny
    Deny from all
</Files>

<Files "*.backup">
    Order allow,deny
    Deny from all
</Files>
EOF
    
    print_success "API .htaccess 已创建"
fi

# 复制健康检查文件到 API 目录
if [ -f "api-health.php" ]; then
    print_step "部署 API 健康检查文件..."
    cp api-health.php api/
    print_success "健康检查文件已部署到 API 目录"
fi

# 测试配置
print_step "测试配置..."

if command -v curl >/dev/null 2>&1; then
    local domain="do.kandy.dpdns.org"
    
    # 测试健康检查
    print_step "测试 API 健康检查..."
    local health_response=$(curl -s -o /dev/null -w "%{http_code}" "https://$domain/api/api-health.php" 2>/dev/null || echo "000")
    
    case $health_response in
        200)
            print_success "✓ API 健康检查正常 (HTTP $health_response)"
            ;;
        *)
            print_warning "⚠ API 健康检查异常 (HTTP $health_response)"
            ;;
    esac
    
    # 测试数据库连接
    print_step "测试数据库连接..."
    local db_response=$(curl -s -o /dev/null -w "%{http_code}" "https://$domain/api/api-health.php/db" 2>/dev/null || echo "000")
    
    case $db_response in
        200)
            print_success "✓ 数据库连接测试正常 (HTTP $db_response)"
            ;;
        *)
            print_warning "⚠ 数据库连接测试异常 (HTTP $db_response)"
            ;;
    esac
else
    print_warning "curl 不可用，请手动测试"
fi

echo
print_success "🎉 .htaccess 修复完成！"
echo
print_message "📋 测试地址:" $BLUE
echo "   API 健康检查: https://do.kandy.dpdns.org/api/api-health.php"
echo "   数据库测试: https://do.kandy.dpdns.org/api/api-health.php/db"
echo "   服务器信息: https://do.kandy.dpdns.org/api/api-health.php/info"
echo
print_message "🔍 如果仍有问题，请运行:" $BLUE
echo "   ./fix-api.sh"
