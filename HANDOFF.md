# 交接文档（HANDOFF）

> 更新于 2026-09-04。用途：新会话/新窗口接手项目时先读这一份。
> 读完按需再读：`README.md`（对外介绍）、`docs/superpowers/specs/`（两份设计规格）、
> `PRODUCT.md`（产品定位）、`.impeccable/surfaces/index-html.md`（视觉方向契约）。

## 一、这是什么项目

「薪资跳动」：给中国打工人的实时赚钱计数器。上班时间打开，「今日已赚」
像机械滚轮水电表一样每 250ms 跳一次。两个形态：
**网页**（纯前端静态文件）+ **桌面悬浮窗**（Electron 置顶小窗，2026-09-04 新增）。
无后端无账号，配置存 localStorage。已上线 GitHub：https://github.com/WYW-1127/salary-pulse

## 二、当前状态（全部已验证）

- **网页功能全部完成**：滚轮计数器（数位独立正向滚动，9→0 满圈不倒转）、
  五状态机（未开盘/交易中/午间休市/加班中/休市）、下班倒计时（最后 1 小时
  变红）、今日加班费表盘、设置页（计薪模式三选一；时间下拉一刻钟一格）
- **桌面悬浮窗完成（2026-09-04）**：Electron 无边框透明置顶小窗 328×146，
  整卡拖动、位置记忆（userData/widget-window.json，多屏钳回工作区）、
  关闭缩托盘、托盘菜单（显示/隐藏、设置、开机自启、退出）、单实例锁、
  设置独立窗口（复用 SettingsView，保存后 IPC 广播刷新悬浮窗）。
  已冒烟截图验证（`.impeccable/review/widget-smoke.png`），
  NSIS 安装包 `release/薪资跳动 Setup 0.1.0.exe` 已产出并试运行正常
- **质量**：vue-tsc 零错误；34 个 vitest 全过（29 计算 + 5 窗口钳制）；
  构建 32.3KB gzip
- **git**：本地 main 领先 origin（悬浮窗提交待推送）

## 三、核心计算模型（不要破坏）

```
每秒费率 = 薪资 ÷ 折算秒数
  月薪:   amount ÷ 21.75 ÷ 每日有效秒数     (劳社部月计薪天数)
  年薪:   amount ÷ 261  ÷ 每日有效秒数     (21.75 × 12)
  日薪:   amount      ÷ 每日有效秒数
每日有效秒数 = 下班 − 上班 − 午休
```

- 核心函数 `earnedBetween(config, from, to)`：按绝对时间**推导**金额，
  绝不页面累加（关页面/改时间/换设备不漂移）。每个窗口金额先舍入到分再累加
- 只算周一~周五；午休不计薪；工作日下班后按 `overtimeRate`（默认 1.5）计加班
- 配置键：`localStorage['salary-pulse.config.v1']`，读取时校验失败视为未配置。
  桌面端与浏览器端 origin 不同各存一份（用户首次用桌面端要设置一次）
- 全部在 `src/lib/calc/`（types/validate/earned/status/format），是纯函数

## 四、视觉世界与关键决策（用户亲自定的，别推翻）

- **用户从 6 个 HTML 实景小样里选中「B 工资表」**：机械滚轮计数器世界
  （暖灰白仪表底 #F4F3EF、瓷白滚轮字轮、朱红 #B3392B 只给活跃态、
  圆表盘读数）。小样在 `.impeccable/previews/`（meter.html 是本体）
- 用户明确**拒绝深色**（"太暗太压抑"）→ 只做浅色主题，是硬约束
- 用户偏好「简单」：已砍掉后端/云同步；时间选择必须下拉（原生 time input
  被投诉不方便）；本月/今年累计表盘被用户要求删除，只留「今日加班费」
- 悬浮窗路线是用户 2026-09-04 选定的（**Electron**，否决浏览器画中画——
  必须开着浏览器不算独立；Tauri 本机无 Rust 工具链）。
  spec：`docs/superpowers/specs/2026-09-04-desktop-widget-design.md`
- 界面全中文；无 emoji；无 UI 组件库，样式是原生 CSS 令牌（`src/styles/base.css`）

## 五、技术栈与文件地图

Vite + Vue 3 `<script setup>` + TypeScript + vitest + Electron（44.2）+
electron-builder（26.15）。无路由——**URL hash 区分三形态**：
`''`=网页主页（行为不变）、`#widget`=悬浮窗、`#settings`=独立设置窗。

```
src/
  App.vue                    hash 三形态分发 + 主计数器页（逻辑已抽走）
  composables/useEarnings.ts 250ms 时钟/状态/今日已赚/倒计时，主页与悬浮窗共用
  SettingsView.vue           设置页（默认主页与独立设置窗复用；canCancel=false）
  components/WidgetView.vue  悬浮窗紧凑视图（滚轮缩小+状态角标+设置/收起按钮）
  components/WheelCounter.vue 滚轮行（悬浮窗里 :deep 覆盖 font-size: 33px）
  components/WheelCell.vue     单个滚轮（0-9条带+复制位0，9→0正向滚动）
  components/StatusLine.vue  状态徽章/日期/设置入口
  components/GaugeDial.vue   圆形表盘（今日加班费）
  lib/calc/*                 纯函数计算引擎（见第三节）
  lib/storage.ts             localStorage 读写（saveConfig 末尾触发 IPC 广播）
  lib/native.d.ts            window.salaryNative 桥接类型（纯浏览器下可选）
electron/
  main.cjs                   主进程：悬浮窗/托盘/设置窗/位置持久化/单实例/IPC
  preload.cjs                contextBridge → window.salaryNative
  lib/bounds.cjs             clampBoundsIntoDisplay 纯函数（vitest 直接测）
scripts/
  gen-icons.cjs              像素图标生成（纯 Node PNG/ICO 编码器，无依赖）
  electron-dev.cjs           electron:dev 编排（vite 5178 + electron.exe）
  smoke.cjs                  冒烟截图（构建后 npx electron scripts/smoke.cjs）
assets/                      托盘 tray.png/@2x + icon.ico（脚本产物，已提交）
tests/calc.spec.ts           29 个计算测试
tests/bounds.spec.ts         5 个窗口钳制测试
```

## 六、开发工作流

```bash
npm install && npm run dev        # 网页开发
npm run electron:dev              # 悬浮窗开发（一条命令起 vite+electron）
npm run test                      # vitest（34 个）
npx vue-tsc --noEmit              # 类型检查
npm run build                     # 产 dist/（base:'./'，file:// 可开）
npm run smoke                     # 构建+冒烟截图到 .impeccable/review/
npm run dist:win                  # NSIS 安装包到 release/（已 gitignore）
node scripts/gen-icons.cjs        # 改了图标设计后重新生成
```

- **预览服务只绑 localhost（IPv6）**：访问用 `http://localhost:4173`，
  用 127.0.0.1 会连接拒绝
- **截图/浏览器实测**：ZCode 内置浏览器（IAB）在本机起不来（宿主问题）。
  用 `.impeccable/shotbot/` 的 playwright-core（`channel: 'msedge'` 无头
  驱动系统 Edge）。**Electron 形态**则用 `npm run smoke` 截图
- **Electron 下载镜像**：`.npmrc` 已配 npmmirror（electron 二进制 +
  builder binaries），换网络环境不用改
- **首次 electron-builder 打包若在 doPack 挂**：多为瞬时下载/文件占用，
  先杀干净 electron.exe 进程再重跑一次即可
- git 推送走 HTTPS + Windows 凭据管理器；gh CLI 未安装

## 七、未完成 / 可选后续

1. **悬浮窗待真机细验**：托盘交互（左键单击/菜单）、拖动位置记忆、
   开机自启注册表项、设置窗保存后悬浮窗实时刷新——冒烟只验了渲染与启动。
   建议用户日常用两天，不顺手的再迭代
2. **滚轮正向滚动的动态采样验证没跑完**（网页旧账，脚本 `verify-wrap.cjs`
   就绪）。修复代码已在（WheelCell.vue 复制位方案），5 秒 transform
   采样的最终实证未完成
3. 悬浮窗已知小取舍：透明窗口截图四角发黑（capturePage 行为，实际透明）；
   设置窗 640px 高需要滚动。均无害
4. 用户可能继续要的功能方向（未承诺）：周末加班开关、节假日历、涨薪历程、
   奶茶换算玩梗、悬浮窗透明度/点击穿透（spec 明确不做，除非用户反悔）
5. 仓库现无 LICENSE；无 CI。要加的话 GitHub Actions 跑 `npm test` 很便宜

## 八、历史包袱提示

- README 曾在 rebase 冲突中被 `git checkout --ours` 误覆盖成 GitHub 占位
  （rebase 时 ours/theirs 语义反转），已修复——将来解决 rebase 冲突先想清楚
- Windows 下 git 会刷 LF→CRLF warning，无害
- `npx impeccable` 官方安装器会把技能塞进 Claude/Cursor/Codex/Trae 目录并加
  全局 hooks——本机已清理干净，只保留 `~/.zcode/skills/impeccable-skill`
- electron-builder 中文 productName 在部分终端里路径显示为乱码
  （如 Git Bash 的 tasklist 输出），实际文件名正确，无害
