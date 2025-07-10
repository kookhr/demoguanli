#!/bin/bash
# 环境管理系统日志管理脚本

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

# 配置
LOG_DIR="$SCRIPT_DIR/logs"
ACCESS_LOG="$LOG_DIR/access.log"
ERROR_LOG="$LOG_DIR/error.log"
SERVER_LOG="$LOG_DIR/server.log"
ARCHIVE_DIR="$LOG_DIR/archive"

# 日志文件大小限制 (10MB)
MAX_LOG_SIZE=10485760

# 工具函数
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${CYAN}ℹ️  $1${NC}"; }

# 显示帮助信息
show_help() {
    echo -e "${BOLD}${BLUE}环境管理系统日志管理脚本${NC}"
    echo ""
    echo "用法: $0 [命令] [选项]"
    echo ""
    echo "命令:"
    echo "  view [type]      查看日志 (server|error|access|all)"
    echo "  tail [type]      实时查看日志"
    echo "  rotate           手动轮转日志"
    echo "  clean            清理旧日志"
    echo "  stats            显示日志统计"
    echo "  archive          归档日志"
    echo ""
    echo "选项:"
    echo "  -n, --lines NUM  显示行数 (默认: 50)"
    echo "  -f, --follow     实时跟踪日志"
    echo "  -h, --help       显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 view server           查看服务日志"
    echo "  $0 tail error            实时查看错误日志"
    echo "  $0 view all -n 100       查看所有日志最后100行"
    echo "  $0 rotate                手动轮转日志"
    echo "  $0 clean                 清理7天前的日志"
    echo ""
}

# 获取文件大小 (FreeBSD 兼容)
get_file_size() {
    local file="$1"
    if [ -f "$file" ]; then
        # FreeBSD 使用 stat -f%z，Linux 使用 stat -c%s
        stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo 0
    else
        echo 0
    fi
}

# 创建日志目录
setup_log_dirs() {
    if [ ! -d "$LOG_DIR" ]; then
        mkdir -p "$LOG_DIR"
        print_info "创建日志目录: $LOG_DIR"
    fi
    
    if [ ! -d "$ARCHIVE_DIR" ]; then
        mkdir -p "$ARCHIVE_DIR"
        print_info "创建归档目录: $ARCHIVE_DIR"
    fi
}

# 轮转单个日志文件
rotate_log_file() {
    local log_file="$1"
    local log_name=$(basename "$log_file" .log)
    
    if [ -f "$log_file" ]; then
        local file_size=$(get_file_size "$log_file")
        
        if [ "$file_size" -gt "$MAX_LOG_SIZE" ]; then
            local timestamp=$(date +%Y%m%d_%H%M%S)
            local rotated_file="${ARCHIVE_DIR}/${log_name}_${timestamp}.log"
            
            mv "$log_file" "$rotated_file"
            touch "$log_file"
            
            # 压缩归档文件
            if command -v gzip >/dev/null 2>&1; then
                gzip "$rotated_file"
                print_success "轮转并压缩: ${log_name}.log -> ${log_name}_${timestamp}.log.gz"
            else
                print_success "轮转: ${log_name}.log -> ${log_name}_${timestamp}.log"
            fi
            
            return 0
        fi
    fi
    
    return 1
}

# 轮转所有日志
rotate_logs() {
    print_info "检查日志轮转..."
    
    local rotated=false
    
    for log_file in "$SERVER_LOG" "$ERROR_LOG" "$ACCESS_LOG"; do
        if rotate_log_file "$log_file"; then
            rotated=true
        fi
    done
    
    if [ "$rotated" = false ]; then
        print_info "所有日志文件大小正常，无需轮转"
    fi
}

# 查看日志
view_logs() {
    local log_type="$1"
    local lines="${2:-50}"
    
    case "$log_type" in
        server)
            if [ -f "$SERVER_LOG" ]; then
                echo -e "${CYAN}🖥️  服务日志 (最后 $lines 行):${NC}"
                tail -n "$lines" "$SERVER_LOG"
            else
                print_warning "服务日志文件不存在"
            fi
            ;;
        error)
            if [ -f "$ERROR_LOG" ]; then
                echo -e "${YELLOW}❌ 错误日志 (最后 $lines 行):${NC}"
                tail -n "$lines" "$ERROR_LOG"
            else
                print_warning "错误日志文件不存在"
            fi
            ;;
        access)
            if [ -f "$ACCESS_LOG" ]; then
                echo -e "${GREEN}📝 访问日志 (最后 $lines 行):${NC}"
                tail -n "$lines" "$ACCESS_LOG"
            else
                print_warning "访问日志文件不存在"
            fi
            ;;
        all)
            view_logs "server" "$lines"
            echo ""
            view_logs "error" "$lines"
            echo ""
            view_logs "access" "$lines"
            ;;
        *)
            print_error "未知日志类型: $log_type"
            print_info "可用类型: server, error, access, all"
            exit 1
            ;;
    esac
}

# 实时查看日志
tail_logs() {
    local log_type="$1"
    
    case "$log_type" in
        server)
            if [ -f "$SERVER_LOG" ]; then
                echo -e "${CYAN}🖥️  实时查看服务日志 (按 Ctrl+C 退出):${NC}"
                tail -f "$SERVER_LOG"
            else
                print_warning "服务日志文件不存在"
            fi
            ;;
        error)
            if [ -f "$ERROR_LOG" ]; then
                echo -e "${YELLOW}❌ 实时查看错误日志 (按 Ctrl+C 退出):${NC}"
                tail -f "$ERROR_LOG"
            else
                print_warning "错误日志文件不存在"
            fi
            ;;
        access)
            if [ -f "$ACCESS_LOG" ]; then
                echo -e "${GREEN}📝 实时查看访问日志 (按 Ctrl+C 退出):${NC}"
                tail -f "$ACCESS_LOG"
            else
                print_warning "访问日志文件不存在"
            fi
            ;;
        all)
            if [ -f "$SERVER_LOG" ] || [ -f "$ERROR_LOG" ] || [ -f "$ACCESS_LOG" ]; then
                echo -e "${BLUE}📋 实时查看所有日志 (按 Ctrl+C 退出):${NC}"
                tail -f "$SERVER_LOG" "$ERROR_LOG" "$ACCESS_LOG" 2>/dev/null
            else
                print_warning "没有日志文件存在"
            fi
            ;;
        *)
            print_error "未知日志类型: $log_type"
            print_info "可用类型: server, error, access, all"
            exit 1
            ;;
    esac
}

# 显示日志统计
show_stats() {
    echo -e "${BOLD}${BLUE}📊 日志统计信息${NC}"
    echo ""
    
    for log_file in "$SERVER_LOG" "$ERROR_LOG" "$ACCESS_LOG"; do
        local log_name=$(basename "$log_file" .log)
        
        if [ -f "$log_file" ]; then
            local lines=$(wc -l < "$log_file" 2>/dev/null || echo "0")
            local size=$(get_file_size "$log_file")
            local size_mb=$((size / 1024 / 1024))
            local size_kb=$((size / 1024))
            
            if [ "$size_mb" -gt 0 ]; then
                local size_display="${size_mb}MB"
            else
                local size_display="${size_kb}KB"
            fi
            
            echo -e "${CYAN}📄 ${log_name^} 日志:${NC}"
            echo -e "   行数: ${YELLOW}$lines${NC}"
            echo -e "   大小: ${YELLOW}$size_display${NC}"
            echo -e "   路径: ${YELLOW}$log_file${NC}"
            echo ""
        else
            echo -e "${CYAN}📄 ${log_name^} 日志:${NC} ${RED}不存在${NC}"
            echo ""
        fi
    done
    
    # 显示归档统计
    if [ -d "$ARCHIVE_DIR" ]; then
        local archive_count=$(find "$ARCHIVE_DIR" -name "*.log*" | wc -l)
        echo -e "${CYAN}📦 归档文件:${NC} ${YELLOW}$archive_count 个${NC}"
        echo ""
    fi
}

# 清理旧日志
clean_logs() {
    local days="${1:-7}"
    
    print_info "清理 $days 天前的归档日志..."
    
    if [ -d "$ARCHIVE_DIR" ]; then
        local deleted_count=0
        
        # 查找并删除旧文件
        find "$ARCHIVE_DIR" -name "*.log*" -mtime +$days -type f | while read -r file; do
            rm -f "$file"
            echo "删除: $(basename "$file")"
            deleted_count=$((deleted_count + 1))
        done
        
        print_success "清理完成"
    else
        print_info "归档目录不存在，无需清理"
    fi
}

# 归档日志
archive_logs() {
    print_info "归档当前日志..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local archived=false
    
    for log_file in "$SERVER_LOG" "$ERROR_LOG" "$ACCESS_LOG"; do
        if [ -f "$log_file" ] && [ -s "$log_file" ]; then
            local log_name=$(basename "$log_file" .log)
            local archive_file="${ARCHIVE_DIR}/${log_name}_${timestamp}.log"
            
            cp "$log_file" "$archive_file"
            > "$log_file"  # 清空原文件
            
            # 压缩归档文件
            if command -v gzip >/dev/null 2>&1; then
                gzip "$archive_file"
                print_success "归档并压缩: ${log_name}.log"
            else
                print_success "归档: ${log_name}.log"
            fi
            
            archived=true
        fi
    done
    
    if [ "$archived" = false ]; then
        print_info "没有日志需要归档"
    fi
}

# 主函数
main() {
    local command=""
    local log_type=""
    local lines=50
    local follow=false
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            view|tail|rotate|clean|stats|archive)
                command="$1"
                shift
                ;;
            server|error|access|all)
                log_type="$1"
                shift
                ;;
            -n|--lines)
                lines="$2"
                shift 2
                ;;
            -f|--follow)
                follow=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                if [ -z "$command" ]; then
                    print_error "未知命令: $1"
                    show_help
                    exit 1
                elif [ -z "$log_type" ] && [[ "$1" =~ ^[0-9]+$ ]]; then
                    lines="$1"
                    shift
                else
                    print_error "未知参数: $1"
                    show_help
                    exit 1
                fi
                ;;
        esac
    done
    
    # 如果没有指定命令，显示帮助
    if [ -z "$command" ]; then
        show_help
        exit 0
    fi
    
    # 设置日志目录
    setup_log_dirs
    
    # 执行命令
    case "$command" in
        view)
            if [ -z "$log_type" ]; then
                log_type="all"
            fi
            view_logs "$log_type" "$lines"
            ;;
        tail)
            if [ -z "$log_type" ]; then
                log_type="all"
            fi
            tail_logs "$log_type"
            ;;
        rotate)
            rotate_logs
            ;;
        clean)
            clean_logs
            ;;
        stats)
            show_stats
            ;;
        archive)
            archive_logs
            ;;
    esac
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
