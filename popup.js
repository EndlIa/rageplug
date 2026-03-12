(() => {
  'use strict';

  const darkModeCheckbox = document.getElementById('darkMode');
  const blockStrengthSlider = document.getElementById('blockStrength');
  const strengthValueSpan = document.getElementById('strengthValue');

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

  darkModeCheckbox.addEventListener('change', () => {
    chrome.storage.sync.set({ darkMode: darkModeCheckbox.checked });
  });

  blockStrengthSlider.addEventListener('input', () => {
    const value = parseInt(blockStrengthSlider.value);
    strengthValueSpan.textContent = value + '%';
    chrome.storage.sync.set({ blockStrength: value });
  });

  chrome.storage.sync.get(['darkMode', 'blocklist', 'whitelist', 'blockStrength'], result => {
    darkModeCheckbox.checked = !!result.darkMode;
    const strength = typeof result.blockStrength === 'number' ? result.blockStrength : 100;
    blockStrengthSlider.value = strength;
    strengthValueSpan.textContent = strength + '%';
    blockMgr.init(result.blocklist);
    whiteMgr.init(result.whitelist);
  });
})();

