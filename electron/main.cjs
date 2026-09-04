const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const { clampBoundsIntoDisplay } = require('./lib/bounds.cjs')

const DEV_URL = process.env.VITE_DEV_SERVER_URL
const DIST_INDEX = path.join(__dirname, '..', 'dist', 'index.html')
const ASSETS_DIR = path.join(__dirname, '..', 'assets')

const WIDGET_WIDTH = 328
const WIDGET_HEIGHT = 146

/** 关窗即隐藏进托盘；只有托盘「退出」/ before-quit 才真正结束 */
let quitting = false
let widget = null
let settingsWin = null
let tray = null

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', showWidget)
  app.whenReady().then(() => {
    createWidget()
    createTray()
    registerIpc()
  })
}

app.on('before-quit', () => {
  quitting = true
})

/* ---------------- 悬浮窗 ---------------- */

function loadPage(win, hash) {
  if (DEV_URL) return win.loadURL(`${DEV_URL}#${hash}`)
  return win.loadFile(DIST_INDEX, { hash })
}

function defaultPosition(workArea) {
  return {
    width: WIDGET_WIDTH,
    height: WIDGET_HEIGHT,
    x: workArea.x + workArea.width - WIDGET_WIDTH - 24,
    y: workArea.y + workArea.height - WIDGET_HEIGHT - 24,
  }
}

function boundsFile() {
  return path.join(app.getPath('userData'), 'widget-window.json')
}

function restoreBounds() {
  try {
    const parsed = JSON.parse(fs.readFileSync(boundsFile(), 'utf8'))
    if (
      typeof parsed.x === 'number' &&
      typeof parsed.y === 'number' &&
      parsed.width > 0 &&
      parsed.height > 0
    ) {
      const workArea = screen.getDisplayMatching(parsed).workArea
      return clampBoundsIntoDisplay(parsed, workArea)
    }
  } catch {
    // 没有存档或坏了 → 用默认位置
  }
  return null
}

function saveBounds() {
  if (!widget || widget.isDestroyed()) return
  try {
    fs.writeFileSync(boundsFile(), JSON.stringify(widget.getBounds()))
  } catch {
    // 写不进去也不影响运行
  }
}

function createWidget() {
  const bounds = restoreBounds() ?? defaultPosition(screen.getPrimaryDisplay().workArea)
  widget = new BrowserWindow({
    ...bounds,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  widget.setAlwaysOnTop(true, 'screen-saver')
  widget.once('ready-to-show', () => widget.show())

  // 拖动过程 moved 会连发，防抖落盘
  let saveTimer
  widget.on('moved', () => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(saveBounds, 400)
  })
  widget.on('close', (e) => {
    saveBounds()
    if (!quitting) {
      e.preventDefault()
      widget.hide()
    }
  })
  widget.on('closed', () => {
    widget = null
  })

  loadPage(widget, 'widget')
}

function showWidget() {
  if (!widget) return
  if (!widget.isVisible()) widget.show()
  widget.focus()
}

function toggleWidget() {
  if (!widget) return
  if (widget.isVisible()) widget.hide()
  else showWidget()
}

/* ---------------- 设置窗口 ---------------- */

function openSettings() {
  if (settingsWin && !settingsWin.isDestroyed()) {
    settingsWin.show()
    settingsWin.focus()
    return
  }
  settingsWin = new BrowserWindow({
    width: 420,
    height: 640,
    autoHideMenuBar: true,
    title: '薪资跳动 · 设置',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  settingsWin.on('closed', () => {
    settingsWin = null
  })
  loadPage(settingsWin, 'settings')
}

/* ---------------- 托盘 ---------------- */

function createTray() {
  const icon = nativeImage.createFromPath(path.join(ASSETS_DIR, 'tray.png'))
  tray = new Tray(icon)
  tray.setToolTip('薪资跳动')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: '显示 / 隐藏悬浮窗', click: toggleWidget },
      { type: 'separator' },
      { label: '设置…', click: openSettings },
      {
        label: '开机自启',
        type: 'checkbox',
        checked: app.getLoginItemSettings().openAtLogin,
        click: (item) => app.setLoginItemSettings({ openAtLogin: item.checked }),
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          quitting = true
          app.quit()
        },
      },
    ]),
  )
  tray.on('click', toggleWidget)
}

/* ---------------- IPC ---------------- */

function registerIpc() {
  ipcMain.on('widget:open-settings', openSettings)
  ipcMain.on('app:quit', () => {
    quitting = true
    app.quit()
  })
  // 配置变更：广播给除发送者外的所有窗口（悬浮窗收到后重读 localStorage）
  ipcMain.on('config:changed', (e) => {
    for (const win of BrowserWindow.getAllWindows()) {
      if (win.webContents !== e.sender) win.webContents.send('config:changed')
    }
  })
}
