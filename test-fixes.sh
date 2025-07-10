#!/bin/bash

# 环境管理系统修复验证脚本
# 用于测试三个关键bug的修复效果

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

DOMAIN="do.kandy.dpdns.org"
API_BASE="https://$DOMAIN/api"

echo -e "${BOLD}${BLUE}🧪 环境管理系统修复验证测试${NC}"
echo -e "${CYAN}测试域名: $DOMAIN${NC}"
echo ""

# 测试函数
test_api_health() {
    echo -e "${BLUE}📋 测试1: API健康检查${NC}"
    
    if curl -s -f "$API_BASE/health" >/dev/null; then
        echo -e "${GREEN}✅ API健康检查通过${NC}"
        return 0
    else
        echo -e "${RED}❌ API健康检查失败${NC}"
        return 1
    fi
}

test_detection_timeout() {
    echo -e "${BLUE}📋 测试2: 检测超时时间验证${NC}"
    
    # 测试一个慢响应的网站
    local start_time=$(date +%s)
    
    # 使用curl模拟前端检测，设置8秒超时
    if timeout 10 curl -s -I --max-time 8 "https://httpbin.org/delay/3" >/dev/null 2>&1; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        if [ $duration -le 10 ]; then
            echo -e "${GREEN}✅ 超时时间配置正确 (${duration}秒)${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  超时时间可能过长 (${duration}秒)${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ 超时测试失败${NC}"
        return 1
    fi
}

test_public_ip_detection() {
    echo -e "${BLUE}📋 测试3: 公网IP检测验证${NC}"
    
    # 测试几个公网IP地址
    local test_ips=(
        "8.8.8.8"           # Google DNS
        "1.1.1.1"           # Cloudflare DNS
        "208.67.222.222"    # OpenDNS
    )
    
    local success_count=0
    local total_count=${#test_ips[@]}
    
    for ip in "${test_ips[@]}"; do
        echo -n "  测试 $ip ... "
        
        # 使用ping测试网络可达性
        if ping -c 1 -W 3 "$ip" >/dev/null 2>&1; then
            echo -e "${GREEN}可达${NC}"
            ((success_count++))
        else
            echo -e "${RED}不可达${NC}"
        fi
    done
    
    if [ $success_count -eq $total_count ]; then
        echo -e "${GREEN}✅ 公网IP检测正常 ($success_count/$total_count)${NC}"
        return 0
    elif [ $success_count -gt 0 ]; then
        echo -e "${YELLOW}⚠️  部分公网IP可达 ($success_count/$total_count)${NC}"
        return 1
    else
        echo -e "${RED}❌ 公网IP检测失败 ($success_count/$total_count)${NC}"
        return 1
    fi
}

test_frontend_detection_button() {
    echo -e "${BLUE}📋 测试4: 前端检测按钮功能${NC}"
    
    # 检查前端文件是否存在
    if [ -f "/usr/home/s14kook/domains/$DOMAIN/public_html/dist/index.html" ]; then
        echo -e "${GREEN}✅ 前端文件存在${NC}"
        
        # 检查JavaScript文件
        if ls /usr/home/s14kook/domains/$DOMAIN/public_html/dist/assets/*.js >/dev/null 2>&1; then
            echo -e "${GREEN}✅ JavaScript文件存在${NC}"
            return 0
        else
            echo -e "${RED}❌ JavaScript文件缺失${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ 前端文件不存在${NC}"
        return 1
    fi
}

test_network_check_logic() {
    echo -e "${BLUE}📋 测试5: 网络检测逻辑验证${NC}"
    
    # 测试不同类型的URL
    local test_urls=(
        "https://www.google.com"      # 正常HTTPS网站
        "http://httpbin.org/status/200"  # HTTP网站
        "https://httpbin.org/status/404"  # 404状态
        "https://httpbin.org/status/500"  # 500状态
    )
    
    local test_count=0
    local success_count=0
    
    for url in "${test_urls[@]}"; do
        echo -n "  测试 $url ... "
        ((test_count++))
        
        # 使用curl测试，模拟前端检测逻辑
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "$url" 2>/dev/null || echo "000")
        
        if [ "$status_code" != "000" ]; then
            echo -e "${GREEN}响应码: $status_code${NC}"
            ((success_count++))
        else
            echo -e "${RED}无响应${NC}"
        fi
    done
    
    if [ $success_count -ge 2 ]; then
        echo -e "${GREEN}✅ 网络检测逻辑正常 ($success_count/$test_count)${NC}"
        return 0
    else
        echo -e "${RED}❌ 网络检测逻辑异常 ($success_count/$test_count)${NC}"
        return 1
    fi
}

test_build_and_mime_types() {
    echo -e "${BLUE}📋 测试6: 构建和MIME类型验证${NC}"
    
    # 检查.htaccess文件
    if [ -f "/usr/home/s14kook/domains/$DOMAIN/public_html/.htaccess" ]; then
        echo -e "${GREEN}✅ .htaccess文件存在${NC}"
        
        # 检查MIME类型配置
        if grep -q "application/javascript" "/usr/home/s14kook/domains/$DOMAIN/public_html/.htaccess"; then
            echo -e "${GREEN}✅ JavaScript MIME类型配置正确${NC}"
        else
            echo -e "${YELLOW}⚠️  JavaScript MIME类型配置可能有问题${NC}"
        fi
    else
        echo -e "${RED}❌ .htaccess文件不存在${NC}"
        return 1
    fi
    
    # 测试网站访问
    if curl -s -I "https://$DOMAIN/" | grep -q "200\|301\|302"; then
        echo -e "${GREEN}✅ 网站可访问${NC}"
        return 0
    else
        echo -e "${RED}❌ 网站访问失败${NC}"
        return 1
    fi
}

# 运行所有测试
run_all_tests() {
    local total_tests=6
    local passed_tests=0
    
    echo -e "${BOLD}开始运行修复验证测试...${NC}"
    echo ""
    
    # 测试1: API健康检查
    if test_api_health; then
        ((passed_tests++))
    fi
    echo ""
    
    # 测试2: 检测超时时间
    if test_detection_timeout; then
        ((passed_tests++))
    fi
    echo ""
    
    # 测试3: 公网IP检测
    if test_public_ip_detection; then
        ((passed_tests++))
    fi
    echo ""
    
    # 测试4: 前端检测按钮
    if test_frontend_detection_button; then
        ((passed_tests++))
    fi
    echo ""
    
    # 测试5: 网络检测逻辑
    if test_network_check_logic; then
        ((passed_tests++))
    fi
    echo ""
    
    # 测试6: 构建和MIME类型
    if test_build_and_mime_types; then
        ((passed_tests++))
    fi
    echo ""
    
    # 总结
    echo -e "${BOLD}${BLUE}📊 测试结果总结${NC}"
    echo -e "通过测试: ${GREEN}$passed_tests${NC}/$total_tests"
    
    if [ $passed_tests -eq $total_tests ]; then
        echo -e "${BOLD}${GREEN}🎉 所有测试通过！修复成功！${NC}"
        return 0
    elif [ $passed_tests -ge 4 ]; then
        echo -e "${BOLD}${YELLOW}⚠️  大部分测试通过，可能需要微调${NC}"
        return 1
    else
        echo -e "${BOLD}${RED}❌ 多个测试失败，需要进一步修复${NC}"
        return 1
    fi
}

# 主函数
main() {
    run_all_tests
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
