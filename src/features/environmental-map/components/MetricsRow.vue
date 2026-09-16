<script setup lang="ts">
import type { AnalyticsScope, LandCover } from "../composables/analytics";

defineProps<{
  result: LandCover | null;
  loading: boolean;
  error: string | null;
  scope: AnalyticsScope;
  sceneDate: string | null;
  hasAoi: boolean;
  permitName: string | null;
}>();

const emit = defineEmits<{ changeScope: [scope: AnalyticsScope] }>();

const SCOPES: { id: AnalyticsScope; label: string }[] = [
  { id: "island", label: "Taliabu" },
  { id: "viewport", label: "Viewport" },
  { id: "aoi", label: "AOI" },
  { id: "permit", label: "Permit" },
];

function pct(part: number, total: number): string {
  return total > 0 ? `${((part / total) * 100).toFixed(1)}%` : "—";
}

function ha(v: number): string {
  return v >= 1000 ? `${Math.round(v).toLocaleString()} ha` : `${v.toFixed(1)} ha`;
}
</script>

<template>
  <div class="metrics">
    <div class="trend-card">
      <div class="scope-head">
        <h5>Land cover</h5>
        <div class="scopes" role="group" aria-label="Metrics scope">
          <button
            v-for="s in SCOPES"
            :key="s.id"
            class="scope-btn"
            :class="{ on: scope === s.id }"
            :disabled="(s.id === 'aoi' && !hasAoi) || (s.id === 'permit' && !permitName)"
            :title="s.id === 'permit' && permitName ? permitName : undefined"
            @click="emit('changeScope', s.id)"
          >
            {{ s.label }}
          </button>
        </div>
      </div>

      <template v-if="!sceneDate">
        <p class="hint">Select a scene on the timeline to compute metrics.</p>
      </template>
      <template v-else-if="loading">
        <p class="hint">Computing…</p>
      </template>
      <template v-else-if="error">
        <p class="hint fail">{{ error }}</p>
      </template>
      <template v-else-if="result">
        <div class="metric-row"><span>Vegetation</span><span class="v">{{ ha(result.vegetationHa) }} · {{ pct(result.vegetationHa, result.totalHa) }}</span></div>
        <div class="metric-row"><span>Bare / sparse</span><span class="v">{{ ha(result.bareHa) }} · {{ pct(result.bareHa, result.totalHa) }}</span></div>
        <div class="metric-row"><span>Water</span><span class="v">{{ ha(result.waterHa) }} · {{ pct(result.waterHa, result.totalHa) }}</span></div>
        <div class="metric-row"><span>Scope area</span><span class="v">{{ ha(result.totalHa) }}</span></div>
        <div class="metric-row"><span>Cloud-free</span><span class="v">{{ Math.round(result.coverage * 100) }}%</span></div>
      </template>

      <div class="meta">
        <template v-if="sceneDate">sentinel-2 l2a · ndvi &amp; mndwi · acquired {{ sceneDate }}</template>
        <template v-if="result"> · ~{{ result.resolutionM }} m/px</template>
      </div>
      <p class="disclaimer">Coarse satellite estimate, not a land survey.</p>
    </div>

    <div class="alert muted">
      <span class="mark"></span>
      <div>
        <h5>Change zones &amp; loss</h5>
        <p>Draw an AOI and run change detection in the inspector panel to quantify vegetation loss, new bare land or water change between two dates.</p>
      </div>
    </div>

    <div class="alert muted">
      <span class="mark" style="background: #B98A22"></span>
      <div>
        <h5>Coastal context</h5>
        <p>Toggle Turbidity (NDTI) and River outlets on the map to spot sediment plumes near river mouths, and Scene water edge to compare the shoreline against the BIG baseline.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.metrics {
  grid-area: metrics;
  background: var(--paper);
  border-top: 1px solid var(--line);
  padding: 14px 20px 18px;
  display: grid;
  grid-template-columns: 250px 1fr 1fr;
  gap: 16px;
}

.trend-card {
  background: var(--paper-raised);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  /* fixed height: panel height changes resize the map canvas, which shifts the
     viewport bounds and would retrigger viewport-scope metrics — layout loop */
  min-height: 186px;
}

.scope-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
}

.trend-card h5 {
  font-size: 12.5px;
  margin: 0;
}

.scopes {
  display: flex;
  gap: 3px;
}

.scope-btn {
  font-size: 10.5px;
  font-family: var(--font-mono);
  padding: 2px 7px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: transparent;
  color: var(--ink-soft);
  cursor: pointer;
}

.scope-btn.on {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.scope-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  font-size: 11.5px;
  padding: 2.5px 0;
}

.metric-row .v {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.hint {
  font-size: 11.5px;
  color: var(--ink-soft);
  margin: 10px 0;
}

.hint.fail {
  color: #8A5140;
}

.meta {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--ink-faint);
  margin-top: 8px;
}

.disclaimer {
  font-size: 10.5px;
  color: var(--ink-faint);
  margin: 4px 0 0;
}

.alert {
  display: flex;
  gap: 10px;
  border: 1px solid var(--line);
  background: var(--paper-raised);
  border-radius: var(--radius-md);
  padding: 11px 13px;
}

.alert .mark {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent-alert);
  margin-top: 5px;
  flex: none;
}

.alert h5 {
  font-size: 12.5px;
  margin-bottom: 2px;
}

.alert p {
  margin: 0;
  font-size: 11.5px;
  color: var(--ink-soft);
}
</style>
