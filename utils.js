// ========== 工具函数 ==========

// 时间格式化：秒数 -> HH:MM:SS
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// 获取今日日期（YYYY-MM-DD）
function getTodayDate() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// 获取今日日期显示（周X M月D日）
function getTodayDateDisplay() {
  const today = new Date();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${weekdays[today.getDay()]} ${today.getMonth() + 1}月${today.getDate()}日`;
}

// 中文日期格式化
function formatDateChinese(dateStr) {
  const date = new Date(dateStr);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
}

// 获取本周开始日期（周一）
function getWeekStartDate() {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date.toISOString().split('T')[0];
}

// 从数组中随机获取一个元素
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}
