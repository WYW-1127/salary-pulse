import { DEFAULT_CONFIG, type SalaryConfig } from './calc/types'
import { validateConfig } from './calc/validate'

const KEY = 'salary-pulse.config.v1'

/** 读取本地配置；缺失、损坏或校验不过一律返回 null（视为未配置） */
export function loadConfig(): SalaryConfig | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (validateConfig(parsed) && Object.keys(validateConfig(parsed)).length === 0) {
      return parsed as SalaryConfig
    }
    return null
  } catch {
    return null
  }
}

export function saveConfig(cfg: SalaryConfig): void {
  localStorage.setItem(KEY, JSON.stringify(cfg))
}

export { DEFAULT_CONFIG }
