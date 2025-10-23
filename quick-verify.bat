@echo off
echo 🔍 JobTrack 快速验证
echo ═══════════════════════════════════════════════════════

echo.
echo 📋 验证步骤：
echo    1. 检查服务器是否运行
echo    2. 测试自动扫描功能
echo    3. 验证完全自动化特性
echo.

echo 🚀 启动验证...
node verify-automation.js

echo.
echo 📊 验证完成！
echo.
echo 💡 如果验证失败，请检查：
echo    - 后端服务器是否运行 (http://localhost:3000)
echo    - 环境配置是否正确 (.env文件)
echo    - Google OAuth设置是否完成
echo.
pause
