<script setup lang="ts">
import { onMounted, ref, watch, computed } from "vue";
import { useDatasetMetadata } from "../composables/useDatasetMetadata";
import { analyzeAoi, type AoiAnalysis } from "../composables/useAoiAnalysis";
import { CHANGE_RULES, type ChangeResult, type ChangeType } from "../composables/changeDetection";
import { ALERT_LABELS, alertLabel, DEFAULT_THRESHOLDS, evaluateAlerts, type AlertThresholds, type AlertEvidence, type EnvAlert } from "../composables/alerts";
import type { LandCover } from "../composables/analytics";
import { DATA_ATTRIBUTION, SATELLITE_SOURCE, downloadBlob, exportFileStamp, toCsv, type CsvRow } from "../composables/export";

const props = defineProps<{
  feature: GeoJSON.Feature | null;
  layerId: string | null;
  aoi?: GeoJSON.Polygon | null;
  aoiError?: string | null;
  sceneDate?: string | null;
  change?: ChangeResult | null;
  changeLoading?: boolean;
  changeError?: string | null;
  analytics?: LandCover | null;
  activeLayers?: string[];
  shareUrl?: string;
  mapActive?: boolean;
}>();

const emit = defineEmits<{ clearAoi: []; runChange: [payload: { type: ChangeType; dateA: string; dateB: string }]; focusAlert: [alert: SavedAlert]; unfocusAlert: []; exportPng: [] }>();

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

onMounted(() => {
  load();
  loadAlerts();
});

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
}, { immediate: true });

const thresholds = ref<AlertThresholds>({ ...DEFAULT_THRESHOLDS });
const alerts = computed<EnvAlert[]>(() =>
  props.change && props.aoi && analysis.value && !props.changeLoading
    ? evaluateAlerts(props.change, analysis.value, props.aoi, thresholds.value)
    : [],
);
const alertsBlocked = computed(() => !!props.change && props.change.coverage < 0.3);

const saving = ref(false);
const savedCount = ref<number | null>(null);
const saveError = ref<string | null>(null);
watch(alerts, () => {
  savedCount.value = null;
  saveError.value = null;
});

interface SavedAlert {
  id: number;
  kind: string;
  severity: string;
  aoi: GeoJSON.Polygon | null;
  evidence: AlertEvidence;
  createdAt: string;
}
const logAlerts = ref<SavedAlert[]>([]);
const logKind = ref("");
const expandedAlert = ref<number | null>(null);

function toggleAlert(a: SavedAlert) {
  if (expandedAlert.value === a.id) {
    expandedAlert.value = null;
    emit("unfocusAlert");
  } else {
    expandedAlert.value = a.id;
    emit("focusAlert", a);
  }
}

function thresholdText(t?: AlertThresholds): string {
  const parts: string[] = [];
  if (t?.vegLossHa != null) parts.push(`veg ≥ ${t.vegLossHa} ha`);
  if (t?.distanceM != null) parts.push(`dist ≤ ${t.distanceM} m`);
  return parts.join(" · ") || "—";
}

function contextText(a: { evidence: AlertEvidence }): string {
  const c = a.evidence.context;
  if (!c) return "";
  const parts: string[] = [];
  if (typeof c.distanceM === "number") parts.push(formatM(c.distanceM));
  if (typeof c.nearestRiver === "string") parts.push(c.nearestRiver);
  if (Array.isArray(c.permits) && c.permits.length) parts.push(c.permits.join(", "));
  if (!c.distanceM && typeof c.coastDistanceM === "number") parts.push(`coast ${formatM(c.coastDistanceM)}`);
  return parts.join(" · ");
}

async function loadAlerts() {
  try {
    const q = logKind.value ? `&kind=${encodeURIComponent(logKind.value)}` : "";
    const res = await fetch(`/api/alerts?limit=50${q}`);
    logAlerts.value = (await res.json()).alerts ?? [];
  } catch {
    logAlerts.value = [];
  }
}

watch(logKind, loadAlerts);

async function saveAlerts() {
  if (!alerts.value.length) return;
  saving.value = true;
  saveError.value = null;
  try {
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alerts: alerts.value }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    savedCount.value = ((await res.json()) as { saved: number }).saved;
    await loadAlerts();
  } catch (err) {
    saveError.value = err instanceof Error ? err.message : "Save failed";
  }
  saving.value = false;
}

function alertDetail(a: EnvAlert): string {
  const parts = [formatHa(a.evidence.changedHa), `${a.evidence.dateA} → ${a.evidence.dateB}`];
  const d = a.evidence.context?.distanceM;
  if (typeof d === "number") parts.push(formatM(d));
  return parts.join(" · ");
}

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

const exportContext = () => ({
  observationDate: props.sceneDate ?? null,
  comparisonDate: props.change ? { from: props.change.dateA, to: props.change.dateB } : null,
  source: SATELLITE_SOURCE,
  activeLayers: props.activeLayers ?? [],
  generatedAt: new Date().toISOString(),
  attribution: DATA_ATTRIBUTION,
  disclaimer: "Remote-sensing proxy, not a field measurement or legal conclusion.",
});

function doExportCsv() {
  const rows: CsvRow[] = [];
  const c = analysis.value;
  if (c) {
    rows.push(["aoi_area", +c.areaHa.toFixed(2), "ha"]);
    rows.push(["within_permit", +c.permitPct.toFixed(1), "%", c.permits.join(", ")]);
    if (c.nearestRiver) rows.push(["nearest_river", Math.round(c.nearestRiver.distanceM), "m", c.nearestRiver.name]);
    if (c.nearestSettlement) rows.push(["nearest_settlement", Math.round(c.nearestSettlement.distanceM), "m", c.nearestSettlement.name]);
    if (c.coastDistanceM != null) rows.push(["coast_distance", Math.round(c.coastDistanceM), "m"]);
    if (c.watershed) rows.push(["watershed", c.watershed, "name"]);
    if (c.elevation) {
      rows.push(["elevation_min", Math.round(c.elevation.minM), "m"]);
      rows.push(["elevation_mean", Math.round(c.elevation.meanM), "m"]);
      rows.push(["elevation_max", Math.round(c.elevation.maxM), "m"]);
    }
    if (c.slope) {
      rows.push(["slope_mean", +c.slope.meanDeg.toFixed(1), "deg"]);
      rows.push(["slope_max", Math.round(c.slope.maxDeg), "deg"]);
    }
    if (c.downstream) rows.push(["downstream_to_outlet", +c.downstream.distanceKm.toFixed(1), "km"]);
  }
  if (props.change) {
    rows.push(["changed_area", +props.change.changedHa.toFixed(2), "ha", `${props.change.dateA} → ${props.change.dateB}`]);
    rows.push(["cloud_free", Math.round(props.change.coverage * 100), "%", CHANGE_RULES[props.change.type].label]);
  }
  const a = props.analytics;
  if (a) {
    rows.push(["landcover_vegetation", +a.vegetationHa.toFixed(1), "ha"]);
    rows.push(["landcover_bare", +a.bareHa.toFixed(1), "ha"]);
    rows.push(["landcover_water", +a.waterHa.toFixed(1), "ha"]);
    rows.push(["scope_area", +a.totalHa.toFixed(1), "ha", a.scope]);
    rows.push(["cloud_free", Math.round(a.coverage * 100), "%"]);
    rows.push(["resolution", a.resolutionM, "m/px"]);
  }
  downloadBlob(`taliabu-metrics-${exportFileStamp()}.csv`, new Blob([toCsv(rows)], { type: "text/csv" }));
}

function doExportGeojson() {
  if (!props.aoi) return;
  const c = analysis.value;
  const feature: GeoJSON.Feature = {
    type: "Feature",
    properties: {
      ...exportContext(),
      areaHa: c ? +c.areaHa.toFixed(2) : null,
      permits: c?.permits ?? [],
      permitPct: c ? +c.permitPct.toFixed(1) : null,
      nearestRiver: c?.nearestRiver ?? null,
      coastDistanceM: c?.coastDistanceM ?? null,
      watershed: c?.watershed ?? null,
      change: props.change
        ? { type: props.change.type, method: CHANGE_RULES[props.change.type].label, changedHa: +props.change.changedHa.toFixed(2), coverage: +props.change.coverage.toFixed(2) }
        : null,
    },
    geometry: props.aoi,
  };
  downloadBlob(`taliabu-aoi-${exportFileStamp()}.geojson`, new Blob([JSON.stringify(feature, null, 2)], { type: "application/geo+json" }));
}

function doExportJson() {
  const snapshot = {
    ...exportContext(),
    aoi: props.aoi ? { coordinates: props.aoi.coordinates, areaHa: analysis.value ? +analysis.value.areaHa.toFixed(2) : null } : null,
    change: props.change
      ? { type: props.change.type, method: CHANGE_RULES[props.change.type].label, changedHa: +props.change.changedHa.toFixed(2), coverage: +props.change.coverage.toFixed(2), bbox: props.change.bbox }
      : null,
    alerts: alerts.value,
    landCover: props.analytics ?? null,
  };
  downloadBlob(`taliabu-monitor-${exportFileStamp()}.json`, new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" }));
}

const copied = ref(false);
let copiedTimer: ReturnType<typeof setTimeout> | undefined;

async function copyShare() {
  if (!props.shareUrl) return;
  try {
    await navigator.clipboard.writeText(props.shareUrl);
    copied.value = true;
    clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => (copied.value = false), 2000);
  } catch {
    // clipboard permission denied — nothing to show
  }
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
        <template v-if="analysis.elevation">
          <div class="metric-row">
            <span>Elevation</span>
            <span class="v">{{ Math.round(analysis.elevation.minM) }}–{{ Math.round(analysis.elevation.maxM) }} m · mean {{ Math.round(analysis.elevation.meanM) }} m</span>
          </div>
          <div class="metric-row">
            <span>Slope (DEMNAS)</span>
            <span class="v">mean {{ analysis.slope!.meanDeg.toFixed(1) }}° · max {{ analysis.slope!.maxDeg.toFixed(0) }}°</span>
          </div>
          <div class="metric-row">
            <span>Downstream flow</span>
            <span class="v">{{ analysis.downstream ? `${analysis.downstream.distanceKm.toFixed(1)} km to outlet` : "—" }}</span>
          </div>
        </template>
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

        <div class="meta-heading">Alerts</div>
        <div class="alert-thresholds">
          <label>Veg loss ≥ ha<input v-model.number="thresholds.vegLossHa" type="number" min="0" step="1" /></label>
          <label>Distance ≤ m<input v-model.number="thresholds.distanceM" type="number" min="0" step="100" /></label>
        </div>
        <template v-if="alerts.length">
          <template v-for="(a, i) in alerts" :key="i">
            <div class="alert-item" :title="a.evidence.rule">
              <span class="badge" :class="a.severity === 'high' ? 'badge-high' : 'badge-medium'">{{ a.severity }}</span>
              <div class="alert-body">
                <strong>{{ alertLabel(a.kind) }}</strong>
                <span class="alert-detail">{{ alertDetail(a) }}</span>
              </div>
            </div>
            <div class="alert-evidence">
              <div class="metric-row"><span>Rule</span><span class="v">{{ a.evidence.rule }}</span></div>
              <div class="metric-row"><span>Method</span><span class="v">{{ a.evidence.method }}</span></div>
              <div class="metric-row"><span>Cloud-free</span><span class="v">{{ Math.round(a.evidence.coverage * 100) }}%</span></div>
              <div class="metric-row"><span>Threshold</span><span class="v">{{ thresholdText(a.evidence.thresholds) }}</span></div>
              <div v-if="contextText(a)" class="metric-row"><span>Context</span><span class="v">{{ contextText(a) }}</span></div>
              <div class="metric-row"><span>Source</span><span class="v">Sentinel-2 L2A · {{ a.evidence.generatedAt.slice(0, 10) }}</span></div>
            </div>
          </template>
          <button class="aoi-clear" :disabled="saving" @click="saveAlerts">
            {{ saving ? "Saving…" : savedCount === null ? "Save to alert log" : savedCount ? `Saved to log (${savedCount})` : "Already in log" }}
          </button>
          <div v-if="saveError" class="metric-row"><span>Error</span><span class="v">{{ saveError }}</span></div>
        </template>
        <div v-else class="metric-row">
          <span>Result</span>
          <span class="v">{{ alertsBlocked ? "Too cloudy to judge (<30% clear)" : "No threshold met" }}</span>
        </div>
      </template>

      <button class="aoi-clear" @click="emit('clearAoi')">Clear AOI</button>
    </div>

    <div v-else class="insp-block empty-state">
      <h5>No AOI selected</h5>
      <div class="sub">Draw an area on the map to view statistics</div>
      <p>Click "Draw AOI" in the layers panel, click on the map to trace a polygon, then double-click to finish. Escape cancels.</p>
    </div>

    <div class="insp-block">
      <h5>Alert log</h5>
      <div class="sub">Saved monitoring events</div>
      <select v-model="logKind" class="change-input" aria-label="Filter alerts">
        <option value="">All kinds</option>
        <option v-for="(label, kind) in ALERT_LABELS" :key="kind" :value="kind">{{ label }}</option>
      </select>
      <template v-if="logAlerts.length">
        <template v-for="a in logAlerts" :key="a.id">
          <button class="alert-log-row" :title="String(a.evidence.rule ?? '')" @click="toggleAlert(a)">
            <span class="dot" :class="a.severity"></span>
            <span class="alert-log-kind">{{ alertLabel(a.kind) }}</span>
            <span class="alert-log-meta">{{ formatHa(a.evidence.changedHa) }} · {{ a.evidence.dateB }}</span>
          </button>
          <div v-if="expandedAlert === a.id" class="alert-evidence">
            <div class="metric-row"><span>Rule</span><span class="v">{{ a.evidence.rule }}</span></div>
            <div class="metric-row"><span>Method</span><span class="v">{{ a.evidence.method }}</span></div>
            <div class="metric-row"><span>Cloud-free</span><span class="v">{{ Math.round(a.evidence.coverage * 100) }}%</span></div>
            <div class="metric-row"><span>Window</span><span class="v">{{ a.evidence.dateA }} → {{ a.evidence.dateB }}</span></div>
            <div class="metric-row"><span>Threshold</span><span class="v">{{ thresholdText(a.evidence.thresholds) }}</span></div>
            <div v-if="contextText(a)" class="metric-row"><span>Context</span><span class="v">{{ contextText(a) }}</span></div>
            <div class="metric-row"><span>Source</span><span class="v">Sentinel-2 L2A · {{ a.evidence.generatedAt?.slice(0, 10) }}</span></div>
          </div>
        </template>
      </template>
      <div v-else class="metric-row"><span>Entries</span><span class="v">0</span></div>
    </div>

    <div class="insp-block">
      <h5>Export</h5>
      <div class="sub">Snapshot and evidence</div>
      <div class="export-grid">
        <button class="export-btn" :disabled="!analysis && !change && !analytics" @click="doExportCsv">CSV</button>
        <button class="export-btn" :disabled="!aoi" @click="doExportGeojson">GeoJSON</button>
        <button class="export-btn" @click="doExportJson">JSON</button>
        <button class="export-btn" :disabled="!mapActive" title="Capture the current map view" @click="emit('exportPng')">PNG</button>
        <button class="export-btn wide" @click="copyShare">{{ copied ? "Link copied" : "Copy share link" }}</button>
      </div>
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

.badge-high {
  background: #F3DAD4;
  color: var(--status-low);
}

.badge-medium {
  background: #F0E6CE;
  color: var(--status-medium);
}

.alert-thresholds {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 6px;
}

.alert-thresholds label {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--ink-faint);
}

.alert-thresholds input {
  width: 100%;
  font-family: var(--font-mono);
  font-size: 12px;
  padding: 5px 6px;
  margin-top: 2px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  background: var(--paper-sunk);
  color: var(--ink);
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid var(--line);
}

.alert-item .badge {
  margin-top: 1px;
}

.alert-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12.5px;
}

.alert-detail {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-faint);
}

.alert-evidence {
  margin: 0 0 8px 24px;
  border-left: 2px solid var(--line-strong);
  padding-left: 10px;
}

.alert-evidence .metric-row {
  font-size: 11.5px;
  padding: 4px 0;
}

.alert-log-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 0;
  border: none;
  border-top: 1px solid var(--line);
  background: none;
  font-family: var(--font-body);
  font-size: 12.5px;
  color: var(--ink);
  cursor: pointer;
  text-align: left;
}

.alert-log-row:hover .alert-log-kind {
  text-decoration: underline;
}

.alert-log-row .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex: none;
}

.alert-log-row .dot.high {
  background: var(--status-low);
}

.alert-log-row .dot.medium {
  background: var(--status-medium);
}

.alert-log-kind {
  flex: 1;
}

.alert-log-meta {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-faint);
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

.export-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.export-btn {
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

.export-btn.wide {
  grid-column: 1 / -1;
}

.export-btn:hover:not(:disabled) {
  border-color: var(--ink);
  color: var(--ink);
}

.export-btn:disabled {
  opacity: 0.35;
  cursor: default;
}
</style>
