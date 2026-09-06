import type { SalaryConfig } from './types'
import { toMinutes } from './validate'

export type WorkStatus = 'pre' | 'trading' | 'lunch' | 'overtime' | 'closed'

export const STATUS_LABEL: Record<WorkStatus, string> = {
  pre: '未开盘',
  trading: '交易中',
  lunch: '午间休市',
  overtime: '加班中',
  closed: '休市',
}

/** 五状态机：休市 / 未开盘 / 交易中 / 午间休市 / 加班中（本地时间判定）。
 * 周末默认休市；开启 weekendWork 后周末按同制作息交易，下班后直接休市（不叠加加班） */
export function statusAt(cfg: SalaryConfig, now: Date): WorkStatus {
  const dow = now.getDay()
  const weekend = dow < 1 || dow > 5
  if (weekend && !cfg.weekendWork) return 'closed'

  const m = now.getHours() * 60 + now.getMinutes()
  const ws = toMinutes(cfg.workStart)
  const ls = toMinutes(cfg.lunchStart)
  const le = toMinutes(cfg.lunchEnd)
  const we = toMinutes(cfg.workEnd)

  if (m < ws) return 'pre'
  if (m >= ls && m < le) return 'lunch'
  if (m >= we) return weekend ? 'closed' : 'overtime'
  return 'trading'
}
