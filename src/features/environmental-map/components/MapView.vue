<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { Map as MaplibreMap, LngLatBounds } from "maplibre-gl";
import type { GeoJSONSource, MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import MapLegend from "./MapLegend.vue";
import { useLayers } from "../composables/useLayers";
import type { MapLayerDefinition } from "@/shared/types/layers";

export interface SatelliteTile {
  id: string;
  collection: string;
  acquiredAt: string;
  cloudCover?: number;
  bbox: number[];
}

export interface SatelliteAcquisition {
  id: string;
  date: string;
  acquiredAt: string;
  tiles: SatelliteTile[];
  tileCount: number;
  coverage: number;
  cloudCover?: number;
  quality: "excellent" | "good" | "cloudy" | "partial";
  source: "sentinel-2";
}

export interface MapViewCamera {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
}

const props = defineProps<{
  activeScenes?: SatelliteAcquisition[];
  initialView?: MapViewCamera;
  drawMode?: boolean;
  aoi?: GeoJSON.Polygon | null;
}>();

const emit = defineEmits<{
  featureSelected: [feature: GeoJSON.Feature | null, layerId: string | null];
  viewChanged: [view: MapViewCamera];
  aoiDrawn: [polygon: GeoJSON.Polygon];
  aoiCancelled: [];
}>();

const EMPTY_FC: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };
const drawPoints = ref<[number, number][]>([]);

const { layers, isVisible, getOpacity } = useLayers();
const mapContainer = ref<HTMLDivElement>();
let map: MaplibreMap | null = null;
const loadedSources = new Set<string>();

const RASTER_BBOX: [number, number, number, number] = [123.8, -2.5, 125.8, -1.0];
const RASTER_COORDS: [[number, number], [number, number], [number, number], [number, number]] = [
  [RASTER_BBOX[0], RASTER_BBOX[3]],
  [RASTER_BBOX[2], RASTER_BBOX[3]],
  [RASTER_BBOX[2], RASTER_BBOX[1]],
  [RASTER_BBOX[0], RASTER_BBOX[1]],
];

const activeRasterLayers = new Map<string, { url: string }>();

async function loadGeoJSON(sourceId: string, url: string) {
  if (!map || loadedSources.has(sourceId)) return;
  const res = await fetch(url);
  const data = await res.json();
  map.addSource(sourceId, { type: "geojson", data });
  loadedSources.add(sourceId);
}

function addLayerToMap(def: MapLayerDefinition) {
  if (!map || def.type !== "vector") return;

  const sourceId = def.id;
  const layerId = `${def.id}-layer`;

  if (map.getLayer(layerId)) return;

  const paint = def.paint as Record<string, any>;
  const type = def.layerType === "point" ? "circle" : def.layerType;

  const fillPaint: Record<string, any> = {};
  const linePaint: Record<string, any> = {};
  for (const [k, v] of Object.entries(paint)) {
    if (type === "fill" && k.startsWith("line-")) {
      linePaint[k] = v;
    } else {
      fillPaint[k] = v;
    }
  }

  map.addLayer({ id: layerId, type, source: sourceId, paint: fillPaint } as any);

  const visible = isVisible(def.id);
  const opacity = visible ? getOpacity(def.id) : 0;

  if (type === "line") {
    map.setPaintProperty(layerId, "line-opacity", opacity);
    map.setLayoutProperty(layerId, "line-cap", "round");
    map.setLayoutProperty(layerId, "line-join", "round");
  } else if (type === "circle") {
    map.setPaintProperty(layerId, "circle-opacity", opacity);
  } else {
    map.setPaintProperty(layerId, "fill-opacity", opacity);
  }

  if (type === "fill" && Object.keys(linePaint).length > 0) {
    const outlineId = `${def.id}-outline`;
    map.addLayer({ id: outlineId, type: "line", source: sourceId, paint: linePaint });
    map.setPaintProperty(outlineId, "line-opacity", opacity);
  }
}

function updateLayerVisibility(def: MapLayerDefinition) {
  if (!map || def.type !== "vector") return;
  const layerId = `${def.id}-layer`;
  if (!map.getLayer(layerId)) return;

  const visible = isVisible(def.id);
  const opacity = getOpacity(def.id);

  if (def.layerType === "point") {
    map.setPaintProperty(layerId, "circle-opacity", visible ? opacity : 0);
  } else if (def.layerType === "fill") {
    map.setPaintProperty(layerId, `${def.layerType}-opacity`, visible ? opacity : 0);
    const outlineId = `${def.id}-outline`;
    if (map.getLayer(outlineId)) {
      map.setPaintProperty(outlineId, "line-opacity", visible ? opacity : 0);
    }
  } else {
    map.setPaintProperty(layerId, `${def.layerType}-opacity`, visible ? opacity : 0);
  }
}

function addRasterLayer(def: MapLayerDefinition, imageUrl: string) {
  if (!map || def.type !== "raster") return;

  const sourceId = `${def.id}-raster-src`;
  const layerId = `${def.id}-layer`;

  if (map.getLayer(layerId)) map.removeLayer(layerId);
  if (map.getSource(sourceId)) map.removeSource(sourceId);

  map.addSource(sourceId, {
    type: "image",
    url: imageUrl,
    coordinates: RASTER_COORDS,
  });

  const beforeLayer = map.getLayer("taliabu-boundary-fill") ? "taliabu-boundary-fill" : undefined;
  map.addLayer(
    { id: layerId, type: "raster", source: sourceId, paint: { "raster-opacity": getOpacity(def.id) } },
    beforeLayer,
  );
}

function updateRasterVisibility(def: MapLayerDefinition) {
  if (!map || def.type !== "raster") return;
  const layerId = `${def.id}-layer`;
  if (!map.getLayer(layerId)) return;

  const visible = isVisible(def.id);
  const opacity = getOpacity(def.id);
  map.setPaintProperty(layerId, "raster-opacity", visible ? opacity : 0);
}

function ensureAoiLayers() {
  if (!map || map.getSource("aoi-draw")) return;

  map.addSource("aoi-draw", { type: "geojson", data: EMPTY_FC });
  map.addLayer({
    id: "aoi-draw-line",
    type: "line",
    source: "aoi-draw",
    filter: ["==", ["geometry-type"], "LineString"],
    paint: { "line-color": "#C68A22", "line-width": 2, "line-dasharray": [2, 2] },
  });
  map.addLayer({
    id: "aoi-draw-verts",
    type: "circle",
    source: "aoi-draw",
    filter: ["==", ["geometry-type"], "Point"],
    paint: { "circle-radius": 4, "circle-color": "#C68A22", "circle-stroke-color": "#fff", "circle-stroke-width": 1.5 },
  });

  map.addSource("aoi-area", { type: "geojson", data: EMPTY_FC });
  map.addLayer({
    id: "aoi-area-fill",
    type: "fill",
    source: "aoi-area",
    paint: { "fill-color": "#C68A22", "fill-opacity": 0.14 },
  });
  map.addLayer({
    id: "aoi-area-line",
    type: "line",
    source: "aoi-area",
    paint: { "line-color": "#C68A22", "line-width": 2.5 },
  });
}

function updateLiveDraw() {
  if (!map) return;
  const source = map.getSource("aoi-draw") as GeoJSONSource | undefined;
  if (!source) return;
  const features: GeoJSON.Feature[] = drawPoints.value.map((c) => ({
    type: "Feature",
    properties: {},
    geometry: { type: "Point", coordinates: c },
  }));
  if (drawPoints.value.length >= 2) {
    features.push({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: drawPoints.value },
    });
  }
  source.setData({ type: "FeatureCollection", features });
}

function handleDrawClick(e: MapMouseEvent) {
  drawPoints.value.push([e.lngLat.lng, e.lngLat.lat]);
  updateLiveDraw();
}

function handleDrawFinish() {
  if (!props.drawMode) return;
  const pts = drawPoints.value;
  const cleaned = pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]);
  if (cleaned.length < 3) return;
  cleaned.push(cleaned[0]);
  drawPoints.value = [];
  updateLiveDraw();
  emit("aoiDrawn", { type: "Polygon", coordinates: [cleaned] });
}

function renderAoi() {
  if (!map) return;
  const source = map.getSource("aoi-area") as GeoJSONSource | undefined;
  if (!source) return;
  source.setData(
    props.aoi
      ? { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: props.aoi }] }
      : EMPTY_FC,
  );
}

function onAoiKeydown(e: KeyboardEvent) {
  if (e.key !== "Escape" || !props.drawMode) return;
  drawPoints.value = [];
  updateLiveDraw();
  emit("aoiCancelled");
}

async function loadRasterLayer(def: MapLayerDefinition, from: string) {
  if (!map || def.type !== "raster") return;

  const sourceId = `${def.id}-raster-src`;
  const layerId = `${def.id}-layer`;

  const isSAR = def.source.evalscriptKey === "sar";
  const to = isSAR
    ? new Date(new Date(from).getTime() + 30 * 86400000).toISOString().slice(0, 10)
    : from;

  try {
    const res = await fetch("/api/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bbox: RASTER_BBOX,
        from,
        to,
        type: def.source.evalscriptKey,
        maxCloudCoverage: 20,
        width: 1536,
        height: 1024,
      }),
    });

    if (!res.ok) return;

    const blob = await res.blob();
    const imageUrl = URL.createObjectURL(blob);

    const existing = map.getSource(sourceId);
    if (existing && "updateImage" in existing) {
      (existing as any).updateImage({ url: imageUrl });
    } else {
      addRasterLayer(def, imageUrl);
    }

    activeRasterLayers.set(def.id, { url: imageUrl });
  } catch {
    // silent fail
  }
}

function unloadRasterLayer(def: MapLayerDefinition) {
  if (!map || def.type !== "raster") return;

  const sourceId = `${def.id}-raster-src`;
  const layerId = `${def.id}-layer`;

  if (map.getLayer(layerId)) map.removeLayer(layerId);
  if (map.getSource(sourceId)) map.removeSource(sourceId);

  const entry = activeRasterLayers.get(def.id);
  if (entry) {
    URL.revokeObjectURL(entry.url);
    activeRasterLayers.delete(def.id);
  }
}

async function updateRasterLayers(from: string) {
  for (const def of layers.value) {
    if (def.type === "raster" && isVisible(def.id)) {
      loadRasterLayer(def, from);
    }
  }
}

async function updateSatelliteLayers(scenes: SatelliteAcquisition[]) {
  if (!map) return;

  const layerId = "sentinel-layer";
  const sourceId = "sentinel";

  if (!scenes.length) {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
    return;
  }

  const scene = scenes[0];
  const from = scene.acquiredAt.slice(0, 10);

  try {
    const res = await fetch("/api/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bbox: [123.8, -2.5, 125.8, -1.0],
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

    const existing = map.getSource(sourceId);
    if (existing && "updateImage" in existing) {
      (existing as any).updateImage({ url: imageUrl });
    } else {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (existing) map.removeSource(sourceId);

      map.addSource(sourceId, {
        type: "image",
        url: imageUrl,
        coordinates: RASTER_COORDS,
      });

      const beforeLayer = map.getLayer("taliabu-boundary-fill") ? "taliabu-boundary-fill" : undefined;
      map.addLayer(
        { id: layerId, type: "raster", source: sourceId, paint: { "raster-opacity": 0.85 } },
        beforeLayer,
      );
    }

    updateRasterLayers(from);
  } catch {
    // silent fail
  }
}

function zoomIn() { map?.zoomIn(); }
function zoomOut() { map?.zoomOut(); }
function locateMe() {
  if (!map) return;
  navigator.geolocation.getCurrentPosition(
    (pos) => map!.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 12 }),
    () => {},
  );
}
function resetView() {
  if (!map) return;
  map.fitBounds(
    new LngLatBounds([124.3371, -2.0332], [125.3269, -1.6300]),
    { padding: 80 },
  );
}

onMounted(async () => {
  if (!mapContainer.value) return;

  map = new MaplibreMap({
    container: mapContainer.value,
    style: "https://tiles.openfreemap.org/styles/liberty",
    center: props.initialView?.center ?? [124.83, -1.83],
    zoom: props.initialView?.zoom ?? 8,
    bearing: props.initialView?.bearing ?? 0,
    pitch: props.initialView?.pitch ?? 0,
  });

  map.on("load", async () => {
    if (!map) return;

    const res = await fetch("/data/boundaries/taliabu-island.web.geojson");
    const geojson = await res.json();

    map.addSource("taliabu-boundary", { type: "geojson", data: geojson });

    map.addLayer({
      id: "taliabu-boundary-fill",
      type: "fill",
      source: "taliabu-boundary",
      paint: { "fill-color": "#E9E6D5", "fill-opacity": 0.15 },
    });

    map.addLayer({
      id: "taliabu-boundary-line",
      type: "line",
      source: "taliabu-boundary",
      paint: { "line-color": "#3E4C44", "line-width": 2 },
    });

    const coords = geojson.features[0].geometry.coordinates[0];
    const lons = coords.map((c: number[]) => c[0]);
    const lats = coords.map((c: number[]) => c[1]);
    const bounds = new LngLatBounds(
      [Math.min(...lons), Math.min(...lats)],
      [Math.max(...lons), Math.max(...lats)]
    );
    if (!props.initialView) map.fitBounds(bounds, { padding: 80 });

    for (const def of layers.value) {
      if (def.type === "vector") {
        await loadGeoJSON(def.id, def.source.url);
        addLayerToMap(def);
      }
    }

    ensureAoiLayers();
    renderAoi();

  map.on("click", (e) => {
      if (!map) return;
      if (props.drawMode) {
        handleDrawClick(e);
        return;
      }
      const clickedLayers = layers.value
        .filter((d) => isVisible(d.id))
        .map((d) => `${d.id}-layer`);

      const features = map.queryRenderedFeatures(e.point, { layers: clickedLayers });
      if (features.length > 0) {
        emit("featureSelected", features[0] as unknown as GeoJSON.Feature, features[0].layer?.id ?? null);
      } else {
        emit("featureSelected", null, null);
      }
    });

    map.on("dblclick", (e) => {
      if (!props.drawMode) return;
      e.preventDefault();
      handleDrawFinish();
    });

    map.on("move", () => {
      if (!map) return;
      emit("viewChanged", {
        center: [map.getCenter().lng, map.getCenter().lat],
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
      });
    });

    if (props.activeScenes?.length) updateSatelliteLayers(props.activeScenes);
  });
});

watch(() => props.activeScenes, (scenes) => updateSatelliteLayers(scenes ?? []), { deep: true });

watch(() => props.drawMode, (mode) => {
  if (!map) return;
  map.doubleClickZoom[mode ? "disable" : "enable"]();
  map.getCanvas().style.cursor = mode ? "crosshair" : "";
  if (mode) {
    drawPoints.value = [];
    updateLiveDraw();
  }
});

watch(() => props.aoi, renderAoi);

onMounted(() => document.addEventListener("keydown", onAoiKeydown));

onUnmounted(() => {
  document.removeEventListener("keydown", onAoiKeydown);
  map?.remove();
});

watch(
  () => layers.value.map((l) => ({ id: l.id, type: l.type, visible: isVisible(l.id), opacity: getOpacity(l.id) })),
  (curr, prev) => {
    layers.value.forEach((def) => {
      if (def.type === "raster") {
        const wasVisible = prev?.find((p) => p.id === def.id)?.visible ?? false;
        const isVisibleNow = isVisible(def.id);

        if (isVisibleNow && !wasVisible) {
          const scene = props.activeScenes?.[0];
          if (scene) loadRasterLayer(def, scene.acquiredAt.slice(0, 10));
        } else if (!isVisibleNow && wasVisible) {
          unloadRasterLayer(def);
        } else if (isVisibleNow) {
          updateRasterVisibility(def);
        }
      } else {
        updateLayerVisibility(def);
      }
    });
  },
  { deep: true }
);
</script>

<template>
  <div class="map">
    <div ref="mapContainer" class="map-container" />

    <div class="map-topleft">
      <span class="chip">optical · L2A</span>
      <span class="chip sar">SAR available</span>
    </div>

    <div class="map-controls">
      <button class="btn-icon" title="Zoom in" @click="zoomIn">+</button>
      <button class="btn-icon" title="Zoom out" @click="zoomOut">–</button>
      <button class="btn-icon" title="Reset to Taliabu extent" @click="resetView">⟲</button>
      <button class="btn-icon" title="Locate me" @click="locateMe">◎</button>
    </div>

    <div class="map-bottom">
      <MapLegend />
      <div class="scale">
        <div class="bar"></div>
        <span>2 km</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map {
  position: relative;
  overflow: hidden;
  height: 100%;
  width: 100%;
}

.map-container {
  height: 100%;
  width: 100%;
}

.map-topleft {
  position: absolute;
  top: 14px;
  left: 14px;
  display: flex;
  gap: 8px;
  align-items: center;
  z-index: 1;
}

.chip {
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 5px 10px;
  border-radius: 20px;
  background: rgba(247, 248, 241, .92);
  color: var(--ink);
  border: 1px solid rgba(255, 255, 255, .4);
}

.chip.sar {
  background: rgba(91, 94, 143, .92);
  color: #fff;
}

.map-controls {
  position: absolute;
  top: 14px;
  right: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 1;
}

.btn-icon {
  width: 30px;
  height: 30px;
  padding: 0;
  justify-content: center;
  background: var(--paper-raised);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.map-bottom {
  position: absolute;
  left: 14px;
  bottom: 14px;
  display: flex;
  gap: 14px;
  align-items: flex-end;
  z-index: 1;
}

.scale {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
}

.scale .bar {
  width: 80px;
  height: 4px;
  background: rgba(247, 248, 241, .95);
  border-radius: 2px;
}

.scale span {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: #E7E9DD;
}
</style>
