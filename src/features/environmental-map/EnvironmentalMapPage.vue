<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import AppHeader from "./components/AppHeader.vue";
import LayerPanel from "./components/LayerPanel.vue";
import MapView, { type MapViewCamera, type SatelliteAcquisition } from "./components/MapView.vue";
import InspectorPanel from "./components/InspectorPanel.vue";
import Timeline from "./components/Timeline.vue";
import MetricsRow from "./components/MetricsRow.vue";
import CompareView from "./components/CompareView.vue";
import GuidelineDrawer from "./components/GuidelineDrawer.vue";
import guidelineMarkdown from "../../../GUIDELINE.md?raw";
import guidelineMarkdownId from "../../../GUIDELINE.id.md?raw";
import { area } from "@turf/turf";
import { AOI_MAX_HA } from "./composables/useAoiAnalysis";
import { runChangeDetection, type ChangeResult, type ChangeType } from "./composables/changeDetection";
import { computeLandCover, type AnalyticsScope, type LandCover } from "./composables/analytics";
import type { BasemapMode } from "@/shared/types/layers";
import { useLayers } from "./composables/useLayers";
import { buildShareUrl, decodeAoi, downloadBlob, exportFileStamp, exportMapPng, exportStamp } from "./composables/export";

const { layers, setLayer, isVisible } = useLayers();

const selectedFeature = ref<GeoJSON.Feature | null>(null);
const selectedLayerId = ref<string | null>(null);
const scenes = ref<SatelliteAcquisition[]>([]);
const selectedScene = ref<SatelliteAcquisition | null>(null);
const activePreset = ref("latest");
const basemapMode = ref<BasemapMode>("vector");
const miningImpact = ref(false);
const guideOpen = ref(false);

// ponytail: mobile panel toggles — kept simple, no drawer lib needed
const mobileLayersOpen = ref(false);
const mobileInspectorOpen = ref(false);

const MINING_IMPACT_ON = ["mining-iup", "ndvi", "rivers", "watersheds", "coastline", "settlement-areas"];

function toggleMiningImpact() {
  miningImpact.value = !miningImpact.value;
  if (miningImpact.value) {
    handleBasemapChanged("satellite");
    for (const l of layers.value) setLayer(l.id, MINING_IMPACT_ON.includes(l.id));
  } else {
    for (const l of layers.value) setLayer(l.id, l.defaultVisible);
  }
}

const compareMode = ref<"swipe" | "split" | null>(null);
const sceneB = ref<SatelliteAcquisition | null>(null);
const camera = ref<MapViewCamera | null>(null);

const drawMode = ref(false);
const aoi = ref<GeoJSON.Polygon | null>(null);
const aoiError = ref<string | null>(null);
const focusBounds = ref<[number, number, number, number] | null>(null);
const focusAlertAoi = ref<GeoJSON.Polygon | null>(null);
const preFocusCamera = ref<[number, number, number, number] | null>(null);

// Share-link restore (aoi + cam params) must run before MapView mounts so
// initial-view picks it up.
{
  const params = new URLSearchParams(window.location.search);
  const aoiRaw = params.get("aoi");
  if (aoiRaw) {
    const polygon = decodeAoi(aoiRaw);
    if (polygon && area(polygon) / 10_000 <= AOI_MAX_HA) aoi.value = polygon;
  }
  const cam = params.get("cam")?.split(",").map(Number);
  if (cam?.length === 3 && cam.every((n) => Number.isFinite(n))) {
    camera.value = { center: [cam[0], cam[1]], zoom: cam[2], bearing: 0, pitch: 0 };
  }
}

const shareUrl = computed(() => buildShareUrl(window.location.href, aoi.value, camera.value));
const activeLayerNames = computed(() => layers.value.filter((l) => isVisible(l.id)).map((l) => l.name));

async function handleExportPng() {
  const map = (window as unknown as { __map?: Parameters<typeof exportMapPng>[0] }).__map;
  if (!map) return;
  const blob = await exportMapPng(map, exportStamp(selectedScene.value?.date.slice(0, 10) ?? null));
  downloadBlob(`taliabu-monitor-${exportFileStamp()}.png`, blob);
}

function handleFocusAlert(alert: { aoi: GeoJSON.Polygon | null; evidence: { bbox: [number, number, number, number] } }) {
  if (!focusAlertAoi.value) preFocusCamera.value = camera.value?.bounds ?? null;
  focusBounds.value = alert.evidence.bbox;
  focusAlertAoi.value = alert.aoi;
}

function handleUnfocusAlert() {
  focusAlertAoi.value = null;
  if (preFocusCamera.value) focusBounds.value = preFocusCamera.value;
}

const change = ref<ChangeResult | null>(null);
const changeLoading = ref(false);
const changeError = ref<string | null>(null);

function clearChange() {
  if (change.value) URL.revokeObjectURL(change.value.url);
  change.value = null;
  changeError.value = null;
}

const analyticsScope = ref<AnalyticsScope>("island");
const analyticsResult = ref<LandCover | null>(null);
const analyticsLoading = ref(false);
const analyticsError = ref<string | null>(null);
const islandShape = ref<GeoJSON.Polygon | null>(null);
const analyticsCache = new Map<string, LandCover>();

onMounted(async () => {
  const fc = await (await fetch("/data/boundaries/taliabu-island.web.geojson")).json();
  islandShape.value = fc.features[0]?.geometry ?? null;
});

let analyticsTimer: ReturnType<typeof setTimeout> | undefined;

// viewport bounds rounded to 2dp: raw bounds jitter (canvas resize feedback from
// panel height changes) must not retrigger metrics computation
const viewportKey = computed(() => {
  const b = camera.value?.bounds;
  return b ? b.map((v) => v.toFixed(2)).join(",") : "";
});

watch([analyticsScope, () => selectedScene.value?.date, viewportKey, aoi, selectedFeature, selectedLayerId], ([scope, date, vpKey, aoiShape, feat, layerId]) => {
  clearTimeout(analyticsTimer);
  analyticsError.value = null;
  if (!date) {
    analyticsResult.value = null;
    return;
  }

  let shape: GeoJSON.Polygon | GeoJSON.MultiPolygon | null = null;
  let scopeKey: string = scope;
  if (scope === "island") shape = islandShape.value;
  else if (scope === "viewport") {
    if (!vpKey) return;
    const [w, s, e, n] = vpKey.split(",").map(Number);
    shape = { type: "Polygon", coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]] };
    scopeKey = `viewport|${vpKey}`;
  } else if (scope === "aoi") shape = aoiShape;
  else if (scope === "permit" && layerId?.replace(/-layer$/, "") === "mining-iup") shape = (feat?.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon | undefined) ?? null;

  if (!shape) {
    analyticsResult.value = null;
    return;
  }
  const key = `${scopeKey}|${date}`;
  const cached = analyticsCache.get(key);
  if (cached) {
    analyticsResult.value = cached;
    return;
  }

  analyticsTimer = setTimeout(async () => {
    analyticsLoading.value = true;
    try {
      const result = await computeLandCover(scope, shape!, date);
      analyticsCache.set(key, result);
      analyticsResult.value = result;
    } catch {
      analyticsError.value = "Metrics unavailable for this scene";
    }
    analyticsLoading.value = false;
  }, 600);
});

async function handleRunChange(payload: { type: ChangeType; dateA: string; dateB: string }) {
  if (!aoi.value || changeLoading.value) return;
  changeLoading.value = true;
  clearChange();
  try {
    change.value = await runChangeDetection(payload.type, payload.dateA, payload.dateB, aoi.value);
  } catch (err) {
    changeError.value = err instanceof Error ? err.message : "Analysis failed";
  }
  changeLoading.value = false;
}

function toggleDrawAoi() {
  drawMode.value = !drawMode.value;
  if (drawMode.value) aoiError.value = null;
}

function handleAoiDrawn(polygon: GeoJSON.Polygon) {
  drawMode.value = false;
  clearChange();
  const ha = area(polygon) / 10_000;
  if (ha > AOI_MAX_HA) {
    aoi.value = null;
    aoiError.value = `Area ${Math.round(ha).toLocaleString()} ha exceeds the ${AOI_MAX_HA.toLocaleString()} ha (100 km²) analysis limit. Draw a smaller polygon.`;
    return;
  }
  aoi.value = polygon;
  aoiError.value = null;
}

function clearAoi() {
  aoi.value = null;
  aoiError.value = null;
  clearChange();
}

const activeScene = computed(() => {
  if (!selectedScene.value) return [];
  return [selectedScene.value];
});

function getDateRange(preset: string): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  let from: string;

  switch (preset) {
    case "1m":
      from = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().slice(0, 10);
      break;
    case "6m":
      from = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()).toISOString().slice(0, 10);
      break;
    case "1y":
      from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().slice(0, 10);
      break;
    case "latest":
    default:
      from = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
      break;
  }

  return { from, to };
}

async function loadScenes(from: string, to: string, compareState?: { compare: boolean; sceneBId?: string; mode?: "swipe" | "split" }) {
  try {
    const res = await fetch(`/api/acquisitions?from=${from}&to=${to}&maxCloudCover=100`);
    const data = await res.json();
    scenes.value = data.items ?? [];
    if (scenes.value.length > 0) {
      selectedScene.value = scenes.value[0];

      if (compareState?.compare && scenes.value.length >= 2) {
        const b = compareState.sceneBId
          ? scenes.value.find((s) => s.id === compareState.sceneBId) ?? scenes.value.find((s) =>
            compareState.sceneBId?.match(/_(\d{8})T/)?.[1] === s.date.replaceAll("-", ""))
          : scenes.value.find((s) => s.id !== selectedScene.value?.id);
        if (b) {
          sceneB.value = b;
          compareMode.value = compareState.mode ?? "swipe";
        }
      }
    } else {
      selectedScene.value = null;
    }
  } catch {
    // silent fail
  }
}

function handleShortcut(preset: string) {
  activePreset.value = preset;
  compareMode.value = null;
  sceneB.value = null;
  const { from, to } = getDateRange(preset);
  loadScenes(from, to);
  updateURL(from, to);
}

function toggleCompare() {
  if (compareMode.value) {
    compareMode.value = null;
    sceneB.value = null;
    const url = new URL(window.location.href);
    url.searchParams.delete("compare");
    url.searchParams.delete("sceneB");
    url.searchParams.delete("compareMode");
    window.history.replaceState({}, "", url.toString());
    return;
  }

  if (scenes.value.length < 2) return;

  const current = selectedScene.value;
  const other = scenes.value.find((s) => s.id !== current?.id) ?? scenes.value[scenes.value.length - 1];

  sceneB.value = other;
  compareMode.value = "swipe";
  updateCompareURL();
}

function toggleCompareMode() {
  if (!compareMode.value) return;
  compareMode.value = compareMode.value === "swipe" ? "split" : "swipe";
  updateCompareURL();
}

function handleBasemapChanged(mode: BasemapMode) {
  basemapMode.value = mode;
  if (mode !== "satellite" && compareMode.value) {
    compareMode.value = null;
    sceneB.value = null;
    updateCompareURL();
  }
}

function handleSceneSelected(scene: SatelliteAcquisition) {
  if (compareMode.value && sceneB.value) {
    if (scene.id === selectedScene.value?.id) return;
    sceneB.value = scene;
    updateCompareURL();
  } else {
    selectedScene.value = scene;
  }
}

function updateURL(from: string, to: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);
  if (compareMode.value && sceneB.value) {
    url.searchParams.set("compare", "on");
    url.searchParams.set("sceneB", sceneB.value.id);
    url.searchParams.set("compareMode", compareMode.value);
  } else {
    url.searchParams.delete("compare");
    url.searchParams.delete("sceneB");
  }
  window.history.replaceState({}, "", url.toString());
}

function updateCompareURL() {
  const url = new URL(window.location.href);
  if (compareMode.value && sceneB.value) {
    url.searchParams.set("compare", "on");
    url.searchParams.set("sceneB", sceneB.value.id);
    url.searchParams.set("compareMode", compareMode.value);
  } else {
    url.searchParams.delete("compare");
    url.searchParams.delete("sceneB");
    url.searchParams.delete("compareMode");
  }
  window.history.replaceState({}, "", url.toString());
}

function readURLState(): { from: string; to: string; compare?: boolean; sceneBId?: string; compareMode?: "swipe" | "split" } | null {
  const params = new URLSearchParams(window.location.search);
  const from = params.get("from");
  const to = params.get("to");
  if (from && to) {
    return {
      from,
      to,
      compare: params.get("compare") === "on",
      sceneBId: params.get("sceneB") ?? undefined,
      compareMode: params.get("compareMode") === "split" ? "split" : "swipe",
    };
  }
  return null;
}

onMounted(() => {
  const urlState = readURLState();
  if (urlState) {
    loadScenes(urlState.from, urlState.to, {
      compare: urlState.compare ?? false,
      sceneBId: urlState.sceneBId,
      mode: urlState.compareMode,
    });
  } else {
    const { from, to } = getDateRange("latest");
    loadScenes(from, to);
  }
});
</script>

<template>
  <div class="app">
    <AppHeader
      :latest-acquisition="scenes[0] ?? null"
      :mobile-layers-open="mobileLayersOpen"
      :mobile-inspector-open="mobileInspectorOpen"
      @open-guide="guideOpen = true"
      @toggle-mobile-layers="mobileLayersOpen = !mobileLayersOpen"
      @toggle-mobile-inspector="mobileInspectorOpen = !mobileInspectorOpen"
    />
    <LayerPanel
      class="layer-panel-desktop"
      :class="{ 'mobile-open': mobileLayersOpen }"
      :draw-mode="drawMode"
      :basemap-mode="basemapMode"
      :mining-impact="miningImpact"
      @draw-aoi="toggleDrawAoi"
      @basemap-changed="handleBasemapChanged"
      @toggle-mining-impact="toggleMiningImpact"
    />
    <div class="map-area">
      <MapView
        v-if="!compareMode"
        :active-scenes="activeScene"
        :basemap-mode="basemapMode"
        :change-overlay="change ? { url: change.url, bbox: change.bbox } : null"
        :initial-view="camera ?? undefined"
        :focus-bounds="focusBounds"
        :focus-alert-aoi="focusAlertAoi"
        :draw-mode="drawMode"
        :aoi="aoi"
        @feature-selected="(f, l) => { selectedFeature = f; selectedLayerId = l; }"
        @view-changed="(view) => camera = view"
        @aoi-drawn="handleAoiDrawn"
        @aoi-cancelled="drawMode = false"
      />
      <CompareView
        v-else-if="compareMode && selectedScene && sceneB"
        :scene-a="selectedScene"
        :scene-b="sceneB"
        :mode="compareMode"
        :initial-view="camera ?? undefined"
      />
    </div>
    <InspectorPanel
      class="inspector-panel-desktop"
      :class="{ 'mobile-open': mobileInspectorOpen }"
      :feature="selectedFeature"
      :layer-id="selectedLayerId"
      :aoi="aoi"
      :aoi-error="aoiError"
      :scene-date="selectedScene?.date ?? null"
      :change="change"
      :change-loading="changeLoading"
      :change-error="changeError"
      :analytics="analyticsResult"
      :active-layers="activeLayerNames"
      :share-url="shareUrl"
      :map-active="!compareMode"
      @clear-aoi="clearAoi"
      @run-change="handleRunChange"
      @focus-alert="handleFocusAlert"
      @unfocus-alert="handleUnfocusAlert"
      @export-png="handleExportPng"
    />
    <div class="bottom-bar">
      <Timeline
         v-if="basemapMode === 'satellite'"
        :scenes="scenes"
        :selected-scene="selectedScene"
        :active-preset="activePreset"
        :compare-mode="compareMode"
        :scene-b="sceneB"
        @scene-selected="handleSceneSelected"
        @shortcut-selected="handleShortcut"
        @toggle-compare="toggleCompare"
        @toggle-compare-mode="toggleCompareMode"
      />
      <MetricsRow
        :result="analyticsResult"
        :loading="analyticsLoading"
        :error="analyticsError"
        :scope="analyticsScope"
        :scene-date="selectedScene?.date?.slice(0, 10) ?? null"
        :has-aoi="!!aoi"
        :permit-name="selectedLayerId?.replace(/-layer$/, '') === 'mining-iup' ? String(selectedFeature?.properties?.name ?? '') || null : null"
        @change-scope="(s) => (analyticsScope = s)"
      />
    </div>
    <GuidelineDrawer :open="guideOpen" :markdown-en="guidelineMarkdown" :markdown-id="guidelineMarkdownId" @close="guideOpen = false" />
  </div>
</template>

<style>
@import "@/shared/styles/variables.css";

.app {
  display: grid;
  grid-template-columns: 252px 1fr 296px;
  grid-template-rows: 48px minmax(360px, 1fr) auto;
  grid-template-areas:
    "header header header"
    "layers map inspector"
    "bottom bottom bottom";
  height: 100vh;
}

.map-area {
  grid-area: map;
  position: relative;
  overflow: hidden;
}

.bottom-bar {
  grid-area: bottom;
}

/* ponytail: tablet breakpoint — panels as overlays */
@media (max-width: 1080px) {
  .app {
    grid-template-columns: 1fr;
    grid-template-rows: 48px 1fr auto;
    grid-template-areas:
      "header"
      "map"
      "bottom";
    height: 100vh;
    overflow: hidden;
  }

  .layer-panel-desktop,
  .inspector-panel-desktop {
    position: fixed;
    top: 48px;
    bottom: 0;
    z-index: 100;
    grid-area: auto;
    transition: transform 0.2s ease;
  }

  .layer-panel-desktop {
    left: 0;
    transform: translateX(-100%);
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  }

  .layer-panel-desktop.mobile-open {
    transform: translateX(0);
  }

  .inspector-panel-desktop {
    right: 0;
    transform: translateX(100%);
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
  }

  .inspector-panel-desktop.mobile-open {
    transform: translateX(0);
  }
}

/* ponytail: mobile breakpoint — panels as overlays, bottom scrollable */
@media (max-width: 768px) {
  .app {
    grid-template-columns: 1fr;
    grid-template-rows: 48px 1fr auto;
    grid-template-areas:
      "header"
      "map"
      "bottom";
    height: 100vh;
    overflow: hidden;
  }

  .layer-panel-desktop,
  .inspector-panel-desktop {
    position: fixed;
    top: 48px;
    bottom: 0;
    width: 280px;
    z-index: 100;
    grid-area: auto;
    transition: transform 0.2s ease;
  }

  .layer-panel-desktop {
    left: 0;
    transform: translateX(-100%);
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  }

  .layer-panel-desktop.mobile-open {
    transform: translateX(0);
  }

  .inspector-panel-desktop {
    right: 0;
    width: 300px;
    transform: translateX(100%);
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
  }

  .inspector-panel-desktop.mobile-open {
    transform: translateX(0);
  }

  .map-area {
    min-height: 0;
  }

  .bottom-bar {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
  }
}
</style>
