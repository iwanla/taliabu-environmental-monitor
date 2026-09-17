<script setup lang="ts">
import { computed } from "vue";
import type { SatelliteAcquisition } from "./MapView.vue";

const props = defineProps<{
  scenes: SatelliteAcquisition[];
  selectedScene: SatelliteAcquisition | null;
  activePreset?: string;
  compareMode?: "swipe" | "split" | null;
  sceneB?: SatelliteAcquisition | null;
}>();

const emit = defineEmits<{
  sceneSelected: [scene: SatelliteAcquisition];
  shortcutSelected: [preset: string];
  toggleCompare: [];
  toggleCompareMode: [];
}>();

const timelineScenes = computed(() => [...props.scenes].sort((a, b) => a.acquiredAt.localeCompare(b.acquiredAt)));

const timelineEvents = computed(() => timelineScenes.value.map((scene, index, events) => ({
  scene,
  gapDays: index === 0 ? 0 : Math.round((Date.parse(scene.acquiredAt) - Date.parse(events[index - 1].acquiredAt)) / 86400000),
})));

function formatDate(iso: string) {
  return iso.slice(0, 10);
}

const shortcuts = [
  { label: "Latest", preset: "latest" },
  { label: "1 Bulan", preset: "1m" },
  { label: "6 Bulan", preset: "6m" },
  { label: "1 Tahun", preset: "1y" },
];
</script>

<template>
  <div class="timeline">
    <div class="shortcuts">
      <button
        v-for="s in shortcuts"
        :key="s.preset"
        class="shortcut-btn"
        :class="{ active: s.preset === (activePreset ?? 'latest') }"
        @click="emit('shortcutSelected', s.preset)"
      >
        {{ s.label }}
      </button>
      <button
        class="shortcut-btn compare-btn"
        :class="{ active: compareMode }"
        :disabled="scenes.length < 2 && !compareMode"
        @click="emit('toggleCompare')"
      >
        Compare
      </button>
      <button
        v-if="compareMode"
        class="shortcut-btn mode-btn"
        @click="emit('toggleCompareMode')"
      >
        {{ compareMode === "swipe" ? "Swipe" : "Split" }}
      </button>
    </div>

    <div class="track-wrap">
      <div class="scenes-scroll">
        <button
          v-for="event in timelineEvents"
          :key="event.scene.id"
          class="scene-chip"
          :style="{ marginLeft: event.gapDays ? `${event.gapDays * 3}px` : undefined }"
          :title="`${formatDate(event.scene.acquiredAt)} · ${event.scene.tileCount} Sentinel-2 tiles · ${event.scene.quality}`"
          :class="{
            active: event.scene.id === selectedScene?.id,
            'scene-b': event.scene.id === sceneB?.id && compareMode,
            warn: event.scene.quality === 'cloudy',
            partial: event.scene.quality === 'partial',
          }"
          @click="emit('sceneSelected', event.scene)"
        >
          <span class="scene-date"><i class="quality-dot" :class="event.scene.quality" />{{ formatDate(event.scene.acquiredAt) }}</span>
          <span class="scene-cloud">
            {{ event.scene.cloudCover != null ? `${Math.round(event.scene.cloudCover)}%` : '-' }}
          </span>
        </button>
      </div>
    </div>

    <div class="date-readout">
      <template v-if="compareMode && selectedScene && sceneB">
        <span class="date-a">{{ formatDate(selectedScene.acquiredAt) }}</span>
        <span class="date-sep"> / </span>
        <span class="date-b">{{ formatDate(sceneB.acquiredAt) }}</span>
      </template>
      <template v-else-if="selectedScene">
        {{ formatDate(selectedScene.acquiredAt) }}
        <span class="cloud-badge" :class="{ warn: selectedScene.quality === 'cloudy' }">
          {{ selectedScene.quality }}
        </span>
      </template>
      <template v-else>No scene</template>
    </div>
  </div>
</template>

<style scoped>
.timeline {
  background: var(--paper-raised);
  border-top: 1px solid var(--line);
  padding: 10px 20px 10px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.shortcuts {
  flex: none;
  display: flex;
  gap: 4px;
}

.shortcut-btn {
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 3px;
  border: 1px solid var(--line);
  background: var(--paper-sunk);
  color: var(--ink-soft);
  cursor: pointer;
  transition: all 0.15s;
}

.shortcut-btn:hover {
  border-color: var(--cat-satellite);
  color: var(--cat-satellite);
}

.shortcut-btn.active {
  background: var(--cat-satellite);
  color: #fff;
  border-color: var(--cat-satellite);
}

.track-wrap {
  flex: 1;
  overflow: hidden;
}

.scenes-scroll {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: thin;
  padding: 2px 0;
}

.scene-chip {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 5px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line);
  background: var(--paper-sunk);
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-soft);
  transition: all 0.15s;
}

.scene-chip:hover {
  border-color: var(--cat-satellite);
}

.scene-chip.active {
  background: var(--cat-satellite);
  color: #fff;
  border-color: var(--cat-satellite);
}

.scene-chip.warn {
  border-color: #c0392b;
}

.scene-chip.partial {
  border-style: dashed;
}

.scene-chip.active.warn {
  background: #c0392b;
  border-color: #c0392b;
}

.scene-date {
  font-weight: 500;
}

.quality-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 5px;
  border-radius: 50%;
  background: #2f7d4a;
}

.quality-dot.good {
  background: #c68a22;
}

.quality-dot.cloudy {
  background: #c0392b;
}

.quality-dot.partial {
  background: #7d8790;
}

.scene-cloud {
  font-size: 10px;
  opacity: 0.7;
}

.scene-chip.active .scene-cloud {
  color: rgba(255, 255, 255, 0.8);
}

.scene-chip.warn .scene-cloud {
  color: #c0392b;
}

.scene-chip.active.warn .scene-cloud {
  color: rgba(255, 255, 255, 0.8);
}

.cloud-badge {
  margin-left: 6px;
  font-size: 11px;
  color: var(--ink-soft);
}

.cloud-badge.warn {
  color: #c0392b;
}

.compare-btn {
  border-color: var(--cat-satellite);
  color: var(--cat-satellite);
}

.compare-btn.active {
  background: var(--cat-satellite);
  color: #fff;
}

.shortcut-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.scene-chip.scene-b {
  border-color: var(--ink-soft);
  background: var(--paper-raised);
}

.date-readout {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ink);
  flex: none;
  text-align: right;
  min-width: 120px;
  white-space: nowrap;
}

.date-a {
  color: var(--cat-satellite);
  font-weight: 600;
}

.date-sep {
  color: var(--ink-faint);
}

.date-b {
  color: var(--ink-soft);
}

@media (max-width: 768px) {
  .timeline {
    flex-wrap: wrap;
    padding: 8px 12px;
    gap: 8px;
  }

  .shortcuts {
    order: -1;
    width: 100%;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .shortcuts::-webkit-scrollbar {
    display: none;
  }

  .shortcut-btn {
    padding: 6px 10px;
    font-size: 12px;
  }

  .scene-chip {
    padding: 6px 12px;
    font-size: 12px;
  }

  .date-readout {
    min-width: auto;
    font-size: 11px;
  }
}
</style>
