import { describe, expect, it } from 'vitest'
import { clampBoundsIntoDisplay } from '../electron/lib/bounds.cjs'

const WA = { x: 0, y: 0, width: 1920, height: 1040 } // 主屏工作区（去掉任务栏）

describe('clampBoundsIntoDisplay', () => {
  it('窗口完整在工作区内时原样保留', () => {
    const b = { x: 100, y: 200, width: 328, height: 146 }
    expect(clampBoundsIntoDisplay(b, WA)).toEqual(b)
  })

  it('拖出右/下边界时钳回可见区域', () => {
    const out = clampBoundsIntoDisplay({ x: 1800, y: 1000, width: 328, height: 146 }, WA)
    expect(out.x).toBe(1920 - 328)
    expect(out.y).toBe(1040 - 146)
  })

  it('拖出左/上边界（负坐标）时钳回工作区原点', () => {
    const out = clampBoundsIntoDisplay({ x: -500, y: -80, width: 328, height: 146 }, WA)
    expect(out.x).toBe(0)
    expect(out.y).toBe(0)
  })

  it('副屏工作区有偏移时以该工作区为基准', () => {
    const secondary = { x: -1080, y: 0, width: 1080, height: 1000 }
    const out = clampBoundsIntoDisplay({ x: -1100, y: 990, width: 328, height: 146 }, secondary)
    expect(out.x).toBe(-1080)
    expect(out.y).toBe(1000 - 146)
  })

  it('窗口比工作区还大时缩到工作区大小并贴原点', () => {
    const tiny = { x: 0, y: 0, width: 800, height: 600 }
    const out = clampBoundsIntoDisplay({ x: 100, y: 50, width: 4000, height: 2000 }, tiny)
    expect(out).toEqual({ x: 0, y: 0, width: 800, height: 600 })
  })
})
