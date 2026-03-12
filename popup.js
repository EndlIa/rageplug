(() => {
  'use strict';

  const blockStrengthSlider = document.getElementById('blockStrength');
  const strengthValueSpan = document.getElementById('strengthValue');
  const themeToggle = document.getElementById('themeToggle');

  // shared factory for blocklist / whitelist UI
  function makeListManager({ inputId, addBtnId, listId, emptyId, storageKey }) {
    const input   = document.getElementById(inputId);
    const addBtn  = document.getElementById(addBtnId);
    const listEl  = document.getElementById(listId);
    const emptyEl = document.getElementById(emptyId);
    let items = [];

    function render() {
      listEl.innerHTML = '';
      emptyEl.style.display = items.length === 0 ? 'block' : 'none';
      items.forEach((word, i) => {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.className = 'word';
        span.textContent = word;
        const btn = document.createElement('button');
        btn.className = 'remove-btn';
        btn.textContent = '×';
        btn.onclick = () => remove(i);
        li.append(span, btn);
        listEl.appendChild(li);
      });
    }

    function add() {
      const word = input.value.trim();
      if (!word || items.some(w => w.toLowerCase() === word.toLowerCase())) {
        input.value = '';
        return;
      }
      items.push(word);
      chrome.storage.sync.set({ [storageKey]: items });
      input.value = '';
      render();
    }

    function remove(i) {
      items.splice(i, 1);
      chrome.storage.sync.set({ [storageKey]: items });
      render();
    }

    addBtn.addEventListener('click', add);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });

    return { init: saved => { items = Array.isArray(saved) ? saved : []; render(); } };
  }

  const blockMgr = makeListManager({
    inputId: 'blockWord', addBtnId: 'addWord',
    listId: 'blocklistItems', emptyId: 'emptyTip',
    storageKey: 'blocklist'
  });

  const whiteMgr = makeListManager({
    inputId: 'whiteWord', addBtnId: 'addWhiteWord',
    listId: 'whitelistItems', emptyId: 'emptyWhiteTip',
    storageKey: 'whitelist'
  });

  blockStrengthSlider.addEventListener('input', () => {
    const value = parseInt(blockStrengthSlider.value);
    strengthValueSpan.textContent = value + '%';
    chrome.storage.sync.set({ blockStrength: value });
  });

  // 暗色模式切换
  themeToggle.addEventListener('change', () => {
    const isDark = themeToggle.checked;
    const theme = isDark ? 'dark' : 'light';
    
    chrome.storage.sync.set({ theme: theme });
    
    // 获取当前活动标签页并修改URL
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]) {
        const url = new URL(tabs[0].url);
        url.searchParams.set('theme', theme);
        chrome.tabs.update(tabs[0].id, { url: url.toString() });
      }
    });
  });

  chrome.storage.sync.get(['blocklist', 'whitelist', 'blockStrength', 'theme'], result => {
    const strength = typeof result.blockStrength === 'number' ? result.blockStrength : 100;
    blockStrengthSlider.value = strength;
    strengthValueSpan.textContent = strength + '%';
    blockMgr.init(result.blocklist);
    whiteMgr.init(result.whitelist);
    
    // 设置暗色模式开关状态
    const theme = result.theme || 'light';
    themeToggle.checked = theme === 'dark';
  });
})();

