<script setup lang="ts">
import type { SatelliteAcquisition } from "./MapView.vue";

  defineProps<{
  latestAcquisition?: SatelliteAcquisition | null;
  mobileLayersOpen?: boolean;
  mobileInspectorOpen?: boolean;
}>();

defineEmits<{
  openGuide: [];
  toggleMobileLayers: [];
  toggleMobileInspector: [];
}>();
</script>

<template>
  <header class="header">
    <div class="header-left">
      <button
        class="mobile-toggle"
        type="button"
        aria-label="Toggle layers panel"
        @click="$emit('toggleMobileLayers')"
      >
        <span class="hamburger" :class="{ open: mobileLayersOpen }">
          <span></span><span></span><span></span>
        </span>
      </button>
      <div class="brand"><span class="mark"></span><b>Taliabu Environmental Monitor</b></div>
    </div>
    <div class="mid">
      <span>Latest acquisition</span>
      <template v-if="latestAcquisition">
        <b class="mono">{{ latestAcquisition.date }}</b>
        <span class="sep">·</span>
        <span>cloud</span><b class="mono">{{ latestAcquisition.cloudCover != null ? `${latestAcquisition.cloudCover.toFixed(1)}%` : '-' }}</b>
      </template>
      <b v-else class="mono">Loading</b>
    </div>
    <div class="header-right">
      <button class="btn btn-primary" type="button" @click="$emit('openGuide')">Guide</button>
      <button
        class="mobile-toggle inspector-toggle"
        type="button"
        aria-label="Toggle inspector panel"
        @click="$emit('toggleMobileInspector')"
      >
        <span class="info-icon" :class="{ open: mobileInspectorOpen }">i</span>
      </button>
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

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
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

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 13px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font: 600 13px/1 var(--font-body);
}

.btn-primary {
  padding: 7px 13px;
  background: var(--cat-environment);
  color: #fff;
}

.btn-primary:hover {
  background: #3A6431;
}

.btn-primary:focus-visible {
  outline: 2px solid var(--cat-hydrology);
  outline-offset: 2px;
}

.mobile-toggle {
  display: none;
  background: none;
  border: 0;
  cursor: pointer;
  padding: 4px;
}

.hamburger {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 20px;
}

.hamburger span {
  display: block;
  height: 2px;
  background: #fff;
  border-radius: 1px;
  transition: transform 0.2s, opacity 0.2s;
}

.hamburger.open span:nth-child(1) {
  transform: translateY(6px) rotate(45deg);
}

.hamburger.open span:nth-child(2) {
  opacity: 0;
}

.hamburger.open span:nth-child(3) {
  transform: translateY(-6px) rotate(-45deg);
}

.info-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, .7);
  font: 600 13px/1 var(--font-body);
  color: rgba(255, 255, 255, .7);
  transition: all 0.15s;
}

.info-icon.open {
  background: var(--cat-environment);
  border-color: var(--cat-environment);
  color: #fff;
}

@media (max-width: 768px) {
  .mobile-toggle {
    display: flex;
  }

  .mid {
    display: none;
  }
}
</style>
