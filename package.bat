@echo off
chcp 65001 >nul
echo ========================================
echo   PaletteSniffer 打包脚本
echo ========================================
echo.

REM 获取版本号
for /f "tokens=2 delims=:, " %%a in ('findstr /C:"\"version\"" manifest.json') do set VERSION=%%~a

echo 当前版本: %VERSION%
echo.

REM 设置输出文件名
set OUTPUT=palette-sniffer-v%VERSION%.zip

REM 检查是否存在旧文件
if exist %OUTPUT% (
    echo 删除旧的打包文件...
    del %OUTPUT%
)

echo 正在打包扩展...
echo.

REM 使用 PowerShell 压缩文件
powershell -Command "Compress-Archive -Path manifest.json,background.js,content.js,popup.html,popup.js,icons,README.md -DestinationPath %OUTPUT% -Force"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ 打包成功！
    echo 📦 输出文件: %OUTPUT%
    echo.
    echo 下一步:
    echo 1. 访问 https://chrome.google.com/webstore/devconsole
    echo 2. 点击"新增项"
    echo 3. 上传 %OUTPUT%
    echo.
) else (
    echo.
    echo ❌ 打包失败！
    echo.
)

pause
