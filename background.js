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

// 记录开始计时时的日期，用于检测跨日
let startDate = null;

// 初始化：从存储恢复计时器状态
chrome.storage.local.get(['timerState', 'startDate'], (result) => {
  if (result.timerState) {
    timerState = result.timerState;
  }
  if (result.startDate) {
    startDate = result.startDate;
  }
  // 如果恢复时发现计时器在运行，启动日期检查
  if (timerState.isRunning) {
    startMidnightCheck();
  }
});

// 保存计时器状态
function saveTimerState() {
  chrome.storage.local.set({ 
    timerState: timerState,
    startDate: startDate
  });
}

// ========== 午夜自动重启逻辑 ==========
let midnightCheckInterval = null;

// 开始午夜检查
function startMidnightCheck() {
  // 如果已经在检查，先清除
  if (midnightCheckInterval) {
    clearInterval(midnightCheckInterval);
  }
  
  // 每30秒检查一次是否跨日
  midnightCheckInterval = setInterval(() => {
    checkMidnightCrossover();
  }, 30000); // 30秒检查一次
}

// 停止午夜检查
function stopMidnightCheck() {
  if (midnightCheckInterval) {
    clearInterval(midnightCheckInterval);
    midnightCheckInterval = null;
  }
}

// 检查是否跨越午夜0点
async function checkMidnightCrossover() {
  if (!timerState.isRunning || !startDate) {
    return;
  }
  
  const currentDate = new Date().toISOString().split('T')[0];
  
  // 如果日期已经变化，说明跨越了午夜0点
  if (currentDate !== startDate) {
    console.log('检测到跨日，自动结束并重新开始计时');
    
    // 1. 先停止当前计时并保存记录
    if (timerState.isRunning) {
      const totalSeconds = Math.floor((Date.now() - timerState.startTime) / 1000);
      timerState.isRunning = false;
      timerState.startTime = null;
      timerState.elapsedSeconds = 0;
      
      // 保存学习记录（如果超过60秒）
      if (totalSeconds >= 60) {
        await saveStudySession(totalSeconds);
      }
    }
    
    // 2. 立即重新开始计时
    timerState.isRunning = true;
    timerState.startTime = Date.now();
    startDate = currentDate; // 更新为新的日期
    saveTimerState();
    
    // 3. 通知所有打开的页面更新状态
    chrome.runtime.sendMessage({ 
      action: 'midnightRestart',
      newDate: currentDate 
    }).catch(() => {
      // 如果没有页面在监听，忽略错误
    });
  }
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
        startDate = new Date().toISOString().split('T')[0]; // 记录开始日期
        saveTimerState();
        startMidnightCheck(); // 启动午夜检查
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
        startDate = null; // 清除开始日期
        stopMidnightCheck(); // 停止午夜检查
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
  const endTime = new Date();
  const startTime = new Date(endTime - duration * 1000);
  
  // 计算凌晨4点的时间点（结束时间那天的凌晨4点）
  const fourAM = new Date(endTime);
  fourAM.setHours(4, 0, 0, 0);
  
  // 如果结束时间小于凌晨4点，说明凌晨4点应该是前一天的
  if (endTime.getHours() < 4) {
    fourAM.setDate(fourAM.getDate() - 1);
  }
  
  // 凌晨2点的时间点（与凌晨4点同一天）
  const twoAM = new Date(fourAM);
  twoAM.setHours(2, 0, 0, 0);
  
  let actualEndTime = endTime;
  let actualDuration = duration;
  
  // 检查是否跨越了凌晨4点：开始时间 < 凌晨4点 <= 结束时间
  if (startTime < fourAM && endTime >= fourAM) {
    // 跨越了凌晨4点，强制在凌晨1:59:59结束（算作前一天）
    const cutoffTime = new Date(twoAM);
    cutoffTime.setSeconds(-1); // 设置为01:59:59
    actualEndTime = cutoffTime;
    actualDuration = Math.floor((cutoffTime - startTime) / 1000);
    
    // 如果调整后的时长小于60秒或为负数，不记录
    if (actualDuration < 60) {
      return;
    }
  }
  
  // 使用实际结束时间所在的日期作为记录日期
  const dateKey = actualEndTime.toISOString().split('T')[0];
  
  const result = await chrome.storage.local.get(['studyRecords']);
  const records = result.studyRecords || {};
  
  if (!records[dateKey]) {
    records[dateKey] = {
      date: dateKey,
      sessions: [],
      totalSeconds: 0
    };
  }
  
  records[dateKey].sessions.push({
    start: startTime.toLocaleTimeString('zh-CN'),
    end: actualEndTime.toLocaleTimeString('zh-CN'),
    duration: actualDuration
  });
  records[dateKey].totalSeconds += actualDuration;
  
  await chrome.storage.local.set({ studyRecords: records });
}

// 获取学习统计数据
async function getStudyStats() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
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
  const monday = new Date(today);  // 创建新对象，避免修改原对象
  monday.setDate(diff);
  return monday.toISOString().split('T')[0];
}

// 清零当天的记录
async function resetTodayRecords() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
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