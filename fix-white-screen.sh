#!/bin/bash

# Serv00 环境管理系统白屏问题修复脚本
# 针对性解决白屏问题的根本原因

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

echo -e "${BOLD}${BLUE}🔧 Serv00 环境管理系统白屏修复${NC}"
echo ""

# 1. 创建强力 .htaccess 文件
create_powerful_htaccess() {
    echo -e "${BOLD}${BLUE}📋 步骤1: 创建强力 .htaccess 配置${NC}"
    
    cd "$SITE_DIR"
    
    cat > ".htaccess" << 'EOF'
# ========================================
# Serv00 白屏问题终极修复配置
# ========================================

# 强制设置 MIME 类型 - 方法1
<Files "*.js">
    ForceType application/javascript
    Header always set Content-Type "application/javascript; charset=utf-8"
</Files>

<Files "*.mjs">
    ForceType application/javascript
    Header always set Content-Type "application/javascript; charset=utf-8"
</Files>

<Files "*.css">
    ForceType text/css
    Header always set Content-Type "text/css; charset=utf-8"
</Files>

<Files "*.svg">
    ForceType image/svg+xml
    Header always set Content-Type "image/svg+xml; charset=utf-8"
</Files>

<Files "*.html">
    ForceType text/html
    Header always set Content-Type "text/html; charset=utf-8"
</Files>

# 强制设置 MIME 类型 - 方法2
AddType application/javascript .js
AddType application/javascript .mjs
AddType text/css .css
AddType image/svg+xml .svg
AddType text/html .html

# 移除可能冲突的类型定义
RemoveType .js
RemoveType .css
RemoveType .svg
RemoveType .html

# 重新添加正确的类型
AddType application/javascript .js
AddType text/css .css
AddType image/svg+xml .svg
AddType text/html .html

# 设置默认字符集
AddDefaultCharset UTF-8

# 安全头
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"

# CORS 设置
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type"

# 错误处理
ErrorDocument 404 /index.html
ErrorDocument 500 /index.html

# URL 重写
RewriteEngine On

# API 路由
RewriteRule ^api/(.*)$ api/index.php [QSA,L]

# 静态文件直接访问
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule ^ - [L]

# SPA 路由回退
RewriteRule ^ index.html [L]
EOF

    chmod 644 .htaccess
    echo -e "${GREEN}✅ 强力 .htaccess 配置已创建${NC}"
    echo ""
}

# 2. 修复 HTML 文件
fix_html_files() {
    echo -e "${BOLD}${BLUE}📋 步骤2: 修复 HTML 文件${NC}"
    
    cd "$SITE_DIR"
    
    # 修复 dist/index.html
    if [ -f "dist/index.html" ]; then
        # 备份原文件
        cp dist/index.html dist/index.html.backup
        
        # 移除 type="module" 并添加必要的修复
        cat > "dist/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>环境管理系统</title>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: #f5f5f5;
    }
    #root {
      min-height: 100vh;
    }
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-size: 18px;
      color: #666;
    }
  </style>
</head>
<body>
  <div id="root">
    <div class="loading">正在加载环境管理系统...</div>
  </div>
  
  <!-- 加载主应用脚本 -->
  <script>
    // 错误处理
    window.addEventListener('error', function(e) {
      console.error('JavaScript 错误:', e.error);
      document.getElementById('root').innerHTML = 
        '<div style="padding: 20px; text-align: center;">' +
        '<h2>⚠️ 应用加载失败</h2>' +
        '<p>请检查浏览器控制台获取详细错误信息</p>' +
        '<p><a href="/test-simple.html">访问测试页面</a></p>' +
        '</div>';
    });
    
    // 动态加载主应用脚本
    const script = document.createElement('script');
    script.src = './assets/index.js';
    script.onerror = function() {
      console.error('无法加载主应用脚本');
      document.getElementById('root').innerHTML = 
        '<div style="padding: 20px; text-align: center;">' +
        '<h2>❌ 脚本加载失败</h2>' +
        '<p>无法加载 JavaScript 文件</p>' +
        '<p><a href="/test-simple.html">访问测试页面</a></p>' +
        '</div>';
    };
    document.head.appendChild(script);
  </script>
</body>
</html>
EOF
        
        echo -e "${GREEN}✅ 修复了 dist/index.html${NC}"
    fi
    
    # 创建根目录 index.html
    cat > "index.html" << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>环境管理系统</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            backdrop-filter: blur(10px);
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px;
            transition: background 0.3s;
        }
        .btn:hover {
            background: #45a049;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 环境管理系统</h1>
        <p>欢迎使用 Serv00 环境管理系统</p>
        
        <div>
            <a href="./dist/index.html" class="btn">进入主应用</a>
            <a href="./test-simple.html" class="btn">测试页面</a>
            <a href="./api/health" class="btn">API 状态</a>
        </div>
        
        <div style="margin-top: 20px; font-size: 14px; opacity: 0.8;">
            <p>如果主应用无法加载，请：</p>
            <p>1. 检查浏览器控制台错误</p>
            <p>2. 访问测试页面进行诊断</p>
            <p>3. 清除浏览器缓存后重试</p>
        </div>
    </div>
</body>
</html>
EOF
    
    echo -e "${GREEN}✅ 创建了根目录 index.html${NC}"
    echo ""
}

# 3. 修复 JavaScript 文件
fix_javascript_files() {
    echo -e "${BOLD}${BLUE}📋 步骤3: 修复 JavaScript 文件${NC}"
    
    cd "$SITE_DIR"
    
    if [ -d "dist/assets" ]; then
        # 为所有 JS 文件添加正确的 MIME 类型标识
        for js_file in dist/assets/*.js; do
            if [ -f "$js_file" ]; then
                # 检查文件是否已经有 MIME 类型标识
                if ! head -1 "$js_file" | grep -q "Content-Type"; then
                    # 创建临时文件
                    temp_file=$(mktemp)
                    echo "/* Content-Type: application/javascript; charset=utf-8 */" > "$temp_file"
                    cat "$js_file" >> "$temp_file"
                    mv "$temp_file" "$js_file"
                    echo -e "${GREEN}✅ 修复了 $(basename "$js_file")${NC}"
                fi
            fi
        done
        
        # 在 assets 目录创建 .htaccess
        cat > "dist/assets/.htaccess" << 'EOF'
# Assets 目录 MIME 类型强制设置
<Files "*.js">
    ForceType application/javascript
    Header always set Content-Type "application/javascript; charset=utf-8"
</Files>

<Files "*.css">
    ForceType text/css
    Header always set Content-Type "text/css; charset=utf-8"
</Files>

AddType application/javascript .js
AddType text/css .css
EOF
        
        echo -e "${GREEN}✅ 在 assets 目录创建了 .htaccess${NC}"
    fi
    
    echo ""
}

# 4. 创建备用应用
create_fallback_app() {
    echo -e "${BOLD}${BLUE}📋 步骤4: 创建备用应用${NC}"
    
    cd "$SITE_DIR"
    
    cat > "fallback-app.html" << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>环境管理系统 - 备用版本</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f5f5f5;
            color: #333;
        }
        .header {
            background: #2563eb;
            color: white;
            padding: 1rem 2rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .container {
            max-width: 1200px;
            margin: 2rem auto;
            padding: 0 2rem;
        }
        .card {
            background: white;
            border-radius: 8px;
            padding: 1.5rem;
            margin: 1rem 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .btn {
            display: inline-block;
            padding: 0.5rem 1rem;
            background: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin: 0.25rem;
            transition: background 0.2s;
        }
        .btn:hover { background: #1d4ed8; }
        .status { padding: 0.5rem; border-radius: 4px; margin: 0.5rem 0; }
        .status.success { background: #d1fae5; color: #065f46; }
        .status.error { background: #fee2e2; color: #991b1b; }
        .status.warning { background: #fef3c7; color: #92400e; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 环境管理系统 - 备用版本</h1>
    </div>
    
    <div class="container">
        <div class="card">
            <h2>系统状态</h2>
            <div id="system-status" class="status warning">正在检查系统状态...</div>
        </div>
        
        <div class="card">
            <h2>快速操作</h2>
            <a href="./dist/index.html" class="btn">尝试主应用</a>
            <a href="./test-simple.html" class="btn">系统测试</a>
            <a href="./api/health" class="btn">API 检查</a>
            <a href="./mime-test.html" class="btn">MIME 测试</a>
        </div>
        
        <div class="card">
            <h2>环境列表</h2>
            <div id="env-list">正在加载环境列表...</div>
        </div>
        
        <div class="card">
            <h2>故障排除</h2>
            <p>如果主应用无法正常加载，可能的原因：</p>
            <ul style="margin: 1rem 0; padding-left: 2rem;">
                <li>JavaScript 文件 MIME 类型错误</li>
                <li>构建文件缺失或损坏</li>
                <li>服务器配置问题</li>
                <li>浏览器缓存问题</li>
            </ul>
            <p>建议操作：</p>
            <ol style="margin: 1rem 0; padding-left: 2rem;">
                <li>清除浏览器缓存 (Ctrl+Shift+Delete)</li>
                <li>检查浏览器控制台错误信息</li>
                <li>访问测试页面进行诊断</li>
                <li>联系系统管理员</li>
            </ol>
        </div>
    </div>
    
    <script>
        // 检查系统状态
        async function checkSystemStatus() {
            const statusEl = document.getElementById('system-status');
            
            try {
                const response = await fetch('./api/health');
                if (response.ok) {
                    const data = await response.json();
                    statusEl.textContent = '✅ 系统运行正常';
                    statusEl.className = 'status success';
                } else {
                    statusEl.textContent = '⚠️ API 响应异常';
                    statusEl.className = 'status warning';
                }
            } catch (error) {
                statusEl.textContent = '❌ 无法连接到 API';
                statusEl.className = 'status error';
            }
        }
        
        // 加载环境列表
        async function loadEnvironments() {
            const listEl = document.getElementById('env-list');
            
            try {
                const response = await fetch('./api/environments');
                if (response.ok) {
                    const data = await response.json();
                    if (data.data && data.data.length > 0) {
                        listEl.innerHTML = data.data.map(env => 
                            `<div style="padding: 0.5rem; border: 1px solid #e5e7eb; margin: 0.5rem 0; border-radius: 4px;">
                                <strong>${env.name}</strong> - ${env.url}
                            </div>`
                        ).join('');
                    } else {
                        listEl.textContent = '暂无环境数据';
                    }
                } else {
                    listEl.textContent = '无法加载环境列表';
                }
            } catch (error) {
                listEl.textContent = '加载环境列表时出错';
            }
        }
        
        // 初始化
        checkSystemStatus();
        loadEnvironments();
    </script>
</body>
</html>
EOF
    
    echo -e "${GREEN}✅ 创建了备用应用: fallback-app.html${NC}"
    echo ""
}

# 5. 设置正确的文件权限
fix_permissions() {
    echo -e "${BOLD}${BLUE}📋 步骤5: 修复文件权限${NC}"
    
    cd "$SITE_DIR"
    
    # 设置目录权限
    find . -type d -exec chmod 755 {} \;
    
    # 设置文件权限
    find . -type f -exec chmod 644 {} \;
    
    # 特殊文件权限
    chmod 644 .htaccess 2>/dev/null || true
    chmod -R 755 api/ 2>/dev/null || true
    chmod 600 api/.env 2>/dev/null || true
    
    echo -e "${GREEN}✅ 文件权限修复完成${NC}"
    echo ""
}

# 主函数
main() {
    echo -e "${BOLD}开始修复白屏问题...${NC}"
    echo ""
    
    create_powerful_htaccess
    fix_html_files
    fix_javascript_files
    create_fallback_app
    fix_permissions
    
    echo -e "${BOLD}${GREEN}🎉 白屏修复完成！${NC}"
    echo ""
    echo -e "${BOLD}${CYAN}测试步骤:${NC}"
    echo -e "1. 访问主页: https://$DOMAIN/"
    echo -e "2. 访问主应用: https://$DOMAIN/dist/index.html"
    echo -e "3. 访问备用应用: https://$DOMAIN/fallback-app.html"
    echo -e "4. 访问测试页面: https://$DOMAIN/test-simple.html"
    echo ""
    echo -e "${BOLD}${YELLOW}如果问题仍然存在:${NC}"
    echo -e "1. 清除浏览器缓存 (Ctrl+Shift+Delete)"
    echo -e "2. 检查浏览器控制台错误"
    echo -e "3. 运行诊断脚本获取详细信息"
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
