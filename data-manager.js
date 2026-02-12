// ========== 数据管理模块 ==========

const DataManager = {
  // 导出数据为 JSON 文件
  async exportData() {
    try {
      // 获取插件版本
      const manifest = chrome.runtime.getManifest();
      const pluginVersion = manifest.version;
      
      // 获取所有需要备份的数据
      const result = await chrome.storage.local.get(['studyRecords', 'customSentences']);
      
      // 构建导出数据结构
      const exportData = {
        version: pluginVersion,
        exportDate: new Date().toISOString(),
        data: {
          studyRecords: result.studyRecords || {},
          customSentences: result.customSentences || {
            startSentences: CONFIG.startSentences,
            endSentences: CONFIG.endSentences
          }
        },
        metadata: {
          totalDays: Object.keys(result.studyRecords || {}).length,
          totalSeconds: this.calculateTotalSeconds(result.studyRecords || {}),
          heatmapStartDate: CONFIG.heatmapStartDate
        }
      };
      
      // 转换为 JSON 字符串
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // 创建 Blob 对象
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rageplug-backup-${formatDateString()}.json`;
      
      // 触发下载
      document.body.appendChild(a);
      a.click();
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      return { success: true, message: '数据导出成功！' };
    } catch (error) {
      console.error('导出数据失败:', error);
      return { success: false, message: '数据导出失败: ' + error.message };
    }
  },
  
  // 导入数据从 JSON 文件
  async importData(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          // 解析 JSON 数据
          const importData = JSON.parse(e.target.result);
          
          // 验证数据结构
          if (!this.validateImportData(importData)) {
            resolve({ success: false, message: '无效的备份文件格式' });
            return;
          }
          
          // 直接导入数据
          
          // 保存数据到 storage
          await chrome.storage.local.set({
            studyRecords: importData.data.studyRecords,
            customSentences: importData.data.customSentences
          });
          
          // 重新加载配置
          await CONFIG.loadCustomSentences();
          
          resolve({ 
            success: true, 
            message: '数据导入成功！页面将刷新以应用更改。',
            needReload: true
          });
        } catch (error) {
          console.error('导入数据失败:', error);
          resolve({ success: false, message: '数据导入失败: ' + error.message });
        }
      };
      
      reader.onerror = () => {
        resolve({ success: false, message: '文件读取失败' });
      };
      
      reader.readAsText(file);
    });
  },
  
  // 验证导入数据的格式
  validateImportData(data) {
    if (!data || typeof data !== 'object') return false;
    if (!data.version || !data.exportDate) return false;
    if (!data.data || typeof data.data !== 'object') return false;
    if (!data.data.studyRecords || typeof data.data.studyRecords !== 'object') return false;
    return true;
  },
  
  // 计算总学习时长
  calculateTotalSeconds(studyRecords) {
    let total = 0;
    for (const date in studyRecords) {
      total += studyRecords[date].totalSeconds || 0;
    }
    return total;
  },
  
  // 显示文件选择器并导入
  async promptImport() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          const result = await this.importData(file);
          resolve(result);
        } else {
          resolve({ success: false, message: '未选择文件' });
        }
      };
      
      input.oncancel = () => {
        resolve({ success: false, message: '导入已取消' });
      };
      
      input.click();
    });
  }
};
