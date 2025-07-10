#!/bin/bash
# Serv00 502 错误诊断和修复脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

print_info() {
    print_message "ℹ️  $1" $PURPLE
}

# 配置
DOMAIN="do.kandy.dpdns.org"

echo
print_message "🔧 Serv00 502 错误诊断工具" $BLUE
echo

# 检查文件结构
check_files() {
    print_step "检查文件结构..."
    
    local required_files=(
        "index.html"
        "api/index.php"
        ".htaccess"
    )
    
    local missing_files=0
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            print_success "✓ $file 存在"
        else
            print_error "✗ $file 缺失"
            ((missing_files++))
        fi
    done
    
    if [ $missing_files -gt 0 ]; then
        print_error "发现 $missing_files 个缺失文件"
        return 1
    fi
    
    return 0
}

# 检查文件权限
check_permissions() {
    print_step "检查文件权限..."
    
    # 检查 index.html
    if [ -f "index.html" ]; then
        local perm=$(stat -c "%a" index.html 2>/dev/null || stat -f "%A" index.html 2>/dev/null)
        print_info "index.html 权限: $perm"
    fi
    
    # 检查 API 目录
    if [ -d "api" ]; then
        local api_perm=$(stat -c "%a" api 2>/dev/null || stat -f "%A" api 2>/dev/null)
        print_info "api/ 目录权限: $api_perm"
    fi
    
    # 检查 PHP 文件
    if [ -f "api/index.php" ]; then
        local php_perm=$(stat -c "%a" api/index.php 2>/dev/null || stat -f "%A" api/index.php 2>/dev/null)
        print_info "api/index.php 权限: $php_perm"
        
        if [ "$php_perm" != "644" ] && [ "$php_perm" != "755" ]; then
            print_warning "建议设置 PHP 文件权限为 644"
            chmod 644 api/index.php
            print_success "已修复 PHP 文件权限"
        fi
    fi
    
    # 检查 .htaccess
    if [ -f ".htaccess" ]; then
        local htaccess_perm=$(stat -c "%a" .htaccess 2>/dev/null || stat -f "%A" .htaccess 2>/dev/null)
        print_info ".htaccess 权限: $htaccess_perm"
    fi
}

# 检查 PHP 语法
check_php_syntax() {
    print_step "检查 PHP 语法..."
    
    if ! command -v php >/dev/null 2>&1; then
        print_warning "PHP 命令不可用，跳过语法检查"
        return 0
    fi
    
    local php_files=(
        "api/index.php"
        "api/config/database.php"
    )
    
    for file in "${php_files[@]}"; do
        if [ -f "$file" ]; then
            if php -l "$file" >/dev/null 2>&1; then
                print_success "✓ $file 语法正确"
            else
                print_error "✗ $file 语法错误:"
                php -l "$file"
                return 1
            fi
        fi
    done
    
    return 0
}

# 检查 .htaccess 配置
check_htaccess() {
    print_step "检查 .htaccess 配置..."
    
    if [ ! -f ".htaccess" ]; then
        print_error ".htaccess 文件不存在"
        return 1
    fi
    
    # 检查关键配置
    local checks=(
        "RewriteEngine On"
        "RewriteRule.*api.*index.php"
        "ForceType application/javascript"
    )
    
    for check in "${checks[@]}"; do
        if grep -q "$check" .htaccess; then
            print_success "✓ 找到: $check"
        else
            print_warning "⚠ 未找到: $check"
        fi
    done
    
    # 显示 .htaccess 内容
    print_info ".htaccess 内容预览:"
    head -20 .htaccess | sed 's/^/   /'
    
    return 0
}

# 测试 PHP 执行
test_php_execution() {
    print_step "测试 PHP 执行..."
    
    if ! command -v php >/dev/null 2>&1; then
        print_warning "PHP 命令不可用，跳过执行测试"
        return 0
    fi
    
    # 创建简单的 PHP 测试文件
    cat > test-php.php << 'EOF'
<?php
echo "PHP 执行正常\n";
echo "PHP 版本: " . PHP_VERSION . "\n";
echo "当前时间: " . date('Y-m-d H:i:s') . "\n";

// 测试数据库连接
if (file_exists('api/config/database.php')) {
    echo "数据库配置文件存在\n";
} else {
    echo "数据库配置文件不存在\n";
}
?>
EOF
    
    if php test-php.php; then
        print_success "PHP 执行测试通过"
    else
        print_error "PHP 执行测试失败"
        return 1
    fi
    
    # 清理测试文件
    rm -f test-php.php
    
    return 0
}

# 测试网络访问
test_network_access() {
    print_step "测试网络访问..."
    
    if ! command -v curl >/dev/null 2>&1; then
        print_warning "curl 命令不可用，跳过网络测试"
        return 0
    fi
    
    # 测试前端
    print_info "测试前端访问..."
    local frontend_response=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" 2>/dev/null || echo "000")
    
    case $frontend_response in
        200)
            print_success "✓ 前端访问正常 (HTTP $frontend_response)"
            ;;
        502)
            print_error "✗ 前端 502 错误 - 网关问题"
            ;;
        404)
            print_warning "⚠ 前端 404 错误 - 文件未找到"
            ;;
        *)
            print_warning "⚠ 前端响应异常 (HTTP $frontend_response)"
            ;;
    esac
    
    # 测试 API
    print_info "测试 API 访问..."
    local api_response=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/health" 2>/dev/null || echo "000")
    
    case $api_response in
        200)
            print_success "✓ API 访问正常 (HTTP $api_response)"
            # 获取 API 内容
            local api_content=$(curl -s "https://$DOMAIN/api/health" 2>/dev/null)
            print_info "API 响应: $api_content"
            ;;
        502)
            print_error "✗ API 502 错误 - 网关问题"
            ;;
        500)
            print_error "✗ API 500 错误 - 服务器内部错误"
            ;;
        *)
            print_warning "⚠ API 响应异常 (HTTP $api_response)"
            ;;
    esac
    
    return 0
}

# 检查错误日志
check_error_logs() {
    print_step "检查错误日志..."
    
    local log_files=(
        "/tmp/serv00-php-errors.log"
        "/tmp/php-errors.log"
        "error.log"
    )
    
    for log_file in "${log_files[@]}"; do
        if [ -f "$log_file" ]; then
            print_info "发现日志文件: $log_file"
            print_info "最近的错误 (最后 10 行):"
            tail -10 "$log_file" | sed 's/^/   /'
            echo
        fi
    done
}

# 修复常见问题
fix_common_issues() {
    print_step "修复常见问题..."
    
    # 修复文件权限
    print_info "设置正确的文件权限..."
    find . -type f -name "*.php" -exec chmod 644 {} \;
    find . -type f -name "*.html" -exec chmod 644 {} \;
    find . -type f -name ".htaccess" -exec chmod 644 {} \;
    find . -type d -exec chmod 755 {} \;
    
    # 确保 API 目录存在
    if [ ! -d "api" ]; then
        print_warning "API 目录不存在，请检查部署"
        return 1
    fi
    
    # 检查并修复 .htaccess
    if [ ! -f ".htaccess" ] || ! grep -q "RewriteEngine On" .htaccess; then
        print_info "修复 .htaccess 配置..."
        cat > .htaccess << 'EOF'
# Serv00 环境管理系统 Apache 配置
RewriteEngine On

# 强制 MIME 类型
<FilesMatch "\.(js)$">
    ForceType application/javascript
</FilesMatch>

<FilesMatch "\.(css)$">
    ForceType text/css
</FilesMatch>

<FilesMatch "\.(svg)$">
    ForceType image/svg+xml
</FilesMatch>

# API 路由重写
RewriteCond %{REQUEST_URI} ^/api/
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ api/index.php [QSA,L]

# React Router 支持 - 前端路由
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api/
RewriteCond %{REQUEST_URI} !\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$
RewriteRule . /index.html [L]

# 安全设置
<Files ".env">
    Order allow,deny
    Deny from all
</Files>

# CORS 设置
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
EOF
        print_success "✓ .htaccess 已修复"
    fi
    
    print_success "常见问题修复完成"
}

# 主函数
main() {
    print_info "开始诊断 502 错误..."
    print_info "域名: $DOMAIN"
    echo
    
    local issues=0
    
    # 执行检查
    check_files || ((issues++))
    echo
    
    check_permissions
    echo
    
    check_php_syntax || ((issues++))
    echo
    
    check_htaccess
    echo
    
    test_php_execution || ((issues++))
    echo
    
    test_network_access
    echo
    
    check_error_logs
    echo
    
    # 如果发现问题，尝试修复
    if [ $issues -gt 0 ]; then
        print_warning "发现 $issues 个问题，尝试自动修复..."
        fix_common_issues
        echo
        
        print_info "修复完成，请重新测试访问:"
        echo "   前端: https://$DOMAIN"
        echo "   API: https://$DOMAIN/api/health"
    else
        print_success "未发现明显问题"
        print_info "如果仍有 502 错误，请检查:"
        echo "   1. Serv00 面板中的域名配置"
        echo "   2. 数据库连接是否正常"
        echo "   3. PHP 扩展是否完整"
    fi
    
    echo
    print_info "故障排除建议:"
    echo "   1. 查看实时错误日志: tail -f /tmp/serv00-php-errors.log"
    echo "   2. 测试 PHP 执行: php api/index.php"
    echo "   3. 检查数据库连接: mysql -h mysql14.serv00.com -u m9785_s14kook -p"
    echo "   4. 联系 Serv00 技术支持"
}

# 执行主函数
main "$@"
