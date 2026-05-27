# Microsoft Edge 扩展商店发布指南

## ✨ Edge 商店优势

相比 Chrome Web Store，Edge 扩展商店有以下优势：

- ✅ **免费发布** - 无需支付注册费（Chrome 需要 $5）
- ✅ **审核更快** - 通常 1-2 个工作日（Chrome 需要 1-3 天）
- ✅ **审核更宽松** - 政策相对友好
- ✅ **中国用户友好** - Edge 在中国使用广泛
- ✅ **兼容性好** - Chrome 扩展可以直接发布到 Edge

## 📋 发布前准备

### 1. 注册开发者账号

1. 访问 [Microsoft Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview)
2. 使用 Microsoft 账号登录（没有就注册一个）
3. **完全免费，无需支付任何费用**
4. 填写开发者信息

### 2. 准备发布材料

#### 必需文件
- ✅ 扩展 ZIP 包（使用 `package.bat` 生成）
- ✅ 图标 128×128 PNG
- ✅ 至少 1 张截图（1280×800 或 640×400）

#### 商店信息
```
名称: PaletteSniffer - 调色盘嗅探器
简短描述: 智能网页配色分析工具，自动提取主色调并生成专业配色方案
类别: 开发者工具
语言: 中文（简体）
```

## 🚀 发布步骤

### 步骤 1: 创建新提交

1. 访问 [Edge 扩展管理](https://partner.microsoft.com/dashboard/microsoftedge/overview)
2. 点击 **"创建新扩展"**
3. 选择 **"上传新扩展包"**

### 步骤 2: 上传扩展包

1. 上传 `palette-sniffer-v1.0.0.zip`
2. 系统会自动验证 manifest.json
3. 等待上传完成

### 步骤 3: 填写商店信息

#### 基本信息
- **显示名称：** PaletteSniffer - 调色盘嗅探器
- **简短描述：** 智能网页配色分析工具，自动提取主色调并生成专业配色方案。支持LAB色彩空间聚类、多维加权算法，精准识别主题色。

#### 详细描述
```
PaletteSniffer（调色盘嗅探器）是一款专业的网页配色分析工具，帮助设计师和开发者快速提取网页配色方案。

【核心功能】
✨ 智能主色识别 - 基于 LAB 色彩空间和多维加权算法
🔍 候选主题色推荐 - 自动检测高饱和度交互元素配色
📊 10种主要配色 - 按权重排序展示页面核心配色
🎯 4种配色方案 - 互补色、类似色、三等分、分裂互补
💾 一键导出 - CSS 变量、JSON 数据、SVG 色卡

【技术优势】
• LAB 色彩空间聚类 - 符合人眼感知的颜色分组
• 多维加权算法 - 交互元素、图标、标题智能识别
• CSS 变量解析 - 自动提取主题色定义
• 性能优化 - TreeWalker + 缓存机制

【适用场景】
🎨 设计师提取网站配色灵感
💻 前端开发快速获取页面色值
📱 UI/UX 分析竞品配色方案
🖼️ 品牌设计师研究色彩搭配

【使用方法】
1. 访问任意网页
2. 点击扩展图标
3. 点击"嗅探配色"
4. 查看分析结果并导出

【隐私保护】
• 不收集任何用户数据
• 所有分析在本地完成
• 不发送网络请求
```

#### 类别和标签
- **类别：** 开发者工具
- **标签：** 配色, 设计, 开发工具, 颜色提取, 调色板

#### 图标和截图
1. 上传 128×128 应用图标
2. 上传截图（从 `screenshots/` 文件夹）
   - screenshot-1.png
   - screenshot-2.png
   - screenshot-3.png

### 步骤 4: 隐私和权限

#### 隐私政策
```
隐私声明：
本扩展不收集、不存储、不传输任何用户数据。
所有网页配色分析均在本地浏览器中完成。

权限说明：
• activeTab - 读取当前标签页内容以分析配色
• scripting - 注入分析脚本到页面

数据使用：
✅ 不收集用户数据
✅ 不存储浏览历史
✅ 不发送网络请求
✅ 所有分析在本地完成
```

#### 网站（可选）
- **项目主页：** https://github.com/yourusername/palette-sniffer
- **支持页面：** https://github.com/yourusername/palette-sniffer/issues

### 步骤 5: 提交审核

1. 检查所有信息
2. 点击 **"提交"**
3. 等待审核（通常 1-2 个工作日）

## 📊 Chrome vs Edge 对比

| 项目 | Chrome Web Store | Microsoft Edge 扩展商店 |
|------|------------------|------------------------|
| 注册费 | $5 USD | **免费** ✅ |
| 审核时间 | 1-3 个工作日 | 1-2 个工作日 ✅ |
| 审核难度 | 较严格 | 相对宽松 ✅ |
| 用户群体 | 全球最大 | 中国用户多 |
| 支付方式 | 需要国际信用卡 | 无需支付 ✅ |
| 兼容性 | Chrome 专用 | 兼容 Chrome 扩展 ✅ |

## 💡 推荐策略

### 方案 1: 先发布 Edge（推荐）
1. ✅ 免费，无需信用卡
2. ✅ 快速上线，积累用户
3. ✅ 收集反馈，优化产品
4. ✅ 有了用户基础后再发布 Chrome

### 方案 2: 同时发布
- Edge 和 Chrome 可以使用同一个扩展包
- 两个商店的用户群体不同，可以覆盖更多用户

### 方案 3: 只发布 Edge
- 如果主要面向中国用户
- 不想支付 Chrome 的 $5 注册费
- Edge 用户也可以安装 Chrome 扩展（手动安装）

## 🔄 更新版本

1. 修改 `manifest.json` 中的 `version`
2. 重新打包：`package.bat`
3. 在 Partner Center 上传新版本
4. 提交审核

## ⚠️ 注意事项

### Edge 特殊要求
1. **图标要求**
   - 必须是 PNG 格式
   - 建议提供多个尺寸（16, 48, 128）

2. **描述要求**
   - 简短描述限制 132 字符
   - 详细描述建议 500-1000 字

3. **截图要求**
   - 至少 1 张，最多 10 张
   - 尺寸：1280×800 或 640×400
   - 格式：PNG 或 JPEG

### 审核要点
- ✅ 功能描述清晰
- ✅ 权限使用合理
- ✅ 隐私政策明确
- ✅ 截图展示真实功能

## 🎉 发布后

### 推广建议
1. 在 README.md 添加 Edge 商店徽章
2. 在社交媒体分享
3. 在设计社区推广
4. 收集用户反馈

### 徽章代码
```markdown
[![Edge 扩展商店](https://img.shields.io/badge/Edge-扩展商店-0078D7?logo=microsoft-edge)](你的扩展链接)
```

## 🔗 相关链接

- [Microsoft Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview)
- [Edge 扩展开发文档](https://docs.microsoft.com/microsoft-edge/extensions-chromium/)
- [发布政策](https://docs.microsoft.com/microsoft-edge/extensions-chromium/store-policies/developer-policies)

## 💬 常见问题

**Q: Edge 扩展和 Chrome 扩展有什么区别？**
A: 几乎没有区别。Edge 基于 Chromium，完全兼容 Chrome 扩展。同一个扩展包可以同时发布到两个商店。

**Q: 需要修改代码吗？**
A: 不需要。你的扩展已经是 Manifest V3，可以直接发布到 Edge。

**Q: 审核被拒怎么办？**
A: 查看拒绝原因，修改后重新提交。Edge 审核相对宽松，通过率较高。

**Q: 可以同时在 Chrome 和 Edge 商店发布吗？**
A: 可以！使用同一个扩展包，分别上传到两个商店即可。

---

**建议：先发布到 Edge，免费且快速！** 🚀
