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
    echo "║  🌐 自定义服务端口配置                                         ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# 端口验证函数
validate_port() {
    local port="$1"

    # 检查是否为数字
    if ! [[ "$port" =~ ^[0-9]+$ ]]; then
        return 1
    fi

    # 检查端口范围 (1024-65535)
    if [ "$port" -lt 1024 ] || [ "$port" -gt 65535 ]; then
        return 1
    fi

    return 0
}

# 检查端口是否被占用
check_port_available() {
    local port="$1"

    # 使用 netstat 检查端口占用 (FreeBSD 兼容)
    if command -v netstat >/dev/null 2>&1; then
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            return 1  # 端口被占用
        fi
    fi

    # 使用 sockstat 检查端口占用 (FreeBSD 特有)
    if command -v sockstat >/dev/null 2>&1; then
        if sockstat -l | grep -q ":$port "; then
            return 1  # 端口被占用
        fi
    fi

    # 尝试绑定端口测试 (最后的检查方法)
    if command -v nc >/dev/null 2>&1; then
        if nc -z localhost "$port" 2>/dev/null; then
            return 1  # 端口被占用
        fi
    fi

    return 0  # 端口可用
}

# 端口占用提示函数（仅用于提示，不自动切换）
show_port_usage_info() {
    local port="$1"

    print_warning "端口 $port 已被占用"
    print_info "可能的解决方案："
    echo -e "  ${YELLOW}1.${NC} 停止占用端口的服务"
    echo -e "  ${YELLOW}2.${NC} 修改配置文件中的端口设置"
    echo -e "  ${YELLOW}3.${NC} 强制使用被占用的端口（可能导致冲突）"
    echo ""

    # 显示占用端口的进程信息（如果可能）
    if command -v netstat >/dev/null 2>&1; then
        local process_info=$(netstat -tuln 2>/dev/null | grep ":$port ")
        if [ -n "$process_info" ]; then
            print_info "端口占用详情："
            echo "$process_info"
        fi
    fi

    if command -v sockstat >/dev/null 2>&1; then
        local process_info=$(sockstat -l 2>/dev/null | grep ":$port ")
        if [ -n "$process_info" ]; then
            print_info "端口占用详情 (FreeBSD)："
            echo "$process_info"
        fi
    fi
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

        # 从现有 demo-config.json 读取端口配置
        if [ -f "$INSTALL_DIR/demo-config.json" ]; then
            CUSTOM_PORT=$(grep '"port"' "$INSTALL_DIR/demo-config.json" | sed 's/.*: *\([0-9]*\).*/\1/' | head -1)
            if [ -z "$CUSTOM_PORT" ] || ! validate_port "$CUSTOM_PORT"; then
                CUSTOM_PORT="$DEFAULT_PORT"
            fi
            print_info "已加载现有端口配置: $CUSTOM_PORT"
        else
            CUSTOM_PORT="$DEFAULT_PORT"
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
        echo -e "服务端口: ${GREEN}$CUSTOM_PORT${NC}"
        echo -e "${BOLD}${CYAN}------------------${NC}\n"

        read -p "是否需要修改配置? [y/N]: " modify_config
        if [[ $modify_config =~ ^[Yy]$ ]]; then
            collect_fresh_config
        else
            # 设置安装目录
            INSTALL_DIR="$HOME/domains/$CUSTOM_DOMAIN/public_html"
            # 端口配置已在 load_existing_config 中加载
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

    # 端口配置和验证
    while true; do
        read_input "请输入服务端口 (1024-65535)" "$DEFAULT_PORT" CUSTOM_PORT

        # 验证端口格式和范围
        if ! validate_port "$CUSTOM_PORT"; then
            print_error "端口无效！请输入 1024-65535 范围内的数字"
            continue
        fi

        # 检查端口是否被占用
        if ! check_port_available "$CUSTOM_PORT"; then
            show_port_usage_info "$CUSTOM_PORT"

            echo -e "${CYAN}请选择操作:${NC}"
            echo -e "  ${GREEN}1.${NC} 修改端口配置"
            echo -e "  ${GREEN}2.${NC} 强制使用此端口"
            echo -e "  ${GREEN}3.${NC} 取消安装"
            echo ""
            read -p "请选择 [1-3]: " port_choice

            case $port_choice in
                1)
                    print_info "请重新输入端口..."
                    continue
                    ;;
                2)
                    print_warning "将强制使用被占用的端口 $CUSTOM_PORT"
                    print_warning "这可能导致服务冲突或启动失败"
                    break
                    ;;
                3)
                    print_error "安装已取消"
                    exit 0
                    ;;
                *)
                    print_error "无效选择，请重新输入端口"
                    continue
                    ;;
            esac
        else
            print_success "端口 $CUSTOM_PORT 可用"
            break
        fi
    done

    INSTALL_DIR="$HOME/domains/$CUSTOM_DOMAIN/public_html"

    echo -e "\n${BOLD}${CYAN}--- 配置预览 ---${NC}"
    echo -e "安装目录: ${GREEN}$INSTALL_DIR${NC}"
    echo -e "数据库主机: ${GREEN}$DB_HOST${NC}"
    echo -e "数据库名称: ${GREEN}$DB_NAME${NC}"
    echo -e "数据库用户: ${GREEN}$DB_USER${NC}"
    echo -e "服务端口: ${GREEN}$CUSTOM_PORT${NC}"
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
        if composer install --no-dev --optimize-autoloader --quiet; then
            print_success "PHP 依赖安装完成"
        else
            print_warning "PHP 依赖安装失败，但不影响基本功能"
        fi
        cd "$INSTALL_DIR"
    else
        print_warning "跳过 PHP 依赖安装（Composer 不可用或无 composer.json）"
    fi

    # 2. 检查 Node.js 环境
    check_nodejs_environment

    # 3. 安装 Node.js 依赖
    install_nodejs_dependencies_robust
}

# 检查 Node.js 环境
check_nodejs_environment() {
    print_info "检查 Node.js 环境..."

    # 检查 Node.js
    if ! command -v node >/dev/null 2>&1; then
        print_error "Node.js 未安装，请先安装 Node.js 16+"
        exit 1
    fi

    # 检查 npm
    if ! command -v npm >/dev/null 2>&1; then
        print_error "npm 不可用，请检查 Node.js 安装"
        exit 1
    fi

    local node_version=$(node --version 2>/dev/null | sed 's/v//')
    local npm_version=$(npm --version 2>/dev/null)

    print_info "Node.js 版本: $node_version"
    print_info "npm 版本: $npm_version"

    # 检查版本兼容性
    local major_version=$(echo "$node_version" | cut -d. -f1)
    if [ "$major_version" -lt 16 ]; then
        print_warning "Node.js 版本较低 ($node_version)，推荐使用 16+ 版本"
    fi
}

# 增强的 Node.js 依赖安装
install_nodejs_dependencies_robust() {
    print_info "安装 Node.js 依赖..."

    # 清理可能的缓存问题
    if [ -d "node_modules" ] && [ "$INSTALL_MODE" = "update" ]; then
        print_info "清理旧的 node_modules..."
        rm -rf node_modules package-lock.json
    fi

    # 设置 npm 配置
    npm config set fund false 2>/dev/null || true
    npm config set audit false 2>/dev/null || true

    local install_success=false
    local install_method=""

    # 方法 1: 使用 npm ci（如果有 lock 文件）
    if [ -f "package-lock.json" ] && [ "$install_success" = false ]; then
        print_info "尝试使用 npm ci..."
        if timeout 300 npm ci --silent 2>/dev/null; then
            install_success=true
            install_method="npm ci"
        else
            print_warning "npm ci 失败，删除 lock 文件重试..."
            rm -f package-lock.json
        fi
    fi

    # 方法 2: 标准 npm install
    if [ "$install_success" = false ]; then
        print_info "尝试标准 npm install..."
        if timeout 300 npm install --silent 2>/dev/null; then
            install_success=true
            install_method="npm install"
        fi
    fi

    # 方法 3: 使用 legacy-peer-deps
    if [ "$install_success" = false ]; then
        print_info "尝试使用 --legacy-peer-deps..."
        if timeout 300 npm install --legacy-peer-deps --silent 2>/dev/null; then
            install_success=true
            install_method="npm install --legacy-peer-deps"
        fi
    fi

    # 方法 4: 强制安装
    if [ "$install_success" = false ]; then
        print_info "尝试强制安装..."
        if timeout 300 npm install --force --silent 2>/dev/null; then
            install_success=true
            install_method="npm install --force"
        fi
    fi

    # 方法 5: 清理缓存后重试
    if [ "$install_success" = false ]; then
        print_info "清理缓存后重试..."
        npm cache clean --force 2>/dev/null || true
        rm -rf node_modules package-lock.json 2>/dev/null || true

        if timeout 300 npm install --legacy-peer-deps --silent 2>/dev/null; then
            install_success=true
            install_method="npm install --legacy-peer-deps (after cache clean)"
        fi
    fi

    if [ "$install_success" = true ]; then
        print_success "Node.js 依赖安装完成 ($install_method)"

        # 验证关键依赖
        if [ -d "node_modules/react" ] && [ -d "node_modules/vite" ]; then
            print_success "关键依赖验证通过"
        else
            print_warning "部分依赖可能有问题，但继续构建"
        fi
    else
        print_error "Node.js 依赖安装失败"
        echo ""
        print_info "可能的解决方案："
        echo -e "  ${YELLOW}1.${NC} 检查网络连接: ${CYAN}ping registry.npmjs.org${NC}"
        echo -e "  ${YELLOW}2.${NC} 更新 Node.js: ${CYAN}node --version${NC} (推荐 16+)"
        echo -e "  ${YELLOW}3.${NC} 清理 npm 缓存: ${CYAN}npm cache clean --force${NC}"
        echo -e "  ${YELLOW}4.${NC} 手动安装: ${CYAN}npm install --legacy-peer-deps${NC}"
        echo ""

        echo -e "  ${YELLOW}5.${NC} 下载修复脚本: ${CYAN}curl -O https://raw.githubusercontent.com/kookhr/demoguanli/serv00/fix-deployment-issues.sh${NC}"
        echo -e "  ${YELLOW}6.${NC} 运行修复脚本: ${CYAN}chmod +x fix-deployment-issues.sh && ./fix-deployment-issues.sh -d${NC}"
        echo ""

        read -p "依赖安装失败，是否继续部署？[y/N]: " continue_deploy
        if [[ $continue_deploy =~ ^[Yy]$ ]]; then
            print_warning "跳过依赖安装，继续部署（可能影响功能）"

            # 下载修复脚本供后续使用
            print_info "下载修复脚本供后续使用..."
            curl -s -o fix-deployment-issues.sh https://raw.githubusercontent.com/kookhr/demoguanli/serv00/fix-deployment-issues.sh 2>/dev/null || true
            chmod +x fix-deployment-issues.sh 2>/dev/null || true

            if [ -f "fix-deployment-issues.sh" ]; then
                print_success "修复脚本已下载，稍后可运行: ./fix-deployment-issues.sh"
            fi
        else
            print_error "部署已取消"
            print_info "您可以稍后运行以下命令修复问题："
            echo -e "  ${CYAN}curl -O https://raw.githubusercontent.com/kookhr/demoguanli/serv00/fix-deployment-issues.sh${NC}"
            echo -e "  ${CYAN}chmod +x fix-deployment-issues.sh && ./fix-deployment-issues.sh${NC}"
            exit 1
        fi
    fi
}

build_project() {
    local step_num="8"
    if [ "$INSTALL_MODE" = "fresh" ]; then
        step_num="7"
    fi

    print_step "$step_num" "构建项目"
    cd "$INSTALL_DIR"

    # 检查构建环境
    check_build_environment

    print_info "构建前端静态文件..."
    export NODE_ENV=production

    # 尝试构建项目
    build_with_retry
}

# 检查构建环境
check_build_environment() {
    print_info "检查构建环境..."

    # 检查 package.json 中的构建脚本
    if [ ! -f "package.json" ]; then
        print_error "package.json 不存在"
        exit 1
    fi

    if ! grep -q '"build"' package.json; then
        print_error "package.json 中未找到 build 脚本"
        exit 1
    fi

    # 检查 node_modules
    if [ ! -d "node_modules" ]; then
        print_error "node_modules 目录不存在，请先安装依赖"
        exit 1
    fi

    # 检查关键依赖
    if [ ! -d "node_modules/vite" ]; then
        print_warning "Vite 依赖缺失，可能影响构建"
    fi

    # 修复可能的权限问题
    print_info "修复构建工具权限..."
    chmod +x node_modules/.bin/* 2>/dev/null || true

    print_success "构建环境检查完成"
}

# 带重试的构建函数
build_with_retry() {
    local build_success=false
    local build_attempts=0
    local max_attempts=3

    while [ "$build_attempts" -lt "$max_attempts" ] && [ "$build_success" = false ]; do
        build_attempts=$((build_attempts + 1))

        if [ "$build_attempts" -gt 1 ]; then
            print_info "构建重试 ($build_attempts/$max_attempts)..."

            # 清理可能的构建缓存
            rm -rf dist .vite node_modules/.vite 2>/dev/null || true
        fi

        print_info "执行构建命令..."

        # 使用 timeout 防止构建卡死
        if timeout 600 npm run build > build.log 2>&1; then
            build_success=true
            print_success "前端构建完成"
            rm -f build.log
        else
            print_warning "构建失败 (尝试 $build_attempts/$max_attempts)"

            if [ -f "build.log" ]; then
                print_info "构建错误日志："
                tail -20 build.log
            fi

            # 如果不是最后一次尝试，等待一下
            if [ "$build_attempts" -lt "$max_attempts" ]; then
                print_info "等待 5 秒后重试..."
                sleep 5
            fi
        fi
    done

    if [ "$build_success" = false ]; then
        print_error "构建失败，已尝试 $max_attempts 次"

        if [ -f "build.log" ]; then
            echo ""
            print_info "完整构建日志："
            cat build.log
        fi

        echo ""
        print_info "可能的解决方案："
        echo -e "  ${YELLOW}1.${NC} 检查 Node.js 版本: ${CYAN}node --version${NC}"
        echo -e "  ${YELLOW}2.${NC} 重新安装依赖: ${CYAN}rm -rf node_modules && npm install${NC}"
        echo -e "  ${YELLOW}3.${NC} 检查磁盘空间: ${CYAN}df -h${NC}"
        echo -e "  ${YELLOW}4.${NC} 手动构建: ${CYAN}npm run build${NC}"

        exit 1
    fi

    # 验证构建结果
    verify_build_result
}

# 验证构建结果
verify_build_result() {
    print_info "验证构建结果..."

    # 检查 dist 目录
    if [ ! -d "dist" ]; then
        print_error "构建验证失败：dist 目录不存在"
        exit 1
    fi

    # 检查主要文件
    if [ ! -f "dist/index.html" ]; then
        print_error "构建验证失败：dist/index.html 不存在"
        exit 1
    fi

    # 检查静态资源
    if [ ! -d "dist/assets" ]; then
        print_warning "dist/assets 目录不存在，可能影响样式和脚本"
    else
        local js_files=$(find dist/assets -name "*.js" | wc -l)
        local css_files=$(find dist/assets -name "*.css" | wc -l)
        print_info "构建产物: $js_files 个 JS 文件, $css_files 个 CSS 文件"
    fi

    # 检查文件大小
    local dist_size=$(du -sh dist 2>/dev/null | cut -f1)
    print_info "构建产物大小: $dist_size"

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

# 集成的日志管理功能
create_log_management_functions() {
    cat >> "$INSTALL_DIR/start-server.sh" << 'EOF'

# 日志管理功能
manage_logs() {
    local action="$1"
    local log_type="$2"
    local lines="${3:-50}"

    case "$action" in
        "view")
            case "$log_type" in
                "server") [ -f "logs/server.log" ] && tail -n "$lines" logs/server.log ;;
                "error") [ -f "logs/error.log" ] && tail -n "$lines" logs/error.log ;;
                "access") [ -f "logs/access.log" ] && tail -n "$lines" logs/access.log ;;
                "all")
                    echo "=== Server Log ==="
                    [ -f "logs/server.log" ] && tail -n "$lines" logs/server.log
                    echo -e "\n=== Error Log ==="
                    [ -f "logs/error.log" ] && tail -n "$lines" logs/error.log
                    echo -e "\n=== Access Log ==="
                    [ -f "logs/access.log" ] && tail -n "$lines" logs/access.log
                    ;;
                *) echo "用法: $0 manage-logs view [server|error|access|all] [lines]" ;;
            esac
            ;;
        "tail")
            case "$log_type" in
                "server") [ -f "logs/server.log" ] && tail -f logs/server.log ;;
                "error") [ -f "logs/error.log" ] && tail -f logs/error.log ;;
                "access") [ -f "logs/access.log" ] && tail -f logs/access.log ;;
                "all") tail -f logs/*.log 2>/dev/null ;;
                *) echo "用法: $0 manage-logs tail [server|error|access|all]" ;;
            esac
            ;;
        "rotate")
            rotate_logs
            ;;
        "clean")
            clean_old_logs
            ;;
        "stats")
            show_log_stats
            ;;
        *)
            echo "日志管理用法:"
            echo "  $0 manage-logs view [server|error|access|all] [lines]"
            echo "  $0 manage-logs tail [server|error|access|all]"
            echo "  $0 manage-logs rotate"
            echo "  $0 manage-logs clean"
            echo "  $0 manage-logs stats"
            ;;
    esac
}

# 日志轮转
rotate_logs() {
    local max_size=10485760  # 10MB

    for log_file in logs/server.log logs/error.log logs/access.log; do
        if [ -f "$log_file" ]; then
            local file_size=$(stat -f%z "$log_file" 2>/dev/null || stat -c%s "$log_file" 2>/dev/null || echo 0)

            if [ "$file_size" -gt "$max_size" ]; then
                local timestamp=$(date +%Y%m%d_%H%M%S)
                local rotated_file="${log_file}.${timestamp}"

                mv "$log_file" "$rotated_file"
                gzip "$rotated_file" 2>/dev/null || true
                touch "$log_file"

                echo "已轮转日志: $log_file -> ${rotated_file}.gz"
            fi
        fi
    done
}

# 清理旧日志
clean_old_logs() {
    # 删除 7 天前的压缩日志
    find logs/ -name "*.gz" -mtime +7 -delete 2>/dev/null || true
    echo "已清理 7 天前的旧日志"
}

# 显示日志统计
show_log_stats() {
    echo "=== 日志统计 ==="
    for log_file in logs/server.log logs/error.log logs/access.log; do
        if [ -f "$log_file" ]; then
            local lines=$(wc -l < "$log_file" 2>/dev/null || echo 0)
            local size=$(du -h "$log_file" 2>/dev/null | cut -f1)
            echo "$(basename "$log_file"): $lines 行, $size"
        fi
    done

    local gz_count=$(find logs/ -name "*.gz" 2>/dev/null | wc -l)
    echo "归档日志: $gz_count 个文件"
}
EOF
}

# 集成的服务助手功能
create_service_helper_functions() {
    cat >> "$INSTALL_DIR/start-server.sh" << 'EOF'

# 服务助手功能
service_helper() {
    while true; do
        clear
        echo "╔══════════════════════════════════════════════════════════════╗"
        echo "║              🚀 环境管理系统服务助手                         ║"
        echo "║                                                              ║"
        echo "║  简化的服务管理界面，提供一键操作和状态监控                   ║"
        echo "╚══════════════════════════════════════════════════════════════╝"
        echo ""

        # 显示当前状态
        echo "🔍 当前状态:"
        if [ -f "logs/server.pid" ] && kill -0 "$(cat logs/server.pid)" 2>/dev/null; then
            local pid=$(cat logs/server.pid)
            echo "  服务状态: 运行中 (PID: $pid)"

            if [ -f "demo-config.json" ]; then
                local domain=$(grep '"domain"' demo-config.json | sed 's/.*: *"\([^"]*\)".*/\1/' 2>/dev/null)
                local port=$(grep '"port"' demo-config.json | sed 's/.*: *\([0-9]*\).*/\1/' 2>/dev/null)
                [ -n "$domain" ] && echo "  访问地址: https://$domain/"
                [ -n "$port" ] && echo "  带端口访问: https://$domain:$port/"
            fi
        else
            echo "  服务状态: 未运行"
        fi

        echo ""
        echo "📋 可用操作:"
        echo "  1. 🚀 启动服务 (前台)"
        echo "  2. 🌙 启动服务 (后台)"
        echo "  3. 🛑 停止服务"
        echo "  4. 🔄 重启服务"
        echo "  5. 📊 查看状态"
        echo "  6. 📋 查看日志"
        echo "  7. 🔧 故障排除"
        echo "  8. ⚙️  系统信息"
        echo "  9. 📖 帮助文档"
        echo "  0. 🚪 退出"
        echo ""

        read -p "请选择操作 [0-9]: " choice

        case $choice in
            1)
                echo "启动前台服务..."
                exec "$0"
                ;;
            2)
                echo "启动后台服务..."
                exec "$0" -d
                ;;
            3)
                echo "停止服务..."
                exec "$0" stop
                ;;
            4)
                echo "重启服务..."
                exec "$0" restart -d
                ;;
            5)
                echo "查看服务状态..."
                exec "$0" status -v
                ;;
            6)
                echo "选择日志类型:"
                echo "  1. 服务日志"
                echo "  2. 错误日志"
                echo "  3. 访问日志"
                echo "  4. 所有日志"
                read -p "请选择 [1-4]: " log_choice
                case $log_choice in
                    1) manage_logs view server ;;
                    2) manage_logs view error ;;
                    3) manage_logs view access ;;
                    4) manage_logs view all ;;
                    *) echo "无效选择" ;;
                esac
                read -p "按回车键继续..."
                ;;
            7)
                troubleshoot_service
                read -p "按回车键继续..."
                ;;
            8)
                show_system_info
                read -p "按回车键继续..."
                ;;
            9)
                show_help_info
                read -p "按回车键继续..."
                ;;
            0)
                echo "退出服务助手"
                exit 0
                ;;
            *)
                echo "无效选择，请重新输入"
                sleep 1
                ;;
        esac
    done
}

# 故障排除功能
troubleshoot_service() {
    echo "🔧 故障排除"
    echo ""

    # 检查端口占用
    if [ -f "demo-config.json" ]; then
        local port=$(grep '"port"' demo-config.json | sed 's/.*: *\([0-9]*\).*/\1/' 2>/dev/null)
        if [ -n "$port" ]; then
            echo "检查端口 $port 占用情况:"
            if command -v netstat >/dev/null 2>&1; then
                netstat -tuln | grep ":$port " || echo "  端口未被占用"
            fi
            if command -v sockstat >/dev/null 2>&1; then
                sockstat -l | grep ":$port " || echo "  端口未被占用 (FreeBSD)"
            fi
        fi
    fi

    echo ""
    echo "常见问题解决方案:"
    echo "  1. 端口被占用: 修改配置文件中的端口"
    echo "  2. 权限问题: chmod +x start-server.sh"
    echo "  3. 依赖缺失: npm install"
    echo "  4. 构建失败: npm run build"
    echo "  5. 配置错误: 检查 demo-config.json"
}

# 显示系统信息
show_system_info() {
    echo "⚙️  系统信息"
    echo ""
    echo "操作系统: $(uname -s)"
    echo "架构: $(uname -m)"
    echo "主机名: $(hostname)"
    echo ""

    if command -v node >/dev/null 2>&1; then
        echo "Node.js: $(node --version)"
    fi

    if command -v npm >/dev/null 2>&1; then
        echo "npm: $(npm --version)"
    fi

    if command -v php >/dev/null 2>&1; then
        echo "PHP: $(php --version | head -1)"
    fi

    echo ""
    echo "磁盘使用:"
    df -h . | tail -1
}

# 显示帮助信息
show_help_info() {
    echo "📖 帮助文档"
    echo ""
    echo "启动脚本用法:"
    echo "  $0                    # 前台运行"
    echo "  $0 -d                 # 后台运行"
    echo "  $0 stop               # 停止服务"
    echo "  $0 restart            # 重启服务"
    echo "  $0 status             # 查看状态"
    echo "  $0 helper             # 服务助手"
    echo "  $0 manage-logs <cmd>  # 日志管理"
    echo ""
    echo "日志管理命令:"
    echo "  view [type] [lines]   # 查看日志"
    echo "  tail [type]           # 实时查看"
    echo "  rotate                # 轮转日志"
    echo "  clean                 # 清理旧日志"
    echo "  stats                 # 日志统计"
}
EOF
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
# 环境管理系统启动脚本 - 支持前台和后台运行

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# 配置文件
PID_FILE="$SCRIPT_DIR/logs/server.pid"
LOG_DIR="$SCRIPT_DIR/logs"
ACCESS_LOG="$LOG_DIR/access.log"
ERROR_LOG="$LOG_DIR/error.log"
SERVER_LOG="$LOG_DIR/server.log"

# 默认配置
DAEMON_MODE=false
VERBOSE=false

# 工具函数
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${CYAN}ℹ️  $1${NC}"; }

# 显示帮助信息
show_help() {
    echo -e "${BOLD}${BLUE}环境管理系统启动脚本${NC}"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -d, --daemon     后台运行模式"
    echo "  -v, --verbose    详细输出模式"
    echo "  -h, --help       显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0               前台运行（默认）"
    echo "  $0 -d            后台运行"
    echo "  $0 --daemon      后台运行"
    echo "  $0 -d -v         后台运行并显示详细信息"
    echo ""
    echo "管理命令:"
    echo "  ./stop-server.sh     停止后台服务"
    echo "  ./status-server.sh   查看服务状态"
    echo "  ./restart-server.sh  重启服务"
    echo ""
}

# 解析命令行参数
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -d|--daemon)
                DAEMON_MODE=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                print_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# 端口验证函数
validate_port() {
    local port="$1"
    if ! [[ "$port" =~ ^[0-9]+$ ]] || [ "$port" -lt 1024 ] || [ "$port" -gt 65535 ]; then
        return 1
    fi
    return 0
}

# 检查端口是否被占用
check_port_available() {
    local port="$1"

    # 使用 netstat 检查端口占用 (FreeBSD 兼容)
    if command -v netstat >/dev/null 2>&1; then
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            return 1
        fi
    fi

    # 使用 sockstat 检查端口占用 (FreeBSD 特有)
    if command -v sockstat >/dev/null 2>&1; then
        if sockstat -l | grep -q ":$port "; then
            return 1
        fi
    fi

    return 0
}

# 创建日志目录
setup_logging() {
    if [ ! -d "$LOG_DIR" ]; then
        mkdir -p "$LOG_DIR"
        [ "$VERBOSE" = true ] && print_info "创建日志目录: $LOG_DIR"
    fi

    # 日志轮转 - 如果日志文件超过 10MB，进行轮转
    for log_file in "$ACCESS_LOG" "$ERROR_LOG" "$SERVER_LOG"; do
        if [ -f "$log_file" ] && [ $(stat -f%z "$log_file" 2>/dev/null || stat -c%s "$log_file" 2>/dev/null || echo 0) -gt 10485760 ]; then
            mv "$log_file" "${log_file}.$(date +%Y%m%d_%H%M%S)"
            [ "$VERBOSE" = true ] && print_info "轮转日志文件: $(basename $log_file)"
        fi
    done
}

# 检查服务是否已运行
check_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            return 0  # 服务正在运行
        else
            # PID 文件存在但进程不存在，清理 PID 文件
            rm -f "$PID_FILE"
            return 1  # 服务未运行
        fi
    fi
    return 1  # 服务未运行
}

# 读取配置
load_config() {
    if [ -f "demo-config.json" ]; then
        PORT=$(grep '"port"' demo-config.json | sed 's/.*: *\([0-9]*\).*/\1/')
        DOMAIN=$(grep '"domain"' demo-config.json | sed 's/.*: *"\([^"]*\)".*/\1/')
    else
        PORT=3000
        DOMAIN="localhost"
    fi

    # 验证端口配置
    if ! validate_port "$PORT"; then
        print_warning "配置文件中的端口无效，使用默认端口 3000"
        PORT=3000
    fi

    [ "$VERBOSE" = true ] && print_info "配置加载完成 - 域名: $DOMAIN, 端口: $PORT"
}
# 端口状态检查（仅检查，不自动切换）
check_configured_port() {
    if check_port_available "$PORT"; then
        [ "$VERBOSE" = true ] && print_success "配置端口 $PORT 可用"
        return 0
    else
        print_warning "配置端口 $PORT 已被占用"

        if [ "$DAEMON_MODE" = true ]; then
            # 后台模式下显示详细信息
            show_port_usage_info "$PORT"
            print_error "后台模式下无法交互选择，请修改配置文件中的端口或停止占用进程"
            return 1
        else
            # 前台模式下询问用户
            show_port_usage_info "$PORT"
            echo ""
            read -p "是否强制使用被占用的端口 $PORT? [y/N]: " force_port
            if [[ $force_port =~ ^[Yy]$ ]]; then
                print_warning "将强制使用被占用的端口 $PORT"
                print_warning "这可能导致服务冲突或启动失败"
                return 0
            else
                print_error "请修改配置文件中的端口设置，或停止占用端口的进程"
                return 1
            fi
        fi
    fi
}

# 启动前台服务
start_foreground() {
    print_info "启动前台服务..."

    echo -e "${BOLD}${BLUE}🚀 正在启动环境管理系统...${NC}"
    echo -e "🌐 访问地址: ${GREEN}https://$DOMAIN:$PORT${NC}"
    echo -e "📁 工作目录: ${CYAN}$SCRIPT_DIR${NC}"
    echo -e "🔧 配置端口: ${YELLOW}$PORT${NC}"
    echo -e "${YELLOW}(按 Ctrl+C 停止服务)${NC}"
    echo ""

    # 进入 dist 目录
    if [ ! -d "dist" ]; then
        print_error "dist 目录不存在，请先构建项目"
        exit 1
    fi

    cd dist

    # 检查并安装 serve 包
    if ! npm list serve >/dev/null 2>&1; then
        print_info "安装 serve 包..."
        npm install serve --no-save --silent
    fi

    # 启动服务
    echo -e "${BOLD}🎯 启动服务在端口 $PORT...${NC}"
    echo -e "🌐 访问地址: ${GREEN}https://$DOMAIN:$PORT${NC}"
    echo ""

    exec npx serve -s . -p "$PORT" --cors --single
}

# 启动后台服务
start_daemon() {
    print_info "启动后台服务..."

    # 检查服务是否已运行
    if check_running; then
        local pid=$(cat "$PID_FILE")
        print_warning "服务已在运行 (PID: $pid)"
        print_info "访问地址: https://$DOMAIN:$PORT"
        print_info "使用 ./stop-server.sh 停止服务"
        exit 1
    fi

    # 进入 dist 目录
    if [ ! -d "dist" ]; then
        print_error "dist 目录不存在，请先构建项目"
        exit 1
    fi

    cd dist

    # 检查并安装 serve 包
    if ! npm list serve >/dev/null 2>&1; then
        print_info "安装 serve 包..."
        npm install serve --no-save --silent >/dev/null 2>&1
    fi

    # 启动后台服务
    print_info "正在启动后台服务..."

    # 使用 nohup 启动后台进程
    nohup npx serve -s . -p "$PORT" --cors --single \
        > "$SERVER_LOG" 2> "$ERROR_LOG" &

    local pid=$!
    echo "$pid" > "$PID_FILE"

    # 等待一下确保服务启动
    sleep 2

    # 验证服务是否成功启动
    if kill -0 "$pid" 2>/dev/null; then
        print_success "后台服务启动成功 (PID: $pid)"
        echo -e "🌐 访问地址: ${GREEN}https://$DOMAIN:$PORT${NC}"
        echo -e "📋 查看日志: ${YELLOW}tail -f $SERVER_LOG${NC}"
        echo -e "🔍 服务状态: ${YELLOW}./status-server.sh${NC}"
        echo -e "🛑 停止服务: ${YELLOW}./stop-server.sh${NC}"

        # 记录启动信息到日志
        echo "$(date '+%Y-%m-%d %H:%M:%S') - 服务启动成功 (PID: $pid, PORT: $PORT)" >> "$ACCESS_LOG"
    else
        print_error "后台服务启动失败"
        rm -f "$PID_FILE"
        print_info "查看错误日志: cat $ERROR_LOG"
        exit 1
    fi
}

# 主函数
main() {
    # 解析命令行参数
    parse_args "$@"

    # 设置日志
    setup_logging

    # 加载配置
    load_config

    # 检查配置端口状态
    if ! check_configured_port; then
        exit 1
    fi

    # 根据模式启动服务
    if [ "$DAEMON_MODE" = true ]; then
        start_daemon
    else
        start_foreground
    fi
}

# 停止服务功能
stop_service() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            print_info "正在停止服务 (PID: $pid)..."
            kill "$pid"

            # 等待进程结束
            local count=0
            while kill -0 "$pid" 2>/dev/null && [ $count -lt 10 ]; do
                sleep 1
                count=$((count + 1))
            done

            if kill -0 "$pid" 2>/dev/null; then
                print_warning "正常停止失败，强制终止..."
                kill -9 "$pid" 2>/dev/null
            fi

            rm -f "$PID_FILE"
            print_success "服务已停止"
        else
            print_warning "进程不存在，清理 PID 文件"
            rm -f "$PID_FILE"
        fi
    else
        print_info "服务未运行"
    fi
}

# 重启服务功能
restart_service() {
    print_info "重启服务..."
    stop_service
    sleep 2
    exec "$0" "$@"
}

# 显示状态功能
show_status() {
    local verbose=false
    local show_logs=false

    for arg in "$@"; do
        case $arg in
            -v|--verbose) verbose=true ;;
            -l|--logs) show_logs=true ;;
        esac
    done

    print_header "🔍 服务状态检查"

    # 检查服务状态
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            print_success "服务正在运行 (PID: $pid)"

            if [ "$verbose" = true ]; then
                # 显示进程信息
                if command -v ps >/dev/null 2>&1; then
                    echo ""
                    print_info "进程信息:"
                    ps -p "$pid" -o pid,ppid,cmd,etime,pcpu,pmem 2>/dev/null || true
                fi

                # 显示端口监听
                if [ -f "demo-config.json" ]; then
                    local port=$(grep '"port"' demo-config.json | sed 's/.*: *\([0-9]*\).*/\1/' 2>/dev/null)
                    if [ -n "$port" ]; then
                        echo ""
                        print_info "端口监听状态:"
                        if command -v netstat >/dev/null 2>&1; then
                            netstat -tuln | grep ":$port " || echo "  端口 $port 未在监听"
                        fi
                    fi
                fi
            fi
        else
            print_warning "PID 文件存在但进程未运行"
            rm -f "$PID_FILE"
        fi
    else
        print_info "服务未运行"
    fi

    # 显示访问信息
    if [ -f "demo-config.json" ]; then
        echo ""
        print_info "访问信息:"
        local domain=$(grep '"domain"' demo-config.json | sed 's/.*: *"\([^"]*\)".*/\1/' 2>/dev/null)
        local port=$(grep '"port"' demo-config.json | sed 's/.*: *\([0-9]*\).*/\1/' 2>/dev/null)

        [ -n "$domain" ] && echo "  域名访问: https://$domain/"
        [ -n "$port" ] && echo "  带端口访问: https://$domain:$port/"
    fi

    # 显示日志
    if [ "$show_logs" = true ]; then
        echo ""
        print_info "最近日志:"
        manage_logs view all 10
    fi
}

# 处理特殊命令
case "${1:-}" in
    "stop")
        stop_service
        exit $?
        ;;
    "restart")
        restart_service "${@:2}"
        exit $?
        ;;
    "status")
        show_status "${@:2}"
        exit $?
        ;;
    "helper")
        service_helper
        exit $?
        ;;
    "manage-logs")
        manage_logs "${@:2}"
        exit $?
        ;;
esac

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
EOF

    # 添加集成功能到启动脚本
    create_log_management_functions
    create_service_helper_functions

    chmod +x "$INSTALL_DIR/start-server.sh"
    print_success "集成启动脚本已创建: start-server.sh"

    # 创建停止服务脚本
    cat > "$INSTALL_DIR/stop-server.sh" << 'EOF'
#!/bin/bash
# 环境管理系统停止脚本

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 配置文件
PID_FILE="$SCRIPT_DIR/logs/server.pid"
ACCESS_LOG="$SCRIPT_DIR/logs/access.log"

# 工具函数
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${CYAN}ℹ️  $1${NC}"; }

# 显示帮助信息
show_help() {
    echo -e "${BLUE}环境管理系统停止脚本${NC}"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -f, --force      强制停止服务"
    echo "  -h, --help       显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0               正常停止服务"
    echo "  $0 -f            强制停止服务"
    echo ""
}

# 检查服务是否运行
check_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            echo "$pid"
            return 0
        else
            # PID 文件存在但进程不存在，清理 PID 文件
            rm -f "$PID_FILE"
            return 1
        fi
    fi
    return 1
}

# 停止服务
stop_service() {
    local force_mode="$1"

    print_info "正在停止环境管理系统服务..."

    local pid
    if pid=$(check_running); then
        print_info "找到运行中的服务 (PID: $pid)"

        if [ "$force_mode" = "true" ]; then
            # 强制停止
            print_warning "强制停止服务..."
            kill -9 "$pid" 2>/dev/null
        else
            # 正常停止
            print_info "正常停止服务..."
            kill -TERM "$pid" 2>/dev/null

            # 等待进程结束
            local count=0
            while kill -0 "$pid" 2>/dev/null && [ $count -lt 10 ]; do
                sleep 1
                count=$((count + 1))
                echo -n "."
            done
            echo ""

            # 如果进程仍在运行，强制停止
            if kill -0 "$pid" 2>/dev/null; then
                print_warning "正常停止超时，强制停止服务..."
                kill -9 "$pid" 2>/dev/null
            fi
        fi

        # 等待一下确保进程完全停止
        sleep 1

        # 验证进程是否已停止
        if ! kill -0 "$pid" 2>/dev/null; then
            rm -f "$PID_FILE"
            print_success "服务已成功停止"

            # 记录停止信息到日志
            if [ -d "$(dirname "$ACCESS_LOG")" ]; then
                echo "$(date '+%Y-%m-%d %H:%M:%S') - 服务停止 (PID: $pid)" >> "$ACCESS_LOG"
            fi
        else
            print_error "服务停止失败，进程仍在运行"
            exit 1
        fi
    else
        print_warning "服务未运行"
        exit 1
    fi
}

# 清理相关进程
cleanup_processes() {
    print_info "清理相关进程..."

    # 查找并停止所有相关的 serve 进程
    local serve_pids=$(pgrep -f "serve.*-p.*--cors" 2>/dev/null || true)

    if [ -n "$serve_pids" ]; then
        print_info "发现相关进程: $serve_pids"
        for pid in $serve_pids; do
            if kill -0 "$pid" 2>/dev/null; then
                print_info "停止进程: $pid"
                kill -TERM "$pid" 2>/dev/null || true
                sleep 1
                if kill -0 "$pid" 2>/dev/null; then
                    kill -9 "$pid" 2>/dev/null || true
                fi
            fi
        done
        print_success "相关进程已清理"
    else
        print_info "未发现相关进程"
    fi
}

# 主函数
main() {
    local force_mode=false

    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -f|--force)
                force_mode=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                print_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # 停止服务
    stop_service "$force_mode"

    # 如果是强制模式，清理相关进程
    if [ "$force_mode" = "true" ]; then
        cleanup_processes
    fi

    print_success "停止操作完成"
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
EOF

    chmod +x "$INSTALL_DIR/stop-server.sh"
    print_success "停止脚本已创建: stop-server.sh"

    # 创建状态检查脚本
    cat > "$INSTALL_DIR/status-server.sh" << 'EOF'
#!/bin/bash
# 环境管理系统状态检查脚本

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# 配置文件
PID_FILE="$SCRIPT_DIR/logs/server.pid"
LOG_DIR="$SCRIPT_DIR/logs"
ACCESS_LOG="$LOG_DIR/access.log"
ERROR_LOG="$LOG_DIR/error.log"
SERVER_LOG="$LOG_DIR/server.log"

# 工具函数
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${CYAN}ℹ️  $1${NC}"; }

# 显示帮助信息
show_help() {
    echo -e "${BLUE}环境管理系统状态检查脚本${NC}"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -v, --verbose    显示详细信息"
    echo "  -l, --logs       显示最近的日志"
    echo "  -h, --help       显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0               显示基本状态"
    echo "  $0 -v            显示详细状态"
    echo "  $0 -l            显示状态和日志"
    echo ""
}

# 读取配置
load_config() {
    if [ -f "demo-config.json" ]; then
        PORT=$(grep '"port"' demo-config.json | sed 's/.*: *\([0-9]*\).*/\1/')
        DOMAIN=$(grep '"domain"' demo-config.json | sed 's/.*: *"\([^"]*\)".*/\1/')
    else
        PORT=3000
        DOMAIN="localhost"
    fi
}

# 检查服务状态
check_service_status() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            echo "running:$pid"
            return 0
        else
            echo "stopped:stale_pid"
            return 1
        fi
    else
        echo "stopped:no_pid"
        return 1
    fi
}

# 检查端口状态
check_port_status() {
    local port="$1"

    # 使用 netstat 检查端口
    if command -v netstat >/dev/null 2>&1; then
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            return 0
        fi
    fi

    # 使用 sockstat 检查端口 (FreeBSD)
    if command -v sockstat >/dev/null 2>&1; then
        if sockstat -l | grep -q ":$port "; then
            return 0
        fi
    fi

    return 1
}

# 检查网络连接
check_network_connectivity() {
    local port="$1"

    # 尝试连接本地端口
    if command -v nc >/dev/null 2>&1; then
        if nc -z localhost "$port" 2>/dev/null; then
            return 0
        fi
    fi

    # 尝试使用 curl 检查
    if command -v curl >/dev/null 2>&1; then
        if curl -s --connect-timeout 3 "http://localhost:$port" >/dev/null 2>&1; then
            return 0
        fi
    fi

    return 1
}

# 获取进程信息
get_process_info() {
    local pid="$1"

    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        # 获取进程启动时间
        if command -v ps >/dev/null 2>&1; then
            local start_time=$(ps -o lstart= -p "$pid" 2>/dev/null | sed 's/^ *//')
            local cpu_usage=$(ps -o %cpu= -p "$pid" 2>/dev/null | sed 's/^ *//')
            local mem_usage=$(ps -o %mem= -p "$pid" 2>/dev/null | sed 's/^ *//')

            echo "start_time:$start_time"
            echo "cpu_usage:$cpu_usage%"
            echo "mem_usage:$mem_usage%"
        fi
    fi
}

# 获取日志统计
get_log_stats() {
    local stats=""

    if [ -f "$ACCESS_LOG" ]; then
        local access_lines=$(wc -l < "$ACCESS_LOG" 2>/dev/null || echo "0")
        stats="${stats}access_logs:$access_lines "
    fi

    if [ -f "$ERROR_LOG" ]; then
        local error_lines=$(wc -l < "$ERROR_LOG" 2>/dev/null || echo "0")
        stats="${stats}error_logs:$error_lines "
    fi

    if [ -f "$SERVER_LOG" ]; then
        local server_lines=$(wc -l < "$SERVER_LOG" 2>/dev/null || echo "0")
        stats="${stats}server_logs:$server_lines"
    fi

    echo "$stats"
}

# 显示基本状态
show_basic_status() {
    echo -e "${BOLD}${BLUE}🔍 环境管理系统状态${NC}"
    echo ""

    load_config

    local status_info=$(check_service_status)
    local status=$(echo "$status_info" | cut -d: -f1)
    local pid_info=$(echo "$status_info" | cut -d: -f2)

    echo -e "📊 ${BOLD}服务状态${NC}"
    if [ "$status" = "running" ]; then
        print_success "服务正在运行 (PID: $pid_info)"
        echo -e "🌐 访问地址: ${GREEN}https://$DOMAIN:$PORT${NC}"

        # 检查端口状态
        if check_port_status "$PORT"; then
            print_success "端口 $PORT 正在监听"
        else
            print_warning "端口 $PORT 未在监听"
        fi

        # 检查网络连接
        if check_network_connectivity "$PORT"; then
            print_success "网络连接正常"
        else
            print_warning "网络连接异常"
        fi

    elif [ "$status" = "stopped" ]; then
        if [ "$pid_info" = "stale_pid" ]; then
            print_warning "服务已停止 (存在过期的PID文件)"
        else
            print_warning "服务未运行"
        fi
        echo -e "🚀 启动服务: ${YELLOW}./start-server.sh${NC}"
    fi

    echo ""
}

# 显示详细状态
show_detailed_status() {
    show_basic_status

    local status_info=$(check_service_status)
    local status=$(echo "$status_info" | cut -d: -f1)
    local pid_info=$(echo "$status_info" | cut -d: -f2)

    if [ "$status" = "running" ]; then
        echo -e "📈 ${BOLD}进程信息${NC}"
        local process_info=$(get_process_info "$pid_info")

        if [ -n "$process_info" ]; then
            echo "$process_info" | while IFS=: read -r key value; do
                case $key in
                    start_time)
                        echo -e "⏰ 启动时间: ${CYAN}$value${NC}"
                        ;;
                    cpu_usage)
                        echo -e "💻 CPU 使用率: ${YELLOW}$value${NC}"
                        ;;
                    mem_usage)
                        echo -e "🧠 内存使用率: ${YELLOW}$value${NC}"
                        ;;
                esac
            done
        fi
        echo ""
    fi

    # 显示日志统计
    echo -e "📋 ${BOLD}日志统计${NC}"
    local log_stats=$(get_log_stats)
    if [ -n "$log_stats" ]; then
        echo "$log_stats" | tr ' ' '\n' | while IFS=: read -r key value; do
            case $key in
                access_logs)
                    echo -e "📝 访问日志: ${CYAN}$value 行${NC}"
                    ;;
                error_logs)
                    echo -e "❌ 错误日志: ${YELLOW}$value 行${NC}"
                    ;;
                server_logs)
                    echo -e "🖥️  服务日志: ${CYAN}$value 行${NC}"
                    ;;
            esac
        done
    else
        print_info "暂无日志文件"
    fi
    echo ""

    # 显示文件状态
    echo -e "📁 ${BOLD}文件状态${NC}"
    if [ -d "$LOG_DIR" ]; then
        print_success "日志目录存在: $LOG_DIR"
    else
        print_warning "日志目录不存在: $LOG_DIR"
    fi

    if [ -f "$PID_FILE" ]; then
        print_info "PID 文件: $PID_FILE"
    else
        print_info "PID 文件不存在"
    fi
    echo ""
}

# 显示最近日志
show_recent_logs() {
    echo -e "📋 ${BOLD}最近日志 (最后 10 行)${NC}"
    echo ""

    if [ -f "$SERVER_LOG" ]; then
        echo -e "${CYAN}🖥️  服务日志:${NC}"
        tail -10 "$SERVER_LOG" 2>/dev/null || echo "无法读取服务日志"
        echo ""
    fi

    if [ -f "$ERROR_LOG" ]; then
        echo -e "${YELLOW}❌ 错误日志:${NC}"
        tail -10 "$ERROR_LOG" 2>/dev/null || echo "无法读取错误日志"
        echo ""
    fi

    if [ -f "$ACCESS_LOG" ]; then
        echo -e "${GREEN}📝 访问日志:${NC}"
        tail -10 "$ACCESS_LOG" 2>/dev/null || echo "无法读取访问日志"
        echo ""
    fi

    if [ ! -f "$SERVER_LOG" ] && [ ! -f "$ERROR_LOG" ] && [ ! -f "$ACCESS_LOG" ]; then
        print_info "暂无日志文件"
    fi
}

# 主函数
main() {
    local verbose=false
    local show_logs=false

    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -v|--verbose)
                verbose=true
                shift
                ;;
            -l|--logs)
                show_logs=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                print_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # 显示状态信息
    if [ "$verbose" = true ]; then
        show_detailed_status
    else
        show_basic_status
    fi

    # 显示日志
    if [ "$show_logs" = true ]; then
        show_recent_logs
    fi
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
EOF

    chmod +x "$INSTALL_DIR/status-server.sh"
    print_success "状态检查脚本已创建: status-server.sh"

    # 创建重启服务脚本
    cat > "$INSTALL_DIR/restart-server.sh" << 'EOF'
#!/bin/bash
# 环境管理系统重启脚本

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# 工具函数
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${CYAN}ℹ️  $1${NC}"; }

# 显示帮助信息
show_help() {
    echo -e "${BLUE}环境管理系统重启脚本${NC}"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -f, --force      强制重启（强制停止后启动）"
    echo "  -d, --daemon     重启为后台服务"
    echo "  -v, --verbose    显示详细信息"
    echo "  -h, --help       显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0               正常重启（前台模式）"
    echo "  $0 -d            重启为后台服务"
    echo "  $0 -f            强制重启"
    echo "  $0 -d -f         强制重启为后台服务"
    echo ""
}

# 检查脚本是否存在
check_scripts() {
    local missing_scripts=()

    if [ ! -f "./start-server.sh" ]; then
        missing_scripts+=("start-server.sh")
    fi

    if [ ! -f "./stop-server.sh" ]; then
        missing_scripts+=("stop-server.sh")
    fi

    if [ ${#missing_scripts[@]} -gt 0 ]; then
        print_error "缺少必要的脚本文件: ${missing_scripts[*]}"
        print_info "请确保在正确的目录中运行此脚本"
        exit 1
    fi
}

# 重启服务
restart_service() {
    local force_mode="$1"
    local daemon_mode="$2"
    local verbose="$3"

    echo -e "${BOLD}${BLUE}🔄 正在重启环境管理系统...${NC}"
    echo ""

    # 检查当前状态
    print_info "检查当前服务状态..."
    if [ "$verbose" = true ]; then
        ./status-server.sh -v
    else
        ./status-server.sh
    fi
    echo ""

    # 停止服务
    print_info "停止当前服务..."
    if [ -f "./stop-server.sh" ]; then
        if [ "$force_mode" = true ]; then
            ./stop-server.sh --force
        else
            ./stop-server.sh
        fi

        if [ $? -eq 0 ]; then
            print_success "服务停止成功"
        else
            print_warning "服务停止时出现警告（可能服务未运行）"
        fi
    else
        print_error "找不到停止脚本"
        exit 1
    fi

    echo ""

    # 等待一下确保完全停止
    print_info "等待服务完全停止..."
    sleep 2

    # 启动服务
    print_info "启动服务..."
    if [ -f "./start-server.sh" ]; then
        local start_args=""

        if [ "$daemon_mode" = true ]; then
            start_args="$start_args --daemon"
        fi

        if [ "$verbose" = true ]; then
            start_args="$start_args --verbose"
        fi

        if [ "$daemon_mode" = true ]; then
            ./start-server.sh $start_args
            if [ $? -eq 0 ]; then
                print_success "后台服务重启成功"
                echo ""
                print_info "使用以下命令管理服务:"
                echo -e "  查看状态: ${YELLOW}./status-server.sh${NC}"
                echo -e "  停止服务: ${YELLOW}./stop-server.sh${NC}"
                echo -e "  查看日志: ${YELLOW}tail -f logs/server.log${NC}"
            else
                print_error "服务启动失败"
                exit 1
            fi
        else
            print_success "正在启动前台服务..."
            print_info "服务将在前台运行，按 Ctrl+C 停止"
            echo ""
            exec ./start-server.sh $start_args
        fi
    else
        print_error "找不到启动脚本"
        exit 1
    fi
}

# 主函数
main() {
    local force_mode=false
    local daemon_mode=false
    local verbose=false

    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -f|--force)
                force_mode=true
                shift
                ;;
            -d|--daemon)
                daemon_mode=true
                shift
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                print_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # 检查必要的脚本
    check_scripts

    # 重启服务
    restart_service "$force_mode" "$daemon_mode" "$verbose"
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
EOF

    chmod +x "$INSTALL_DIR/restart-server.sh"
    print_success "重启脚本已创建: restart-server.sh"

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

# 创建优化的 .htaccess 配置
create_optimized_htaccess() {
    local target_dir="$1"
    local config_type="$2"  # "root" 或 "dist"

    print_info "为 $target_dir 创建 .htaccess 配置..."

    cat > "$target_dir/.htaccess" << EOF
# Serv00 环境管理系统 - Apache 配置文件
# 自动生成的优化配置

<IfModule mod_rewrite.c>
    RewriteEngine On

    # API requests to api/index.php
    RewriteRule ^api/(.*)$ api/index.php [L]

    # Frontend (single page application)
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.html [L]
</IfModule>

# JavaScript 文件 MIME 类型
<FilesMatch "\.(js|mjs)$">
    ForceType application/javascript
    AddType application/javascript .js .mjs
    <IfModule mod_headers.c>
        Header set Content-Type "application/javascript; charset=utf-8"
    </IfModule>
</FilesMatch>

# CSS 文件 MIME 类型
<FilesMatch "\.css$">
    ForceType text/css
    AddType text/css .css
    <IfModule mod_headers.c>
        Header set Content-Type "text/css; charset=utf-8"
    </IfModule>
</FilesMatch>

# SVG 文件 MIME 类型
<FilesMatch "\.svg$">
    ForceType image/svg+xml
    AddType image/svg+xml .svg
    <IfModule mod_headers.c>
        Header set Content-Type "image/svg+xml"
    </IfModule>
</FilesMatch>

# JSON 文件 MIME 类型
<FilesMatch "\.json$">
    ForceType application/json
    AddType application/json .json
    <IfModule mod_headers.c>
        Header set Content-Type "application/json; charset=utf-8"
    </IfModule>
</FilesMatch>

# 启用压缩（如果模块可用）
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
    AddOutputFilterByType DEFLATE application/json
</IfModule>

# 缓存控制（如果模块可用）
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 month"
    ExpiresByType application/json "access plus 1 day"
    ExpiresByType text/html "access plus 1 hour"
</IfModule>

# 安全头部（如果模块可用）
<IfModule mod_headers.c>
    # 防止 MIME 类型嗅探
    Header always set X-Content-Type-Options nosniff

    # XSS 保护
    Header always set X-XSS-Protection "1; mode=block"

    # 防止点击劫持
    Header always set X-Frame-Options SAMEORIGIN

    # 引用策略
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# 错误页面
ErrorDocument 404 /index.html
ErrorDocument 403 /index.html
EOF
}

setup_mime_types() {
    local step_num="11"
    if [ "$INSTALL_MODE" = "fresh" ]; then
        step_num="10"
    fi

    print_step "$step_num" "配置 Apache 和 MIME 类型"

    # 检查前端文件位置并创建相应的 .htaccess
    if [ -f "$INSTALL_DIR/index.html" ]; then
        # 前端文件在根目录，创建根目录 .htaccess
        create_optimized_htaccess "$INSTALL_DIR" "root"
        print_success "已为根目录创建 .htaccess 配置"
    elif [ -f "$INSTALL_DIR/dist/index.html" ]; then
        # 前端文件在 dist 目录，创建 dist 目录 .htaccess
        create_optimized_htaccess "$INSTALL_DIR/dist" "dist"
        print_success "已为 dist 目录创建 .htaccess 配置"

        # 同时创建根目录重定向配置
        cat > "$INSTALL_DIR/.htaccess" << 'EOF'
<IfModule mod_rewrite.c>
RewriteEngine On

# API requests to api/index.php
RewriteRule ^api/(.*)$ api/index.php [L]

# Redirect all other requests to dist directory
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/dist/
RewriteCond %{REQUEST_URI} !^/api/
RewriteRule ^(.*)$ dist/$1 [L]

# Handle dist directory requests
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} ^/dist/
RewriteRule ^dist/(.*)$ dist/index.html [L]

</IfModule>
EOF
        print_success "已为根目录创建重定向到 dist 的配置"
    else
        print_warning "未找到前端文件，跳过 .htaccess 配置"
    fi

    print_success "Apache 和 MIME 类型配置完成"
    print_info "注意: 如果 Apache 不可用，将使用 npx serve 提供正确的 MIME 类型"
}

# 检测域名访问问题
detect_domain_access_issues() {
    print_info "检测域名访问配置..."

    local has_issues=false
    local issue_count=0
    local issue_details=""

    # 检查是否在根目录有前端文件
    if [ ! -f "$INSTALL_DIR/index.html" ]; then
        if [ -f "$INSTALL_DIR/dist/index.html" ]; then
            has_issues=true
            issue_count=$((issue_count + 1))
            issue_details="• 前端文件在 dist 目录中，域名访问无法找到入口文件"
        else
            has_issues=true
            issue_count=$((issue_count + 1))
            issue_details="• 未找到前端入口文件 index.html"
        fi
    fi

    # 检查静态资源位置
    if [ ! -d "$INSTALL_DIR/assets" ] && [ -d "$INSTALL_DIR/dist/assets" ]; then
        has_issues=true
        issue_count=$((issue_count + 1))
        if [ -n "$issue_details" ]; then
            issue_details="${issue_details}\n• 静态资源在 dist 目录中，可能导致 404 错误"
        else
            issue_details="• 静态资源在 dist 目录中，可能导致 404 错误"
        fi
    fi

    # 检查 .htaccess 配置
    if [ ! -f "$INSTALL_DIR/.htaccess" ]; then
        has_issues=true
        issue_count=$((issue_count + 1))
        if [ -n "$issue_details" ]; then
            issue_details="${issue_details}\n• 缺少 .htaccess 配置文件"
        else
            issue_details="• 缺少 .htaccess 配置文件"
        fi
    fi

    if [ "$has_issues" = true ]; then
        echo -e "${YELLOW}⚠️  检测到 $issue_count 个域名访问问题：${NC}"
        echo -e "${issue_details}"
        return 1
    else
        print_success "域名访问配置正确"
        return 0
    fi
}

# 自动修复域名访问问题
fix_domain_access_issues() {
    print_info "自动修复域名访问问题..."

    local fixed_issues=0

    # 检查是否需要移动 dist 内容
    if [ -d "$INSTALL_DIR/dist" ] && [ -f "$INSTALL_DIR/dist/index.html" ] && [ ! -f "$INSTALL_DIR/index.html" ]; then
        print_info "移动 dist 内容到根目录..."

        # 创建备份
        if [ -f "$INSTALL_DIR/index.html" ] || [ -d "$INSTALL_DIR/assets" ]; then
            local backup_dir="$INSTALL_DIR/backup_$(date +%Y%m%d_%H%M%S)"
            mkdir -p "$backup_dir"
            [ -f "$INSTALL_DIR/index.html" ] && mv "$INSTALL_DIR/index.html" "$backup_dir/"
            [ -d "$INSTALL_DIR/assets" ] && mv "$INSTALL_DIR/assets" "$backup_dir/"
            print_info "已备份现有文件到: $backup_dir"
        fi

        # 移动 dist 内容到根目录
        cd "$INSTALL_DIR/dist"
        find . -mindepth 1 -maxdepth 1 -exec mv {} ../ \; 2>/dev/null || {
            # 如果 find 不支持 -exec，使用传统方法
            for item in * .*; do
                [ "$item" = "." ] || [ "$item" = ".." ] && continue
                [ -e "$item" ] && mv "$item" ../
            done
        }
        cd "$INSTALL_DIR"

        # 删除空的 dist 目录
        if [ -d "dist" ] && [ -z "$(ls -A dist 2>/dev/null)" ]; then
            rmdir dist
            print_success "已删除空的 dist 目录"
        fi

        print_success "已移动 dist 内容到根目录"
        fixed_issues=$((fixed_issues + 1))

        # 更新启动脚本中的路径
        if [ -f "start-server.sh" ]; then
            sed -i.tmp 's|cd dist|# cd dist  # 已移动到根目录|g' start-server.sh
            sed -i.tmp 's|if \[ ! -d "dist" \]|if [ ! -f "index.html" ]|g' start-server.sh
            sed -i.tmp 's|dist 目录不存在|前端文件不存在|g' start-server.sh
            rm -f start-server.sh.tmp
            print_success "已更新启动脚本路径"
        fi
    fi

    # 检查并创建 .htaccess 配置
    if [ ! -f "$INSTALL_DIR/.htaccess" ]; then
        print_info "创建 .htaccess 配置..."
        create_optimized_htaccess "$INSTALL_DIR" "root"
        print_success "已创建 .htaccess 配置"
        fixed_issues=$((fixed_issues + 1))
    fi

    # 验证前端文件位置
    if [ -f "$INSTALL_DIR/index.html" ]; then
        print_success "前端文件位置正确"
        fixed_issues=$((fixed_issues + 1))
    elif [ -f "$INSTALL_DIR/dist/index.html" ]; then
        print_warning "前端文件仍在 dist 目录中"
    else
        print_error "未找到前端文件"
        return 1
    fi

    if [ "$fixed_issues" -gt 0 ]; then
        print_success "域名访问问题修复完成 (修复了 $fixed_issues 个问题)"
        return 0
    else
        print_success "域名访问配置已正确，无需修复"
        return 0
    fi
}

# 配置目录结构（集成版本）
configure_directory_structure() {
    local step_num="12"
    if [ "$INSTALL_MODE" = "fresh" ]; then
        step_num="11"
    fi

    print_step "$step_num" "配置域名访问"

    # 自动检测域名访问问题
    if detect_domain_access_issues; then
        print_success "域名访问配置正确，无需修改"
        return 0
    fi

    echo -e "\n${BOLD}${YELLOW}⚠️  检测到域名访问问题${NC}\n"

    echo -e "${CYAN}为确保域名访问正常，请选择解决方案：${NC}"
    echo -e "  ${GREEN}1.${NC} 自动修复 - 移动 dist 内容到根目录 (推荐)"
    echo -e "  ${GREEN}2.${NC} 手动配置 - 保持 dist 目录结构"
    echo -e "  ${GREEN}3.${NC} 跳过配置 - 稍后手动处理"
    echo ""

    read -p "请选择 [1-3]: " structure_choice

    case $structure_choice in
        1)
            fix_domain_access_issues
            ;;
        2)
            print_info "配置 .htaccess 重写规则..."

            # 创建根目录 .htaccess 重写规则
            cat > "$INSTALL_DIR/.htaccess" << 'EOF'
<IfModule mod_rewrite.c>
RewriteEngine On

# API requests to api/index.php
RewriteRule ^api/(.*)$ api/index.php [L]

# Redirect all other requests to dist directory
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/dist/
RewriteCond %{REQUEST_URI} !^/api/
RewriteRule ^(.*)$ dist/$1 [L]

# Handle dist directory requests
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} ^/dist/
RewriteRule ^dist/(.*)$ dist/index.html [L]

</IfModule>
EOF
            print_success "已配置 .htaccess 重写规则"
            print_info "域名访问将自动重定向到 dist 目录"
            ;;
        3)
            print_warning "跳过域名访问配置"
            print_info "如需稍后配置，请确保域名访问能正确找到前端文件"
            ;;
        *)
            print_warning "无效选择，使用自动修复方案"
            fix_domain_access_issues
            ;;
    esac
}

# 验证部署结果
verify_deployment() {
    print_info "验证部署结果..."

    local issues_found=false

    # 检查前端文件
    if [ -f "$INSTALL_DIR/index.html" ]; then
        print_success "前端入口文件: index.html ✓"
    elif [ -f "$INSTALL_DIR/dist/index.html" ]; then
        print_warning "前端文件在 dist 目录中"
        if [ -f "$INSTALL_DIR/.htaccess" ] && grep -q "dist" "$INSTALL_DIR/.htaccess"; then
            print_success "已配置重定向到 dist 目录 ✓"
        else
            print_error "缺少重定向配置"
            issues_found=true
        fi
    else
        print_error "未找到前端入口文件"
        issues_found=true
    fi

    # 检查静态资源
    if [ -d "$INSTALL_DIR/assets" ]; then
        print_success "静态资源目录: assets ✓"
    elif [ -d "$INSTALL_DIR/dist/assets" ]; then
        print_info "静态资源在 dist/assets 目录"
    else
        print_warning "未找到 assets 目录"
    fi

    # 检查 API 目录
    if [ -d "$INSTALL_DIR/api" ]; then
        print_success "API 目录: api ✓"
    else
        print_warning "未找到 api 目录"
    fi

    # 检查 .htaccess 配置
    if [ -f "$INSTALL_DIR/.htaccess" ]; then
        print_success "Apache 配置: .htaccess ✓"
    else
        print_warning "未找到 .htaccess 配置文件"
    fi

    # 检查启动脚本
    if [ -f "$INSTALL_DIR/start-server.sh" ] && [ -x "$INSTALL_DIR/start-server.sh" ]; then
        print_success "启动脚本: start-server.sh ✓"
    else
        print_warning "启动脚本不存在或不可执行"
    fi

    if [ "$issues_found" = true ]; then
        print_warning "发现一些问题，但不影响基本功能"
    else
        print_success "部署验证通过！"
    fi
}

show_completion_info() {
    local step_num="14"
    if [ "$INSTALL_MODE" = "fresh" ]; then
        step_num="13"
    fi

    print_step "$step_num" "安装完成"

    # 验证部署
    verify_deployment

    echo -e "\n${BOLD}${GREEN}🎉 恭喜！环境管理系统安装/更新完成！${NC}\n"

    echo -e "${BOLD}${CYAN}--- 访问信息 ---${NC}"
    echo -e "🌐 访问域名: ${GREEN}https://$CUSTOM_DOMAIN${NC}"
    echo -e "🔗 API 地址: ${GREEN}https://$CUSTOM_DOMAIN/api${NC}"
    echo -e "🚪 服务端口: ${GREEN}$CUSTOM_PORT${NC}"
    echo -e "📁 安装目录: ${GREEN}$INSTALL_DIR${NC}"
    echo -e "🚀 安装模式: ${GREEN}$INSTALL_MODE${NC}"

    echo -e "\n${BOLD}${CYAN}--- 启动服务 ---${NC}"
    echo -e "1. 进入目录: ${YELLOW}cd $INSTALL_DIR${NC}"
    echo -e "2. 前台运行: ${YELLOW}./start-server.sh${NC}"
    echo -e "3. 后台运行: ${YELLOW}./start-server.sh -d${NC}"

    echo -e "\n${BOLD}${CYAN}--- 访问地址 ---${NC}"
    if [ -f "$INSTALL_DIR/index.html" ]; then
        echo -e "🌐 域名访问: ${GREEN}https://$CUSTOM_DOMAIN/${NC} (推荐)"
        echo -e "🔗 带端口访问: ${YELLOW}https://$CUSTOM_DOMAIN:$CUSTOM_PORT${NC}"
    elif [ -f "$INSTALL_DIR/dist/index.html" ]; then
        echo -e "🌐 域名访问: ${GREEN}https://$CUSTOM_DOMAIN/${NC} (自动重定向到 dist)"
        echo -e "🔗 带端口访问: ${YELLOW}https://$CUSTOM_DOMAIN:$CUSTOM_PORT${NC}"
    else
        echo -e "🔗 访问地址: ${YELLOW}https://$CUSTOM_DOMAIN:$CUSTOM_PORT${NC}"
    fi

    echo -e "\n${BOLD}${CYAN}--- 服务管理 ---${NC}"
    echo -e "查看状态: ${YELLOW}./status-server.sh${NC}"
    echo -e "停止服务: ${YELLOW}./stop-server.sh${NC}"
    echo -e "重启服务: ${YELLOW}./restart-server.sh${NC}"
    echo -e "后台重启: ${YELLOW}./restart-server.sh -d${NC}"

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

    echo -e "\n${BOLD}${CYAN}--- 日志管理 ---${NC}"
    echo -e "服务日志: ${YELLOW}tail -f logs/server.log${NC}"
    echo -e "错误日志: ${YELLOW}tail -f logs/error.log${NC}"
    echo -e "访问日志: ${YELLOW}tail -f logs/access.log${NC}"
    echo -e "详细状态: ${YELLOW}./status-server.sh -v -l${NC}"

    echo -e "\n${BOLD}${CYAN}--- 故障排除 ---${NC}"
    echo -e "🔧 重新构建: ${YELLOW}npm run build${NC}"
    echo -e "🌐 域名访问问题: 检查前端文件是否在根目录"
    echo -e "📁 目录结构: ${YELLOW}ls -la index.html assets/ api/${NC}"
    echo -e "⚙️  Apache 配置: ${YELLOW}cat .htaccess${NC}"
    echo -e "🗄️  重置数据库: ${YELLOW}./init-database.sh${NC}"
    echo -e "🔄 强制重启: ${YELLOW}./restart-server.sh -f${NC}"
    echo -e "🛑 强制停止: ${YELLOW}./stop-server.sh -f${NC}"

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
    configure_directory_structure
    show_completion_info
}

# --- 错误处理 ---
trap 'echo -e "\n${RED}❌ 安装过程中发生错误，请检查上述输出信息${NC}"; exit 1' ERR

# --- 脚本入口 ---
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
