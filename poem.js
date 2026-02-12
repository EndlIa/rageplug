// 渲染诗词（减少DOM操作）
function renderPoem(poem) {
  const poemSection = document.getElementById('poemSection');
  poemSection.innerHTML = `<div class="poem-content">${poem.content}</div><div class="poem-info">—— ${poem.author}《${poem.origin}》</div>`;
}

// 加载今日诗词
async function loadPoem() {
  try {
    // 使用今日诗词 V2 接口（添加超时控制）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://v2.jinrishici.com/one.json', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    const data = await response.json();
    
    if (data.status === 'success' && data.data) {
      const poem = {
        content: data.data.content,
        author: data.data.origin.author,
        origin: data.data.origin.title
      };
      
      renderPoem(poem);
    } else {
      throw new Error('数据格式错误');
    }
  } catch (error) {
    // 加载失败时显示提示
    const poemSection = document.getElementById('poemSection');
    poemSection.innerHTML = '<div class="poem-loading">Poem unavailable</div>';
  }
}

// 页面加载时获取诗词
window.addEventListener('DOMContentLoaded', loadPoem);
