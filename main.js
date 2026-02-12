// ========== 主入口 ==========

document.addEventListener('DOMContentLoaded', async () => {
  // 加载自定义句子库
  await CONFIG.loadCustomSentences();
  
  // 初始化标题模块
  Title.init(document.querySelector('.header'));
  
  // 初始化计时器模块
  Timer.init(
    document.getElementById('timer'),
    document.getElementById('startBtn'),
    document.getElementById('stopBtn')
  );
  
  // 初始化统计模块
  Stats.init(
    document.getElementById('todayTotal'),
    document.getElementById('weekTotal'),
    document.getElementById('todayDate'),
    document.getElementById('resetBtn')
  );
  
  // 初始化热力图模块
  Heatmap.init(
    document.getElementById('heatmapGrid'),
    document.getElementById('heatmapMonths')
  );
});
