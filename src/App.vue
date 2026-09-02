<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import GaugeDial from './components/GaugeDial.vue'
import StatusLine from './components/StatusLine.vue'
import WheelCounter from './components/WheelCounter.vue'
import SettingsView from './SettingsView.vue'
import { earnedBetween, perSecondRate } from './lib/calc/earned'
import { formatDateCN, formatHMS, formatRate, formatYuan } from './lib/calc/format'
import { statusAt } from './lib/calc/status'
import { DEFAULT_CONFIG, type SalaryConfig } from './lib/calc/types'
import { toMinutes } from './lib/calc/validate'
import { loadConfig, saveConfig } from './lib/storage'

const saved = loadConfig()
const view = ref<'counter' | 'settings'>(saved ? 'counter' : 'settings')
const cfg = ref<SalaryConfig>(saved ?? DEFAULT_CONFIG)

const now = ref(new Date())
const timer = setInterval(() => {
  now.value = new Date()
}, 250)
onUnmounted(() => clearInterval(timer))

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

const status = computed(() => statusAt(cfg.value, now.value))
const rate = computed(() => perSecondRate(cfg.value))
const today = computed(() => earnedBetween(cfg.value, startOfDay(now.value), now.value))
const mainAmount = computed(() => today.value.regular + today.value.overtime)

const secondsOfDay = computed(() => {
  const n = now.value
  return n.getHours() * 3600 + n.getMinutes() * 60 + n.getSeconds()
})
const workStartSec = computed(() => toMinutes(cfg.value.workStart) * 60)
const workEndSec = computed(() => toMinutes(cfg.value.workEnd) * 60)

/** 副标题：状态相关的时间线文案 + 计薪口径 */
const metaLine = computed(() => {
  const mode =
    cfg.value.payMode === 'monthly' ? '月薪' : cfg.value.payMode === 'annual' ? '年薪总包' : '日薪'
  const ratePart = formatRate(
    status.value === 'overtime' ? rate.value * cfg.value.overtimeRate : rate.value,
  )
  let line: string
  switch (status.value) {
    case 'pre':
      line = `${ratePart} · 距开盘 ${formatHMS(workStartSec.value - secondsOfDay.value)}`
      break
    case 'trading':
    case 'lunch':
      line = `${ratePart} · 距下班 ${formatHMS(workEndSec.value - secondsOfDay.value)}`
      break
    case 'overtime':
      line = `${ratePart} · 已加班 ${formatHMS(secondsOfDay.value - workEndSec.value)} · ×${cfg.value.overtimeRate}`
      break
    case 'closed':
      line = ratePart
  }
  return `${line} · ${mode}`
})

/** 倒计时进入最后一小时，需要显著强调 */
const lastHour = computed(
  () =>
    (status.value === 'trading' || status.value === 'lunch') &&
    workEndSec.value - secondsOfDay.value <= 3600,
)

function onSave(next: SalaryConfig): void {
  cfg.value = next
  saveConfig(next)
  view.value = 'counter'
}
</script>

<template>
  <div class="shell">
    <StatusLine
      :status="status"
      :date-text="formatDateCN(now)"
      @open-settings="view = 'settings'"
    />

    <main v-if="view === 'counter'">
      <section class="panel" aria-label="今日收入仪表盘">
        <div class="scale" aria-hidden="true">
          <i v-for="n in 15" :key="n"></i>
        </div>
        <h1 class="label">今日已赚</h1>
        <WheelCounter :value="mainAmount" />
        <p class="meta" :class="{ urgent: lastHour }">
          {{ metaLine }}
        </p>
      </section>
    </main>

    <footer v-if="view === 'counter'" aria-label="加班读数">
      <GaugeDial
        label="今日加班费"
        :value="formatYuan(today.overtime)"
        :active="status === 'overtime'"
      />
    </footer>

    <SettingsView
      v-if="view === 'settings'"
      :initial="cfg"
      :can-cancel="saved !== null"
      @save="onSave"
      @cancel="view = 'counter'"
    />
  </div>
</template>

<style scoped>
.shell {
  min-height: 100dvh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  align-items: center;
  gap: 24px;
  padding: 24px clamp(20px, 5vw, 64px);
  max-width: 1440px;
  margin: 0 auto;
}

main {
  justify-self: center;
  width: 100%;
}

.panel {
  background: linear-gradient(var(--panel-hi), var(--panel-lo));
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: clamp(28px, 5vw, 52px) clamp(20px, 4vw, 56px) clamp(26px, 4vw, 44px);
  box-shadow: var(--shadow-panel), inset 0 1px 0 #ffffff;
  text-align: center;
}

.scale {
  display: flex;
  justify-content: center;
  gap: 26px;
  margin-bottom: 24px;
}

.scale i {
  width: 1px;
  height: 10px;
  background: var(--line-strong);
}

.scale i:nth-child(5n + 1) {
  height: 16px;
}

.label {
  font-size: 15px;
  font-weight: 400;
  letter-spacing: 0.4em;
  text-indent: 0.4em;
  color: var(--ink-soft);
  margin-bottom: 22px;
}

.wheels {
  justify-content: center;
}

.meta {
  margin-top: 24px;
  font-size: 16px;
  color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.03em;
}

.meta.urgent {
  color: var(--accent);
  font-weight: 600;
}

footer {
  justify-self: center;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: clamp(16px, 4vw, 48px);
  padding-top: 8px;
}

@media (max-width: 767px) {
  footer {
    display: grid;
    grid-template-columns: repeat(3, minmax(96px, 1fr));
    gap: 12px;
    width: 100%;
  }
}
</style>
