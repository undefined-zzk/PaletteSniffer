#!/bin/bash

# PaletteSniffer 打包脚本 (macOS/Linux)

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

# 压缩文件
zip -r "$OUTPUT" \
    manifest.json \
    background.js \
    content.js \
    popup.html \
    popup.js \
    icons \
    README.md \
    -x "*.DS_Store" \
    -x "__MACOSX/*"

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
