/**
 * PaletteSniffer - 调色盘嗅探器
 * 后台服务脚本
 */

// 监听插件安装事件
chrome.runtime.onInstalled.addListener(() => {
  console.log('PaletteSniffer 调色盘嗅探器已安装');
});

// 点击插件图标时触发分析（备用，主要通过popup触发）
chrome.action.onClicked.addListener((tab) => {
  // 此处无需处理，popup会接管
});
