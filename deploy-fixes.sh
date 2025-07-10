#!/bin/bash

# 环境管理系统修复部署脚本
# 修复三个关键bug并重新部署

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

DOMAIN="do.kandy.dpdns.org"
SITE_DIR="/usr/home/s14kook/domains/$DOMAIN/public_html"

echo -e "${BOLD}${BLUE}🔧 环境管理系统修复部署${NC}"
echo -e "${CYAN}目标域名: $DOMAIN${NC}"
echo -e "${CYAN}部署目录: $SITE_DIR${NC}"
echo ""

# 步骤1: 备份当前配置
backup_config() {
    echo -e "${BLUE}📋 步骤1: 备份当前配置${NC}"
    
    if [ -f "$SITE_DIR/api/.env" ]; then
        cp "$SITE_DIR/api/.env" "/tmp/backup_env_$(date +%Y%m%d_%H%M%S)"
        echo -e "${GREEN}✅ 配置文件已备份${NC}"
    else
        echo -e "${YELLOW}⚠️  配置文件不存在，跳过备份${NC}"
    fi
    echo ""
}

# 步骤2: 更新代码
update_code() {
    echo -e "${BLUE}📋 步骤2: 更新代码${NC}"
    
    cd "$SITE_DIR"
    
    # 拉取最新代码
    if [ -d ".git" ]; then
        echo "🔄 更新现有代码..."
        git fetch origin serv00
        git reset --hard origin/serv00
    else
        echo "📥 下载最新代码..."
        rm -rf temp_project
        git clone -b serv00 https://github.com/kookhr/demoguanli.git temp_project
        cp -r temp_project/* .
        cp -r temp_project/.* . 2>/dev/null || true
        rm -rf temp_project
    fi
    
    echo -e "${GREEN}✅ 代码更新完成${NC}"
    echo ""
}

# 步骤3: 修复MIME类型配置
fix_mime_types() {
    echo -e "${BLUE}📋 步骤3: 修复MIME类型配置${NC}"
    
    cd "$SITE_DIR"
    
    # 创建强力.htaccess配置
    cat > .htaccess << 'EOF'
# 强制设置JavaScript MIME类型
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

# 备用MIME类型设置
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
EOF

    echo -e "${GREEN}✅ MIME类型配置完成${NC}"
    echo ""
}

# 步骤4: 优化构建配置
optimize_build_config() {
    echo -e "${BLUE}📋 步骤4: 优化构建配置${NC}"
    
    cd "$SITE_DIR"
    
    # 创建优化的vite配置
    cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    target: 'es2015',
    rollupOptions: {
      output: {
        format: 'iife',
        name: 'EnvironmentManager',
        manualChunks: undefined,
        entryFileNames: 'assets/app.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  },
  server: {
    port: 3000,
    host: true
  }
})
EOF

    echo -e "${GREEN}✅ 构建配置优化完成${NC}"
    echo ""
}

# 步骤5: 重新构建项目
rebuild_project() {
    echo -e "${BLUE}📋 步骤5: 重新构建项目${NC}"
    
    cd "$SITE_DIR"
    
    # 清理旧文件
    rm -rf dist node_modules package-lock.json
    
    # 重新安装依赖
    echo "📦 安装依赖..."
    npm cache clean --force
    npm install
    
    # 构建项目
    echo "🏗️ 构建项目..."
    npm run build
    
    # 修复index.html中的模块类型
    if [ -f "dist/index.html" ]; then
        sed -i 's/type="module"//g' dist/index.html
        echo "🔧 修复了index.html中的模块类型"
    fi
    
    echo -e "${GREEN}✅ 项目重新构建完成${NC}"
    echo ""
}

# 步骤6: 恢复配置
restore_config() {
    echo -e "${BLUE}📋 步骤6: 恢复配置${NC}"
    
    # 查找最新的备份文件
    local backup_file=$(ls -t /tmp/backup_env_* 2>/dev/null | head -1)
    
    if [ -n "$backup_file" ] && [ -f "$backup_file" ]; then
        cp "$backup_file" "$SITE_DIR/api/.env"
        echo -e "${GREEN}✅ 配置文件已恢复${NC}"
    else
        echo -e "${YELLOW}⚠️  没有找到备份配置，请手动配置${NC}"
    fi
    echo ""
}

# 步骤7: 设置权限
set_permissions() {
    echo -e "${BLUE}📋 步骤7: 设置文件权限${NC}"
    
    cd "$SITE_DIR"
    
    # 设置基本权限
    find . -type d -exec chmod 755 {} \;
    find . -type f -exec chmod 644 {} \;
    
    # 设置特殊权限
    chmod 644 .htaccess 2>/dev/null || true
    chmod -R 755 api/ 2>/dev/null || true
    chmod 600 api/.env 2>/dev/null || true
    
    echo -e "${GREEN}✅ 文件权限设置完成${NC}"
    echo ""
}

# 步骤8: 验证部署
verify_deployment() {
    echo -e "${BLUE}📋 步骤8: 验证部署${NC}"
    
    # 检查关键文件
    local files_to_check=(
        "$SITE_DIR/dist/index.html"
        "$SITE_DIR/.htaccess"
        "$SITE_DIR/api/.env"
    )
    
    local missing_files=()
    
    for file in "${files_to_check[@]}"; do
        if [ ! -f "$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -eq 0 ]; then
        echo -e "${GREEN}✅ 所有关键文件存在${NC}"
    else
        echo -e "${RED}❌ 缺少关键文件:${NC}"
        for file in "${missing_files[@]}"; do
            echo -e "  - $file"
        done
    fi
    
    # 测试网站访问
    echo "🧪 测试网站访问..."
    if curl -s -I "https://$DOMAIN/" | grep -q "200\|301\|302"; then
        echo -e "${GREEN}✅ 网站可访问${NC}"
    else
        echo -e "${RED}❌ 网站访问失败${NC}"
    fi
    
    # 测试API
    echo "🧪 测试API..."
    if curl -s -f "https://$DOMAIN/api/health" >/dev/null; then
        echo -e "${GREEN}✅ API正常${NC}"
    else
        echo -e "${RED}❌ API访问失败${NC}"
    fi
    
    echo ""
}

# 主函数
main() {
    echo -e "${BOLD}开始修复部署流程...${NC}"
    echo ""
    
    backup_config
    update_code
    fix_mime_types
    optimize_build_config
    rebuild_project
    restore_config
    set_permissions
    verify_deployment
    
    echo -e "${BOLD}${GREEN}🎉 修复部署完成！${NC}"
    echo ""
    echo -e "${CYAN}下一步操作:${NC}"
    echo -e "1. 访问网站: https://$DOMAIN"
    echo -e "2. 测试检测功能: 点击'检测所有'按钮"
    echo -e "3. 运行验证脚本: ./test-fixes.sh"
    echo -e "4. 清除浏览器缓存并刷新页面"
    echo ""
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
