<script setup lang="ts">
import { ref } from 'vue'
import GaugeDial from './components/GaugeDial.vue'
import StatusLine from './components/StatusLine.vue'
import WheelCounter from './components/WheelCounter.vue'
import WidgetView from './components/WidgetView.vue'
import SettingsView from './SettingsView.vue'
import { useEarnings } from './composables/useEarnings'
import { formatDateCN, formatYuan } from './lib/calc/format'
import { DEFAULT_CONFIG, type SalaryConfig } from './lib/calc/types'
import { loadConfig, saveConfig } from './lib/storage'

/** 形态由 URL hash 决定：''=网页主页，'#widget'=悬浮窗，'#settings'=独立设置窗 */
const mode = location.hash.replace(/^#/, '') as '' | 'widget' | 'settings'

const saved = loadConfig()
const view = ref<'counter' | 'settings'>(saved ? 'counter' : 'settings')
const cfg = ref<SalaryConfig>(saved ?? DEFAULT_CONFIG)

function onSave(next: SalaryConfig): void {
  cfg.value = next
  saveConfig(next)
  view.value = 'counter'
}

/** 独立设置窗（Electron）：保存后关窗；悬浮窗经 IPC 广播自行刷新 */
function onStandaloneSave(next: SalaryConfig): void {
  saveConfig(next)
  window.close()
}

const { now, status, mainAmount, metaLine, lastHour, today } = useEarnings(cfg)
</script>

<template>
  <WidgetView v-if="mode === 'widget'" />

  <div v-else-if="mode === 'settings'" class="shell standalone">
    <SettingsView :initial="cfg" :can-cancel="false" @save="onStandaloneSave" />
  </div>

  <div v-else class="shell">
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

.standalone {
  grid-template-rows: 1fr;
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
