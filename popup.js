/**
 * PaletteSniffer - 调色盘嗅探器
 * Popup 交互逻辑
 */

document.addEventListener('DOMContentLoaded', () => {
  const btnAnalyze = document.getElementById('btnAnalyze');
  const btnText = document.getElementById('btnText');
  const pageInfo = document.getElementById('pageInfo');
  const emptyState = document.getElementById('emptyState');
  const analysisResult = document.getElementById('analysisResult');
  const statsBar = document.getElementById('statsBar');
  const dominantSection = document.getElementById('dominantSection');
  const dominantPreview = document.getElementById('dominantPreview');
  const paletteGrid = document.getElementById('paletteGrid');
  const schemesSection = document.getElementById('schemesSection');
  const schemesContainer = document.getElementById('schemesContainer');
  const candidateSection = document.getElementById('candidateSection');
  const candidateContainer = document.getElementById('candidateContainer');
  const exportBar = document.getElementById('exportBar');
  const toast = document.getElementById('toast');

  let currentResult = null;

  // ========== 工具函数 ==========

  /**
   * 显示 Toast 提示
   */
  function showToast(msg, duration = 2000) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
  }

  /**
   * 复制文本到剪贴板
   */
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`已复制: ${text}`);
    } catch {
      // 降级方案
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast(`已复制: ${text}`);
    }
  }

  /**
   * 判断文字颜色（深色背景用白字，浅色背景用黑字）
   */
  function getContrastColor(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#1a1a2e' : '#ffffff';
  }

  // ========== 分析按钮 ==========

  btnAnalyze.addEventListener('click', async () => {
    // 获取当前活动标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      showToast('无法获取当前标签页');
      return;
    }

    // 检查是否为 chrome:// 页面
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://')) {
      showToast('无法分析浏览器内部页面');
      return;
    }

    // 设置加载状态
    btnAnalyze.classList.add('loading');
    btnText.innerHTML = '<div class="spinner"></div>分析中...';
    pageInfo.textContent = '正在分析页面配色...';

    try {
      // 注入并执行内容脚本
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      if (results && results[0] && results[0].result) {
        currentResult = results[0].result;
        renderResult(currentResult);
      } else {
        showToast('分析失败，请刷新页面后重试');
        pageInfo.textContent = '分析失败';
      }
    } catch (err) {
      console.error('PaletteSniffer error:', err);
      showToast('分析出错: ' + (err.message || '未知错误'));
      pageInfo.textContent = '分析出错';
    } finally {
      btnAnalyze.classList.remove('loading');
      btnText.textContent = '重新嗅探';
    }
  });

  // ========== 渲染结果 ==========

  function renderResult(data) {
    emptyState.style.display = 'none';
    analysisResult.style.display = 'block';

    // 页面信息
    pageInfo.textContent = `${data.title || '未知页面'} - ${data.url || ''}`;
    pageInfo.title = data.url || '';

    // 统计栏
    statsBar.innerHTML = `
      <div class="stat-item">
        <div class="stat-value">${data.palette.length}</div>
        <div class="stat-label">主色数量</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${data.totalColorsFound}</div>
        <div class="stat-label">原始颜色数</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${data.schemes.length}</div>
        <div class="stat-label">配色方案</div>
      </div>
    `;

    // 主色调
    if (data.dominantColor) {
      dominantSection.style.display = 'block';
      dominantPreview.style.display = 'flex';
      const dc = data.dominantColor;
      dominantPreview.innerHTML = `
        <div class="dominant-swatch" style="background:${dc.hex}"></div>
        <div class="dominant-info">
          <div class="dominant-label">主色调 · ${dc.name}</div>
          <div class="dominant-hex">${dc.hex.toUpperCase()}</div>
          <div class="dominant-rgb">RGB(${dc.rgb.join(', ')})</div>
        </div>
        <button class="dominant-copy-btn" data-copy="${dc.hex}">复制</button>
      `;
      dominantPreview.querySelector('.dominant-copy-btn').addEventListener('click', () => {
        copyText(dc.hex.toUpperCase());
      });
    }

    // 调色板（主要配色方案，前6种）
    paletteGrid.innerHTML = '';
    data.palette.forEach(color => {
      const card = document.createElement('div');
      card.className = 'color-card';
      card.innerHTML = `
        <div class="color-swatch" style="background:${color.hex}">
          <div class="copy-hint">点击复制</div>
        </div>
        <div class="color-info">
          <div class="color-hex">${color.hex.toUpperCase()}</div>
          <div class="color-name">${color.name}</div>
          <div class="color-percent">${color.percentage}%</div>
        </div>
      `;
      card.addEventListener('click', () => {
        copyText(color.hex.toUpperCase());
      });
      paletteGrid.appendChild(card);
    });

    // ★ 候选主题色（高饱和度 + 交互元素 + 可能的主题色）
    if (data.candidateThemeColors && data.candidateThemeColors.length > 0) {
      candidateSection.style.display = 'block';
      candidateContainer.innerHTML = '';
      const list = document.createElement('div');
      list.className = 'candidate-list';

      data.candidateThemeColors.forEach(c => {
        const card = document.createElement('div');
        card.className = 'candidate-card';
        card.innerHTML = `
          <div class="candidate-swatch" style="background:${c.hex}"></div>
          <div class="candidate-info">
            <div class="candidate-hex">${c.hex.toUpperCase()}</div>
            <div class="candidate-name">${c.name}</div>
            <div class="candidate-reason">${c.reason}</div>
          </div>
          <div class="candidate-badge">候选主题色</div>
        `;
        card.addEventListener('click', () => {
          copyText(c.hex.toUpperCase());
        });
        list.appendChild(card);
      });
      candidateContainer.appendChild(list);
    } else {
      candidateSection.style.display = 'none';
      candidateContainer.innerHTML = '';
    }

    // 配色方案
    if (data.schemes.length > 0) {
      schemesSection.style.display = 'block';
      schemesContainer.innerHTML = '';
      data.schemes.forEach(scheme => {
        const card = document.createElement('div');
        card.className = 'scheme-card';

        const colorsHtml = scheme.colors.map(hex => {
          const textColor = getContrastColor(hex);
          return `<div class="scheme-color-item" style="background:${hex};color:${textColor}" data-copy="${hex}"><span>${hex.toUpperCase()}</span></div>`;
        }).join('');

        card.innerHTML = `
          <div class="scheme-header">
            <div>
              <span class="scheme-name">${scheme.name}</span>
              <span class="scheme-name-en">${scheme.nameEn}</span>
              <div class="scheme-desc">${scheme.description}</div>
            </div>
            <span class="scheme-toggle">▼</span>
          </div>
          <div class="scheme-colors">${colorsHtml}</div>
        `;

        // 展开/收起
        const header = card.querySelector('.scheme-header');
        const colors = card.querySelector('.scheme-colors');
        const toggle = card.querySelector('.scheme-toggle');
        header.addEventListener('click', () => {
          const isExpanded = colors.classList.contains('expanded');
          colors.classList.toggle('expanded');
          toggle.classList.toggle('open');
        });

        // 点击颜色复制
        card.querySelectorAll('.scheme-color-item').forEach(item => {
          item.addEventListener('click', (e) => {
            e.stopPropagation();
            copyText(item.dataset.copy.toUpperCase());
          });
        });

        schemesContainer.appendChild(card);
      });
    }

    // 导出栏
    exportBar.style.display = 'flex';
  }

  // ========== 导出功能 ==========

  document.getElementById('btnExportCSS').addEventListener('click', () => {
    if (!currentResult) return;
    const lines = [':root {'];
    currentResult.palette.forEach((c, i) => {
      lines.push(`  --color-${i + 1}: ${c.hex}; /* ${c.name} */`);
    });
    if (currentResult.dominantColor) {
      lines.push(`  --color-dominant: ${currentResult.dominantColor.hex}; /* 主色调 */`);
    }
    lines.push('}');
    copyText(lines.join('\n'));
    showToast('CSS 变量已复制到剪贴板');
  });

  document.getElementById('btnExportJSON').addEventListener('click', () => {
    if (!currentResult) return;
    const exportData = {
      url: currentResult.url,
      title: currentResult.title,
      palette: currentResult.palette.map(c => ({
        hex: c.hex.toUpperCase(),
        rgb: c.rgb,
        name: c.name,
        percentage: c.percentage
      })),
      dominantColor: currentResult.dominantColor ? {
        hex: currentResult.dominantColor.hex.toUpperCase(),
        rgb: currentResult.dominantColor.rgb,
        name: currentResult.dominantColor.name
      } : null,
      candidateThemeColors: (currentResult.candidateThemeColors || []).map(c => ({
        hex: c.hex.toUpperCase(),
        rgb: c.rgb,
        name: c.name,
        reason: c.reason
      })),
      schemes: currentResult.schemes.map(s => ({
        name: s.name,
        nameEn: s.nameEn,
        description: s.description,
        colors: s.colors.map(c => c.toUpperCase())
      }))
    };
    copyText(JSON.stringify(exportData, null, 2));
    showToast('JSON 数据已复制到剪贴板');
  });

  document.getElementById('btnExportSVG').addEventListener('click', () => {
    if (!currentResult) return;
    const colors = currentResult.palette;
    const w = 600;
    const h = 200;
    const swatchW = Math.floor(w / colors.length);
    let rects = '';
    let texts = '';
    colors.forEach((c, i) => {
      const x = i * swatchW;
      const textColor = getContrastColor(c.hex);
      rects += `<rect x="${x}" y="0" width="${swatchW}" height="${h}" fill="${c.hex}"/>`;
      texts += `<text x="${x + swatchW / 2}" y="${h / 2}" text-anchor="middle" dominant-baseline="middle" fill="${textColor}" font-size="12" font-family="monospace">${c.hex.toUpperCase()}</text>`;
      texts += `<text x="${x + swatchW / 2}" y="${h / 2 + 18}" text-anchor="middle" fill="${textColor}" font-size="10" font-family="sans-serif">${c.name}</text>`;
    });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${rects}${texts}</svg>`;
    copyText(svg);
    showToast('色卡 SVG 已复制到剪贴板');
  });
});
