import { area, intersect, pointToLineDistance, booleanPointInPolygon, centroid, featureCollection, point, distance } from "@turf/turf";
import { traceDownstream } from "./terrain";

export const AOI_MAX_HA = 10_000;

export interface AoiAnalysis {
  areaHa: number;
  permitPct: number;
  permits: string[];
  nearestRiver?: { name: string; distanceM: number };
  nearestSettlement?: { name: string; distanceM: number };
  coastDistanceM?: number;
  watershed?: string;
  elevation?: { minM: number; maxM: number; meanM: number };
  slope?: { meanDeg: number; maxDeg: number };
  downstream?: { distanceKm: number; outlet: [number, number] };
}

const cache = new Map<string, Promise<GeoJSON.FeatureCollection>>();

function load(url: string): Promise<GeoJSON.FeatureCollection> {
  if (!cache.has(url)) cache.set(url, fetch(url).then((r) => r.json()));
  return cache.get(url)!;
}

function isPolygonal(g: GeoJSON.Geometry): g is GeoJSON.Polygon | GeoJSON.MultiPolygon {
  return g.type === "Polygon" || g.type === "MultiPolygon";
}

function isLineal(g: GeoJSON.Geometry): g is GeoJSON.LineString | GeoJSON.MultiLineString {
  return g.type === "LineString" || g.type === "MultiLineString";
}

export async function analyzeAoi(polygon: GeoJSON.Polygon): Promise<AoiAnalysis> {
  const [iup, rivers, coast, watersheds, settlementAreas] = await Promise.all([
    load("/data/mining/iup.geojson"),
    load("/data/hydrology/rivers.geojson"),
    load("/data/coastal/baseline-coastline.geojson"),
    load("/data/hydrology/watersheds.geojson"),
    load("/data/human/settlement-areas.geojson"),
  ]);

  const areaHa = area(polygon) / 10_000;
  const center = centroid(polygon);

  const permits: string[] = [];
  let permitAreaM2 = 0;
  for (const f of iup.features) {
    if (!isPolygonal(f.geometry)) continue;
    const inter = intersect(
      featureCollection([
        { type: "Feature", properties: {}, geometry: polygon } as GeoJSON.Feature<GeoJSON.Polygon>,
        f as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>,
      ]),
    );
    if (inter) {
      permitAreaM2 += area(inter);
      permits.push(String(f.properties?.name ?? "IUP"));
    }
  }

  let nearestRiver: AoiAnalysis["nearestRiver"];
  for (const f of rivers.features) {
    if (!isLineal(f.geometry)) continue;
    const dM = pointToLineDistance(center, f as GeoJSON.Feature<GeoJSON.LineString>, { units: "kilometers" }) * 1000;
    if (!nearestRiver || dM < nearestRiver.distanceM) {
      nearestRiver = { name: String(f.properties?.name ?? "River"), distanceM: dM };
    }
  }

  let coastDistanceM: number | undefined;
  for (const f of coast.features) {
    if (!isLineal(f.geometry)) continue;
    const dM = pointToLineDistance(center, f as GeoJSON.Feature<GeoJSON.LineString>, { units: "kilometers" }) * 1000;
    coastDistanceM = coastDistanceM == null ? dM : Math.min(coastDistanceM, dM);
  }

  let nearestSettlement: AoiAnalysis["nearestSettlement"];
  for (const f of settlementAreas.features) {
    const rings: GeoJSON.Position[][] =
      f.geometry?.type === "Polygon" ? f.geometry.coordinates :
      f.geometry?.type === "MultiPolygon" ? (f.geometry.coordinates as GeoJSON.Position[][][]).flat() : [];
    for (const ring of rings) {
      for (const coord of ring) {
        const dM = distance(center, point(coord), { units: "kilometers" }) * 1000;
        if (!nearestSettlement || dM < nearestSettlement.distanceM) {
          nearestSettlement = { name: String(f.properties?.name ?? "").trim() || "Settlement", distanceM: dM };
        }
      }
    }
  }

  const watershedFeat = watersheds.features.find(
    (f) => isPolygonal(f.geometry) && booleanPointInPolygon(center, f as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>),
  );

  const terrain = await sampleTerrain(polygon);
  const downstream = await traceDownstream(center.geometry.coordinates[0], center.geometry.coordinates[1]);

  return {
    areaHa,
    permitPct: areaHa > 0 ? (permitAreaM2 / (areaHa * 10_000)) * 100 : 0,
    permits,
    nearestRiver,
    nearestSettlement,
    coastDistanceM,
    watershed: watershedFeat ? String(watershedFeat.properties?.name ?? "Watershed") : undefined,
    ...terrain,
    downstream: downstream ? { distanceKm: downstream.distanceKm, outlet: downstream.outlet } : undefined,
  };
}

// DEMNAS static rasters preprocessed by scripts/terrain/preprocess.py (see terrain.json)
const TERRAIN_BBOX: [number, number, number, number] = [124.2, -2.35, 125.4, -1.15];
const ELEV_RANGE: [number, number] = [0, 1400];
const SLOPE_RANGE: [number, number] = [0, 60];

async function decodeRaster(url: string): Promise<{ data: Uint8ClampedArray; w: number; h: number } | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  const bitmap = await createImageBitmap(await res.blob());
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  return { data: ctx.getImageData(0, 0, bitmap.width, bitmap.height).data, w: bitmap.width, h: bitmap.height };
}

async function sampleTerrain(polygon: GeoJSON.Polygon): Promise<Pick<AoiAnalysis, "elevation" | "slope">> {
  const [elev, slope] = await Promise.all([
    decodeRaster("/data/terrain/elevation.png"),
    decodeRaster("/data/terrain/slope.png"),
  ]);
  if (!elev || !slope) return {};

  const [west, south, east, north] = TERRAIN_BBOX;
  const { w, h } = elev;
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d")!;
  ctx.beginPath();
  polygon.coordinates[0].forEach(([lon, lat], i) => {
    const x = ((lon - west) / (east - west)) * w;
    const y = ((north - lat) / (north - south)) * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
  const mask = ctx.getImageData(0, 0, w, h).data;

  let n = 0, eMin = Infinity, eMax = -Infinity, eSum = 0, sSum = 0, sMax = 0;
  for (let p = 0; p < w * h; p++) {
    if (mask[p * 4 + 3] === 0 || elev.data[p * 4 + 3] === 0) continue;
    const elevM = (elev.data[p * 4] / 255) * (ELEV_RANGE[1] - ELEV_RANGE[0]) + ELEV_RANGE[0];
    const slopeDeg = (slope.data[p * 4] / 255) * (SLOPE_RANGE[1] - SLOPE_RANGE[0]) + SLOPE_RANGE[0];
    n++;
    eMin = Math.min(eMin, elevM);
    eMax = Math.max(eMax, elevM);
    eSum += elevM;
    sSum += slopeDeg;
    sMax = Math.max(sMax, slopeDeg);
  }
  if (!n) return {};
  return {
    elevation: { minM: eMin, maxM: eMax, meanM: eSum / n },
    slope: { meanDeg: sSum / n, maxDeg: sMax },
  };
}
