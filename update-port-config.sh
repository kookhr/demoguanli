#!/bin/bash

# 端口配置更新脚本
# 用于在更新模式下正确保留和迁移端口配置

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_step() { echo -e "${BLUE}📋 $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${CYAN}ℹ️  $1${NC}"; }

# 端口验证函数
validate_port() {
    local port="$1"
    
    if ! [[ "$port" =~ ^[0-9]+$ ]]; then
        return 1
    fi
    
    if [ "$port" -lt 1024 ] || [ "$port" -gt 65535 ]; then
        return 1
    fi
    
    return 0
}

# 从配置文件读取端口
read_port_from_config() {
    local config_file="$1"
    
    if [ ! -f "$config_file" ]; then
        return 1
    fi
    
    local port=$(grep '"port"' "$config_file" | sed 's/.*: *\([0-9]*\).*/\1/' | head -1)
    
    if validate_port "$port"; then
        echo "$port"
        return 0
    fi
    
    return 1
}

# 更新配置文件中的端口
update_port_in_config() {
    local config_file="$1"
    local new_port="$2"
    
    if [ ! -f "$config_file" ]; then
        print_error "配置文件不存在: $config_file"
        return 1
    fi
    
    if ! validate_port "$new_port"; then
        print_error "无效端口: $new_port"
        return 1
    fi
    
    # 备份原文件
    cp "$config_file" "${config_file}.backup"
    
    # 更新端口配置
    sed -i.tmp "s/\"port\": *[0-9]*/\"port\": $new_port/" "$config_file"
    rm -f "${config_file}.tmp"
    
    print_success "已更新 $config_file 中的端口为: $new_port"
    return 0
}

# 迁移旧版本配置
migrate_legacy_config() {
    local install_dir="$1"
    local new_port="$2"
    
    print_step "检查并迁移旧版本配置..."
    
    # 检查是否存在旧的端口配置文件
    local legacy_files=(
        "$install_dir/.port"
        "$install_dir/server.conf"
        "$install_dir/config.json"
    )
    
    for file in "${legacy_files[@]}"; do
        if [ -f "$file" ]; then
            print_info "发现旧配置文件: $file"
            
            # 尝试从旧文件读取端口
            if grep -q "port\|PORT" "$file"; then
                local old_port=$(grep -i "port" "$file" | grep -o '[0-9]\+' | head -1)
                if validate_port "$old_port"; then
                    print_info "从旧配置文件读取到端口: $old_port"
                    new_port="$old_port"
                fi
            fi
            
            # 备份并删除旧文件
            mv "$file" "${file}.migrated"
            print_success "已迁移旧配置文件: $file -> ${file}.migrated"
        fi
    done
    
    echo "$new_port"
}

# 验证端口配置一致性
verify_port_consistency() {
    local install_dir="$1"
    
    print_step "验证端口配置一致性..."
    
    local config_files=(
        "$install_dir/demo-config.json"
        "$install_dir/package.json"
    )
    
    local ports=()
    
    # 从各个配置文件读取端口
    for file in "${config_files[@]}"; do
        if [ -f "$file" ]; then
            local port=$(read_port_from_config "$file")
            if [ $? -eq 0 ]; then
                ports+=("$port")
                print_info "从 $file 读取端口: $port"
            fi
        fi
    done
    
    # 检查端口是否一致
    if [ ${#ports[@]} -gt 1 ]; then
        local first_port="${ports[0]}"
        local consistent=true
        
        for port in "${ports[@]}"; do
            if [ "$port" != "$first_port" ]; then
                consistent=false
                break
            fi
        done
        
        if [ "$consistent" = true ]; then
            print_success "所有配置文件中的端口配置一致: $first_port"
            return 0
        else
            print_warning "配置文件中的端口配置不一致: ${ports[*]}"
            return 1
        fi
    elif [ ${#ports[@]} -eq 1 ]; then
        print_success "端口配置: ${ports[0]}"
        return 0
    else
        print_warning "未找到端口配置"
        return 1
    fi
}

# 主函数
main() {
    local install_dir="${1:-$(pwd)}"
    local target_port="$2"
    
    print_step "开始端口配置更新..."
    print_info "安装目录: $install_dir"
    
    if [ ! -d "$install_dir" ]; then
        print_error "安装目录不存在: $install_dir"
        exit 1
    fi
    
    cd "$install_dir"
    
    # 检查现有配置
    local current_port=""
    if [ -f "demo-config.json" ]; then
        current_port=$(read_port_from_config "demo-config.json")
        if [ $? -eq 0 ]; then
            print_info "当前配置端口: $current_port"
        fi
    fi
    
    # 如果没有指定目标端口，使用当前端口或默认端口
    if [ -z "$target_port" ]; then
        if [ -n "$current_port" ]; then
            target_port="$current_port"
        else
            target_port="3000"
        fi
    fi
    
    # 验证目标端口
    if ! validate_port "$target_port"; then
        print_error "目标端口无效: $target_port"
        exit 1
    fi
    
    print_info "目标端口: $target_port"
    
    # 迁移旧版本配置
    target_port=$(migrate_legacy_config "$install_dir" "$target_port")
    
    # 更新配置文件
    if [ -f "demo-config.json" ]; then
        update_port_in_config "demo-config.json" "$target_port"
    else
        print_warning "demo-config.json 不存在，将在部署时创建"
    fi
    
    # 验证配置一致性
    verify_port_consistency "$install_dir"
    
    # 更新启动脚本中的默认端口（如果存在）
    if [ -f "start-server.sh" ]; then
        print_step "更新启动脚本默认端口..."
        
        # 备份启动脚本
        cp "start-server.sh" "start-server.sh.backup"
        
        # 更新默认端口
        sed -i.tmp "s/PORT=3000/PORT=$target_port/" "start-server.sh"
        rm -f "start-server.sh.tmp"
        
        print_success "已更新启动脚本默认端口"
    fi
    
    print_step "端口配置更新完成！"
    
    echo -e "\n${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    🎉 更新完成！                              ║"
    echo "║                                                              ║"
    echo "║  ✅ 端口配置已更新为: $target_port                             ║"
    echo "║  ✅ 配置文件已同步                                           ║"
    echo "║  ✅ 启动脚本已更新                                           ║"
    echo "║  ✅ 旧配置已迁移                                             ║"
    echo "║                                                              ║"
    echo "║  📋 下一步操作:                                              ║"
    echo "║     1. 运行 ./start-server.sh 启动服务                       ║"
    echo "║     2. 访问 https://your-domain:$target_port                  ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
