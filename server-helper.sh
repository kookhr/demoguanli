#!/bin/bash
# 环境管理系统服务助手 - 用户体验优化工具

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

# 配置文件
PID_FILE="$SCRIPT_DIR/logs/server.pid"
LOG_DIR="$SCRIPT_DIR/logs"

# 工具函数
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${CYAN}ℹ️  $1${NC}"; }
print_header() { echo -e "${BOLD}${BLUE}$1${NC}"; }

# 显示主菜单
show_main_menu() {
    clear
    echo -e "${BOLD}${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║              🚀 环境管理系统服务助手                         ║"
    echo "║                                                              ║"
    echo "║  简化的服务管理界面，提供一键操作和状态监控                   ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    
    # 显示当前状态
    show_quick_status
    
    echo ""
    echo -e "${BOLD}${CYAN}📋 可用操作:${NC}"
    echo ""
    echo -e "  ${GREEN}1.${NC} 🚀 启动服务 (前台)"
    echo -e "  ${GREEN}2.${NC} 🌙 启动服务 (后台)"
    echo -e "  ${GREEN}3.${NC} 🛑 停止服务"
    echo -e "  ${GREEN}4.${NC} 🔄 重启服务"
    echo -e "  ${GREEN}5.${NC} 📊 查看状态"
    echo -e "  ${GREEN}6.${NC} 📋 查看日志"
    echo -e "  ${GREEN}7.${NC} 🔧 故障排除"
    echo -e "  ${GREEN}8.${NC} ⚙️  系统信息"
    echo -e "  ${GREEN}9.${NC} 📖 帮助文档"
    echo -e "  ${GREEN}0.${NC} 🚪 退出"
    echo ""
    echo -n -e "${CYAN}请选择操作 [0-9]: ${NC}"
}

# 显示快速状态
show_quick_status() {
    local status_info=$(check_service_status)
    local status=$(echo "$status_info" | cut -d: -f1)
    local pid_info=$(echo "$status_info" | cut -d: -f2)
    
    echo -e "${BOLD}${CYAN}🔍 当前状态:${NC}"
    
    if [ "$status" = "running" ]; then
        echo -e "  服务状态: ${GREEN}运行中${NC} (PID: $pid_info)"
        
        # 读取配置获取访问地址
        if [ -f "demo-config.json" ]; then
            local port=$(grep '"port"' demo-config.json | sed 's/.*: *\([0-9]*\).*/\1/')
            local domain=$(grep '"domain"' demo-config.json | sed 's/.*: *"\([^"]*\)".*/\1/')
            echo -e "  访问地址: ${GREEN}https://$domain:$port${NC}"
        fi
    else
        echo -e "  服务状态: ${RED}未运行${NC}"
    fi
}

# 检查服务状态
check_service_status() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            echo "running:$pid"
            return 0
        else
            rm -f "$PID_FILE"
            echo "stopped:stale_pid"
            return 1
        fi
    else
        echo "stopped:no_pid"
        return 1
    fi
}

# 启动前台服务
start_foreground() {
    print_header "🚀 启动前台服务"
    echo ""
    
    if ./start-server.sh; then
        print_success "服务启动成功"
    else
        print_error "服务启动失败"
        echo ""
        print_info "按任意键返回主菜单..."
        read -n 1
    fi
}

# 启动后台服务
start_daemon() {
    print_header "🌙 启动后台服务"
    echo ""
    
    if ./start-server.sh -d; then
        print_success "后台服务启动成功"
        echo ""
        print_info "按任意键返回主菜单..."
        read -n 1
    else
        print_error "后台服务启动失败"
        echo ""
        print_info "按任意键返回主菜单..."
        read -n 1
    fi
}

# 停止服务
stop_service() {
    print_header "🛑 停止服务"
    echo ""
    
    if ./stop-server.sh; then
        print_success "服务停止成功"
    else
        print_warning "服务可能未运行或停止时出现问题"
    fi
    
    echo ""
    print_info "按任意键返回主菜单..."
    read -n 1
}

# 重启服务
restart_service() {
    print_header "🔄 重启服务"
    echo ""
    
    echo -e "${CYAN}选择重启模式:${NC}"
    echo -e "  ${GREEN}1.${NC} 前台模式"
    echo -e "  ${GREEN}2.${NC} 后台模式"
    echo -e "  ${GREEN}3.${NC} 返回主菜单"
    echo ""
    echo -n -e "${CYAN}请选择 [1-3]: ${NC}"
    
    read -n 1 choice
    echo ""
    echo ""
    
    case $choice in
        1)
            print_info "重启为前台服务..."
            if ./restart-server.sh; then
                print_success "前台服务重启成功"
            else
                print_error "前台服务重启失败"
            fi
            ;;
        2)
            print_info "重启为后台服务..."
            if ./restart-server.sh -d; then
                print_success "后台服务重启成功"
                echo ""
                print_info "按任意键返回主菜单..."
                read -n 1
            else
                print_error "后台服务重启失败"
                echo ""
                print_info "按任意键返回主菜单..."
                read -n 1
            fi
            ;;
        3)
            return
            ;;
        *)
            print_error "无效选择"
            echo ""
            print_info "按任意键返回主菜单..."
            read -n 1
            ;;
    esac
}

# 查看状态
view_status() {
    print_header "📊 服务状态"
    echo ""
    
    ./status-server.sh -v
    
    echo ""
    print_info "按任意键返回主菜单..."
    read -n 1
}

# 查看日志
view_logs() {
    print_header "📋 日志查看"
    echo ""
    
    echo -e "${CYAN}选择日志类型:${NC}"
    echo -e "  ${GREEN}1.${NC} 服务日志"
    echo -e "  ${GREEN}2.${NC} 错误日志"
    echo -e "  ${GREEN}3.${NC} 访问日志"
    echo -e "  ${GREEN}4.${NC} 所有日志"
    echo -e "  ${GREEN}5.${NC} 实时日志"
    echo -e "  ${GREEN}6.${NC} 返回主菜单"
    echo ""
    echo -n -e "${CYAN}请选择 [1-6]: ${NC}"
    
    read -n 1 choice
    echo ""
    echo ""
    
    case $choice in
        1)
            if [ -f "manage-logs.sh" ]; then
                ./manage-logs.sh view server
            else
                print_warning "日志管理脚本不存在"
            fi
            ;;
        2)
            if [ -f "manage-logs.sh" ]; then
                ./manage-logs.sh view error
            else
                print_warning "日志管理脚本不存在"
            fi
            ;;
        3)
            if [ -f "manage-logs.sh" ]; then
                ./manage-logs.sh view access
            else
                print_warning "日志管理脚本不存在"
            fi
            ;;
        4)
            if [ -f "manage-logs.sh" ]; then
                ./manage-logs.sh view all
            else
                print_warning "日志管理脚本不存在"
            fi
            ;;
        5)
            print_info "实时日志查看 (按 Ctrl+C 退出)..."
            echo ""
            if [ -f "manage-logs.sh" ]; then
                ./manage-logs.sh tail all
            else
                print_warning "日志管理脚本不存在"
            fi
            ;;
        6)
            return
            ;;
        *)
            print_error "无效选择"
            ;;
    esac
    
    if [ "$choice" != "5" ] && [ "$choice" != "6" ]; then
        echo ""
        print_info "按任意键返回主菜单..."
        read -n 1
    fi
}

# 故障排除
troubleshoot() {
    print_header "🔧 故障排除"
    echo ""
    
    echo -e "${CYAN}常见问题排除:${NC}"
    echo -e "  ${GREEN}1.${NC} 检查端口占用"
    echo -e "  ${GREEN}2.${NC} 重新构建项目"
    echo -e "  ${GREEN}3.${NC} 清理日志文件"
    echo -e "  ${GREEN}4.${NC} 强制停止所有相关进程"
    echo -e "  ${GREEN}5.${NC} 检查系统兼容性"
    echo -e "  ${GREEN}6.${NC} 查看错误日志"
    echo -e "  ${GREEN}7.${NC} 返回主菜单"
    echo ""
    echo -n -e "${CYAN}请选择 [1-7]: ${NC}"
    
    read -n 1 choice
    echo ""
    echo ""
    
    case $choice in
        1)
            print_info "检查端口占用情况..."
            if command -v netstat >/dev/null 2>&1; then
                netstat -tuln | grep -E ":(3000|8080|9000|8443)" || print_info "未发现常用端口被占用"
            fi
            if command -v sockstat >/dev/null 2>&1; then
                sockstat -l | grep -E ":(3000|8080|9000|8443)" || print_info "未发现常用端口被占用"
            fi
            ;;
        2)
            print_info "重新构建项目..."
            if npm run build; then
                print_success "项目构建成功"
            else
                print_error "项目构建失败"
            fi
            ;;
        3)
            print_info "清理日志文件..."
            if [ -f "manage-logs.sh" ]; then
                ./manage-logs.sh clean
                print_success "日志清理完成"
            else
                print_warning "日志管理脚本不存在"
            fi
            ;;
        4)
            print_info "强制停止所有相关进程..."
            ./stop-server.sh -f
            ;;
        5)
            print_info "检查系统兼容性..."
            if [ -f "test-freebsd-compatibility.sh" ]; then
                ./test-freebsd-compatibility.sh
            else
                print_warning "兼容性测试脚本不存在"
            fi
            ;;
        6)
            print_info "查看最近的错误日志..."
            if [ -f "$LOG_DIR/error.log" ]; then
                tail -20 "$LOG_DIR/error.log"
            else
                print_info "错误日志文件不存在"
            fi
            ;;
        7)
            return
            ;;
        *)
            print_error "无效选择"
            ;;
    esac
    
    if [ "$choice" != "7" ]; then
        echo ""
        print_info "按任意键返回主菜单..."
        read -n 1
    fi
}

# 系统信息
show_system_info() {
    print_header "⚙️  系统信息"
    echo ""
    
    echo -e "${BOLD}${CYAN}系统环境:${NC}"
    echo -e "  操作系统: ${YELLOW}$(uname -s) $(uname -r)${NC}"
    echo -e "  主机名: ${YELLOW}$(hostname)${NC}"
    echo -e "  当前用户: ${YELLOW}$(whoami)${NC}"
    echo -e "  工作目录: ${YELLOW}$SCRIPT_DIR${NC}"
    echo ""
    
    echo -e "${BOLD}${CYAN}软件版本:${NC}"
    if command -v node >/dev/null 2>&1; then
        echo -e "  Node.js: ${YELLOW}$(node --version)${NC}"
    fi
    if command -v npm >/dev/null 2>&1; then
        echo -e "  NPM: ${YELLOW}$(npm --version)${NC}"
    fi
    echo -e "  Bash: ${YELLOW}$BASH_VERSION${NC}"
    echo ""
    
    echo -e "${BOLD}${CYAN}项目信息:${NC}"
    if [ -f "package.json" ]; then
        local project_name=$(grep '"name"' package.json | sed 's/.*: *"\([^"]*\)".*/\1/')
        local project_version=$(grep '"version"' package.json | sed 's/.*: *"\([^"]*\)".*/\1/')
        echo -e "  项目名称: ${YELLOW}$project_name${NC}"
        echo -e "  项目版本: ${YELLOW}$project_version${NC}"
    fi
    
    if [ -f "demo-config.json" ]; then
        local port=$(grep '"port"' demo-config.json | sed 's/.*: *\([0-9]*\).*/\1/')
        local domain=$(grep '"domain"' demo-config.json | sed 's/.*: *"\([^"]*\)".*/\1/')
        echo -e "  配置端口: ${YELLOW}$port${NC}"
        echo -e "  配置域名: ${YELLOW}$domain${NC}"
    fi
    
    echo ""
    print_info "按任意键返回主菜单..."
    read -n 1
}

# 帮助文档
show_help() {
    print_header "📖 帮助文档"
    echo ""
    
    echo -e "${BOLD}${CYAN}快速开始:${NC}"
    echo -e "  1. 选择 '启动服务' 开始使用"
    echo -e "  2. 后台模式适合长期运行"
    echo -e "  3. 前台模式适合调试和开发"
    echo ""
    
    echo -e "${BOLD}${CYAN}常用命令:${NC}"
    echo -e "  ./start-server.sh        启动前台服务"
    echo -e "  ./start-server.sh -d     启动后台服务"
    echo -e "  ./stop-server.sh         停止服务"
    echo -e "  ./restart-server.sh      重启服务"
    echo -e "  ./status-server.sh       查看状态"
    echo ""
    
    echo -e "${BOLD}${CYAN}故障排除:${NC}"
    echo -e "  • 端口被占用: 使用故障排除菜单检查端口"
    echo -e "  • 服务无法启动: 查看错误日志"
    echo -e "  • 构建失败: 重新运行构建命令"
    echo -e "  • 权限问题: 确保脚本有执行权限"
    echo ""
    
    echo -e "${BOLD}${CYAN}日志位置:${NC}"
    echo -e "  服务日志: logs/server.log"
    echo -e "  错误日志: logs/error.log"
    echo -e "  访问日志: logs/access.log"
    echo ""
    
    print_info "按任意键返回主菜单..."
    read -n 1
}

# 主循环
main() {
    while true; do
        show_main_menu
        read -n 1 choice
        echo ""
        
        case $choice in
            1)
                start_foreground
                ;;
            2)
                start_daemon
                ;;
            3)
                stop_service
                ;;
            4)
                restart_service
                ;;
            5)
                view_status
                ;;
            6)
                view_logs
                ;;
            7)
                troubleshoot
                ;;
            8)
                show_system_info
                ;;
            9)
                show_help
                ;;
            0)
                echo ""
                print_success "感谢使用环境管理系统服务助手！"
                exit 0
                ;;
            *)
                echo ""
                print_error "无效选择，请输入 0-9"
                echo ""
                print_info "按任意键继续..."
                read -n 1
                ;;
        esac
    done
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
