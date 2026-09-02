import { describe, expect, it } from 'vitest'
import { dailyWorkSeconds, earnedBetween, perSecondRate } from '../src/lib/calc/earned'
import { formatHMS, formatRate, formatYuan } from '../src/lib/calc/format'
import { statusAt } from '../src/lib/calc/status'
import { DEFAULT_CONFIG, type SalaryConfig } from '../src/lib/calc/types'
import { toMinutes, validateConfig } from '../src/lib/calc/validate'

const cfg: SalaryConfig = { ...DEFAULT_CONFIG, amount: 21750 } // 月薪 21750 → 1000/计薪日

const d = (y: number, m: number, day: number, h = 0, mi = 0, s = 0) => new Date(y, m - 1, day, h, mi, s)

describe('费率推导', () => {
  it('月薪按 21.75 个计薪日折算', () => {
    // 21750 / 21.75 = 1000 元/日；每日有效 8h=28800s → 0.034722…元/秒
    expect(perSecondRate(cfg)).toBeCloseTo(1000 / 28800, 10)
  })
  it('年薪按 261 天折算（= 21.75 × 12）', () => {
    const annual: SalaryConfig = { ...cfg, payMode: 'annual', amount: 261000 }
    expect(perSecondRate(annual)).toBeCloseTo(1000 / 28800, 10)
  })
  it('日薪直接按当日有效工时折算', () => {
    const daily: SalaryConfig = { ...cfg, payMode: 'daily', amount: 1000 }
    expect(perSecondRate(daily)).toBeCloseTo(1000 / 28800, 10)
  })
  it('每日有效秒数扣除午休', () => {
    expect(dailyWorkSeconds(cfg)).toBe(8 * 3600)
  })
})

describe('earnedBetween', () => {
  it('工作日上午一小时 = 1000/8', () => {
    const r = earnedBetween(cfg, d(2026, 9, 2, 9), d(2026, 9, 2, 10))
    expect(r.regular).toBeCloseTo(125, 2)
    expect(r.overtime).toBe(0)
  })
  it('跨午休：只累计有效时段', () => {
    // 11:00–14:00 → 有效 11–12 与 13–14 共 2h = 250 元
    const r = earnedBetween(cfg, d(2026, 9, 2, 11), d(2026, 9, 2, 14))
    expect(r.regular).toBeCloseTo(250, 2)
  })
  it('午休时段内收入为 0', () => {
    const r = earnedBetween(cfg, d(2026, 9, 2, 12), d(2026, 9, 2, 13))
    expect(r.regular).toBe(0)
    expect(r.overtime).toBe(0)
  })
  it('下班后按加班倍率计（1.5×）', () => {
    // 18:00–19:00 → 1000/8×1.5 = 187.5
    const r = earnedBetween(cfg, d(2026, 9, 2, 18), d(2026, 9, 2, 19))
    expect(r.overtime).toBeCloseTo(187.5, 2)
    expect(r.regular).toBe(0)
  })
  it('跨天累加两天收入', () => {
    const r = earnedBetween(cfg, d(2026, 9, 2, 9), d(2026, 9, 3, 18))
    expect(r.regular).toBeCloseTo(2000, 2)
  })
  it('周末不计薪', () => {
    // 2026-09-05 周六
    const r = earnedBetween(cfg, d(2026, 9, 5, 0), d(2026, 9, 6, 23, 59))
    expect(r.regular).toBe(0)
    expect(r.overtime).toBe(0)
  })
  it('跨周末连续区间跳过周六日', () => {
    // 周五 09:00 → 周一 10:00 = 周五整天 1000 + 周一 1h 125（周六日跳过）
    const r = earnedBetween(cfg, d(2026, 8, 28, 9), d(2026, 8, 31, 10))
    expect(r.regular).toBeCloseTo(1125, 2)
  })
  it('跨月与跨年边界正确', () => {
    // 12月31日 09:00 → 1月2日 09:00（2027-01-01 周五计薪一天 + 12-31 一天）
    const r = earnedBetween(cfg, d(2026, 12, 31, 9), d(2027, 1, 2, 9))
    expect(r.regular).toBeCloseTo(2000, 2)
  })
  it('from > to 返回 0', () => {
    const r = earnedBetween(cfg, d(2026, 9, 2, 18), d(2026, 9, 2, 9))
    expect(r.regular).toBe(0)
    expect(r.overtime).toBe(0)
  })
  it('窗口边界不含右端点：恰在 18:00 结束无加班', () => {
    const r = earnedBetween(cfg, d(2026, 9, 2, 9), d(2026, 9, 2, 18))
    expect(r.regular).toBeCloseTo(1000, 2)
    expect(r.overtime).toBe(0)
  })
  it('月末至今的本月累计与逐日求和一致', () => {
    // 2026-09-01(周二)–09-06(周日)
    const r = earnedBetween(cfg, d(2026, 9, 1, 0), d(2026, 9, 6, 23, 59, 59))
    expect(r.regular).toBeCloseTo(4000, 2) // 周二至周五 4 天
  })
})

describe('状态机', () => {
  it('周末 → 休市', () => {
    expect(statusAt(cfg, d(2026, 9, 5, 10))).toBe('closed')
  })
  it('上班前 → 未开盘', () => {
    expect(statusAt(cfg, d(2026, 9, 2, 8, 59))).toBe('pre')
  })
  it('上午 → 交易中', () => {
    expect(statusAt(cfg, d(2026, 9, 2, 10))).toBe('trading')
  })
  it('午休时段 → 午间休市', () => {
    expect(statusAt(cfg, d(2026, 9, 2, 12, 30))).toBe('lunch')
  })
  it('下午 → 交易中', () => {
    expect(statusAt(cfg, d(2026, 9, 2, 15))).toBe('trading')
  })
  it('下班后 → 加班中', () => {
    expect(statusAt(cfg, d(2026, 9, 2, 18, 0, 1))).toBe('overtime')
  })
})

describe('校验', () => {
  it('合法配置无错误', () => {
    expect(validateConfig(cfg)).toEqual({})
    expect(validateConfig({ ...cfg, payMode: 'daily', amount: 300 })).toEqual({})
  })
  it('时间顺序错误逐字段提示', () => {
    const bad = { ...cfg, workStart: '13:00', lunchStart: '12:00' }
    expect(validateConfig(bad).workStart).toBeTruthy()
  })
  it('非正金额报错', () => {
    expect(validateConfig({ ...cfg, amount: 0 }).amount).toBeTruthy()
  })
  it('倍率小于 1 报错', () => {
    expect(validateConfig({ ...cfg, overtimeRate: 0.8 }).overtimeRate).toBeTruthy()
  })
  it('toMinutes 解析与非法输入', () => {
    expect(toMinutes('09:30')).toBe(570)
    expect(toMinutes('24:00')).toBeNaN()
  })
})

describe('格式化', () => {
  it('金额千分位与两位小数', () => {
    expect(formatYuan(4821.335)).toMatch(/^¥4,821\.3[34]$/)
  })
  it('费率四位小数', () => {
    expect(formatRate(0.0341)).toBe('+¥0.0341/秒')
  })
  it('时长补零', () => {
    expect(formatHMS(2 * 3600 + 13 * 60 + 25)).toBe('02:13:25')
  })
})
