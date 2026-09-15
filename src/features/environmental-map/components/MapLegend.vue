<script setup lang="ts">
import { reactive } from "vue";
import { useLayers } from "../composables/useLayers";

defineProps<{
  groups?: { id: string; title: string; items: { label: string; color: string }[] }[];
}>();

const { isVisible } = useLayers();
const collapsed = reactive<Record<string, boolean>>({});
</script>

<template>
  <div class="legend-float">
    <div class="legend-title">Legend</div>
    <template v-for="group in groups" :key="group.id">
      <template v-if="isVisible(group.id)">
        <button class="group-title" type="button" :aria-expanded="!collapsed[group.id]" @click="collapsed[group.id] = !collapsed[group.id]">
          <span>{{ collapsed[group.id] ? "▸" : "▾" }}</span>{{ group.title }}
        </button>
        <div v-if="!collapsed[group.id]" class="group-items">
          <div v-for="item in group.items" :key="item.label" class="row">
            <span class="sw" :style="{ background: item.color }"></span>{{ item.label }}
          </div>
        </div>
      </template>
    </template>
    <div class="group-title static-title">Hydrology</div>
    <div class="row"><span class="sw" style="background:#3FA0AA"></span>River network</div>
    <div class="group-title static-title">Vegetation</div>
    <div class="row"><span class="sw" style="background:#46743A"></span>Vegetation (NDVI)</div>
    <div class="group-title static-title">Analysis</div>
    <div class="row"><span class="sw" style="background:#C1432B"></span>Surface disturbance</div>
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

.static-title {
  cursor: default;
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
