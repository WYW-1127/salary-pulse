export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

/** 把窗口边界钳回指定显示器工作区，保证仍可见（见 bounds.cjs） */
export declare function clampBoundsIntoDisplay(bounds: Bounds, workArea: Bounds): Bounds
