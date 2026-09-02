/** 金额（元）→ "¥4,821.33" */
export function formatYuan(v: number, digits = 2): string {
  return (
    '¥' +
    v.toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits })
  )
}

/** 费率（元/秒）→ "+¥0.0341/秒" */
export function formatRate(ratePerSecond: number): string {
  return `+¥${ratePerSecond.toFixed(4)}/秒`
}

/** 秒数 → "02:13:25" */
export function formatHMS(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return [h, m, sec].map((n) => String(n).padStart(2, '0')).join(':')
}

/** Date → "2026-09-02 周二" */
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
export function formatDateCN(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day} ${WEEKDAYS[d.getDay()]}`
}
