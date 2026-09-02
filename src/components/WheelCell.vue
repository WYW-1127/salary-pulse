<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'

const props = defineProps<{ digit: number }>()

/** strip 滑块位置：0-9 正常数位，10 是 0 的复制位（供 9→0 正向滚完一圈） */
const idx = ref(clamp(props.digit))
/** 瞬移回 0 时禁用过渡 */
const snap = ref(false)
let timer: number | undefined

function clamp(d: number): number {
  return Math.min(9, Math.max(0, d))
}

watch(
  () => props.digit,
  (d, prev) => {
    if (d === prev) return
    clearTimeout(timer)
    if (prev === 9 && d === 0) {
      idx.value = 10
      timer = window.setTimeout(() => {
        snap.value = true
        idx.value = 0
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            snap.value = false
          }),
        )
      }, 260)
    } else {
      snap.value = false
      idx.value = clamp(d)
    }
  },
)

onUnmounted(() => clearTimeout(timer))
</script>

<template>
  <span class="wheel">
    <span
      class="strip"
      :class="{ snap }"
      :style="{ transform: `translateY(-${idx * 1.2}em)` }"
    >
      <i v-for="n in 11" :key="n">{{ (n - 1) % 10 }}</i>
    </span>
  </span>
</template>

<style scoped>
.wheel {
  display: block;
  width: 0.86em;
  height: 1.2em;
  overflow: hidden;
  border-radius: 0.12em;
  background: var(--wheel-face);
  border: 1px solid var(--line-strong);
  box-shadow: var(--shadow-inset-wheel);
}

.strip {
  display: block;
  transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;
}

.strip.snap {
  transition: none;
}

.strip i {
  display: block;
  height: 1.2em;
  line-height: 1.2em;
  text-align: center;
  font-style: normal;
}
</style>
