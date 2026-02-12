// ========== 配置文件 ==========

// 句子库配置
const CONFIG = {
  // 开始时显示的句子库
  startSentences: [
    "燃尽每一根羽毛。"
  ],
  
  // 结束时显示的句子库
  endSentences: [
    "并非并非并非"
  ],
  
  // 原始标题
  originalTitle: "鬼神明明，自思自量。",
  
  // 热力图开始日期
  heatmapStartDate: '2026-01-04',
  
  // 从 storage 加载自定义配置
  async loadCustomSentences() {
    const result = await chrome.storage.local.get(['customSentences']);
    if (result.customSentences) {
      if (result.customSentences.startSentences) {
        this.startSentences = result.customSentences.startSentences;
      }
      if (result.customSentences.endSentences) {
        this.endSentences = result.customSentences.endSentences;
      }
    }
  },
  
  // 保存自定义配置到 storage
  async saveCustomSentences(startSentences, endSentences) {
    this.startSentences = startSentences;
    this.endSentences = endSentences;
    await chrome.storage.local.set({
      customSentences: {
        startSentences,
        endSentences
      }
    });
  }
};
