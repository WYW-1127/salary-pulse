<script setup lang="ts">
import { computed, reactive } from 'vue'
import type { SalaryConfig } from './lib/calc/types'
import { toMinutes, validateConfig } from './lib/calc/validate'

const props = defineProps<{ initial: SalaryConfig; canCancel: boolean }>()
const emit = defineEmits<{ save: [SalaryConfig]; cancel: [] }>()

/** 每个时间字段的候选范围（一刻钟一格），覆盖常见作息 */
const TIME_RANGES = {
  workStart: { from: '05:00', to: '12:00' },
  lunchStart: { from: '11:00', to: '14:30' },
  lunchEnd: { from: '11:30', to: '15:30' },
  workEnd: { from: '15:00', to: '23:45' },
} as const

type TimeField = keyof typeof TIME_RANGES

function timeOptions(field: TimeField, current: string): string[] {
  const { from, to } = TIME_RANGES[field]
  const out: string[] = []
  for (let m = toMinutes(from); m <= toMinutes(to); m += 15) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`)
  }
  if (!out.includes(current)) out.push(current) // 旧配置里的非整刻时间不丢失
  return out.sort()
}

const form = reactive({
  payMode: props.initial.payMode,
  amount: String(props.initial.amount),
  workStart: props.initial.workStart,
  lunchStart: props.initial.lunchStart,
  lunchEnd: props.initial.lunchEnd,
  workEnd: props.initial.workEnd,
  overtimeRate: String(props.initial.overtimeRate),
  weekendWork: props.initial.weekendWork,
  weekendRate: String(props.initial.weekendRate),
})

function parsed(): SalaryConfig {
  return {
    payMode: form.payMode,
    amount: Number(form.amount),
    workStart: form.workStart,
    lunchStart: form.lunchStart,
    lunchEnd: form.lunchEnd,
    workEnd: form.workEnd,
    overtimeRate: Number(form.overtimeRate),
    weekendWork: form.weekendWork,
    weekendRate: Number(form.weekendRate),
  }
}

const errors = computed<Record<string, string>>(() => {
  const c = parsed()
  if (!form.amount || !form.overtimeRate) return {} // 未填完不急着报错
  return validateConfig(c)
})

function fillDemo(): void {
  form.payMode = 'monthly'
  form.amount = '12000'
  form.workStart = '09:00'
  form.lunchStart = '12:00'
  form.lunchEnd = '13:00'
  form.workEnd = '18:30'
  form.overtimeRate = '1.5'
}

function submit(): void {
  const e = validateConfig(parsed())
  if (Object.keys(e).length > 0) return
  emit('save', parsed())
}
</script>

<template>
  <section class="settings" aria-label="设置">
    <h1>设置</h1>

    <form @submit.prevent="submit">
      <fieldset>
        <legend>计薪模式</legend>
        <div class="modes">
          <button
            type="button"
            :aria-pressed="form.payMode === 'monthly'"
            :class="{ on: form.payMode === 'monthly' }"
            @click="form.payMode = 'monthly'"
          >
            月薪
          </button>
          <button
            type="button"
            :aria-pressed="form.payMode === 'annual'"
            :class="{ on: form.payMode === 'annual' }"
            @click="form.payMode = 'annual'"
          >
            年薪总包
          </button>
          <button
            type="button"
            :aria-pressed="form.payMode === 'daily'"
            :class="{ on: form.payMode === 'daily' }"
            @click="form.payMode = 'daily'"
          >
            日薪
          </button>
        </div>
        <p class="err" v-if="errors.payMode" role="alert">{{ errors.payMode }}</p>
      </fieldset>

      <div class="field">
        <label for="amount">{{
          form.payMode === 'monthly'
            ? '月薪（元）'
            : form.payMode === 'annual'
              ? '年薪总包（元）'
              : '日薪（元）'
        }}</label>
        <input
          id="amount"
          v-model="form.amount"
          inputmode="decimal"
          autocomplete="off"
          :aria-invalid="!!errors.amount"
          :aria-describedby="errors.amount ? 'amount-err' : undefined"
        />
        <p class="err" id="amount-err" v-if="errors.amount" role="alert">{{ errors.amount }}</p>
      </div>

      <div class="times">
        <div class="field">
          <label for="ws">上班时间</label>
          <select id="ws" v-model="form.workStart">
            <option v-for="t in timeOptions('workStart', form.workStart)" :key="t" :value="t">
              {{ t }}
            </option>
          </select>
          <p class="err" v-if="errors.workStart" role="alert">{{ errors.workStart }}</p>
        </div>
        <div class="field">
          <label for="ls">午休开始</label>
          <select id="ls" v-model="form.lunchStart">
            <option v-for="t in timeOptions('lunchStart', form.lunchStart)" :key="t" :value="t">
              {{ t }}
            </option>
          </select>
          <p class="err" v-if="errors.lunchStart" role="alert">{{ errors.lunchStart }}</p>
        </div>
        <div class="field">
          <label for="le">午休结束</label>
          <select id="le" v-model="form.lunchEnd">
            <option v-for="t in timeOptions('lunchEnd', form.lunchEnd)" :key="t" :value="t">
              {{ t }}
            </option>
          </select>
          <p class="err" v-if="errors.lunchEnd" role="alert">{{ errors.lunchEnd }}</p>
        </div>
        <div class="field">
          <label for="we">下班时间</label>
          <select id="we" v-model="form.workEnd">
            <option v-for="t in timeOptions('workEnd', form.workEnd)" :key="t" :value="t">
              {{ t }}
            </option>
          </select>
          <p class="err" v-if="errors.workEnd" role="alert">{{ errors.workEnd }}</p>
        </div>
      </div>

      <div class="field narrow">
        <label for="ot">加班倍率</label>
        <input
          id="ot"
          v-model="form.overtimeRate"
          inputmode="decimal"
          autocomplete="off"
          :aria-invalid="!!errors.overtimeRate"
          :aria-describedby="errors.overtimeRate ? 'ot-err' : undefined"
        />
        <p class="err" id="ot-err" v-if="errors.overtimeRate" role="alert">{{ errors.overtimeRate }}</p>
      </div>

      <fieldset>
        <legend>周末</legend>
        <div class="modes">
          <button
            type="button"
            :aria-pressed="!form.weekendWork"
            :class="{ on: !form.weekendWork }"
            @click="form.weekendWork = false"
          >
            周末不计薪
          </button>
          <button
            type="button"
            :aria-pressed="form.weekendWork"
            :class="{ on: form.weekendWork }"
            @click="form.weekendWork = true"
          >
            周末也计薪
          </button>
        </div>
        <p class="err" v-if="errors.weekendWork" role="alert">{{ errors.weekendWork }}</p>
        <div v-if="form.weekendWork" class="field narrow wr">
          <label for="wr">周末倍率（1 = 按正常薪资）</label>
          <input
            id="wr"
            v-model="form.weekendRate"
            inputmode="decimal"
            autocomplete="off"
            :aria-invalid="!!errors.weekendRate"
            :aria-describedby="errors.weekendRate ? 'wr-err' : undefined"
          />
          <p class="err" id="wr-err" v-if="errors.weekendRate" role="alert">{{ errors.weekendRate }}</p>
          <p class="hint">周末按同一份作息计时，午休不计，下班后不累计，不叠加加班倍率</p>
        </div>
      </fieldset>

      <div class="actions">
        <button type="submit" class="primary">保存</button>
        <button type="button" class="ghost" :disabled="!canCancel" @click="emit('cancel')">
          取消
        </button>
        <button type="button" class="link" @click="fillDemo">填入示例数据先看看效果</button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.settings {
  justify-self: center;
  width: min(560px, 100%);
}

h1 {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.14em;
  margin-bottom: 26px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line);
}

form {
  display: grid;
  gap: 26px;
}

fieldset {
  border: none;
}

legend {
  font-size: 14px;
  color: var(--ink-soft);
  letter-spacing: 0.18em;
  margin-bottom: 10px;
}

.modes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.modes button {
  padding: 13px;
  font-size: 15px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line-strong);
  background: var(--panel-hi);
  color: var(--ink);
}

.modes button.on {
  border-color: var(--accent);
  color: var(--accent);
  font-weight: 600;
  background: var(--accent-soft);
}

.field {
  display: grid;
  gap: 7px;
}

.field.narrow {
  max-width: 200px;
}

label {
  font-size: 14px;
  color: var(--ink-soft);
}

input,
select {
  font: inherit;
  font-size: 17px;
  padding: 11px 14px;
  border: none;
  border-radius: 0;
  background: transparent;
  color: var(--ink);
  /* 用 inset 阴影画下划线，聚焦加粗时不产生布局位移 */
  box-shadow: inset 0 -1px 0 var(--line-strong);
}

select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%236a675f' stroke-width='1.8' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 6px center;
  padding-right: 30px;
}

input:focus-visible,
select:focus-visible {
  outline: none;
  box-shadow: inset 0 -2px 0 var(--accent);
}

.times {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 18px;
}

.err {
  font-size: 13px;
  color: var(--accent);
}

.field.narrow.wr {
  margin-top: 14px;
}

.hint {
  font-size: 13px;
  color: var(--ink-soft);
}

.actions {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 4px;
}

button.primary {
  background: var(--ink);
  color: var(--bg);
  border: 1px solid var(--ink);
  border-radius: var(--radius-sm);
  padding: 13px 44px;
  font-size: 15px;
}

button.primary:active {
  transform: translateY(1px);
}

button.ghost {
  background: none;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  padding: 13px 30px;
  font-size: 15px;
  color: var(--ink);
}

button.ghost:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

button.link {
  background: none;
  border: none;
  color: var(--ink-soft);
  font-size: 14px;
  text-decoration: underline;
  text-underline-offset: 4px;
  margin-left: auto;
}
</style>
