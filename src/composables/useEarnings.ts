import { computed, onUnmounted, ref, type Ref } from 'vue'
import { earnedBetween, perSecondRate } from '../lib/calc/earned'
import { formatHMS, formatRate } from '../lib/calc/format'
import { statusAt, type WorkStatus } from '../lib/calc/status'
import type { SalaryConfig } from '../lib/calc/types'
import { toMinutes } from '../lib/calc/validate'

/**
 * 主页与悬浮窗共用的收益推导：250ms 时钟 + 五状态 + 今日已赚 + 副标题文案。
 * 金额全部按绝对时间推导（见 lib/calc/earned），本组合函数不做任何累加。
 */
export function useEarnings(cfg: Ref<SalaryConfig>) {
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

  const status = computed<WorkStatus>(() => statusAt(cfg.value, now.value))
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

  return {
    now,
    status,
    rate,
    today,
    mainAmount,
    secondsOfDay,
    workStartSec,
    workEndSec,
    metaLine,
    lastHour,
  }
}
