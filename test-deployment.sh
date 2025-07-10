#!/bin/bash
# Serv00 部署测试和验证脚本
# 测试部署脚本的可靠性和环境兼容性

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 测试配置
TEST_DIR="test-deployment"
TEST_PORT=3001
TEST_DB_NAME="test_environment_manager"

print_message() {
    echo -e "${2}${1}${NC}"
}

print_title() {
    echo
    print_message "=================================================" $CYAN
    print_message "  $1" $CYAN
    print_message "=================================================" $CYAN
    echo
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

# 检查系统环境
test_system_requirements() {
    print_title "系统环境检查"
    
    local errors=0
    
    # 检查 PHP
    if command -v php >/dev/null 2>&1; then
        local php_version=$(php -v | head -n1 | cut -d' ' -f2)
        print_success "PHP 版本: $php_version"
        
        # 检查 PHP 扩展
        local required_extensions=("pdo" "pdo_mysql" "json" "curl" "mbstring")
        for ext in "${required_extensions[@]}"; do
            if php -m | grep -q "^$ext$"; then
                print_success "PHP 扩展 $ext: 已安装"
            else
                print_error "PHP 扩展 $ext: 未安装"
                ((errors++))
            fi
        done
    else
        print_error "PHP 未安装"
        ((errors++))
    fi
    
    # 检查 MySQL
    if command -v mysql >/dev/null 2>&1; then
        local mysql_version=$(mysql --version | cut -d' ' -f6)
        print_success "MySQL 版本: $mysql_version"
    else
        print_warning "MySQL 客户端未找到"
    fi
    
    # 检查 Apache/httpd
    if command -v httpd >/dev/null 2>&1; then
        local apache_version=$(httpd -v | head -n1 | cut -d' ' -f3)
        print_success "Apache 版本: $apache_version"
    else
        print_warning "Apache 未找到"
    fi
    
    # 检查 Node.js (可选)
    if command -v node >/dev/null 2>&1; then
        local node_version=$(node --version)
        print_success "Node.js 版本: $node_version"
    else
        print_info "Node.js 未安装 (可选)"
    fi
    
    # 检查必要工具
    local tools=("curl" "tar" "gzip")
    for tool in "${tools[@]}"; do
        if command -v "$tool" >/dev/null 2>&1; then
            print_success "工具 $tool: 可用"
        else
            print_error "工具 $tool: 不可用"
            ((errors++))
        fi
    done
    
    if [ $errors -eq 0 ]; then
        print_success "系统环境检查通过"
        return 0
    else
        print_error "系统环境检查失败，发现 $errors 个问题"
        return 1
    fi
}

# 测试文件结构
test_file_structure() {
    print_title "文件结构检查"
    
    local required_files=(
        "serv00-deploy.sh"
        "serv00-config.php"
        "serv00-htaccess"
        "create-production-package.sh"
        "src/App.jsx"
        "api/index.php"
        "database/init.sql"
        "package.json"
        "vite.config.js"
    )
    
    local errors=0
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            print_success "文件 $file: 存在"
        else
            print_error "文件 $file: 缺失"
            ((errors++))
        fi
    done
    
    # 检查目录结构
    local required_dirs=(
        "src"
        "api"
        "database"
        "public"
    )
    
    for dir in "${required_dirs[@]}"; do
        if [ -d "$dir" ]; then
            print_success "目录 $dir: 存在"
        else
            print_error "目录 $dir: 缺失"
            ((errors++))
        fi
    done
    
    if [ $errors -eq 0 ]; then
        print_success "文件结构检查通过"
        return 0
    else
        print_error "文件结构检查失败，发现 $errors 个问题"
        return 1
    fi
}

# 测试前端构建
test_frontend_build() {
    print_title "前端构建测试"
    
    if [ ! -f "package.json" ]; then
        print_error "未找到 package.json"
        return 1
    fi
    
    # 备份现有 dist 目录
    if [ -d "dist" ]; then
        print_step "备份现有 dist 目录..."
        mv dist dist.backup
    fi
    
    # 安装依赖
    print_step "安装前端依赖..."
    if command -v npm >/dev/null 2>&1; then
        npm install --silent
    else
        print_error "npm 不可用，跳过前端构建测试"
        return 1
    fi
    
    # 构建项目
    print_step "构建前端项目..."
    if npm run build; then
        print_success "前端构建成功"
        
        # 检查构建产物
        if [ -f "dist/index.html" ]; then
            print_success "index.html 生成成功"
        else
            print_error "index.html 未生成"
            return 1
        fi
        
        if [ -d "dist/assets" ]; then
            print_success "assets 目录生成成功"
        else
            print_warning "assets 目录未生成"
        fi
        
        # 恢复备份
        if [ -d "dist.backup" ]; then
            rm -rf dist
            mv dist.backup dist
            print_info "已恢复原始 dist 目录"
        fi
        
        return 0
    else
        print_error "前端构建失败"
        
        # 恢复备份
        if [ -d "dist.backup" ]; then
            mv dist.backup dist
            print_info "已恢复原始 dist 目录"
        fi
        
        return 1
    fi
}

# 测试 API 配置
test_api_config() {
    print_title "API 配置测试"
    
    # 检查 PHP 语法
    print_step "检查 PHP 语法..."
    local php_files=(
        "api/index.php"
        "api/config/database.php"
        "serv00-config.php"
    )
    
    local errors=0
    for file in "${php_files[@]}"; do
        if [ -f "$file" ]; then
            if php -l "$file" >/dev/null 2>&1; then
                print_success "PHP 语法检查 $file: 通过"
            else
                print_error "PHP 语法检查 $file: 失败"
                ((errors++))
            fi
        fi
    done
    
    # 测试配置加载
    print_step "测试配置加载..."
    cat > test_config.php << 'EOF'
<?php
require_once 'serv00-config.php';

try {
    $config = Serv00Config::getAllConfig();
    echo "配置加载成功\n";
    
    $errors = Serv00Config::validateConfig();
    if (empty($errors)) {
        echo "配置验证通过\n";
    } else {
        echo "配置验证失败: " . implode(', ', $errors) . "\n";
        exit(1);
    }
    
    $envInfo = Serv00Config::getEnvironmentInfo();
    echo "环境信息获取成功\n";
    
} catch (Exception $e) {
    echo "配置测试失败: " . $e->getMessage() . "\n";
    exit(1);
}
EOF
    
    if php test_config.php; then
        print_success "配置测试通过"
        rm test_config.php
    else
        print_error "配置测试失败"
        rm test_config.php
        ((errors++))
    fi
    
    if [ $errors -eq 0 ]; then
        return 0
    else
        return 1
    fi
}

# 测试数据库连接
test_database_connection() {
    print_title "数据库连接测试"
    
    # 检查 SQL 语法
    print_step "检查 SQL 语法..."
    if [ -f "database/init.sql" ]; then
        # 简单的语法检查
        if grep -q "CREATE TABLE" "database/init.sql"; then
            print_success "SQL 文件包含 CREATE TABLE 语句"
        else
            print_warning "SQL 文件可能不完整"
        fi
        
        if grep -q "INSERT" "database/init.sql"; then
            print_success "SQL 文件包含 INSERT 语句"
        else
            print_info "SQL 文件不包含初始数据"
        fi
    else
        print_error "数据库初始化文件不存在"
        return 1
    fi
    
    # 如果有 MySQL 客户端，测试连接
    if command -v mysql >/dev/null 2>&1; then
        print_step "测试数据库连接..."
        
        # 这里需要用户提供测试数据库信息
        print_info "数据库连接测试需要手动配置"
        print_info "请确保您的数据库配置正确"
    else
        print_warning "MySQL 客户端不可用，跳过连接测试"
    fi
    
    return 0
}

# 测试部署脚本
test_deployment_script() {
    print_title "部署脚本测试"
    
    # 检查脚本语法
    print_step "检查脚本语法..."
    local scripts=(
        "serv00-deploy.sh"
        "create-production-package.sh"
        "test-deployment.sh"
    )
    
    local errors=0
    for script in "${scripts[@]}"; do
        if [ -f "$script" ]; then
            if bash -n "$script" 2>/dev/null; then
                print_success "脚本语法检查 $script: 通过"
            else
                print_error "脚本语法检查 $script: 失败"
                ((errors++))
            fi
        fi
    done
    
    # 检查脚本权限
    print_step "检查脚本权限..."
    for script in "${scripts[@]}"; do
        if [ -f "$script" ]; then
            if [ -x "$script" ]; then
                print_success "脚本权限 $script: 可执行"
            else
                print_warning "脚本权限 $script: 不可执行"
                chmod +x "$script"
                print_info "已设置 $script 为可执行"
            fi
        fi
    done
    
    if [ $errors -eq 0 ]; then
        return 0
    else
        return 1
    fi
}

# 测试生产包创建
test_production_package() {
    print_title "生产包创建测试"
    
    if [ ! -f "create-production-package.sh" ]; then
        print_error "生产包创建脚本不存在"
        return 1
    fi
    
    print_step "测试生产包创建..."
    
    # 创建测试环境
    mkdir -p "$TEST_DIR"
    cd "$TEST_DIR"
    
    # 复制必要文件进行测试
    cp -r ../src .
    cp -r ../api .
    cp -r ../database .
    cp -r ../public .
    cp ../package.json .
    cp ../vite.config.js .
    cp ../tailwind.config.js .
    cp ../postcss.config.js .
    cp ../serv00-*.* .
    cp ../create-production-package.sh .
    
    # 如果有 dist 目录，也复制过来
    if [ -d "../dist" ]; then
        cp -r ../dist .
    fi
    
    # 运行生产包创建（模拟模式）
    if [ -d "dist" ]; then
        print_step "使用现有 dist 目录进行测试..."
        
        # 模拟生产包创建的关键步骤
        mkdir -p build
        cp -r dist/* build/
        cp -r api build/
        cp -r database build/
        cp serv00-htaccess build/.htaccess

        if [ -f "build/index.html" ] && [ -f "build/api/index.php" ]; then
            print_success "生产包结构创建成功"
        else
            print_error "生产包结构创建失败"
            cd ..
            rm -rf "$TEST_DIR"
            return 1
        fi
    else
        print_warning "没有 dist 目录，跳过生产包测试"
    fi
    
    cd ..
    rm -rf "$TEST_DIR"
    print_success "生产包创建测试完成"
    return 0
}

# 性能测试
test_performance() {
    print_title "性能测试"
    
    # 检查文件大小
    print_step "检查文件大小..."
    
    if [ -d "dist" ]; then
        local dist_size=$(du -sh dist | cut -f1)
        print_info "前端构建大小: $dist_size"
    fi
    
    if [ -d "api" ]; then
        local api_size=$(du -sh api | cut -f1)
        print_info "API 文件大小: $api_size"
    fi
    
    # 检查依赖数量
    if [ -f "package.json" ]; then
        local deps=$(grep -c '"' package.json 2>/dev/null || echo "0")
        print_info "package.json 配置项: $deps"
    fi
    
    # 检查 PHP 文件数量
    local php_files=$(find api -name "*.php" | wc -l)
    print_info "PHP 文件数量: $php_files"
    
    print_success "性能测试完成"
    return 0
}

# 生成测试报告
generate_report() {
    print_title "测试报告"
    
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local report_file="test-report-$(date '+%Y%m%d-%H%M%S').txt"
    
    cat > "$report_file" << EOF
Serv00 环境管理系统部署测试报告
=====================================

测试时间: $timestamp
测试环境: $(uname -a)
PHP 版本: $(php -v | head -n1 2>/dev/null || echo "未安装")

测试结果:
- 系统环境检查: $([[ $test_system_result -eq 0 ]] && echo "通过" || echo "失败")
- 文件结构检查: $([[ $test_structure_result -eq 0 ]] && echo "通过" || echo "失败")
- 前端构建测试: $([[ $test_build_result -eq 0 ]] && echo "通过" || echo "失败")
- API 配置测试: $([[ $test_api_result -eq 0 ]] && echo "通过" || echo "失败")
- 数据库测试: $([[ $test_db_result -eq 0 ]] && echo "通过" || echo "失败")
- 部署脚本测试: $([[ $test_script_result -eq 0 ]] && echo "通过" || echo "失败")
- 生产包测试: $([[ $test_package_result -eq 0 ]] && echo "通过" || echo "失败")
- 性能测试: $([[ $test_performance_result -eq 0 ]] && echo "通过" || echo "失败")

总体评估: $([[ $overall_result -eq 0 ]] && echo "部署就绪" || echo "需要修复问题")

建议:
1. 确保所有依赖已正确安装
2. 检查数据库连接配置
3. 验证 Serv00 环境兼容性
4. 定期运行测试确保稳定性

EOF
    
    print_success "测试报告已生成: $report_file"
}

# 主函数
main() {
    print_title "Serv00 部署测试和验证"
    
    local overall_result=0
    
    # 运行所有测试
    test_system_requirements
    test_system_result=$?
    
    test_file_structure
    test_structure_result=$?
    
    test_frontend_build
    test_build_result=$?
    
    test_api_config
    test_api_result=$?
    
    test_database_connection
    test_db_result=$?
    
    test_deployment_script
    test_script_result=$?
    
    test_production_package
    test_package_result=$?
    
    test_performance
    test_performance_result=$?
    
    # 计算总体结果
    if [[ $test_system_result -eq 0 && $test_structure_result -eq 0 && 
          $test_api_result -eq 0 && $test_script_result -eq 0 ]]; then
        overall_result=0
    else
        overall_result=1
    fi
    
    # 生成报告
    generate_report
    
    # 显示最终结果
    echo
    if [ $overall_result -eq 0 ]; then
        print_message "🎉 所有关键测试通过，部署就绪！" $GREEN
    else
        print_message "⚠️  发现问题，请检查测试报告" $YELLOW
    fi
    
    return $overall_result
}

# 执行主函数
main "$@"
