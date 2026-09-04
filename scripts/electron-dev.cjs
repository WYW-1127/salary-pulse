/** 一条命令起开发环境：vite dev server + electron（加载 dev URL）。Ctrl+C 一起退。 */
const { spawn } = require('node:child_process')
const http = require('node:http')
const path = require('node:path')

const ROOT = path.join(__dirname, '..')
const PORT = 5178
const URL = `http://localhost:${PORT}`

const vite = spawn(
  process.execPath,
 [
    path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'),
    '--port',
    String(PORT),
    '--strictPort',
  ],
  { cwd: ROOT, stdio: 'inherit' },
)

function waitForServer(timeoutMs = 30000) {
  const started = Date.now()
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(URL, (res) => {
        res.resume()
        resolve()
      })
      req.on('error', () => {
        if (Date.now() - started > timeoutMs) reject(new Error('vite dev server 启动超时'))
        else setTimeout(tick, 300)
      })
    }
    tick()
  })
}

waitForServer()
  .then(() => {
    const elec = spawn(path.join(ROOT, 'node_modules', 'electron', 'dist', 'electron.exe'), ['.'], {
      cwd: ROOT,
      stdio: 'inherit',
      env: { ...process.env, VITE_DEV_SERVER_URL: URL },
    })
    elec.on('exit', () => {
      vite.kill()
      process.exit(0)
    })
  })
  .catch((err) => {
    console.error(err.message)
    vite.kill()
    process.exit(1)
  })

process.on('SIGINT', () => {
  vite.kill()
  process.exit(0)
})
