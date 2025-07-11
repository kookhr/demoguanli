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

# 构建前端
build_frontend() {
    print_step "构建前端项目..."

    # 检查是否有预构建的 dist 目录
    if [ -d "dist" ]; then
        print_success "发现预构建的前端文件"

        # 将 dist 目录内容移动到安装目录
        print_step "部署前端文件到安装目录..."
        cp -r dist/* "$INSTALL_DIR/"
        print_success "前端文件部署完成"
        return
    fi

    # 检查项目结构
    if [ ! -f "package.json" ]; then
        print_error "未找到 package.json，项目结构不完整"
        exit 1
    fi

    if [ ! -d "src" ]; then
        print_error "未找到 src 目录，项目结构不完整"
        exit 1
    fi

    # 检查并创建 index.html 入口文件
    if [ ! -f "index.html" ]; then
        print_warning "未找到 index.html 入口文件，正在创建..."
        create_index_html
    fi

    # 检查并修复 Vite 配置
    check_and_fix_vite_config

    # 如果有 Node.js，尝试构建
    if command_exists npm; then
        print_step "检查 Node.js 版本..."
        local node_version=$(node --version | sed 's/v//')
        print_info "当前 Node.js 版本: $node_version"

        # 清理旧的构建文件
        if [ -d "dist" ]; then
            print_step "清理旧的构建文件..."
            rm -rf dist
        fi

        print_step "安装依赖包..."
        npm install --no-audit --no-fund

        print_step "构建前端项目..."
        if npm run build; then
            print_success "前端构建成功"

            # 验证构建结果
            if [ -f "dist/index.html" ]; then
                print_success "构建产物验证通过"

                # 将构建结果移动到安装目录
                print_step "部署前端文件到安装目录..."
                cp -r dist/* "$INSTALL_DIR/"
                print_success "前端文件部署完成"

                # 显示部署结果
                print_info "部署文件列表:"
                ls -la "$INSTALL_DIR/index.html" "$INSTALL_DIR/assets/" 2>/dev/null || ls -la "$INSTALL_DIR/index.html"
            else
                print_error "构建失败：未生成 index.html"
                exit 1
            fi
        else
            print_error "前端构建失败，正在尝试修复..."

            # 尝试修复构建问题
            fix_build_issues

            # 重新尝试构建
            print_step "重新尝试构建..."
            if npm run build; then
                print_success "修复后构建成功"
                cp -r dist/* "$INSTALL_DIR/"
                print_success "前端文件部署完成"
            else
                print_error "构建修复失败，请检查项目配置"
                exit 1
            fi
        fi
    elif command_exists node; then
        print_step "检测到 Node.js 但未找到 npm..."
        node --version
        print_error "请安装 npm 或确保项目包含预构建的 dist 目录"
        exit 1
    else
        print_error "未找到 Node.js，请确保项目包含预构建的 dist 目录"
        exit 1
    fi
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

# 配置 PHP
configure_php() {
    print_step "配置 PHP 环境..."

    # 确保在正确的目录
    cd "$INSTALL_DIR"

    # 复制 API 文件
    if [ -d "$temp_dir/$PROJECT_NAME/api" ]; then
        cp -r "$temp_dir/$PROJECT_NAME/api" .
        print_success "API 文件复制完成"
    fi

    # 创建 .env 文件
    cat > .env << EOF
DB_HOST=$DB_HOST
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS
APP_PORT=$CUSTOM_PORT
APP_DOMAIN=$DOMAIN_NAME
EOF
    
    # 更新数据库配置文件
    if [ -f "api/config/database.php" ]; then
        # 备份原文件
        cp api/config/database.php api/config/database.php.backup
        
        # 更新配置
        sed -i.bak "s/localhost/$DB_HOST/g" api/config/database.php
        sed -i.bak "s/environment_manager/$DB_NAME/g" api/config/database.php
        sed -i.bak "s/root/$DB_USER/g" api/config/database.php
    fi
    
    print_success "PHP 配置完成"
}

# 配置 Apache 和 HTTPS API 修复
configure_apache() {
    print_step "配置 Apache 和 HTTPS API 修复..."

    # 确保在正确的目录
    cd "$INSTALL_DIR"

    # 复制数据库文件
    if [ -d "$temp_dir/$PROJECT_NAME/database" ]; then
        cp -r "$temp_dir/$PROJECT_NAME/database" .
        print_success "数据库文件复制完成"
    fi

    # 创建优化的 .htaccess 文件 - HTTPS 和 API 修复版
    cat > .htaccess << 'EOF'
# Serv00 环境管理系统 Apache 配置 - HTTPS API 修复版
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
RewriteCond %{REQUEST_URI} !\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json|php)$
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

    # 创建 API 目录的 .htaccess
    if [ -d "api" ]; then
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

    print_success "Apache 和 HTTPS API 配置完成"
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

# 创建 API 测试文件
create_api_test_file() {
    print_step "创建 API 测试文件..."

    # 创建简单的 API 测试文件
    cat > test-api.php << 'EOF'
<?php
/**
 * 简单的 API 测试文件
 * 用于诊断 502 错误和 HTTPS 问题
 */

// 开启错误显示用于调试
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', '/tmp/serv00-php-errors.log');

// 设置响应头
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// 处理 OPTIONS 请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 基本信息收集
$info = [
    'status' => 'ok',
    'message' => 'API 测试成功',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => PHP_VERSION,
    'server_info' => [
        'software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'protocol' => $_SERVER['SERVER_PROTOCOL'] ?? 'Unknown',
        'method' => $_SERVER['REQUEST_METHOD'] ?? 'Unknown',
        'uri' => $_SERVER['REQUEST_URI'] ?? 'Unknown',
        'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'Unknown',
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown',
        'https' => isset($_SERVER['HTTPS']) ? $_SERVER['HTTPS'] : 'Not set',
        'host' => $_SERVER['HTTP_HOST'] ?? 'Unknown'
    ],
    'environment' => [
        'current_user' => get_current_user(),
        'working_directory' => getcwd(),
        'script_filename' => __FILE__,
        'include_path' => get_include_path()
    ],
    'php_extensions' => [
        'pdo' => extension_loaded('pdo'),
        'pdo_mysql' => extension_loaded('pdo_mysql'),
        'json' => extension_loaded('json'),
        'curl' => extension_loaded('curl'),
        'mbstring' => extension_loaded('mbstring')
    ],
    'file_permissions' => [
        'current_file_readable' => is_readable(__FILE__),
        'current_file_writable' => is_writable(__FILE__),
        'directory_writable' => is_writable(dirname(__FILE__)),
        'parent_directory_writable' => is_writable(dirname(dirname(__FILE__)))
    ]
];

// 尝试数据库连接测试
try {
    // 检查 .env 文件
    $envFile = dirname(__FILE__) . '/.env';
    if (file_exists($envFile)) {
        $info['env_file'] = [
            'exists' => true,
            'readable' => is_readable($envFile),
            'size' => filesize($envFile)
        ];

        // 读取数据库配置
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $dbConfig = [];
        foreach ($lines as $line) {
            if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
                list($key, $value) = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);
                if (strpos($key, 'DB_') === 0) {
                    $dbConfig[$key] = $value;
                }
            }
        }
        $info['db_config'] = $dbConfig;
    } else {
        $info['env_file'] = [
            'exists' => false,
            'path' => $envFile
        ];
    }

    // 尝试数据库连接
    $host = $dbConfig['DB_HOST'] ?? 'mysql14.serv00.com';
    $dbname = $dbConfig['DB_NAME'] ?? 'em9785_environment_manager';
    $username = $dbConfig['DB_USER'] ?? 'm9785_s14kook';
    $password = $dbConfig['DB_PASSWORD'] ?? '';

    if (!empty($host) && !empty($dbname) && !empty($username)) {
        $pdo = new PDO(
            "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
            $username,
            $password,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT => 5
            ]
        );

        $stmt = $pdo->query("SELECT 1 as test, NOW() as current_time");
        $result = $stmt->fetch();

        $info['database'] = [
            'status' => 'connected',
            'test_query' => $result
        ];
    } else {
        $info['database'] = [
            'status' => 'config_missing',
            'message' => '数据库配置不完整'
        ];
    }

} catch (Exception $e) {
    $info['database'] = [
        'status' => 'error',
        'message' => $e->getMessage()
    ];
}

// 输出 JSON 响应
echo json_encode($info, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
EOF

    print_success "API 测试文件已创建"
}

# 验证安装和 API 测试
verify_installation() {
    print_step "验证安装和 API 功能..."

    # 检查关键文件
    local required_files=(
        "index.html"
        "api/index.php"
        "api/config/database.php"
        ".htaccess"
        "api/.htaccess"
    )

    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            print_success "✓ $file"
        else
            print_error "✗ $file 缺失"
            return 1
        fi
    done

    # 创建 API 测试文件
    create_api_test_file

    # 测试 API 功能
    if command_exists curl; then
        print_step "测试 API 功能..."

        # 测试基础 PHP 功能
        local test_url="https://$DOMAIN_NAME/test-api.php"
        print_step "测试基础 PHP: $test_url"
        local test_response=$(curl -s -o /dev/null -w "%{http_code}" "$test_url" 2>/dev/null || echo "000")

        case $test_response in
            200)
                print_success "✓ 基础 PHP 测试通过 (HTTP $test_response)"
                ;;
            *)
                print_warning "⚠ 基础 PHP 测试异常 (HTTP $test_response)"
                ;;
        esac

        # 测试 API 健康检查
        local api_url="https://$DOMAIN_NAME/api/health"
        print_step "测试 API 健康检查: $api_url"
        local response=$(curl -s -o /dev/null -w "%{http_code}" "$api_url" 2>/dev/null || echo "000")

        case $response in
            200)
                print_success "✓ API 健康检查通过 (HTTP $response)"
                ;;
            502)
                print_error "✗ API 访问失败 (HTTP 502 - 网关错误)"
                print_warning "正在尝试诊断问题..."

                # 尝试获取详细错误信息
                local error_content=$(curl -s "$test_url" 2>/dev/null | head -c 500)
                if [ -n "$error_content" ]; then
                    print_info "错误详情: $error_content"
                fi

                print_warning "可能的原因："
                echo "   1. API 路由配置问题"
                echo "   2. PHP 执行错误"
                echo "   3. 数据库连接失败"
                echo "   4. 文件权限问题"
                ;;
            *)
                print_warning "⚠ API 访问异常 (HTTP $response)"
                ;;
        esac

        # 测试环境列表 API
        local env_url="https://$DOMAIN_NAME/api/environments"
        print_step "测试环境列表 API: $env_url"
        local env_response=$(curl -s -o /dev/null -w "%{http_code}" "$env_url" 2>/dev/null || echo "000")

        case $env_response in
            200)
                print_success "✓ 环境列表 API 通过 (HTTP $env_response)"
                ;;
            *)
                print_warning "⚠ 环境列表 API 异常 (HTTP $env_response)"
                ;;
        esac

    else
        print_warning "curl 不可用，跳过 API 测试"
    fi

    print_success "安装验证完成"
}

# 显示安装结果
show_results() {
    print_title "安装完成"

    echo
    print_message $GREEN "🎉 环境管理系统安装成功！"
    echo
    print_message $CYAN "📋 安装信息:"
    echo "   安装目录: $INSTALL_DIR"
    echo "   自定义端口: $CUSTOM_PORT"
    echo "   数据库主机: $DB_HOST"
    echo "   数据库名称: $DB_NAME"
    echo "   数据库用户: $DB_USER"
    echo "   域名: $DOMAIN_NAME"
    echo
    print_message $CYAN "🌐 访问地址:"
    echo "   前端应用: https://$DOMAIN_NAME"
    echo "   API健康检查: https://$DOMAIN_NAME/api/health"
    echo "   环境列表API: https://$DOMAIN_NAME/api/environments"
    echo
    print_message $CYAN "🔧 测试和诊断地址:"
    echo "   基础PHP测试: https://$DOMAIN_NAME/test-api.php"
    echo "   数据库连接测试: https://$DOMAIN_NAME/test-db-connection.php"
    echo
    print_message $CYAN "👤 默认账户:"
    echo "   用户名: admin"
    echo "   密码: admin123"
    echo
    print_message $YELLOW "⚠️  重要提示:"
    echo "   1. 请及时修改默认管理员密码"
    echo "   2. 确保数据库连接安全"
    echo "   3. 定期备份数据"
    echo "   4. 如遇API问题，请查看测试地址进行诊断"
    echo
    print_message $BLUE "🔍 故障排除:"
    echo "   查看PHP错误日志: tail -f /tmp/serv00-php-errors.log"
    echo "   测试数据库连接: mysql -h$DB_HOST -u$DB_USER -p$DB_PASS $DB_NAME"
    echo "   检查文件权限: ls -la $INSTALL_DIR"
    echo
    print_message $BLUE "📚 更多信息:"
    echo "   项目文档: https://github.com/kookhr/demoguanli/tree/serv00"
    echo "   技术支持: https://github.com/kookhr/demoguanli/issues"
    echo
}

# 主函数
main() {
    print_title "Serv00 环境管理系统一键部署"

    # 定义临时目录变量
    local temp_dir=""

    # 检测系统
    detect_system
    
    # 交互式配置
    interactive_config
    
    # 下载项目
    download_project
    
    # 构建前端
    build_frontend
    
    # 配置数据库
    setup_database
    
    # 配置 PHP
    configure_php
    
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
