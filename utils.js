// ========== 工具函数 ==========

// 常量
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

// 时间格式化：秒数 -> HH:MM:SS
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// 获取今日日期（YYYY-MM-DD）
function getTodayDate() {
  return formatDateString();
}

// 格式化日期为字符串（YYYY-MM-DD）
function formatDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 获取今日日期显示（周X M月D日）
function getTodayDateDisplay() {
  const today = new Date();
  return `${WEEKDAYS[today.getDay()]} ${today.getMonth() + 1}月${today.getDate()}日`;
}

// 中文日期格式化
function formatDateChinese(dateStr) {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${WEEKDAYS[date.getDay()]}`;
}

// 获取本周开始日期（周一）
function getWeekStartDate() {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return formatDateString(date);
}

// 从数组中随机获取一个元素
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}
