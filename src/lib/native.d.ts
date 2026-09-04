/**
 * Electron preload（electron/preload.cjs）注入的原生桥接。
 * 纯浏览器环境下不存在（undefined），所有调用点都用可选链。
 */
export {}

declare global {
  interface Window {
    salaryNative?: {
      openSettings(): void
      notifyConfigChanged(): void
      /** 监听其他窗口的配置变更广播，返回取消监听函数 */
      onConfigChanged(cb: () => void): () => void
    }
  }
}
