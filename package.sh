#!/bin/bash

# PaletteSniffer 打包脚本 (macOS/Linux/Git Bash)

echo "========================================"
echo "  PaletteSniffer 打包脚本"
echo "========================================"
echo ""

# 获取版本号
VERSION=$(grep -o '"version": *"[^"]*"' manifest.json | grep -o '[0-9.]*')

echo "当前版本: $VERSION"
echo ""

# 设置输出文件名
OUTPUT="palette-sniffer-v${VERSION}.zip"

# 检查是否存在旧文件
if [ -f "$OUTPUT" ]; then
    echo "删除旧的打包文件..."
    rm "$OUTPUT"
fi

echo "正在打包扩展..."
echo ""

# 检测是否在 Windows 环境（检查 PowerShell 是否可用）
if command -v powershell.exe &> /dev/null; then
    # Windows 环境，使用 PowerShell
    echo "检测到 Windows 环境，使用 PowerShell 打包..."
    powershell.exe -Command "Compress-Archive -Path manifest.json,background.js,content.js,popup.html,popup.js,icons -DestinationPath $OUTPUT -Force"
elif command -v zip &> /dev/null; then
    # macOS/Linux 环境，使用 zip
    echo "使用 zip 命令打包..."
    zip -r "$OUTPUT" \
        manifest.json \
        background.js \
        content.js \
        popup.html \
        popup.js \
        icons \
        -x "*.DS_Store" \
        -x "__MACOSX/*"
else
    echo "❌ 错误：未找到 zip 或 PowerShell 命令"
    echo "请使用 package.bat 脚本或安装 zip 工具"
    exit 1
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 打包成功！"
    echo "📦 输出文件: $OUTPUT"
    echo ""
    echo "下一步:"
    echo "1. 访问 https://chrome.google.com/webstore/devconsole"
    echo "2. 点击"新增项""
    echo "3. 上传 $OUTPUT"
    echo ""
else
    echo ""
    echo "❌ 打包失败！"
    echo ""
    exit 1
fi
