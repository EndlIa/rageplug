(() => {
  'use strict';

  let blocklist = [];
  let whitelist = [];
  let blockStrength = 100;

  const FEED_SEL = '.TopstoryItem, .Feed-item, .List-item, .ContentItem, .AnswerItem, .Card, .SearchResult-Card';
  const STRUCTURAL_SEL = '#root > div > div:has(> header) > header > div > div > div > div:last-child';

  function isZhihuHomepage() {
    const pathname = window.location.pathname;
    return pathname === '/' || pathname === '';
  }

  function setDarkMode(enabled) {
    document.documentElement.classList.toggle('zhihu-clean-dark', enabled);
  }

  function shouldBlock(text) {
    if (!blocklist.length) return false;
    const lower = text.toLowerCase();
    if (!blocklist.some(w => lower.includes(w.toLowerCase()))) return false;
    if (whitelist.some(w => lower.includes(w.toLowerCase()))) return false;
    
    // 根据屏蔽强度决定是否屏蔽
    return Math.random() * 100 < blockStrength;
  }

  function applyBlocklist(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return;
    if (!isZhihuHomepage()) return;
    node.classList.toggle('zhihu-clean-blocked', shouldBlock((node.textContent || '').trim()));
  }

  function scanAllCards() {
    if (!isZhihuHomepage()) return;
    document.querySelectorAll(FEED_SEL).forEach(applyBlocklist);
  }

  function hideYanxuan(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return;
    if (/盐选/.test(node.textContent)) {
      const card = node.closest(FEED_SEL);
      if (card) card.style.display = 'none';
    }
  }

  function hideStructuralElements() {
    const el = document.querySelector(STRUCTURAL_SEL);
    if (el && el.style.display !== 'none') {
      el.style.setProperty('display', 'none', 'important');
    }
  }

  function hideSearchDiscovery(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return;
    for (const el of node.querySelectorAll('*')) {
      const directText = Array.from(el.childNodes)
        .filter(n => n.nodeType === Node.TEXT_NODE)
        .map(n => n.textContent.trim()).join('');
      if (directText === '搜索发现') {
        const section = el.parentElement?.parentElement ?? el.parentElement;
        if (section) section.style.setProperty('display', 'none', 'important');
        break;
      }
    }
  }

  function setupObserver() {
    const observer = new MutationObserver(mutations => {
      for (const { addedNodes } of mutations) {
        for (const node of addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;

          if (isZhihuHomepage()) {
            if (node.matches?.(FEED_SEL)) {
              applyBlocklist(node);
              hideYanxuan(node);
            }
            node.querySelectorAll(FEED_SEL).forEach(card => {
              applyBlocklist(card);
              hideYanxuan(card);
            });
          }
          
          hideSearchDiscovery(node);
          hideStructuralElements();
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function init() {
    chrome.storage.sync.get(['darkMode', 'blocklist', 'whitelist', 'blockStrength'], result => {
      setDarkMode(!!result.darkMode);
      blocklist = Array.isArray(result.blocklist) ? result.blocklist : [];
      whitelist = Array.isArray(result.whitelist) ? result.whitelist : [];
      blockStrength = typeof result.blockStrength === 'number' ? result.blockStrength : 100;
      const run = () => { scanAllCards(); hideStructuralElements(); };
      document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', run)
        : run();
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync') return;
      if (changes.darkMode) setDarkMode(!!changes.darkMode.newValue);
      if (changes.blocklist) {
        blocklist = Array.isArray(changes.blocklist.newValue) ? changes.blocklist.newValue : [];
        scanAllCards();
      }
      if (changes.whitelist) {
        whitelist = Array.isArray(changes.whitelist.newValue) ? changes.whitelist.newValue : [];
        scanAllCards();
      }
      if (changes.blockStrength) {
        blockStrength = typeof changes.blockStrength.newValue === 'number' ? changes.blockStrength.newValue : 100;
        scanAllCards();
      }
    });

    setupObserver();
  }

  init();
})();

