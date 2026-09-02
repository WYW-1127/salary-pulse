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
}

export const DEFAULT_CONFIG: SalaryConfig = {
  payMode: 'monthly',
  amount: 10000,
  workStart: '09:00',
  lunchStart: '12:00',
  lunchEnd: '13:00',
  workEnd: '18:00',
  overtimeRate: 1.5,
}
