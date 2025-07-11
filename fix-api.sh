#!/bin/bash
# API 问题诊断和修复脚本

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
API_BASE="https://$DOMAIN/api"

echo
print_message "🔧 API 问题诊断和修复工具" $BLUE
echo

# 1. 检查 API 文件结构
check_api_structure() {
    print_step "检查 API 文件结构..."
    
    local required_files=(
        "api/index.php"
        "api/config/database.php"
        "api/controllers/AuthController.php"
        "api/controllers/EnvironmentController.php"
        "api/controllers/UserController.php"
        "api/models/Environment.php"
        "api/models/User.php"
    )
    
    local missing_files=0
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            print_success "✓ $file"
        else
            print_error "✗ $file 缺失"
            ((missing_files++))
        fi
    done
    
    if [ $missing_files -gt 0 ]; then
        print_error "发现 $missing_files 个缺失的 API 文件"
        return 1
    fi
    
    return 0
}

# 2. 检查 .htaccess 重写规则
check_htaccess_rules() {
    print_step "检查 .htaccess API 重写规则..."
    
    if [ ! -f ".htaccess" ]; then
        print_error ".htaccess 文件不存在"
        return 1
    fi
    
    # 检查 API 重写规则
    if grep -q "RewriteRule.*api.*index.php" .htaccess; then
        print_success "✓ API 重写规则存在"
    else
        print_error "✗ API 重写规则缺失"
        return 1
    fi
    
    # 检查 RewriteEngine
    if grep -q "RewriteEngine On" .htaccess; then
        print_success "✓ RewriteEngine 已启用"
    else
        print_error "✗ RewriteEngine 未启用"
        return 1
    fi
    
    # 显示 API 相关规则
    print_info "API 重写规则:"
    grep -n "api\|API" .htaccess | sed 's/^/   /'
    
    return 0
}

# 3. 检查 PHP 语法
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
    
    # 添加控制器文件
    if [ -d "api/controllers" ]; then
        php_files+=($(find api/controllers -name "*.php"))
    fi
    
    # 添加模型文件
    if [ -d "api/models" ]; then
        php_files+=($(find api/models -name "*.php"))
    fi
    
    local syntax_errors=0
    
    for file in "${php_files[@]}"; do
        if [ -f "$file" ]; then
            if php -l "$file" >/dev/null 2>&1; then
                print_success "✓ $file 语法正确"
            else
                print_error "✗ $file 语法错误:"
                php -l "$file"
                ((syntax_errors++))
            fi
        fi
    done
    
    if [ $syntax_errors -gt 0 ]; then
        return 1
    fi
    
    return 0
}

# 4. 测试数据库连接
test_database_connection() {
    print_step "测试数据库连接..."
    
    # 创建数据库连接测试脚本
    cat > test_db.php << 'EOF'
<?php
// 测试数据库连接
error_reporting(E_ALL);
ini_set('display_errors', 1);

// 加载环境变量
if (file_exists('.env')) {
    $lines = file('.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

$host = $_ENV['DB_HOST'] ?? 'mysql14.serv00.com';
$dbname = $_ENV['DB_NAME'] ?? 'em9785_environment_manager';
$username = $_ENV['DB_USER'] ?? 'm9785_s14kook';
$password = $_ENV['DB_PASSWORD'] ?? '';

echo "数据库配置:\n";
echo "主机: $host\n";
echo "数据库: $dbname\n";
echo "用户: $username\n";
echo "密码: " . (empty($password) ? '未设置' : '已设置') . "\n\n";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    
    echo "✅ 数据库连接成功\n";
    
    // 测试查询
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "数据库表 (" . count($tables) . " 个):\n";
    foreach ($tables as $table) {
        echo "  - $table\n";
    }
    
} catch (PDOException $e) {
    echo "❌ 数据库连接失败: " . $e->getMessage() . "\n";
    exit(1);
}
?>
EOF
    
    if php test_db.php; then
        print_success "数据库连接测试通过"
        rm test_db.php
        return 0
    else
        print_error "数据库连接测试失败"
        rm test_db.php
        return 1
    fi
}

# 5. 测试 API 端点
test_api_endpoints() {
    print_step "测试 API 端点..."
    
    if ! command -v curl >/dev/null 2>&1; then
        print_warning "curl 不可用，跳过 API 端点测试"
        return 0
    fi
    
    local endpoints=(
        "/health"
        "/environments"
        "/auth/login"
    )
    
    for endpoint in "${endpoints[@]}"; do
        local url="$API_BASE$endpoint"
        print_info "测试: $url"
        
        local response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
        local content=$(curl -s "$url" 2>/dev/null || echo "连接失败")
        
        case $response in
            200)
                print_success "✓ $endpoint (HTTP $response)"
                echo "   响应: $content" | head -c 100
                echo
                ;;
            404)
                print_warning "⚠ $endpoint (HTTP $response - 未找到)"
                ;;
            500)
                print_error "✗ $endpoint (HTTP $response - 服务器错误)"
                echo "   响应: $content" | head -c 200
                echo
                ;;
            502)
                print_error "✗ $endpoint (HTTP $response - 网关错误)"
                ;;
            *)
                print_warning "⚠ $endpoint (HTTP $response)"
                echo "   响应: $content" | head -c 100
                echo
                ;;
        esac
    done
}

# 6. 检查 CORS 设置
check_cors_settings() {
    print_step "检查 CORS 设置..."
    
    if ! command -v curl >/dev/null 2>&1; then
        print_warning "curl 不可用，跳过 CORS 检查"
        return 0
    fi
    
    local url="$API_BASE/health"
    local headers=$(curl -s -I "$url" 2>/dev/null || echo "")
    
    if echo "$headers" | grep -qi "access-control-allow-origin"; then
        print_success "✓ CORS 头部存在"
        echo "$headers" | grep -i "access-control" | sed 's/^/   /'
    else
        print_warning "⚠ CORS 头部缺失"
    fi
    
    # 测试 OPTIONS 请求
    local options_response=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$url" 2>/dev/null || echo "000")
    if [ "$options_response" = "200" ]; then
        print_success "✓ OPTIONS 请求支持"
    else
        print_warning "⚠ OPTIONS 请求不支持 (HTTP $options_response)"
    fi
}

# 7. 查看 PHP 错误日志
check_php_error_logs() {
    print_step "查看 PHP 错误日志..."
    
    local log_files=(
        "/tmp/serv00-php-errors.log"
        "/tmp/php-errors.log"
        "error.log"
        "php_errors.log"
    )
    
    local found_logs=0
    
    for log_file in "${log_files[@]}"; do
        if [ -f "$log_file" ] && [ -s "$log_file" ]; then
            print_info "发现错误日志: $log_file"
            print_info "最近的错误 (最后 10 行):"
            tail -10 "$log_file" | sed 's/^/   /'
            echo
            ((found_logs++))
        fi
    done
    
    if [ $found_logs -eq 0 ]; then
        print_info "未发现 PHP 错误日志"
    fi
}

# 8. 修复常见 API 问题
fix_api_issues() {
    print_step "修复常见 API 问题..."
    
    # 修复 .htaccess API 规则
    if ! grep -q "RewriteRule.*api.*index.php" .htaccess; then
        print_info "修复 .htaccess API 重写规则..."
        
        # 备份现有文件
        cp .htaccess .htaccess.backup
        
        # 添加 API 规则
        sed -i '/RewriteEngine On/a\\n# API 路由重写\nRewriteCond %{REQUEST_URI} ^/api/\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteCond %{REQUEST_FILENAME} !-d\nRewriteRule ^api/(.*)$ api/index.php [QSA,L]' .htaccess
        
        print_success "✓ .htaccess API 规则已修复"
    fi
    
    # 确保 API 目录有正确的 .htaccess
    if [ ! -f "api/.htaccess" ]; then
        print_info "创建 API 目录 .htaccess..."
        cat > api/.htaccess << 'EOF'
# API 目录配置
RewriteEngine On
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
EOF
        print_success "✓ API .htaccess 已创建"
    fi
    
    # 检查 API 入口文件
    if [ ! -f "api/index.php" ] || [ ! -s "api/index.php" ]; then
        print_warning "API 入口文件缺失或为空，需要重新部署 API 文件"
    fi
    
    print_success "API 问题修复完成"
}

# 9. 创建简单的 API 测试文件
create_api_test() {
    print_step "创建 API 测试文件..."
    
    cat > api/test.php << 'EOF'
<?php
// 简单的 API 测试文件
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// 处理 OPTIONS 请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

echo json_encode([
    'status' => 'success',
    'message' => 'API 测试成功',
    'timestamp' => date('Y-m-d H:i:s'),
    'server_info' => [
        'php_version' => PHP_VERSION,
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'request_method' => $_SERVER['REQUEST_METHOD'],
        'request_uri' => $_SERVER['REQUEST_URI']
    ]
]);
?>
EOF
    
    print_success "✓ API 测试文件已创建: /api/test"
    
    # 测试新创建的测试文件
    if command -v curl >/dev/null 2>&1; then
        local test_url="$API_BASE/test"
        local test_response=$(curl -s "$test_url" 2>/dev/null || echo "连接失败")
        print_info "测试响应: $test_response"
    fi
}

# 主函数
main() {
    print_info "开始 API 诊断..."
    print_info "域名: $DOMAIN"
    print_info "API 基础 URL: $API_BASE"
    echo
    
    local issues=0
    
    # 执行所有检查
    check_api_structure || ((issues++))
    echo
    
    check_htaccess_rules || ((issues++))
    echo
    
    check_php_syntax || ((issues++))
    echo
    
    test_database_connection || ((issues++))
    echo
    
    test_api_endpoints
    echo
    
    check_cors_settings
    echo
    
    check_php_error_logs
    echo
    
    # 如果发现问题，尝试修复
    if [ $issues -gt 0 ]; then
        print_warning "发现 $issues 个问题，尝试自动修复..."
        fix_api_issues
        echo
        
        create_api_test
        echo
        
        print_info "修复完成，请重新测试 API:"
        echo "   健康检查: $API_BASE/health"
        echo "   测试端点: $API_BASE/test"
    else
        print_success "API 基础检查通过"
        create_api_test
    fi
    
    echo
    print_info "故障排除建议:"
    echo "   1. 查看实时错误日志: tail -f /tmp/serv00-php-errors.log"
    echo "   2. 测试简单 API: curl $API_BASE/test"
    echo "   3. 检查数据库连接: php test_db.php"
    echo "   4. 验证 .htaccess 规则是否生效"
    echo "   5. 确认 PHP 扩展是否完整"
}

# 执行主函数
main "$@"
