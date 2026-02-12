// ========== 计时器模块 ==========

const Timer = {
  // 状态变量
  startTime: null,
  elapsedTime: 0,
  timerInterval: null,
  isRunning: false,
  lastDisplayTime: 0,
  
  // DOM 元素
  displayElement: null,
  startButton: null,
  stopButton: null,
  
  // 初始化
  init(displayEl, startBtn, stopBtn) {
    this.displayElement = displayEl;
    this.startButton = startBtn;
    this.stopButton = stopBtn;
    
    // 绑定事件
    this.startButton.addEventListener('click', () => this.start());
    this.stopButton.addEventListener('click', () => this.stop());
    
    // 页面可见性变化处理
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    window.addEventListener('beforeunload', () => this.cleanup());
    window.addEventListener('pagehide', () => this.cleanup());
    
    // 监听后台的午夜重启消息
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'midnightRestart') {
        console.log('收到午夜自动重启通知，更新界面');
        // 重新同步状态
        this.syncState();
        // 更新统计和热力图
        Stats.load();
        Heatmap.generate();
        // 显示开始标题
        Title.showStart();
      }
    });
    
    // 同步状态
    this.syncState();
  },
  
  // 更新显示
  updateDisplay() {
    if (this.isRunning && !document.hidden) {
      const currentTime = Math.floor((Date.now() - this.startTime) / 1000) + this.elapsedTime;
      if (currentTime !== this.lastDisplayTime) {
        this.lastDisplayTime = currentTime;
        this.displayElement.textContent = formatTime(currentTime);
      }
    }
    if (this.isRunning) {
      this.timerInterval = requestAnimationFrame(() => this.updateDisplay());
    }
  },
  
  // 同步后台状态
  async syncState() {
    const response = await chrome.runtime.sendMessage({ action: 'getTimerState' });
    if (response) {
      this.isRunning = response.isRunning;
      this.elapsedTime = response.elapsedSeconds;
      
      if (this.isRunning) {
        this.startTime = response.startTime;
        this.displayElement.classList.add('running');
        this.startButton.disabled = true;
        this.stopButton.disabled = false;
        if (!this.timerInterval) this.updateDisplay();
      } else {
        this.displayElement.textContent = formatTime(this.elapsedTime);
        this.displayElement.classList.remove('running');
        this.startButton.disabled = false;
        this.stopButton.disabled = true;
      }
    }
  },
  
  // 开始计时
  async start() {
    if (this.isRunning) return;
    
    // 更新标题
    Title.showStart();
    
    const response = await chrome.runtime.sendMessage({ action: 'startTimer' });
    if (response?.success) await this.syncState();
  },
  
  // 停止计时
  async stop() {
    if (!this.isRunning) return;
    
    // 更新标题
    Title.showEnd();
    
    const response = await chrome.runtime.sendMessage({ action: 'stopTimer' });
    if (response?.success) {
      this.cleanup();
      this.isRunning = false;
      this.startTime = null;
      this.elapsedTime = 0;
      this.lastDisplayTime = 0;
      this.displayElement.textContent = '00:00:00';
      this.displayElement.classList.remove('running');
      this.startButton.disabled = false;
      this.stopButton.disabled = true;
      
      // 更新统计和热力图
      Stats.load();
      Heatmap.generate();
    }
  },
  
  // 清理资源
  cleanup() {
    if (this.timerInterval) {
      cancelAnimationFrame(this.timerInterval);
      this.timerInterval = null;
    }
    Heatmap.hideTooltip();
  },
  
  // 处理页面可见性变化
  handleVisibilityChange() {
    if (document.hidden) {
      this.cleanup();
    } else if (this.isRunning) {
      this.updateDisplay();
    }
  }
};
