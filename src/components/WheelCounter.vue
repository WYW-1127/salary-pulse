<script setup lang="ts">
import { computed } from 'vue'
import WheelCell from './WheelCell.vue'

const props = defineProps<{ value: number }>()

const INT_DIGITS = 5

/** 金额 → 定长数位序列：5 位整数 + 2 位小数（小数点单独渲染） */
const digits = computed<number[]>(() => {
  const safe = Number.isFinite(props.value) ? props.value : 0
  const [int, dec] = safe.toFixed(2).split('.')
  const padded = int.padStart(INT_DIGITS, '0').slice(-INT_DIGITS)
  return [...padded.split(''), ...dec.split('')].map(Number)
})
</script>

<template>
  <div class="wheels" role="timer" aria-label="今日已赚金额">
    <span class="yen" aria-hidden="true">¥</span>
    <template v-for="(d, i) in digits" :key="i">
      <span v-if="i === INT_DIGITS" class="dot" aria-hidden="true">.</span>
      <WheelCell :digit="d" />
    </template>
    <span class="sr-only">{{ value.toFixed(2) }} 元</span>
  </div>
</template>

<style scoped>
.wheels {
  display: flex;
  gap: 0.06em;
  align-items: center;
  font-family: var(--digit-font);
  font-weight: 700;
  font-size: clamp(56px, 12vw, 132px);
  color: #14181c;
  font-variant-numeric: tabular-nums;
}

.yen {
  font-size: 0.52em;
  color: var(--ink-soft);
  margin-right: 0.16em;
  align-self: center;
  line-height: 1;
  padding-bottom: 0.1em;
}

.dot {
  font-size: 0.9em;
  color: var(--ink-soft);
  padding: 0 0.02em;
  align-self: flex-end;
  line-height: 1;
  padding-bottom: 0.16em;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
