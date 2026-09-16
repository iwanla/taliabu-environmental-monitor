<script setup lang="ts">
import { ref } from "vue";
import { useLayers } from "../composables/useLayers";
import type { LayerCategory } from "@/shared/types/layers";
import type { BasemapMode } from "@/shared/types/layers";

const { layers, isVisible, getOpacity, toggleLayer, setOpacity, getByCategory } = useLayers();

const props = defineProps<{ drawMode?: boolean; basemapMode: BasemapMode; miningImpact?: boolean }>();
const emit = defineEmits<{ drawAoi: []; basemapChanged: [mode: BasemapMode]; toggleMiningImpact: [] }>();

const categories: { id: LayerCategory; label: string; color: string }[] = [
  { id: "satellite", label: "Satellite", color: "var(--cat-satellite)" },
  { id: "environment", label: "Environment", color: "var(--cat-environment)" },
  { id: "mining", label: "Mining", color: "var(--cat-mining)" },
  { id: "hydrology", label: "Hydrology", color: "var(--cat-hydrology)" },
  { id: "coastal", label: "Coastal", color: "var(--cat-coastal)" },
  { id: "terrain", label: "Terrain", color: "var(--cat-terrain)" },
  { id: "administrative", label: "Administrative", color: "var(--ink-faint)" },
];

const collapsed = ref<Set<LayerCategory>>(new Set());

function toggleCollapse(id: LayerCategory) {
  if (collapsed.value.has(id)) collapsed.value.delete(id);
  else collapsed.value.add(id);
}
</script>

<template>
  <aside class="layers">
    <button
      class="mining-impact"
      :class="{ active: props.miningImpact }"
      type="button"
      :aria-pressed="!!props.miningImpact"
      @click="emit('toggleMiningImpact')"
    >
      {{ props.miningImpact ? "Exit Mining Impact" : "Mining Impact mode" }}
    </button>

    <div class="panel-title">Basemap</div>
    <div class="basemap-row">
      <button v-for="mode in ([['vector', 'Vector'], ['satellite', 'Satellite'], ['minimal', 'Minimal']] as [BasemapMode, string][])" :key="mode[0]" class="tab" :class="{ active: props.basemapMode === mode[0] }" type="button" @click="emit('basemapChanged', mode[0])">
        {{ mode[1] }}
      </button>
    </div>

    <template v-for="cat in categories" :key="cat.id">
      <div v-if="getByCategory(cat.id).length > 0" class="cat-header" @click="toggleCollapse(cat.id)">
        <span class="dot" :style="{ background: cat.color }"></span>
        {{ cat.label }}
        <span class="chevron" :class="{ collapsed: collapsed.has(cat.id) }">▸</span>
      </div>
      <template v-if="!collapsed.has(cat.id)">
        <div
          v-for="layer in getByCategory(cat.id)"
          :key="layer.id"
          class="layer-row"
        >
          <span class="name">
            {{ layer.name }}
            <span v-if="layer.sub" class="sub">{{ layer.sub }}</span>
          </span>
          <span class="opacity-val">{{ Math.round(getOpacity(layer.id) * 100) }}%</span>
          <input
            class="opacity"
            type="range"
            min="0"
            max="100"
            :value="getOpacity(layer.id) * 100"
            @input="setOpacity(layer.id, Number(($event.target as HTMLInputElement).value) / 100)"
          >
          <label class="switch">
            <input
              type="checkbox"
              :checked="isVisible(layer.id)"
              @change="toggleLayer(layer.id)"
            >
            <span class="track"></span>
            <span class="thumb"></span>
          </label>
        </div>
      </template>
    </template>

    <div class="aoi-cta">
      <p>Draw an area of interest to get vegetation, water and proximity statistics.</p>
      <button class="btn btn-secondary" style="width:100%; justify-content:center;" :class="{ active: drawMode }" @click="emit('drawAoi')">
        {{ drawMode ? "Cancel drawing" : "Draw AOI" }}
      </button>
    </div>
  </aside>
</template>

<style scoped>
.layers {
  grid-area: layers;
  background: var(--paper-raised);
  border-right: 1px solid var(--line);
  overflow-y: auto;
  padding: 10px;
}

.mining-impact {
  width: 100%;
  font-family: var(--font-body);
  font-size: 12.5px;
  font-weight: 600;
  padding: 8px 0;
  margin-bottom: 12px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  background: var(--paper-sunk);
  color: var(--ink-soft);
  cursor: pointer;
}

.mining-impact.active {
  background: var(--cat-mining, #B4652A);
  border-color: var(--cat-mining, #B4652A);
  color: #F7F8F1;
}

.panel-title {
  padding: 14px 16px 8px;
  font-size: 12.5px;
  color: var(--ink-faint);
  font-family: var(--font-mono);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.basemap-row {
  display: flex;
  gap: 6px;
  padding: 0 16px 12px;
}

.basemap-row .tab {
  flex: 1;
  text-align: center;
  font-size: 11.5px;
  padding: 6px 4px;
  border: 0;
  border-radius: var(--radius-sm);
  background: var(--paper-sunk);
  color: var(--ink-soft);
  font-family: inherit;
  cursor: pointer;
}

.basemap-row .tab.active {
  background: var(--ink);
  color: #fff;
}

.cat-header {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-faint);
  padding: 12px 16px 4px;
  display: flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  user-select: none;
}

.cat-header .chevron {
  margin-left: auto;
  font-size: 10px;
  transition: transform .15s;
}

.cat-header .chevron.collapsed {
  transform: rotate(-90deg);
}

.cat-header .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.layer-row {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 16px;
  border-top: 1px solid var(--line);
}

.layer-row:first-of-type {
  border-top: none;
}

.layer-row .name {
  flex: 1;
  font-size: 13px;
}

.layer-row .name .sub {
  display: block;
  font-size: 10.5px;
  color: var(--ink-faint);
  font-family: var(--font-mono);
  margin-top: 1px;
}

.layer-row .opacity {
  width: 42px;
  accent-color: var(--ink-soft);
}

.layer-row .opacity-val {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--ink-faint);
  width: 28px;
  text-align: right;
}

.switch {
  position: relative;
  width: 30px;
  height: 17px;
  flex: none;
}

.switch input {
  opacity: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  position: absolute;
  cursor: pointer;
}

.switch .track {
  position: absolute;
  inset: 0;
  background: var(--line-strong);
  border-radius: 20px;
  transition: background .15s;
}

.switch .thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #fff;
  transition: transform .15s;
}

.switch input:checked + .track {
  background: var(--status-good);
}

.switch input:checked + .track + .thumb {
  transform: translateX(13px);
}

.aoi-cta {
  margin: 16px;
  padding: 12px;
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius-md);
  text-align: center;
}

.aoi-cta p {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--ink-faint);
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

.btn-secondary {
  background: var(--paper-raised);
  color: var(--ink);
  border-color: var(--line-strong);
}
</style>
