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
    echo -n "请输入安装目录 [默认: ~/domains/$(whoami).serv00.net/public_html]: "
    read INSTALL_DIR
    if [ -z "$INSTALL_DIR" ]; then
        INSTALL_DIR="$HOME/domains/$(whoami).serv00.net/public_html"
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

    echo -n "数据库名称 [默认: em9785_environment_manager]: "
    read input_db_name
    if [ -z "$input_db_name" ]; then
        DB_NAME="em9785_environment_manager"
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
    
    cd "$INSTALL_DIR"
    
    # 检查是否已存在项目
    if [ -d "$PROJECT_NAME" ]; then
        print_warning "检测到已存在的项目，正在备份..."
        mv "$PROJECT_NAME" "${PROJECT_NAME}_backup_$(date +%Y%m%d_%H%M%S)"
    fi
    
    # 下载项目
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

        # 将 dist 目录内容移动到根目录
        print_step "部署前端文件到根目录..."
        cp -r dist/* .
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

                # 将构建结果移动到根目录
                print_step "部署前端文件到根目录..."
                cp -r dist/* .
                print_success "前端文件部署完成"

                # 显示部署结果
                print_info "部署文件列表:"
                ls -la index.html assets/ 2>/dev/null || ls -la index.html
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
                cp -r dist/* .
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

# 配置数据库
setup_database() {
    print_step "配置数据库..."

    # 测试数据库连接
    print_step "测试数据库连接..."
    if mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" -e "SELECT 1;" >/dev/null 2>&1; then
        print_success "数据库连接成功"
    else
        print_error "数据库连接失败，请检查以下配置："
        echo "   数据库主机: $DB_HOST"
        echo "   数据库用户: $DB_USER"
        echo "   数据库名称: $DB_NAME"
        print_warning "请确保："
        echo "   1. 数据库用户名和密码正确"
        echo "   2. 数据库名称已在 Serv00 面板中创建"
        echo "   3. 用户有访问该数据库的权限"
        exit 1
    fi

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
        exit 1
    fi

    # 检查数据库是否已初始化
    print_step "检查数据库表..."
    table_count=$(mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW TABLES;" 2>/dev/null | wc -l)

    if [ "$table_count" -gt 1 ]; then
        print_warning "数据库已包含表，跳过初始化"
        print_info "如需重新初始化，请手动清空数据库"
    else
        # 导入数据库结构
        if [ -f "database/init.sql" ]; then
            print_step "导入数据库结构..."
            if mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < database/init.sql 2>/dev/null; then
                print_success "数据库初始化完成"
            else
                print_error "数据库初始化失败"
                print_info "请检查 database/init.sql 文件是否正确"
                exit 1
            fi
        else
            print_error "未找到数据库初始化文件"
            exit 1
        fi
    fi
}

# 配置 PHP
configure_php() {
    print_step "配置 PHP 环境..."
    
    # 创建 .env 文件
    cat > api/.env << EOF
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

# 配置 Apache
configure_apache() {
    print_step "配置 Apache..."
    
    # 创建 .htaccess 文件
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

# API 路由
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ api/index.php [QSA,L]

# 前端路由 (React Router)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api/
RewriteRule . /index.html [L]

# 缓存设置
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/svg+xml "access plus 1 month"
</IfModule>

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
    
    print_success "Apache 配置完成"
}

# 设置权限
set_permissions() {
    print_step "设置文件权限..."
    
    # 设置目录权限
    find . -type d -exec chmod 755 {} \;
    
    # 设置文件权限
    find . -type f -exec chmod 644 {} \;
    
    # 设置可执行权限
    chmod +x serv00-deploy.sh 2>/dev/null || true
    
    print_success "权限设置完成"
}

# 验证安装
verify_installation() {
    print_step "验证安装..."
    
    # 检查关键文件
    local required_files=(
        "index.html"
        "api/index.php"
        "api/config/database.php"
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
    
    # 测试 API 健康检查
    if command_exists curl; then
        local api_url="http://$DOMAIN_NAME/api/health"
        if curl -s "$api_url" >/dev/null 2>&1; then
            print_success "API 健康检查通过"
        else
            print_warning "API 健康检查失败，请检查配置"
        fi
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
    echo "   安装目录: $INSTALL_DIR/$PROJECT_NAME"
    echo "   自定义端口: $CUSTOM_PORT"
    echo "   数据库主机: $DB_HOST"
    echo "   数据库名称: $DB_NAME"
    echo "   数据库用户: $DB_USER"
    echo "   域名: $DOMAIN_NAME"
    echo
    print_message $CYAN "🌐 访问地址:"
    echo "   前端: https://$DOMAIN_NAME"
    echo "   API健康检查: https://$DOMAIN_NAME/api/health"
    echo
    print_message $CYAN "👤 默认账户:"
    echo "   用户名: admin"
    echo "   密码: admin123"
    echo
    print_message $YELLOW "⚠️  重要提示:"
    echo "   1. 请及时修改默认管理员密码"
    echo "   2. 确保数据库连接安全"
    echo "   3. 定期备份数据"
    echo
    print_message $BLUE "📚 更多信息:"
    echo "   项目文档: https://github.com/kookhr/demoguanli/tree/serv00"
    echo "   技术支持: https://github.com/kookhr/demoguanli/issues"
    echo
}

# 主函数
main() {
    print_title "Serv00 环境管理系统一键部署"
    
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
}

# 错误处理
trap 'print_error "安装过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main "$@"
