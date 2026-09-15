<script setup lang="ts">
import type { SatelliteAcquisition } from "./MapView.vue";

defineProps<{
  latestAcquisition?: SatelliteAcquisition | null;
}>();
</script>

<template>
  <header class="header">
    <div class="brand"><span class="mark"></span><b>Taliabu Environmental Monitor</b></div>
    <div class="mid">
      <span>Latest acquisition</span>
      <template v-if="latestAcquisition">
        <b class="mono">{{ latestAcquisition.date }}</b>
        <span class="sep">·</span>
        <span>cloud</span><b class="mono">{{ latestAcquisition.cloudCover != null ? `${latestAcquisition.cloudCover.toFixed(1)}%` : '-' }}</b>
      </template>
      <b v-else class="mono">Loading</b>
    </div>
    <div class="actions">
      <button class="btn btn-ghost-dark">Compare</button>
      <button class="btn btn-primary">Export</button>
    </div>
  </header>
</template>

<style scoped>
.header {
  grid-area: header;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  background: var(--ink);
  color: #fff;
  border-bottom: 1px solid #0B140F;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand .mark {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--cat-environment);
}

.brand b {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: .01em;
}

.mid {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: #C7CDBE;
}

.mid b {
  color: #fff;
  font-weight: 500;
}

.sep {
  color: #4B584F;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  padding: 7px 13px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  line-height: 1;
}

.btn-primary {
  background: var(--cat-environment);
  color: #fff;
}

.btn-ghost-dark {
  background: transparent;
  color: #E7E9DD;
  border-color: #3A473F;
}
</style>
