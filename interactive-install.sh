#!/bin/bash

# Serv00 环境管理系统交互式安装脚本
# 支持 FreeBSD 环境、自定义域名和完整配置管理

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# 脚本信息
SCRIPT_VERSION="3.0.0"
GITHUB_REPO="https://github.com/kookhr/demoguanli.git"
BRANCH="serv00"

# 配置变量
CUSTOM_DOMAIN=""
DB_HOST=""
DB_NAME=""
DB_USER=""
DB_PASSWORD=""
CUSTOM_PORT=""
API_PATH="/api"
INSTALL_DIR=""
CONFIG_FILE=""

# 更新模式变量
IS_UPDATE_MODE=false
EXISTING_CONFIG_FILE=""
BACKUP_CONFIG_FILE=""
PRESERVED_CONFIG=""

# 默认值
DEFAULT_DOMAIN="do.kandy.dpdns.org"
DEFAULT_DB_HOST="mysql14.serv00.com"
DEFAULT_DB_NAME="m9785_environment_manager"
DEFAULT_API_PATH="/api"
DEFAULT_PORT="3000"

echo -e "${BOLD}${BLUE}🚀 Serv00 环境管理系统交互式安装脚本 v${SCRIPT_VERSION}${NC}"
echo -e "${CYAN}📋 支持自定义域名、数据库配置和 Serv00 优化${NC}"
echo -e "${YELLOW}💡 本脚本将引导您完成完整的系统配置${NC}"
echo ""

# 工具函数
print_step() {
    echo -e "${BOLD}${BLUE}📋 步骤 $1: $2${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# 读取用户输入的函数
read_input() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    local is_password="$4"
    local input=""

    if [ "$is_password" = "true" ]; then
        echo -n -e "${CYAN}$prompt${NC}"
        if [ -n "$default" ]; then
            echo -n -e " ${YELLOW}[默认: ****]${NC}"
        fi
        echo -n ": "
        read -s input
        echo ""
    else
        echo -n -e "${CYAN}$prompt${NC}"
        if [ -n "$default" ]; then
            echo -n -e " ${YELLOW}[默认: $default]${NC}"
        fi
        echo -n ": "
        read input
    fi

    # 如果输入为空且有默认值，使用默认值
    if [ -z "$input" ] && [ -n "$default" ]; then
        input="$default"
    fi

    # 根据变量名设置对应的全局变量
    case "$var_name" in
        "USER_INPUT")
            USER_INPUT="$input"
            ;;
        "CUSTOM_DOMAIN")
            CUSTOM_DOMAIN="$input"
            ;;
        "DB_HOST")
            DB_HOST="$input"
            ;;
        "DB_NAME")
            DB_NAME="$input"
            ;;
        "DB_USER")
            DB_USER="$input"
            ;;
        "DB_PASSWORD")
            DB_PASSWORD="$input"
            ;;
        "CUSTOM_PORT")
            CUSTOM_PORT="$input"
            ;;
        "API_PATH")
            API_PATH="$input"
            ;;
        *)
            # 默认情况，设置 USER_INPUT
            USER_INPUT="$input"
            ;;
    esac
}

# 验证域名格式
validate_domain() {
    local domain="$1"
    if [[ $domain =~ ^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$ ]]; then
        return 0
    else
        return 1
    fi
}

# 验证端口号
validate_port() {
    local port="$1"
    if [[ $port =~ ^[0-9]+$ ]] && [ $port -ge 1024 ] && [ $port -le 65535 ]; then
        return 0
    else
        return 1
    fi
}

# 测试数据库连接
test_database_connection() {
    local host="$1"
    local user="$2"
    local password="$3"
    local database="$4"
    
    print_info "测试数据库连接..."
    
    if command -v mysql >/dev/null 2>&1; then
        if mysql -h "$host" -u "$user" -p"$password" -e "USE $database; SELECT 1;" >/dev/null 2>&1; then
            return 0
        else
            return 1
        fi
    else
        print_warning "MySQL 客户端未安装，跳过连接测试"
        return 0
    fi
}

# 检测安装类型（首次安装 vs 更新）
detect_installation_type() {
    print_step "1" "检测安装类型"

    # 检查是否存在现有安装
    local potential_domains=(
        "do.kandy.dpdns.org"
        "$(whoami).serv00.net"
    )

    for domain in "${potential_domains[@]}"; do
        local install_path="$HOME/domains/$domain/public_html"
        local config_path="$install_path/api/.env"

        if [ -d "$install_path" ] && [ -f "$config_path" ]; then
            IS_UPDATE_MODE=true
            CUSTOM_DOMAIN="$domain"
            INSTALL_DIR="$install_path"
            EXISTING_CONFIG_FILE="$config_path"

            print_info "检测到现有安装: $domain"
            print_info "安装目录: $install_path"
            break
        fi
    done

    if [ "$IS_UPDATE_MODE" = true ]; then
        echo -e "${BOLD}${GREEN}🔄 更新模式${NC}"
        echo -e "${CYAN}将更新现有系统并保留所有配置和数据${NC}"

        # 读取现有配置
        read_existing_config

    else
        echo -e "${BOLD}${GREEN}🆕 首次安装模式${NC}"
        echo -e "${CYAN}将进行全新安装${NC}"
    fi

    echo ""
}

# 读取现有配置
read_existing_config() {
    print_info "读取现有配置..."

    if [ -f "$EXISTING_CONFIG_FILE" ]; then
        # 创建配置备份
        BACKUP_CONFIG_FILE="/tmp/env_backup_$(date +%Y%m%d_%H%M%S)"
        cp "$EXISTING_CONFIG_FILE" "$BACKUP_CONFIG_FILE"
        print_info "配置已备份到: $BACKUP_CONFIG_FILE"

        # 读取关键配置项
        DB_HOST=$(grep "^DB_HOST=" "$EXISTING_CONFIG_FILE" | cut -d'=' -f2 | tr -d '"' || echo "")
        DB_NAME=$(grep "^DB_NAME=" "$EXISTING_CONFIG_FILE" | cut -d'=' -f2 | tr -d '"' || echo "")
        DB_USER=$(grep "^DB_USER=" "$EXISTING_CONFIG_FILE" | cut -d'=' -f2 | tr -d '"' || echo "")
        DB_PASSWORD=$(grep "^DB_PASSWORD=" "$EXISTING_CONFIG_FILE" | cut -d'=' -f2 | tr -d '"' || echo "")
        CUSTOM_PORT=$(grep "^CUSTOM_PORT=" "$EXISTING_CONFIG_FILE" | cut -d'=' -f2 | tr -d '"' || echo "3000")

        # 读取其他重要配置
        local JWT_SECRET=$(grep "^JWT_SECRET=" "$EXISTING_CONFIG_FILE" | cut -d'=' -f2 | tr -d '"' || echo "")
        local APP_URL=$(grep "^APP_URL=" "$EXISTING_CONFIG_FILE" | cut -d'=' -f2 | tr -d '"' || echo "")

        # 保存完整配置内容用于后续恢复
        PRESERVED_CONFIG=$(cat "$EXISTING_CONFIG_FILE")

        print_success "现有配置读取完成"
        print_info "数据库: $DB_HOST/$DB_NAME"
        print_info "用户: $DB_USER"
        print_info "端口: $CUSTOM_PORT"

    else
        print_warning "配置文件不存在，将使用默认配置"
    fi
}

# 检查系统环境
check_system_requirements() {
    if [ "$IS_UPDATE_MODE" = true ]; then
        print_step "2" "检查系统环境（更新模式）"
    else
        print_step "2" "检查系统环境"
    fi
    
    # 检查操作系统
    if [[ "$OSTYPE" == "freebsd"* ]]; then
        print_success "检测到 FreeBSD 系统"
    else
        print_warning "非 FreeBSD 系统，某些功能可能需要调整"
    fi
    
    # 检查必要工具
    local missing_tools=()
    
    for tool in curl git npm node; do
        if ! command -v $tool >/dev/null 2>&1; then
            missing_tools+=($tool)
        fi
    done
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        print_error "缺少必要工具: ${missing_tools[*]}"
        print_info "请先安装这些工具后再运行安装脚本"
        exit 1
    fi
    
    print_success "系统环境检查通过"
    echo ""
}

# 收集配置信息
collect_configuration() {
    if [ "$IS_UPDATE_MODE" = true ]; then
        print_step "3" "确认配置信息（更新模式）"

        echo -e "${YELLOW}更新模式：将保留现有配置，如需修改请手动输入${NC}"
        echo -e "${CYAN}当前配置信息：${NC}"
        echo -e "  域名: ${GREEN}$CUSTOM_DOMAIN${NC}"
        echo -e "  数据库: ${GREEN}$DB_HOST/$DB_NAME${NC}"
        echo -e "  用户: ${GREEN}$DB_USER${NC}"
        echo -e "  端口: ${GREEN}$CUSTOM_PORT${NC}"
        echo ""

        # 在更新模式下，提供选项是否修改配置
        read_input "是否保持现有配置？(y/n)" "y" "USER_INPUT"
        if [[ "$USER_INPUT" =~ ^[Nn] ]]; then
            echo -e "${YELLOW}请输入新的配置信息：${NC}"
            collect_new_configuration
        else
            print_info "保持现有配置"
        fi
    else
        print_step "3" "收集配置信息"

        echo -e "${YELLOW}请按照提示输入配置信息，按 Enter 使用默认值${NC}"
        echo ""
        collect_new_configuration
    fi
}

# 收集新配置信息
collect_new_configuration() {
    
    # 域名配置
    while true; do
        read_input "请输入自定义域名" "$DEFAULT_DOMAIN" "CUSTOM_DOMAIN"
        
        if validate_domain "$CUSTOM_DOMAIN"; then
            print_success "域名格式有效: $CUSTOM_DOMAIN"
            break
        else
            print_error "域名格式无效，请重新输入"
        fi
    done
    
    # 数据库配置
    echo ""
    echo -e "${BOLD}${PURPLE}数据库配置${NC}"
    
    read_input "数据库服务器地址" "$DEFAULT_DB_HOST" "DB_HOST"
    read_input "数据库名称" "$DEFAULT_DB_NAME" "DB_NAME"
    read_input "数据库用户名" "" "DB_USER"
    read_input "数据库密码" "" "DB_PASSWORD" "true"
    
    # 端口配置
    echo ""
    while true; do
        read_input "自定义端口号 (1024-65535)" "$DEFAULT_PORT" "CUSTOM_PORT"
        
        if validate_port "$CUSTOM_PORT"; then
            print_success "端口号有效: $CUSTOM_PORT"
            break
        else
            print_error "端口号无效，请输入 1024-65535 之间的数字"
        fi
    done
    
    # API 路径
    read_input "API 基础路径" "$DEFAULT_API_PATH" "API_PATH"
    
    echo ""
    print_success "配置信息收集完成"
}

# 验证配置
validate_configuration() {
    print_step "3" "验证配置"
    
    # 显示配置预览
    echo -e "${BOLD}${CYAN}配置预览:${NC}"
    echo -e "  域名: ${GREEN}$CUSTOM_DOMAIN${NC}"
    echo -e "  数据库服务器: ${GREEN}$DB_HOST${NC}"
    echo -e "  数据库名称: ${GREEN}$DB_NAME${NC}"
    echo -e "  数据库用户: ${GREEN}$DB_USER${NC}"
    echo -e "  数据库密码: ${GREEN}****${NC}"
    echo -e "  端口号: ${GREEN}$CUSTOM_PORT${NC}"
    echo -e "  API 路径: ${GREEN}$API_PATH${NC}"
    echo ""
    
    # 确认配置
    echo -n -e "${YELLOW}确认以上配置是否正确? [y/N]: ${NC}"
    read confirm
    
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        print_info "配置已取消，请重新运行脚本"
        exit 0
    fi
    
    # 测试数据库连接
    if ! test_database_connection "$DB_HOST" "$DB_USER" "$DB_PASSWORD" "$DB_NAME"; then
        print_error "数据库连接测试失败"
        echo -n -e "${YELLOW}是否继续安装? [y/N]: ${NC}"
        read continue_install
        
        if [[ ! $continue_install =~ ^[Yy]$ ]]; then
            print_info "安装已取消"
            exit 0
        fi
    else
        print_success "数据库连接测试成功"
    fi
    
    echo ""
}

# 设置安装目录
setup_installation_directory() {
    print_step "4" "设置安装目录"

    INSTALL_DIR="$HOME/domains/$CUSTOM_DOMAIN/public_html"

    print_info "安装目录: $INSTALL_DIR"

    # 创建目录结构
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$INSTALL_DIR/api"
    mkdir -p "$INSTALL_DIR/database"

    print_success "安装目录创建完成"
    echo ""
}

# 下载项目文件
download_project() {
    print_step "5" "下载项目文件"

    cd "$INSTALL_DIR"

    # 克隆项目
    print_info "从 GitHub 下载项目..."
    if [ -d ".git" ]; then
        print_info "更新现有项目..."
        git fetch origin $BRANCH
        git reset --hard origin/$BRANCH
    else
        git clone -b $BRANCH $GITHUB_REPO temp_project
        cp -r temp_project/* .
        cp -r temp_project/.* . 2>/dev/null || true
        rm -rf temp_project
    fi

    print_success "项目文件下载完成"
    echo ""
}

# 生成配置文件
generate_configuration_files() {
    if [ "$IS_UPDATE_MODE" = true ]; then
        print_step "6" "更新配置文件（保留现有配置）"
    else
        print_step "6" "生成配置文件"
    fi

    # 生成 .env 文件
    CONFIG_FILE="$INSTALL_DIR/api/.env"

    if [ "$IS_UPDATE_MODE" = true ]; then
        print_info "更新 API 配置文件: $CONFIG_FILE"
        generate_merged_config
    else
        print_info "生成 API 配置文件: $CONFIG_FILE"
        generate_new_config
    fi
}

# 生成合并的配置文件（更新模式）
generate_merged_config() {
    # 如果有保留的配置，则合并配置
    if [ -n "$PRESERVED_CONFIG" ]; then
        print_info "合并现有配置和新配置..."

        # 创建临时配置文件
        local temp_config="/tmp/merged_config_$(date +%Y%m%d_%H%M%S)"

        # 写入保留的配置
        echo "$PRESERVED_CONFIG" > "$temp_config"

        # 更新时间戳注释
        awk -v date="$(date)" '
        /^# 自动生成于/ { print "# 配置更新于 " date; next }
        { print }
        ' "$temp_config" > "$CONFIG_FILE"

        rm -f "$temp_config"

        print_success "配置文件合并完成"
    else
        print_warning "没有找到现有配置，生成新配置"
        generate_new_config
    fi
}

# 生成新配置文件
generate_new_config() {

    cat > "$CONFIG_FILE" << EOF
# Serv00 环境管理系统配置文件
# 自动生成于 $(date)

# 数据库配置
DB_HOST=$DB_HOST
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_PORT=3306

# 应用配置
APP_ENV=production
APP_DEBUG=false
APP_URL=https://$CUSTOM_DOMAIN
CUSTOM_PORT=$CUSTOM_PORT

# API 配置
API_BASE_URL=$API_PATH
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "fallback_secret_$(date +%s)")
JWT_EXPIRATION=86400

# 日志配置
LOG_LEVEL=error
LOG_FILE=/tmp/environment_manager.log

# Serv00 特定配置
SERV00_OPTIMIZED=true
FREEBSD_COMPAT=true

# 网络检测配置（修复后的设置）
NETWORK_TIMEOUT=8000
DETECTION_RETRY_COUNT=2
CONCURRENT_CHECKS=3
EOF

    print_success "API 配置文件生成完成"

    # 生成强力 .htaccess 文件（修复 MIME 类型问题）
    print_info "生成 .htaccess 文件..."

    cat > "$INSTALL_DIR/.htaccess" << 'EOF'
# 强制设置 JavaScript MIME 类型（修复白屏问题）
<FilesMatch "\.(js|mjs)$">
    ForceType application/javascript
</FilesMatch>

<FilesMatch "\.css$">
    ForceType text/css
</FilesMatch>

<FilesMatch "\.json$">
    ForceType application/json
</FilesMatch>

<FilesMatch "\.(svg|png|jpg|jpeg|gif|ico)$">
    ForceType image/svg+xml
</FilesMatch>

# 备用 MIME 类型设置
AddType application/javascript .js
AddType application/javascript .mjs
AddType text/css .css
AddType application/json .json
AddType image/svg+xml .svg

# 安全头
Header always set X-Content-Type-Options nosniff

# 错误处理
ErrorDocument 502 /index.html
ErrorDocument 404 /index.html

# 缓存控制
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
</IfModule>
EOF

    print_success ".htaccess 文件生成完成"

    # 生成数据库初始化脚本
    print_info "生成数据库初始化脚本..."

    cat > "$INSTALL_DIR/database/init.sql" << EOF
-- Serv00 环境管理系统数据库初始化脚本
-- 自动生成于 $(date)

USE $DB_NAME;

-- 创建环境表
CREATE TABLE IF NOT EXISTS environments (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  description TEXT,
  version VARCHAR(50),
  network_type ENUM('internal', 'external') DEFAULT 'external',
  environment_type ENUM('development', 'testing', 'staging', 'production') DEFAULT 'development',
  tags JSON,
  group_id VARCHAR(36),
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  INDEX idx_name (name),
  INDEX idx_type (environment_type),
  INDEX idx_network (network_type),
  INDEX idx_group (group_id),
  INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建状态历史表
CREATE TABLE IF NOT EXISTS status_history (
  id VARCHAR(36) PRIMARY KEY,
  environment_id VARCHAR(36) NOT NULL,
  status ENUM('available', 'unreachable', 'checking') NOT NULL,
  response_time INT,
  status_code INT,
  error_message TEXT,
  detection_method VARCHAR(50),
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  checked_by VARCHAR(36),
  FOREIGN KEY (environment_id) REFERENCES environments(id) ON DELETE CASCADE,
  INDEX idx_env_id (environment_id),
  INDEX idx_status (status),
  INDEX idx_checked_at (checked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建环境分组表
CREATE TABLE IF NOT EXISTS environment_groups (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  sort_order INT DEFAULT 0,
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  INDEX idx_name (name),
  INDEX idx_sort_order (sort_order),
  INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入默认管理员用户 (密码: admin123)
INSERT IGNORE INTO users (id, username, email, password_hash, role, is_active) VALUES
('admin-001', 'admin', 'admin@localhost', '\$2y\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', TRUE);

-- 插入默认环境分组
INSERT IGNORE INTO environment_groups (id, name, description, color, sort_order) VALUES
('group-dev', '开发环境', '开发和测试环境', '#10B981', 1),
('group-prod', '生产环境', '生产和预发布环境', '#EF4444', 2),
('group-staging', '预发布环境', '预发布和集成测试环境', '#F59E0B', 3);

-- 插入示例环境数据
INSERT IGNORE INTO environments (id, name, url, description, version, network_type, environment_type, tags, group_id, created_by) VALUES
('env-001', '开发环境API', 'https://dev-api.example.com', '主要开发API服务', 'v2.1.0', 'external', 'development', '["API", "开发"]', 'group-dev', 'admin-001'),
('env-002', '测试数据库', 'https://test-db.example.com', '测试环境数据库', 'v1.8.5', 'internal', 'testing', '["数据库", "测试"]', 'group-dev', 'admin-001'),
('env-003', '生产环境', 'https://api.example.com', '生产环境主服务', 'v2.0.3', 'external', 'production', '["生产", "API"]', 'group-prod', 'admin-001');

SELECT 'Database initialization completed successfully!' as message;
EOF

    print_success "数据库初始化脚本生成完成"
    echo ""
}

# 安装依赖和构建项目
build_project() {
    print_step "7" "安装依赖和构建项目"

    cd "$INSTALL_DIR"

    # 检查 Node.js 版本兼容性
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_warning "Node.js 版本过低 ($NODE_VERSION)，建议升级到 18 或更高版本"
    fi

    # 清理缓存和旧文件
    print_info "清理旧文件和缓存..."
    rm -rf dist node_modules package-lock.json
    npm cache clean --force 2>/dev/null || true

    # 修复 package.json 构建脚本（解决权限问题）
    print_info "修复构建脚本..."
    if [ -f "package.json" ]; then
        # 使用 FreeBSD 兼容的方法修改 package.json
        cp package.json package.json.tmp

        # 使用 awk 替代 sed 进行更可靠的替换
        awk '
        {
            gsub(/"build": "vite build"/, "\"build\": \"npx vite build\"")
            gsub(/"dev": "vite"/, "\"dev\": \"npx vite\"")
            gsub(/"preview": "vite preview"/, "\"preview\": \"npx vite preview\"")
            print
        }' package.json.tmp > package.json

        rm -f package.json.tmp
        print_info "package.json 构建脚本已修复"
    fi

    # 安装依赖
    print_info "安装项目依赖..."
    if ! npm install; then
        print_warning "标准安装失败，尝试备用方案..."
        npm install --legacy-peer-deps || npm install --force
    fi

    # 修复 node_modules 权限（Serv00 特定问题）
    print_info "修复执行权限..."
    if [ -d "node_modules/.bin" ]; then
        find node_modules/.bin -type f -exec chmod +x {} \; 2>/dev/null || true
        # 特别处理 vite 可执行文件
        if [ -f "node_modules/.bin/vite" ]; then
            chmod +x node_modules/.bin/vite 2>/dev/null || true
        fi
    fi

    # 构建项目
    print_info "构建生产版本..."

    # 设置 Node.js 环境变量（FreeBSD 特定）
    export NODE_ENV=production
    export PATH="$PATH:./node_modules/.bin"

    # 尝试多种构建方法
    BUILD_SUCCESS=false

    # 方法1: 标准 npm run build
    if npm run build 2>/dev/null; then
        BUILD_SUCCESS=true
        print_info "npm run build 成功"
    else
        print_warning "npm run build 失败，尝试备用方案..."

        # 方法2: 使用 npx
        if npx vite build 2>/dev/null; then
            BUILD_SUCCESS=true
            print_info "npx vite build 成功"
        else
            print_warning "npx 失败，尝试直接调用..."

            # 方法3: 直接调用 vite
            if [ -f "node_modules/vite/bin/vite.js" ]; then
                if node node_modules/vite/bin/vite.js build 2>/dev/null; then
                    BUILD_SUCCESS=true
                    print_info "直接调用 vite 成功"
                fi
            fi
        fi
    fi

    # 检查构建结果
    if [ "$BUILD_SUCCESS" = false ]; then
        print_error "所有构建方法都失败了"
        print_info "请检查 Node.js 版本和依赖安装"
        exit 1
    fi

    # 验证构建输出
    if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
        print_error "构建完成但输出文件缺失"
        exit 1
    fi

    # 修复构建后的文件（解决 MIME 类型问题）
    if [ -f "dist/index.html" ]; then
        print_info "修复模块类型问题..."

        # 使用 FreeBSD 兼容的方法移除 type="module"
        cp dist/index.html dist/index.html.tmp
        awk '{gsub(/type="module"/, ""); print}' dist/index.html.tmp > dist/index.html
        rm -f dist/index.html.tmp

        print_info "模块类型问题已修复"
    fi

    print_success "项目构建完成"
    echo ""
}

# 初始化数据库
initialize_database() {
    if [ "$IS_UPDATE_MODE" = true ]; then
        print_step "8" "跳过数据库初始化（更新模式）"

        print_info "更新模式：保留现有数据库数据"
        print_info "数据库: $DB_HOST/$DB_NAME"
        print_success "数据库数据完整性已保持"
        echo ""
        return 0
    fi

    print_step "8" "初始化数据库"

    if command -v mysql >/dev/null 2>&1; then
        print_info "执行数据库初始化脚本..."

        if mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$INSTALL_DIR/database/init.sql"; then
            print_success "数据库初始化成功"
        else
            print_error "数据库初始化失败"
            print_info "您可以稍后手动执行: mysql -h $DB_HOST -u $DB_USER -p $DB_NAME < $INSTALL_DIR/database/init.sql"
        fi
    else
        print_warning "MySQL 客户端未安装，跳过数据库初始化"
        print_info "请手动执行数据库初始化脚本: $INSTALL_DIR/database/init.sql"
    fi

    echo ""
}

# 设置文件权限
set_permissions() {
    print_step "9" "设置文件权限"

    cd "$INSTALL_DIR"

    # 设置基本权限
    find . -type d -exec chmod 755 {} \;
    find . -type f -exec chmod 644 {} \;

    # 设置特殊权限
    chmod -R 755 api/
    chmod 600 api/.env 2>/dev/null || true

    print_success "文件权限设置完成"
    echo ""
}

# 生成管理脚本
generate_management_scripts() {
    print_step "10" "生成管理脚本"

    # 生成数据库管理脚本
    cat > "$HOME/manage_database.sh" << EOF
#!/bin/bash
# 数据库管理脚本

DB_HOST="$DB_HOST"
DB_NAME="$DB_NAME"
DB_USER="$DB_USER"
DB_PASSWORD="$DB_PASSWORD"

case "\$1" in
    "connect")
        mysql -h "\$DB_HOST" -u "\$DB_USER" -p"\$DB_PASSWORD" "\$DB_NAME"
        ;;
    "backup")
        mysqldump -h "\$DB_HOST" -u "\$DB_USER" -p"\$DB_PASSWORD" "\$DB_NAME" > "backup_\$(date +%Y%m%d_%H%M%S).sql"
        echo "数据库备份完成"
        ;;
    "init")
        mysql -h "\$DB_HOST" -u "\$DB_USER" -p"\$DB_PASSWORD" "\$DB_NAME" < "$INSTALL_DIR/database/init.sql"
        echo "数据库初始化完成"
        ;;
    *)
        echo "用法: \$0 {connect|backup|init}"
        echo "  connect - 连接数据库"
        echo "  backup  - 备份数据库"
        echo "  init    - 初始化数据库"
        ;;
esac
EOF

    chmod +x "$HOME/manage_database.sh"

    # 生成站点管理脚本
    cat > "$HOME/manage_site.sh" << EOF
#!/bin/bash
# 站点管理脚本

SITE_DIR="$INSTALL_DIR"
DOMAIN="$CUSTOM_DOMAIN"

case "\$1" in
    "update")
        cd "\$SITE_DIR"
        git pull origin $BRANCH
        npm install
        npm run build
        echo "站点更新完成"
        ;;
    "restart")
        # 重启相关服务（根据 Serv00 具体情况调整）
        echo "重启站点服务..."
        ;;
    "logs")
        tail -f /tmp/environment_manager.log
        ;;
    "status")
        echo "站点状态检查:"
        echo "域名: \$DOMAIN"
        echo "目录: \$SITE_DIR"
        curl -s "https://\$DOMAIN/api/health" | head -5
        ;;
    *)
        echo "用法: \$0 {update|restart|logs|status}"
        echo "  update  - 更新站点"
        echo "  restart - 重启服务"
        echo "  logs    - 查看日志"
        echo "  status  - 检查状态"
        ;;
esac
EOF

    chmod +x "$HOME/manage_site.sh"

    print_success "管理脚本生成完成"
    print_info "数据库管理: ~/manage_database.sh"
    print_info "站点管理: ~/manage_site.sh"
    echo ""
}

# 显示安装完成信息
show_completion_info() {
    echo ""
    if [ "$IS_UPDATE_MODE" = true ]; then
        echo -e "${BOLD}${GREEN}🎉 更新完成！${NC}"
        echo ""
        echo -e "${BOLD}${CYAN}更新信息:${NC}"
        echo -e "  🔄 系统已更新到最新版本"
        echo -e "  💾 所有数据和配置已保留"
        echo -e "  🔧 包含最新的bug修复和功能改进"

        if [ -n "$BACKUP_CONFIG_FILE" ]; then
            echo -e "  📋 配置备份: ${GREEN}$BACKUP_CONFIG_FILE${NC}"
        fi

        echo ""
        echo -e "${BOLD}${CYAN}验证步骤:${NC}"
        echo -e "  1. 访问网站确认功能正常"
        echo -e "  2. 测试环境检测功能"
        echo -e "  3. 检查用户数据完整性"
        echo ""
    else
        echo -e "${BOLD}${GREEN}🎉 安装完成！${NC}"
        echo ""
    fi

    echo -e "${BOLD}${CYAN}访问信息:${NC}"
    echo -e "  🌐 网站地址: ${GREEN}https://$CUSTOM_DOMAIN${NC}"
    echo -e "  🔗 API 地址: ${GREEN}https://$CUSTOM_DOMAIN$API_PATH/health${NC}"
    echo -e "  📁 安装目录: ${GREEN}$INSTALL_DIR${NC}"
    echo ""
    echo -e "${BOLD}${CYAN}默认登录信息:${NC}"
    echo -e "  👤 用户名: ${GREEN}admin${NC}"
    echo -e "  🔑 密码: ${GREEN}admin123${NC}"
    echo -e "  ${YELLOW}⚠️  请立即登录并修改默认密码！${NC}"
    echo ""
    echo -e "${BOLD}${CYAN}管理工具:${NC}"
    echo -e "  📊 数据库管理: ${GREEN}~/manage_database.sh${NC}"
    echo -e "  🔧 站点管理: ${GREEN}~/manage_site.sh${NC}"
    echo ""
    echo -e "${BOLD}${CYAN}Cloudflare DNS 配置提示:${NC}"
    if [[ "$CUSTOM_DOMAIN" != *".serv00.net" ]]; then
        echo -e "  ${YELLOW}请在 Cloudflare 中添加以下 DNS 记录:${NC}"
        echo -e "  Type: A"
        echo -e "  Name: @ (或子域名)"
        echo -e "  Content: $(curl -s https://ipinfo.io/ip 2>/dev/null || echo '[服务器IP]')"
        echo -e "  Proxy: 可选择开启或关闭"
    fi
    echo ""
    echo -e "${BOLD}${CYAN}下一步操作:${NC}"
    echo -e "  1. 访问网站并使用默认账户登录"
    echo -e "  2. 修改管理员密码"
    echo -e "  3. 添加您的环境配置"
    echo -e "  4. 配置 Cloudflare DNS (如使用自定义域名)"
    echo ""
    echo -e "${GREEN}感谢使用 Serv00 环境管理系统！${NC}"
}

# 错误处理函数
handle_error() {
    local exit_code=$?
    print_error "安装过程中发生错误 (退出码: $exit_code)"
    print_info "请检查错误信息并重新运行脚本"
    print_info "如需帮助，请查看日志或联系支持"
    exit $exit_code
}

# 主函数
main() {
    # 设置错误处理
    trap handle_error ERR

    # 执行安装步骤
    detect_installation_type
    check_system_requirements
    collect_configuration
    validate_configuration
    setup_installation_directory
    download_project
    generate_configuration_files
    build_project
    initialize_database
    set_permissions
    generate_management_scripts
    show_completion_info
}

# 非交互模式配置（用于curl管道执行）
setup_non_interactive_config() {
    print_step "2" "使用预设配置（非交互模式）"

    # 使用预设的配置值
    CUSTOM_DOMAIN="do.kandy.dpdns.org"
    DB_HOST="mysql14.serv00.com"
    DB_NAME="m9785_environment_manager"
    DB_USER="m9785_s14kook"
    DB_PASSWORD="请在安装后手动配置"
    CUSTOM_PORT="3000"
    API_PATH="/api"

    print_info "域名: $CUSTOM_DOMAIN"
    print_info "数据库: $DB_HOST/$DB_NAME"
    print_info "用户: $DB_USER"
    print_warning "数据库密码需要安装后手动配置"

    echo ""
}

# 简化的验证（非交互模式）
simple_validate_configuration() {
    print_step "3" "验证配置（非交互模式）"

    print_info "使用预设配置，跳过交互验证"
    print_warning "请确保数据库 $DB_NAME 已创建"
    print_warning "安装完成后需要手动配置数据库密码"

    echo ""
}

# 非交互主函数
main_non_interactive() {
    # 设置错误处理
    trap handle_error ERR

    print_info "检测到非交互环境，使用预设配置"

    # 执行安装步骤（非交互版本）
    detect_installation_type
    check_system_requirements
    setup_non_interactive_config
    simple_validate_configuration
    setup_installation_directory
    download_project
    generate_configuration_files
    build_project
    initialize_database
    set_permissions
    generate_management_scripts
    show_completion_info

    # 显示后续配置提示
    echo ""
    print_warning "重要：请完成以下配置步骤："
    echo "1. 编辑配置文件: nano ~/domains/$CUSTOM_DOMAIN/public_html/api/.env"
    echo "2. 填入正确的数据库密码"
    echo "3. 初始化数据库: mysql -h $DB_HOST -u $DB_USER -p $DB_NAME < ~/domains/$CUSTOM_DOMAIN/public_html/database/init.sql"
    echo "4. 访问网站: https://$CUSTOM_DOMAIN"
}

# 交互主函数
main_interactive() {
    # 设置错误处理
    trap handle_error ERR

    # 执行安装步骤（交互版本）
    detect_installation_type
    check_system_requirements
    collect_configuration
    validate_configuration
    setup_installation_directory
    download_project
    generate_configuration_files
    build_project
    initialize_database
    set_permissions
    generate_management_scripts
    show_completion_info
}

# 脚本入口点
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # 检测是否为交互环境
    if [ -t 0 ] && [ -t 1 ]; then
        # 交互环境
        main_interactive "$@"
    else
        # 非交互环境（如curl管道）
        main_non_interactive "$@"
    fi
fi
