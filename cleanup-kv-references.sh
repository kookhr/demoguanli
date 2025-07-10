#!/bin/bash

# KV 引用清理脚本
# 用于清理项目中残留的 Cloudflare KV 相关代码

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() { echo -e "${BLUE}📋 $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

print_step "开始清理 KV 相关代码..."

# 1. 删除 Cloudflare KV 函数文件
if [ -f "functions/api/kv.js" ]; then
    print_step "删除 Cloudflare KV 函数文件..."
    rm -f "functions/api/kv.js"
    print_success "已删除 functions/api/kv.js"
else
    print_warning "functions/api/kv.js 文件不存在"
fi

# 2. 修复 auth.js 中的 KV 引用
if [ -f "src/utils/auth.js" ]; then
    print_step "修复 src/utils/auth.js 中的 KV 引用..."
    
    # 备份原文件
    cp "src/utils/auth.js" "src/utils/auth.js.backup"
    
    # 删除 checkKVAvailability 方法
    sed -i.tmp '/\/\/ 检查KV存储是否可用/,/^  }$/d' "src/utils/auth.js"
    rm -f "src/utils/auth.js.tmp"
    
    print_success "已修复 src/utils/auth.js"
else
    print_error "src/utils/auth.js 文件不存在"
fi

# 3. 修复 userManagement.js 中的 KV 引用
if [ -f "src/utils/userManagement.js" ]; then
    print_step "修复 src/utils/userManagement.js 中的 KV 引用..."
    
    # 备份原文件
    cp "src/utils/userManagement.js" "src/utils/userManagement.js.backup"
    
    # 替换 getUserFromKV 调用为数据库调用
    sed -i.tmp 's/await authManager\.getUserFromKV(username)/await databaseAPI.getUserByUsername(username)/g' "src/utils/userManagement.js"
    
    # 替换 saveUserToKV 调用为数据库调用
    sed -i.tmp 's/await authManager\.saveUserToKV(username, updatedUser)/await databaseAPI.updateUser(updatedUser.id, updatedUser)/g' "src/utils/userManagement.js"
    
    rm -f "src/utils/userManagement.js.tmp"
    
    print_success "已修复 src/utils/userManagement.js"
else
    print_error "src/utils/userManagement.js 文件不存在"
fi

# 4. 检查并清理其他可能的 KV 引用
print_step "搜索其他可能的 KV 引用..."

# 搜索 KV 相关的代码
kv_files=$(grep -r "KV\|kv\|ENV_CONFIG" src/ --include="*.js" --include="*.jsx" 2>/dev/null | grep -v "node_modules" | grep -v ".backup" || true)

if [ -n "$kv_files" ]; then
    print_warning "发现其他 KV 引用:"
    echo "$kv_files"
    print_warning "请手动检查这些文件"
else
    print_success "未发现其他 KV 引用"
fi

# 5. 清理 functions 目录（如果为空）
if [ -d "functions" ]; then
    if [ -z "$(ls -A functions)" ]; then
        print_step "删除空的 functions 目录..."
        rm -rf functions
        print_success "已删除空的 functions 目录"
    else
        print_warning "functions 目录不为空，请手动检查"
    fi
fi

# 6. 更新 README 文档中的 KV 引用
if [ -f "README.md" ]; then
    print_step "更新 README.md 中的存储说明..."
    
    # 备份原文件
    cp "README.md" "README.md.backup"
    
    # 替换存储类型说明
    sed -i.tmp 's/KV存储API/数据库API/g' "README.md"
    sed -i.tmp 's/Cloudflare KV/MySQL 数据库/g' "README.md"
    
    rm -f "README.md.tmp"
    
    print_success "已更新 README.md"
fi

# 7. 检查 package.json 中是否有不需要的依赖
print_step "检查 package.json 中的依赖..."

if [ -f "package.json" ]; then
    # 检查是否有 Cloudflare 相关依赖
    cf_deps=$(grep -i "cloudflare\|@cloudflare" package.json || true)
    if [ -n "$cf_deps" ]; then
        print_warning "发现 Cloudflare 相关依赖:"
        echo "$cf_deps"
        print_warning "请考虑是否需要移除"
    else
        print_success "未发现 Cloudflare 相关依赖"
    fi
fi

# 8. 生成清理报告
print_step "生成清理报告..."

cat > "kv-cleanup-report.md" << EOF
# KV 代码清理报告

## 清理时间
$(date)

## 已清理的文件
- functions/api/kv.js (已删除)
- src/utils/auth.js (已修复 checkKVAvailability 方法)
- src/utils/userManagement.js (已修复 KV 调用)
- README.md (已更新存储说明)

## 备份文件
- src/utils/auth.js.backup
- src/utils/userManagement.js.backup
- README.md.backup

## 建议后续操作
1. 测试所有功能确保正常工作
2. 如果测试通过，可以删除 .backup 文件
3. 提交代码更改到版本控制

## 验证命令
\`\`\`bash
# 检查是否还有 KV 引用
grep -r "KV\|ENV_CONFIG" src/ --include="*.js" --include="*.jsx" | grep -v backup

# 测试构建
npm run build

# 测试开发服务器
npm run dev
\`\`\`
EOF

print_success "清理报告已生成: kv-cleanup-report.md"

print_step "KV 代码清理完成！"
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    🎉 清理完成！                              ║"
echo "║                                                              ║"
echo "║  ✅ 已删除 Cloudflare KV 相关代码                            ║"
echo "║  ✅ 已修复数据库 API 调用                                     ║"
echo "║  ✅ 已生成备份文件                                           ║"
echo "║  ✅ 已生成清理报告                                           ║"
echo "║                                                              ║"
echo "║  📋 下一步操作:                                              ║"
echo "║     1. 运行 npm run build 测试构建                           ║"
echo "║     2. 运行 npm run dev 测试开发服务器                       ║"
echo "║     3. 测试所有功能确保正常工作                               ║"
echo "║     4. 如果测试通过，删除 .backup 文件                       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
