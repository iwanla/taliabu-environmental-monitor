<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { Map as MaplibreMap, LngLatBounds } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapViewCamera, SatelliteAcquisition } from "./MapView.vue";
import { apiUrl } from "@/shared/api";

const props = defineProps<{
  sceneA: SatelliteAcquisition;
  sceneB: SatelliteAcquisition;
  mode?: "swipe" | "split";
  initialView?: MapViewCamera;
}>();

const mapContainerA = ref<HTMLDivElement>();
const mapContainerB = ref<HTMLDivElement>();
const handleRef = ref<HTMLDivElement>();
let mapA: MaplibreMap | null = null;
let mapB: MaplibreMap | null = null;
const splitPos = ref(50);
let syncing = false;

const RASTER_BBOX: [number, number, number, number] = [123.8, -2.5, 125.8, -1.0];
const RASTER_COORDS: [[number, number], [number, number], [number, number], [number, number]] = [
  [RASTER_BBOX[0], RASTER_BBOX[3]],
  [RASTER_BBOX[2], RASTER_BBOX[3]],
  [RASTER_BBOX[2], RASTER_BBOX[1]],
  [RASTER_BBOX[0], RASTER_BBOX[1]],
];

const CENTER: [number, number] = [124.83, -1.83];
const BOUNDS = new LngLatBounds([124.3371, -2.0332], [125.3269, -1.6300]);
function syncMaps(source: MaplibreMap, target: MaplibreMap) {
  if (syncing) return;
  syncing = true;
  target.jumpTo({
    center: source.getCenter(),
    zoom: source.getZoom(),
    bearing: source.getBearing(),
    pitch: source.getPitch(),
  });
  syncing = false;
}

function createMap(container: HTMLDivElement): MaplibreMap {
  const m = new MaplibreMap({
    container,
    style: "https://tiles.openfreemap.org/styles/liberty",
    center: props.initialView?.center ?? CENTER,
    zoom: props.initialView?.zoom ?? 8,
    bearing: props.initialView?.bearing ?? 0,
    pitch: props.initialView?.pitch ?? 0,
    attributionControl: false,
  });

  return m;
}

async function loadBoundary(map: MaplibreMap) {
  const res = await fetch("/data/boundaries/taliabu-island.web.geojson");
  const geojson = await res.json();

  map.addSource("boundary", { type: "geojson", data: geojson });
  map.addLayer({
    id: "boundary-fill",
    type: "fill",
    source: "boundary",
    paint: { "fill-color": "#E9E6D5", "fill-opacity": 0.15 },
  });
  map.addLayer({
    id: "boundary-line",
    type: "line",
    source: "boundary",
    paint: { "line-color": "#3E4C44", "line-width": 2 },
  });
}

async function renderScene(map: MaplibreMap, scene: SatelliteAcquisition, sourceId: string, layerId: string) {
  const from = scene.acquiredAt.slice(0, 10);

  try {
    const res = await fetch(apiUrl("/api/render"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bbox: RASTER_BBOX,
        from,
        to: from,
        maxCloudCoverage: 100,
        width: 1536,
        height: 1024,
      }),
    });

    if (!res.ok) return;

    const blob = await res.blob();
    const imageUrl = URL.createObjectURL(blob);

    map.addSource(sourceId, {
      type: "image",
      url: imageUrl,
      coordinates: RASTER_COORDS,
    });

    map.addLayer(
      { id: layerId, type: "raster", source: sourceId, paint: { "raster-opacity": 0.85 } },
      "boundary-fill",
    );
  } catch {
    // silent fail
  }
}

function onHandleDown(e: MouseEvent) {
  e.preventDefault();
  const onMove = (ev: MouseEvent) => {
    if (!mapContainerA.value) return;
    const rect = mapContainerA.value.getBoundingClientRect();
    const x = ((ev.clientX - rect.left) / rect.width) * 100;
    splitPos.value = Math.max(5, Math.min(95, x));
  };
  const onUp = () => {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";
}

function onHandleTouchDown(e: TouchEvent) {
  e.preventDefault();
  const onMove = (ev: TouchEvent) => {
    if (!mapContainerA.value || !ev.touches.length) return;
    const rect = mapContainerA.value.getBoundingClientRect();
    const x = ((ev.touches[0].clientX - rect.left) / rect.width) * 100;
    splitPos.value = Math.max(5, Math.min(95, x));
  };
  const onEnd = () => {
    document.removeEventListener("touchmove", onMove);
    document.removeEventListener("touchend", onEnd);
  };
  document.addEventListener("touchmove", onMove, { passive: false });
  document.addEventListener("touchend", onEnd);
}

onMounted(() => {
  if (!mapContainerA.value || !mapContainerB.value) return;

  mapA = createMap(mapContainerA.value);
  mapB = createMap(mapContainerB.value);

  mapA.on("load", async () => {
    if (!mapA) return;
    await loadBoundary(mapA);
    if (props.mode === "split") mapA.fitBounds(BOUNDS, { padding: 24 });
    renderScene(mapA, props.sceneA, "sat-a", "sat-a-layer");
  });

  mapB.on("load", async () => {
    if (!mapB) return;
    await loadBoundary(mapB);
    if (props.mode === "split") mapB.fitBounds(BOUNDS, { padding: 24 });
    renderScene(mapB, props.sceneB, "sat-b", "sat-b-layer");
  });

  mapA.on("move", () => { if (mapB) syncMaps(mapA!, mapB); });
  mapB.on("move", () => { if (mapA) syncMaps(mapB!, mapA); });
});

watch(() => props.mode, (mode) => {
  if (mode !== "split") return;
  mapA?.fitBounds(BOUNDS, { padding: 24 });
  mapB?.fitBounds(BOUNDS, { padding: 24 });
});

watch(
  () => props.sceneB,
  (newScene) => {
    if (!mapB) return;
    const sourceId = "sat-b";
    const layerId = "sat-b-layer";
    if (mapB.getLayer(layerId)) mapB.removeLayer(layerId);
    if (mapB.getSource(sourceId)) mapB.removeSource(sourceId);
    renderScene(mapB, newScene, sourceId, layerId);
  },
);

onUnmounted(() => {
  mapA?.remove();
  mapB?.remove();
});
</script>

<template>
  <div class="compare" :class="{ split: (mode ?? 'swipe') === 'split' }">
    <div ref="mapContainerA" class="compare-map" />
    <div
      ref="mapContainerB"
      class="compare-map compare-b"
      :class="{ 'compare-clip': (mode ?? 'swipe') === 'swipe' }"
      :style="{ '--split': splitPos + '%' }"
    />

    <div class="compare-labels">
      <span class="label-a">{{ sceneA.acquiredAt.slice(0, 10) }}</span>
      <span class="label-b">{{ sceneB.acquiredAt.slice(0, 10) }}</span>
    </div>

    <div
      v-if="(mode ?? 'swipe') === 'swipe'"
      ref="handleRef"
      class="compare-handle"
      :style="{ left: splitPos + '%' }"
      @mousedown="onHandleDown"
      @touchstart="onHandleTouchDown"
    >
      <div class="handle-line" />
      <div class="handle-grip">
        <span>◀▶</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.compare {
  position: absolute;
  inset: 0;
  z-index: 10;
}

.compare-map {
  position: absolute;
  inset: 0;
}

.compare-b {
  left: 50%;
  width: 50%;
}

.compare.split .compare-map:first-child {
  width: 50%;
}

.compare:not(.split) .compare-b {
  left: 0;
  width: 100%;
}

.compare-clip {
  clip-path: inset(0 0 0 var(--split));
}

.compare-labels {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 24px;
  z-index: 2;
  pointer-events: none;
}

.compare-labels span {
  font-family: var(--font-mono);
  font-size: 12px;
  padding: 5px 12px;
  border-radius: 4px;
  background: rgba(247, 248, 241, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.label-a {
  color: var(--cat-satellite, #4a7c59);
  font-weight: 600;
}

.label-b {
  color: var(--ink-soft);
}

.compare-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 40px;
  transform: translateX(-50%);
  cursor: col-resize;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
}

.handle-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  background: #fff;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);
  transform: translateX(-50%);
}

.handle-grip {
  position: relative;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid var(--cat-satellite, #4a7c59);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.handle-grip span {
  font-size: 10px;
  color: var(--cat-satellite, #4a7c59);
  letter-spacing: -1px;
}

@media (max-width: 768px) {
  .compare-labels {
    top: 8px;
    gap: 12px;
  }

  .compare-labels span {
    font-size: 11px;
    padding: 4px 8px;
  }

  .compare-handle {
    width: 50px;
  }

  .handle-grip {
    width: 36px;
    height: 36px;
  }

  .handle-grip span {
    font-size: 12px;
  }
}
</style>
