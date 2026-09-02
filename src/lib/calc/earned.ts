import type { SalaryConfig } from './types'
import { toMinutes } from './validate'

export interface Earnings {
  /** 正常工作时段收入（元） */
  regular: number
  /** 加班收入（元） */
  overtime: number
}

/** 劳动法月计薪天数 */
const PAY_DAYS_PER_MONTH = 21.75
/** 年计薪天数 = 21.75 × 12 */
const PAY_DAYS_PER_YEAR = 261

/** 每日有效工作秒数（扣除午休） */
export function dailyWorkSeconds(cfg: SalaryConfig): number {
  const work = toMinutes(cfg.workEnd) - toMinutes(cfg.workStart)
  const lunch = toMinutes(cfg.lunchEnd) - toMinutes(cfg.lunchStart)
  return (work - lunch) * 60
}

/** 每秒费率（元/秒）。日薪直接按当日有效工时折算，月薪按 21.75、年薪按 261 个计薪日摊 */
export function perSecondRate(cfg: SalaryConfig): number {
  const total =
    cfg.payMode === 'annual'
      ? cfg.amount / PAY_DAYS_PER_YEAR
      : cfg.payMode === 'daily'
        ? cfg.amount
        : cfg.amount / PAY_DAYS_PER_MONTH
  return total / dailyWorkSeconds(cfg)
}

/** [from, to] 与 day 日 startMin..endMin（分钟）窗口的交叠秒数 */
function overlapSeconds(from: Date, to: Date, day: Date, startMin: number, endMin: number): number {
  const ws = new Date(day)
  ws.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0)
  const we = new Date(day)
  we.setHours(Math.floor(endMin / 60), endMin % 60, 0, 0)
  const s = Math.max(from.getTime(), ws.getTime())
  const e = Math.min(to.getTime(), we.getTime())
  return Math.max(0, Math.round((e - s) / 1000))
}

/**
 * 任意两时刻之间的应得收入。按天迭代本地时区日期：
 * 周末不计薪；工作日拆 正常窗口 [workStart,lunchStart)∪[lunchEnd,workEnd) 与
 * 加班窗口 [workEnd, 24:00)；每个窗口的金额先舍入到「分」再累加，避免浮点漂移。
 */
export function earnedBetween(cfg: SalaryConfig, from: Date, to: Date): Earnings {
  if (to.getTime() <= from.getTime()) return { regular: 0, overtime: 0 }

  const rate = perSecondRate(cfg)
  const ws = toMinutes(cfg.workStart)
  const ls = toMinutes(cfg.lunchStart)
  const le = toMinutes(cfg.lunchEnd)
  const we = toMinutes(cfg.workEnd)

  let regCents = 0
  let otCents = 0
  const day = new Date(from)
  day.setHours(0, 0, 0, 0)

  while (day.getTime() <= to.getTime()) {
    const dow = day.getDay()
    if (dow >= 1 && dow <= 5) {
      regCents += Math.round(overlapSeconds(from, to, day, ws, ls) * rate * 100)
      regCents += Math.round(overlapSeconds(from, to, day, le, we) * rate * 100)
      otCents += Math.round(overlapSeconds(from, to, day, we, 1440) * rate * cfg.overtimeRate * 100)
    }
    day.setDate(day.getDate() + 1)
  }
  return { regular: regCents / 100, overtime: otCents / 100 }
}
