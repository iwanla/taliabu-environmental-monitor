<script setup lang="ts">
import { onMounted } from "vue";
import { useDatasetMetadata } from "../composables/useDatasetMetadata";

const props = defineProps<{
  feature: GeoJSON.Feature | null;
  layerId: string | null;
}>();

const { load, getByLayerId } = useDatasetMetadata();

onMounted(() => load());

function formatKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (typeof val === "number") return val.toLocaleString();
  return String(val);
}
</script>

<template>
  <aside class="inspector">
    <template v-if="feature?.properties">
      <div class="insp-block">
        <h5>{{ feature.properties.name || "Unnamed Feature" }}</h5>
        <div class="sub" v-if="feature.properties.type">{{ formatKey(String(feature.properties.type)) }}</div>

        <div
          v-for="(val, key) in feature.properties"
          :key="String(key)"
          class="metric-row"
        >
          <span>{{ formatKey(String(key)) }}</span>
          <span class="v">{{ formatValue(val) }}</span>
        </div>

        <template v-if="layerId && getByLayerId(layerId)">
          <div class="meta-heading">Data source</div>
          <div class="metric-row"><span>Source</span><span class="v">{{ getByLayerId(layerId)!.source }}</span></div>
          <div class="metric-row"><span>Version</span><span class="v">{{ getByLayerId(layerId)!.version }}</span></div>
          <div class="metric-row"><span>Updated</span><span class="v">{{ getByLayerId(layerId)!.retrievedAt }}</span></div>
          <div class="metric-row"><span>Refresh</span><span class="v">{{ getByLayerId(layerId)!.refreshPolicy }}</span></div>
        </template>
      </div>
    </template>

    <template v-else>
      <div class="insp-block empty-state">
        <h5>No feature selected</h5>
        <div class="sub">Click on a map feature to inspect</div>
        <p>Click on any visible layer feature on the map to view its properties and metadata.</p>
      </div>
    </template>

    <div class="insp-block">
      <h5>Quick Stats</h5>
      <div class="sub">Overview of current view</div>
      <div class="metric-row"><span>Active layers</span><span class="v">—</span></div>
      <div class="metric-row"><span>Visible features</span><span class="v">—</span></div>
    </div>

    <div class="insp-block empty-state">
      <h5>No AOI selected</h5>
      <div class="sub">Draw an area on the map to view statistics</div>
      <p>Click "Draw AOI" in the layers panel, then trace a polygon on the map. Vegetation, water, and proximity data will appear here.</p>
    </div>
  </aside>
</template>

<style scoped>
.inspector {
  grid-area: inspector;
  background: var(--paper-raised);
  border-left: 1px solid var(--line);
  overflow-y: auto;
}

.insp-block {
  padding: 14px 16px;
  border-bottom: 1px solid var(--line);
}

.insp-block h5 {
  font-size: 13.5px;
  margin-bottom: 2px;
}

.insp-block .sub {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-faint);
  margin-bottom: 10px;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-top: 1px solid var(--line);
  font-size: 12.5px;
}

.metric-row:first-of-type {
  border-top: none;
}

.metric-row .v {
  font-family: var(--font-mono);
  color: var(--ink);
}

.meta-heading {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-faint);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--line);
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 20px;
}

.badge-low {
  background: #F3E1DB;
  color: var(--status-low);
}

.badge .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.empty-state {
  border-top: 2px dashed var(--line-strong);
  opacity: 0.7;
}

.empty-state p {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--ink-faint);
}
</style>
