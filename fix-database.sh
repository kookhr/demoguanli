#!/bin/bash
# 修复数据库配置问题的快速脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_message() {
    echo -e "${2}${1}${NC}"
}

print_step() {
    print_message "🔄 $1" $BLUE
}

print_success() {
    print_message "✅ $1" $GREEN
}

print_warning() {
    print_message "⚠️  $1" $YELLOW
}

print_error() {
    print_message "❌ $1" $RED
}

print_info() {
    print_message "ℹ️  $1" $PURPLE
}

# 数据库配置（根据您的实际配置）
DB_HOST="mysql14.serv00.com"
DB_NAME="em9785_environment_manager"
DB_USER="m9785_s14kook"

echo
print_message "🔧 数据库配置修复工具" $BLUE
echo

# 获取数据库密码
echo -n "请输入数据库密码: "
read -s DB_PASS
echo

# 测试数据库连接
test_connection() {
    print_step "测试数据库连接..."
    
    if mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" -e "SELECT 1;" >/dev/null 2>&1; then
        print_success "数据库连接成功"
        return 0
    else
        print_error "数据库连接失败"
        return 1
    fi
}

# 检查数据库是否存在
check_database() {
    print_step "检查数据库是否存在..."
    
    if mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" -e "USE $DB_NAME;" >/dev/null 2>&1; then
        print_success "数据库 $DB_NAME 存在"
        return 0
    else
        print_error "数据库 $DB_NAME 不存在"
        return 1
    fi
}

# 显示数据库列表
show_databases() {
    print_step "显示可用的数据库..."
    
    echo "您的数据库列表："
    mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" -e "SHOW DATABASES;" 2>/dev/null | grep -v "Database\|information_schema\|performance_schema\|mysql"
}

# 创建数据库（如果不存在）
create_database() {
    print_step "尝试创建数据库..."
    
    if mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null; then
        print_success "数据库创建成功"
        return 0
    else
        print_error "数据库创建失败"
        print_warning "可能的原因："
        echo "   1. 用户没有创建数据库的权限"
        echo "   2. 数据库名称不符合 Serv00 命名规范"
        echo "   3. 已达到数据库数量限制"
        return 1
    fi
}

# 初始化数据库
init_database() {
    print_step "初始化数据库..."
    
    if [ ! -f "database/init.sql" ]; then
        print_error "未找到 database/init.sql 文件"
        return 1
    fi
    
    # 检查数据库是否已有表
    table_count=$(mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW TABLES;" 2>/dev/null | wc -l)
    
    if [ "$table_count" -gt 1 ]; then
        print_warning "数据库已包含 $((table_count-1)) 个表"
        echo -n "是否要重新初始化数据库？这将删除所有现有数据 (y/N): "
        read -r confirm
        
        if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
            print_step "清空数据库..."
            mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SET FOREIGN_KEY_CHECKS = 0; DROP TABLE IF EXISTS environments, users, status_history, user_sessions, environment_groups; SET FOREIGN_KEY_CHECKS = 1;" 2>/dev/null
        else
            print_info "跳过数据库初始化"
            return 0
        fi
    fi
    
    # 导入数据库结构
    if mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < database/init.sql 2>/dev/null; then
        print_success "数据库初始化完成"
        
        # 显示创建的表
        print_info "已创建的表："
        mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW TABLES;" 2>/dev/null
        
        return 0
    else
        print_error "数据库初始化失败"
        return 1
    fi
}

# 更新配置文件
update_config() {
    print_step "更新配置文件..."
    
    # 创建 .env 文件
    cat > .env << EOF
# Serv00 环境管理系统配置
DB_HOST=$DB_HOST
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS

APP_DEBUG=false
APP_URL=https://do.kandy.dpdns.org
APP_PORT=62595

JWT_SECRET=serv00-env-manager-secret-$(date +%s)
LOG_LEVEL=info

MAIL_DRIVER=smtp
MAIL_HOST=mail.serv00.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=tls
EOF
    
    print_success ".env 配置文件已更新"
    
    # 更新 PHP 数据库配置
    if [ -f "api/config/database.php" ]; then
        print_step "更新 PHP 数据库配置..."
        
        # 备份原文件
        cp api/config/database.php api/config/database.php.backup
        
        # 更新配置
        sed -i.bak "s/localhost/$DB_HOST/g" api/config/database.php
        sed -i.bak "s/environment_manager/$DB_NAME/g" api/config/database.php
        sed -i.bak "s/'root'/'$DB_USER'/g" api/config/database.php
        
        print_success "PHP 配置已更新"
    fi
}

# 主函数
main() {
    print_info "当前配置："
    echo "   数据库主机: $DB_HOST"
    echo "   数据库名称: $DB_NAME"
    echo "   数据库用户: $DB_USER"
    echo
    
    # 测试连接
    if ! test_connection; then
        print_error "无法连接到数据库，请检查："
        echo "   1. 数据库密码是否正确"
        echo "   2. 数据库服务器是否可访问"
        echo "   3. 用户权限是否正确"
        exit 1
    fi
    
    # 显示数据库列表
    show_databases
    echo
    
    # 检查数据库
    if ! check_database; then
        print_warning "数据库不存在，尝试创建..."
        
        if ! create_database; then
            print_error "请手动在 Serv00 面板中创建数据库"
            print_info "创建步骤："
            echo "   1. 登录 Serv00 面板"
            echo "   2. 进入 'MySQL' 部分"
            echo "   3. 创建数据库: $DB_NAME"
            echo "   4. 确保用户 $DB_USER 有访问权限"
            exit 1
        fi
    fi
    
    # 初始化数据库
    if init_database; then
        print_success "数据库配置完成"
    else
        print_error "数据库初始化失败"
        exit 1
    fi
    
    # 更新配置文件
    update_config
    
    echo
    print_message "🎉 数据库修复完成！" $GREEN
    echo
    print_info "下一步："
    echo "   1. 继续运行部署脚本"
    echo "   2. 或访问 https://do.kandy.dpdns.org 测试"
    echo
}

# 执行主函数
main "$@"
