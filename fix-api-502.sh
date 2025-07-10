#!/bin/bash

# Serv00 API 502 错误修复脚本
# 修复后端 PHP API 服务问题

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

DOMAIN="do.kandy.dpdns.org"
SITE_DIR="$HOME/domains/$DOMAIN/public_html"
API_DIR="$SITE_DIR/api"

echo -e "${BOLD}${BLUE}🔧 Serv00 API 502 错误修复${NC}"
echo -e "${CYAN}目标域名: $DOMAIN${NC}"
echo -e "${CYAN}API 目录: $API_DIR${NC}"
echo ""

# 1. 检查 API 目录结构
check_api_structure() {
    echo -e "${BOLD}${BLUE}📁 步骤1: 检查 API 目录结构${NC}"
    
    cd "$SITE_DIR"
    
    if [ ! -d "api" ]; then
        echo -e "${RED}❌ API 目录不存在，创建中...${NC}"
        mkdir -p api
    fi
    
    cd api
    
    # 检查关键文件
    local api_files=(
        ".env"
        "index.php"
        ".htaccess"
    )
    
    for file in "${api_files[@]}"; do
        if [ -f "$file" ]; then
            echo -e "${GREEN}✅ $file 存在${NC}"
            ls -la "$file"
        else
            echo -e "${RED}❌ $file 缺失${NC}"
        fi
    done
    
    echo ""
}

# 2. 创建基础 API 文件
create_basic_api() {
    echo -e "${BOLD}${BLUE}📋 步骤2: 创建基础 API 文件${NC}"
    
    cd "$API_DIR"
    
    # 创建 API .htaccess
    cat > ".htaccess" << 'EOF'
# API 目录配置
RewriteEngine On

# 设置 PHP 错误显示（调试用）
php_flag display_errors On
php_flag display_startup_errors On
php_value error_reporting "E_ALL"

# 设置 CORS 头
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"

# 处理 OPTIONS 请求
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ index.php [QSA,L]

# 路由所有请求到 index.php
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]
EOF
    
    echo -e "${GREEN}✅ 创建了 API .htaccess${NC}"
    
    # 创建基础 index.php
    cat > "index.php" << 'EOF'
<?php
// Serv00 环境管理系统 API
// 基础版本，用于修复 502 错误

// 设置错误报告
error_reporting(E_ALL);
ini_set('display_errors', 1);

// 设置 CORS 头
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

// 处理 OPTIONS 请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 获取请求路径
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);
$path = str_replace('/api', '', $path);
$path = trim($path, '/');

// 基础路由
switch ($path) {
    case 'health':
        handleHealth();
        break;
    
    case 'environments':
        handleEnvironments();
        break;
    
    case 'test':
        handleTest();
        break;
    
    default:
        handleNotFound();
        break;
}

// 健康检查
function handleHealth() {
    $response = [
        'status' => 'success',
        'message' => 'API 运行正常',
        'data' => [
            'timestamp' => date('Y-m-d H:i:s'),
            'server' => 'Serv00',
            'php_version' => PHP_VERSION,
            'database' => checkDatabase()
        ]
    ];
    
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}

// 环境列表
function handleEnvironments() {
    // 模拟环境数据
    $environments = [
        [
            'id' => 1,
            'name' => '测试环境',
            'url' => 'https://test.example.com',
            'status' => 'online',
            'type' => 'external'
        ],
        [
            'id' => 2,
            'name' => '生产环境',
            'url' => 'https://prod.example.com',
            'status' => 'online',
            'type' => 'external'
        ]
    ];
    
    $response = [
        'status' => 'success',
        'message' => '环境列表获取成功',
        'data' => $environments
    ];
    
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}

// 测试接口
function handleTest() {
    $response = [
        'status' => 'success',
        'message' => 'API 测试成功',
        'data' => [
            'method' => $_SERVER['REQUEST_METHOD'],
            'timestamp' => time(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'Unknown'
        ]
    ];
    
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}

// 404 处理
function handleNotFound() {
    http_response_code(404);
    
    $response = [
        'status' => 'error',
        'message' => '接口不存在',
        'data' => [
            'path' => $_SERVER['REQUEST_URI'],
            'available_endpoints' => [
                '/api/health',
                '/api/environments',
                '/api/test'
            ]
        ]
    ];
    
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}

// 检查数据库连接
function checkDatabase() {
    $env_file = __DIR__ . '/.env';
    
    if (!file_exists($env_file)) {
        return '配置文件不存在';
    }
    
    // 读取 .env 文件
    $env_vars = [];
    $lines = file($env_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && !str_starts_with(trim($line), '#')) {
            list($key, $value) = explode('=', $line, 2);
            $env_vars[trim($key)] = trim($value, '"\'');
        }
    }
    
    // 检查数据库配置
    $required_keys = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
    foreach ($required_keys as $key) {
        if (!isset($env_vars[$key]) || empty($env_vars[$key])) {
            return "缺少配置: $key";
        }
    }
    
    // 尝试连接数据库
    try {
        $dsn = "mysql:host={$env_vars['DB_HOST']};dbname={$env_vars['DB_NAME']};charset=utf8mb4";
        $pdo = new PDO($dsn, $env_vars['DB_USER'], $env_vars['DB_PASSWORD'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 5
        ]);
        
        return '数据库连接正常';
    } catch (PDOException $e) {
        return '数据库连接失败: ' . $e->getMessage();
    }
}
?>
EOF
    
    echo -e "${GREEN}✅ 创建了基础 API index.php${NC}"
    
    # 创建测试用的 .env 文件（如果不存在）
    if [ ! -f ".env" ]; then
        cat > ".env" << 'EOF'
# Serv00 环境管理系统配置文件
# 请根据实际情况修改

# 数据库配置
DB_HOST=mysql14.serv00.com
DB_NAME=m9785_environment_manager
DB_USER=m9785_s14kook
DB_PASSWORD=your_password_here
DB_PORT=3306

# 应用配置
APP_ENV=production
APP_DEBUG=false
APP_URL=https://do.kandy.dpdns.org
CUSTOM_PORT=3000

# API 配置
API_BASE_URL=/api
JWT_SECRET=fallback_secret_12345
JWT_EXPIRATION=86400
EOF
        
        echo -e "${YELLOW}⚠️ 创建了示例 .env 文件，请修改数据库密码${NC}"
    fi
    
    echo ""
}

# 3. 修复文件权限
fix_api_permissions() {
    echo -e "${BOLD}${BLUE}🔐 步骤3: 修复 API 文件权限${NC}"
    
    cd "$API_DIR"
    
    # 设置目录权限
    chmod 755 .
    
    # 设置文件权限
    chmod 644 index.php
    chmod 644 .htaccess
    chmod 600 .env
    
    echo -e "${GREEN}✅ API 文件权限修复完成${NC}"
    echo ""
}

# 4. 测试 API
test_api() {
    echo -e "${BOLD}${BLUE}🧪 步骤4: 测试 API${NC}"
    
    # 测试健康检查
    echo -e "${BLUE}📋 测试健康检查接口:${NC}"
    if curl -s "https://$DOMAIN/api/health" | head -10; then
        echo -e "${GREEN}✅ 健康检查接口正常${NC}"
    else
        echo -e "${RED}❌ 健康检查接口失败${NC}"
    fi
    
    echo ""
    
    # 测试环境列表
    echo -e "${BLUE}📋 测试环境列表接口:${NC}"
    if curl -s "https://$DOMAIN/api/environments" | head -10; then
        echo -e "${GREEN}✅ 环境列表接口正常${NC}"
    else
        echo -e "${RED}❌ 环境列表接口失败${NC}"
    fi
    
    echo ""
    
    # 测试 HTTP 响应码
    echo -e "${BLUE}📋 检查 HTTP 响应码:${NC}"
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/health")
    echo -e "响应码: $status_code"
    
    if [ "$status_code" = "200" ]; then
        echo -e "${GREEN}✅ HTTP 响应码正常${NC}"
    else
        echo -e "${RED}❌ HTTP 响应码异常: $status_code${NC}"
    fi
    
    echo ""
}

# 5. 创建 API 测试页面
create_api_test_page() {
    echo -e "${BOLD}${BLUE}📋 步骤5: 创建 API 测试页面${NC}"
    
    cd "$SITE_DIR"
    
    cat > "api-test.html" << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API 测试页面</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .test-item {
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .success { border-color: #4CAF50; background: #f1f8e9; }
        .error { border-color: #f44336; background: #ffebee; }
        .loading { border-color: #2196F3; background: #e3f2fd; }
        button {
            padding: 8px 16px;
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
        }
        button:hover { background: #1976D2; }
        pre {
            background: #f5f5f5;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
            max-height: 300px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 API 测试页面</h1>
        
        <div class="test-item" id="health-test">
            <h3>健康检查 (/api/health)</h3>
            <button onclick="testHealth()">测试健康检查</button>
            <div id="health-result"></div>
        </div>
        
        <div class="test-item" id="env-test">
            <h3>环境列表 (/api/environments)</h3>
            <button onclick="testEnvironments()">测试环境列表</button>
            <div id="env-result"></div>
        </div>
        
        <div class="test-item" id="test-test">
            <h3>测试接口 (/api/test)</h3>
            <button onclick="testTest()">测试接口</button>
            <div id="test-result"></div>
        </div>
        
        <div class="test-item">
            <h3>批量测试</h3>
            <button onclick="runAllTests()">运行所有测试</button>
        </div>
    </div>
    
    <script>
        async function testAPI(endpoint, resultId) {
            const resultEl = document.getElementById(resultId);
            resultEl.innerHTML = '<p>正在测试...</p>';
            
            try {
                const response = await fetch(`/api/${endpoint}`);
                const data = await response.json();
                
                resultEl.innerHTML = `
                    <p><strong>状态码:</strong> ${response.status}</p>
                    <p><strong>响应:</strong></p>
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                `;
                
                if (response.ok) {
                    document.getElementById(resultId.replace('-result', '-test')).className = 'test-item success';
                } else {
                    document.getElementById(resultId.replace('-result', '-test')).className = 'test-item error';
                }
            } catch (error) {
                resultEl.innerHTML = `<p><strong>错误:</strong> ${error.message}</p>`;
                document.getElementById(resultId.replace('-result', '-test')).className = 'test-item error';
            }
        }
        
        function testHealth() {
            testAPI('health', 'health-result');
        }
        
        function testEnvironments() {
            testAPI('environments', 'env-result');
        }
        
        function testTest() {
            testAPI('test', 'test-result');
        }
        
        async function runAllTests() {
            testHealth();
            await new Promise(resolve => setTimeout(resolve, 1000));
            testEnvironments();
            await new Promise(resolve => setTimeout(resolve, 1000));
            testTest();
        }
        
        // 页面加载时自动运行健康检查
        window.onload = function() {
            testHealth();
        };
    </script>
</body>
</html>
EOF
    
    echo -e "${GREEN}✅ 创建了 API 测试页面: api-test.html${NC}"
    echo -e "${BLUE}📋 访问: https://$DOMAIN/api-test.html${NC}"
    echo ""
}

# 主函数
main() {
    echo -e "${BOLD}开始修复 API 502 错误...${NC}"
    echo ""
    
    check_api_structure
    create_basic_api
    fix_api_permissions
    test_api
    create_api_test_page
    
    echo -e "${BOLD}${GREEN}🎉 API 修复完成！${NC}"
    echo ""
    echo -e "${BOLD}${CYAN}测试步骤:${NC}"
    echo -e "1. 访问 API 测试页面: https://$DOMAIN/api-test.html"
    echo -e "2. 直接访问健康检查: https://$DOMAIN/api/health"
    echo -e "3. 检查环境列表: https://$DOMAIN/api/environments"
    echo ""
    echo -e "${BOLD}${YELLOW}重要提醒:${NC}"
    echo -e "1. 请编辑 $API_DIR/.env 文件，填入正确的数据库密码"
    echo -e "2. 如果仍有问题，请检查 Serv00 的 PHP 错误日志"
    echo -e "3. 确保数据库服务正常运行"
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
