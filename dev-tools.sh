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
