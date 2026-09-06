<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import WheelCounter from './WheelCounter.vue'
import { useEarnings } from '../composables/useEarnings'
import { formatHMS, formatRate } from '../lib/calc/format'
import { STATUS_LABEL } from '../lib/calc/status'
import { DEFAULT_CONFIG, type SalaryConfig } from '../lib/calc/types'
import { loadConfig } from '../lib/storage'

const saved = loadConfig()
const cfg = ref<SalaryConfig>(saved ?? DEFAULT_CONFIG)
const configured = ref(saved !== null)

const { status, rate, mainAmount, secondsOfDay, workStartSec, workEndSec, lastHour } =
  useEarnings(cfg)

const active = computed(() => status.value === 'trading' || status.value === 'overtime')

/** 紧凑副标题：不带状态词（已在左上角标）与计薪口径，保证一行放得下 */
const metaLine = computed(() => {
  const ratePart = formatRate(rate.value)
  switch (status.value) {
    case 'pre':
      return `${ratePart} · 距开盘 ${formatHMS(workStartSec.value - secondsOfDay.value)}`
    case 'trading':
    case 'lunch':
      return `${ratePart} · 距下班 ${formatHMS(workEndSec.value - secondsOfDay.value)}`
    case 'overtime':
      return `${ratePart} · 已加班 ${formatHMS(secondsOfDay.value - workEndSec.value)} · ×${cfg.value.overtimeRate}`
    case 'closed':
      return ratePart
  }
})

function openSettings(): void {
  window.salaryNative?.openSettings()
}

/** 悬浮窗没有系统标题栏，关闭 = 隐藏进托盘（主进程拦截 close 事件） */
function hideToTray(): void {
  window.close()
}

onMounted(() => document.documentElement.classList.add('widget-mode'))
onUnmounted(() => document.documentElement.classList.remove('widget-mode'))

let offConfig: (() => void) | undefined
onMounted(() => {
  offConfig = window.salaryNative?.onConfigChanged(() => {
    const next = loadConfig()
    if (next) {
      cfg.value = next
      configured.value = true
    }
  })
})
onUnmounted(() => offConfig?.())
</script>

<template>
  <div class="widget">
    <div v-if="configured" class="card" role="timer" aria-label="今日已赚悬浮窗">
      <header class="head">
        <span class="status" :class="{ active }">
          <i class="dot" aria-hidden="true"></i>{{ STATUS_LABEL[status] }}
        </span>
        <span class="btns">
          <button class="icon-btn" type="button" aria-label="设置" @click="openSettings">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
              stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3.2" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.08A1.7 1.7 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.08A1.7 1.7 0 0 0 20.91 10H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z" />
            </svg>
          </button>
          <button class="icon-btn" type="button" aria-label="收进托盘" @click="hideToTray">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
              stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </span>
      </header>
      <WheelCounter :value="mainAmount" />
      <p class="meta" :class="{ urgent: lastHour }">{{ metaLine }}</p>
    </div>

    <div v-else class="card empty">
      <p>还不知道你的时薪，先设置一下</p>
      <button type="button" class="setup" @click="openSettings">打开设置</button>
    </div>
  </div>
</template>

<style scoped>
/* 窗口根：透明、整卡可拖动 */
.widget {
  height: 100dvh;
  padding: 7px;
  -webkit-app-region: drag;
}

.card {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: linear-gradient(var(--panel-hi), var(--panel-lo));
  border: 1px solid var(--line);
  border-radius: 14px;
  box-shadow: 0 10px 28px rgba(28, 36, 43, 0.22), inset 0 1px 0 #ffffff;
  padding: 9px 13px 11px;
  overflow: hidden;
}

.head {
  display: flex;
  align-items: center;
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  letter-spacing: 0.14em;
  color: var(--ink-soft);
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--line-strong);
}

.status.active {
  color: var(--accent);
}

.status.active .dot {
  background: var(--accent);
  animation: breathe 2s ease-in-out infinite;
}

@keyframes breathe {
  50% {
    opacity: 0.35;
  }
}

.btns {
  margin-left: auto;
  display: inline-flex;
  gap: 2px;
}

.icon-btn {
  -webkit-app-region: no-drag;
  background: none;
  border: none;
  color: var(--ink-soft);
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  padding: 0;
}

.icon-btn:hover {
  color: var(--ink);
  background: rgba(28, 36, 43, 0.06);
}

/* 滚轮在 320px 窗里缩到主页的约 1/4 */
.card :deep(.wheels) {
  font-size: 33px;
  margin: 3px 0 2px;
}

.meta {
  font-size: 12px;
  color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta.urgent {
  color: var(--accent);
  font-weight: 600;
}

.empty {
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
}

.empty p {
  font-size: 13px;
  color: var(--ink-soft);
}

.setup {
  -webkit-app-region: no-drag;
  background: var(--ink);
  color: var(--bg);
  border: none;
  border-radius: var(--radius-sm);
  padding: 8px 22px;
  font-size: 13px;
}
</style>
