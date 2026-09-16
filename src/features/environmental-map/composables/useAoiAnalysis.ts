import { area, intersect, pointToLineDistance, booleanPointInPolygon, centroid, featureCollection, point, distance } from "@turf/turf";

export const AOI_MAX_HA = 10_000;

export interface AoiAnalysis {
  areaHa: number;
  permitPct: number;
  permits: string[];
  nearestRiver?: { name: string; distanceM: number };
  nearestSettlement?: { name: string; distanceM: number };
  coastDistanceM?: number;
  watershed?: string;
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

  return {
    areaHa,
    permitPct: areaHa > 0 ? (permitAreaM2 / (areaHa * 10_000)) * 100 : 0,
    permits,
    nearestRiver,
    nearestSettlement,
    coastDistanceM,
    watershed: watershedFeat ? String(watershedFeat.properties?.name ?? "Watershed") : undefined,
  };
}
