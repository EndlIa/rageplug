// ========== 标题模块 ==========

const Title = {
  // DOM 元素
  headerElement: null,
  editModal: null,
  startSentencesInput: null,
  endSentencesInput: null,
  saveSentencesBtn: null,
  cancelEditBtn: null,
  exportDataBtn: null,
  importDataBtn: null,
  
  // 初始化
  init(headerEl) {
    this.headerElement = headerEl;
    this.editModal = document.getElementById('editModal');
    this.startSentencesInput = document.getElementById('startSentencesInput');
    this.endSentencesInput = document.getElementById('endSentencesInput');
    this.saveSentencesBtn = document.getElementById('saveSentencesBtn');
    this.cancelEditBtn = document.getElementById('cancelEditBtn');
    this.exportDataBtn = document.getElementById('exportDataBtn');
    this.importDataBtn = document.getElementById('importDataBtn');
    
    // 绑定双击事件
    this.headerElement.addEventListener('dblclick', () => this.openEditModal());
    
    // 绑定按钮事件
    this.saveSentencesBtn.addEventListener('click', () => this.saveSentences());
    this.cancelEditBtn.addEventListener('click', () => this.closeEditModal());
    this.exportDataBtn.addEventListener('click', () => this.exportData());
    this.importDataBtn.addEventListener('click', () => this.importData());
    
    // 点击弹窗外部关闭
    this.editModal.addEventListener('click', (e) => {
      if (e.target === this.editModal) {
        this.closeEditModal();
      }
    });
  },
  
  // 打开编辑弹窗
  openEditModal() {
    // 加载当前句子库到输入框
    this.startSentencesInput.value = CONFIG.startSentences.join('\n');
    this.endSentencesInput.value = CONFIG.endSentences.join('\n');
    
    // 显示弹窗
    this.editModal.classList.add('show');
  },
  
  // 关闭编辑弹窗
  closeEditModal() {
    this.editModal.classList.remove('show');
  },
  
  // 保存句子库
  async saveSentences() {
    // 获取输入的句子，过滤空行
    const startSentences = this.startSentencesInput.value
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    const endSentences = this.endSentencesInput.value
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    // 验证至少有一个句子
    if (startSentences.length === 0) {
      return;
    }
    
    if (endSentences.length === 0) {
      return;
    }
    
    // 保存到配置
    await CONFIG.saveCustomSentences(startSentences, endSentences);
    
    // 关闭弹窗
    this.closeEditModal();
  },
  
  // 显示开始时的句子
  showStart() {
    if (this.headerElement) {
      const sentence = getRandomItem(CONFIG.startSentences);
      this.headerElement.textContent = sentence;
    }
  },
  
  // 显示结束时的句子
  showEnd() {
    if (this.headerElement) {
      const sentence = getRandomItem(CONFIG.endSentences);
      this.headerElement.textContent = sentence;
    }
  },
  
  // 恢复原始标题
  restore() {
    if (this.headerElement) {
      this.headerElement.textContent = CONFIG.originalTitle;
    }
  },
  
  // 导出数据
  async exportData() {
    await DataManager.exportData();
  },
  
  // 导入数据
  async importData() {
    const result = await DataManager.promptImport();
    if (result.needReload) {
      // 关闭弹窗并刷新页面
      this.closeEditModal();
      setTimeout(() => {
        location.reload();
      }, 500);
    }
  }
};
