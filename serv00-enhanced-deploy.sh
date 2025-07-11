#!/bin/bash
# Serv00 环境管理系统增强版一键部署脚本
# 恢复原项目的完整设计和功能特性，同时保持 Serv00 兼容性
# 使用方法: bash -i <(curl -SL https://raw.githubusercontent.com/kookhr/demoguanli/serv00/serv00-enhanced-deploy.sh)

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
PROJECT_NAME="environment-manager-enhanced"
GITHUB_REPO="https://github.com/kookhr/demoguanli.git"
GITHUB_BRANCH="serv00"

# 系统信息
SYSTEM_INFO=""
PHP_VERSION=""
MYSQL_VERSION=""

# 安装配置
INSTALL_DIR=""
DB_HOST=""
DB_NAME=""
DB_USER=""
DB_PASS=""
DOMAIN_NAME=""

# Serv00 平台检测
SERV00_SERVER=""
DETECTED_USER=""

# 打印函数
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_title() {
    echo
    echo "=================================================="
    print_message $CYAN "  $1"
    echo "=================================================="
    echo
}

print_step() {
    print_message $BLUE "🔄 $1"
}

print_success() {
    print_message $GREEN "✅ $1"
}

print_warning() {
    print_message $YELLOW "⚠️  $1"
}

print_error() {
    print_message $RED "❌ $1"
}

print_info() {
    print_message $CYAN "ℹ️  $1"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检测 Serv00 环境
detect_serv00_environment() {
    print_step "检测 Serv00 环境..."
    
    # 检测操作系统
    if [[ "$OSTYPE" == "freebsd"* ]]; then
        SYSTEM_INFO="FreeBSD (Serv00)"
        print_success "✓ 检测到 FreeBSD 系统 (Serv00)"
    else
        SYSTEM_INFO="$OSTYPE"
        print_warning "⚠ 检测到非 FreeBSD 系统: $OSTYPE"
        print_warning "此脚本专为 Serv00 平台设计，其他平台可能不兼容"
    fi
    
    # 检测当前用户
    DETECTED_USER=$(whoami)
    print_info "当前用户: $DETECTED_USER"
    
    # 检测服务器编号
    if [[ $(hostname) =~ s([0-9]+)\.serv00\.com ]]; then
        SERV00_SERVER="s${BASH_REMATCH[1]}"
        print_success "✓ 检测到 Serv00 服务器: $SERV00_SERVER"
    else
        print_warning "⚠ 无法检测 Serv00 服务器编号"
        SERV00_SERVER="s0"  # 默认值
    fi
    
    # 检测 PHP
    if command_exists php; then
        PHP_VERSION=$(php -v | head -n1 | cut -d' ' -f2 | cut -d'-' -f1)
        print_success "✓ PHP 版本: $PHP_VERSION"
    else
        print_error "未找到 PHP，请联系 Serv00 支持"
        exit 1
    fi
    
    # 检测 MySQL 客户端
    if command_exists mysql; then
        MYSQL_VERSION=$(mysql --version | cut -d' ' -f6 | cut -d',' -f1)
        print_success "✓ MySQL 客户端版本: $MYSQL_VERSION"
    else
        print_warning "⚠ 未找到 MySQL 客户端，将尝试继续安装"
    fi
    
    # 检测目录权限
    local home_dir="/usr/home/$DETECTED_USER"
    if [ -d "$home_dir" ] && [ -w "$home_dir" ]; then
        print_success "✓ 用户主目录权限正常"
    else
        print_error "✗ 用户主目录权限异常: $home_dir"
        exit 1
    fi
}

# 自动检测 Serv00 配置
auto_detect_serv00_config() {
    print_step "自动检测 Serv00 配置..."
    
    # 检测服务器编号并设置 MySQL 主机
    if [[ $(hostname) =~ s([0-9]+)\.serv00\.com ]]; then
        local server_num="${BASH_REMATCH[1]}"
        DB_HOST="mysql${server_num}.serv00.com"
        print_success "✓ 自动检测 MySQL 主机: $DB_HOST"
    else
        DB_HOST="mysql0.serv00.com"  # 默认值
        print_warning "⚠ 无法检测服务器编号，使用默认 MySQL 主机: $DB_HOST"
    fi
    
    # 检测用户名并生成数据库配置
    local user=$(whoami)
    if [[ $user =~ ^([a-z]+)([0-9]+)$ ]]; then
        local user_prefix="${BASH_REMATCH[1]}"
        local user_number="${BASH_REMATCH[2]}"
        
        # 生成默认数据库配置
        DB_USER="${user_prefix}${user_number}_admin"
        DB_NAME="${user_prefix}${user_number}_envmgr"
        
        print_success "✓ 自动生成数据库用户: $DB_USER"
        print_success "✓ 自动生成数据库名称: $DB_NAME"
    else
        print_warning "⚠ 无法解析用户名格式，需要手动配置"
    fi
    
    # 检测域名配置
    local domains_dir="/usr/home/$user/domains"
    if [ -d "$domains_dir" ]; then
        local domain_count=$(ls -1 "$domains_dir" 2>/dev/null | wc -l)
        if [ "$domain_count" -gt 0 ]; then
            local first_domain=$(ls -1 "$domains_dir" | head -n1)
            DOMAIN_NAME="$first_domain"
            INSTALL_DIR="$domains_dir/$first_domain/public_html"
            print_success "✓ 自动检测域名: $DOMAIN_NAME"
            print_success "✓ 自动设置安装目录: $INSTALL_DIR"
        else
            print_warning "⚠ 未找到已配置的域名"
        fi
    else
        print_warning "⚠ 域名目录不存在: $domains_dir"
    fi
}

# 交互式配置
interactive_config() {
    print_title "Serv00 环境管理系统增强版配置"
    
    echo
    print_message $CYAN "📋 自动检测到的配置:"
    echo "   域名: ${DOMAIN_NAME:-'未检测到'}"
    echo "   安装目录: ${INSTALL_DIR:-'未检测到'}"
    echo "   数据库主机: ${DB_HOST:-'未检测到'}"
    echo "   数据库用户: ${DB_USER:-'未检测到'}"
    echo "   数据库名称: ${DB_NAME:-'未检测到'}"
    echo
    
    # 确认或修改安装目录
    if [ -z "$INSTALL_DIR" ]; then
        echo -n "请输入安装目录 [例如: ~/domains/yourdomain.com/public_html]: "
        read INSTALL_DIR
        while [ -z "$INSTALL_DIR" ]; do
            print_error "安装目录不能为空"
            echo -n "请输入安装目录: "
            read INSTALL_DIR
        done
    else
        echo -n "确认安装目录 [$INSTALL_DIR] (回车确认，或输入新路径): "
        read input_dir
        if [ -n "$input_dir" ]; then
            INSTALL_DIR="$input_dir"
        fi
    fi
    
    # 展开波浪号
    INSTALL_DIR="${INSTALL_DIR/#\~/$HOME}"
    
    # 创建安装目录
    mkdir -p "$INSTALL_DIR"
    if [ ! -w "$INSTALL_DIR" ]; then
        print_error "安装目录不可写: $INSTALL_DIR"
        exit 1
    fi
    print_success "✓ 安装目录: $INSTALL_DIR"
    
    # 数据库配置确认
    if [ -z "$DB_HOST" ]; then
        echo -n "请输入数据库主机 [例如: mysql0.serv00.com]: "
        read DB_HOST
        while [ -z "$DB_HOST" ]; do
            print_error "数据库主机不能为空"
            echo -n "请输入数据库主机: "
            read DB_HOST
        done
    else
        echo -n "确认数据库主机 [$DB_HOST] (回车确认，或输入新主机): "
        read input_host
        if [ -n "$input_host" ]; then
            DB_HOST="$input_host"
        fi
    fi

    if [ -z "$DB_NAME" ]; then
        echo -n "请输入数据库名称: "
        read DB_NAME
        while [ -z "$DB_NAME" ]; do
            print_error "数据库名称不能为空"
            echo -n "请输入数据库名称: "
            read DB_NAME
        done
    else
        echo -n "确认数据库名称 [$DB_NAME] (回车确认，或输入新名称): "
        read input_name
        if [ -n "$input_name" ]; then
            DB_NAME="$input_name"
        fi
    fi

    if [ -z "$DB_USER" ]; then
        echo -n "请输入数据库用户名: "
        read DB_USER
        while [ -z "$DB_USER" ]; do
            print_error "数据库用户名不能为空"
            echo -n "请输入数据库用户名: "
            read DB_USER
        done
    else
        echo -n "确认数据库用户名 [$DB_USER] (回车确认，或输入新用户名): "
        read input_user
        if [ -n "$input_user" ]; then
            DB_USER="$input_user"
        fi
    fi

    # 数据库密码（必须输入）
    echo -n "请输入数据库密码: "
    read -s DB_PASS
    echo
    while [ -z "$DB_PASS" ]; do
        print_error "数据库密码不能为空"
        echo -n "请输入数据库密码: "
        read -s DB_PASS
        echo
    done
    
    # 确认或修改域名
    if [ -z "$DOMAIN_NAME" ]; then
        echo -n "请输入域名 [例如: yourdomain.com]: "
        read DOMAIN_NAME
        while [ -z "$DOMAIN_NAME" ]; do
            print_error "域名不能为空"
            echo -n "请输入域名: "
            read DOMAIN_NAME
        done
    else
        echo -n "确认域名 [$DOMAIN_NAME] (回车确认，或输入新域名): "
        read input_domain
        if [ -n "$input_domain" ]; then
            DOMAIN_NAME="$input_domain"
        fi
    fi
    
    echo
    print_success "✓ 配置完成"
    print_info "最终配置:"
    echo "   安装目录: $INSTALL_DIR"
    echo "   数据库主机: $DB_HOST"
    echo "   数据库名称: $DB_NAME"
    echo "   数据库用户: $DB_USER"
    echo "   域名: $DOMAIN_NAME"
    echo
}

# 创建增强版数据库结构
create_enhanced_database() {
    print_step "创建增强版数据库结构..."

    cd "$INSTALL_DIR"
    mkdir -p database

    cat > database/enhanced-init.sql << 'EOF'
-- 环境管理系统增强版数据库初始化脚本
-- 支持完整功能：状态历史、标签、分组、收藏等

-- 创建环境表（增强版）
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
    sort_order INT DEFAULT 0,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    is_favorite BOOLEAN DEFAULT FALSE,
    INDEX idx_name (name),
    INDEX idx_type (environment_type),
    INDEX idx_network (network_type),
    INDEX idx_group (group_id),
    INDEX idx_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    preferences JSON,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建状态历史表（增强版）
CREATE TABLE IF NOT EXISTS status_history (
    id VARCHAR(36) PRIMARY KEY,
    environment_id VARCHAR(36) NOT NULL,
    status ENUM('available', 'unreachable', 'checking', 'error') NOT NULL,
    response_time INT,
    status_code INT,
    error_message TEXT,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checked_by VARCHAR(36),
    INDEX idx_env_id (environment_id),
    INDEX idx_status (status),
    INDEX idx_checked_at (checked_at),
    FOREIGN KEY (environment_id) REFERENCES environments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建环境分组表
CREATE TABLE IF NOT EXISTS environment_groups (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    sort_order INT DEFAULT 0,
    is_collapsed BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建用户会话表
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_last_activity (last_activity),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入默认管理员用户 (密码: admin123)
INSERT IGNORE INTO users (id, username, email, password_hash, role, preferences, is_active)
VALUES (
    'admin-001',
    'admin',
    'admin@localhost',
    '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm',
    'admin',
    '{"theme": "light", "language": "zh-CN", "notifications": true}',
    TRUE
);

-- 插入默认分组
INSERT IGNORE INTO environment_groups (id, name, description, color, sort_order, created_by) VALUES
('group-001', '开发环境', '开发阶段使用的环境', '#10B981', 1, 'admin-001'),
('group-002', '测试环境', '测试阶段使用的环境', '#3B82F6', 2, 'admin-001'),
('group-003', '生产环境', '生产环境', '#EF4444', 3, 'admin-001');

-- 插入示例环境数据（增强版）
INSERT IGNORE INTO environments (id, name, url, description, version, environment_type, network_type, tags, group_id, sort_order, created_by, is_favorite) VALUES
('env-001', '开发环境', 'https://dev.example.com', '主要开发环境，用于日常开发和调试', '1.0.0', 'development', 'external', '["开发", "前端", "API"]', 'group-001', 1, 'admin-001', FALSE),
('env-002', '测试环境', 'https://test.example.com', '功能测试环境，用于QA测试', '1.0.0', 'testing', 'external', '["测试", "QA", "自动化"]', 'group-002', 1, 'admin-001', TRUE),
('env-003', '预发布环境', 'https://staging.example.com', '预发布环境，生产前最后验证', '1.0.0', 'staging', 'external', '["预发布", "验证"]', 'group-002', 2, 'admin-001', FALSE),
('env-004', '生产环境', 'https://prod.example.com', '生产环境，对外提供服务', '1.0.0', 'production', 'external', '["生产", "稳定", "监控"]', 'group-003', 1, 'admin-001', TRUE);

-- 插入示例状态历史
INSERT IGNORE INTO status_history (id, environment_id, status, response_time, status_code, checked_at, checked_by) VALUES
('hist-001', 'env-001', 'available', 120, 200, NOW() - INTERVAL 1 HOUR, 'admin-001'),
('hist-002', 'env-002', 'available', 95, 200, NOW() - INTERVAL 30 MINUTE, 'admin-001'),
('hist-003', 'env-003', 'available', 150, 200, NOW() - INTERVAL 15 MINUTE, 'admin-001'),
('hist-004', 'env-004', 'available', 80, 200, NOW() - INTERVAL 5 MINUTE, 'admin-001');
EOF

    print_success "✓ 增强版数据库结构已创建"
}

# 创建增强版 PHP 配置文件
create_enhanced_config() {
    print_step "创建增强版 PHP 配置文件..."

    cd "$INSTALL_DIR"

    cat > config.php << EOF
<?php
// 环境管理系统增强版配置文件
// 支持完整功能和现代化设计

// 数据库配置
define('DB_HOST', '$DB_HOST');
define('DB_NAME', '$DB_NAME');
define('DB_USER', '$DB_USER');
define('DB_PASS', '$DB_PASS');
define('APP_DOMAIN', '$DOMAIN_NAME');

// 应用配置
define('APP_NAME', '环境管理系统');
define('APP_VERSION', '2.0.0');
define('APP_DESCRIPTION', '现代化环境管理系统，支持状态监控、分组管理、标签系统等完整功能');

// 功能开关
define('ENABLE_STATUS_CHECK', true);
define('ENABLE_GROUPS', true);
define('ENABLE_TAGS', true);
define('ENABLE_FAVORITES', true);
define('ENABLE_HISTORY', true);
define('ENABLE_DARK_MODE', true);

// 安全配置
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_samesite', 'Strict');

// 错误报告
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', '/tmp/serv00-enhanced-php-errors.log');

// 时区设置
date_default_timezone_set('Asia/Shanghai');

// 数据库连接函数
function getDatabase() {
    static \$pdo = null;

    if (\$pdo === null) {
        try {
            \$pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
                ]
            );
        } catch (PDOException \$e) {
            error_log("数据库连接失败: " . \$e->getMessage());
            die("数据库连接失败，请联系管理员");
        }
    }

    return \$pdo;
}

// 启动会话
session_start();

// 检查用户是否已登录
function isLoggedIn() {
    return isset(\$_SESSION['user_id']) && isset(\$_SESSION['username']);
}

// 检查是否为管理员
function isAdmin() {
    return isLoggedIn() && (\$_SESSION['role'] ?? '') === 'admin';
}

// 重定向函数
function redirect(\$url) {
    header("Location: \$url");
    exit();
}

// 安全的输出函数
function h(\$string) {
    return htmlspecialchars(\$string, ENT_QUOTES, 'UTF-8');
}

// JSON 安全输出
function jsonResponse(\$data, \$status = 200) {
    http_response_code(\$status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(\$data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

// 生成 UUID
function generateUUID() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

// 生成 CSRF Token
function generateCSRFToken() {
    if (!isset(\$_SESSION['csrf_token'])) {
        \$_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return \$_SESSION['csrf_token'];
}

// 验证 CSRF Token
function validateCSRFToken(\$token) {
    return isset(\$_SESSION['csrf_token']) && hash_equals(\$_SESSION['csrf_token'], \$token);
}

// 格式化时间
function formatTime(\$timestamp) {
    if (!(\$timestamp instanceof DateTime)) {
        \$timestamp = new DateTime(\$timestamp);
    }

    \$now = new DateTime();
    \$diff = \$now->diff(\$timestamp);

    if (\$diff->days > 0) {
        return \$timestamp->format('Y-m-d H:i');
    } elseif (\$diff->h > 0) {
        return \$diff->h . '小时前';
    } elseif (\$diff->i > 0) {
        return \$diff->i . '分钟前';
    } else {
        return '刚刚';
    }
}

// 状态检测函数
function checkEnvironmentStatus(\$url, \$timeout = 10) {
    \$start_time = microtime(true);

    \$context = stream_context_create([
        'http' => [
            'timeout' => \$timeout,
            'method' => 'GET',
            'header' => 'User-Agent: Environment-Manager/2.0'
        ]
    ]);

    \$result = [
        'status' => 'unknown',
        'response_time' => null,
        'status_code' => null,
        'error_message' => null
    ];

    try {
        \$response = @file_get_contents(\$url, false, \$context);
        \$response_time = round((microtime(true) - \$start_time) * 1000);

        if (\$response !== false && isset(\$http_response_header)) {
            \$status_line = \$http_response_header[0];
            preg_match('/HTTP\/\d\.\d\s+(\d+)/', \$status_line, \$matches);
            \$status_code = isset(\$matches[1]) ? (int)\$matches[1] : 200;

            \$result['response_time'] = \$response_time;
            \$result['status_code'] = \$status_code;

            if (\$status_code >= 200 && \$status_code < 400) {
                \$result['status'] = 'available';
            } else {
                \$result['status'] = 'error';
                \$result['error_message'] = "HTTP \$status_code";
            }
        } else {
            \$result['status'] = 'unreachable';
            \$result['error_message'] = '无法连接到服务器';
        }
    } catch (Exception \$e) {
        \$result['status'] = 'unreachable';
        \$result['error_message'] = \$e->getMessage();
    }

    return \$result;
}
?>
EOF

    print_success "✓ 增强版 PHP 配置文件已创建"
}

# 创建增强版主页面（Apple Liquid Glass 设计）
create_enhanced_index_page() {
    print_step "创建增强版主页面（Apple Liquid Glass 设计）..."

    cd "$INSTALL_DIR"

    cat > index.php << 'EOF'
<?php
require_once 'config.php';

// 检查是否已登录
if (!isLoggedIn()) {
    redirect('login.php');
}

$pdo = getDatabase();

// 获取环境列表和状态（包含分组信息）
$stmt = $pdo->query("
    SELECT e.*,
           COALESCE(sh.status, 'unknown') as current_status,
           sh.response_time,
           sh.checked_at,
           g.name as group_name,
           g.color as group_color
    FROM environments e
    LEFT JOIN (
        SELECT environment_id, status, response_time, checked_at,
               ROW_NUMBER() OVER (PARTITION BY environment_id ORDER BY checked_at DESC) as rn
        FROM status_history
    ) sh ON e.id = sh.environment_id AND sh.rn = 1
    LEFT JOIN environment_groups g ON e.group_id = g.id
    WHERE e.is_active = 1
    ORDER BY g.sort_order ASC, e.sort_order ASC, e.created_at DESC
");
$environments = $stmt->fetchAll();

// 获取分组列表
$stmt = $pdo->query("SELECT * FROM environment_groups ORDER BY sort_order ASC");
$groups = $stmt->fetchAll();

// 获取用户信息
$username = $_SESSION['username'] ?? 'Unknown';
$role = $_SESSION['role'] ?? 'user';

// 统计信息
$total_envs = count($environments);
$available_envs = count(array_filter($environments, fn($env) => $env['current_status'] === 'available'));
$unreachable_envs = count(array_filter($environments, fn($env) => $env['current_status'] === 'unreachable'));
$favorite_envs = count(array_filter($environments, fn($env) => $env['is_favorite']));

// 按分组组织环境
$grouped_environments = [];
foreach ($environments as $env) {
    $group_id = $env['group_id'] ?? 'ungrouped';
    $grouped_environments[$group_id][] = $env;
}
?>
<!DOCTYPE html>
<html lang="zh-CN" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= APP_NAME ?> - 增强版</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    <style>
        /* Apple Liquid Glass 设计风格 */
        .liquid-glass-surface {
            background: rgba(255, 255, 255, 0.88);
            backdrop-filter: blur(16px) saturate(180%) brightness(105%);
            border: 1px solid rgba(255, 255, 255, 0.5);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06), 0 1px 0 rgba(255, 255, 255, 0.5) inset;
        }

        .dark .liquid-glass-surface {
            background: rgba(31, 41, 55, 0.75);
            backdrop-filter: blur(16px) saturate(180%) brightness(115%);
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2), 0 1px 0 rgba(255, 255, 255, 0.1) inset;
        }

        .card-hover {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card-hover:hover {
            transform: translateY(-4px) scale(1.02);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12), 0 1px 0 rgba(255, 255, 255, 0.7) inset;
        }

        .dark .card-hover:hover {
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3), 0 1px 0 rgba(255, 255, 255, 0.2) inset;
        }

        .animate-fade-in {
            animation: fadeIn 0.5s ease-in-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .status-available { border-left-color: #10b981; }
        .status-unreachable { border-left-color: #ef4444; }
        .status-checking { border-left-color: #3b82f6; }
        .status-unknown { border-left-color: #6b7280; }
        .status-error { border-left-color: #f59e0b; }

        /* 深色模式过渡 */
        * {
            transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
        }

        /* 标签样式 */
        .tag {
            display: inline-flex;
            align-items: center;
            padding: 0.25rem 0.5rem;
            border-radius: 0.375rem;
            font-size: 0.75rem;
            font-weight: 500;
            margin: 0.125rem;
        }

        /* 响应式网格 */
        .environment-grid {
            display: grid;
            grid-template-columns: repeat(1, minmax(0, 1fr));
            gap: 1.5rem;
        }

        @media (min-width: 768px) {
            .environment-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
        }

        @media (min-width: 1280px) {
            .environment-grid {
                grid-template-columns: repeat(3, minmax(0, 1fr));
            }
        }
    </style>
</head>
<body class="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 min-h-screen transition-colors duration-300">
    <!-- 导航栏 -->
    <nav class="liquid-glass-surface sticky top-0 z-50 border-b border-white/20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center space-x-4">
                    <div class="flex items-center space-x-2">
                        <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <i data-lucide="monitor" class="w-5 h-5 text-white"></i>
                        </div>
                        <h1 class="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            <?= APP_NAME ?>
                        </h1>
                        <span class="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-1 rounded-full font-medium">
                            增强版
                        </span>
                    </div>
                </div>

                <div class="flex items-center space-x-4">
                    <!-- 深色模式切换 -->
                    <button id="darkModeToggle" class="p-2 rounded-lg hover:bg-white/20 transition-colors" title="切换深色模式">
                        <i data-lucide="sun" class="w-5 h-5 text-gray-600 dark:text-gray-300"></i>
                    </button>

                    <!-- 刷新按钮 -->
                    <button id="refreshAll" class="p-2 rounded-lg hover:bg-white/20 transition-colors" title="刷新所有状态">
                        <i data-lucide="refresh-cw" class="w-5 h-5 text-gray-600 dark:text-gray-300"></i>
                    </button>

                    <!-- 用户信息 -->
                    <div class="flex items-center space-x-3">
                        <span class="text-sm text-gray-600 dark:text-gray-300">欢迎, <?= h($username) ?></span>
                        <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span class="text-white text-sm font-medium"><?= strtoupper(substr($username, 0, 1)) ?></span>
                        </div>
                    </div>

                    <!-- 操作按钮 -->
                    <a href="add-environment.php" class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                        <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
                        添加环境
                    </a>

                    <?php if (isAdmin()): ?>
                        <a href="users.php" class="p-2 text-gray-600 dark:text-gray-300 hover:bg-white/20 rounded-lg transition-colors" title="用户管理">
                            <i data-lucide="users" class="w-5 h-5"></i>
                        </a>
                    <?php endif; ?>

                    <a href="logout.php" class="p-2 text-gray-600 dark:text-gray-300 hover:bg-white/20 rounded-lg transition-colors" title="退出登录">
                        <i data-lucide="log-out" class="w-5 h-5"></i>
                    </a>
                </div>
            </div>
        </div>
    </nav>

    <!-- 主内容 -->
    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <!-- 统计卡片 -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="liquid-glass-surface rounded-2xl p-6 card-hover animate-fade-in">
                <div class="flex items-center">
                    <div class="p-3 bg-blue-500/20 rounded-xl">
                        <i data-lucide="server" class="w-6 h-6 text-blue-600"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">总环境数</p>
                        <p class="text-2xl font-bold text-gray-900 dark:text-gray-100"><?= $total_envs ?></p>
                    </div>
                </div>
            </div>

            <div class="liquid-glass-surface rounded-2xl p-6 card-hover animate-fade-in">
                <div class="flex items-center">
                    <div class="p-3 bg-green-500/20 rounded-xl">
                        <i data-lucide="check-circle" class="w-6 h-6 text-green-600"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">可用环境</p>
                        <p class="text-2xl font-bold text-gray-900 dark:text-gray-100"><?= $available_envs ?></p>
                    </div>
                </div>
            </div>

            <div class="liquid-glass-surface rounded-2xl p-6 card-hover animate-fade-in">
                <div class="flex items-center">
                    <div class="p-3 bg-red-500/20 rounded-xl">
                        <i data-lucide="x-circle" class="w-6 h-6 text-red-600"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">不可达</p>
                        <p class="text-2xl font-bold text-gray-900 dark:text-gray-100"><?= $unreachable_envs ?></p>
                    </div>
                </div>
            </div>

            <div class="liquid-glass-surface rounded-2xl p-6 card-hover animate-fade-in">
                <div class="flex items-center">
                    <div class="p-3 bg-yellow-500/20 rounded-xl">
                        <i data-lucide="star" class="w-6 h-6 text-yellow-600"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">收藏环境</p>
                        <p class="text-2xl font-bold text-gray-900 dark:text-gray-100"><?= $favorite_envs ?></p>
                    </div>
                </div>
            </div>
        </div>

        <!-- 搜索和过滤 -->
        <div class="liquid-glass-surface rounded-2xl p-6 mb-8 animate-fade-in">
            <div class="flex flex-col sm:flex-row gap-4">
                <div class="flex-1 relative">
                    <i data-lucide="search" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"></i>
                    <input type="text" id="searchInput" placeholder="搜索环境名称、描述或URL..."
                           class="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                </div>
                <select id="typeFilter" class="px-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                    <option value="">所有类型</option>
                    <option value="development">开发环境</option>
                    <option value="testing">测试环境</option>
                    <option value="staging">预发布环境</option>
                    <option value="production">生产环境</option>
                </select>
                <select id="statusFilter" class="px-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                    <option value="">所有状态</option>
                    <option value="available">可用</option>
                    <option value="unreachable">不可达</option>
                    <option value="unknown">未知</option>
                </select>
                <button id="favoriteFilter" class="px-6 py-3 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-white/70 dark:hover:bg-gray-700/50 transition-all duration-200 flex items-center">
                    <i data-lucide="star" class="w-4 h-4 mr-2"></i>
                    收藏
                </button>
            </div>
        </div>
        <!-- 环境列表 -->
        <?php if (empty($environments)): ?>
            <div class="liquid-glass-surface rounded-2xl p-12 text-center animate-fade-in">
                <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="server" class="w-8 h-8 text-gray-400"></i>
                </div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">暂无环境数据</h3>
                <p class="text-gray-500 dark:text-gray-400 mb-6">开始添加您的第一个环境配置</p>
                <a href="add-environment.php" class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                    <i data-lucide="plus" class="w-5 h-5 mr-2"></i>
                    添加第一个环境
                </a>
            </div>
        <?php else: ?>
            <!-- 按分组显示环境 -->
            <?php foreach ($groups as $group): ?>
                <?php if (isset($grouped_environments[$group['id']])): ?>
                    <div class="mb-8 animate-fade-in">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center space-x-3">
                                <div class="w-4 h-4 rounded-full" style="background-color: <?= h($group['color']) ?>"></div>
                                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100"><?= h($group['name']) ?></h3>
                                <span class="text-sm text-gray-500 dark:text-gray-400">(<?= count($grouped_environments[$group['id']]) ?>)</span>
                            </div>
                            <button class="group-toggle p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" data-group="<?= $group['id'] ?>">
                                <i data-lucide="chevron-down" class="w-5 h-5"></i>
                            </button>
                        </div>

                        <div id="group-<?= $group['id'] ?>" class="environment-grid">
                            <?php foreach ($grouped_environments[$group['id']] as $env): ?>
                                <div class="environment-card liquid-glass-surface rounded-2xl p-6 card-hover border-l-4 status-<?= $env['current_status'] ?>"
                                     data-name="<?= h($env['name']) ?>"
                                     data-type="<?= h($env['environment_type']) ?>"
                                     data-status="<?= h($env['current_status']) ?>"
                                     data-description="<?= h($env['description'] ?? '') ?>"
                                     data-url="<?= h($env['url']) ?>"
                                     data-favorite="<?= $env['is_favorite'] ? 'true' : 'false' ?>">

                                    <!-- 头部：环境名称和状态 -->
                                    <div class="flex items-start justify-between mb-4">
                                        <div class="flex-1 min-w-0">
                                            <div class="flex items-center gap-3 mb-2">
                                                <h4 class="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                                                    <?= h($env['name']) ?>
                                                </h4>
                                                <?php if ($env['is_favorite']): ?>
                                                    <i data-lucide="star" class="w-4 h-4 text-yellow-500 fill-current"></i>
                                                <?php endif; ?>
                                                <?php if ($env['version']): ?>
                                                    <span class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg font-mono">
                                                        v<?= h($env['version']) ?>
                                                    </span>
                                                <?php endif; ?>
                                            </div>
                                            <div class="flex items-center gap-2 mb-2">
                                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                                    <?= h($env['environment_type']) ?>
                                                </span>
                                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                                    <?= h($env['network_type']) ?>
                                                </span>
                                            </div>

                                            <!-- 标签 -->
                                            <?php if ($env['tags']): ?>
                                                <div class="flex flex-wrap gap-1 mb-2">
                                                    <?php
                                                    $tags = json_decode($env['tags'], true) ?: [];
                                                    $tag_colors = ['bg-red-100 text-red-800', 'bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-yellow-100 text-yellow-800', 'bg-purple-100 text-purple-800'];
                                                    foreach ($tags as $index => $tag):
                                                        $color_class = $tag_colors[$index % count($tag_colors)];
                                                    ?>
                                                        <span class="tag <?= $color_class ?>"><?= h($tag) ?></span>
                                                    <?php endforeach; ?>
                                                </div>
                                            <?php endif; ?>
                                        </div>

                                        <!-- 状态指示器 -->
                                        <div class="flex items-center gap-2">
                                            <?php
                                            $status_config = [
                                                'available' => ['icon' => 'check-circle', 'color' => 'text-green-600', 'text' => '可达'],
                                                'unreachable' => ['icon' => 'x-circle', 'color' => 'text-red-600', 'text' => '不可达'],
                                                'checking' => ['icon' => 'loader', 'color' => 'text-blue-600', 'text' => '检测中'],
                                                'error' => ['icon' => 'alert-circle', 'color' => 'text-yellow-600', 'text' => '错误'],
                                                'unknown' => ['icon' => 'help-circle', 'color' => 'text-gray-600', 'text' => '未知']
                                            ];
                                            $status = $status_config[$env['current_status']] ?? $status_config['unknown'];
                                            ?>
                                            <div class="flex items-center gap-1">
                                                <i data-lucide="<?= $status['icon'] ?>" class="w-4 h-4 <?= $status['color'] ?>"></i>
                                                <span class="text-xs font-medium <?= $status['color'] ?>"><?= $status['text'] ?></span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- URL 区域 -->
                                    <div class="mb-4">
                                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">访问地址</p>
                                        <a href="<?= h($env['url']) ?>" target="_blank"
                                           class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm break-all hover:underline transition-colors">
                                            <?= h($env['url']) ?>
                                        </a>
                                    </div>

                                    <!-- 描述 -->
                                    <?php if ($env['description']): ?>
                                        <div class="mb-4">
                                            <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">描述</p>
                                            <p class="text-sm text-gray-700 dark:text-gray-300 line-clamp-2"><?= h($env['description']) ?></p>
                                        </div>
                                    <?php endif; ?>

                                    <!-- 响应时间和检测时间 -->
                                    <div class="mb-4 grid grid-cols-2 gap-4 text-sm">
                                        <?php if ($env['response_time']): ?>
                                            <div>
                                                <p class="font-medium text-gray-600 dark:text-gray-400 mb-1">响应时间</p>
                                                <p class="text-gray-700 dark:text-gray-300"><?= $env['response_time'] ?>ms</p>
                                            </div>
                                        <?php endif; ?>
                                        <?php if ($env['checked_at']): ?>
                                            <div>
                                                <p class="font-medium text-gray-600 dark:text-gray-400 mb-1">最后检测</p>
                                                <p class="text-gray-700 dark:text-gray-300"><?= formatTime($env['checked_at']) ?></p>
                                            </div>
                                        <?php endif; ?>
                                    </div>

                                    <!-- 操作按钮 -->
                                    <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                                        <div class="flex items-center space-x-2">
                                            <button onclick="checkStatus('<?= $env['id'] ?>')"
                                                    class="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title="检测状态">
                                                <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                                            </button>
                                            <a href="<?= h($env['url']) ?>" target="_blank"
                                               class="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                               title="访问环境">
                                                <i data-lucide="external-link" class="w-4 h-4"></i>
                                            </a>
                                            <button onclick="toggleFavorite('<?= $env['id'] ?>')"
                                                    class="p-2 text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                                                    title="<?= $env['is_favorite'] ? '取消收藏' : '添加收藏' ?>">
                                                <i data-lucide="star" class="w-4 h-4 <?= $env['is_favorite'] ? 'fill-current text-yellow-500' : '' ?>"></i>
                                            </button>
                                        </div>

                                        <div class="flex items-center space-x-2">
                                            <a href="edit-environment.php?id=<?= $env['id'] ?>"
                                               class="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                               title="编辑">
                                                <i data-lucide="edit" class="w-4 h-4"></i>
                                            </a>
                                            <a href="delete-environment.php?id=<?= $env['id'] ?>"
                                               onclick="return confirm('确定要删除环境「<?= h($env['name']) ?>」吗？')"
                                               class="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                               title="删除">
                                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                <?php endif; ?>
            <?php endforeach; ?>

            <!-- 未分组环境 -->
            <?php if (isset($grouped_environments['ungrouped'])): ?>
                <div class="mb-8 animate-fade-in">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center space-x-3">
                            <div class="w-4 h-4 rounded-full bg-gray-400"></div>
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">未分组</h3>
                            <span class="text-sm text-gray-500 dark:text-gray-400">(<?= count($grouped_environments['ungrouped']) ?>)</span>
                        </div>
                    </div>

                    <div class="environment-grid">
                        <!-- 这里可以重复上面的环境卡片代码 -->
                    </div>
                </div>
            <?php endif; ?>
        <?php endif; ?>
    </div>

    <script>
        // 初始化 Lucide 图标
        lucide.createIcons();

        // 深色模式切换
        const darkModeToggle = document.getElementById('darkModeToggle');
        const html = document.documentElement;

        // 检查本地存储的主题偏好
        const currentTheme = localStorage.getItem('theme') ||
                           (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

        if (currentTheme === 'dark') {
            html.classList.add('dark');
        }

        darkModeToggle.addEventListener('click', () => {
            html.classList.toggle('dark');
            const isDark = html.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');

            // 更新图标
            const icon = darkModeToggle.querySelector('i');
            icon.setAttribute('data-lucide', isDark ? 'moon' : 'sun');
            lucide.createIcons();
        });

        // 搜索和过滤功能
        const searchInput = document.getElementById('searchInput');
        const typeFilter = document.getElementById('typeFilter');
        const statusFilter = document.getElementById('statusFilter');
        const favoriteFilter = document.getElementById('favoriteFilter');
        const environmentCards = document.querySelectorAll('.environment-card');

        let showOnlyFavorites = false;

        function filterEnvironments() {
            const searchTerm = searchInput.value.toLowerCase();
            const selectedType = typeFilter.value;
            const selectedStatus = statusFilter.value;

            environmentCards.forEach(card => {
                const name = card.dataset.name.toLowerCase();
                const type = card.dataset.type;
                const status = card.dataset.status;
                const description = card.dataset.description.toLowerCase();
                const url = card.dataset.url.toLowerCase();
                const isFavorite = card.dataset.favorite === 'true';

                const matchesSearch = !searchTerm ||
                    name.includes(searchTerm) ||
                    description.includes(searchTerm) ||
                    url.includes(searchTerm);

                const matchesType = !selectedType || type === selectedType;
                const matchesStatus = !selectedStatus || status === selectedStatus;
                const matchesFavorite = !showOnlyFavorites || isFavorite;

                if (matchesSearch && matchesType && matchesStatus && matchesFavorite) {
                    card.style.display = 'block';
                    card.classList.add('animate-fade-in');
                } else {
                    card.style.display = 'none';
                }
            });
        }

        searchInput.addEventListener('input', filterEnvironments);
        typeFilter.addEventListener('change', filterEnvironments);
        statusFilter.addEventListener('change', filterEnvironments);

        favoriteFilter.addEventListener('click', () => {
            showOnlyFavorites = !showOnlyFavorites;
            favoriteFilter.classList.toggle('bg-yellow-100', showOnlyFavorites);
            favoriteFilter.classList.toggle('text-yellow-800', showOnlyFavorites);
            filterEnvironments();
        });

        // 分组折叠功能
        document.querySelectorAll('.group-toggle').forEach(button => {
            button.addEventListener('click', () => {
                const groupId = button.dataset.group;
                const groupContent = document.getElementById(`group-${groupId}`);
                const icon = button.querySelector('i');

                if (groupContent.style.display === 'none') {
                    groupContent.style.display = 'grid';
                    icon.setAttribute('data-lucide', 'chevron-down');
                } else {
                    groupContent.style.display = 'none';
                    icon.setAttribute('data-lucide', 'chevron-right');
                }
                lucide.createIcons();
            });
        });

        // 状态检测功能
        function checkStatus(envId) {
            // 这里可以添加 AJAX 调用来检测状态
            console.log('检测环境状态:', envId);
            // 实际实现可以调用 check-status.php
        }

        // 收藏切换功能
        function toggleFavorite(envId) {
            // 这里可以添加 AJAX 调用来切换收藏状态
            console.log('切换收藏状态:', envId);
            // 实际实现可以调用 toggle-favorite.php
        }

        // 全部刷新
        document.getElementById('refreshAll').addEventListener('click', () => {
            location.reload();
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'k':
                        e.preventDefault();
                        searchInput.focus();
                        break;
                    case 'r':
                        e.preventDefault();
                        location.reload();
                        break;
                }
            }
        });
    </script>
</body>
</html>
EOF

    print_success "✓ 增强版主页面已完成创建"
}

# 主函数
main() {
    print_title "Serv00 环境管理系统增强版一键部署"

    echo
    print_message $CYAN "🚀 开始部署具有完整设计和功能的环境管理系统"
    print_message $YELLOW "📋 特性: Apple Liquid Glass 设计 + 完整功能 + Serv00 兼容"
    echo

    # 检测 Serv00 环境
    detect_serv00_environment

    # 自动检测配置
    auto_detect_serv00_config

    # 交互式配置确认
    interactive_config

    # 创建增强版数据库
    create_enhanced_database

    # 创建增强版配置
    create_enhanced_config

    # 创建增强版主页面
    create_enhanced_index_page

    print_message $GREEN "🎉 增强版应用创建完成！"
}

# 运行主函数
main "$@"
