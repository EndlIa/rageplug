// ========== 热力图模块 ==========

const Heatmap = {
  // DOM 元素
  gridElement: null,
  monthsElement: null,
  tooltipElement: null,
  
  // 初始化
  init(gridEl, monthsEl) {
    this.gridElement = gridEl;
    this.monthsElement = monthsEl;
    this.generate();
  },
  
  // 获取热力图等级
  getLevel(seconds) {
    if (seconds === 0) return 0;
    const hours = seconds / 3600;
    if (hours <= 1) return 1;
    if (hours <= 2) return 2;
    if (hours <= 3) return 3;
    if (hours <= 4) return 4;
    if (hours <= 5) return 5;
    if (hours <= 6) return 6;
    if (hours <= 7) return 7;
    if (hours <= 8) return 8;
    if (hours <= 9) return 9;
    if (hours <= 10) return 10;
    if (hours <= 11) return 11;
    if (hours <= 12) return 12;
    if (hours <= 13) return 13;
    if (hours <= 14) return 14;
    if (hours <= 15) return 15;
    return 16;
  },
  
  // 获取或创建 tooltip
  getTooltip() {
    if (!this.tooltipElement) {
      this.tooltipElement = document.createElement('div');
      this.tooltipElement.className = 'heatmap-tooltip';
      document.body.appendChild(this.tooltipElement);
    }
    return this.tooltipElement;
  },
  
  // 显示 tooltip
  showTooltip(event, dateStr, seconds) {
    const tooltip = this.getTooltip();
    tooltip.textContent = seconds === 0 
      ? `${formatDateChinese(dateStr)}: 无记录`
      : `${formatDateChinese(dateStr)}: ${formatTime(seconds)}`;
    tooltip.style.left = `${event.clientX + 10}px`;
    tooltip.style.top = `${event.clientY - 30}px`;
    tooltip.style.display = 'block';
  },
  
  // 隐藏 tooltip
  hideTooltip() {
    const tooltip = this.getTooltip();
    tooltip.style.display = 'none';
  },
  
  // 生成热力图
  async generate() {
    const result = await chrome.storage.local.get(['studyRecords']);
    const records = result.studyRecords || {};
    
    const startDate = new Date(CONFIG.heatmapStartDate);
    const today = new Date();
    const days = [];
    const monthPositions = [];
    
    let currentDate = new Date(startDate);
    let currentMonth = -1;
    const firstDayOfWeek = startDate.getDay();
    
    // 计算所有日期数据
    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();
      const seconds = records[dateStr]?.totalSeconds || 0;
      const month = currentDate.getMonth();
      
      const daysSinceStart = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
      const currentColumnIndex = Math.floor((daysSinceStart + firstDayOfWeek) / 7);
      
      // 记录月份位置
      if (month !== currentMonth) {
        currentMonth = month;
        monthPositions.push({ month, columnIndex: currentColumnIndex });
      }
      
      days.push({
        date: dateStr,
        dayOfWeek,
        seconds,
        level: this.getLevel(seconds),
        month,
        row: dayOfWeek + 1,
        column: currentColumnIndex + 1
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // 清空现有内容
    this.gridElement.innerHTML = '';
    this.monthsElement.innerHTML = '';
    
    // 设置网格列数
    const totalColumns = days.length > 0 ? Math.max(...days.map(d => d.column)) : 0;
    this.gridElement.style.gridTemplateColumns = `repeat(${totalColumns}, 12px)`;
    
    // 渲染月份标签
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const cellWidth = 15;
    
    monthPositions.forEach(pos => {
      const monthLabel = document.createElement('div');
      monthLabel.className = 'heatmap-month-label';
      monthLabel.textContent = monthNames[pos.month];
      monthLabel.style.position = 'absolute';
      monthLabel.style.left = `${pos.columnIndex * cellWidth}px`;
      this.monthsElement.appendChild(monthLabel);
    });
    
    // 渲染热力图格子
    days.forEach(day => {
      const cell = document.createElement('div');
      cell.className = 'heatmap-cell';
      cell.setAttribute('data-level', day.level);
      cell.style.gridRow = day.row;
      cell.style.gridColumn = day.column;
      
      cell.addEventListener('mouseenter', (e) => this.showTooltip(e, day.date, day.seconds));
      cell.addEventListener('mousemove', (e) => {
        const tooltip = this.getTooltip();
        tooltip.style.left = `${e.clientX + 10}px`;
        tooltip.style.top = `${e.clientY - 30}px`;
      });
      cell.addEventListener('mouseleave', () => this.hideTooltip());
      
      this.gridElement.appendChild(cell);
    });
  }
};
