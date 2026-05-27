/**
 * PaletteSniffer - 调色盘嗅探器
 * 内容脚本：多维加权分析网页配色，提取主色调与候选主题色
 *
 * 核心算法：
 *   1. 元素类型加权 —— 交互元素×5.0, 图标×4.0, 标题/导航×3.0, 背景×2.0, 文字×0.3, body背景×0.1
 *   2. 面积加权 —— max(elementWeight, elementWeight × √area / 100)
 *   3. 位置加权 —— 首屏1.5x → 页脚0.7x
 *   4. LAB色彩空间聚类 —— ΔE<10粗聚类, ΔE<15细聚类
 *   5. 候选主题色 —— 高饱和+交互元素+非主色
 */

(function () {
  'use strict';

  // ========== 颜色工具函数 ==========

  // ★ 优化：添加颜色解析缓存
  const colorParseCache = new Map();

  function parseColor(colorStr) {
    if (!colorStr) return null;
    
    // 检查缓存
    if (colorParseCache.has(colorStr)) {
      return colorParseCache.get(colorStr);
    }

    colorStr = colorStr.trim().toLowerCase();
    let result = null;

    const rgbMatch = colorStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgbMatch) {
      result = [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];
    } else {
      const hexMatch = colorStr.match(/#([0-9a-f]{3,8})/);
      if (hexMatch) {
        let hex = hexMatch[1];
        if (hex.length === 3) {
          hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        if (hex.length >= 6) {
          result = [
            parseInt(hex.substring(0, 2), 16),
            parseInt(hex.substring(2, 4), 16),
            parseInt(hex.substring(4, 6), 16)
          ];
        }
      } else {
        const hslMatch = colorStr.match(/hsla?\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/);
        if (hslMatch) {
          result = hslToRgb(parseInt(hslMatch[1]), parseInt(hslMatch[2]), parseInt(hslMatch[3]));
        }
      }
    }

    // 缓存结果（限制缓存大小）
    if (colorParseCache.size < 1000) {
      colorParseCache.set(colorStr, result);
    }

    return result;
  }

  function hslToRgb(h, s, l) {
    h = h % 360;
    s = s / 100;
    l = l / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r, g, b;
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255)
    ];
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }

  /**
   * 判断颜色是否为"无意义"颜色（纯黑/纯白/极灰）
   */
  function isAchromatic(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    const lightness = (max + min) / 2 / 255;
    return saturation < 0.08 || lightness < 0.03 || lightness > 0.97;
  }

  // ========== LAB 色彩空间 ==========

  /**
   * sRGB → 线性 RGB
   */
  function srgbToLinear(v) {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }

  /**
   * RGB → LAB (CIE L*a*b*)
   * D65 白点: Xn=0.95047, Yn=1.0, Zn=1.08883
   */
  function rgbToLab(r, g, b) {
    // sRGB → 线性 RGB
    const lr = srgbToLinear(r);
    const lg = srgbToLinear(g);
    const lb = srgbToLinear(b);

    // 线性 RGB → XYZ (sRGB D65)
    let x = (lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375) / 0.95047;
    let y = (lr * 0.2126729 + lg * 0.7151522 + lb * 0.0721750) / 1.00000;
    let z = (lr * 0.0193339 + lg * 0.1191920 + lb * 0.9503041) / 1.08883;

    // XYZ → LAB
    const epsilon = 0.008856;
    const kappa = 903.3;
    x = x > epsilon ? Math.cbrt(x) : (kappa * x + 16) / 116;
    y = y > epsilon ? Math.cbrt(y) : (kappa * y + 16) / 116;
    z = z > epsilon ? Math.cbrt(z) : (kappa * z + 16) / 116;

    return [
      116 * y - 16,     // L*
      500 * (x - y),    // a*
      200 * (y - z)     // b*
    ];
  }

  /**
   * CIE76 ΔE 距离（LAB 空间欧氏距离，匹配人眼感知均匀性）
   */
  function labDeltaE(lab1, lab2) {
    return Math.sqrt(
      Math.pow(lab1[0] - lab2[0], 2) +
      Math.pow(lab1[1] - lab2[1], 2) +
      Math.pow(lab1[2] - lab2[2], 2)
    );
  }

  // ========== 元素类型加权 ==========

  const ELEMENT_WEIGHTS = {
    interactive: 5.0,   // <a>, <button>, .btn 等
    icon:       4.0,   // <svg>, .icon 等
    heading:    3.0,   // <h1>~<h6>, <header>, <nav>
    background: 2.0,   // 非body的背景色
    text:       0.3,   // 普通文字色
    bodyBg:     0.1    // body 背景色
  };

  /**
   * 获取元素的类型权重与分类
   * 返回 { weight, category }
   */
  function getElementWeight(el) {
    const tagName = el.tagName.toLowerCase();
    const role = el.getAttribute('role') || '';
    const type = el.getAttribute('type') || '';
    const cls = (el.className && typeof el.className === 'string') ? el.className.toLowerCase() : '';

    // 交互元素：5.0
    if (['a', 'button', 'select', 'summary', 'option'].includes(tagName)) {
      return { weight: ELEMENT_WEIGHTS.interactive, category: 'interactive' };
    }
    if (['button', 'link', 'tab', 'menuitem', 'option', 'switch', 'checkbox', 'radio'].includes(role)) {
      return { weight: ELEMENT_WEIGHTS.interactive, category: 'interactive' };
    }
    if (tagName === 'input' && ['submit', 'button', 'reset', 'checkbox', 'radio'].includes(type)) {
      return { weight: ELEMENT_WEIGHTS.interactive, category: 'interactive' };
    }
    if (/\b(btn|button|link|nav|tab|badge|tag|chip|pill|action|active|primary|accent|cta)\b/.test(cls)) {
      return { weight: ELEMENT_WEIGHTS.interactive, category: 'interactive' };
    }

    // 图标元素：4.0
    if (tagName === 'svg' || /\b(icon|ico|glyph|symbol)\b/.test(cls)) {
      return { weight: ELEMENT_WEIGHTS.icon, category: 'icon' };
    }
    // 含有内联 SVG 的容器也算图标
    if (el.querySelector && el.querySelector('svg') && el.children.length === 1) {
      const child = el.children[0];
      if (child.tagName && child.tagName.toLowerCase() === 'svg') {
        return { weight: ELEMENT_WEIGHTS.icon, category: 'icon' };
      }
    }

    // 标题/导航元素：3.0
    if (/^h[1-6]$/.test(tagName) || ['header', 'nav', 'footer'].includes(tagName)) {
      return { weight: ELEMENT_WEIGHTS.heading, category: 'heading' };
    }
    if (['banner', 'navigation', 'heading'].includes(role)) {
      return { weight: ELEMENT_WEIGHTS.heading, category: 'heading' };
    }

    // body 背景：0.1
    if (tagName === 'body') {
      return { weight: ELEMENT_WEIGHTS.bodyBg, category: 'bodyBg' };
    }

    // 默认：根据上下文判断
    return { weight: ELEMENT_WEIGHTS.text, category: 'text' };
  }

  // ========== 位置加权 ==========

  /**
   * 根据元素在页面中的垂直位置计算位置系数
   * 首屏顶部 → 1.5x, 页脚底部 → 0.7x
   */
  function getPositionFactor(el, pageHeight) {
    if (pageHeight === 0) return 1.0;
    const rect = el.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    // 元素中心在文档中的绝对位置
    const absoluteTop = rect.top + scrollTop;
    const absoluteCenter = absoluteTop + rect.height / 2;
    const ratio = Math.min(absoluteCenter / pageHeight, 1.0);

    if (ratio < 0.15) return 1.5;   // 顶部导航区
    if (ratio < 0.30) return 1.3;   // 首屏上半
    if (ratio < 0.50) return 1.15;  // 首屏下半
    if (ratio < 0.70) return 1.0;   // 中部
    if (ratio < 0.85) return 0.85;  // 下部
    return 0.7;                      // 页脚
  }

  // ========== 颜色提取（多维加权） ==========

  const colorMap = new Map(); // hex → { rgb, lab, weightedScore, rawCount, interactiveHits, iconHits, headingHits, cssVarHits, cssVarNames }

  /**
   * 注册一个颜色，累加加权得分
   * @param {number[]} rgb - RGB 颜色
   * @param {number} contribution - 本次贡献的加权分数
   * @param {string} category - 元素分类 (interactive/icon/heading/background/text/bodyBg/cssVar)
   * @param {string} [cssVarName] - CSS 变量名（如果来自 CSS 变量）
   */
  function registerColor(rgb, contribution, category, cssVarName) {
    if (!rgb) return;
    const hex = rgbToHex(rgb[0], rgb[1], rgb[2]);
    const existing = colorMap.get(hex);
    if (existing) {
      existing.weightedScore += contribution;
      existing.rawCount++;
      if (category === 'interactive') existing.interactiveHits++;
      if (category === 'icon') existing.iconHits++;
      if (category === 'heading') existing.headingHits++;
      if (category === 'cssVar') {
        existing.cssVarHits++;
        if (cssVarName) existing.cssVarNames.push(cssVarName);
      }
    } else {
      const entry = {
        rgb,
        lab: rgbToLab(rgb[0], rgb[1], rgb[2]),
        weightedScore: contribution,
        rawCount: 1,
        interactiveHits: category === 'interactive' ? 1 : 0,
        iconHits: category === 'icon' ? 1 : 0,
        headingHits: category === 'heading' ? 1 : 0,
        cssVarHits: category === 'cssVar' ? 1 : 0,
        cssVarNames: cssVarName ? [cssVarName] : []
      };
      colorMap.set(hex, entry);
    }
  }

  function extractColors() {
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const pageHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, viewportH);

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          const tagName = node.tagName.toLowerCase();
          if (['script', 'style', 'noscript', 'link', 'meta'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const elementsToProcess = [];
    let node;
    while (node = walker.nextNode()) {
      const rect = node.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0 &&
        rect.bottom > 0 && rect.top < viewportH &&
        rect.right > 0 && rect.left < viewportW;
      if (isVisible) {
        elementsToProcess.push({ el: node, rect });
      }
    }

    for (const { el, rect } of elementsToProcess) {
      try {
        const computed = getComputedStyle(el);
        const visibleArea = rect.width * rect.height;
        const { weight, category } = getElementWeight(el);
        const posFactor = getPositionFactor(el, pageHeight);
        const areaFactor = Math.max(weight, weight * Math.sqrt(visibleArea) / 100);

        const bgColor = parseColor(computed.backgroundColor);
        if (bgColor && !isAchromatic(bgColor[0], bgColor[1], bgColor[2])) {
          let bgCategory = category;
          let bgWeight;
          if (category === 'text' || category === 'bodyBg') {
            bgWeight = Math.max(ELEMENT_WEIGHTS.background, ELEMENT_WEIGHTS.background * Math.sqrt(visibleArea) / 100);
            bgCategory = 'background';
          } else {
            bgWeight = areaFactor;
          }
          registerColor(bgColor, bgWeight * posFactor, bgCategory);
        }

        const textColor = parseColor(computed.color);
        if (textColor && !isAchromatic(textColor[0], textColor[1], textColor[2])) {
          const textContribution = Math.max(ELEMENT_WEIGHTS.text, ELEMENT_WEIGHTS.text * Math.sqrt(visibleArea) / 200);
          registerColor(textColor, textContribution * posFactor, 'text');
        }

        const borderWidth = parseFloat(computed.borderWidth);
        if (borderWidth > 0) {
          const borderColor = parseColor(computed.borderTopColor);
          if (borderColor && !isAchromatic(borderColor[0], borderColor[1], borderColor[2])) {
            registerColor(borderColor, 1.5 * posFactor, 'border');
          }
        }

        const boxShadow = computed.boxShadow;
        if (boxShadow && boxShadow !== 'none') {
          const shadowColors = extractShadowColors(boxShadow);
          shadowColors.forEach(color => {
            if (color && !isAchromatic(color[0], color[1], color[2])) {
              registerColor(color, 0.8 * posFactor, 'shadow');
            }
          });
        }
      } catch (e) {
        console.warn('Error processing element:', e);
      }
    }

    extractCssVariables();
  }

  function extractShadowColors(shadowStr) {
    const colors = [];
    const rgbaMatches = shadowStr.matchAll(/rgba?\([^)]+\)/g);
    for (const match of rgbaMatches) {
      const color = parseColor(match[0]);
      if (color) colors.push(color);
    }
    const hexMatches = shadowStr.matchAll(/#[0-9a-f]{3,8}/gi);
    for (const match of hexMatches) {
      const color = parseColor(match[0]);
      if (color) colors.push(color);
    }
    return colors;
  }

  /**
   * 提取 CSS 自定义属性中的主题色（区分语义优先级，优化版）
   */
  function extractCssVariables() {
    // 一级语义：几乎确定是主题色
    const primaryPattern = /\b(primary|brand|accent|theme|cta|main-color)\b/i;
    // 二级语义：可能是主题色
    const secondaryPattern = /\b(highlight|active|focus|link|action|selected|emphasis)\b/i;
    // 三级：普通颜色变量
    const colorPattern = /color|background|fill|stroke|border/i;

    // ★ 优化1：同时提取 :root 和 computed style 中的 CSS 变量
    const cssVars = new Map();

    // 从 :root 提取
    try {
      const rootStyle = getComputedStyle(document.documentElement);
      for (let i = 0; i < rootStyle.length; i++) {
        const prop = rootStyle[i];
        if (prop.startsWith('--')) {
          const val = rootStyle.getPropertyValue(prop).trim();
          if (val) cssVars.set(prop, val);
        }
      }
    } catch (e) { /* 忽略 */ }

    // 从样式表提取
    try {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (!rule.style) continue;
            for (let i = 0; i < rule.style.length; i++) {
              const prop = rule.style[i];
              if (!prop.startsWith('--')) continue;
              const val = rule.style.getPropertyValue(prop).trim();
              if (val && !cssVars.has(prop)) {
                cssVars.set(prop, val);
              }
            }
          }
        } catch (e) { /* 跨域样式表跳过 */ }
      }
    } catch (e) { /* 忽略 */ }

    // ★ 优化2：处理 CSS 变量引用（如 var(--other-color)）
    const resolveVarReference = (val) => {
      const varMatch = val.match(/var\(\s*(--[^,)]+)/);
      if (varMatch && cssVars.has(varMatch[1])) {
        return cssVars.get(varMatch[1]);
      }
      return val;
    };

    // 处理所有 CSS 变量
    for (const [prop, val] of cssVars.entries()) {
      const resolvedVal = resolveVarReference(val);
      const rgb = parseColor(resolvedVal);
      if (!rgb || isAchromatic(rgb[0], rgb[1], rgb[2])) continue;

      // 根据变量名语义赋予不同权重
      if (primaryPattern.test(prop)) {
        // ★ 一级语义：interactive 级权重 (5.0) + cssVar 加分
        registerColor(rgb, 5.0, 'cssVar', prop);
        registerColor(rgb, 3.0, 'interactive');
      } else if (secondaryPattern.test(prop)) {
        // 二级语义：heading 级权重 (3.0) + cssVar
        registerColor(rgb, 3.0, 'cssVar', prop);
        registerColor(rgb, 1.5, 'interactive');
      } else if (colorPattern.test(prop)) {
        // 三级：普通颜色变量
        registerColor(rgb, 2.0, 'cssVar', prop);
      } else {
        registerColor(rgb, 0.5, 'cssVar', prop);
      }
    }
  }

  // ========== LAB 空间颜色聚类 ==========

  /**
   * 基于 LAB ΔE 距离的聚类（优化版 - 使用空间索引加速）
   * @param {number} deltaEThreshold - ΔE 阈值
   */
  function clusterColorsLab(deltaEThreshold) {
    const entries = Array.from(colorMap.entries());
    if (entries.length === 0) return [];

    const visited = new Set();
    const clusters = [];

    // 按加权得分降序排序（高权重优先作为聚类中心）
    entries.sort((a, b) => b[1].weightedScore - a[1].weightedScore);

    // ★ 优化：使用 KD-Tree 或简单的空间分区加速邻近搜索
    // 这里使用简化版：按 L* 值分桶，减少比较次数
    const buckets = new Map();
    entries.forEach(([hex, data], idx) => {
      const bucketKey = Math.floor(data.lab[0] / 10); // 按 L* 值每10个单位分桶
      if (!buckets.has(bucketKey)) buckets.set(bucketKey, []);
      buckets.get(bucketKey).push(idx);
    });

    for (let i = 0; i < entries.length; i++) {
      if (visited.has(i)) continue;
      const [hex, data] = entries[i];
      const cluster = {
        hex,
        rgb: data.rgb,
        lab: data.lab,
        weightedScore: data.weightedScore,
        rawCount: data.rawCount,
        interactiveHits: data.interactiveHits,
        iconHits: data.iconHits,
        headingHits: data.headingHits,
        cssVarHits: data.cssVarHits,
        cssVarNames: [...data.cssVarNames]
      };
      visited.add(i);

      // ★ 只在相邻的桶中搜索，减少比较次数
      const bucketKey = Math.floor(data.lab[0] / 10);
      const searchBuckets = [bucketKey - 1, bucketKey, bucketKey + 1];
      
      for (const bk of searchBuckets) {
        const bucket = buckets.get(bk);
        if (!bucket) continue;
        
        for (const j of bucket) {
          if (j <= i || visited.has(j)) continue;
          const [, otherData] = entries[j];
          const de = labDeltaE(data.lab, otherData.lab);
          if (de < deltaEThreshold) {
            // 合并：加权分、计数、来源统计全部累加
            cluster.weightedScore += otherData.weightedScore;
            cluster.rawCount += otherData.rawCount;
            cluster.interactiveHits += otherData.interactiveHits;
            cluster.iconHits += otherData.iconHits;
            cluster.headingHits += otherData.headingHits;
            cluster.cssVarHits += otherData.cssVarHits;
            cluster.cssVarNames.push(...otherData.cssVarNames);
            visited.add(j);
          }
        }
      }
      clusters.push(cluster);
    }

    return clusters;
  }

  // ========== 主色识别算法 ==========

  /**
   * 计算颜色的「主题色置信度」得分
   * 基于：元素类型加权分 + 饱和度奖惩 + 文字色惩罚
   */
  function computeThemeScore(cluster) {
    const [h, s, l] = rgbToHsl(cluster.rgb[0], cluster.rgb[1], cluster.rgb[2]);

    // 基础分：直接使用提取时累加的多维加权分
    let score = cluster.weightedScore;

    // ★ 交互元素出现加分（即使小按钮也能获得显著提升）
    score += cluster.interactiveHits * 25;

    // ★ 图标出现加分
    score += cluster.iconHits * 15;

    // ★ 标题/导航出现加分
    score += cluster.headingHits * 10;

    // ★ CSS 变量命中加分
    score += cluster.cssVarHits * 12;

    // 饱和度动态奖惩
    if (s > 60) score += 25;       // 高饱和 → 很可能是主题色
    else if (s > 40) score += 12;  // 中等饱和
    else if (s > 20) score += 3;   // 低饱和微加
    else if (s < 10) score -= 35;  // 极低饱和 → 灰色系惩罚

    // 极暗色惩罚（接近黑色的文字色）
    if (l < 12) score -= 25;
    else if (l < 20 && s < 15) score -= 15;

    return score;
  }

  // ========== 候选主题色 ==========

  /**
   * 检测候选主题色
   * 规则：饱和度 > 30% + 出现在交互元素 + 不是已选主色
   */
  function detectCandidateThemeColors(allClusters, dominantHex) {
    const candidates = [];
    const seen = new Set();

    for (const c of allClusters) {
      if (c.hex === dominantHex) continue;
      if (seen.has(c.hex)) continue;

      const [h, s, l] = rgbToHsl(c.rgb[0], c.rgb[1], c.rgb[2]);

      // 条件1：饱和度 > 30%
      if (s <= 30) continue;

      // 条件2：出现在交互元素 或 CSS变量 或 图标
      const isFromInteractive = c.interactiveHits > 0;
      const isFromCssVar = c.cssVarHits > 0;
      const isFromIcon = c.iconHits > 0;
      if (!isFromInteractive && !isFromCssVar && !isFromIcon) continue;

      // 生成推荐理由
      const reasons = [];
      if (c.cssVarNames.length > 0) {
        const varName = c.cssVarNames[0];
        reasons.push(`CSS变量 ${varName}`);
      }
      if (isFromInteractive) {
        reasons.push(`交互元素背景 ×${c.interactiveHits}`);
      }
      if (isFromIcon) {
        reasons.push(`图标配色 ×${c.iconHits}`);
      }
      if (s > 60) {
        reasons.push('高饱和度');
      }

      seen.add(c.hex);
      candidates.push({
        hex: c.hex,
        rgb: c.rgb,
        name: getColorName(c.rgb),
        reason: reasons.join(' · '),
        themeScore: computeThemeScore(c)
      });
    }

    // 按 themeScore 降序
    candidates.sort((a, b) => b.themeScore - a.themeScore);
    return candidates.slice(0, 4); // 最多4个候选
  }

  // ========== 配色方案生成 ==========

  function complementaryScheme(rgb) {
    const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    const compH = (h + 180) % 360;
    return [
      rgb,
      hslToRgb(compH, s, l),
      hslToRgb(h, Math.min(s + 10, 100), Math.min(l + 20, 95)),
      hslToRgb(compH, Math.min(s + 10, 100), Math.min(l + 20, 95)),
      hslToRgb(h, Math.max(s - 20, 10), Math.max(l - 20, 10))
    ];
  }

  function analogousScheme(rgb) {
    const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    return [
      rgb,
      hslToRgb((h + 30) % 360, s, l),
      hslToRgb((h + 330) % 360, s, l),
      hslToRgb((h + 60) % 360, s, l),
      hslToRgb((h + 300) % 360, s, l)
    ];
  }

  function triadicScheme(rgb) {
    const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    return [
      rgb,
      hslToRgb((h + 120) % 360, s, l),
      hslToRgb((h + 240) % 360, s, l),
      hslToRgb(h, Math.min(s + 15, 100), Math.min(l + 25, 95)),
      hslToRgb((h + 120) % 360, Math.max(s - 15, 10), Math.max(l - 15, 10))
    ];
  }

  function splitComplementaryScheme(rgb) {
    const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    return [
      rgb,
      hslToRgb((h + 150) % 360, s, l),
      hslToRgb((h + 210) % 360, s, l),
      hslToRgb(h, Math.min(s + 10, 100), Math.min(l + 20, 95)),
      hslToRgb((h + 180) % 360, Math.max(s - 10, 10), Math.max(l - 10, 10))
    ];
  }

  // ========== 颜色名称 ==========

  function getColorName(rgb) {
    const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    if (l < 5) return '黑色';
    if (l > 95) return '白色';
    if (s < 8) {
      if (l < 20) return '深灰';
      if (l < 40) return '灰色';
      if (l < 60) return '中灰';
      if (l < 80) return '浅灰';
      return '亮灰';
    }
    const colorNames = [
      [0, '红色'], [15, '橙红'], [30, '橙色'], [45, '橙黄'],
      [60, '黄色'], [75, '黄绿'], [90, '草绿'], [120, '绿色'],
      [150, '青绿'], [165, '青色'], [180, '青蓝'], [195, '蓝青'],
      [210, '蓝色'], [240, '靛蓝'], [270, '紫色'], [300, '紫红'],
      [330, '玫红'], [345, '红色'], [360, '红色']
    ];
    let name = '红色';
    for (let i = 0; i < colorNames.length - 1; i++) {
      if (h >= colorNames[i][0] && h < colorNames[i + 1][0]) {
        name = colorNames[i][1];
        break;
      }
    }
    if (l < 25) return '深' + name;
    if (l < 40) return '暗' + name;
    if (l > 80) return '浅' + name;
    if (l > 65) return '亮' + name;
    if (s < 40) return '灰' + name;
    return name;
  }

  // ========== 主分析流程 ==========

  extractColors();

  // ★ 第一次粗聚类：LAB ΔE < 10（合并人眼不可分辨的相近色）
  const coarseClusters = clusterColorsLab(10);

  // ★ 使用主题色置信度得分排序
  const maxColors = 24;
  const scoredClusters = coarseClusters.map(c => ({
    ...c,
    themeScore: computeThemeScore(c)
  }));

  // 按 themeScore 降序排序，取 Top N
  scoredClusters.sort((a, b) => b.themeScore - a.themeScore);
  const topColors = scoredClusters.slice(0, maxColors);

  // ★ 第二次细聚类：LAB ΔE < 15（合并同色系变体）
  const finalClusters = [];
  const used = new Set();
  for (let i = 0; i < topColors.length; i++) {
    if (used.has(i)) continue;
    const c = topColors[i];
    const group = [c];
    used.add(i);
    for (let j = i + 1; j < topColors.length; j++) {
      if (used.has(j)) continue;
      if (labDeltaE(c.lab, topColors[j].lab) < 15) {
        group.push(topColors[j]);
        used.add(j);
      }
    }
    // 选择组中 themeScore 最高的颜色作为代表
    group.sort((a, b) => b.themeScore - a.themeScore);
    finalClusters.push(group[0]);
  }

  // ★ 主色调：themeScore 最高的颜色
  const dominantColor = finalClusters.length > 0 ? {
    hex: finalClusters[0].hex,
    rgb: finalClusters[0].rgb,
    name: getColorName(finalClusters[0].rgb),
    count: finalClusters[0].rawCount,
    percentage: 0
  } : null;

  // ★ 主要配色方案：按 weightedScore 排序取前10（权重最高的10种颜色）
  finalClusters.sort((a, b) => b.weightedScore - a.weightedScore);
  const palette = finalClusters.slice(0, 10).map(c => ({
    hex: c.hex,
    rgb: c.rgb,
    name: getColorName(c.rgb),
    count: c.rawCount,
    percentage: 0
  }));

  // 计算百分比
  const totalWeightedScore = palette.reduce((sum, _, i) => sum + finalClusters[i].weightedScore, 0);
  palette.forEach((c, i) => {
    c.percentage = totalWeightedScore > 0
      ? Math.round(finalClusters[i].weightedScore / totalWeightedScore * 100)
      : 0;
  });

  // ★ 候选主题色
  const candidateThemeColors = detectCandidateThemeColors(
    scoredClusters,
    dominantColor ? dominantColor.hex : ''
  );

  // 生成配色方案
  let schemes = [];
  if (dominantColor) {
    const rgb = dominantColor.rgb;
    schemes = [
      {
        name: '互补色',
        nameEn: 'Complementary',
        description: '色轮上相对的颜色，对比强烈',
        colors: complementaryScheme(rgb).map(c => rgbToHex(c[0], c[1], c[2]))
      },
      {
        name: '类似色',
        nameEn: 'Analogous',
        description: '色轮上相邻的颜色，和谐自然',
        colors: analogousScheme(rgb).map(c => rgbToHex(c[0], c[1], c[2]))
      },
      {
        name: '三等分',
        nameEn: 'Triadic',
        description: '色轮上等距三个颜色，丰富均衡',
        colors: triadicScheme(rgb).map(c => rgbToHex(c[0], c[1], c[2]))
      },
      {
        name: '分裂互补',
        nameEn: 'Split Complementary',
        description: '互补色的两侧邻近色，对比柔和',
        colors: splitComplementaryScheme(rgb).map(c => rgbToHex(c[0], c[1], c[2]))
      }
    ];
  }

  // 返回分析结果
  return {
    url: window.location.href,
    title: document.title,
    palette,
    dominantColor,
    candidateThemeColors,
    schemes,
    totalColorsFound: colorMap.size
  };
})();
