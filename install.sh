#!/bin/bash

# Serv00 环境管理系统 - 轻量级一键安装脚本
# 版本: 1.0.0

set -e

# --- 颜色定义 ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# --- 脚本信息 ---
GITHUB_REPO="https://github.com/kookhr/demoguanli.git"
BRANCH="serv00"

# --- 配置变量 ---
CUSTOM_DOMAIN=""
DB_HOST=""
DB_NAME=""
DB_USER=""
DB_PASSWORD=""
CUSTOM_PORT=""
INSTALL_DIR=""

# --- 默认值 ---
DEFAULT_DOMAIN="$(whoami).serv00.net"
DEFAULT_DB_HOST="mysql14.serv00.com"
DEFAULT_PORT="3000"

# --- 工具函数 ---
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

check_system_requirements() {
    print_step "1" "检查系统环境"
    local missing_tools=()
    for tool in git npm node curl composer; do
        if ! command -v $tool >/dev/null 2>&1; then
            missing_tools+=($tool)
        fi
    done

    if [ ${#missing_tools[@]} -gt 0 ]; then
        print_error "缺少必要工具: ${missing_tools[*]}. 请先安装它们。"
        exit 1
    fi
    print_success "系统环境检查通过"
}

collect_configuration() {
    print_step "2" "收集配置信息"
    print_info "请输入您的配置，按 Enter 使用默认值。"

    read_input "请输入您的域名" "$DEFAULT_DOMAIN" CUSTOM_DOMAIN
    read_input "请输入数据库主机" "$DEFAULT_DB_HOST" DB_HOST
    read_input "请输入数据库名称" "$(whoami)_db" DB_NAME
    read_input "请输入数据库用户名" "$(whoami)_user" DB_USER
    read_input "请输入数据库密码" "" DB_PASSWORD true
    read_input "请输入对外访问端口 (1024-65535)" "$DEFAULT_PORT" CUSTOM_PORT

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
        print_error "安装已取消。"
        exit 0
    fi
}

download_project() {
    print_step "3" "下载项目文件"
    if [ -d "$INSTALL_DIR" ]; then
        print_warning "安装目录已存在。将清空并重新下载。"
        rm -rf "${INSTALL_DIR:?}"/* "${INSTALL_DIR:?}"/.[!.]* 2>/dev/null
    fi
    mkdir -p "$INSTALL_DIR"
    cd "$INSTALL_DIR"

    print_info "从 GitHub 克隆项目..."
    git clone -b $BRANCH $GITHUB_REPO . > /dev/null 2>&1
    print_success "项目文件下载完成"
}

generate_configuration_files() {
    print_step "4" "生成配置文件"

    # 1. 生成 API 的 .env 文件
    local api_env_file="$INSTALL_DIR/api/.env"
    print_info "生成 API 配置文件..."
    cat > "$api_env_file" << EOF
# API 配置文件 - 自动生成
DB_HOST=$DB_HOST
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_PORT=3306

APP_URL=https://$CUSTOM_DOMAIN
JWT_SECRET=$(openssl rand -hex 32)
EOF
    print_success "API 配置文件已生成: $api_env_file"

    # 2. 生成数据库初始化 SQL
    local db_init_file="$INSTALL_DIR/database/init.sql"
    print_info "生成数据库初始化脚本..."
    cp "$INSTALL_DIR/database/init.sql.template" "$db_init_file"
    # 使用 sed 替换数据库名称占位符
    sed -i.bak "s/__DB_NAME__/$DB_NAME/g" "$db_init_file" && rm "${db_init_file}.bak"
    print_success "数据库脚本已生成: $db_init_file"
}

build_project() {
    print_step "5" "安装依赖并构建前端"
    cd "$INSTALL_DIR"

    print_info "安装 PHP 依赖 (Composer)..."
    if [ -f "$INSTALL_DIR/api/composer.json" ]; then
        cd "$INSTALL_DIR/api"
        composer install --no-dev --optimize-autoloader > /dev/null 2>&1
        cd "$INSTALL_DIR"
        print_success "PHP 依赖安装完成"
    else
        print_warning "未找到 composer.json，跳过 PHP 依赖安装。"
    fi

    print_info "安装 npm 依赖..."
    npm install --legacy-peer-deps > /dev/null 2>&1

    print_info "修复 vite 执行权限..."
    chmod +x node_modules/.bin/vite

    print_info "构建前端静态文件..."
    export NODE_ENV=production
    npx vite build > /dev/null 2>&1

    print_success "前端构建完成，文件输出到 dist/ 目录"
}

initialize_database() {
    print_step "6" "初始化数据库"
    print_info "正在连接数据库并导入结构..."
    
    # 尝试执行 SQL 脚本，并抑制密码警告
    export MYSQL_PWD="$DB_PASSWORD"
    if mysql -h "$DB_HOST" -u "$DB_USER" "$DB_NAME" < "$INSTALL_DIR/database/init.sql" 2>/dev/null; then
        print_success "数据库初始化成功"
    else
        print_error "数据库初始化失败。"
        print_warning "请检查数据库配置是否正确，并确保数据库 '$DB_NAME' 已存在。"
        print_warning "您可以稍后手动执行: mysql -h $DB_HOST -u $DB_USER -p $DB_NAME < $INSTALL_DIR/database/init.sql"
    fi
    unset MYSQL_PWD
}

create_start_script() {
    print_step "7" "创建服务启动脚本"
    
    # 为 dist 目录创建一个简单的 package.json 以支持 npx serve
    cat > "$INSTALL_DIR/dist/package.json" << EOF
{
  "name": "env-manager-static",
  "scripts": {
    "start": "serve -s . -p $CUSTOM_PORT --cors"
  },
  "dependencies": {
    "serve": "^14.0.0"
  }
}
EOF

    # 创建主启动脚本
    cat > "$INSTALL_DIR/start-server.sh" << EOF
#!/bin/bash
# 服务启动脚本

echo "🚀 正在启动环境管理系统..."
echo "🌐 访问地址: http://localhost:$CUSTOM_PORT 或 https://$CUSTOM_DOMAIN"
echo "(按 Ctrl+C 停止服务)"

# 进入 dist 目录并使用 npx serve 启动
cd "$INSTALL_DIR/dist"
npx serve -s . -p $CUSTOM_PORT --cors --single
EOF

    chmod +x "$INSTALL_DIR/start-server.sh"
    print_success "启动脚本已创建: ${INSTALL_DIR}/start-server.sh"
}

show_completion_info() {
    echo -e "\n${BOLD}${GREEN}🎉 恭喜！安装完成！${NC}\n"
    echo -e "${BOLD}${CYAN}--- 访问信息 ---${NC}"
    echo -e "- 访问域名: ${GREEN}https://$CUSTOM_DOMAIN${NC}"
    echo -e "- API 地址: ${GREEN}https://$CUSTOM_DOMAIN/api/health${NC}"
    echo -e "- 安装目录: ${GREEN}$INSTALL_DIR${NC}"
    echo -e "\n${BOLD}${CYAN}--- 如何启动 ---${NC}"
    echo -e "1. 进入目录: ${YELLOW}cd $INSTALL_DIR${NC}"
    echo -e "2. 运行脚本: ${YELLOW}./start-server.sh${NC}"
    echo -e "\n${BOLD}${CYAN}--- 默认登录 ---${NC}"
    echo -e "- 用户名: ${GREEN}admin${NC}"
    echo -e "- 密码: ${GREEN}admin123${NC}"
    echo -e "${YELLOW}⚠️  请在首次登录后立即修改密码！${NC}\n"
    echo -e "感谢使用！"
}

# --- 主函数 ---
main() {
    echo -e "${BOLD}${BLUE}🚀 Serv00 环境管理系统 - 轻量级一键安装脚本${NC}"
    echo -e "==================================================\n"

    check_system_requirements
    collect_configuration
    download_project
    generate_configuration_files
    build_project
    initialize_database
    create_start_script
    show_completion_info
}

# --- 脚本入口 ---
main