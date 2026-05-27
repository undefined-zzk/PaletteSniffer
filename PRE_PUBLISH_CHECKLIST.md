# 📋 发布前检查清单

## ✅ 必需项

### 1. 图标准备
- [ ] 生成 16×16 PNG 图标 (`icons/icon-16.png`)
- [ ] 生成 48×48 PNG 图标 (`icons/icon-48.png`)
- [ ] 生成 128×128 PNG 图标 (`icons/icon-128.png`)
- [ ] 验证图标在不同背景下的显示效果

**操作步骤：**
1. 在浏览器中打开 `generate-icons.html`
2. 点击"下载全部"按钮
3. 将下载的图标重命名并放入 `icons/` 文件夹

### 2. 截图准备
- [ ] 主界面截图（1280×800）
- [ ] 主色调识别效果（1280×800）
- [ ] 候选主题色推荐（1280×800）
- [ ] 配色方案生成（1280×800）
- [ ] 导出功能演示（1280×800）

**建议工具：**
- Windows: Snipping Tool / Snip & Sketch
- 在线工具: [Screely](https://screely.com/) 添加浏览器边框

### 3. manifest.json 检查
- [ ] `version` 版本号正确
- [ ] `name` 名称清晰
- [ ] `description` 描述完整（132字符以内）
- [ ] `icons` 路径正确
- [ ] `permissions` 权限最小化
- [ ] `author` 作者信息填写
- [ ] `homepage_url` 项目主页（可选）

### 4. 代码检查
- [ ] 所有文件无语法错误
- [ ] 控制台无错误输出
- [ ] 在多个网站测试功能正常
- [ ] 测试导出功能（CSS/JSON/SVG）
- [ ] 测试候选主题色识别
- [ ] 测试配色方案生成

### 5. 文档准备
- [ ] README.md 完整
- [ ] 功能说明清晰
- [ ] 使用方法详细
- [ ] 联系方式正确

## 🔍 测试网站列表

建议在以下类型网站测试：

- [ ] **设计类网站** - Dribbble, Behance
- [ ] **科技类网站** - GitHub, Stack Overflow
- [ ] **电商类网站** - Amazon, 淘宝
- [ ] **新闻类网站** - CNN, 新浪
- [ ] **社交类网站** - Twitter, 微博
- [ ] **企业官网** - Apple, Microsoft

## 📦 打包步骤

### 方法 1: 使用批处理脚本（推荐）
```bash
# 双击运行
package.bat
```

### 方法 2: 手动打包
1. 选中以下文件：
   - manifest.json
   - background.js
   - content.js
   - popup.html
   - popup.js
   - icons/ (文件夹)
   - README.md
2. 右键 → 发送到 → 压缩(zipped)文件夹
3. 重命名为 `palette-sniffer-v1.0.0.zip`

**⚠️ 注意：** 不要包含外层文件夹！

## 🌐 Chrome Web Store 信息

### 基本信息
```
名称: PaletteSniffer - 调色盘嗅探器
简短描述: 智能网页配色分析工具，自动提取主色调并生成专业配色方案。支持LAB色彩空间聚类、多维加权算法，精准识别主题色。
类别: 开发者工具
语言: 中文（简体）
```

### 隐私实践
```
单一用途: 网页配色分析工具

权限说明:
- activeTab: 读取当前标签页内容以分析配色
- scripting: 注入分析脚本到页面

数据使用:
✅ 不收集用户数据
✅ 不存储浏览历史
✅ 不发送网络请求
✅ 所有分析在本地完成
```

### 定价
```
免费
```

## 🚀 提交流程

1. [ ] 访问 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. [ ] 支付 $5 注册费（首次）
3. [ ] 点击"新增项"
4. [ ] 上传 ZIP 文件
5. [ ] 填写商店信息
6. [ ] 上传图标和截图
7. [ ] 填写隐私政策
8. [ ] 选择分发设置
9. [ ] 提交审核

## ⏱️ 预计时间

- **准备素材：** 2-4 小时
- **审核时间：** 1-3 个工作日
- **总计：** 约 3-5 天

## 📞 遇到问题？

### 常见问题
1. **图标不显示** - 检查文件格式是否为 PNG
2. **权限被拒** - 确保只申请必需权限
3. **描述过长** - 简短描述限制 132 字符
4. **审核被拒** - 查看拒绝原因并修改后重新提交

### 获取帮助
- [Chrome 扩展开发文档](https://developer.chrome.com/docs/extensions/)
- [发布政策](https://developer.chrome.com/docs/webstore/program-policies/)
- [开发者支持](https://support.google.com/chrome_webstore/contact/dev_account_support)

## ✨ 发布后

- [ ] 在 GitHub 添加 Chrome Web Store 徽章
- [ ] 在社交媒体分享
- [ ] 收集用户反馈
- [ ] 定期更新维护

---

**祝发布顺利！🎉**
