#!/bin/bash
# 修复安装目录问题的脚本

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
WRONG_DIR="$HOME/domains/s14kook.serv00.net/public_html"
CORRECT_DIR="$HOME/domains/do.kandy.dpdns.org/public_html"
PROJECT_NAME="demoguanli"

echo
print_message "🔧 修复安装目录问题" $BLUE
echo

print_info "错误目录: $WRONG_DIR"
print_info "正确目录: $CORRECT_DIR"
echo

# 检查错误目录是否存在项目
check_wrong_directory() {
    print_step "检查错误目录中的项目..."
    
    if [ -d "$WRONG_DIR/$PROJECT_NAME" ]; then
        print_warning "发现项目在错误目录: $WRONG_DIR/$PROJECT_NAME"
        
        # 显示项目内容
        print_info "项目文件列表:"
        ls -la "$WRONG_DIR/$PROJECT_NAME" | head -10
        
        return 0
    else
        print_info "错误目录中没有项目"
        return 1
    fi
}

# 创建正确目录
create_correct_directory() {
    print_step "创建正确的目录结构..."
    
    # 创建域名目录
    local domain_dir="$HOME/domains/do.kandy.dpdns.org"
    if [ ! -d "$domain_dir" ]; then
        mkdir -p "$domain_dir"
        print_success "创建域名目录: $domain_dir"
    fi
    
    # 创建 public_html 目录
    if [ ! -d "$CORRECT_DIR" ]; then
        mkdir -p "$CORRECT_DIR"
        print_success "创建 public_html 目录: $CORRECT_DIR"
    fi
    
    print_success "目录结构创建完成"
}

# 移动项目文件
move_project() {
    print_step "移动项目文件到正确目录..."
    
    local source_dir="$WRONG_DIR/$PROJECT_NAME"
    local target_dir="$CORRECT_DIR/$PROJECT_NAME"
    
    if [ ! -d "$source_dir" ]; then
        print_error "源目录不存在: $source_dir"
        return 1
    fi
    
    # 如果目标目录已存在，先备份
    if [ -d "$target_dir" ]; then
        print_warning "目标目录已存在，创建备份..."
        mv "$target_dir" "${target_dir}.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # 移动项目
    print_step "移动项目文件..."
    mv "$source_dir" "$target_dir"
    print_success "项目移动完成"
    
    # 验证移动结果
    if [ -d "$target_dir" ]; then
        print_success "✓ 项目现在位于: $target_dir"
        
        # 显示项目内容
        print_info "项目文件列表:"
        ls -la "$target_dir" | head -10
    else
        print_error "项目移动失败"
        return 1
    fi
}

# 部署文件到根目录
deploy_to_root() {
    print_step "部署文件到域名根目录..."
    
    local project_dir="$CORRECT_DIR/$PROJECT_NAME"
    
    if [ ! -d "$project_dir" ]; then
        print_error "项目目录不存在: $project_dir"
        return 1
    fi
    
    cd "$project_dir"
    
    # 检查是否有构建文件
    if [ -d "dist" ]; then
        print_step "发现构建文件，部署到根目录..."
        
        # 备份现有文件
        if [ -f "$CORRECT_DIR/index.html" ]; then
            print_warning "备份现有文件..."
            mkdir -p "$CORRECT_DIR/backup.$(date +%Y%m%d_%H%M%S)"
            mv "$CORRECT_DIR"/*.html "$CORRECT_DIR/backup.$(date +%Y%m%d_%H%M%S)/" 2>/dev/null || true
            mv "$CORRECT_DIR/assets" "$CORRECT_DIR/backup.$(date +%Y%m%d_%H%M%S)/" 2>/dev/null || true
        fi
        
        # 复制构建文件到根目录
        cp -r dist/* "$CORRECT_DIR/"
        print_success "前端文件部署完成"
    else
        print_warning "未找到 dist 目录，需要重新构建"
    fi
    
    # 复制 API 文件
    if [ -d "api" ]; then
        cp -r api "$CORRECT_DIR/"
        print_success "API 文件部署完成"
    fi
    
    # 复制数据库文件
    if [ -d "database" ]; then
        cp -r database "$CORRECT_DIR/"
        print_success "数据库文件部署完成"
    fi
    
    # 复制配置文件
    if [ -f ".htaccess" ]; then
        cp .htaccess "$CORRECT_DIR/"
        print_success ".htaccess 文件部署完成"
    fi
    
    if [ -f ".env" ]; then
        cp .env "$CORRECT_DIR/"
        print_success ".env 文件部署完成"
    fi
    
    # 设置权限
    print_step "设置文件权限..."
    cd "$CORRECT_DIR"
    find . -type d -exec chmod 755 {} \;
    find . -type f -exec chmod 644 {} \;
    print_success "权限设置完成"
}

# 验证部署
verify_deployment() {
    print_step "验证部署结果..."
    
    cd "$CORRECT_DIR"
    
    # 检查关键文件
    local required_files=(
        "index.html"
        "api/index.php"
        ".htaccess"
    )
    
    local missing_files=0
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            print_success "✓ $file 存在"
        else
            print_error "✗ $file 缺失"
            ((missing_files++))
        fi
    done
    
    if [ $missing_files -eq 0 ]; then
        print_success "所有关键文件都已正确部署"
        
        # 显示最终文件结构
        print_info "最终文件结构:"
        ls -la | head -15
        
        return 0
    else
        print_error "发现 $missing_files 个缺失文件"
        return 1
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
                print_warning "⚠ 仍有 502 错误，可能需要额外配置"
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
    print_info "开始修复安装目录问题..."
    echo
    
    # 检查错误目录
    if check_wrong_directory; then
        echo
        
        # 创建正确目录
        create_correct_directory
        echo
        
        # 移动项目
        if move_project; then
            echo
            
            # 部署到根目录
            deploy_to_root
            echo
            
            # 验证部署
            if verify_deployment; then
                echo
                
                # 测试访问
                test_access
                echo
                
                print_message "🎉 目录修复完成！" $GREEN
                echo
                print_info "现在可以访问:"
                echo "   前端: https://do.kandy.dpdns.org"
                echo "   API: https://do.kandy.dpdns.org/api/health"
                echo
                print_info "如果仍有问题，请运行:"
                echo "   ./diagnose-502.sh"
            else
                print_error "部署验证失败"
                exit 1
            fi
        else
            print_error "项目移动失败"
            exit 1
        fi
    else
        print_info "未发现需要移动的项目"
        print_info "请检查项目是否已在正确位置: $CORRECT_DIR"
    fi
}

# 执行主函数
main "$@"
