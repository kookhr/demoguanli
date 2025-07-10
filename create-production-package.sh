#!/bin/bash
# 创建 Serv00 生产部署包
# 生成极简、轻量的生产环境文件

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
PACKAGE_NAME="serv00-demoguanli"
PACKAGE_VERSION="1.0.0"
BUILD_DIR="build"
DIST_DIR="$BUILD_DIR/dist"

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

# 清理构建目录
clean_build() {
    print_step "清理构建目录..."
    rm -rf "$BUILD_DIR"
    mkdir -p "$BUILD_DIR"
    print_success "构建目录已清理"
}

# 构建前端
build_frontend() {
    print_step "构建前端项目..."
    
    if [ ! -f "package.json" ]; then
        print_error "未找到 package.json 文件"
        exit 1
    fi
    
    # 安装依赖
    if command -v npm >/dev/null 2>&1; then
        npm install
        npm run build
    elif command -v yarn >/dev/null 2>&1; then
        yarn install
        yarn build
    else
        print_error "未找到 npm 或 yarn"
        exit 1
    fi
    
    if [ ! -d "dist" ]; then
        print_error "前端构建失败，未找到 dist 目录"
        exit 1
    fi
    
    print_success "前端构建完成"
}

# 复制前端文件
copy_frontend() {
    print_step "复制前端文件..."

    # 将 dist 目录内容复制到根目录
    cp -r dist/* "$BUILD_DIR/"

    # 验证关键文件
    if [ ! -f "$BUILD_DIR/index.html" ]; then
        print_error "缺少 index.html 文件"
        exit 1
    fi

    print_success "前端文件复制完成"
}

# 复制后端文件
copy_backend() {
    print_step "复制后端 API 文件..."
    
    mkdir -p "$BUILD_DIR/api"
    
    # 复制 API 核心文件
    cp api/index.php "$BUILD_DIR/api/"
    
    # 复制配置文件
    mkdir -p "$BUILD_DIR/api/config"
    cp api/config/database.php "$BUILD_DIR/api/config/"
    
    # 复制控制器
    mkdir -p "$BUILD_DIR/api/controllers"
    cp api/controllers/*.php "$BUILD_DIR/api/controllers/"
    
    # 复制模型
    mkdir -p "$BUILD_DIR/api/models"
    cp api/models/*.php "$BUILD_DIR/api/models/"
    
    # 复制 Serv00 专用配置
    cp serv00-config.php "$BUILD_DIR/api/config/"
    
    print_success "后端文件复制完成"
}

# 复制数据库文件
copy_database() {
    print_step "复制数据库文件..."
    
    mkdir -p "$BUILD_DIR/database"
    cp database/init.sql "$BUILD_DIR/database/"
    
    print_success "数据库文件复制完成"
}

# 创建配置文件
create_configs() {
    print_step "创建配置文件..."
    
    # 复制 .htaccess
    cp serv00-htaccess "$BUILD_DIR/.htaccess"
    
    # 创建环境配置模板
    cat > "$BUILD_DIR/.env.example" << 'EOF'
# Serv00 环境管理系统配置
DB_HOST=localhost
DB_NAME=environment_manager
DB_USER=your_username
DB_PASSWORD=your_password

APP_DEBUG=false
APP_URL=https://yourdomain.serv00.net
APP_PORT=3000

JWT_SECRET=your-secret-key
LOG_LEVEL=info

MAIL_DRIVER=smtp
MAIL_HOST=mail.serv00.com
MAIL_PORT=587
MAIL_USERNAME=your_email
MAIL_PASSWORD=your_password
MAIL_ENCRYPTION=tls
EOF
    
    # 创建 PHP 配置
    cat > "$BUILD_DIR/api/.htaccess" << 'EOF'
# API 目录配置
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]

# 安全设置
<Files ".env">
    Order allow,deny
    Deny from all
</Files>

# CORS 设置
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
EOF
    
    print_success "配置文件创建完成"
}

# 创建安装脚本
create_install_script() {
    print_step "创建安装脚本..."
    
    # 复制主安装脚本
    cp serv00-deploy.sh "$BUILD_DIR/"
    chmod +x "$BUILD_DIR/serv00-deploy.sh"
    
    # 创建快速安装脚本
    cat > "$BUILD_DIR/quick-install.sh" << 'EOF'
#!/bin/bash
# 快速安装脚本
set -e

echo "🚀 开始快速安装 Serv00 环境管理系统..."

# 检查必要文件
if [ ! -f "dist/index.html" ] || [ ! -f "api/index.php" ]; then
    echo "❌ 缺少必要文件，请确保在正确的目录中运行"
    exit 1
fi

# 设置权限
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
chmod +x *.sh

# 创建必要目录
mkdir -p uploads backups logs

echo "✅ 快速安装完成！"
echo "📋 下一步："
echo "   1. 配置数据库连接 (.env 文件)"
echo "   2. 导入数据库结构 (database/init.sql)"
echo "   3. 访问您的域名测试"
EOF
    
    chmod +x "$BUILD_DIR/quick-install.sh"
    
    print_success "安装脚本创建完成"
}

# 创建文档
create_docs() {
    print_step "创建部署文档..."
    
    cat > "$BUILD_DIR/README.md" << EOF
# Serv00 环境管理系统 - 生产部署包

## 📦 包含内容

- \`dist/\` - 前端构建文件
- \`api/\` - 后端 PHP API
- \`database/\` - 数据库结构
- \`.htaccess\` - Apache 配置
- \`serv00-deploy.sh\` - 完整安装脚本
- \`quick-install.sh\` - 快速安装脚本

## 🚀 快速部署

### 方法一：一键安装（推荐）
\`\`\`bash
bash -i <(curl -SL https://your-domain.com/serv00-deploy.sh)
\`\`\`

### 方法二：手动安装
1. 上传所有文件到您的 Serv00 域名目录
2. 运行快速安装脚本：
   \`\`\`bash
   ./quick-install.sh
   \`\`\`
3. 配置数据库连接：
   \`\`\`bash
   cp .env.example .env
   # 编辑 .env 文件，填入您的数据库信息
   \`\`\`
4. 导入数据库：
   \`\`\`bash
   mysql -u username -p database_name < database/init.sql
   \`\`\`

## 🔧 配置说明

### 数据库配置
在 \`.env\` 文件中配置：
\`\`\`
DB_HOST=localhost
DB_NAME=environment_manager
DB_USER=your_username
DB_PASSWORD=your_password
\`\`\`

### 域名配置
如果使用 \`/dist/\` 代理路径，请确保：
1. Serv00 面板中设置代理路径为 \`/dist/\`
2. \`.htaccess\` 文件已正确配置

## 📋 系统要求

- PHP 8.0+
- MySQL 5.7+ 或 MariaDB 10.3+
- Apache 2.4+
- 支持 \`.htaccess\` 重写

## 🔐 默认账户

- 用户名: \`admin\`
- 密码: \`admin123\`

**⚠️ 请在首次登录后立即修改密码！**

## 📞 技术支持

如遇问题，请查看：
1. 错误日志：\`/tmp/serv00-php-errors.log\`
2. API 健康检查：\`https://yourdomain.com/api/health\`
3. 项目文档：GitHub 仓库

---
版本：$PACKAGE_VERSION
构建时间：$(date)
EOF
    
    print_success "部署文档创建完成"
}

# 优化文件
optimize_files() {
    print_step "优化生产文件..."
    
    # 移除开发文件
    find "$BUILD_DIR" -name "*.backup" -delete
    find "$BUILD_DIR" -name "*.tmp" -delete
    find "$BUILD_DIR" -name ".DS_Store" -delete
    
    # 压缩 CSS 和 JS（如果有工具）
    if command -v uglifyjs >/dev/null 2>&1; then
        find "$BUILD_DIR/dist" -name "*.js" -exec uglifyjs {} -o {} \;
    fi
    
    if command -v cleancss >/dev/null 2>&1; then
        find "$BUILD_DIR/dist" -name "*.css" -exec cleancss {} -o {} \;
    fi
    
    print_success "文件优化完成"
}

# 创建压缩包
create_package() {
    print_step "创建部署包..."
    
    cd "$BUILD_DIR"
    
    # 创建 tar.gz 包
    tar -czf "../${PACKAGE_NAME}-${PACKAGE_VERSION}.tar.gz" .
    
    # 创建 zip 包
    if command -v zip >/dev/null 2>&1; then
        zip -r "../${PACKAGE_NAME}-${PACKAGE_VERSION}.zip" .
    fi
    
    cd ..
    
    print_success "部署包创建完成"
}

# 显示结果
show_results() {
    echo
    print_message "🎉 生产部署包创建成功！" $GREEN
    echo
    print_message "📦 生成的文件：" $BLUE
    echo "   ${PACKAGE_NAME}-${PACKAGE_VERSION}.tar.gz"
    if [ -f "${PACKAGE_NAME}-${PACKAGE_VERSION}.zip" ]; then
        echo "   ${PACKAGE_NAME}-${PACKAGE_VERSION}.zip"
    fi
    echo "   $BUILD_DIR/ (解压后的文件)"
    echo
    print_message "📋 文件大小：" $BLUE
    ls -lh "${PACKAGE_NAME}-${PACKAGE_VERSION}".* 2>/dev/null || true
    echo
    print_message "🚀 部署方法：" $BLUE
    echo "   1. 上传压缩包到 Serv00"
    echo "   2. 解压到域名目录"
    echo "   3. 运行安装脚本"
    echo
    print_message "📞 技术支持：" $BLUE
    echo "   查看 $BUILD_DIR/README.md 获取详细说明"
    echo
}

# 主函数
main() {
    echo
    print_message "🏗️  创建 Serv00 生产部署包" $BLUE
    echo
    
    clean_build
    build_frontend
    copy_frontend
    copy_backend
    copy_database
    create_configs
    create_install_script
    create_docs
    optimize_files
    create_package
    show_results
}

# 执行主函数
main "$@"
