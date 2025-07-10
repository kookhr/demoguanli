#!/bin/bash

# Serv00 环境管理系统 - 交互式一键安装脚本
# 版本: 2.0.0
# 支持首次安装和更新模式

set -e

# --- 颜色定义 ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# --- 脚本信息 ---
GITHUB_REPO="https://github.com/kookhr/demoguanli.git"
BRANCH="serv00"
SCRIPT_VERSION="2.0.0"

# --- 配置变量 ---
CUSTOM_DOMAIN=""
DB_HOST=""
DB_NAME=""
DB_USER=""
DB_PASSWORD=""
CUSTOM_PORT=""
INSTALL_DIR=""
INSTALL_MODE=""

# --- 默认值 ---
DEFAULT_DOMAIN="$(whoami).serv00.net"
DEFAULT_DB_HOST="mysql14.serv00.com"
DEFAULT_PORT="3000"

# --- 工具函数 ---
print_header() {
    echo -e "${BOLD}${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                🚀 Serv00 环境管理系统                        ║"
    echo "║                交互式一键安装脚本 v${SCRIPT_VERSION}                    ║"
    echo "║                                                              ║"
    echo "║  ✨ 支持首次安装和更新模式                                      ║"
    echo "║  🔧 自动检测安装类型                                           ║"
    echo "║  💾 智能配置保留                                               ║"
    echo "║  🛡️ FreeBSD/Serv00 优化                                       ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() { echo -e "${BOLD}${BLUE}📋 步骤 $1: $2${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${CYAN}ℹ️  $1${NC}"; }

read_input() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    local is_password="$4"
    local input=""

    echo -n -e "${CYAN}$prompt${NC}"
    if [ -n "$default" ]; then
        echo -n -e " ${YELLOW}[默认: $default]${NC}"
    fi
    echo -n ": "

    if [ "$is_password" = "true" ]; then
        read -s input
        echo
    else
        read input
    fi

    if [ -z "$input" ] && [ -n "$default" ]; then
        input="$default"
    fi

    eval "$var_name='$input'"
}

# --- 核心功能函数 ---

detect_install_mode() {
    print_step "1" "检测安装模式"
    
    # 检测可能的安装目录
    local possible_dirs=(
        "$HOME/domains/$DEFAULT_DOMAIN/public_html"
        "$HOME/domains/*/public_html"
        "$HOME/public_html"
    )
    
    for dir_pattern in "${possible_dirs[@]}"; do
        for dir in $dir_pattern; do
            if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
                # 检查是否是我们的项目
                if grep -q "environment-management\|demo" "$dir/package.json" 2>/dev/null; then
                    INSTALL_DIR="$dir"
                    INSTALL_MODE="update"
                    print_success "检测到现有安装: $INSTALL_DIR"
                    return 0
                fi
            fi
        done
    done
    
    INSTALL_MODE="fresh"
    print_info "未检测到现有安装，将进行全新安装"
}

check_system_requirements() {
    print_step "2" "检查系统环境"
    local missing_tools=()
    
    # 检查必要工具
    for tool in git npm node curl; do
        if ! command -v $tool >/dev/null 2>&1; then
            missing_tools+=($tool)
        fi
    done
    
    # 检查 PHP 和 Composer（可选）
    if ! command -v php >/dev/null 2>&1; then
        print_warning "PHP 未安装，API 功能可能受限"
    fi
    
    if ! command -v composer >/dev/null 2>&1; then
        print_warning "Composer 未安装，将跳过 PHP 依赖安装"
    fi

    if [ ${#missing_tools[@]} -gt 0 ]; then
        print_error "缺少必要工具: ${missing_tools[*]}"
        print_info "请先安装缺少的工具，然后重新运行脚本"
        exit 1
    fi
    
    # 检查 Node.js 版本
    local node_version=$(node --version | sed 's/v//')
    local major_version=$(echo $node_version | cut -d. -f1)
    
    if [ "$major_version" -lt 16 ]; then
        print_warning "Node.js 版本较低 ($node_version)，建议使用 16+ 版本"
    fi
    
    print_success "系统环境检查通过"
}

load_existing_config() {
    if [ "$INSTALL_MODE" = "update" ] && [ -f "$INSTALL_DIR/api/.env" ]; then
        print_info "加载现有配置..."
        
        # 从现有 .env 文件读取配置
        if [ -f "$INSTALL_DIR/api/.env" ]; then
            DB_HOST=$(grep "^DB_HOST=" "$INSTALL_DIR/api/.env" | cut -d'=' -f2 | tr -d '"')
            DB_NAME=$(grep "^DB_NAME=" "$INSTALL_DIR/api/.env" | cut -d'=' -f2 | tr -d '"')
            DB_USER=$(grep "^DB_USER=" "$INSTALL_DIR/api/.env" | cut -d'=' -f2 | tr -d '"')
            DB_PASSWORD=$(grep "^DB_PASSWORD=" "$INSTALL_DIR/api/.env" | cut -d'=' -f2 | tr -d '"')
            
            # 从目录路径推断域名
            CUSTOM_DOMAIN=$(echo "$INSTALL_DIR" | sed 's|.*/domains/||' | sed 's|/public_html||')
            
            print_success "已加载现有配置"
        fi
    fi
}

collect_configuration() {
    print_step "3" "收集配置信息"
    
    if [ "$INSTALL_MODE" = "update" ]; then
        print_info "更新模式：将保留现有配置，仅更新必要设置"
        echo -e "\n${BOLD}${CYAN}--- 当前配置 ---${NC}"
        echo -e "域名: ${GREEN}$CUSTOM_DOMAIN${NC}"
        echo -e "数据库主机: ${GREEN}$DB_HOST${NC}"
        echo -e "数据库名称: ${GREEN}$DB_NAME${NC}"
        echo -e "数据库用户: ${GREEN}$DB_USER${NC}"
        echo -e "${BOLD}${CYAN}------------------${NC}\n"
        
        read -p "是否需要修改配置? [y/N]: " modify_config
        if [[ $modify_config =~ ^[Yy]$ ]]; then
            collect_fresh_config
        else
            # 设置安装目录
            INSTALL_DIR="$HOME/domains/$CUSTOM_DOMAIN/public_html"
            CUSTOM_PORT="$DEFAULT_PORT"
        fi
    else
        collect_fresh_config
    fi
}

collect_fresh_config() {
    print_info "请输入配置信息，按 Enter 使用默认值"

    read_input "请输入您的域名" "$DEFAULT_DOMAIN" CUSTOM_DOMAIN
    read_input "请输入数据库主机" "$DEFAULT_DB_HOST" DB_HOST
    read_input "请输入数据库名称" "$(whoami)_env_mgr" DB_NAME
    read_input "请输入数据库用户名" "$(whoami)" DB_USER
    read_input "请输入数据库密码" "" DB_PASSWORD true
    read_input "请输入访问端口 (1024-65535)" "$DEFAULT_PORT" CUSTOM_PORT

    INSTALL_DIR="$HOME/domains/$CUSTOM_DOMAIN/public_html"

    echo -e "\n${BOLD}${CYAN}--- 配置预览 ---${NC}"
    echo -e "安装目录: ${GREEN}$INSTALL_DIR${NC}"
    echo -e "数据库主机: ${GREEN}$DB_HOST${NC}"
    echo -e "数据库名称: ${GREEN}$DB_NAME${NC}"
    echo -e "数据库用户: ${GREEN}$DB_USER${NC}"
    echo -e "访问端口: ${GREEN}$CUSTOM_PORT${NC}"
    echo -e "${BOLD}${CYAN}------------------${NC}\n"

    read -p "确认配置正确吗? [y/N]: " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        print_error "安装已取消"
        exit 0
    fi
}

backup_existing_data() {
    if [ "$INSTALL_MODE" = "update" ] && [ -d "$INSTALL_DIR" ]; then
        print_step "4" "备份现有数据"
        
        local backup_dir="$HOME/env_mgr_backup_$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$backup_dir"
        
        # 备份配置文件
        if [ -f "$INSTALL_DIR/api/.env" ]; then
            cp "$INSTALL_DIR/api/.env" "$backup_dir/"
            print_success "已备份 API 配置文件"
        fi
        
        # 备份自定义文件（如果有）
        if [ -f "$INSTALL_DIR/demo-config.json" ]; then
            cp "$INSTALL_DIR/demo-config.json" "$backup_dir/"
            print_success "已备份应用配置文件"
        fi
        
        print_success "备份完成: $backup_dir"
    fi
}

download_project() {
    local step_num="5"
    if [ "$INSTALL_MODE" = "fresh" ]; then
        step_num="4"
    fi
    
    print_step "$step_num" "下载项目文件"
    
    if [ "$INSTALL_MODE" = "update" ]; then
        print_info "更新模式：拉取最新代码..."
        cd "$INSTALL_DIR"
        
        # 保存本地修改
        git stash push -m "Auto-stash before update $(date)" 2>/dev/null || true
        
        # 拉取最新代码
        git fetch origin $BRANCH
        git reset --hard origin/$BRANCH
        
        print_success "代码更新完成"
    else
        print_info "全新安装：克隆项目..."
        
        if [ -d "$INSTALL_DIR" ]; then
            print_warning "安装目录已存在，将清空并重新下载"
            rm -rf "${INSTALL_DIR:?}"/* "${INSTALL_DIR:?}"/.[!.]* 2>/dev/null || true
        fi
        
        mkdir -p "$INSTALL_DIR"
        cd "$INSTALL_DIR"
        
        git clone -b $BRANCH $GITHUB_REPO . > /dev/null 2>&1
        print_success "项目文件下载完成"
    fi
}

generate_configuration_files() {
    local step_num="6"
    if [ "$INSTALL_MODE" = "fresh" ]; then
        step_num="5"
    fi

    print_step "$step_num" "生成配置文件"

    # 1. 生成 API 的 .env 文件
    local api_env_file="$INSTALL_DIR/api/.env"
    print_info "生成 API 配置文件..."

    # 生成 JWT 密钥
    local jwt_secret
    if command -v openssl >/dev/null 2>&1; then
        jwt_secret=$(openssl rand -hex 32)
    else
        jwt_secret=$(date +%s | sha256sum | head -c 64)
    fi

    cat > "$api_env_file" << EOF
# API 配置文件 - 自动生成于 $(date)
DB_HOST=$DB_HOST
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_PORT=3306

APP_URL=https://$CUSTOM_DOMAIN
JWT_SECRET=$jwt_secret

# 调试模式（生产环境请设为 false）
DEBUG=false

# CORS 配置
CORS_ORIGIN=*
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_HEADERS=Content-Type,Authorization,X-Requested-With
EOF
    print_success "API 配置文件已生成: $api_env_file"

    # 2. 生成数据库初始化 SQL
    local db_init_file="$INSTALL_DIR/database/init.sql"
    if [ -f "$INSTALL_DIR/database/init.sql.template" ]; then
        print_info "生成数据库初始化脚本..."
        cp "$INSTALL_DIR/database/init.sql.template" "$db_init_file"
        # 使用 sed 替换数据库名称占位符
        sed -i.bak "s/__DB_NAME__/$DB_NAME/g" "$db_init_file" && rm "${db_init_file}.bak" 2>/dev/null || true
        print_success "数据库脚本已生成: $db_init_file"
    fi

    # 3. 生成前端配置文件（如果需要）
    local frontend_config="$INSTALL_DIR/demo-config.json"
    cat > "$frontend_config" << EOF
{
  "apiUrl": "https://$CUSTOM_DOMAIN/api",
  "version": "$SCRIPT_VERSION",
  "environment": "production",
  "features": {
    "darkMode": true,
    "statusHistory": true,
    "userManagement": true,
    "environmentGrouping": true
  },
  "deployment": {
    "platform": "serv00",
    "domain": "$CUSTOM_DOMAIN",
    "port": $CUSTOM_PORT,
    "installedAt": "$(date -Iseconds)"
  }
}
EOF
    print_success "前端配置文件已生成: $frontend_config"
}

install_dependencies() {
    local step_num="7"
    if [ "$INSTALL_MODE" = "fresh" ]; then
        step_num="6"
    fi

    print_step "$step_num" "安装依赖"
    cd "$INSTALL_DIR"

    # 1. 安装 PHP 依赖
    if command -v composer >/dev/null 2>&1 && [ -f "$INSTALL_DIR/api/composer.json" ]; then
        print_info "安装 PHP 依赖 (Composer)..."
        cd "$INSTALL_DIR/api"
        composer install --no-dev --optimize-autoloader --quiet
        cd "$INSTALL_DIR"
        print_success "PHP 依赖安装完成"
    else
        print_warning "跳过 PHP 依赖安装（Composer 不可用或无 composer.json）"
    fi

    # 2. 安装 Node.js 依赖
    print_info "安装 Node.js 依赖..."

    # 清理可能的缓存问题
    if [ -d "node_modules" ] && [ "$INSTALL_MODE" = "update" ]; then
        print_info "清理旧的 node_modules..."
        rm -rf node_modules package-lock.json
    fi

    # 使用 npm ci 如果有 package-lock.json，否则使用 npm install
    if [ -f "package-lock.json" ]; then
        npm ci --silent
    else
        npm install --legacy-peer-deps --silent
    fi

    print_success "Node.js 依赖安装完成"
}

build_project() {
    local step_num="8"
    if [ "$INSTALL_MODE" = "fresh" ]; then
        step_num="7"
    fi

    print_step "$step_num" "构建项目"
    cd "$INSTALL_DIR"

    print_info "修复 vite 执行权限..."
    chmod +x node_modules/.bin/vite 2>/dev/null || true

    print_info "构建前端静态文件..."
    export NODE_ENV=production

    # 构建项目
    if npm run build > build.log 2>&1; then
        print_success "前端构建完成"
        rm -f build.log
    else
        print_error "前端构建失败，查看详细日志:"
        tail -20 build.log
        exit 1
    fi

    # 验证构建结果
    if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
        print_error "构建验证失败：dist 目录或 index.html 不存在"
        exit 1
    fi

    print_success "构建验证通过"
}

test_database_connection() {
    local step_num="9"
    if [ "$INSTALL_MODE" = "fresh" ]; then
        step_num="8"
    fi

    print_step "$step_num" "测试数据库连接"

    print_info "正在测试数据库连接..."

    # 设置环境变量以避免密码警告
    export MYSQL_PWD="$DB_PASSWORD"

    # 测试连接
    if mysql -h "$DB_HOST" -u "$DB_USER" -e "SELECT 1;" "$DB_NAME" >/dev/null 2>&1; then
        print_success "数据库连接测试成功"

        # 检查是否需要初始化数据库
        local table_count=$(mysql -h "$DB_HOST" -u "$DB_USER" -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$DB_NAME';" -s -N 2>/dev/null || echo "0")

        if [ "$table_count" -eq 0 ] || [ "$INSTALL_MODE" = "fresh" ]; then
            print_info "初始化数据库结构..."
            if mysql -h "$DB_HOST" -u "$DB_USER" "$DB_NAME" < "$INSTALL_DIR/database/init.sql" 2>/dev/null; then
                print_success "数据库初始化成功"
            else
                print_warning "数据库初始化失败，请手动执行初始化脚本"
            fi
        else
            print_info "数据库已存在 $table_count 个表，跳过初始化"
        fi
    else
        print_warning "数据库连接失败，请检查配置"
        print_info "您可以稍后手动配置数据库"
    fi

    unset MYSQL_PWD
}

create_service_scripts() {
    local step_num="10"
    if [ "$INSTALL_MODE" = "fresh" ]; then
        step_num="9"
    fi

    print_step "$step_num" "创建服务脚本"

    # 创建启动脚本
    cat > "$INSTALL_DIR/start-server.sh" << 'EOF'
#!/bin/bash
# 环境管理系统启动脚本

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 读取配置
if [ -f "demo-config.json" ]; then
    PORT=$(grep '"port"' demo-config.json | sed 's/.*: *\([0-9]*\).*/\1/')
    DOMAIN=$(grep '"domain"' demo-config.json | sed 's/.*: *"\([^"]*\)".*/\1/')
else
    PORT=3000
    DOMAIN="localhost"
fi

echo "🚀 正在启动环境管理系统..."
echo "🌐 访问地址: https://$DOMAIN"
echo "📁 工作目录: $SCRIPT_DIR"
echo "(按 Ctrl+C 停止服务)"
echo ""

# 检查端口是否被占用
if netstat -tuln 2>/dev/null | grep -q ":$PORT "; then
    echo "⚠️  端口 $PORT 已被占用，尝试寻找可用端口..."
    for i in {3001..3010}; do
        if ! netstat -tuln 2>/dev/null | grep -q ":$i "; then
            PORT=$i
            echo "✅ 使用端口: $PORT"
            break
        fi
    done
fi

# 进入 dist 目录并启动服务
cd dist

# 检查是否有 serve 包
if ! npm list serve >/dev/null 2>&1; then
    echo "📦 安装 serve 包..."
    npm install serve --no-save --silent
fi

# 启动服务
echo "🎯 启动服务在端口 $PORT..."
npx serve -s . -p $PORT --cors --single
EOF

    chmod +x "$INSTALL_DIR/start-server.sh"
    print_success "启动脚本已创建: start-server.sh"

    # 创建数据库初始化脚本
    cat > "$INSTALL_DIR/init-database.sh" << EOF
#!/bin/bash
# 数据库初始化脚本

SCRIPT_DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
cd "\$SCRIPT_DIR"

# 读取数据库配置
if [ -f "api/.env" ]; then
    DB_HOST=\$(grep "^DB_HOST=" api/.env | cut -d'=' -f2 | tr -d '"')
    DB_NAME=\$(grep "^DB_NAME=" api/.env | cut -d'=' -f2 | tr -d '"')
    DB_USER=\$(grep "^DB_USER=" api/.env | cut -d'=' -f2 | tr -d '"')

    echo "🗄️  正在初始化数据库..."
    echo "📊 数据库: \$DB_NAME"
    echo "🔗 主机: \$DB_HOST"
    echo ""

    read -s -p "请输入数据库密码: " DB_PASSWORD
    echo ""

    export MYSQL_PWD="\$DB_PASSWORD"

    if mysql -h "\$DB_HOST" -u "\$DB_USER" "\$DB_NAME" < database/init.sql; then
        echo "✅ 数据库初始化成功！"
    else
        echo "❌ 数据库初始化失败，请检查配置"
        exit 1
    fi

    unset MYSQL_PWD
else
    echo "❌ 未找到数据库配置文件 api/.env"
    exit 1
fi
EOF

    chmod +x "$INSTALL_DIR/init-database.sh"
    print_success "数据库初始化脚本已创建: init-database.sh"

    # 创建更新脚本
    cat > "$INSTALL_DIR/update.sh" << EOF
#!/bin/bash
# 快速更新脚本

echo "🔄 正在更新环境管理系统..."

# 使用相同的安装脚本进行更新
bash <(curl -sSL https://raw.githubusercontent.com/kookhr/demoguanli/serv00/interactive-install.sh)
EOF

    chmod +x "$INSTALL_DIR/update.sh"
    print_success "更新脚本已创建: update.sh"
}

setup_mime_types() {
    local step_num="11"
    if [ "$INSTALL_MODE" = "fresh" ]; then
        step_num="10"
    fi

    print_step "$step_num" "配置 MIME 类型"

    # 为 dist 目录创建 .htaccess 文件（如果 Apache 可用）
    cat > "$INSTALL_DIR/dist/.htaccess" << 'EOF'
# MIME 类型配置 - Serv00 优化版本
# 强制设置正确的 MIME 类型

# JavaScript 文件
<FilesMatch "\.(js|mjs)$">
    ForceType application/javascript
    AddType application/javascript .js .mjs
    Header set Content-Type "application/javascript; charset=utf-8"
</FilesMatch>

# CSS 文件
<FilesMatch "\.css$">
    ForceType text/css
    AddType text/css .css
    Header set Content-Type "text/css; charset=utf-8"
</FilesMatch>

# SVG 文件
<FilesMatch "\.svg$">
    ForceType image/svg+xml
    AddType image/svg+xml .svg
    Header set Content-Type "image/svg+xml"
</FilesMatch>

# JSON 文件
<FilesMatch "\.json$">
    ForceType application/json
    AddType application/json .json
    Header set Content-Type "application/json; charset=utf-8"
</FilesMatch>

# 启用压缩
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# SPA 路由支持
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>

# 缓存控制
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 month"
    ExpiresByType application/json "access plus 1 day"
</IfModule>
EOF

    print_success "MIME 类型配置已创建"
    print_info "注意: 如果 Apache 不可用，将使用 npx serve 提供正确的 MIME 类型"
}

show_completion_info() {
    local step_num="12"
    if [ "$INSTALL_MODE" = "fresh" ]; then
        step_num="11"
    fi

    print_step "$step_num" "安装完成"

    echo -e "\n${BOLD}${GREEN}🎉 恭喜！环境管理系统安装/更新完成！${NC}\n"

    echo -e "${BOLD}${CYAN}--- 访问信息 ---${NC}"
    echo -e "🌐 访问域名: ${GREEN}https://$CUSTOM_DOMAIN${NC}"
    echo -e "🔗 API 地址: ${GREEN}https://$CUSTOM_DOMAIN/api${NC}"
    echo -e "📁 安装目录: ${GREEN}$INSTALL_DIR${NC}"
    echo -e "🚀 安装模式: ${GREEN}$INSTALL_MODE${NC}"

    echo -e "\n${BOLD}${CYAN}--- 启动服务 ---${NC}"
    echo -e "1. 进入目录: ${YELLOW}cd $INSTALL_DIR${NC}"
    echo -e "2. 启动服务: ${YELLOW}./start-server.sh${NC}"
    echo -e "3. 或者使用: ${YELLOW}npx serve -s dist -p $CUSTOM_PORT${NC}"

    echo -e "\n${BOLD}${CYAN}--- 数据库管理 ---${NC}"
    echo -e "初始化数据库: ${YELLOW}./init-database.sh${NC}"
    echo -e "手动初始化: ${YELLOW}mysql -h $DB_HOST -u $DB_USER -p $DB_NAME < database/init.sql${NC}"

    echo -e "\n${BOLD}${CYAN}--- 默认登录 ---${NC}"
    echo -e "👤 用户名: ${GREEN}admin${NC}"
    echo -e "🔑 密码: ${GREEN}admin123${NC}"
    echo -e "${YELLOW}⚠️  请在首次登录后立即修改密码！${NC}"

    echo -e "\n${BOLD}${CYAN}--- 更新系统 ---${NC}"
    echo -e "快速更新: ${YELLOW}./update.sh${NC}"
    echo -e "手动更新: ${YELLOW}bash <(curl -sSL https://raw.githubusercontent.com/kookhr/demoguanli/serv00/interactive-install.sh)${NC}"

    echo -e "\n${BOLD}${CYAN}--- 故障排除 ---${NC}"
    echo -e "📋 查看日志: ${YELLOW}tail -f /var/log/httpd/error_log${NC}"
    echo -e "🔧 重新构建: ${YELLOW}npm run build${NC}"
    echo -e "🗄️  重置数据库: ${YELLOW}./init-database.sh${NC}"

    echo -e "\n${GREEN}感谢使用 Serv00 环境管理系统！${NC}"
    echo -e "${CYAN}项目地址: https://github.com/kookhr/demoguanli${NC}"
}

# --- 主函数 ---
main() {
    print_header

    detect_install_mode
    check_system_requirements
    load_existing_config
    collect_configuration

    if [ "$INSTALL_MODE" = "update" ]; then
        backup_existing_data
    fi

    download_project
    generate_configuration_files
    install_dependencies
    build_project
    test_database_connection
    create_service_scripts
    setup_mime_types
    show_completion_info
}

# --- 错误处理 ---
trap 'echo -e "\n${RED}❌ 安装过程中发生错误，请检查上述输出信息${NC}"; exit 1' ERR

# --- 脚本入口 ---
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
