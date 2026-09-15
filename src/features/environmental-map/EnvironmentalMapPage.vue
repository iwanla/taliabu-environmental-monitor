<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import AppHeader from "./components/AppHeader.vue";
import LayerPanel from "./components/LayerPanel.vue";
import MapView, { type MapViewCamera, type SatelliteAcquisition } from "./components/MapView.vue";
import InspectorPanel from "./components/InspectorPanel.vue";
import Timeline from "./components/Timeline.vue";
import MetricsRow from "./components/MetricsRow.vue";
import CompareView from "./components/CompareView.vue";
import { area } from "@turf/turf";
import { AOI_MAX_HA } from "./composables/useAoiAnalysis";
import type { BasemapMode } from "@/shared/types/layers";

const selectedFeature = ref<GeoJSON.Feature | null>(null);
const selectedLayerId = ref<string | null>(null);
const scenes = ref<SatelliteAcquisition[]>([]);
const selectedScene = ref<SatelliteAcquisition | null>(null);
const activePreset = ref("latest");
const basemapMode = ref<BasemapMode>("vector");

const compareMode = ref<"swipe" | "split" | null>(null);
const sceneB = ref<SatelliteAcquisition | null>(null);
const camera = ref<MapViewCamera | null>(null);

const drawMode = ref(false);
const aoi = ref<GeoJSON.Polygon | null>(null);
const aoiError = ref<string | null>(null);

function toggleDrawAoi() {
  drawMode.value = !drawMode.value;
  if (drawMode.value) aoiError.value = null;
}

function handleAoiDrawn(polygon: GeoJSON.Polygon) {
  drawMode.value = false;
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
    <AppHeader :latest-acquisition="scenes[0] ?? null" />
    <LayerPanel :draw-mode="drawMode" :basemap-mode="basemapMode" @draw-aoi="toggleDrawAoi" @basemap-changed="handleBasemapChanged" />
    <div class="map-area">
      <MapView
        v-if="!compareMode"
        :active-scenes="activeScene"
        :basemap-mode="basemapMode"
        :initial-view="camera ?? undefined"
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
      :feature="selectedFeature"
      :layer-id="selectedLayerId"
      :aoi="aoi"
      :aoi-error="aoiError"
      @clear-aoi="clearAoi"
    />
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
    <MetricsRow />
  </div>
</template>

<style>
@import "@/shared/styles/variables.css";

.app {
  display: grid;
  grid-template-columns: 252px 1fr 296px;
  grid-template-rows: 48px minmax(360px, 1fr) auto auto;
  grid-template-areas:
    "header header header"
    "layers map inspector"
    "timeline timeline timeline"
    "metrics metrics metrics";
  height: 100vh;
}

.map-area {
  grid-area: map;
  position: relative;
  overflow: hidden;
}

@media (max-width: 1080px) {
  .app {
    grid-template-columns: 1fr;
    grid-template-rows: 48px 280px auto auto auto auto;
    grid-template-areas:
      "header"
      "map"
      "layers"
      "inspector"
      "timeline"
      "metrics";
    height: auto;
  }
}
</style>
