<script setup lang="ts">
import { computed } from 'vue'
import type { WorkStatus } from '../lib/calc/status'
import { STATUS_LABEL } from '../lib/calc/status'

const props = defineProps<{ status: WorkStatus; dateText: string }>()
defineEmits<{ 'open-settings': [] }>()

const active = computed(() => props.status === 'trading' || props.status === 'overtime')
</script>

<template>
  <header class="bar">
    <span class="status" :class="{ active }">
      <i class="dot" aria-hidden="true"></i>{{ STATUS_LABEL[status] }}
    </span>
    <span class="date">{{ dateText }}</span>
    <button class="gear" type="button" aria-label="打开设置" @click="$emit('open-settings')">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
        stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3.2" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.08A1.7 1.7 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.08A1.7 1.7 0 0 0 20.91 10H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z" />
      </svg>
      设置
    </button>
  </header>
</template>

<style scoped>
.bar {
  display: flex;
  align-items: center;
  gap: 18px;
  font-size: 15px;
  color: var(--ink-soft);
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  letter-spacing: 0.08em;
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--line-strong);
}

.status.active {
  color: var(--accent);
}

.status.active .dot {
  background: var(--accent);
  animation: breathe 2s ease-in-out infinite;
}

@keyframes breathe {
  50% {
    opacity: 0.35;
  }
}

.date {
  margin-left: auto;
  letter-spacing: 0.04em;
}

.gear {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: var(--ink-soft);
  font-size: 15px;
  padding: 8px 6px;
  min-height: 44px;
}

.gear:hover {
  color: var(--ink);
}

@media (max-width: 767px) {
  .date {
    display: none;
  }
}
</style>
