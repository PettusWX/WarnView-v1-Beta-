const { contextBridge, ipcRenderer } = require('electron');

// Expose APIs to the renderer process
contextBridge.exposeInMainWorld('api', {
  startStream: (slotId, streamUrl) => ipcRenderer.invoke('start-stream', slotId, streamUrl),
});
