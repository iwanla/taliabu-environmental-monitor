<script setup lang="ts">
import { computed, reactive } from "vue";
import { useLayers } from "../composables/useLayers";
import { staticLayers } from "../layers/static-layers";
import type { LayerCategory, MapLayerDefinition } from "@/shared/types/layers";

const props = defineProps<{
  groups?: { id: string; title: string; items: { label: string; color: string }[] }[];
}>();

const { isVisible } = useLayers();
const collapsed = reactive<Record<string, boolean>>({});

const CATEGORY_LABELS: Record<LayerCategory, string> = {
  satellite: "Satellite",
  environment: "Environment",
  mining: "Mining",
  hydrology: "Hydrology",
  coastal: "Coastal",
  terrain: "Terrain",
  administrative: "Administrative",
};

// mining-iup & watersheds get dynamic category colors via the `groups` prop
function hasDynamicLegend(def: MapLayerDefinition) {
  return def.id === "mining-iup" || def.id === "watersheds";
}

function mainColor(def: Extract<MapLayerDefinition, { type: "vector" }>): string {
  const p = def.paint as Record<string, string>;
  return def.layerType === "point"
    ? p["circle-stroke-color"] ?? p["circle-color"] ?? "#888"
    : p["fill-color"] ?? p["line-color"] ?? "#888";
}

const staticGroups = computed(() => {
  const out: { id: string; title: string; items: { label: string; color: string }[] }[] = [];
  for (const def of staticLayers) {
    if (!isVisible(def.id) || hasDynamicLegend(def)) continue;
    const items = def.legend ?? [{ label: def.name, color: mainColor(def as any) }];
    const group = out.find((g) => g.id === def.category);
    if (group) group.items.push(...items);
    else out.push({ id: def.category, title: CATEGORY_LABELS[def.category], items });
  }
  return out;
});

const allGroups = computed(() => [...staticGroups.value, ...(props.groups ?? [])]);
</script>

<template>
  <div class="legend-float">
    <div class="legend-title">Legend</div>
    <template v-for="group in allGroups" :key="group.id">
      <button class="group-title" type="button" :aria-expanded="!collapsed[group.id]" @click="collapsed[group.id] = !collapsed[group.id]">
        <span>{{ collapsed[group.id] ? "▸" : "▾" }}</span>{{ group.title }}
      </button>
      <div v-if="!collapsed[group.id]" class="group-items">
        <div v-for="item in group.items" :key="item.label" class="row">
          <span class="sw" :style="{ background: item.color }"></span>{{ item.label }}
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.legend-float {
  background: rgba(247, 248, 241, .95);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 10px 13px;
  font-size: 11.5px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 150px;
  max-height: 280px;
  overflow-y: auto;
}

.group-title {
  color: var(--ink);
  font-weight: 700;
  margin-top: 3px;
  border: 0;
  background: none;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.legend-title {
  color: var(--ink);
  font-weight: 700;
}

.group-items {
  padding-left: 16px;
}

.row {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--ink-soft);
}

.sw {
  width: 11px;
  height: 11px;
  border-radius: 3px;
  flex: none;
}
</style>
