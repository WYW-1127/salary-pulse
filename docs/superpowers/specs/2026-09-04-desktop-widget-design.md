# 桌面悬浮窗（Electron）设计

> 2026-09-04。前置阅读：`HANDOFF.md`、`2026-09-02-salary-pulse-design.md`（网页本体）。

## 一、目标

给「薪资跳动」加一个**独立于浏览器的桌面悬浮窗**：开机常驻、始终置顶、
可拖到桌面任意位置，像机械计数器一样实时显示「今日已赚」。

用户已确认路线：**Electron 外壳**（否决了浏览器画中画——必须开着浏览器不算独立；
Tauri——本机无 Rust 工具链，装齐成本过高）。

## 二、窗口形态与行为

- **悬浮窗**：无边框（frame:false）、透明窗口 + CSS 圆角卡片，固定尺寸约
  320×140（不可缩放）。视觉完全沿用「工资表」令牌：暖白底、瓷白滚轮、
  朱红只给活跃态。卡片外围留少量透明边距容纳阴影。
  - 始终置顶（`setAlwaysOnTop(true, 'screen-saver')`），不占任务栏
    （skipTaskbar）。
  - 整卡可按住拖动（`-webkit-app-region: drag`），按钮区域 `no-drag`。
  - 位置持久化到 `userData/widget-window.json`，启动恢复；恢复时钳回
    最近显示器的工作区（纯函数 `clampBoundsIntoDisplay`，vitest 覆盖）。
  - 首次启动落在主屏工作区右下角。
- **关闭按钮 = 隐藏到托盘**，不退出。托盘菜单：
  显示/隐藏悬浮窗、设置…、开机自启（勾选）、退出。
  托盘图标单击 = 显示悬浮窗。
- **设置窗口**：420×640 标准窗口，复用 `SettingsView`（`canCancel=false`），
  保存后经 IPC 通知悬浮窗实时刷新并自动关闭。悬浮窗在未配置时显示
  「先设置」引导按钮。
- **单实例锁**：重复启动只唤起已有悬浮窗。

## 三、架构

```
electron/main.cjs      主进程：窗口/托盘/IPC/位置持久化/单实例（CommonJS，免构建）
electron/preload.cjs   contextBridge 暴露 window.salaryNative（纯浏览器下不存在）
electron/lib/bounds.cjs 纯函数 clampBoundsIntoDisplay（被 vitest 直接测试）
scripts/gen-icons.cjs  像素风「工资表」图标生成：托盘 16/32 PNG + 安装包 256 ICO
scripts/electron-dev.cjs 一条命令编排 vite dev + electron
src/components/WidgetView.vue  悬浮窗紧凑视图
src/composables/useEarnings.ts 从 App.vue 抽出的 共享计算逻辑（250ms 时钟、
                               状态、费率、今日已赚、倒计时），两视图共用
```

### 形态路由（无路由库，URL hash 区分）

| hash | 形态 | 行为 |
| --- | --- | --- |
| （空） | 网页主页 | 现行为**一字不变** |
| `#widget` | 悬浮窗紧凑视图 | 仅 Electron 使用；浏览器直接开也能看 |
| `#settings` | 独立设置窗 | 保存 → `salaryNative` 通知 + 关窗；无取消按钮 |

### IPC 协议（preload 桥接，单向 send 为主）

- renderer → main：`widget:open-settings`、`config:changed`、`app:quit`
- main → renderer：`config:changed` 广播（悬浮窗收到后重读 localStorage）

### 数据

- 配置仍走 `localStorage['salary-pulse.config.v1']`，现有
  `loadConfig/saveConfig` 不动；`saveConfig` 末尾加一句
  `window.salaryNative?.notifyConfigChanged()`（纯浏览器为 no-op）。
- 桌面端与浏览器端 localStorage 天然隔离（不同 origin），各配一次，接受。
- 位置文件：`userData/widget-window.json`（不进 localStorage，避免和配置耦合）。

### 不变量（不许破坏）

- `src/lib/calc/**` 纯函数计算引擎一行不改；
- 网页主页（默认形态）视觉与行为不变；
- 浅色主题、无 emoji、全中文、无 UI 组件库。

## 四、明确不做（YAGNI）

透明度调节、鼠标点击穿透、多主题/深色、配置导入导出、自动更新、
macOS/Linux 适配。

## 五、构建

- `vite.config.ts` 加 `base: './'`（Electron `loadFile` 走 file:// 必需）。
- devDependencies 新增：`electron`、`electron-builder`；`.npmrc` 配
  npmmirror 镜像（electron 二进制与 builder binaries）。
- `package.json`：`"main": "electron/main.cjs"`；
  `electron:dev`（编排脚本）、`dist:win`（build + NSIS 安装包，
  产物在 `release/`，gitignore）。NSIS 选 oneClick + 桌面快捷方式，
  开机自启用 `app.setLoginItemSettings`（安装版路径可用）。

## 六、测试

- 纯函数：`clampBoundsIntoDisplay` 边界用例（正常还原、越界钳回、
  尺寸大于工作区、负坐标）。
- 回归：现有 30 个 vitest、`vue-tsc --noEmit`、`vite build` 全过。
- Electron 冒烟：`electron scripts/smoke.cjs` 启动真实窗口 → `capturePage`
  截图（存 gitignore 的 `.impeccable/review/`）→ 人工核对视觉。
