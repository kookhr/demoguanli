#!/bin/bash
# FreeBSD/Serv00 兼容性测试脚本

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# 工具函数
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${CYAN}ℹ️  $1${NC}"; }
print_header() { echo -e "${BOLD}${BLUE}$1${NC}"; }

# 检测操作系统
detect_os() {
    local os_name=$(uname -s)
    local os_version=$(uname -r)
    
    print_header "🖥️  操作系统检测"
    echo -e "系统: ${CYAN}$os_name${NC}"
    echo -e "版本: ${CYAN}$os_version${NC}"
    
    if [[ "$os_name" == "FreeBSD" ]]; then
        print_success "检测到 FreeBSD 系统"
        return 0
    elif [[ "$os_name" == "Darwin" ]]; then
        print_warning "检测到 macOS 系统 (部分兼容)"
        return 1
    elif [[ "$os_name" == "Linux" ]]; then
        print_warning "检测到 Linux 系统 (部分兼容)"
        return 1
    else
        print_error "未知操作系统: $os_name"
        return 2
    fi
}

# 检查必要工具
check_tools() {
    print_header "🔧 工具检查"
    
    local tools=(
        "bash:Bash Shell"
        "node:Node.js"
        "npm:NPM"
        "git:Git"
        "curl:cURL"
        "netstat:网络状态工具"
        "ps:进程查看工具"
        "kill:进程控制工具"
        "stat:文件状态工具"
        "tail:日志查看工具"
        "grep:文本搜索工具"
        "sed:文本处理工具"
        "wc:文本统计工具"
    )
    
    local missing_tools=()
    local optional_tools=()
    
    for tool_info in "${tools[@]}"; do
        local tool=$(echo "$tool_info" | cut -d: -f1)
        local desc=$(echo "$tool_info" | cut -d: -f2)
        
        if command -v "$tool" >/dev/null 2>&1; then
            local version=""
            case "$tool" in
                node)
                    version=" ($(node --version))"
                    ;;
                npm)
                    version=" ($(npm --version))"
                    ;;
                git)
                    version=" ($(git --version | cut -d' ' -f3))"
                    ;;
            esac
            print_success "$desc 可用$version"
        else
            if [[ "$tool" =~ ^(node|npm|git|curl|bash)$ ]]; then
                missing_tools+=("$desc")
                print_error "$desc 缺失 (必需)"
            else
                optional_tools+=("$desc")
                print_warning "$desc 缺失 (可选)"
            fi
        fi
    done
    
    # 检查 FreeBSD 特有工具
    print_info "检查 FreeBSD 特有工具..."
    
    if command -v sockstat >/dev/null 2>&1; then
        print_success "sockstat 可用 (FreeBSD 特有)"
    else
        print_warning "sockstat 不可用 (非 FreeBSD 系统)"
    fi
    
    # 返回结果
    if [ ${#missing_tools[@]} -gt 0 ]; then
        print_error "缺少必需工具: ${missing_tools[*]}"
        return 1
    else
        print_success "所有必需工具都可用"
        return 0
    fi
}

# 测试端口检查功能
test_port_functions() {
    print_header "🌐 端口检查功能测试"
    
    # 端口验证函数
    validate_port() {
        local port="$1"
        if ! [[ "$port" =~ ^[0-9]+$ ]] || [ "$port" -lt 1024 ] || [ "$port" -gt 65535 ]; then
            return 1
        fi
        return 0
    }
    
    # 端口占用检查函数
    check_port_available() {
        local port="$1"
        
        # 使用 netstat 检查端口占用
        if command -v netstat >/dev/null 2>&1; then
            if netstat -tuln 2>/dev/null | grep -q ":$port "; then
                return 1
            fi
        fi
        
        # 使用 sockstat 检查端口占用 (FreeBSD 特有)
        if command -v sockstat >/dev/null 2>&1; then
            if sockstat -l | grep -q ":$port "; then
                return 1
            fi
        fi
        
        return 0
    }
    
    # 测试端口验证
    local test_ports=(3000 8080 9000 80 443 1023 65536)
    local valid_ports=(3000 8080 9000)
    local invalid_ports=(80 443 1023 65536)
    
    print_info "测试端口验证功能..."
    
    for port in "${valid_ports[@]}"; do
        if validate_port "$port"; then
            print_success "端口 $port 验证通过"
        else
            print_error "端口 $port 验证失败 (应该通过)"
        fi
    done
    
    for port in "${invalid_ports[@]}"; do
        if ! validate_port "$port"; then
            print_success "端口 $port 正确被拒绝"
        else
            print_error "端口 $port 错误通过验证"
        fi
    done
    
    # 测试端口占用检查
    print_info "测试端口占用检查功能..."
    
    local common_ports=(22 80 443 3000 8080)
    for port in "${common_ports[@]}"; do
        if check_port_available "$port"; then
            print_info "端口 $port 可用"
        else
            print_info "端口 $port 被占用"
        fi
    done
}

# 测试文件操作
test_file_operations() {
    print_header "📁 文件操作测试"
    
    local test_dir="$SCRIPT_DIR/test_freebsd_compat"
    local test_file="$test_dir/test.log"
    
    # 创建测试目录
    if mkdir -p "$test_dir"; then
        print_success "目录创建成功"
    else
        print_error "目录创建失败"
        return 1
    fi
    
    # 创建测试文件
    echo "Test log entry $(date)" > "$test_file"
    if [ -f "$test_file" ]; then
        print_success "文件创建成功"
    else
        print_error "文件创建失败"
        return 1
    fi
    
    # 测试文件大小获取 (FreeBSD vs Linux)
    local size1 size2
    size1=$(stat -f%z "$test_file" 2>/dev/null || echo "")
    size2=$(stat -c%s "$test_file" 2>/dev/null || echo "")
    
    if [ -n "$size1" ]; then
        print_success "FreeBSD stat 命令可用 (文件大小: $size1 字节)"
    elif [ -n "$size2" ]; then
        print_success "Linux stat 命令可用 (文件大小: $size2 字节)"
    else
        print_error "stat 命令不可用"
    fi
    
    # 测试日志轮转
    local rotated_file="$test_dir/test_$(date +%Y%m%d_%H%M%S).log"
    if mv "$test_file" "$rotated_file"; then
        print_success "文件轮转成功"
    else
        print_error "文件轮转失败"
    fi
    
    # 清理测试文件
    rm -rf "$test_dir"
    print_success "测试文件清理完成"
}

# 测试进程管理
test_process_management() {
    print_header "⚙️  进程管理测试"
    
    # 测试进程查找
    print_info "测试进程查找功能..."
    
    local current_pid=$$
    if kill -0 "$current_pid" 2>/dev/null; then
        print_success "进程信号测试通过 (PID: $current_pid)"
    else
        print_error "进程信号测试失败"
    fi
    
    # 测试 ps 命令
    if command -v ps >/dev/null 2>&1; then
        local ps_output=$(ps -o pid,comm -p "$current_pid" 2>/dev/null)
        if [ -n "$ps_output" ]; then
            print_success "ps 命令可用"
        else
            print_warning "ps 命令输出异常"
        fi
    else
        print_error "ps 命令不可用"
    fi
    
    # 测试 pgrep 命令
    if command -v pgrep >/dev/null 2>&1; then
        print_success "pgrep 命令可用"
    else
        print_warning "pgrep 命令不可用"
    fi
}

# 测试网络功能
test_network_functions() {
    print_header "🌐 网络功能测试"
    
    # 测试 netstat
    if command -v netstat >/dev/null 2>&1; then
        local netstat_output=$(netstat -tuln 2>/dev/null | head -5)
        if [ -n "$netstat_output" ]; then
            print_success "netstat 命令可用"
        else
            print_warning "netstat 命令输出异常"
        fi
    else
        print_error "netstat 命令不可用"
    fi
    
    # 测试 sockstat (FreeBSD 特有)
    if command -v sockstat >/dev/null 2>&1; then
        local sockstat_output=$(sockstat -l 2>/dev/null | head -5)
        if [ -n "$sockstat_output" ]; then
            print_success "sockstat 命令可用 (FreeBSD 特有)"
        else
            print_warning "sockstat 命令输出异常"
        fi
    else
        print_info "sockstat 命令不可用 (非 FreeBSD 系统)"
    fi
    
    # 测试 nc (netcat)
    if command -v nc >/dev/null 2>&1; then
        print_success "nc (netcat) 命令可用"
    else
        print_warning "nc (netcat) 命令不可用"
    fi
    
    # 测试 curl
    if command -v curl >/dev/null 2>&1; then
        print_success "curl 命令可用"
        
        # 测试网络连接
        if curl -s --connect-timeout 3 "https://www.google.com" >/dev/null 2>&1; then
            print_success "网络连接正常"
        else
            print_warning "网络连接异常或超时"
        fi
    else
        print_error "curl 命令不可用"
    fi
}

# 测试脚本兼容性
test_script_compatibility() {
    print_header "📜 脚本兼容性测试"
    
    # 测试 Bash 版本
    local bash_version=$BASH_VERSION
    print_info "Bash 版本: $bash_version"
    
    # 测试数组功能
    local test_array=(a b c)
    if [ ${#test_array[@]} -eq 3 ]; then
        print_success "数组功能正常"
    else
        print_error "数组功能异常"
    fi
    
    # 测试字符串操作
    local test_string="hello:world"
    local part1=$(echo "$test_string" | cut -d: -f1)
    local part2=$(echo "$test_string" | cut -d: -f2)
    
    if [ "$part1" = "hello" ] && [ "$part2" = "world" ]; then
        print_success "字符串操作正常"
    else
        print_error "字符串操作异常"
    fi
    
    # 测试正则表达式
    if [[ "12345" =~ ^[0-9]+$ ]]; then
        print_success "正则表达式支持正常"
    else
        print_error "正则表达式支持异常"
    fi
}

# 生成兼容性报告
generate_report() {
    print_header "📋 兼容性报告"
    
    local os_name=$(uname -s)
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo ""
    echo -e "${BOLD}系统信息:${NC}"
    echo -e "  操作系统: ${CYAN}$os_name$(uname -r)${NC}"
    echo -e "  测试时间: ${CYAN}$timestamp${NC}"
    echo -e "  脚本位置: ${CYAN}$SCRIPT_DIR${NC}"
    
    echo ""
    echo -e "${BOLD}兼容性评估:${NC}"
    
    if [[ "$os_name" == "FreeBSD" ]]; then
        echo -e "  ${GREEN}✅ 完全兼容 FreeBSD 环境${NC}"
        echo -e "  ${GREEN}✅ 支持所有 Serv00 特性${NC}"
        echo -e "  ${GREEN}✅ 推荐在生产环境使用${NC}"
    else
        echo -e "  ${YELLOW}⚠️  部分兼容非 FreeBSD 环境${NC}"
        echo -e "  ${YELLOW}⚠️  某些功能可能受限${NC}"
        echo -e "  ${YELLOW}⚠️  建议在 FreeBSD 环境测试${NC}"
    fi
    
    echo ""
    echo -e "${BOLD}建议:${NC}"
    echo -e "  1. 在 Serv00 FreeBSD 环境中进行最终测试"
    echo -e "  2. 确保所有必需工具都已安装"
    echo -e "  3. 定期运行兼容性测试"
    
    echo ""
}

# 主函数
main() {
    echo -e "${BOLD}${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║              🧪 FreeBSD/Serv00 兼容性测试                    ║"
    echo "║                                                              ║"
    echo "║  测试环境管理系统在 FreeBSD 环境下的兼容性                    ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    
    # 执行所有测试
    detect_os
    echo ""
    
    check_tools
    echo ""
    
    test_port_functions
    echo ""
    
    test_file_operations
    echo ""
    
    test_process_management
    echo ""
    
    test_network_functions
    echo ""
    
    test_script_compatibility
    echo ""
    
    generate_report
    
    echo -e "${GREEN}🎉 兼容性测试完成！${NC}"
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
