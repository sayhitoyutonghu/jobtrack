#!/bin/bash
# 自动化使用真实Gmail数据训练模型的完整流程（Linux/Mac版本）

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 参数
SESSION_ID="${1:-}"
MAX_RESULTS="${2:-500}"
QUERY="${3:-in:inbox}"
SKIP_EXPORT="${SKIP_EXPORT:-false}"

echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}🚀 使用真实Gmail数据训练模型${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""

# 函数：显示步骤
show_step() {
    echo ""
    echo -e "${YELLOW}[$1/5] $2${NC}"
    echo -e "${YELLOW}────────────────────────────────────────────────────────────${NC}"
}

# 函数：检查命令
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 步骤 1: 检查环境
show_step 1 "检查环境"

echo -n "检查Python... "
if command_exists python3; then
    PYTHON_CMD=python3
    echo -e "${GREEN}✓ $(python3 --version)${NC}"
elif command_exists python; then
    PYTHON_CMD=python
    echo -e "${GREEN}✓ $(python --version)${NC}"
else
    echo -e "${RED}✗ 未安装${NC}"
    echo -e "${RED}❌ 错误: 需要安装Python 3.7+${NC}"
    exit 1
fi

echo -n "检查Node.js... "
if command_exists node; then
    echo -e "${GREEN}✓ Node $(node --version)${NC}"
else
    echo -e "${RED}✗ 未安装${NC}"
    echo -e "${RED}❌ 错误: 需要安装Node.js${NC}"
    exit 1
fi

echo -n "检查依赖文件... "
if [ -f "requirements.txt" ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo -e "${RED}❌ 错误: 找不到requirements.txt${NC}"
    exit 1
fi

# 步骤 2: 导出Gmail数据（可选）
if [ "$SKIP_EXPORT" != "true" ]; then
    show_step 2 "导出Gmail训练数据"
    
    # 获取Session ID
    if [ -z "$SESSION_ID" ]; then
        echo ""
        echo -e "${CYAN}📝 请按照以下步骤获取Session ID:${NC}"
        echo "   1. 打开浏览器访问: http://localhost:5173"
        echo "   2. 登录Gmail账号"
        echo "   3. 打开开发者工具（F12）"
        echo "   4. 在Console中运行: localStorage.getItem('sessionId')"
        echo "   5. 复制显示的Session ID"
        echo ""
        read -p "请输入Session ID: " SESSION_ID
        
        if [ -z "$SESSION_ID" ]; then
            echo -e "${RED}❌ 错误: Session ID不能为空${NC}"
            exit 1
        fi
    fi
    
    # 设置环境变量
    export JOBTRACK_SESSION_ID="$SESSION_ID"
    
    echo ""
    echo -e "${CYAN}📬 开始导出邮件数据...${NC}"
    echo "   查询条件: $QUERY"
    echo "   最大数量: $MAX_RESULTS"
    echo ""
    
    # 运行导出脚本
    if node scripts/export-gmail-training-data.js --query "$QUERY" --maxResults "$MAX_RESULTS"; then
        echo ""
        echo -e "${GREEN}✓ Gmail数据导出完成${NC}"
    else
        echo ""
        echo -e "${RED}❌ 导出失败${NC}"
        echo ""
        echo -e "${YELLOW}💡 可能的原因:${NC}"
        echo "   - Session ID已过期（请重新登录）"
        echo "   - 后端服务未运行（请运行: cd backend && npm run dev）"
        echo "   - 网络连接问题"
        exit 1
    fi
else
    show_step 2 "跳过Gmail数据导出"
    echo -e "${CYAN}使用已有的导出文件...${NC}"
fi

# 步骤 3: 准备训练数据
show_step 3 "准备训练数据"

echo ""
echo -e "${CYAN}🔄 合并和转换数据...${NC}"
echo ""

if $PYTHON_CMD prepare_training_data.py; then
    if [ ! -f "emails_real.csv" ]; then
        echo -e "${RED}❌ 未生成emails_real.csv文件${NC}"
        exit 1
    fi
    echo ""
    echo -e "${GREEN}✓ 训练数据准备完成${NC}"
else
    echo ""
    echo -e "${RED}❌ 数据准备失败${NC}"
    echo ""
    echo -e "${YELLOW}💡 可能的原因:${NC}"
    echo "   - backend/export目录中没有CSV文件"
    echo "   - 导出的邮件都没有标签"
    echo "   - Python依赖未安装（请运行: pip install -r requirements.txt）"
    exit 1
fi

# 步骤 4: 训练模型
show_step 4 "训练模型"

echo ""
echo -e "${CYAN}🤖 开始训练...${NC}"
echo ""

if $PYTHON_CMD train_model.py --data emails_real.csv; then
    if [ ! -f "model.pkl" ] || [ ! -f "vectorizer.pkl" ]; then
        echo -e "${RED}❌ 模型文件未生成${NC}"
        exit 1
    fi
    echo ""
    echo -e "${GREEN}✓ 模型训练完成${NC}"
else
    echo ""
    echo -e "${RED}❌ 模型训练失败${NC}"
    exit 1
fi

# 步骤 5: 备份模型
show_step 5 "备份模型文件"

TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
BACKUP_DIR="model_backups"

mkdir -p "$BACKUP_DIR"

if cp model.pkl "$BACKUP_DIR/model_$TIMESTAMP.pkl" && \
   cp vectorizer.pkl "$BACKUP_DIR/vectorizer_$TIMESTAMP.pkl" && \
   cp emails_real.csv "$BACKUP_DIR/training_data_$TIMESTAMP.csv"; then
    echo ""
    echo -e "${GREEN}✓ 模型已备份到: $BACKUP_DIR${NC}"
    echo "   - model_$TIMESTAMP.pkl"
    echo "   - vectorizer_$TIMESTAMP.pkl"
    echo "   - training_data_$TIMESTAMP.csv"
else
    echo ""
    echo -e "${YELLOW}⚠️  备份失败，但模型训练成功${NC}"
fi

# 完成
echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${GREEN}✅ 训练完成！${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""
echo -e "${CYAN}📊 模型文件:${NC}"
echo "   - model.pkl"
echo "   - vectorizer.pkl"
echo ""
echo -e "${CYAN}📁 训练数据:${NC}"
echo "   - emails_real.csv"
echo ""
echo -e "${CYAN}💾 备份位置:${NC}"
echo "   - $BACKUP_DIR/"
echo ""
echo -e "${CYAN}🎯 下一步:${NC}"
echo "   1. 测试模型: 在Chrome扩展中打开Gmail并扫描邮件"
echo "   2. 查看结果: 检查自动分类的准确性"
echo "   3. 持续改进: 定期重新训练以提高准确率"
echo ""
echo -e "${CYAN}💡 重新训练:${NC}"
echo "   - 完整流程: ./train_with_gmail.sh 'your_session_id'"
echo "   - 只训练: SKIP_EXPORT=true ./train_with_gmail.sh"
echo ""


