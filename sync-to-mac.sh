#!/bin/bash

# 将Windows环境同步到Mac的脚本
# 在Windows上运行此脚本，将代码和数据同步到Mac

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}============================================================"
echo -e "   JobTrack - Windows到Mac同步工具"
echo -e "============================================================${NC}"
echo

# 检查Git状态
if [ ! -d ".git" ]; then
    echo -e "${RED}[错误] 当前目录不是Git仓库${NC}"
    echo "请确保在项目根目录运行此脚本"
    exit 1
fi

# 检查是否有未提交的更改
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo -e "${YELLOW}检测到未提交的更改${NC}"
    echo "请先提交或暂存您的更改"
    echo
    echo "当前状态:"
    git status --short
    echo
    read -p "是否继续同步? (y/n): " continue_sync
    if [[ ! $continue_sync =~ ^[Yy]$ ]]; then
        echo "同步已取消"
        exit 0
    fi
fi

echo -e "${BLUE}正在同步代码到Mac...${NC}"

# 1. 提交所有更改
echo "1. 提交代码更改..."
git add .
git commit -m "Windows开发: 同步到Mac $(date '+%Y-%m-%d %H:%M:%S')" || echo "没有新的更改需要提交"

# 2. 推送到远程仓库
echo "2. 推送到远程仓库..."
git push origin main

# 3. 创建数据备份
echo "3. 创建数据备份..."
BACKUP_DIR="mac-sync-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# 备份重要数据
echo "   - 备份训练数据..."
cp -r backend/data "$BACKUP_DIR/" 2>/dev/null || echo "   - 跳过data目录（不存在）"
cp -r backend/export "$BACKUP_DIR/" 2>/dev/null || echo "   - 跳过export目录（不存在）"

echo "   - 备份模型文件..."
cp model.pkl "$BACKUP_DIR/" 2>/dev/null || echo "   - 跳过model.pkl（不存在）"
cp vectorizer.pkl "$BACKUP_DIR/" 2>/dev/null || echo "   - 跳过vectorizer.pkl（不存在）"

# 4. 创建同步说明文件
echo "4. 创建同步说明..."
cat > "$BACKUP_DIR/SYNC_INSTRUCTIONS.md" << EOF
# Mac同步说明

## 在Mac上执行以下步骤：

### 1. 克隆或更新代码
\`\`\`bash
# 如果是新克隆
git clone <your-repo-url> jobtrack
cd jobtrack

# 如果是现有项目
git pull origin main
\`\`\`

### 2. 恢复数据文件
\`\`\`bash
# 复制数据文件
cp -r $BACKUP_DIR/data backend/ 2>/dev/null || echo "data目录不存在，跳过"
cp -r $BACKUP_DIR/export backend/ 2>/dev/null || echo "export目录不存在，跳过"
cp $BACKUP_DIR/model.pkl . 2>/dev/null || echo "model.pkl不存在，跳过"
cp $BACKUP_DIR/vectorizer.pkl . 2>/dev/null || echo "vectorizer.pkl不存在，跳过"
\`\`\`

### 3. 启动开发环境
\`\`\`bash
chmod +x docker-start-mac.sh
./docker-start-mac.sh
\`\`\`

### 4. 验证同步
- 访问 http://localhost
- 检查数据是否正确加载
- 测试功能是否正常

## 同步完成时间: $(date)
## 备份目录: $BACKUP_DIR
EOF

# 5. 压缩备份
echo "5. 压缩备份文件..."
tar czf "${BACKUP_DIR}.tar.gz" "$BACKUP_DIR"
rm -rf "$BACKUP_DIR"

echo
echo -e "${GREEN}============================================================"
echo -e "   同步完成!"
echo -e "============================================================${NC}"
echo
echo -e "${GREEN}下一步操作:${NC}"
echo "1. 在Mac上克隆或更新项目: git clone/pull"
echo "2. 解压数据备份: tar xzf ${BACKUP_DIR}.tar.gz"
echo "3. 按照 SYNC_INSTRUCTIONS.md 中的说明操作"
echo "4. 启动Mac开发环境: ./docker-start-mac.sh"
echo
echo -e "${BLUE}备份文件:${NC} ${BACKUP_DIR}.tar.gz"
echo -e "${BLUE}说明文件:${NC} ${BACKUP_DIR}/SYNC_INSTRUCTIONS.md"
echo
echo -e "${YELLOW}提示:${NC} 将备份文件传输到Mac后，按照说明文件操作即可"
