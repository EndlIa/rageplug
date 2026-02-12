// 计时器状态
let startTime = null;
let elapsedTime = 0;
let timerInterval = null;
let isRunning = false;
let lastDisplayTime = 0;

// DOM 元素（缓存）
let timerDisplay, startBtn, stopBtn, resetBtn, todayTotalEl, weekTotalEl, historyListEl, todayDateEl;

// 格式化时间为 HH:MM:SS
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// 更新计时器显示（每秒更新一次，减少CPU占用）
function updateTimerDisplay() {
  if (isRunning) {
    const currentTime = Math.floor((Date.now() - startTime) / 1000) + elapsedTime;
    if (currentTime !== lastDisplayTime) {
      lastDisplayTime = currentTime;
      timerDisplay.textContent = formatTime(currentTime);
    }
  }
  if (isRunning) {
    timerInterval = requestAnimationFrame(updateTimerDisplay);
  }
}

// 从后台获取计时器状态
async function syncTimerState() {
  const response = await chrome.runtime.sendMessage({ action: 'getTimerState' });
  if (response) {
    isRunning = response.isRunning;
    elapsedTime = response.elapsedSeconds;
    
    if (isRunning) {
      startTime = response.startTime;
      timerDisplay.classList.add('running');
      startBtn.disabled = true;
      stopBtn.disabled = false;
      
      // 启动显示更新（使用 requestAnimationFrame）
      if (!timerInterval) {
        updateTimerDisplay();
      }
    } else {
      timerDisplay.textContent = formatTime(elapsedTime);
      timerDisplay.classList.remove('running');
      startBtn.disabled = false;
      stopBtn.disabled = true;
    }
  }
}

// 获取今天的日期字符串 (YYYY-MM-DD)
function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// 获取今天的日期显示文本（周几 月日）
function getTodayDateDisplay() {
  const today = new Date();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekday = weekdays[today.getDay()];
  const month = today.getMonth() + 1;
  const day = today.getDate();
  return `${weekday} ${month}月${day}日`;
}

// 更新日期显示
function updateDateDisplay() {
  if (todayDateEl) {
    todayDateEl.textContent = getTodayDateDisplay();
  }
}

// 获取本周的开始日期
function getWeekStartDate() {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // 周一作为一周的开始
  const monday = new Date(today.setDate(diff));
  return monday.toISOString().split('T')[0];
}

// 加载统计数据
async function loadStats() {
  const result = await chrome.storage.local.get(['studyRecords']);
  const records = result.studyRecords || {};
  
  const today = getTodayDate();
  const weekStart = getWeekStartDate();
  
  // 计算今日总时长
  const todaySeconds = records[today]?.totalSeconds || 0;
  todayTotalEl.textContent = formatTime(todaySeconds);
  
  // 计算本周总时长
  let weekSeconds = 0;
  for (const date in records) {
    if (date >= weekStart) {
      weekSeconds += records[date].totalSeconds;
    }
  }
  weekTotalEl.textContent = formatTime(weekSeconds);
}

// 清零当天时间
async function resetTodayTime() {
  if (!confirm('确定要清零今天的学习记录吗？此操作不可恢复。')) {
    return;
  }
  
  const response = await chrome.runtime.sendMessage({ action: 'resetToday' });
  if (response.success) {
    await loadStats();
    await loadHistory();
    alert('今天的记录已清零');
  }
}

// 加载学习历史
async function loadHistory() {
  const result = await chrome.storage.local.get(['studyRecords']);
  const records = result.studyRecords || {};
  
  // 按日期降序排序
  const sortedDates = Object.keys(records).sort().reverse();
  
  if (sortedDates.length === 0) {
    historyListEl.innerHTML = '<div class="empty-message">暂无学习记录</div>';
    return;
  }
  
  // 生成历史记录列表（使用数组拼接减少内存分配）
  const today = getTodayDate();
  const items = sortedDates.slice(0, 30).map(date => {
    const record = records[date];
    const dateObj = new Date(date);
    const dateStr = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
    const displayDate = date === today ? '今天' : dateStr;
    
    return `<div class="history-item"><span class="history-date">${displayDate} (${record.sessions.length}次)</span><span class="history-duration">${formatTime(record.totalSeconds)}</span></div>`;
  });
  historyListEl.innerHTML = items.join('');
}

// 开始学习
async function startStudy() {
  if (isRunning) return;
  
  const response = await chrome.runtime.sendMessage({ action: 'startTimer' });
  if (response?.success) {
    await syncTimerState();
  }
}

// 结束学习
async function stopStudy() {
  if (!isRunning) return;
  
  const response = await chrome.runtime.sendMessage({ action: 'stopTimer' });
  if (response?.success) {
    // 停止本地显示更新
    if (timerInterval) {
      cancelAnimationFrame(timerInterval);
      timerInterval = null;
    }
    
    // 重置显示
    isRunning = false;
    startTime = null;
    elapsedTime = 0;
    lastDisplayTime = 0;
    timerDisplay.textContent = '00:00:00';
    timerDisplay.classList.remove('running');
    startBtn.disabled = false;
    stopBtn.disabled = true;
    
    // 重新加载统计数据和历史记录
    loadStats();
    loadHistory();
  }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
  // 缓存 DOM 元素
  timerDisplay = document.getElementById('timer');
  startBtn = document.getElementById('startBtn');
  stopBtn = document.getElementById('stopBtn');
  resetBtn = document.getElementById('resetBtn');
  todayTotalEl = document.getElementById('todayTotal');
  weekTotalEl = document.getElementById('weekTotal');
  historyListEl = document.getElementById('historyList');
  todayDateEl = document.getElementById('todayDate');
  
  // 添加事件监听
  startBtn.addEventListener('click', startStudy);
  stopBtn.addEventListener('click', stopStudy);
  resetBtn.addEventListener('click', resetTodayTime);
  
  // 更新日期显示
  updateDateDisplay();
  
  // 同步后台计时器状态并加载数据
  syncTimerState();
  loadStats();
  loadHistory();
});
