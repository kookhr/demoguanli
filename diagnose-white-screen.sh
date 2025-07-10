#!/bin/bash

# Serv00 环境管理系统白屏问题综合诊断脚本
# 用于识别和修复根本原因

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

DOMAIN="do.kandy.dpdns.org"
SITE_DIR="$HOME/domains/$DOMAIN/public_html"

echo -e "${BOLD}${BLUE}🔍 Serv00 环境管理系统白屏问题诊断${NC}"
echo -e "${CYAN}目标域名: $DOMAIN${NC}"
echo -e "${CYAN}站点目录: $SITE_DIR${NC}"
echo ""

# 1. 基础文件结构检查
check_file_structure() {
    echo -e "${BOLD}${BLUE}📁 步骤1: 检查文件结构${NC}"
    
    cd "$SITE_DIR" || {
        echo -e "${RED}❌ 无法访问站点目录: $SITE_DIR${NC}"
        exit 1
    }
    
    # 检查关键文件
    local critical_files=(
        "index.html"
        "dist/index.html"
        ".htaccess"
        "api/.env"
    )
    
    for file in "${critical_files[@]}"; do
        if [ -f "$file" ]; then
            echo -e "${GREEN}✅ $file 存在${NC}"
            ls -la "$file"
        else
            echo -e "${RED}❌ $file 缺失${NC}"
        fi
    done
    
    # 检查 dist 目录内容
    if [ -d "dist" ]; then
        echo -e "${BLUE}📋 dist 目录内容:${NC}"
        ls -la dist/
        
        if [ -d "dist/assets" ]; then
            echo -e "${BLUE}📋 assets 目录内容:${NC}"
            ls -la dist/assets/
        fi
    else
        echo -e "${RED}❌ dist 目录不存在${NC}"
    fi
    
    echo ""
}

# 2. .htaccess 配置验证
check_htaccess_config() {
    echo -e "${BOLD}${BLUE}⚙️ 步骤2: 验证 .htaccess 配置${NC}"
    
    if [ -f ".htaccess" ]; then
        echo -e "${GREEN}✅ .htaccess 文件存在${NC}"
        echo -e "${BLUE}📋 文件大小: $(wc -c < .htaccess) 字节${NC}"
        
        # 检查关键 MIME 类型配置
        local mime_checks=(
            "application/javascript"
            "text/css"
            "image/svg+xml"
            "ForceType"
            "AddType"
        )
        
        for check in "${mime_checks[@]}"; do
            if grep -q "$check" .htaccess; then
                echo -e "${GREEN}✅ 包含: $check${NC}"
            else
                echo -e "${RED}❌ 缺失: $check${NC}"
            fi
        done
        
        # 显示 .htaccess 内容摘要
        echo -e "${BLUE}📋 .htaccess 前20行:${NC}"
        head -20 .htaccess
        
    else
        echo -e "${RED}❌ .htaccess 文件不存在${NC}"
    fi
    
    echo ""
}

# 3. 网络请求测试
test_network_requests() {
    echo -e "${BOLD}${BLUE}🌐 步骤3: 测试网络请求${NC}"
    
    # 测试主页
    echo -e "${BLUE}📋 测试主页访问:${NC}"
    if curl -I "https://$DOMAIN/" 2>/dev/null | head -10; then
        echo -e "${GREEN}✅ 主页可访问${NC}"
    else
        echo -e "${RED}❌ 主页访问失败${NC}"
    fi
    
    # 测试 dist/index.html
    echo -e "${BLUE}📋 测试 dist/index.html:${NC}"
    if curl -I "https://$DOMAIN/dist/index.html" 2>/dev/null | head -10; then
        echo -e "${GREEN}✅ dist/index.html 可访问${NC}"
    else
        echo -e "${RED}❌ dist/index.html 访问失败${NC}"
    fi
    
    # 测试 JavaScript 文件
    if [ -d "dist/assets" ]; then
        local js_file=$(ls dist/assets/*.js 2>/dev/null | head -1)
        if [ -n "$js_file" ]; then
            local js_filename=$(basename "$js_file")
            echo -e "${BLUE}📋 测试 JavaScript 文件: $js_filename${NC}"
            curl -I "https://$DOMAIN/dist/assets/$js_filename" 2>/dev/null | head -10
        fi
    fi
    
    # 测试 API
    echo -e "${BLUE}📋 测试 API:${NC}"
    if curl -s "https://$DOMAIN/api/health" 2>/dev/null | head -5; then
        echo -e "${GREEN}✅ API 可访问${NC}"
    else
        echo -e "${RED}❌ API 访问失败${NC}"
    fi
    
    echo ""
}

# 4. 构建输出验证
validate_build_output() {
    echo -e "${BOLD}${BLUE}🏗️ 步骤4: 验证构建输出${NC}"
    
    if [ -f "dist/index.html" ]; then
        echo -e "${GREEN}✅ dist/index.html 存在${NC}"
        
        # 检查 HTML 内容
        local html_size=$(wc -c < dist/index.html)
        echo -e "${BLUE}📋 HTML 文件大小: $html_size 字节${NC}"
        
        if [ "$html_size" -lt 100 ]; then
            echo -e "${RED}❌ HTML 文件太小，可能构建失败${NC}"
            echo -e "${BLUE}📋 HTML 内容:${NC}"
            cat dist/index.html
        else
            echo -e "${GREEN}✅ HTML 文件大小正常${NC}"
        fi
        
        # 检查是否包含关键元素
        if grep -q "<div id=\"root\"" dist/index.html; then
            echo -e "${GREEN}✅ 包含 React 根元素${NC}"
        else
            echo -e "${RED}❌ 缺少 React 根元素${NC}"
        fi
        
        if grep -q "script.*src" dist/index.html; then
            echo -e "${GREEN}✅ 包含 JavaScript 引用${NC}"
        else
            echo -e "${RED}❌ 缺少 JavaScript 引用${NC}"
        fi
        
        # 检查是否有 type="module"
        if grep -q 'type="module"' dist/index.html; then
            echo -e "${RED}❌ 仍包含 type=\"module\"${NC}"
        else
            echo -e "${GREEN}✅ 已移除 type=\"module\"${NC}"
        fi
        
    else
        echo -e "${RED}❌ dist/index.html 不存在${NC}"
    fi
    
    echo ""
}

# 5. 创建简化测试页面
create_test_pages() {
    echo -e "${BOLD}${BLUE}🧪 步骤5: 创建测试页面${NC}"
    
    # 创建简单的 HTML 测试页面
    cat > "test-simple.html" << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>简单测试页面</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: #f0f0f0;
        }
        .test-box {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 10px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .success { border-left: 4px solid #4CAF50; }
        .error { border-left: 4px solid #f44336; }
    </style>
</head>
<body>
    <h1>🧪 Serv00 环境测试页面</h1>
    
    <div class="test-box success">
        <h3>✅ HTML 加载成功</h3>
        <p>如果您能看到这个页面，说明基本的 HTML 服务正常。</p>
    </div>
    
    <div class="test-box" id="css-test">
        <h3>CSS 测试</h3>
        <p>检查样式是否正确加载...</p>
    </div>
    
    <div class="test-box" id="js-test">
        <h3>JavaScript 测试</h3>
        <p id="js-result">等待 JavaScript 执行...</p>
    </div>
    
    <div class="test-box">
        <h3>🔗 快速链接</h3>
        <p><a href="/dist/index.html">访问主应用</a></p>
        <p><a href="/api/health">API 健康检查</a></p>
        <p><a href="/mime-test.html">MIME 类型测试</a></p>
    </div>
    
    <script>
        // 测试 JavaScript 执行
        document.getElementById('js-result').textContent = '✅ JavaScript 执行成功！';
        document.getElementById('js-test').className = 'test-box success';
        
        // 测试 CSS
        const cssTest = document.getElementById('css-test');
        const computedStyle = window.getComputedStyle(cssTest);
        if (computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
            cssTest.className = 'test-box success';
            cssTest.querySelector('p').textContent = '✅ CSS 样式加载成功！';
        } else {
            cssTest.className = 'test-box error';
            cssTest.querySelector('p').textContent = '❌ CSS 样式加载失败！';
        }
        
        // 显示当前时间
        document.body.innerHTML += '<div class="test-box"><p>当前时间: ' + new Date().toLocaleString() + '</p></div>';
    </script>
</body>
</html>
EOF
    
    echo -e "${GREEN}✅ 创建了简单测试页面: test-simple.html${NC}"
    echo -e "${BLUE}📋 访问: https://$DOMAIN/test-simple.html${NC}"
    
    echo ""
}

# 6. 修复常见问题
fix_common_issues() {
    echo -e "${BOLD}${BLUE}🔧 步骤6: 修复常见问题${NC}"
    
    # 修复1: 确保 index.html 指向正确位置
    if [ ! -f "index.html" ] && [ -f "dist/index.html" ]; then
        echo -e "${BLUE}📋 创建根目录 index.html 重定向${NC}"
        cat > "index.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>环境管理系统</title>
    <script>
        window.location.href = './dist/index.html';
    </script>
</head>
<body>
    <p>正在跳转到环境管理系统...</p>
    <p><a href="./dist/index.html">如果没有自动跳转，请点击这里</a></p>
</body>
</html>
EOF
        echo -e "${GREEN}✅ 创建了根目录重定向页面${NC}"
    fi
    
    # 修复2: 确保 .htaccess 权限正确
    if [ -f ".htaccess" ]; then
        chmod 644 .htaccess
        echo -e "${GREEN}✅ 设置 .htaccess 权限为 644${NC}"
    fi
    
    # 修复3: 检查并修复 dist 目录权限
    if [ -d "dist" ]; then
        find dist -type d -exec chmod 755 {} \;
        find dist -type f -exec chmod 644 {} \;
        echo -e "${GREEN}✅ 修复了 dist 目录权限${NC}"
    fi
    
    echo ""
}

# 7. 生成诊断报告
generate_report() {
    echo -e "${BOLD}${BLUE}📊 步骤7: 生成诊断报告${NC}"
    
    local report_file="diagnostic-report-$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "Serv00 环境管理系统诊断报告"
        echo "生成时间: $(date)"
        echo "域名: $DOMAIN"
        echo "站点目录: $SITE_DIR"
        echo ""
        
        echo "=== 文件结构 ==="
        ls -la "$SITE_DIR" 2>/dev/null || echo "无法访问站点目录"
        echo ""
        
        echo "=== dist 目录 ==="
        ls -la "$SITE_DIR/dist" 2>/dev/null || echo "dist 目录不存在"
        echo ""
        
        echo "=== .htaccess 内容 ==="
        cat "$SITE_DIR/.htaccess" 2>/dev/null || echo ".htaccess 文件不存在"
        echo ""
        
        echo "=== 网络测试 ==="
        curl -I "https://$DOMAIN/" 2>/dev/null || echo "主页访问失败"
        echo ""
        
    } > "$report_file"
    
    echo -e "${GREEN}✅ 诊断报告已保存: $report_file${NC}"
    echo ""
}

# 主函数
main() {
    check_file_structure
    check_htaccess_config
    test_network_requests
    validate_build_output
    create_test_pages
    fix_common_issues
    generate_report
    
    echo -e "${BOLD}${GREEN}🎉 诊断完成！${NC}"
    echo ""
    echo -e "${BOLD}${CYAN}下一步操作:${NC}"
    echo -e "1. 访问测试页面: https://$DOMAIN/test-simple.html"
    echo -e "2. 检查浏览器控制台错误"
    echo -e "3. 如果问题仍存在，请提供具体的错误信息"
    echo ""
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
