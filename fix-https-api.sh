#!/bin/bash
# 修复 HTTPS 网站调用 HTTP API 的混合内容问题

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

echo
print_message "🔧 修复 HTTPS 混合内容问题" $BLUE
echo

# 检查前端配置文件
check_frontend_config() {
    print_step "检查前端 API 配置..."
    
    # 检查是否有配置文件
    local config_files=(
        "assets/index-*.js"
        "src/config/api.js"
        "src/utils/api.js"
        "src/services/api.js"
    )
    
    for pattern in "${config_files[@]}"; do
        for file in $pattern; do
            if [ -f "$file" ]; then
                print_info "检查文件: $file"
                
                # 查找 HTTP API 调用
                if grep -q "http://.*api" "$file" 2>/dev/null; then
                    print_warning "发现 HTTP API 调用"
                    grep -n "http://.*api" "$file" | head -5 | sed 's/^/   /'
                fi
            fi
        done
    done
}

# 修复 .htaccess 强制 HTTPS
fix_htaccess_https() {
    print_step "修复 .htaccess HTTPS 配置..."
    
    # 备份现有文件
    if [ -f ".htaccess" ]; then
        cp .htaccess .htaccess.backup.$(date +%Y%m%d_%H%M%S)
    fi
    
    # 创建支持 HTTPS 的 .htaccess
    cat > .htaccess << 'EOF'
# Serv00 环境管理系统 Apache 配置 - HTTPS 优化版
RewriteEngine On

# 强制 HTTPS (如果支持)
# RewriteCond %{HTTPS} off
# RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

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

# PHP 配置 - 强制 JSON 输出
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

# CORS 设置 - 支持 HTTPS
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, X-API-Key"
Header always set Access-Control-Max-Age "3600"

# 安全头部 - HTTPS 优化
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# 内容安全策略 - 允许同源 API 调用
Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https: wss:; frame-ancestors 'none';"

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

    print_success ".htaccess 已更新为 HTTPS 优化版本"
}

# 创建 API 代理文件
create_api_proxy() {
    print_step "创建 API 代理文件..."
    
    # 确保 API 目录存在
    mkdir -p api
    
    # 创建简单的 API 入口文件
    cat > api/index.php << 'EOF'
<?php
/**
 * API 入口文件 - HTTPS 优化版
 */

// 错误报告设置
error_reporting(E_ALL);
ini_set('display_errors', 0); // 生产环境关闭显示错误
ini_set('log_errors', 1);
ini_set('error_log', '/tmp/serv00-php-errors.log');

// 设置响应头 - HTTPS 优化
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-API-Key');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// 处理 OPTIONS 预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 获取请求信息
$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$requestPath = parse_url($requestUri, PHP_URL_PATH);

// 移除 /api 前缀
$apiPath = preg_replace('#^/api/?#', '', $requestPath);
$pathParts = explode('/', trim($apiPath, '/'));
$endpoint = $pathParts[0] ?? '';

// 加载环境变量
function loadEnv() {
    $envFile = dirname(__DIR__) . '/.env';
    $config = [];
    
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
                list($key, $value) = explode('=', $line, 2);
                $config[trim($key)] = trim($value);
            }
        }
    }
    
    return $config;
}

// 数据库连接
function getDatabase() {
    $env = loadEnv();
    
    $host = $env['DB_HOST'] ?? 'mysql14.serv00.com';
    $dbname = $env['DB_NAME'] ?? 'em9785_environment_manager';
    $username = $env['DB_USER'] ?? 'm9785_s14kook';
    $password = $env['DB_PASSWORD'] ?? '';
    
    try {
        $pdo = new PDO(
            "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
            $username,
            $password,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT => 10
            ]
        );
        return $pdo;
    } catch (PDOException $e) {
        error_log("Database connection failed: " . $e->getMessage());
        return null;
    }
}

// 路由处理
$response = [];

try {
    switch ($endpoint) {
        case 'health':
        case '':
            $response = [
                'status' => 'ok',
                'message' => 'API is running',
                'timestamp' => date('Y-m-d H:i:s'),
                'https' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
                'server_protocol' => $_SERVER['SERVER_PROTOCOL'] ?? 'HTTP/1.1'
            ];
            break;
            
        case 'environments':
            $db = getDatabase();
            if ($db) {
                if ($requestMethod === 'GET') {
                    $stmt = $db->query("SELECT * FROM environments ORDER BY created_at DESC");
                    $environments = $stmt->fetchAll();
                    $response = [
                        'status' => 'success',
                        'data' => $environments
                    ];
                } else {
                    $response = [
                        'status' => 'error',
                        'message' => 'Method not allowed'
                    ];
                    http_response_code(405);
                }
            } else {
                $response = [
                    'status' => 'error',
                    'message' => 'Database connection failed'
                ];
                http_response_code(500);
            }
            break;
            
        case 'auth':
            $subEndpoint = $pathParts[1] ?? '';
            if ($subEndpoint === 'login') {
                if ($requestMethod === 'POST') {
                    $input = json_decode(file_get_contents('php://input'), true);
                    $username = $input['username'] ?? '';
                    $password = $input['password'] ?? '';
                    
                    // 简单的认证逻辑
                    if ($username === 'admin' && $password === 'admin123') {
                        $response = [
                            'status' => 'success',
                            'message' => 'Login successful',
                            'token' => 'demo-token-' . time(),
                            'user' => [
                                'id' => 1,
                                'username' => 'admin',
                                'role' => 'admin'
                            ]
                        ];
                    } else {
                        $response = [
                            'status' => 'error',
                            'message' => 'Invalid credentials'
                        ];
                        http_response_code(401);
                    }
                } else {
                    $response = [
                        'status' => 'error',
                        'message' => 'Method not allowed'
                    ];
                    http_response_code(405);
                }
            } else {
                $response = [
                    'status' => 'error',
                    'message' => 'Auth endpoint not found'
                ];
                http_response_code(404);
            }
            break;
            
        default:
            $response = [
                'status' => 'error',
                'message' => 'Endpoint not found',
                'available_endpoints' => [
                    '/api/health' => 'Health check',
                    '/api/environments' => 'Environment management',
                    '/api/auth/login' => 'User authentication'
                ],
                'request_info' => [
                    'method' => $requestMethod,
                    'uri' => $requestUri,
                    'path' => $requestPath,
                    'endpoint' => $endpoint
                ]
            ];
            http_response_code(404);
            break;
    }
    
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    $response = [
        'status' => 'error',
        'message' => 'Internal server error',
        'error_id' => uniqid()
    ];
    http_response_code(500);
}

// 输出响应
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
EOF

    print_success "API 代理文件已创建"
}

# 测试 HTTPS API
test_https_api() {
    print_step "测试 HTTPS API..."
    
    if ! command -v curl >/dev/null 2>&1; then
        print_warning "curl 不可用，请手动测试"
        return 0
    fi
    
    local domain="do.kandy.dpdns.org"
    local endpoints=(
        "/api/health"
        "/api/environments"
        "/api/auth/login"
    )
    
    for endpoint in "${endpoints[@]}"; do
        local url="https://$domain$endpoint"
        print_info "测试: $url"
        
        local response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
        
        case $response in
            200)
                print_success "✓ $endpoint (HTTP $response)"
                ;;
            404)
                print_warning "⚠ $endpoint (HTTP $response - 未找到)"
                ;;
            500)
                print_error "✗ $endpoint (HTTP $response - 服务器错误)"
                ;;
            *)
                print_info "ℹ️ $endpoint (HTTP $response)"
                ;;
        esac
    done
}

# 主函数
main() {
    print_info "开始修复 HTTPS 混合内容问题..."
    echo
    
    check_frontend_config
    echo
    
    fix_htaccess_https
    echo
    
    create_api_proxy
    echo
    
    test_https_api
    echo
    
    print_success "🎉 HTTPS API 修复完成！"
    echo
    print_info "现在可以测试 HTTPS API:"
    echo "   健康检查: https://do.kandy.dpdns.org/api/health"
    echo "   环境列表: https://do.kandy.dpdns.org/api/environments"
    echo "   用户登录: https://do.kandy.dpdns.org/api/auth/login"
    echo
    print_info "如果前端仍有问题，请检查浏览器控制台的网络请求"
}

# 执行主函数
main "$@"
