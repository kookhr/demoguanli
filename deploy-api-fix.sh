#!/bin/bash
# 部署 API 修复文件到 Serv00

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
print_message "🚀 部署 API 修复文件到 Serv00" $BLUE
echo

# 检查必要文件
check_files() {
    print_step "检查必要文件..."
    
    local required_files=(
        "test-api.php"
        "fix-https-api.sh"
        "api/index.php"
    )
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            print_success "✓ $file"
        else
            print_error "✗ $file 缺失"
            return 1
        fi
    done
    
    return 0
}

# 构建项目
build_project() {
    print_step "构建前端项目..."
    
    if [ -f "package.json" ]; then
        if command -v npm >/dev/null 2>&1; then
            npm run build
            print_success "前端构建完成"
        else
            print_warning "npm 不可用，跳过构建"
        fi
    else
        print_warning "package.json 不存在，跳过构建"
    fi
}

# 创建部署包
create_deployment_package() {
    print_step "创建部署包..."
    
    # 创建临时目录
    local temp_dir="deploy_temp_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$temp_dir"
    
    # 复制必要文件
    print_step "复制文件..."
    
    # 复制前端文件
    if [ -d "dist" ]; then
        cp -r dist/* "$temp_dir/"
        print_success "✓ 前端文件已复制"
    else
        # 如果没有 dist，复制基本的 HTML 文件
        if [ -f "index.html" ]; then
            cp index.html "$temp_dir/"
        fi
        print_warning "⚠ 没有找到 dist 目录"
    fi
    
    # 复制 API 文件
    if [ -d "api" ]; then
        cp -r api "$temp_dir/"
        print_success "✓ API 文件已复制"
    fi
    
    # 复制测试文件
    cp test-api.php "$temp_dir/"
    print_success "✓ 测试文件已复制"
    
    # 复制配置文件
    if [ -f ".env" ]; then
        cp .env "$temp_dir/"
        print_success "✓ 环境配置已复制"
    fi
    
    # 复制数据库文件
    if [ -d "database" ]; then
        cp -r database "$temp_dir/"
        print_success "✓ 数据库文件已复制"
    fi
    
    # 创建优化的 .htaccess
    cat > "$temp_dir/.htaccess" << 'EOF'
# Serv00 环境管理系统 - API 修复版
RewriteEngine On

# 安全设置
<Files ".env">
    Order allow,deny
    Deny from all
</Files>

# 强制 MIME 类型
<FilesMatch "\.(js)$">
    ForceType application/javascript
    Header set Content-Type "application/javascript; charset=utf-8"
</FilesMatch>

<FilesMatch "\.(css)$">
    ForceType text/css
    Header set Content-Type "text/css; charset=utf-8"
</FilesMatch>

<FilesMatch "\.(json)$">
    ForceType application/json
    Header set Content-Type "application/json; charset=utf-8"
</FilesMatch>

<FilesMatch "\.(php)$">
    Header set Content-Type "application/json; charset=utf-8"
</FilesMatch>

# API 路由重写
RewriteCond %{REQUEST_URI} ^/api/
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ api/index.php [QSA,L]

# 前端路由
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api/
RewriteCond %{REQUEST_URI} !\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json|php)$
RewriteRule . /index.html [L]

# CORS 设置
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"

# 处理 OPTIONS 请求
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# 安全头部
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY

# 错误页面
ErrorDocument 404 /index.html

# 目录设置
Options -Indexes +FollowSymLinks
AddDefaultCharset UTF-8
DirectoryIndex index.html index.php
EOF
    
    print_success "✓ .htaccess 已创建"
    
    # 创建 API 目录的 .htaccess
    cat > "$temp_dir/api/.htaccess" << 'EOF'
# API 目录配置
RewriteEngine On

# 所有请求转发到 index.php
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]

# CORS 设置
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"

# 处理 OPTIONS 请求
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# 强制 JSON 内容类型
<FilesMatch "\.(php)$">
    Header set Content-Type "application/json; charset=utf-8"
</FilesMatch>
EOF
    
    print_success "✓ API .htaccess 已创建"
    
    # 创建部署压缩包
    tar -czf "api-fix-deployment.tar.gz" -C "$temp_dir" .
    
    # 清理临时目录
    rm -rf "$temp_dir"
    
    print_success "部署包已创建: api-fix-deployment.tar.gz"
}

# 生成部署命令
generate_deploy_commands() {
    print_step "生成 Serv00 部署命令..."
    
    cat > deploy-commands.txt << 'EOF'
# Serv00 部署命令
# 在 Serv00 终端中执行以下命令:

# 1. 进入网站目录
cd ~/domains/do.kandy.dpdns.org/public_html/

# 2. 备份现有文件
tar -czf backup_$(date +%Y%m%d_%H%M%S).tar.gz .

# 3. 下载部署包 (替换为实际的下载链接)
# wget https://github.com/kookhr/demoguanli/releases/download/latest/api-fix-deployment.tar.gz
# 或者使用 git 拉取最新代码:
git pull origin serv00

# 4. 解压部署包 (如果使用 wget)
# tar -xzf api-fix-deployment.tar.gz

# 5. 设置文件权限
chmod 644 .htaccess
chmod 644 api/.htaccess
chmod 644 *.php
chmod 644 api/*.php
chmod -R 644 api/config/
chmod -R 644 api/controllers/
chmod -R 644 api/models/

# 6. 测试 API
curl https://do.kandy.dpdns.org/test-api.php
curl https://do.kandy.dpdns.org/api/health

# 7. 查看错误日志 (如果有问题)
tail -f /tmp/serv00-php-errors.log
EOF
    
    print_success "部署命令已生成: deploy-commands.txt"
}

# 主函数
main() {
    if ! check_files; then
        print_error "文件检查失败，请确保所有必要文件存在"
        exit 1
    fi
    
    build_project
    echo
    
    create_deployment_package
    echo
    
    generate_deploy_commands
    echo
    
    print_success "🎉 API 修复部署包准备完成！"
    echo
    print_message "📋 下一步操作:" $BLUE
    echo "   1. 将 api-fix-deployment.tar.gz 上传到 GitHub"
    echo "   2. 在 Serv00 终端执行 deploy-commands.txt 中的命令"
    echo "   3. 测试 API 端点是否正常工作"
    echo
    print_message "🔍 测试地址:" $BLUE
    echo "   基础测试: https://do.kandy.dpdns.org/test-api.php"
    echo "   API 健康: https://do.kandy.dpdns.org/api/health"
    echo "   环境列表: https://do.kandy.dpdns.org/api/environments"
}

# 执行主函数
main "$@"
