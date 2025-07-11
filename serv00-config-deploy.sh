#!/bin/bash
# Serv00 配置文件版环境管理系统一键部署脚本
# 基于配置文件的极简架构，无数据库依赖
# 使用方法: bash -i <(curl -SL https://raw.githubusercontent.com/kookhr/demoguanli/serv00/serv00-config-deploy.sh)

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
PROJECT_NAME="environment-manager-config"
GITHUB_REPO="https://github.com/kookhr/demoguanli.git"
GITHUB_BRANCH="serv00"

# 安装配置
INSTALL_DIR=""
DOMAIN_NAME=""
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
    
    # 检测当前用户
    DETECTED_USER=$(whoami)
    print_info "当前用户: $DETECTED_USER"
    
    # 检测域名配置
    local domains_dir="/usr/home/$DETECTED_USER/domains"
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
    print_title "配置文件版环境管理系统配置"
    
    echo
    print_message $CYAN "📋 自动检测到的配置:"
    echo "   域名: ${DOMAIN_NAME:-'未检测到'}"
    echo "   安装目录: ${INSTALL_DIR:-'未检测到'}"
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
    echo "   域名: $DOMAIN_NAME"
    echo
}

# 创建配置文件目录和示例配置
create_config_files() {
    print_step "创建配置文件和目录结构..."
    
    cd "$INSTALL_DIR"
    
    # 创建目录结构
    mkdir -p config
    mkdir -p assets/css
    mkdir -p assets/js
    mkdir -p assets/images
    
    # 创建环境配置文件
    cat > config/environments.json << 'EOF'
{
  "version": "2.0.0",
  "lastUpdated": "2024-01-15T10:30:00Z",
  "environments": [
    {
      "id": "env-001",
      "name": "开发环境",
      "url": "https://dev.example.com",
      "description": "主要开发环境，用于日常开发和调试",
      "version": "1.2.3",
      "type": "development",
      "network": "external",
      "groupId": "group-dev",
      "tags": ["开发", "前端", "API"],
      "priority": 1,
      "isActive": true,
      "metadata": {
        "maintainer": "开发团队",
        "healthCheckPath": "/health",
        "expectedStatusCode": 200,
        "timeout": 10000
      }
    },
    {
      "id": "env-002",
      "name": "测试环境",
      "url": "https://test.example.com",
      "description": "QA 测试环境，用于功能测试和回归测试",
      "version": "1.2.2",
      "type": "testing",
      "network": "external",
      "groupId": "group-test",
      "tags": ["测试", "QA", "自动化"],
      "priority": 2,
      "isActive": true,
      "metadata": {
        "maintainer": "QA 团队",
        "healthCheckPath": "/api/status",
        "expectedStatusCode": 200,
        "timeout": 15000
      }
    },
    {
      "id": "env-003",
      "name": "生产环境",
      "url": "https://prod.example.com",
      "description": "生产环境，对外提供服务",
      "version": "1.2.0",
      "type": "production",
      "network": "external",
      "groupId": "group-prod",
      "tags": ["生产", "稳定", "监控"],
      "priority": 3,
      "isActive": true,
      "metadata": {
        "maintainer": "运维团队",
        "healthCheckPath": "/api/health",
        "expectedStatusCode": 200,
        "timeout": 5000
      }
    }
  ]
}
EOF

    # 创建分组配置文件
    cat > config/groups.json << 'EOF'
{
  "version": "2.0.0",
  "lastUpdated": "2024-01-15T10:30:00Z",
  "groups": [
    {
      "id": "group-dev",
      "name": "开发环境",
      "description": "开发阶段使用的环境",
      "color": "#10B981",
      "icon": "code",
      "sortOrder": 1,
      "isCollapsed": false
    },
    {
      "id": "group-test",
      "name": "测试环境",
      "description": "测试阶段使用的环境",
      "color": "#3B82F6",
      "icon": "test-tube",
      "sortOrder": 2,
      "isCollapsed": false
    },
    {
      "id": "group-prod",
      "name": "生产环境",
      "description": "生产和预发布环境",
      "color": "#EF4444",
      "icon": "server",
      "sortOrder": 3,
      "isCollapsed": false
    }
  ]
}
EOF

    # 创建应用设置文件
    cat > config/settings.json << 'EOF'
{
  "version": "2.0.0",
  "lastUpdated": "2024-01-15T10:30:00Z",
  "app": {
    "name": "环境管理系统",
    "description": "基于配置文件的现代化环境管理系统",
    "version": "2.0.0"
  },
  "ui": {
    "theme": {
      "default": "light",
      "allowToggle": true,
      "followSystem": true
    },
    "layout": {
      "gridColumns": {
        "mobile": 1,
        "tablet": 2,
        "desktop": 3
      }
    }
  },
  "features": {
    "statusCheck": {
      "enabled": true,
      "interval": 300000,
      "timeout": 10000
    },
    "search": {
      "enabled": true,
      "placeholder": "搜索环境名称、描述或URL..."
    },
    "filters": {
      "enabled": true,
      "available": ["type", "network", "status", "group", "tags"]
    },
    "favorites": {
      "enabled": true,
      "persistInLocalStorage": true
    }
  }
}
EOF

    print_success "✓ 配置文件已创建"
}

# 主函数
main() {
    print_title "Serv00 配置文件版环境管理系统一键部署"
    
    echo
    print_message $CYAN "🚀 开始部署基于配置文件的环境管理系统"
    print_message $YELLOW "📋 特性: 零依赖 + 配置文件驱动 + 现代化设计"
    echo

    # 检测 Serv00 环境
    detect_serv00_environment
    
    # 交互式配置确认
    interactive_config
    
    # 创建配置文件
    create_config_files
    
    print_message $GREEN "🎉 配置文件版环境管理系统部署完成！"
}

# 运行主函数
main "$@"
