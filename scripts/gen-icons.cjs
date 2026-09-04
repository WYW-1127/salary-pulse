/**
 * 生成应用图标：托盘 16/32 PNG（透明底表身）+ 安装包 256 ICO（favicon 同款暖白圆角方块）。
 * 纯 Node 实现（zlib + 手写 PNG/ICO 封装），无第三方依赖；产物提交进 assets/。
 */
const zlib = require('node:zlib')
const fs = require('node:fs')
const path = require('node:path')

/* ---------- PNG 编码 ---------- */

const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePNG(width, height, rgba) {
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* ---------- 画布与形状（4x 超采样抗锯齿） ---------- */

const INK = [28, 36, 43] // #1C242B
const PAPER = [244, 243, 239] // #F4F3EF
const RED = [179, 57, 43] // #B3392B

function makeCanvas(size) {
  return { size, data: Buffer.alloc(size * size * 4) }
}

function blendPixel(cv, x, y, [r, g, b], alpha) {
  if (x < 0 || y < 0 || x >= cv.size || y >= cv.size || alpha <= 0) return
  const i = (y * cv.size + x) * 4
  const sa = alpha
  const da = cv.data[i + 3] / 255
  const oa = sa + da * (1 - sa)
  if (oa <= 0) return
  cv.data[i] = Math.round((r * sa + cv.data[i] * da * (1 - sa)) / oa)
  cv.data[i + 1] = Math.round((g * sa + cv.data[i + 1] * da * (1 - sa)) / oa)
  cv.data[i + 2] = Math.round((b * sa + cv.data[i + 2] * da * (1 - sa)) / oa)
  cv.data[i + 3] = Math.round(oa * 255)
}

function paintRoundRect(cv, { x0, y0, x1, y1, r }, color) {
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) {
      const cx = Math.max(x0 + r, Math.min(x + 0.5, x1 - r))
      const cy = Math.max(y0 + r, Math.min(y + 0.5, y1 - r))
      const dx = x + 0.5 - cx
      const dy = y + 0.5 - cy
      if (dx * dx + dy * dy <= r * r) blendPixel(cv, x, y, color, 1)
    }
  }
}

function paintCircle(cv, cx, cy, r, color) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const dx = x + 0.5 - cx
      const dy = y + 0.5 - cy
      if (dx * dx + dy * dy <= r * r) blendPixel(cv, x, y, color, 1)
    }
  }
}

function downsample(cv, size, ss) {
  const out = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const i = ((y * ss + sy) * size * ss + (x * ss + sx)) * 4
          const al = cv.data[i + 3] / 255
          r += cv.data[i] * al
          g += cv.data[i + 1] * al
          b += cv.data[i + 2] * al
          a += al
        }
      }
      const o = (y * size + x) * 4
      if (a > 0) {
        out[o] = Math.round(r / a)
        out[o + 1] = Math.round(g / a)
        out[o + 2] = Math.round(b / a)
        out[o + 3] = Math.round((a / (ss * ss)) * 255)
      }
    }
  }
  return out
}

/* ---------- 两个构图 ---------- */

/** 托盘：透明底 + 深色表身 + 朱红/瓷白双点位 */
function renderMeter(size, ss) {
  const cv = makeCanvas(size * ss)
  const S = size * ss
  paintRoundRect(cv, { x0: 0.16 * S, y0: 0.28 * S, x1: 0.84 * S, y1: 0.72 * S, r: 0.09 * S }, INK)
  paintCircle(cv, 0.37 * S, 0.5 * S, 0.095 * S, RED)
  paintCircle(cv, 0.63 * S, 0.5 * S, 0.095 * S, PAPER)
  return downsample(cv, size, ss)
}

/** 应用图标：favicon 同款 —— 暖白圆角方块仪表 */
function renderTile(size, ss) {
  const cv = makeCanvas(size * ss)
  const S = size * ss
  paintRoundRect(cv, { x0: 0.02 * S, y0: 0.02 * S, x1: 0.98 * S, y1: 0.98 * S, r: 0.2 * S }, PAPER)
  paintRoundRect(cv, { x0: 0.22 * S, y0: 0.34 * S, x1: 0.78 * S, y1: 0.66 * S, r: 0.07 * S }, INK)
  paintCircle(cv, 0.375 * S, 0.5 * S, 0.069 * S, RED)
  paintCircle(cv, 0.594 * S, 0.5 * S, 0.069 * S, PAPER)
  return downsample(cv, size, ss)
}

/* ---------- ICO 封装（内嵌 256px PNG，Vista+ 支持） ---------- */

function buildIco(png256) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(1, 4) // 1 张图
  const entry = Buffer.alloc(16)
  entry[0] = 0 // 宽 256 → 0
  entry[1] = 0 // 高 256 → 0
  entry.writeUInt16LE(1, 4) // planes
  entry.writeUInt16LE(32, 6) // bpp
  entry.writeUInt32LE(png256.length, 8)
  entry.writeUInt32LE(6 + 16, 12) // 数据偏移
  return Buffer.concat([header, entry, png256])
}

/* ---------- 输出 ---------- */

const outDir = path.join(__dirname, '..', 'assets')
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, 'tray.png'), encodePNG(16, 16, renderMeter(16, 4)))
fs.writeFileSync(path.join(outDir, 'tray@2x.png'), encodePNG(32, 32, renderMeter(32, 4)))
fs.writeFileSync(path.join(outDir, 'icon.ico'), buildIco(encodePNG(256, 256, renderTile(256, 4))))
console.log('icons ->', outDir)
