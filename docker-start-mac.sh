#!/bin/bash

# JobTrack Docker开发环境启动脚本 - Mac版本
# 支持代码热重载和实时同步

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================================"
echo -e "   JobTrack - Docker开发环境 (Mac版本)"
echo -e "============================================================${NC}"
echo

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[错误] Docker未安装${NC}"
    echo
    echo "请安装Docker Desktop for Mac:"
    echo "https://www.docker.com/products/docker-desktop"
    echo
    exit 1
fi

# 检查Docker是否运行
if ! docker info &> /dev/null; then
    echo -e "${RED}[错误] Docker未运行${NC}"
    echo
    echo "请启动Docker Desktop并重试"
    echo
    exit 1
fi

echo -e "${GREEN}[OK] Docker环境就绪${NC}"
echo

# 检查docker-compose文件
if [ ! -f "docker-compose.dev.yml" ]; then
    echo -e "${RED}[错误] docker-compose.dev.yml 未找到${NC}"
    echo "请确保在项目根目录运行此脚本"
    exit 1
fi

# 显示菜单
echo -e "${YELLOW}请选择操作:${NC}"
echo "1. 启动开发环境 (首次运行)"
echo "2. 快速启动 (使用现有镜像)"
echo "3. 重新构建并启动"
echo "4. 停止所有服务"
echo "5. 查看服务日志"
echo "6. 查看服务状态"
echo "7. 进入容器调试"
echo "8. 清理并重启"
echo

read -p "请输入选择 (1-8): " choice

case $choice in
    1)
        echo -e "${BLUE}正在构建并启动开发环境...${NC}"
        docker compose -f docker-compose.dev.yml up -d --build
        ;;
    2)
        echo -e "${BLUE}正在快速启动服务...${NC}"
        docker compose -f docker-compose.dev.yml up -d
        ;;
    3)
        echo -e "${BLUE}正在重新构建并启动...${NC}"
        docker compose -f docker-compose.dev.yml down
        docker compose -f docker-compose.dev.yml up -d --build
        ;;
    4)
        echo -e "${YELLOW}正在停止所有服务...${NC}"
        docker compose -f docker-compose.dev.yml down
        echo -e "${GREEN}服务已停止${NC}"
        exit 0
        ;;
    5)
        echo -e "${BLUE}显示服务日志 (按Ctrl+C退出)...${NC}"
        docker compose -f docker-compose.dev.yml logs -f
        exit 0
        ;;
    6)
        echo -e "${BLUE}服务状态:${NC}"
        docker compose -f docker-compose.dev.yml ps
        echo
        echo -e "${BLUE}资源使用情况:${NC}"
        docker stats --no-stream
        exit 0
        ;;
    7)
        echo -e "${YELLOW}选择要进入的容器:${NC}"
        echo "1. Backend (Node.js)"
        echo "2. Frontend (React)"
        echo "3. Python API"
        read -p "请选择 (1-3): " container_choice
        
        case $container_choice in
            1)
                docker compose -f docker-compose.dev.yml exec backend sh
                ;;
            2)
                docker compose -f docker-compose.dev.yml exec frontend sh
                ;;
            3)
                docker compose -f docker-compose.dev.yml exec python-api bash
                ;;
            *)
                echo -e "${RED}无效选择${NC}"
                exit 1
                ;;
        esac
        exit 0
        ;;
    8)
        echo -e "${YELLOW}正在清理并重启...${NC}"
        docker compose -f docker-compose.dev.yml down -v
        docker system prune -f
        docker compose -f docker-compose.dev.yml up -d --build
        ;;
    *)
        echo -e "${RED}无效选择${NC}"
        exit 1
        ;;
esac

# 检查启动状态
if [ $? -eq 0 ]; then
    echo
    echo -e "${GREEN}============================================================"
    echo -e "   服务启动成功!"
    echo -e "============================================================${NC}"
    echo
    echo -e "${GREEN}访问地址:${NC}"
    echo -e "  前端:     http://localhost"
    echo -e "  后端API:  http://localhost:3000"
    echo -e "  Python:   http://localhost:5000"
    echo -e "  Vite Dev: http://localhost:5173"
    echo
    echo -e "${YELLOW}开发模式特性:${NC}"
    echo -e "  ✅ 代码热重载 - 修改代码自动重启"
    echo -e "  ✅ 实时同步 - 本地修改立即生效"
    echo -e "  ✅ 调试友好 - 支持断点和日志"
    echo
    echo -e "${BLUE}常用命令:${NC}"
    echo -e "  查看日志: docker compose -f docker-compose.dev.yml logs -f"
    echo -e "  停止服务: docker compose -f docker-compose.dev.yml down"
    echo -e "  重启服务: docker compose -f docker-compose.dev.yml restart"
    echo
    echo -e "${YELLOW}等待10-20秒让服务完全启动，然后:${NC}"
    echo -e "  1. 打开 http://localhost 开始使用"
    echo -e "  2. 修改代码会自动重载"
    echo -e "  3. 使用Ctrl+C停止日志查看"
    echo
    
    # 询问是否查看日志
    read -p "是否现在查看服务日志? (y/n): " show_logs
    if [[ $show_logs =~ ^[Yy]$ ]]; then
        echo
        echo -e "${BLUE}显示服务日志 (按Ctrl+C退出)...${NC}"
        docker compose -f docker-compose.dev.yml logs -f
    fi
else
    echo
    echo -e "${RED}============================================================"
    echo -e "   服务启动失败!"
    echo -e "============================================================${NC}"
    echo
    echo -e "${YELLOW}故障排除:${NC}"
    echo -e "  1. 检查端口是否被占用: lsof -i :80,3000,5000,5173"
    echo -e "  2. 查看详细日志: docker compose -f docker-compose.dev.yml logs"
    echo -e "  3. 检查Docker资源: docker system df"
    echo -e "  4. 清理并重试: docker system prune -f"
    echo
    exit 1
fi
