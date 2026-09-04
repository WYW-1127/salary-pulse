/**
 * Electron 冒烟验证：加载构建产物的悬浮窗与设置窗形态，各截一张图到
 * .impeccable/review/（gitignore）。先 npm run build 再跑：
 *   npx electron scripts/smoke.cjs
 */
const { app, BrowserWindow } = require('electron')
const path = require('node:path')
const fs = require('node:fs')

const OUT = path.join(__dirname, '..', '.impeccable', 'review')
const INDEX = path.join(__dirname, '..', 'dist', 'index.html')
const CONFIG = {
  payMode: 'monthly',
  amount: 12000,
  workStart: '09:00',
  lunchStart: '12:00',
  lunchEnd: '13:00',
  workEnd: '18:30',
  overtimeRate: 1.5,
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

// 兜底：任何一步卡住也必须在 40s 内退出
const killer = setTimeout(() => {
  console.error('[smoke] 超时未完成，强制退出')
  app.exit(1)
}, 40000)
killer.unref()

const log = (m) => console.error(`[smoke] ${m}`)

app.whenReady().then(async () => {
  fs.mkdirSync(OUT, { recursive: true })

  const widget = new BrowserWindow({
    width: 328,
    height: 146,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: { preload: path.join(__dirname, '..', 'electron', 'preload.cjs') },
  })
  log('加载悬浮窗')
  await widget.loadFile(INDEX, { hash: 'widget' })
  // 预置配置：冒烟要看到滚轮在转，不是未设置引导
  await widget.webContents.executeJavaScript(
    `localStorage.setItem('salary-pulse.config.v1', ${JSON.stringify(JSON.stringify(CONFIG))})`,
  )
  await widget.webContents.reload()
  await delay(2600) // 让滚轮先跳几拍
  log('截悬浮窗')
  fs.writeFileSync(
    path.join(OUT, 'widget-smoke.png'),
    (await widget.webContents.capturePage()).toPNG(),
  )

  log('加载设置窗')
  const settings = new BrowserWindow({
    width: 420,
    height: 640,
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, '..', 'electron', 'preload.cjs') },
  })
  settings.webContents.once('did-finish-load', () => log('设置窗 did-finish-load'))
  await settings.loadFile(INDEX, { hash: 'settings' })
  await delay(1200)
  log('截设置窗')
  fs.writeFileSync(
    path.join(OUT, 'settings-smoke.png'),
    (await settings.webContents.capturePage()).toPNG(),
  )

  log('完成，退出')
  app.exit(0)
})
