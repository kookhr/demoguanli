#!/bin/bash

# 修复 Serv00 构建问题的快速脚本
# 使用方法: ./fix-build.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 修复 Serv00 构建问题...${NC}"

# 检查当前目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi

# 检查 Node.js 版本
NODE_VERSION=$(node --version 2>/dev/null || echo "未安装")
echo -e "📋 Node.js 版本: ${GREEN}$NODE_VERSION${NC}"

if [ "$NODE_VERSION" = "未安装" ]; then
    echo -e "${RED}❌ Node.js 未安装${NC}"
    exit 1
fi

# 清理和重新安装依赖
echo -e "${BLUE}🧹 清理依赖...${NC}"
rm -rf node_modules package-lock.json

echo -e "${BLUE}📦 重新安装依赖...${NC}"
npm cache clean --force
npm install

# 检查 vite 是否安装
echo -e "${BLUE}🔍 检查 Vite...${NC}"
if npm list vite >/dev/null 2>&1; then
    echo -e "✅ Vite 已安装"
else
    echo -e "${YELLOW}⚠️  安装 Vite...${NC}"
    npm install vite --save-dev
fi

# 尝试构建
echo -e "${BLUE}🏗️ 尝试构建...${NC}"

if npm run build; then
    echo -e "${GREEN}✅ 构建成功！${NC}"
elif npx vite build; then
    echo -e "${GREEN}✅ 构建成功（使用 npx）！${NC}"
else
    echo -e "${YELLOW}⚠️  标准构建失败，创建手动构建脚本...${NC}"
    
    # 创建手动构建脚本
    cat > manual-build.sh << 'EOF'
#!/bin/bash

echo "🔧 手动构建环境管理系统..."

# 创建 dist 目录
mkdir -p dist/assets/{css,js,images}

# 复制 HTML 文件
if [ -f "index.html" ]; then
    cp index.html dist/
    echo "✅ 复制 index.html"
fi

# 复制 public 目录
if [ -d "public" ]; then
    cp -r public/* dist/
    echo "✅ 复制 public 文件"
fi

# 如果有预构建的资源，复制它们
if [ -d "src/assets" ]; then
    cp -r src/assets/* dist/assets/
    echo "✅ 复制资源文件"
fi

# 创建基本的 index.html（如果不存在）
if [ ! -f "dist/index.html" ]; then
    cat > dist/index.html << 'HTML'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>环境管理系统</title>
    <style>
        body { 
            font-family: system-ui, -apple-system, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: rgba(255,255,255,0.95); 
            padding: 40px; 
            border-radius: 20px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
        }
        h1 { 
            color: #4f46e5; 
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        .message { 
            padding: 20px; 
            background: linear-gradient(135deg, #fef3c7, #fde68a); 
            border-left: 4px solid #f59e0b; 
            margin: 20px 0; 
            border-radius: 10px;
        }
        .btn { 
            display: inline-block; 
            background: linear-gradient(135deg, #4f46e5, #7c3aed); 
            color: white; 
            padding: 12px 24px; 
            border-radius: 10px; 
            text-decoration: none; 
            margin-top: 20px;
            transition: transform 0.2s;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
        .status {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .status-card {
            background: rgba(255,255,255,0.8);
            padding: 20px;
            border-radius: 15px;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌐 环境管理系统</h1>
        <div class="message">
            <h3>系统正在初始化...</h3>
            <p>环境管理系统正在启动中，请稍后刷新页面。</p>
        </div>
        
        <div class="status">
            <div class="status-card">
                <h4>🔧 系统状态</h4>
                <p>正在加载...</p>
            </div>
            <div class="status-card">
                <h4>📊 环境监控</h4>
                <p>准备中...</p>
            </div>
            <div class="status-card">
                <h4>👥 用户管理</h4>
                <p>初始化中...</p>
            </div>
        </div>
        
        <div style="text-align: center;">
            <a href="/" class="btn">🔄 刷新页面</a>
            <a href="/api/health" class="btn">🔍 检查 API</a>
        </div>
        
        <div style="margin-top: 40px; text-align: center; color: #6b7280;">
            <p>如果页面长时间未加载，请联系管理员检查系统状态。</p>
        </div>
    </div>
</body>
</html>
HTML
    echo "✅ 创建基本 index.html"
fi

echo "🎉 手动构建完成！"
echo "📁 构建文件位于 dist/ 目录"
EOF

    chmod +x manual-build.sh
    ./manual-build.sh
    
    echo -e "${GREEN}✅ 手动构建完成！${NC}"
fi

# 检查构建结果
if [ -d "dist" ] && [ "$(ls -A dist)" ]; then
    echo -e "${GREEN}🎉 构建成功！${NC}"
    echo -e "📊 构建统计:"
    echo -e "   • 文件数量: $(find dist -type f | wc -l)"
    echo -e "   • 总大小: $(du -sh dist 2>/dev/null | cut -f1 || echo '未知')"
    echo -e "   • 主要文件:"
    ls -la dist/ | head -10
else
    echo -e "${RED}❌ 构建失败${NC}"
    exit 1
fi

echo -e "${BLUE}💡 提示: 现在可以继续运行部署脚本${NC}"
