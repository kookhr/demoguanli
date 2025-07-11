#!/bin/bash
# 将文件从 demoguanli 子目录移动到域名根目录

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

# 配置
ROOT_DIR="$HOME/domains/do.kandy.dpdns.org/public_html"
PROJECT_DIR="$ROOT_DIR/demoguanli"

echo
print_message "🔧 移动文件到域名根目录" $BLUE
echo

print_info "项目目录: $PROJECT_DIR"
print_info "目标目录: $ROOT_DIR"
echo

# 检查当前状态
check_current_state() {
    print_step "检查当前文件状态..."
    
    if [ ! -d "$PROJECT_DIR" ]; then
        print_error "项目目录不存在: $PROJECT_DIR"
        exit 1
    fi
    
    print_success "找到项目目录"
    
    # 显示项目目录内容
    print_info "项目目录内容:"
    ls -la "$PROJECT_DIR" | head -10
    echo
    
    # 检查是否有构建文件
    if [ -d "$PROJECT_DIR/dist" ]; then
        print_success "发现构建文件 (dist 目录)"
    else
        print_warning "未发现构建文件，需要先构建"
    fi
}

# 备份现有文件
backup_existing_files() {
    print_step "备份根目录现有文件..."
    
    cd "$ROOT_DIR"
    
    # 创建备份目录
    local backup_dir="backup-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # 备份现有文件（排除 demoguanli 目录）
    local files_to_backup=()
    for item in *; do
        if [ "$item" != "demoguanli" ] && [ "$item" != "$backup_dir" ]; then
            files_to_backup+=("$item")
        fi
    done
    
    if [ ${#files_to_backup[@]} -gt 0 ]; then
        print_warning "备份现有文件到: $backup_dir"
        mv "${files_to_backup[@]}" "$backup_dir/" 2>/dev/null || true
        print_success "备份完成"
    else
        print_info "根目录没有需要备份的文件"
        rmdir "$backup_dir"
    fi
}

# 构建项目（如果需要）
build_project() {
    print_step "检查是否需要构建项目..."
    
    cd "$PROJECT_DIR"
    
    if [ -d "dist" ] && [ -f "dist/index.html" ]; then
        print_success "发现有效的构建文件"
        return 0
    fi
    
    print_warning "需要重新构建项目"
    
    if [ ! -f "package.json" ]; then
        print_error "未找到 package.json"
        return 1
    fi
    
    # 检查 Node.js
    if ! command -v npm >/dev/null 2>&1; then
        print_error "npm 不可用，无法构建"
        return 1
    fi
    
    print_step "安装依赖..."
    npm install --no-audit --no-fund
    
    print_step "构建项目..."
    npm run build
    
    if [ -f "dist/index.html" ]; then
        print_success "项目构建完成"
        return 0
    else
        print_error "项目构建失败"
        return 1
    fi
}

# 移动文件到根目录
move_files_to_root() {
    print_step "移动文件到根目录..."
    
    cd "$PROJECT_DIR"
    
    # 移动构建文件
    if [ -d "dist" ]; then
        print_step "移动前端文件..."
        cp -r dist/* "$ROOT_DIR/"
        print_success "前端文件移动完成"
    fi
    
    # 移动 API 文件
    if [ -d "api" ]; then
        print_step "移动 API 文件..."
        cp -r api "$ROOT_DIR/"
        print_success "API 文件移动完成"
    fi
    
    # 移动数据库文件
    if [ -d "database" ]; then
        print_step "移动数据库文件..."
        cp -r database "$ROOT_DIR/"
        print_success "数据库文件移动完成"
    fi
    
    # 移动配置文件
    local config_files=(
        ".htaccess"
        ".env"
        "serv00-htaccess"
    )
    
    for file in "${config_files[@]}"; do
        if [ -f "$file" ]; then
            cp "$file" "$ROOT_DIR/"
            print_success "移动配置文件: $file"
        fi
    done
    
    # 如果没有 .htaccess，从 serv00-htaccess 创建
    if [ ! -f "$ROOT_DIR/.htaccess" ] && [ -f "$ROOT_DIR/serv00-htaccess" ]; then
        cp "$ROOT_DIR/serv00-htaccess" "$ROOT_DIR/.htaccess"
        print_success "从 serv00-htaccess 创建 .htaccess"
    fi
}

# 设置权限
set_permissions() {
    print_step "设置文件权限..."
    
    cd "$ROOT_DIR"
    
    # 设置目录权限
    find . -type d -exec chmod 755 {} \;
    
    # 设置文件权限
    find . -type f -exec chmod 644 {} \;
    
    # 设置脚本权限
    find . -name "*.sh" -exec chmod +x {} \;
    
    print_success "权限设置完成"
}

# 验证部署
verify_deployment() {
    print_step "验证部署结果..."
    
    cd "$ROOT_DIR"
    
    # 检查关键文件
    local required_files=(
        "index.html"
        "api/index.php"
        ".htaccess"
    )
    
    local missing_files=0
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            print_success "✓ $file"
        else
            print_error "✗ $file 缺失"
            ((missing_files++))
        fi
    done
    
    if [ $missing_files -eq 0 ]; then
        print_success "所有关键文件都已正确部署"
        
        # 显示根目录文件结构
        print_info "根目录文件结构:"
        ls -la | grep -v "^d.*demoguanli" | head -15
        
        return 0
    else
        print_error "发现 $missing_files 个缺失文件"
        return 1
    fi
}

# 清理项目目录
cleanup_project_directory() {
    print_step "清理项目目录..."
    
    echo -n "是否要删除项目目录 $PROJECT_DIR？(y/N): "
    read -r confirm
    
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        print_warning "删除项目目录..."
        rm -rf "$PROJECT_DIR"
        print_success "项目目录已删除"
    else
        print_info "保留项目目录"
    fi
}

# 测试访问
test_access() {
    print_step "测试网站访问..."
    
    if command -v curl >/dev/null 2>&1; then
        local domain="do.kandy.dpdns.org"
        
        # 测试前端
        print_info "测试前端访问..."
        local response=$(curl -s -o /dev/null -w "%{http_code}" "https://$domain" 2>/dev/null || echo "000")
        
        case $response in
            200)
                print_success "✓ 前端访问正常 (HTTP $response)"
                ;;
            502)
                print_warning "⚠ 仍有 502 错误，可能需要检查配置"
                ;;
            *)
                print_info "前端响应: HTTP $response"
                ;;
        esac
        
        # 测试 API
        print_info "测试 API 访问..."
        local api_response=$(curl -s -o /dev/null -w "%{http_code}" "https://$domain/api/health" 2>/dev/null || echo "000")
        
        case $api_response in
            200)
                print_success "✓ API 访问正常 (HTTP $api_response)"
                ;;
            502)
                print_warning "⚠ API 仍有 502 错误，检查数据库配置"
                ;;
            *)
                print_info "API 响应: HTTP $api_response"
                ;;
        esac
    else
        print_warning "curl 不可用，请手动测试访问"
    fi
}

# 主函数
main() {
    print_info "开始移动文件到域名根目录..."
    echo
    
    # 检查当前状态
    check_current_state
    
    # 备份现有文件
    backup_existing_files
    echo
    
    # 构建项目（如果需要）
    if ! build_project; then
        print_error "项目构建失败"
        exit 1
    fi
    echo
    
    # 移动文件到根目录
    move_files_to_root
    echo
    
    # 设置权限
    set_permissions
    echo
    
    # 验证部署
    if verify_deployment; then
        echo
        
        # 测试访问
        test_access
        echo
        
        print_message "🎉 文件移动完成！" $GREEN
        echo
        print_info "现在可以访问:"
        echo "   前端: https://do.kandy.dpdns.org"
        echo "   API: https://do.kandy.dpdns.org/api/health"
        echo
        
        # 清理项目目录
        cleanup_project_directory
        
    else
        print_error "部署验证失败"
        exit 1
    fi
}

# 执行主函数
main "$@"
