/**
 * 把窗口边界钳回指定显示器工作区，保证悬浮窗拖出屏幕/换了显示器后仍然可见。
 * 纯函数：被 electron/main.cjs 使用，也被 vitest 直接测试（不依赖 electron）。
 */
function clampBoundsIntoDisplay(bounds, workArea) {
  const width = Math.min(bounds.width, workArea.width)
  const height = Math.min(bounds.height, workArea.height)
  // 窗口比工作区还大时钳到原点，避免 Math.max/min 顺序产生负偏移
  const maxX = Math.max(workArea.x, workArea.x + workArea.width - width)
  const maxY = Math.max(workArea.y, workArea.y + workArea.height - height)
  return {
    width,
    height,
    x: Math.min(Math.max(bounds.x, workArea.x), maxX),
    y: Math.min(Math.max(bounds.y, workArea.y), maxY),
  }
}

module.exports = { clampBoundsIntoDisplay }
