#!/bin/bash

# Mac开发环境一键设置脚本
# 自动配置Mac上的JobTrack开发环境

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}============================================================"
echo -e "   JobTrack - Mac开发环境一键设置"
echo -e "============================================================${NC}"
echo

# 检查系统
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}[错误] 此脚本仅适用于macOS系统${NC}"
    exit 1
fi

echo -e "${BLUE}正在设置Mac开发环境...${NC}"

# 1. 检查Docker
echo "1. 检查Docker环境..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[错误] Docker未安装${NC}"
    echo
    echo "请安装Docker Desktop for Mac:"
    echo "https://www.docker.com/products/docker-desktop"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo -e "${RED}[错误] Docker未运行${NC}"
    echo "请启动Docker Desktop并重试"
    exit 1
fi

echo -e "${GREEN}✓ Docker环境正常${NC}"

# 2. 检查必要文件
echo "2. 检查项目文件..."
required_files=(
    "docker-compose.dev.yml"
    "Dockerfile.frontend.dev"
    "docker-start-mac.sh"
    "MAC_DEVELOPMENT_GUIDE.md"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}[错误] 缺少文件: $file${NC}"
        echo "请确保在项目根目录运行此脚本"
        exit 1
    fi
done

echo -e "${GREEN}✓ 项目文件完整${NC}"

# 3. 设置权限
echo "3. 设置脚本权限..."
chmod +x docker-start-mac.sh
chmod +x sync-to-mac.sh 2>/dev/null || echo "跳过sync-to-mac.sh（Windows专用）"

echo -e "${GREEN}✓ 权限设置完成${NC}"

# 4. 创建数据目录
echo "4. 创建数据目录..."
mkdir -p backend/data
mkdir -p backend/export
mkdir -p model_backups

echo -e "${GREEN}✓ 数据目录创建完成${NC}"

# 5. 检查端口占用
echo "5. 检查端口占用..."
ports=(80 3000 5000 5173)
occupied_ports=()

for port in "${ports[@]}"; do
    if lsof -i :$port &> /dev/null; then
        occupied_ports+=($port)
    fi
done

if [ ${#occupied_ports[@]} -gt 0 ]; then
    echo -e "${YELLOW}警告: 以下端口被占用: ${occupied_ports[*]}${NC}"
    echo "请检查是否有其他服务在使用这些端口"
    echo
    read -p "是否继续? (y/n): " continue_setup
    if [[ ! $continue_setup =~ ^[Yy]$ ]]; then
        echo "设置已取消"
        exit 0
    fi
fi

echo -e "${GREEN}✓ 端口检查完成${NC}"

# 6. 创建环境配置文件
echo "6. 创建环境配置..."
cat > .env.mac << EOF
# Mac开发环境配置
NODE_ENV=development
FLASK_ENV=development
VITE_API_URL=http://localhost:3000
VITE_PYTHON_API_URL=http://localhost:5000

# 数据目录配置
DATA_DIR=./backend/data
EXPORT_DIR=./backend/export
MODEL_DIR=./model_backups

# 开发模式配置
HOT_RELOAD=true
DEBUG_MODE=true
LOG_LEVEL=debug
EOF

echo -e "${GREEN}✓ 环境配置创建完成${NC}"

# 7. 创建快速启动别名
echo "7. 创建快速启动别名..."
cat > ~/.jobtrack_aliases << EOF
# JobTrack Mac开发环境别名
alias jobtrack-start='cd $(pwd) && ./docker-start-mac.sh'
alias jobtrack-logs='docker compose -f docker-compose.dev.yml logs -f'
alias jobtrack-stop='docker compose -f docker-compose.dev.yml down'
alias jobtrack-restart='docker compose -f docker-compose.dev.yml restart'
alias jobtrack-status='docker compose -f docker-compose.dev.yml ps'
alias jobtrack-clean='docker system prune -f'
EOF

echo -e "${GREEN}✓ 别名创建完成${NC}"

# 8. 创建开发工具脚本
echo "8. 创建开发工具..."
cat > dev-tools.sh << 'EOF'
#!/bin/bash

# JobTrack Mac开发工具集

case "$1" in
    "start")
        ./docker-start-mac.sh
        ;;
    "logs")
        docker compose -f docker-compose.dev.yml logs -f
        ;;
    "stop")
        docker compose -f docker-compose.dev.yml down
        ;;
    "restart")
        docker compose -f docker-compose.dev.yml restart
        ;;
    "status")
        docker compose -f docker-compose.dev.yml ps
        echo
        docker stats --no-stream
        ;;
    "clean")
        docker system prune -f
        ;;
    "shell")
        echo "选择要进入的容器:"
        echo "1. Backend"
        echo "2. Frontend" 
        echo "3. Python"
        read -p "请选择 (1-3): " choice
        case $choice in
            1) docker compose -f docker-compose.dev.yml exec backend sh ;;
            2) docker compose -f docker-compose.dev.yml exec frontend sh ;;
            3) docker compose -f docker-compose.dev.yml exec python-api bash ;;
        esac
        ;;
    "train")
        echo "训练新模型..."
        python train_model.py --data emails_real.csv
        docker compose -f docker-compose.dev.yml restart python-api
        ;;
    "backup")
        echo "备份数据..."
        tar czf "backup-$(date +%Y%m%d-%H%M%S).tar.gz" backend/data backend/export model.pkl vectorizer.pkl
        echo "备份完成"
        ;;
    *)
        echo "JobTrack Mac开发工具"
        echo
        echo "用法: ./dev-tools.sh <command>"
        echo
        echo "可用命令:"
        echo "  start    - 启动开发环境"
        echo "  logs     - 查看日志"
        echo "  stop     - 停止服务"
        echo "  restart  - 重启服务"
        echo "  status   - 查看状态"
        echo "  clean    - 清理资源"
        echo "  shell    - 进入容器"
        echo "  train    - 训练模型"
        echo "  backup   - 备份数据"
        ;;
esac
EOF

chmod +x dev-tools.sh

echo -e "${GREEN}✓ 开发工具创建完成${NC}"

# 9. 显示设置完成信息
echo
echo -e "${GREEN}============================================================"
echo -e "   Mac开发环境设置完成!"
echo -e "============================================================${NC}"
echo
echo -e "${BLUE}快速开始:${NC}"
echo -e "  ./docker-start-mac.sh     # 启动开发环境"
echo -e "  ./dev-tools.sh start      # 使用工具启动"
echo -e "  ./dev-tools.sh logs       # 查看日志"
echo -e "  ./dev-tools.sh status     # 查看状态"
echo
echo -e "${BLUE}访问地址:${NC}"
echo -e "  前端:     http://localhost"
echo -e "  后端API:  http://localhost:3000"
echo -e "  Python:   http://localhost:5000"
echo -e "  Vite Dev: http://localhost:5173"
echo
echo -e "${YELLOW}开发特性:${NC}"
echo -e "  ✅ 代码热重载"
echo -e "  ✅ 实时同步"
echo -e "  ✅ 数据持久化"
echo -e "  ✅ 调试友好"
echo
echo -e "${BLUE}下一步:${NC}"
echo -e "  1. 运行 ./docker-start-mac.sh 启动服务"
echo -e "  2. 打开 http://localhost 开始开发"
echo -e "  3. 修改代码会自动重载"
echo -e "  4. 使用 ./dev-tools.sh 管理服务"
echo
echo -e "${GREEN}开始您的Mac开发之旅吧! 🍎${NC}"
