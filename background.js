chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['darkMode', 'blocklist', 'whitelist'], (result) => {
    const defaults = {};
    if (result.darkMode === undefined) defaults.darkMode = false;
    if (result.blocklist === undefined) defaults.blocklist = [];
    if (result.whitelist === undefined) defaults.whitelist = [];
    if (Object.keys(defaults).length > 0) {
      chrome.storage.sync.set(defaults);
    }
  });
});
