export type PayMode = 'monthly' | 'annual' | 'daily'

export interface SalaryConfig {
  /** 计薪模式：月薪 / 年薪总包 / 日薪 */
  payMode: PayMode
  /** 金额（元）：月薪、年薪总包或日薪 */
  amount: number
  /** 上班时间 "HH:mm" */
  workStart: string
  /** 午休开始 "HH:mm" */
  lunchStart: string
  /** 午休结束 "HH:mm" */
  lunchEnd: string
  /** 下班时间 "HH:mm" */
  workEnd: string
  /** 加班费倍率 */
  overtimeRate: number
  /** 周末（周六/日）是否也计薪 */
  weekendWork: boolean
  /** 周末计薪倍率（相对每秒费率，独立于工作日加班倍率；1 = 正常薪资） */
  weekendRate: number
}

export const DEFAULT_CONFIG: SalaryConfig = {
  payMode: 'monthly',
  amount: 10000,
  workStart: '09:00',
  lunchStart: '12:00',
  lunchEnd: '13:00',
  workEnd: '18:00',
  overtimeRate: 1.5,
  weekendWork: false,
  weekendRate: 1,
}
