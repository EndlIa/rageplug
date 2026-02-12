// 诗词模块
const Poem = {
  poemSection: null,
  
  // 初始化
  init() {
    this.poemSection = document.getElementById('poemSection');
    this.load();
  },
  
  // 渲染诗词
  render(poem) {
    this.poemSection.innerHTML = `<div class="poem-content">${poem.content}</div><div class="poem-info">—— ${poem.author}《${poem.origin}》</div>`;
  },
  
  // 加载今日诗词
  async load() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://v2.jinrishici.com/one.json', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      if (data.status === 'success' && data.data) {
        this.render({
          content: data.data.content,
          author: data.data.origin.author,
          origin: data.data.origin.title
        });
      } else {
        throw new Error('数据格式错误');
      }
    } catch (error) {
      this.poemSection.innerHTML = '<div class="poem-loading">Poem unavailable</div>';
    }
  }
};

// 页面加载时获取诗词
window.addEventListener('DOMContentLoaded', () => Poem.init());
