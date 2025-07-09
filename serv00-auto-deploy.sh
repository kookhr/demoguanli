#!/bin/bash

# Serv00 环境管理系统自动部署脚本
# 在 Serv00 主机上直接执行，无需预配置
# 使用方法: curl -sSL https://raw.githubusercontent.com/kookhr/demoguanli/serv00/serv00-auto-deploy.sh | bash

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 项目配置
REPO_URL="https://github.com/kookhr/demoguanli.git"
BRANCH="serv00"
PROJECT_NAME="environment-manager"
DB_NAME="environment_manager"

# 如果通过环境变量传递仓库信息
if [ -n "$REPO_URL_OVERRIDE" ]; then
    REPO_URL="$REPO_URL_OVERRIDE"
fi

if [ -n "$BRANCH_OVERRIDE" ]; then
    BRANCH="$BRANCH_OVERRIDE"
fi

# 显示欢迎信息
show_welcome() {
    clear
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}🌐 环境管理系统 - Serv00 自动部署脚本${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✨ 特性：${NC}"
    echo -e "   🌐 环境管理和状态监控"
    echo -e "   💎 Apple Liquid Glass 设计"
    echo -e "   🌙 暗黑模式支持"
    echo -e "   👥 用户权限管理"
    echo -e "   📊 状态历史统计"
    echo -e "   💰 完全免费部署"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# 检测环境信息
detect_environment() {
    echo -e "${BLUE}🔍 检测 Serv00 环境信息...${NC}"
    
    # 获取用户名
    SERV00_USER=$(whoami)
    echo -e "   👤 用户名: ${GREEN}${SERV00_USER}${NC}"
    
    # 获取主域名
    if [ -d "/usr/home/${SERV00_USER}/domains" ]; then
        DOMAINS_DIR="/usr/home/${SERV00_USER}/domains"
        DOMAIN_LIST=$(ls -1 "$DOMAINS_DIR" 2>/dev/null | head -5)
        
        if [ -n "$DOMAIN_LIST" ]; then
            echo -e "   🌐 可用域名:"
            echo "$DOMAIN_LIST" | while read domain; do
                echo -e "      • ${GREEN}$domain${NC}"
            done
            
            # 选择第一个域名作为默认
            SERV00_DOMAIN=$(echo "$DOMAIN_LIST" | head -1)
            echo -e "   ✅ 选择域名: ${GREEN}${SERV00_DOMAIN}${NC}"
        else
            echo -e "   ${YELLOW}⚠️  未找到域名，请手动配置${NC}"
            SERV00_DOMAIN="${SERV00_USER}.serv00.net"
        fi
    else
        SERV00_DOMAIN="${SERV00_USER}.serv00.net"
        echo -e "   🌐 默认域名: ${GREEN}${SERV00_DOMAIN}${NC}"
    fi
    
    # 设置路径
    PUBLIC_HTML_DIR="/usr/home/${SERV00_USER}/domains/${SERV00_DOMAIN}/public_html"
    WORK_DIR="/usr/home/${SERV00_USER}/tmp/${PROJECT_NAME}"
    
    echo -e "   📁 部署路径: ${GREEN}${PUBLIC_HTML_DIR}${NC}"
    echo -e "   🔧 工作目录: ${GREEN}${WORK_DIR}${NC}"
    echo ""
}

# 检查依赖
check_dependencies() {
    echo -e "${BLUE}📋 检查系统依赖...${NC}"
    
    local missing_deps=()
    
    # 检查 git
    if ! command -v git &> /dev/null; then
        missing_deps+=("git")
    else
        echo -e "   ✅ Git: $(git --version | cut -d' ' -f3)"
    fi
    
    # 检查 node
    if ! command -v node &> /dev/null; then
        missing_deps+=("node")
    else
        NODE_VERSION=$(node --version)
        echo -e "   ✅ Node.js: $NODE_VERSION"

        # 检查 Node.js 版本是否 >= 16
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$NODE_MAJOR" -lt 16 ]; then
            echo -e "   ${YELLOW}⚠️  警告: Node.js 版本较低 ($NODE_VERSION)，建议使用 16+ 版本${NC}"
        fi
    fi
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    else
        echo -e "   ✅ npm: $(npm --version)"
    fi
    
    # 检查 php
    if ! command -v php &> /dev/null; then
        missing_deps+=("php")
    else
        echo -e "   ✅ PHP: $(php --version | head -1 | cut -d' ' -f2)"
    fi
    
    # 检查 mysql
    if ! command -v mysql &> /dev/null; then
        echo -e "   ${YELLOW}⚠️  MySQL 客户端未找到，将跳过数据库自动配置${NC}"
    else
        echo -e "   ✅ MySQL: $(mysql --version | cut -d' ' -f6 | cut -d',' -f1)"
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        echo -e "${RED}❌ 缺少依赖: ${missing_deps[*]}${NC}"
        echo -e "${YELLOW}请联系 Serv00 支持安装缺少的依赖${NC}"
        exit 1
    fi
    
    echo ""
}

# 获取数据库配置
get_database_config() {
    echo -e "${BLUE}🗄️ 配置数据库信息...${NC}"
    
    # 尝试自动检测数据库配置
    if [ -f "/usr/home/${SERV00_USER}/.my.cnf" ]; then
        echo -e "   📄 发现 MySQL 配置文件"
        DB_USER=$(grep "^user" /usr/home/${SERV00_USER}/.my.cnf | cut -d'=' -f2 | tr -d ' ' 2>/dev/null || echo "")
        DB_PASSWORD=$(grep "^password" /usr/home/${SERV00_USER}/.my.cnf | cut -d'=' -f2 | tr -d ' ' 2>/dev/null || echo "")
    fi
    
    # 如果没有自动检测到，使用默认值
    if [ -z "$DB_USER" ]; then
        DB_USER="${SERV00_USER}"
    fi
    
    echo -e "   👤 数据库用户: ${GREEN}${DB_USER}${NC}"
    echo -e "   🗄️ 数据库名称: ${GREEN}${DB_NAME}${NC}"
    
    if [ -z "$DB_PASSWORD" ]; then
        echo -e "   ${YELLOW}⚠️  数据库密码需要手动配置${NC}"
        echo -e "   ${CYAN}💡 提示: 部署完成后请在 Serv00 面板中创建数据库${NC}"
    else
        echo -e "   🔑 数据库密码: ${GREEN}已配置${NC}"
    fi
    
    echo ""
}

# 克隆项目
clone_project() {
    echo -e "${BLUE}📥 克隆项目代码...${NC}"
    
    # 清理旧的工作目录
    if [ -d "$WORK_DIR" ]; then
        echo -e "   🧹 清理旧的工作目录..."
        rm -rf "$WORK_DIR"
    fi
    
    # 创建工作目录
    mkdir -p "$(dirname "$WORK_DIR")"
    
    # 克隆项目
    echo -e "   📦 克隆项目: ${REPO_URL}"
    if git clone -b "$BRANCH" "$REPO_URL" "$WORK_DIR"; then
        echo -e "   ✅ 项目克隆成功"
    else
        echo -e "${RED}❌ 项目克隆失败${NC}"
        exit 1
    fi
    
    cd "$WORK_DIR"
    echo -e "   📁 切换到工作目录: ${GREEN}$(pwd)${NC}"
    echo ""
}

# 安装依赖和构建
build_project() {
    echo -e "${BLUE}🔨 构建项目...${NC}"
    
    cd "$WORK_DIR"
    
    # 清理 npm 缓存
    echo -e "   🧹 清理 npm 缓存..."
    npm cache clean --force 2>/dev/null || true

    # 修复 Node.js 18 兼容性问题
    echo -e "   🔧 修复 Node.js 兼容性..."
    if [ "$NODE_MAJOR" -lt 20 ]; then
        echo -e "   📝 降级 Vite 版本以兼容 Node.js $NODE_VERSION"
        # 修复 package.json 中的版本
        sed -i 's/"vite": "\^6\.[0-9]*\.[0-9]*"/"vite": "^5.4.10"/' package.json 2>/dev/null || true
        sed -i 's/"@vitejs\/plugin-react": "\^4\.[4-9]\.[0-9]*"/"@vitejs\/plugin-react": "^4.3.3"/' package.json 2>/dev/null || true
    fi

    # 安装 npm 依赖（包括开发依赖，因为需要 vite 构建）
    echo -e "   📦 安装 npm 依赖..."
    if npm install; then
        echo -e "   ✅ 依赖安装成功"

        # 验证关键依赖
        echo -e "   🔍 验证关键依赖..."
        if npm list vite >/dev/null 2>&1; then
            echo -e "   ✅ Vite 已安装"
        else
            echo -e "   ${YELLOW}⚠️  Vite 未找到，尝试手动安装...${NC}"
            npm install vite --save-dev
        fi
    else
        echo -e "${RED}❌ 依赖安装失败${NC}"
        echo -e "${YELLOW}💡 尝试使用 --legacy-peer-deps 选项...${NC}"
        if npm install --legacy-peer-deps; then
            echo -e "   ✅ 依赖安装成功（使用 legacy-peer-deps）"
        else
            echo -e "${RED}❌ 依赖安装彻底失败${NC}"
            exit 1
        fi
    fi
    
    # 构建项目
    echo -e "   🏗️ 构建生产版本..."
    if npm run build; then
        echo -e "   ✅ 项目构建成功"
    else
        echo -e "${YELLOW}⚠️  npm run build 失败，尝试直接使用 vite...${NC}"
        if npx vite build; then
            echo -e "   ✅ 项目构建成功（使用 npx vite）"
        else
            echo -e "${YELLOW}⚠️  npx vite build 失败，尝试全局安装 vite...${NC}"
            npm install -g vite
            if vite build; then
                echo -e "   ✅ 项目构建成功（使用全局 vite）"
            else
                echo -e "${YELLOW}⚠️  尝试最后的备用方案...${NC}"
                # 创建一个简单的静态页面作为备用
                mkdir -p dist
                cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>环境管理系统</title>
    <style>
        body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #3b82f6; }
        .message { padding: 15px; background: #ffedd5; border-left: 4px solid #f97316; margin: 20px 0; }
        .btn { display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>环境管理系统 - 构建中</h1>
        <div class="message">
            <p>系统正在构建中，请稍后访问。如果您是管理员，请检查构建日志。</p>
        </div>
        <p>请确保：</p>
        <ul>
            <li>Node.js 版本 >= 16</li>
            <li>已安装所有依赖</li>
            <li>Vite 构建工具可用</li>
        </ul>
        <a href="/" class="btn">刷新页面</a>
    </div>
</body>
</html>
EOF
                echo -e "${YELLOW}⚠️  构建失败，已创建备用页面${NC}"
                echo -e "${YELLOW}💡 提示：请手动完成构建过程${NC}"
                # 不退出，继续部署备用页面
            fi
        fi
    fi
    
    # 检查构建输出
    if [ ! -d "dist" ]; then
        echo -e "${RED}❌ 构建输出目录不存在${NC}"
        exit 1
    fi
    
    echo -e "   📊 构建统计:"
    echo -e "      • 文件数量: $(find dist -type f | wc -l)"
    echo -e "      • 总大小: $(du -sh dist | cut -f1)"
    echo ""
}

# 创建配置文件
create_config() {
    echo -e "${BLUE}📝 创建配置文件...${NC}"
    
    cd "$WORK_DIR"
    
    # 创建 API 环境配置
    cat > api/.env << EOF
# Serv00 数据库配置
DB_HOST=localhost
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_PORT=3306

# API 配置
API_BASE_URL=/api
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "fallback-secret-key-$(date +%s)")
JWT_EXPIRATION=86400

# 应用配置
APP_ENV=production
APP_DEBUG=false
APP_URL=https://${SERV00_DOMAIN}

# 日志配置
LOG_LEVEL=error
LOG_FILE=/tmp/environment_manager.log
EOF
    
    # 创建前端 .htaccess
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
    AddOutputFilterByType DEFLATE text/plain text/html text/xml text/css
    AddOutputFilterByType DEFLATE application/xml application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript application/json
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
EOF
    
    # 创建 API .htaccess
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
    
    echo -e "   ✅ 配置文件创建完成"
    echo ""
}

# 部署文件
deploy_files() {
    echo -e "${BLUE}📤 部署文件到网站目录...${NC}"
    
    cd "$WORK_DIR"
    
    # 确保目标目录存在
    mkdir -p "$PUBLIC_HTML_DIR"
    
    # 备份现有文件（如果存在）
    if [ "$(ls -A "$PUBLIC_HTML_DIR" 2>/dev/null)" ]; then
        BACKUP_DIR="/usr/home/${SERV00_USER}/backups/$(date +%Y%m%d_%H%M%S)"
        echo -e "   💾 备份现有文件到: ${GREEN}${BACKUP_DIR}${NC}"
        mkdir -p "$BACKUP_DIR"
        cp -r "$PUBLIC_HTML_DIR"/* "$BACKUP_DIR"/ 2>/dev/null || true
    fi
    
    # 清空目标目录
    rm -rf "$PUBLIC_HTML_DIR"/*
    
    # 复制前端文件
    echo -e "   📁 复制前端文件..."
    cp -r dist/* "$PUBLIC_HTML_DIR"/
    
    # 复制 API 文件
    echo -e "   🔌 复制 API 文件..."
    cp -r api "$PUBLIC_HTML_DIR"/
    
    # 复制数据库文件
    echo -e "   🗄️ 复制数据库文件..."
    cp -r database "$PUBLIC_HTML_DIR"/
    
    # 设置权限
    echo -e "   🔐 设置文件权限..."
    find "$PUBLIC_HTML_DIR" -type f -name "*.php" -exec chmod 644 {} \;
    find "$PUBLIC_HTML_DIR" -type f -name "*.html" -exec chmod 644 {} \;
    find "$PUBLIC_HTML_DIR" -type f -name "*.css" -exec chmod 644 {} \;
    find "$PUBLIC_HTML_DIR" -type f -name "*.js" -exec chmod 644 {} \;
    find "$PUBLIC_HTML_DIR" -type d -exec chmod 755 {} \;
    
    echo -e "   ✅ 文件部署完成"
    echo ""
}

# 创建数据库初始化脚本
create_db_script() {
    echo -e "${BLUE}🗄️ 创建数据库初始化脚本...${NC}"
    
    cat > "/usr/home/${SERV00_USER}/init_database.sh" << EOF
#!/bin/bash

# 数据库初始化脚本
# 请在 Serv00 面板中创建数据库后运行此脚本

DB_NAME="${DB_NAME}"
DB_USER="${DB_USER}"
SQL_FILE="${PUBLIC_HTML_DIR}/database/init.sql"

echo "🗄️ 初始化数据库: \$DB_NAME"

if [ -f "\$SQL_FILE" ]; then
    echo "📄 执行 SQL 文件: \$SQL_FILE"
    mysql -u \$DB_USER -p \$DB_NAME < "\$SQL_FILE"
    
    if [ \$? -eq 0 ]; then
        echo "✅ 数据库初始化成功"
        echo "👤 默认管理员账户: admin / admin123"
        echo "🌐 请访问: https://${SERV00_DOMAIN}"
    else
        echo "❌ 数据库初始化失败"
    fi
else
    echo "❌ SQL 文件不存在: \$SQL_FILE"
fi
EOF
    
    chmod +x "/usr/home/${SERV00_USER}/init_database.sh"
    
    echo -e "   ✅ 数据库脚本创建完成: ${GREEN}/usr/home/${SERV00_USER}/init_database.sh${NC}"
    echo ""
}

# 清理临时文件
cleanup() {
    echo -e "${BLUE}🧹 清理临时文件...${NC}"
    
    if [ -d "$WORK_DIR" ]; then
        rm -rf "$WORK_DIR"
        echo -e "   ✅ 工作目录已清理"
    fi
    
    echo ""
}

# 显示部署结果
show_result() {
    echo -e "${GREEN}🎉 部署完成！${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}📊 部署信息:${NC}"
    echo -e "   🌐 网站地址: ${GREEN}https://${SERV00_DOMAIN}${NC}"
    echo -e "   🔌 API 地址: ${GREEN}https://${SERV00_DOMAIN}/api${NC}"
    echo -e "   🗄️ 数据库名: ${GREEN}${DB_NAME}${NC}"
    echo -e "   👤 管理员: ${GREEN}admin / admin123${NC}"
    echo -e "   ⏰ 部署时间: ${GREEN}$(date)${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}📋 下一步操作:${NC}"
    echo -e "   ${CYAN}1.${NC} 在 Serv00 面板中创建数据库: ${GREEN}${DB_NAME}${NC}"
    echo -e "   ${CYAN}2.${NC} 运行数据库初始化脚本:"
    echo -e "      ${GREEN}~/init_database.sh${NC}"
    echo -e "   ${CYAN}3.${NC} 访问网站: ${GREEN}https://${SERV00_DOMAIN}${NC}"
    echo -e "   ${CYAN}4.${NC} 使用管理员账户登录并修改密码"
    echo -e "   ${CYAN}5.${NC} 添加您的环境配置"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎊 享受您的环境管理系统！${NC}"
    echo ""
}

# 主函数
main() {
    show_welcome
    detect_environment
    check_dependencies
    get_database_config
    clone_project
    build_project
    create_config
    deploy_files
    create_db_script
    cleanup
    show_result
}

# 错误处理
trap 'echo -e "${RED}❌ 部署过程中发生错误，请检查日志${NC}"; exit 1' ERR

# 运行主函数
main "$@"
