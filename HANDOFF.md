# 交接文档（HANDOFF）

> 写于 2026-09-02。用途：新会话/新窗口接手项目时先读这一份。
> 读完按需再读：`README.md`（对外介绍）、`docs/superpowers/specs/2026-09-02-salary-pulse-design.md`（原始规格，部分已过时，见下）、`PRODUCT.md`（产品定位）、`.impeccable/surfaces/index-html.md`（视觉方向契约）。

## 一、这是什么项目

「薪资跳动」：给中国打工人的实时赚钱计数器网页。上班时间打开，「今日已赚」
像机械滚轮水电表一样每 250ms 跳一次。纯前端，无后端无账号，配置存
localStorage。已上线 GitHub：https://github.com/WYW-1127/salary-pulse

## 二、当前状态（全部已验证）

- **功能全部完成**：滚轮计数器（数位独立正向滚动，9→0 满圈不倒转）、
  五状态机（未开盘/交易中/午间休市/加班中/休市）、下班倒计时（最后 1 小时
  变红）、今日加班费表盘、设置页（计薪模式三选一：月薪/年薪总包/日薪；
  时间用下拉选择，一刻钟一格；逐字段校验）
- **质量**：vue-tsc 零错误；30 个 vitest 全过；构建 31.5KB gzip
- **git**：本地 main 与 origin/main 同步（HEAD `8b270f5`），README 完整版
  已在线
- **运行中**：预览服务 `npm run preview -- --port 4173 --strictPort`
  （后台任务，重启电脑后需重新起）

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
- 配置键：`localStorage['salary-pulse.config.v1']`，读取时校验失败视为未配置
- 全部在 `src/lib/calc/`（types/validate/earned/status/format），是纯函数

## 四、视觉世界与关键决策（用户亲自定的，别推翻）

- **用户从 6 个 HTML 实景小样里选中「B 工资表」**：机械滚轮计数器世界
  （暖灰白仪表底 #F4F3EF、瓷白滚轮字轮、朱红 #B3392B 只给活跃态、
  圆表盘读数）。小样在 `.impeccable/previews/`（meter.html 是本体）
- 用户明确**拒绝深色**（"太暗太压抑"）→ 只做浅色主题，是硬约束
- 用户偏好「简单」：已砍掉后端/云同步；时间选择必须下拉（原生 time input
  被投诉不方便）；本月/今年累计表盘被用户要求删除，只留「今日加班费」
- 界面全中文；无 emoji；无 UI 组件库，样式是原生 CSS 令牌（`src/styles/base.css`）

## 五、技术栈与文件地图

Vite + Vue 3 `<script setup>` + TypeScript + vitest。无路由（v-if 切换两视图）。

```
src/
  App.vue                    主计数器页 + 视图切换 + 250ms 时钟
  SettingsView.vue           设置页（含下拉时间选项生成 timeOptions）
  components/WheelCounter.vue  ¥ + 5整数位 + 小数点 + 2小数位的滚轮行
  components/WheelCell.vue     单个滚轮（0-9条带+复制位0，9→0正向滚动）
  components/StatusLine.vue  状态徽章/日期/设置入口（内嵌手绘 SVG 齿轮）
  components/GaugeDial.vue   圆形表盘（现在只剩今日加班费一个在用）
  lib/calc/*                 纯函数计算引擎（见第三节）
  lib/storage.ts             localStorage 读写
tests/calc.spec.ts           30 个测试
docs/superpowers/specs/…md   原始规格（注意：第1节"本月/今年累计"和
                             "无日薪口径"已过时——用户后来迭代了，以代码为准）
.impeccable/                 gitignore 了：决策页 payload、surface brief、
  shotbot/                   截图机器人（playwright-core 已装）、review/ 截图
```

## 六、开发工作流

```bash
npm install && npm run dev        # 开发
npm run test                      # vitest
npm run build                     # 产 dist/
npm run preview -- --port 4173 --strictPort   # 预览构建产物
```

- **预览服务只绑 localhost（IPv6）**：访问用 `http://localhost:4173`，
  用 127.0.0.1 会连接拒绝
- **截图/浏览器实测**：ZCode 内置浏览器（IAB）在本机起不来（webview 一直
  not attached，是宿主问题）。用现成方案：`.impeccable/shotbot/` 里已装
  playwright-core，`channel: 'msedge'` 无头驱动系统 Edge，无需下载浏览器。
  参考脚本 `shoot.cjs`（流程截图）和 `verify-wrap.cjs`（滚轮方向采样）
- git 推送走 HTTPS + Windows 凭据管理器（已授权过，不再弹窗）；gh CLI 未安装

## 七、未完成 / 可选后续

1. **滚轮正向滚动的动态采样验证没跑完**（脚本 `verify-wrap.cjs` 就绪，
   被暂停两次）。修复代码已在（WheelCell.vue 复制位方案），逻辑审查过，
   但 5 秒 transform 采样的最终实证未完成。跑一次即可闭环
2. **DESIGN.md 没写**（impeccable 流程的 documenter 步骤被省略）。
   若要补：从已构建世界记录令牌/状态/滚轮机制
3. 规格 spec 与实现有漂移（第四节已列），如在意可更新 spec 或在 spec 顶部
   标注"以代码为准"
4. 用户可能继续要的功能方向（未承诺）：周末加班开关、节假日历、涨薪历程、
   奶茶换算玩梗、PWA 主屏
5. 仓库现无 LICENSE；无 CI。要加的话 GitHub Actions 跑 `npm test` 很便宜

## 八、历史包袱提示

- README 曾在 rebase 冲突中被 `git checkout --ours` 误覆盖成 GitHub 占位
  （rebase 时 ours/theirs 语义反转），已修复——将来解决 rebase 冲突先想清楚
  两侧谁是"ours"
- Windows 下 git 会刷 LF→CRLF warning，无害
- `npx impeccable` 官方安装器会把技能塞进 Claude/Cursor/Codex/Trae 目录并加
  全局 hooks——本机已清理干净，只保留 `~/.zcode/skills/impeccable-skill`
