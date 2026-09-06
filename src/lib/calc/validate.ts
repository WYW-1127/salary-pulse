import type { SalaryConfig } from './types'

const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/

/** "HH:mm" → 当日分钟数；非法输入返回 NaN */
export function toMinutes(hhmm: string): number {
  if (!HHMM_RE.test(hhmm)) return NaN
  return Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5))
}

/**
 * 校验配置，返回逐字段错误信息；返回空对象表示合法。
 * 规则：金额为正、时间字段格式合法且 workStart < lunchStart < lunchEnd < workEnd、
 * 加班倍率 ≥ 1、周末倍率 > 0、周末开关为布尔。
 */
export function validateConfig(c: Partial<SalaryConfig> | null): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!c) return { _: '配置为空' }

  if (typeof c.amount !== 'number' || !Number.isFinite(c.amount) || c.amount <= 0) {
    errors.amount = '金额需要是大于 0 的数字'
  }
  if (c.payMode !== 'monthly' && c.payMode !== 'annual' && c.payMode !== 'daily') {
    errors.payMode = '请选择计薪模式'
  }

  const t = (v: unknown): v is string => typeof v === 'string' && HHMM_RE.test(v)
  for (const [key, label] of [
    ['workStart', '上班时间'],
    ['lunchStart', '午休开始'],
    ['lunchEnd', '午休结束'],
    ['workEnd', '下班时间'],
  ] as const) {
    if (!t(c[key])) errors[key] = `${label}格式不正确`
  }

  if (!Object.keys(errors).some((k) => k.endsWith('Start') || k.endsWith('End'))) {
    if (toMinutes(c.workStart!) >= toMinutes(c.lunchStart!)) errors.workStart = '上班时间需早于午休开始'
    if (toMinutes(c.lunchStart!) >= toMinutes(c.lunchEnd!)) errors.lunchEnd = '午休结束需晚于午休开始'
    if (toMinutes(c.lunchEnd!) >= toMinutes(c.workEnd!)) errors.workEnd = '下班时间需晚于午休结束'
  }

  if (typeof c.overtimeRate !== 'number' || !Number.isFinite(c.overtimeRate) || c.overtimeRate < 1) {
    errors.overtimeRate = '加班倍率不能小于 1'
  }

  if (typeof c.weekendWork !== 'boolean') {
    errors.weekendWork = '请选择周末是否计薪'
  }
  if (
    typeof c.weekendRate !== 'number' ||
    !Number.isFinite(c.weekendRate) ||
    c.weekendRate <= 0
  ) {
    errors.weekendRate = '周末倍率需要是大于 0 的数字'
  }
  return errors
}
