<script setup lang="ts">
defineProps<{ label: string; value: string; active?: boolean }>()
</script>

<template>
  <div class="gauge" :class="{ active }">
    <span class="k">{{ label }}</span>
    <span class="v">{{ value }}</span>
  </div>
</template>

<style scoped>
.gauge {
  width: clamp(112px, 13vw, 148px);
  aspect-ratio: 1;
  border: 2px solid var(--ink);
  border-radius: 50%;
  display: grid;
  place-items: center;
  text-align: center;
  background: var(--panel-hi);
  box-shadow: inset 0 2px 8px rgba(28, 36, 43, 0.08), 0 1px 0 rgba(255, 255, 255, 0.8);
  padding: 8px;
}

.gauge:not(.active) {
  border-color: var(--line-strong);
}

.k {
  display: block;
  font-size: 12px;
  letter-spacing: 0.18em;
  color: var(--ink-soft);
}

.v {
  display: block;
  font-family: var(--digit-font);
  font-size: clamp(17px, 2vw, 22px);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.gauge.active {
  border-color: var(--accent);
}

.gauge.active .v {
  color: var(--accent);
}
</style>
