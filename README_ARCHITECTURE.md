# RagePlug 代码架构说明

## 文件结构

```
rageplug/
├── rageplug.html        # 主页面 HTML 和 CSS
├── background.js        # 后台服务 (URL拦截、计时器后台管理)
├── manifest.json        # Chrome 扩展配置文件
│
├── config.js            # 配置文件 (句子库、常量)
├── utils.js             # 工具函数 (时间格式化、日期计算)
├── timer.js             # 计时器模块
├── stats.js             # 统计数据模块
├── heatmap.js           # 热力图模块
├── title.js             # 标题切换模块
├── poem.js              # 诗词加载模块
└── main.js              # 主入口 (初始化所有模块)
```

## 模块职责

### 1. config.js - 配置管理
- 存储句子库（开始/结束时显示的句子）
- 存储应用常量（原始标题、热力图起始日期等）

### 2. utils.js - 工具函数
- `formatTime()` - 时间格式化
- `getTodayDate()` - 获取今日日期
- `getTodayDateDisplay()` - 获取今日日期显示格式
- `formatDateChinese()` - 中文日期格式化
- `getWeekStartDate()` - 获取本周起始日期
- `getRandomItem()` - 随机获取数组元素

### 3. timer.js - 计时器核心
**职责：** 计时器状态管理和显示
- 计时器启动/停止
- 实时显示更新
- 与 background.js 状态同步
- 页面可见性处理

### 4. stats.js - 统计数据
**职责：** 学习统计数据的加载和显示
- 今日学习时长统计
- 本周学习时长统计
- 日期显示更新
- 重置今日记录

### 5. heatmap.js - 热力图
**职责：** 学习活动热力图的生成和交互
- 热力图数据计算
- 热力图渲染
- Tooltip 显示/隐藏

### 6. title.js - 标题切换
**职责：** 页面标题的动态切换
- 开始时显示随机句子
- 结束时显示随机句子
- 恢复原始标题

### 7. poem.js - 诗词加载
**职责：** 从 API 加载每日诗词
- 调用今日诗词 API
- 渲染诗词内容
- 错误处理

### 8. main.js - 主入口
**职责：** 应用初始化和模块协调
- 初始化所有模块
- 传递 DOM 元素引用
- 协调模块间调用

### 9. background.js - 后台服务
**职责：** Chrome 扩展后台功能
- URL 拦截和重定向
- 计时器后台状态管理
- 学习记录存储
- Omnibox 集成

## 模块间通信

```
main.js (初始化)
  ├─> Timer.init()
  ├─> Stats.init()
  ├─> Heatmap.init()
  └─> Title.init()

Timer (计时器)
  ├─> Title.showStart() / Title.showEnd()  # 更新标题
  ├─> Stats.load()                          # 更新统计
  └─> Heatmap.generate()                    # 更新热力图

Stats (统计)
  └─> Heatmap.generate()                    # 重置时更新热力图

所有模块
  └─> background.js                         # Chrome API 通信
```

## 数据流

1. **计时开始：**
   - 用户点击 Begin → Timer.start()
   - Title.showStart() 显示随机开始句子
   - 发送消息到 background.js 启动计时
   - 从 background.js 同步状态

2. **计时结束：**
   - 用户点击 End → Timer.stop()
   - Title.showEnd() 显示随机结束句子
   - 发送消息到 background.js 停止并保存记录
   - Stats.load() 更新统计数据
   - Heatmap.generate() 更新热力图

3. **页面加载：**
   - main.js 初始化所有模块
   - Timer 同步后台状态
   - Stats 加载统计数据
   - Heatmap 生成热力图
   - Poem 加载今日诗词
