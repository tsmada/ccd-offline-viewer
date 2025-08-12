const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  saveFileDialog: (defaultName, filters) => ipcRenderer.invoke('save-file-dialog', defaultName, filters),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  
  // XML parsing (delegated to main process)
  parseXML: (xmlContent) => ipcRenderer.invoke('parse-xml', xmlContent),
  
  // PDF export
  exportPDF: (filename, documentData) => ipcRenderer.invoke('export-pdf', filename, documentData),

  // Menu events - individual handlers
  onMenuOpenFile: (callback) => {
    ipcRenderer.on('menu-open-file', callback);
  },
  onMenuSavePdf: (callback) => {
    ipcRenderer.on('menu-save-pdf', callback);
  },
  onMenuExportJson: (callback) => {
    ipcRenderer.on('menu-export-json', callback);
  },
  onMenuExportCsv: (callback) => {
    ipcRenderer.on('menu-export-csv', callback);
  },
  onMenuTheme: (callback) => {
    ipcRenderer.on('menu-theme', callback);
  },

  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('menu-open-file');
    ipcRenderer.removeAllListeners('menu-save-pdf');
    ipcRenderer.removeAllListeners('menu-export-json');
    ipcRenderer.removeAllListeners('menu-export-csv');
    ipcRenderer.removeAllListeners('menu-theme');
  }
});