#!/bin/bash

# 快速部署脚本 - 自动更新版本号和清除缓存

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        log_error "git 未安装"
        exit 1
    fi
    
    log_success "依赖检查通过"
}

# 更新版本号
update_version() {
    log_info "更新版本号..."
    
    # 获取当前版本
    current_version=$(grep 'APP_VERSION = ' wrangler.toml | sed 's/.*"\(.*\)".*/\1/')
    log_info "当前版本: $current_version"
    
    # 生成新版本号 (增加补丁版本)
    IFS='.' read -ra VERSION_PARTS <<< "$current_version"
    major=${VERSION_PARTS[0]}
    minor=${VERSION_PARTS[1]}
    patch=${VERSION_PARTS[2]}
    
    new_patch=$((patch + 1))
    new_version="$major.$minor.$new_patch"
    
    log_info "新版本: $new_version"
    
    # 更新 wrangler.toml
    sed -i.bak "s/APP_VERSION = \"$current_version\"/APP_VERSION = \"$new_version\"/" wrangler.toml
    
    # 更新构建时间
    current_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    sed -i.bak "s/BUILD_TIME = \".*\"/BUILD_TIME = \"$current_time\"/" wrangler.toml
    
    # 清理备份文件
    rm -f wrangler.toml.bak
    
    log_success "版本号已更新: $current_version -> $new_version"
    echo "$new_version" > .version
}

# 构建项目
build_project() {
    log_info "构建项目..."
    
    # 安装依赖
    npm ci
    
    # 构建
    npm run build
    
    log_success "项目构建完成"
}

# 部署到 Cloudflare
deploy_to_cloudflare() {
    log_info "部署到 Cloudflare Workers..."
    
    # 这里可以添加 wrangler deploy 命令
    # 但由于您使用 Dashboard 部署，我们只推送到 Git
    
    log_info "推送到 Git 仓库..."
    git add .
    
    new_version=$(cat .version)
    commit_message="🚀 快速部署 v$new_version - 自动版本更新

✅ 版本更新: $new_version
⏰ 构建时间: $(date)
🔄 缓存策略: 强制刷新
📦 构建状态: 成功

自动部署脚本生成的提交"
    
    git commit -m "$commit_message"
    git push origin workers
    
    log_success "代码已推送到 Git 仓库"
}

# 清除缓存 (如果有 API 访问权限)
clear_cache() {
    log_info "尝试清除缓存..."
    
    # 读取配置
    if [ -f ".env.local" ]; then
        source .env.local
    fi
    
    # 如果有 API 端点和认证信息，尝试清除缓存
    if [ ! -z "$WORKER_URL" ] && [ ! -z "$ADMIN_TOKEN" ]; then
        log_info "发送缓存清除请求..."
        
        response=$(curl -s -w "%{http_code}" -X POST \
            -H "Authorization: Bearer $ADMIN_TOKEN" \
            -H "Content-Type: application/json" \
            "$WORKER_URL/api/cache/clear" \
            -o /tmp/cache_response.json)
        
        if [ "$response" = "200" ]; then
            log_success "缓存清除成功"
        else
            log_warning "缓存清除失败 (HTTP $response)"
            log_info "请手动在管理面板中清除缓存"
        fi
    else
        log_warning "未配置 API 访问信息，跳过自动缓存清除"
        log_info "请在部署后手动清除缓存"
    fi
}

# 显示部署后步骤
show_post_deploy_steps() {
    new_version=$(cat .version)
    
    echo ""
    log_success "🎉 部署完成！"
    echo ""
    echo "📋 部署信息:"
    echo "   版本: $new_version"
    echo "   时间: $(date)"
    echo "   分支: workers"
    echo ""
    echo "🔄 后续步骤:"
    echo "   1. 等待 Cloudflare Pages 自动部署 (通常 1-3 分钟)"
    echo "   2. 访问管理面板的缓存管理页面"
    echo "   3. 点击 '清除缓存' 或 '强制刷新' 按钮"
    echo "   4. 刷新浏览器验证更新"
    echo ""
    echo "🌐 快速链接:"
    echo "   - Cloudflare Pages: https://dash.cloudflare.com/pages"
    echo "   - 项目仓库: https://github.com/kookhr/demoguanli/tree/workers"
    echo ""
    
    # 清理临时文件
    rm -f .version
}

# 主函数
main() {
    echo ""
    log_info "🚀 开始快速部署流程..."
    echo ""
    
    # 检查是否在正确的目录
    if [ ! -f "wrangler.toml" ]; then
        log_error "未找到 wrangler.toml 文件，请在项目根目录运行此脚本"
        exit 1
    fi
    
    # 执行部署流程
    check_dependencies
    update_version
    build_project
    deploy_to_cloudflare
    clear_cache
    show_post_deploy_steps
    
    log_success "✨ 快速部署流程完成！"
}

# 处理中断信号
trap 'log_error "部署被中断"; exit 1' INT TERM

# 运行主函数
main "$@"
