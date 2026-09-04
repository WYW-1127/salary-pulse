const { contextBridge, ipcRenderer } = require('electron')

/**
 * 渲染层通过 window.salaryNative 使用；纯浏览器没有它（src/lib/native.d.ts 声明为可选）。
 */
contextBridge.exposeInMainWorld('salaryNative', {
  openSettings: () => ipcRenderer.send('widget:open-settings'),
  notifyConfigChanged: () => ipcRenderer.send('config:changed'),
  onConfigChanged: (cb) => {
    const handler = () => cb()
    ipcRenderer.on('config:changed', handler)
    return () => ipcRenderer.removeListener('config:changed', handler)
  },
})
