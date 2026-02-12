// ========== 统计模块 ==========

const Stats = {
  // DOM 元素
  todayTotalElement: null,
  weekTotalElement: null,
  todayDateElement: null,
  resetButton: null,
  
  // 初始化
  init(todayTotalEl, weekTotalEl, todayDateEl, resetBtn) {
    this.todayTotalElement = todayTotalEl;
    this.weekTotalElement = weekTotalEl;
    this.todayDateElement = todayDateEl;
    this.resetButton = resetBtn;
    
    // 绑定重置按钮事件
    this.resetButton.addEventListener('click', () => this.resetToday());
    
    // 更新日期显示
    this.updateDateDisplay();
    
    // 加载统计数据
    this.load();
  },
  
  // 更新日期显示
  updateDateDisplay() {
    if (this.todayDateElement) {
      this.todayDateElement.textContent = getTodayDateDisplay();
    }
  },
  
  // 加载统计数据
  async load() {
    const result = await chrome.storage.local.get(['studyRecords']);
    const records = result.studyRecords || {};
    const today = getTodayDate();
    const weekStart = getWeekStartDate();
    
    // 今日总时长
    this.todayTotalElement.textContent = formatTime(records[today]?.totalSeconds || 0);
    
    // 本周总时长
    let weekSeconds = 0;
    for (const date in records) {
      if (date >= weekStart) {
        weekSeconds += records[date].totalSeconds;
      }
    }
    this.weekTotalElement.textContent = formatTime(weekSeconds);
  },
  
  // 重置今日记录
  async resetToday() {
    if (!confirm('确定要清零今天的记录吗？此操作不可恢复。')) return;
    
    const response = await chrome.runtime.sendMessage({ action: 'resetToday' });
    if (response.success) {
      await this.load();
      await Heatmap.generate();
      alert('今天的记录已清零');
    }
  }
};
