// ========== URL 拦截 ==========
// 缓存正则表达式，避免每次重新编译
const BLOCKED_PATTERNS = [
  /^https?:\/\/(www\.)?x\.com(\/|$)/,
  /^https?:\/\/(www\.)?twitter\.com(\/|$)/,
  /^https?:\/\/(www\.)?xiaohongshu\.com(\/|$)/,
  /^https?:\/\/(www\.)?alicesw\.com(\/|$)/,
  /^https?:\/\/(www\.)?manwa\.me(\/|$)/,
  /^https?:\/\/(www\.)?hanimeone\.me(\/|$)/,
  /^https?:\/\/(www\.)?rule34video\.com(\/|$)/
];

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return;
  
  const url = details.url;
  if (BLOCKED_PATTERNS.some(pattern => pattern.test(url))) {
    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL("rageplug.html")
    });
  }
});

// ========== 计时器管理 ==========
let timerState = {
  isRunning: false,
  startTime: null,
  elapsedSeconds: 0
};

// 初始化：从存储恢复计时器状态
chrome.storage.local.get(['timerState'], (result) => {
  if (result.timerState) {
    timerState = result.timerState;
  }
});

// 保存计时器状态
function saveTimerState() {
  chrome.storage.local.set({ timerState: timerState });
}

// 监听来自页面的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getTimerState':
      // 返回当前计时器状态（返回基础值，由前端计算当前时间）
      sendResponse({
        isRunning: timerState.isRunning,
        startTime: timerState.startTime,
        elapsedSeconds: timerState.elapsedSeconds  // 只返回基础值
      });
      break;
      
    case 'startTimer':
      // 开始计时
      if (!timerState.isRunning) {
        timerState.isRunning = true;
        timerState.startTime = Date.now();
        saveTimerState();
        sendResponse({ success: true });
      }
      break;
      
    case 'stopTimer':
      // 停止计时并保存记录
      if (timerState.isRunning) {
        const totalSeconds = Math.floor((Date.now() - timerState.startTime) / 1000);
        timerState.isRunning = false;
        timerState.startTime = null;
        timerState.elapsedSeconds = 0;
        saveTimerState();
        
        // 保存学习记录并返回最新统计
        if (totalSeconds >= 60) {
          saveStudySession(totalSeconds).then(() => {
            getStudyStats().then(stats => {
              sendResponse({ 
                success: true, 
                totalSeconds,
                todayTotal: stats.todayTotal,
                weekTotal: stats.weekTotal
              });
            });
          });
          return true; // 异步响应
        }
        sendResponse({ success: true, totalSeconds });
      } else {
        sendResponse({ success: false });
      }
      break;
      
    case 'resetToday':
      // 清零当天的时间记录
      resetTodayRecords().then(() => {
        getStudyStats().then(stats => {
          sendResponse({
            success: true,
            todayTotal: stats.todayTotal,
            weekTotal: stats.weekTotal
          });
        });
      });
      return true; // 异步响应
      break;
  }
  return true; // 保持消息通道开放
});

// 保存学习记录
async function saveStudySession(duration) {
  const today = new Date().toISOString().split('T')[0];
  
  const result = await chrome.storage.local.get(['studyRecords']);
  const records = result.studyRecords || {};
  
  if (!records[today]) {
    records[today] = {
      date: today,
      sessions: [],
      totalSeconds: 0
    };
  }
  
  const now = new Date();
  records[today].sessions.push({
    start: new Date(now - duration * 1000).toLocaleTimeString('zh-CN'),
    end: now.toLocaleTimeString('zh-CN'),
    duration
  });
  records[today].totalSeconds += duration;
  
  await chrome.storage.local.set({ studyRecords: records });
}

// 获取学习统计数据
async function getStudyStats() {
  const today = new Date().toISOString().split('T')[0];
  const weekStart = getWeekStartDate();
  
  const result = await chrome.storage.local.get(['studyRecords']);
  const records = result.studyRecords || {};
  
  // 计算今日总时长
  const todayTotal = records[today]?.totalSeconds || 0;
  
  // 计算本周总时长
  let weekTotal = 0;
  for (const date in records) {
    if (date >= weekStart) {
      weekTotal += records[date].totalSeconds;
    }
  }
  
  return { todayTotal, weekTotal };
}

// 获取本周的开始日期
function getWeekStartDate() {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  return monday.toISOString().split('T')[0];
}

// 清零当天的记录
async function resetTodayRecords() {
  const today = new Date().toISOString().split('T')[0];
  const result = await chrome.storage.local.get(['studyRecords']);
  const records = result.studyRecords || {};
  
  // 删除今天的记录
  if (records[today]) {
    delete records[today];
    await chrome.storage.local.set({ studyRecords: records });
  }
}

// ========== Omnibox 功能 ==========
chrome.omnibox.setDefaultSuggestion({
  description: "打开 RagePlug 页面"
});

// 支持在地址栏输入 rp 关键词打开页面
chrome.omnibox.onInputEntered.addListener((text, disposition) => {
  const url = chrome.runtime.getURL("rageplug.html");
  
  // 根据打开方式处理
  switch (disposition) {
    case "currentTab":
      chrome.tabs.update({ url: url });
      break;
    case "newForegroundTab":
      chrome.tabs.create({ url: url });
      break;
    case "newBackgroundTab":
      chrome.tabs.create({ url: url, active: false });
      break;
    default:
      chrome.tabs.update({ url: url });
  }
});