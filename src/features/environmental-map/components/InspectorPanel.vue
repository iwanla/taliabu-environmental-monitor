<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useDatasetMetadata } from "../composables/useDatasetMetadata";
import { analyzeAoi, type AoiAnalysis } from "../composables/useAoiAnalysis";
import { CHANGE_RULES, type ChangeResult, type ChangeType } from "../composables/changeDetection";

const props = defineProps<{
  feature: GeoJSON.Feature | null;
  layerId: string | null;
  aoi?: GeoJSON.Polygon | null;
  aoiError?: string | null;
  sceneDate?: string | null;
  change?: ChangeResult | null;
  changeLoading?: boolean;
  changeError?: string | null;
}>();

const emit = defineEmits<{ clearAoi: []; runChange: [payload: { type: ChangeType; dateA: string; dateB: string }] }>();

const changeType = ref<ChangeType>("vegetation-loss");
const dateA = ref("");
const dateB = ref("");

watch(
  () => props.sceneDate,
  (d) => {
    if (!d || dateB.value) return;
    dateB.value = d.slice(0, 10);
    dateA.value = new Date(new Date(d).getTime() - 30 * 86400000).toISOString().slice(0, 10);
  },
  { immediate: true },
);

function runChange() {
  if (!dateA.value || !dateB.value) return;
  emit("runChange", { type: changeType.value, dateA: dateA.value, dateB: dateB.value });
}

const { load, getByLayerId } = useDatasetMetadata();

onMounted(() => load());

const analysis = ref<AoiAnalysis | null>(null);
const analyzing = ref(false);
const analysisFailed = ref(false);

watch(() => props.aoi, async (polygon) => {
  analysis.value = null;
  analysisFailed.value = false;
  if (!polygon) return;
  analyzing.value = true;
  try {
    analysis.value = await analyzeAoi(polygon);
  } catch {
    analysisFailed.value = true;
  }
  analyzing.value = false;
});

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

function formatM(m?: number): string {
  if (m == null) return "—";
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

function formatHa(ha?: number): string {
  if (ha == null) return "—";
  return ha >= 100 ? `${Math.round(ha).toLocaleString()} ha` : `${ha.toFixed(1)} ha`;
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

    <div v-if="aoiError" class="insp-block empty-state">
      <h5>AOI too large</h5>
      <div class="sub">Size limit exceeded</div>
      <p>{{ aoiError }}</p>
    </div>

    <div v-else-if="aoi" class="insp-block">
      <h5>Area of Interest</h5>
      <div class="sub">AOI statistics</div>
      <template v-if="analyzing">
        <div class="metric-row"><span>Area</span><span class="v">…</span></div>
      </template>
      <template v-else-if="analysisFailed">
        <div class="metric-row"><span>Error</span><span class="v">Analysis failed</span></div>
      </template>
      <template v-else-if="analysis">
        <div class="metric-row"><span>Area</span><span class="v">{{ formatHa(analysis.areaHa) }}</span></div>
        <div class="metric-row">
          <span>Within IUP permit</span>
          <span class="v">{{ analysis.permits.length ? `${analysis.permitPct.toFixed(1)}%` : "No" }}</span>
        </div>
        <div v-if="analysis.permits.length" class="metric-row">
          <span>Permit</span>
          <span class="v">{{ analysis.permits.join(", ") }}</span>
        </div>
        <div class="metric-row">
          <span>Nearest river</span>
          <span class="v">{{ analysis.nearestRiver ? `${analysis.nearestRiver.name} · ${formatM(analysis.nearestRiver.distanceM)}` : "—" }}</span>
        </div>
        <div class="metric-row">
          <span>Nearest settlement</span>
          <span class="v">{{ analysis.nearestSettlement ? `${analysis.nearestSettlement.name} · ${formatM(analysis.nearestSettlement.distanceM)}` : "—" }}</span>
        </div>
        <div class="metric-row">
          <span>Distance to coast</span>
          <span class="v">{{ formatM(analysis.coastDistanceM) }}</span>
        </div>
        <div class="metric-row">
          <span>Watershed</span>
          <span class="v">{{ analysis.watershed ?? "—" }}</span>
        </div>
      </template>

      <div class="meta-heading">Change detection</div>
      <select v-model="changeType" class="change-input" aria-label="Change type">
        <option value="vegetation-loss">Vegetation loss</option>
        <option value="new-bare-land">New bare land</option>
        <option value="water-change">Water change</option>
      </select>
      <div class="change-dates">
        <label>From<input v-model="dateA" type="date" class="change-input" /></label>
        <label>To<input v-model="dateB" type="date" class="change-input" /></label>
      </div>
      <button class="aoi-clear" :disabled="changeLoading || !dateA || !dateB" @click="runChange">
        {{ changeLoading ? "Running…" : "Run analysis" }}
      </button>
      <template v-if="changeError">
        <div class="metric-row"><span>Error</span><span class="v">{{ changeError }}</span></div>
      </template>
      <template v-else-if="change">
        <div class="metric-row"><span>Changed area</span><span class="v">{{ formatHa(change.changedHa) }}</span></div>
        <div class="metric-row"><span>Window</span><span class="v">{{ change.dateA }} → {{ change.dateB }}</span></div>
        <div class="metric-row"><span>Confidence</span><span class="v">{{ Math.round(change.coverage * 100) }}% cloud-free</span></div>
        <div class="metric-row"><span>Method</span><span class="v">{{ CHANGE_RULES[change.type].label }}</span></div>
        <div class="metric-row"><span>Source</span><span class="v">Sentinel-2 L2A</span></div>
        <p class="disclaimer">Remote-sensing proxy, not a field measurement or legal conclusion.</p>
      </template>

      <button class="aoi-clear" @click="emit('clearAoi')">Clear AOI</button>
    </div>

    <div v-else class="insp-block empty-state">
      <h5>No AOI selected</h5>
      <div class="sub">Draw an area on the map to view statistics</div>
      <p>Click "Draw AOI" in the layers panel, click on the map to trace a polygon, then double-click to finish. Escape cancels.</p>
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

.aoi-clear {
  margin-top: 10px;
  width: 100%;
  font-family: var(--font-body);
  font-size: 12.5px;
  font-weight: 600;
  padding: 7px 0;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line-strong);
  background: var(--paper-sunk);
  color: var(--ink-soft);
  cursor: pointer;
}

.aoi-clear:hover {
  border-color: #c0392b;
  color: #c0392b;
}

.change-input {
  width: 100%;
  font-family: var(--font-mono);
  font-size: 12px;
  padding: 5px 6px;
  margin-top: 6px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  background: var(--paper-sunk);
  color: var(--ink);
}

.change-dates {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.change-dates label {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--ink-faint);
}

.disclaimer {
  margin: 8px 0 0;
  font-size: 11px;
  color: var(--ink-faint);
}
</style>
