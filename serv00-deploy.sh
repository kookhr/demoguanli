#!/bin/bash
# Serv00 环境管理系统一键部署脚本
# 支持交互式安装和自定义端口配置
# 使用方法: bash -i <(curl -SL https://your-domain.com/serv00-deploy.sh)

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_NAME="demoguanli"
GITHUB_REPO="https://github.com/kookhr/demoguanli.git"
GITHUB_BRANCH="serv00"
DEFAULT_PORT=62595
MIN_PORT=1024
MAX_PORT=65535

# 系统信息
SYSTEM_INFO=""
PHP_VERSION=""
MYSQL_VERSION=""
APACHE_VERSION=""

# 安装配置
INSTALL_DIR=""
CUSTOM_PORT=""
DB_HOST="mysql14.serv00.com"
DB_NAME="em9785_environment_manager"
DB_USER="m9785_s14kook"
DB_PASS=""
DOMAIN_NAME="do.kandy.dpdns.org"

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 打印标题
print_title() {
    echo
    print_message $CYAN "=================================================="
    print_message $CYAN "  $1"
    print_message $CYAN "=================================================="
    echo
}

# 打印步骤
print_step() {
    print_message $BLUE "🔄 $1"
}

# 打印成功消息
print_success() {
    print_message $GREEN "✅ $1"
}

# 打印警告消息
print_warning() {
    print_message $YELLOW "⚠️  $1"
}

# 打印错误消息
print_error() {
    print_message $RED "❌ $1"
}

# 打印信息消息
print_info() {
    print_message $PURPLE "ℹ️  $1"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检测系统信息
detect_system() {
    print_step "检测系统环境..."
    
    # 检测操作系统
    if [[ "$OSTYPE" == "freebsd"* ]]; then
        SYSTEM_INFO="FreeBSD (Serv00)"
        print_success "检测到 FreeBSD 系统 (Serv00)"
    else
        SYSTEM_INFO="$OSTYPE"
        print_warning "检测到非 FreeBSD 系统: $OSTYPE"
    fi
    
    # 检测 PHP
    if command_exists php; then
        PHP_VERSION=$(php -v | head -n1 | cut -d' ' -f2)
        print_success "PHP 版本: $PHP_VERSION"
    else
        print_error "未找到 PHP，请先安装 PHP"
        exit 1
    fi
    
    # 检测 MySQL/MariaDB
    if command_exists mysql; then
        MYSQL_VERSION=$(mysql --version | cut -d' ' -f6)
        print_success "MySQL 版本: $MYSQL_VERSION"
    else
        print_warning "未找到 MySQL 客户端"
    fi
    
    # 检测 Apache
    if command_exists httpd; then
        APACHE_VERSION=$(httpd -v | head -n1 | cut -d' ' -f3)
        print_success "Apache 版本: $APACHE_VERSION"
    else
        print_warning "未找到 Apache"
    fi
}

# 验证端口
validate_port() {
    local port=$1
    if [[ ! $port =~ ^[0-9]+$ ]] || [ $port -lt $MIN_PORT ] || [ $port -gt $MAX_PORT ]; then
        return 1
    fi
    return 0
}

# 检查端口是否可用
check_port_available() {
    local port=$1
    if command_exists netstat; then
        if netstat -an | grep ":$port " >/dev/null 2>&1; then
            return 1
        fi
    fi
    return 0
}

# 交互式配置
interactive_config() {
    print_title "交互式配置"
    
    # 安装目录
    echo -n "请输入安装目录 [默认: ~/domains/do.kandy.dpdns.org/public_html]: "
    read INSTALL_DIR
    if [ -z "$INSTALL_DIR" ]; then
        INSTALL_DIR="$HOME/domains/do.kandy.dpdns.org/public_html"
    fi
    
    # 创建安装目录
    mkdir -p "$INSTALL_DIR"
    print_success "安装目录: $INSTALL_DIR"
    
    # 自定义端口配置
    while true; do
        echo -n "请输入自定义端口 [默认: $DEFAULT_PORT]: "
        read CUSTOM_PORT
        if [ -z "$CUSTOM_PORT" ]; then
            CUSTOM_PORT=$DEFAULT_PORT
        fi

        if validate_port $CUSTOM_PORT; then
            if check_port_available $CUSTOM_PORT; then
                print_success "端口 $CUSTOM_PORT 可用"
                break
            else
                print_error "端口 $CUSTOM_PORT 已被占用，请选择其他端口"
            fi
        else
            print_error "无效端口号，请输入 $MIN_PORT-$MAX_PORT 之间的数字"
        fi
    done
    
    # 数据库配置
    echo -n "数据库主机 [默认: mysql14.serv00.com]: "
    read input_db_host
    if [ -z "$input_db_host" ]; then
        DB_HOST="mysql14.serv00.com"
    else
        DB_HOST="$input_db_host"
    fi

    echo -n "数据库名称 [默认: m9785_environment_manager]: "
    read input_db_name
    if [ -z "$input_db_name" ]; then
        DB_NAME="m9785_environment_manager"
    else
        DB_NAME="$input_db_name"
    fi

    echo -n "数据库用户名 [默认: m9785_s14kook]: "
    read input_db_user
    if [ -z "$input_db_user" ]; then
        DB_USER="m9785_s14kook"
    else
        DB_USER="$input_db_user"
    fi

    while [ -z "$DB_USER" ]; do
        print_error "数据库用户名不能为空"
        echo -n "数据库用户名: "
        read DB_USER
    done

    echo -n "数据库密码: "
    read -s DB_PASS
    echo
    while [ -z "$DB_PASS" ]; do
        print_error "数据库密码不能为空"
        echo -n "数据库密码: "
        read -s DB_PASS
        echo
    done
    
    # 域名配置
    echo -n "域名 [默认: do.kandy.dpdns.org]: "
    read input_domain
    if [ -z "$input_domain" ]; then
        DOMAIN_NAME="do.kandy.dpdns.org"
    else
        DOMAIN_NAME="$input_domain"
    fi
    
    print_success "配置完成"
}

# 创建 index.html 入口文件
create_index_html() {
    cat > index.html << 'EOF'
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/K.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>环境管理系统</title>
    <meta name="description" content="现代化的环境管理系统，支持多环境配置、状态监控和用户权限管理" />

    <style>
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        background-color: #f8fafc;
        color: #1e293b;
      }

      .loading-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        z-index: 9999;
      }

      .loading-spinner {
        width: 50px;
        height: 50px;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 1s ease-in-out infinite;
      }

      .loading-text {
        color: white;
        margin-top: 20px;
        font-size: 16px;
        font-weight: 500;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .app-loaded .loading-container {
        display: none;
      }
    </style>
  </head>
  <body>
    <div class="loading-container">
      <div style="text-align: center;">
        <div class="loading-spinner"></div>
        <div class="loading-text">环境管理系统加载中...</div>
      </div>
    </div>

    <div id="root"></div>

    <script type="module" src="/src/main.jsx"></script>

    <script>
      setTimeout(() => {
        document.body.classList.add('app-loaded');
      }, 5000);

      window.addEventListener('DOMContentLoaded', () => {
        const checkAppMount = () => {
          const root = document.getElementById('root');
          if (root && root.children.length > 0) {
            document.body.classList.add('app-loaded');
          } else {
            setTimeout(checkAppMount, 100);
          }
        };
        setTimeout(checkAppMount, 1000);
      });
    </script>
  </body>
</html>
EOF
    print_success "index.html 入口文件已创建"
}

# 检查和修复 Vite 配置
check_and_fix_vite_config() {
    print_step "检查 Vite 配置..."

    if [ ! -f "vite.config.js" ]; then
        print_warning "未找到 vite.config.js，正在创建优化配置..."
        cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true
  }
})
EOF
        print_success "vite.config.js 已创建"
    else
        print_success "vite.config.js 存在"
    fi
}

# 修复构建问题
fix_build_issues() {
    print_step "尝试修复构建问题..."

    # 清理缓存
    if [ -d "node_modules/.vite" ]; then
        print_step "清理 Vite 缓存..."
        rm -rf node_modules/.vite
    fi

    # 检查关键文件
    if [ ! -f "src/main.jsx" ]; then
        print_error "未找到 src/main.jsx 入口文件"
        return 1
    fi

    # 重新创建 index.html
    print_step "重新创建 index.html..."
    create_index_html

    # 检查 package.json 中的脚本
    if ! grep -q '"build"' package.json; then
        print_error "package.json 中缺少 build 脚本"
        return 1
    fi

    print_success "构建问题修复完成"
}

# 下载项目文件
download_project() {
    print_step "下载项目文件..."
    
    # 创建临时目录用于下载
    temp_dir="$INSTALL_DIR/temp_${PROJECT_NAME}_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$temp_dir"
    cd "$temp_dir"

    # 下载项目到临时目录
    if command_exists git; then
        git clone -b "$GITHUB_BRANCH" "$GITHUB_REPO" "$PROJECT_NAME"
    else
        # 使用 curl 下载 zip 文件
        curl -L "${GITHUB_REPO}/archive/${GITHUB_BRANCH}.zip" -o "${PROJECT_NAME}.zip"
        unzip "${PROJECT_NAME}.zip"
        mv "${PROJECT_NAME}-${GITHUB_BRANCH}" "$PROJECT_NAME"
        rm "${PROJECT_NAME}.zip"
    fi

    cd "$PROJECT_NAME"
    print_success "项目文件下载完成"
}

# 跳过前端构建（传统 Web 应用不需要）
skip_frontend_build() {
    print_step "跳过前端构建（传统 Web 应用模式）..."
    print_success "传统 Web 应用不需要前端构建步骤"
}

# 配置数据库和连接检查
setup_database() {
    print_step "配置数据库和连接检查..."

    # 测试数据库连接
    print_step "测试数据库连接..."
    local connection_attempts=0
    local max_attempts=3

    while [ $connection_attempts -lt $max_attempts ]; do
        if mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" -e "SELECT 1;" >/dev/null 2>&1; then
            print_success "数据库连接成功"
            break
        else
            ((connection_attempts++))
            if [ $connection_attempts -lt $max_attempts ]; then
                print_warning "数据库连接失败，重试中... ($connection_attempts/$max_attempts)"
                sleep 2
            else
                print_error "数据库连接失败，已尝试 $max_attempts 次"
                print_error "请检查以下配置："
                echo "   数据库主机: $DB_HOST"
                echo "   数据库用户: $DB_USER"
                echo "   数据库名称: $DB_NAME"
                print_warning "请确保："
                echo "   1. 数据库用户名和密码正确"
                echo "   2. 数据库名称已在 Serv00 面板中创建"
                echo "   3. 用户有访问该数据库的权限"
                echo "   4. 网络连接正常"

                # 提供诊断命令
                print_info "诊断命令："
                echo "   测试连接: mysql -h$DB_HOST -u$DB_USER -p"
                echo "   查看数据库: SHOW DATABASES;"
                exit 1
            fi
        fi
    done

    # 检查数据库是否存在
    print_step "检查数据库是否存在..."
    if mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" -e "USE $DB_NAME;" >/dev/null 2>&1; then
        print_success "数据库 $DB_NAME 存在"
    else
        print_error "数据库 $DB_NAME 不存在"
        print_warning "请在 Serv00 面板中创建数据库: $DB_NAME"
        print_info "创建步骤："
        echo "   1. 登录 Serv00 面板"
        echo "   2. 进入 'MySQL' 部分"
        echo "   3. 创建数据库: $DB_NAME"
        echo "   4. 确保用户 $DB_USER 有访问权限"

        # 尝试列出可用数据库
        print_info "当前可用数据库："
        mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" -e "SHOW DATABASES;" 2>/dev/null | grep -v "information_schema\|performance_schema\|mysql" || echo "   无法获取数据库列表"
        exit 1
    fi

    # 检查数据库是否已初始化
    print_step "检查数据库表..."
    table_count=$(mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW TABLES;" 2>/dev/null | wc -l)

    if [ "$table_count" -gt 1 ]; then
        print_warning "数据库已包含表，跳过初始化"
        print_info "现有表："
        mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW TABLES;" 2>/dev/null | tail -n +2 | sed 's/^/   /'
        print_info "如需重新初始化，请手动清空数据库"
    else
        # 导入数据库结构
        if [ -f "database/init.sql" ]; then
            print_step "导入数据库结构..."
            if mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < database/init.sql 2>/dev/null; then
                print_success "数据库初始化完成"

                # 验证表创建
                new_table_count=$(mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW TABLES;" 2>/dev/null | wc -l)
                if [ "$new_table_count" -gt 1 ]; then
                    print_success "数据库表创建成功 ($((new_table_count-1)) 个表)"
                    mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW TABLES;" 2>/dev/null | tail -n +2 | sed 's/^/   /'
                else
                    print_warning "数据库初始化可能不完整"
                fi
            else
                print_error "数据库初始化失败"
                print_info "请检查 database/init.sql 文件是否正确"

                # 显示 SQL 文件信息
                if [ -f "database/init.sql" ]; then
                    print_info "SQL 文件信息："
                    echo "   文件大小: $(wc -c < database/init.sql) 字节"
                    echo "   行数: $(wc -l < database/init.sql) 行"
                    echo "   前几行内容:"
                    head -5 database/init.sql | sed 's/^/   /'
                fi
                exit 1
            fi
        else
            print_error "未找到数据库初始化文件"
            print_info "查找数据库文件..."
            find . -name "*.sql" -type f | head -5 | sed 's/^/   /'
            exit 1
        fi
    fi

    # 测试数据库连接的 PHP 函数
    print_step "创建数据库连接测试..."
    cat > test-db-connection.php << EOF
<?php
// 数据库连接测试
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json; charset=utf-8');

try {
    \$pdo = new PDO(
        "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",
        "$DB_USER",
        "$DB_PASS",
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 10
        ]
    );

    \$stmt = \$pdo->query("SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = '$DB_NAME'");
    \$result = \$stmt->fetch();

    echo json_encode([
        'status' => 'success',
        'message' => '数据库连接成功',
        'database' => '$DB_NAME',
        'table_count' => \$result['table_count'],
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);

} catch (PDOException \$e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => \$e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
}
?>
EOF

    print_success "数据库连接测试文件已创建"
}

# 配置传统 PHP Web 应用
configure_php() {
    print_step "配置传统 PHP Web 应用..."

    # 确保在正确的目录
    cd "$INSTALL_DIR"

    # 移除 API 目录（不再需要）
    if [ -d "api" ]; then
        rm -rf api
        print_success "已移除 API 目录"
    fi

    # 创建 PHP 配置文件
    cat > config.php << 'EOF'
<?php
// 数据库配置
define('DB_HOST', 'PLACEHOLDER_DB_HOST');
define('DB_NAME', 'PLACEHOLDER_DB_NAME');
define('DB_USER', 'PLACEHOLDER_DB_USER');
define('DB_PASS', 'PLACEHOLDER_DB_PASS');
define('APP_DOMAIN', 'PLACEHOLDER_DOMAIN_NAME');

// 应用配置
define('APP_NAME', '环境管理系统');
define('APP_VERSION', '1.0.0');

// 安全配置
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.use_strict_mode', 1);

// 错误报告
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', '/tmp/serv00-php-errors.log');

// 数据库连接函数
function getDatabase() {
    static $pdo = null;

    if ($pdo === null) {
        try {
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
        } catch (PDOException $e) {
            error_log("数据库连接失败: " . $e->getMessage());
            die("数据库连接失败，请联系管理员");
        }
    }

    return $pdo;
}

// 启动会话
session_start();

// 检查用户是否已登录
function isLoggedIn() {
    return isset($_SESSION['user_id']) && isset($_SESSION['username']);
}

// 检查是否为管理员
function isAdmin() {
    return isLoggedIn() && ($_SESSION['role'] ?? '') === 'admin';
}

// 重定向函数
function redirect($url) {
    header("Location: $url");
    exit();
}

// 安全的输出函数
function h($string) {
    return htmlspecialchars($string, ENT_QUOTES, 'UTF-8');
}

// 生成 CSRF Token
function generateCSRFToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

// 验证 CSRF Token
function validateCSRFToken($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}
?>
EOF

    # 替换占位符为实际值
    sed -i "s/PLACEHOLDER_DB_HOST/$DB_HOST/g" config.php
    sed -i "s/PLACEHOLDER_DB_NAME/$DB_NAME/g" config.php
    sed -i "s/PLACEHOLDER_DB_USER/$DB_USER/g" config.php
    sed -i "s/PLACEHOLDER_DB_PASS/$DB_PASS/g" config.php
    sed -i "s/PLACEHOLDER_DOMAIN_NAME/$DOMAIN_NAME/g" config.php

    print_success "PHP 配置文件已创建"
}

# 配置传统 Web 应用的 Apache
configure_apache() {
    print_step "配置传统 Web 应用的 Apache..."

    # 确保在正确的目录
    cd "$INSTALL_DIR"

    # 复制数据库文件
    if [ -d "$temp_dir/$PROJECT_NAME/database" ]; then
        cp -r "$temp_dir/$PROJECT_NAME/database" .
        print_success "数据库文件复制完成"
    fi

    # 创建传统 Web 应用的 .htaccess 文件
    cat > .htaccess << 'EOF'
# Serv00 环境管理系统 Apache 配置 - 传统 Web 应用版
RewriteEngine On

# 安全设置 - 隐藏敏感文件
<Files "config.php">
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

<Files "*.sql">
    Order allow,deny
    Deny from all
</Files>

# 强制 MIME 类型
<FilesMatch "\.(css)$">
    ForceType text/css
    Header set Content-Type "text/css; charset=utf-8"
</FilesMatch>

<FilesMatch "\.(js)$">
    ForceType application/javascript
    Header set Content-Type "application/javascript; charset=utf-8"
</FilesMatch>

<FilesMatch "\.(svg)$">
    ForceType image/svg+xml
    Header set Content-Type "image/svg+xml; charset=utf-8"
</FilesMatch>

# PHP 配置
<FilesMatch "\.(php)$">
    Header set Content-Type "text/html; charset=utf-8"
</FilesMatch>

# 默认首页重定向
RewriteCond %{REQUEST_URI} ^/$
RewriteRule ^(.*)$ /index.php [L]

# 安全头部
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options SAMEORIGIN
Header always set X-XSS-Protection "1; mode=block"

# 缓存控制
<IfModule mod_expires.c>
    ExpiresActive On

    # 静态资源缓存
    ExpiresByType text/css "access plus 1 week"
    ExpiresByType application/javascript "access plus 1 week"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
    ExpiresByType image/svg+xml "access plus 1 month"

    # PHP 页面不缓存
    ExpiresByType text/html "access plus 0 seconds"
</IfModule>

# 压缩设置
<IfModule mod_deflate.c>
    SetOutputFilter DEFLATE
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/javascript
</IfModule>

# 目录浏览禁用
Options -Indexes

# 符号链接跟随
Options +FollowSymLinks

# 字符集设置
AddDefaultCharset UTF-8

# 默认文档
DirectoryIndex index.php index.html
EOF

    print_success "传统 Web 应用 Apache 配置完成"
}

# 创建传统 PHP Web 应用文件
create_php_web_app() {
    print_step "创建传统 PHP Web 应用文件..."

    # 确保在正确的目录
    cd "$INSTALL_DIR"

    # 创建主页面 index.php
    cat > index.php << 'EOF'
<?php
require_once 'config.php';

// 检查是否已登录
if (!isLoggedIn()) {
    redirect('login.php');
}

$pdo = getDatabase();

// 获取环境列表
$stmt = $pdo->query("SELECT * FROM environments ORDER BY created_at DESC");
$environments = $stmt->fetchAll();

// 获取用户信息
$username = $_SESSION['username'] ?? 'Unknown';
$role = $_SESSION['role'] ?? 'user';
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= APP_NAME ?></title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <style>
        .glass-effect {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
    </style>
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
    <!-- 导航栏 -->
    <nav class="bg-white shadow-lg">
        <div class="max-w-7xl mx-auto px-4">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <h1 class="text-xl font-bold text-gray-800"><?= APP_NAME ?></h1>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="text-gray-600">欢迎, <?= h($username) ?></span>
                    <?php if (isAdmin()): ?>
                        <a href="add-environment.php" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">添加环境</a>
                        <a href="users.php" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">用户管理</a>
                    <?php endif; ?>
                    <a href="logout.php" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">退出</a>
                </div>
            </div>
        </div>
    </nav>

    <!-- 主内容 -->
    <div class="max-w-7xl mx-auto py-6 px-4">
        <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">环境列表</h2>
        </div>

        <!-- 环境卡片网格 -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <?php foreach ($environments as $env): ?>
                <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-lg font-semibold text-gray-800"><?= h($env['name']) ?></h3>
                        <span class="px-2 py-1 text-xs rounded-full bg-<?= $env['environment_type'] === 'production' ? 'green' : 'blue' ?>-100 text-<?= $env['environment_type'] === 'production' ? 'green' : 'blue' ?>-800">
                            <?= h($env['environment_type']) ?>
                        </span>
                    </div>

                    <div class="space-y-2 mb-4">
                        <p class="text-sm text-gray-600">
                            <strong>URL:</strong>
                            <a href="<?= h($env['url']) ?>" target="_blank" class="text-blue-600 hover:underline"><?= h($env['url']) ?></a>
                        </p>
                        <?php if ($env['description']): ?>
                            <p class="text-sm text-gray-600">
                                <strong>描述:</strong> <?= h($env['description']) ?>
                            </p>
                        <?php endif; ?>
                        <p class="text-sm text-gray-600">
                            <strong>网络:</strong> <?= h($env['network_type']) ?>
                        </p>
                    </div>

                    <?php if (isAdmin()): ?>
                        <div class="flex space-x-2">
                            <a href="edit-environment.php?id=<?= $env['id'] ?>" class="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600">编辑</a>
                            <a href="delete-environment.php?id=<?= $env['id'] ?>" class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600" onclick="return confirm('确定要删除这个环境吗？')">删除</a>
                        </div>
                    <?php endif; ?>
                </div>
            <?php endforeach; ?>

            <?php if (empty($environments)): ?>
                <div class="col-span-full text-center py-12">
                    <p class="text-gray-500 text-lg">暂无环境数据</p>
                    <?php if (isAdmin()): ?>
                        <a href="add-environment.php" class="mt-4 inline-block bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">添加第一个环境</a>
                    <?php endif; ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
</body>
</html>
EOF

    # 创建登录页面 login.php
    cat > login.php << 'EOF'
<?php
require_once 'config.php';

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';

    if ($username && $password) {
        $pdo = getDatabase();
        $stmt = $pdo->prepare("SELECT id, username, password_hash, role FROM users WHERE username = ? AND is_active = 1");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['role'] = $user['role'];

            // 更新最后登录时间
            $stmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
            $stmt->execute([$user['id']]);

            redirect('index.php');
        } else {
            $error = '用户名或密码错误';
        }
    } else {
        $error = '请输入用户名和密码';
    }
}
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>登录 - <?= APP_NAME ?></title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center">
    <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div class="text-center mb-8">
            <h1 class="text-2xl font-bold text-gray-800"><?= APP_NAME ?></h1>
            <p class="text-gray-600 mt-2">请登录您的账户</p>
        </div>

        <?php if ($error): ?>
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <?= h($error) ?>
            </div>
        <?php endif; ?>

        <form method="POST" action="login.php">
            <div class="mb-4">
                <label for="username" class="block text-gray-700 text-sm font-bold mb-2">用户名</label>
                <input type="text" id="username" name="username" required
                       class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                       value="<?= h($_POST['username'] ?? '') ?>">
            </div>

            <div class="mb-6">
                <label for="password" class="block text-gray-700 text-sm font-bold mb-2">密码</label>
                <input type="password" id="password" name="password" required
                       class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500">
            </div>

            <button type="submit" class="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 focus:outline-none focus:bg-blue-600">
                登录
            </button>
        </form>

        <div class="mt-6 text-center text-sm text-gray-600">
            <p>默认管理员账户：admin / admin123</p>
        </div>
    </div>
</body>
</html>
EOF

    # 创建退出页面 logout.php
    cat > logout.php << 'EOF'
<?php
require_once 'config.php';

// 销毁会话
session_destroy();

// 重定向到登录页面
redirect('login.php');
?>
EOF

    # 创建添加环境页面 add-environment.php
    cat > add-environment.php << 'EOF'
<?php
require_once 'config.php';

// 检查管理员权限
if (!isAdmin()) {
    redirect('index.php');
}

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $url = trim($_POST['url'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $environment_type = $_POST['environment_type'] ?? 'development';
    $network_type = $_POST['network_type'] ?? 'external';

    if ($name && $url) {
        try {
            $pdo = getDatabase();
            $id = uniqid('env_');

            $stmt = $pdo->prepare("INSERT INTO environments (id, name, url, description, environment_type, network_type, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
            $stmt->execute([$id, $name, $url, $description, $environment_type, $network_type, $_SESSION['user_id']]);

            $success = '环境添加成功！';

            // 清空表单
            $_POST = [];
        } catch (PDOException $e) {
            $error = '添加失败：' . $e->getMessage();
        }
    } else {
        $error = '请填写环境名称和URL';
    }
}
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>添加环境 - <?= APP_NAME ?></title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
    <!-- 导航栏 -->
    <nav class="bg-white shadow-lg">
        <div class="max-w-7xl mx-auto px-4">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <a href="index.php" class="text-xl font-bold text-gray-800"><?= APP_NAME ?></a>
                </div>
                <div class="flex items-center space-x-4">
                    <a href="index.php" class="text-gray-600 hover:text-gray-800">返回首页</a>
                    <a href="logout.php" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">退出</a>
                </div>
            </div>
        </div>
    </nav>

    <!-- 主内容 -->
    <div class="max-w-2xl mx-auto py-6 px-4">
        <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">添加新环境</h2>

            <?php if ($error): ?>
                <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <?= h($error) ?>
                </div>
            <?php endif; ?>

            <?php if ($success): ?>
                <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    <?= h($success) ?>
                </div>
            <?php endif; ?>

            <form method="POST" action="add-environment.php">
                <div class="mb-4">
                    <label for="name" class="block text-gray-700 text-sm font-bold mb-2">环境名称 *</label>
                    <input type="text" id="name" name="name" required
                           class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                           value="<?= h($_POST['name'] ?? '') ?>">
                </div>

                <div class="mb-4">
                    <label for="url" class="block text-gray-700 text-sm font-bold mb-2">URL地址 *</label>
                    <input type="url" id="url" name="url" required
                           class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                           value="<?= h($_POST['url'] ?? '') ?>" placeholder="https://example.com">
                </div>

                <div class="mb-4">
                    <label for="description" class="block text-gray-700 text-sm font-bold mb-2">描述</label>
                    <textarea id="description" name="description" rows="3"
                              class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"><?= h($_POST['description'] ?? '') ?></textarea>
                </div>

                <div class="mb-4">
                    <label for="environment_type" class="block text-gray-700 text-sm font-bold mb-2">环境类型</label>
                    <select id="environment_type" name="environment_type"
                            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500">
                        <option value="development" <?= ($_POST['environment_type'] ?? '') === 'development' ? 'selected' : '' ?>>开发环境</option>
                        <option value="testing" <?= ($_POST['environment_type'] ?? '') === 'testing' ? 'selected' : '' ?>>测试环境</option>
                        <option value="staging" <?= ($_POST['environment_type'] ?? '') === 'staging' ? 'selected' : '' ?>>预发布环境</option>
                        <option value="production" <?= ($_POST['environment_type'] ?? '') === 'production' ? 'selected' : '' ?>>生产环境</option>
                    </select>
                </div>

                <div class="mb-6">
                    <label for="network_type" class="block text-gray-700 text-sm font-bold mb-2">网络类型</label>
                    <select id="network_type" name="network_type"
                            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500">
                        <option value="external" <?= ($_POST['network_type'] ?? '') === 'external' ? 'selected' : '' ?>>外网</option>
                        <option value="internal" <?= ($_POST['network_type'] ?? '') === 'internal' ? 'selected' : '' ?>>内网</option>
                    </select>
                </div>

                <div class="flex space-x-4">
                    <button type="submit" class="bg-blue-500 text-white py-2 px-6 rounded hover:bg-blue-600 focus:outline-none focus:bg-blue-600">
                        添加环境
                    </button>
                    <a href="index.php" class="bg-gray-500 text-white py-2 px-6 rounded hover:bg-gray-600">
                        取消
                    </a>
                </div>
            </form>
        </div>
    </div>
</body>
</html>
EOF

    # 创建编辑环境页面 edit-environment.php
    cat > edit-environment.php << 'EOF'
<?php
require_once 'config.php';

// 检查管理员权限
if (!isAdmin()) {
    redirect('index.php');
}

$id = $_GET['id'] ?? '';
if (!$id) {
    redirect('index.php');
}

$pdo = getDatabase();
$error = '';
$success = '';

// 获取环境信息
$stmt = $pdo->prepare("SELECT * FROM environments WHERE id = ?");
$stmt->execute([$id]);
$environment = $stmt->fetch();

if (!$environment) {
    redirect('index.php');
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $url = trim($_POST['url'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $environment_type = $_POST['environment_type'] ?? 'development';
    $network_type = $_POST['network_type'] ?? 'external';

    if ($name && $url) {
        try {
            $stmt = $pdo->prepare("UPDATE environments SET name = ?, url = ?, description = ?, environment_type = ?, network_type = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$name, $url, $description, $environment_type, $network_type, $id]);

            $success = '环境更新成功！';

            // 重新获取更新后的数据
            $stmt = $pdo->prepare("SELECT * FROM environments WHERE id = ?");
            $stmt->execute([$id]);
            $environment = $stmt->fetch();
        } catch (PDOException $e) {
            $error = '更新失败：' . $e->getMessage();
        }
    } else {
        $error = '请填写环境名称和URL';
    }
}
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>编辑环境 - <?= APP_NAME ?></title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
    <!-- 导航栏 -->
    <nav class="bg-white shadow-lg">
        <div class="max-w-7xl mx-auto px-4">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <a href="index.php" class="text-xl font-bold text-gray-800"><?= APP_NAME ?></a>
                </div>
                <div class="flex items-center space-x-4">
                    <a href="index.php" class="text-gray-600 hover:text-gray-800">返回首页</a>
                    <a href="logout.php" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">退出</a>
                </div>
            </div>
        </div>
    </nav>

    <!-- 主内容 -->
    <div class="max-w-2xl mx-auto py-6 px-4">
        <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">编辑环境</h2>

            <?php if ($error): ?>
                <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <?= h($error) ?>
                </div>
            <?php endif; ?>

            <?php if ($success): ?>
                <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    <?= h($success) ?>
                </div>
            <?php endif; ?>

            <form method="POST" action="edit-environment.php?id=<?= h($id) ?>">
                <div class="mb-4">
                    <label for="name" class="block text-gray-700 text-sm font-bold mb-2">环境名称 *</label>
                    <input type="text" id="name" name="name" required
                           class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                           value="<?= h($_POST['name'] ?? $environment['name']) ?>">
                </div>

                <div class="mb-4">
                    <label for="url" class="block text-gray-700 text-sm font-bold mb-2">URL地址 *</label>
                    <input type="url" id="url" name="url" required
                           class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                           value="<?= h($_POST['url'] ?? $environment['url']) ?>">
                </div>

                <div class="mb-4">
                    <label for="description" class="block text-gray-700 text-sm font-bold mb-2">描述</label>
                    <textarea id="description" name="description" rows="3"
                              class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"><?= h($_POST['description'] ?? $environment['description']) ?></textarea>
                </div>

                <div class="mb-4">
                    <label for="environment_type" class="block text-gray-700 text-sm font-bold mb-2">环境类型</label>
                    <select id="environment_type" name="environment_type"
                            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500">
                        <?php
                        $current_type = $_POST['environment_type'] ?? $environment['environment_type'];
                        $types = ['development' => '开发环境', 'testing' => '测试环境', 'staging' => '预发布环境', 'production' => '生产环境'];
                        foreach ($types as $value => $label):
                        ?>
                            <option value="<?= $value ?>" <?= $current_type === $value ? 'selected' : '' ?>><?= $label ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="mb-6">
                    <label for="network_type" class="block text-gray-700 text-sm font-bold mb-2">网络类型</label>
                    <select id="network_type" name="network_type"
                            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500">
                        <?php
                        $current_network = $_POST['network_type'] ?? $environment['network_type'];
                        ?>
                        <option value="external" <?= $current_network === 'external' ? 'selected' : '' ?>>外网</option>
                        <option value="internal" <?= $current_network === 'internal' ? 'selected' : '' ?>>内网</option>
                    </select>
                </div>

                <div class="flex space-x-4">
                    <button type="submit" class="bg-blue-500 text-white py-2 px-6 rounded hover:bg-blue-600 focus:outline-none focus:bg-blue-600">
                        更新环境
                    </button>
                    <a href="index.php" class="bg-gray-500 text-white py-2 px-6 rounded hover:bg-gray-600">
                        取消
                    </a>
                </div>
            </form>
        </div>
    </div>
</body>
</html>
EOF

    # 创建删除环境页面 delete-environment.php
    cat > delete-environment.php << 'EOF'
<?php
require_once 'config.php';

// 检查管理员权限
if (!isAdmin()) {
    redirect('index.php');
}

$id = $_GET['id'] ?? '';
if (!$id) {
    redirect('index.php');
}

$pdo = getDatabase();

// 获取环境信息
$stmt = $pdo->prepare("SELECT * FROM environments WHERE id = ?");
$stmt->execute([$id]);
$environment = $stmt->fetch();

if (!$environment) {
    redirect('index.php');
}

// 执行删除
try {
    $stmt = $pdo->prepare("DELETE FROM environments WHERE id = ?");
    $stmt->execute([$id]);

    // 重定向到首页并显示成功消息
    $_SESSION['message'] = '环境 "' . $environment['name'] . '" 已成功删除';
    redirect('index.php');
} catch (PDOException $e) {
    // 重定向到首页并显示错误消息
    $_SESSION['error'] = '删除失败：' . $e->getMessage();
    redirect('index.php');
}
?>
EOF

    # 创建简单的 PHP 测试文件
    cat > test.php << 'EOF'
<?php
// 简单的 PHP 测试文件
phpinfo();
?>
EOF

    # 创建基础测试文件
    cat > test-basic.php << 'EOF'
<?php
// 基础 PHP 测试
echo "PHP 工作正常！<br>";
echo "PHP 版本: " . PHP_VERSION . "<br>";
echo "当前时间: " . date('Y-m-d H:i:s') . "<br>";

// 测试数据库连接
try {
    if (file_exists('config.php')) {
        require_once 'config.php';
        $pdo = getDatabase();
        echo "数据库连接成功！<br>";

        // 测试查询
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM environments");
        $result = $stmt->fetch();
        echo "环境数量: " . $result['count'] . "<br>";
    } else {
        echo "配置文件不存在<br>";
    }
} catch (Exception $e) {
    echo "数据库连接失败: " . $e->getMessage() . "<br>";
}
?>
EOF

    print_success "编辑和删除环境 PHP 页面已创建"
    print_success "测试 PHP 文件已创建"
}

# 设置权限
set_permissions() {
    print_step "设置文件权限..."

    # 确保在正确的目录
    cd "$INSTALL_DIR"

    # 设置目录权限
    find . -type d -exec chmod 755 {} \;

    # 设置文件权限
    find . -type f -exec chmod 644 {} \;

    # 设置脚本可执行权限
    find . -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true

    print_success "权限设置完成"
}

# 验证传统 Web 应用安装
verify_installation() {
    print_step "验证传统 Web 应用安装..."

    # 检查关键文件
    local required_files=(
        "index.php"
        "login.php"
        "config.php"
        "add-environment.php"
        "edit-environment.php"
        "delete-environment.php"
        ".htaccess"
    )

    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            print_success "✓ $file"
        else
            print_error "✗ $file 缺失"
            return 1
        fi
    done

    # 测试 Web 应用功能
    if command_exists curl; then
        print_step "测试 Web 应用功能..."

        # 测试基础 PHP 功能
        local basic_test_url="https://$DOMAIN_NAME/test-basic.php"
        print_step "测试基础 PHP 功能: $basic_test_url"
        local basic_response=$(curl -s -o /dev/null -w "%{http_code}" "$basic_test_url" 2>/dev/null || echo "000")

        case $basic_response in
            200)
                print_success "✓ 基础 PHP 功能正常 (HTTP $basic_response)"
                ;;
            *)
                print_error "✗ 基础 PHP 功能异常 (HTTP $basic_response)"
                print_warning "这表明 PHP 执行有问题，请检查："
                echo "   1. PHP 是否正确安装"
                echo "   2. 文件权限是否正确"
                echo "   3. Apache 配置是否正确"
                ;;
        esac

        # 测试登录页面
        local login_url="https://$DOMAIN_NAME/login.php"
        print_step "测试登录页面: $login_url"
        local login_response=$(curl -s -o /dev/null -w "%{http_code}" "$login_url" 2>/dev/null || echo "000")

        case $login_response in
            200)
                print_success "✓ 登录页面访问正常 (HTTP $login_response)"
                ;;
            *)
                print_warning "⚠ 登录页面访问异常 (HTTP $login_response)"
                ;;
        esac

        # 测试主页重定向
        local main_url="https://$DOMAIN_NAME/"
        print_step "测试主页重定向: $main_url"
        local main_response=$(curl -s -o /dev/null -w "%{http_code}" "$main_url" 2>/dev/null || echo "000")

        case $main_response in
            200|302)
                print_success "✓ 主页访问正常 (HTTP $main_response)"
                ;;
            *)
                print_warning "⚠ 主页访问异常 (HTTP $main_response)"
                ;;
        esac

        # 测试数据库连接
        local db_test_url="https://$DOMAIN_NAME/test-db-connection.php"
        print_step "测试数据库连接: $db_test_url"
        local db_response=$(curl -s -o /dev/null -w "%{http_code}" "$db_test_url" 2>/dev/null || echo "000")

        case $db_response in
            200)
                print_success "✓ 数据库连接测试通过 (HTTP $db_response)"
                ;;
            *)
                print_warning "⚠ 数据库连接测试异常 (HTTP $db_response)"
                ;;
        esac

    else
        print_warning "curl 不可用，跳过 Web 应用测试"
    fi

    print_success "传统 Web 应用安装验证完成"
}

# 显示安装结果
show_results() {
    print_title "传统 Web 应用安装完成"

    echo
    print_message $GREEN "🎉 环境管理系统（传统 Web 应用版）安装成功！"
    echo
    print_message $CYAN "📋 安装信息:"
    echo "   安装目录: $INSTALL_DIR"
    echo "   应用架构: 传统 PHP Web 应用（表单提交 + Session 认证）"
    echo "   数据库主机: $DB_HOST"
    echo "   数据库名称: $DB_NAME"
    echo "   数据库用户: $DB_USER"
    echo "   域名: $DOMAIN_NAME"
    echo
    print_message $CYAN "🌐 访问地址:"
    echo "   主页: https://$DOMAIN_NAME/"
    echo "   登录页面: https://$DOMAIN_NAME/login.php"
    echo "   环境管理: https://$DOMAIN_NAME/index.php"
    echo
    print_message $CYAN "🔧 管理功能:"
    echo "   添加环境: https://$DOMAIN_NAME/add-environment.php"
    echo "   编辑环境: 在主页点击环境卡片的编辑按钮"
    echo "   删除环境: 在主页点击环境卡片的删除按钮"
    echo
    print_message $CYAN "🔍 测试和诊断:"
    echo "   基础 PHP 测试: https://$DOMAIN_NAME/test-basic.php"
    echo "   PHP 信息页面: https://$DOMAIN_NAME/test.php"
    echo "   数据库连接测试: https://$DOMAIN_NAME/test-db-connection.php"
    echo
    print_message $CYAN "👤 默认管理员账户:"
    echo "   用户名: admin"
    echo "   密码: admin123"
    echo
    print_message $YELLOW "⚠️  重要提示:"
    echo "   1. 请立即登录并修改默认管理员密码"
    echo "   2. 此版本使用传统 Web 表单，完全避开 Serv00 的 API 限制"
    echo "   3. 所有操作通过 POST 表单提交，使用 PHP Session 认证"
    echo "   4. 定期备份数据库数据"
    echo
    print_message $BLUE "🔍 故障排除:"
    echo "   查看PHP错误日志: tail -f /tmp/serv00-php-errors.log"
    echo "   测试数据库连接: mysql -h$DB_HOST -u$DB_USER -p$DB_PASS $DB_NAME"
    echo "   检查文件权限: ls -la $INSTALL_DIR"
    echo "   检查配置文件: cat $INSTALL_DIR/config.php"
    echo
    print_message $BLUE "📚 技术特点:"
    echo "   ✅ 传统 PHP Web 应用架构"
    echo "   ✅ HTML 表单 + POST 提交"
    echo "   ✅ PHP Session 用户认证"
    echo "   ✅ 直接数据库操作"
    echo "   ✅ 完全兼容 Serv00 平台限制"
    echo
    print_message $BLUE "📚 更多信息:"
    echo "   项目文档: https://github.com/kookhr/demoguanli/tree/serv00"
    echo "   技术支持: https://github.com/kookhr/demoguanli/issues"
    echo
}

# 主函数
main() {
    print_title "Serv00 环境管理系统一键部署 - 传统 Web 应用版"

    # 定义临时目录变量
    local temp_dir=""

    # 检测系统
    detect_system

    # 交互式配置
    interactive_config

    # 下载项目
    download_project

    # 跳过前端构建
    skip_frontend_build

    # 配置数据库
    setup_database

    # 配置传统 PHP Web 应用
    configure_php

    # 创建 PHP Web 应用文件
    create_php_web_app

    # 配置 Apache
    configure_apache

    # 设置权限
    set_permissions

    # 验证安装
    verify_installation

    # 显示结果
    show_results

    # 清理临时目录
    if [ -d "$temp_dir" ]; then
        print_step "清理临时文件..."
        rm -rf "$temp_dir"
        print_success "临时文件清理完成"
    fi
}

# 错误处理
trap 'print_error "安装过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main "$@"
