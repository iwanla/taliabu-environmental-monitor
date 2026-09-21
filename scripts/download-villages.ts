import { mkdir, writeFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
const SOURCE_URL = "https://geoservices.big.go.id/rbi/rest/services/BATASWILAYAH/BATAS_DESAKEL_AR/MapServer/0";
const OUTPUT_URL = new URL("public/data/boundaries/villages.geojson", ROOT);
const PAGE_SIZE = 1_000;
const RETRIEVED_AT = new Date().toISOString().slice(0, 10);

type Feature = GeoJSON.Feature<GeoJSON.Geometry, Record<string, unknown>>;
type Collection = GeoJSON.FeatureCollection<GeoJSON.Geometry, Record<string, unknown>>;
type ArcGisResponse = Collection & {
  exceededTransferLimit?: boolean;
  error?: { code?: number; message?: string; details?: string[] };
};

const where = "WADMKK='Pulau Taliabu' AND TIPADM IN (1,2)";
const features: Feature[] = [];

for (let offset = 0; ; offset += PAGE_SIZE) {
  const params = new URLSearchParams({
    where,
    outFields: "*",
    returnGeometry: "true",
    outSR: "4326",
    resultOffset: String(offset),
    resultRecordCount: String(PAGE_SIZE),
    f: "geojson",
  });
  const response = await fetch(`${SOURCE_URL}/query?${params}`, {
    signal: AbortSignal.timeout(300_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const page = await response.json() as ArcGisResponse;
  if (page.error) {
    const details = page.error.details?.filter(Boolean).join("; ");
    throw new Error(`ArcGIS ${page.error.code ?? "error"}: ${page.error.message ?? "query failed"}${details ? ` (${details})` : ""}`);
  }

  features.push(...page.features);
  if (page.features.length < PAGE_SIZE && !page.exceededTransferLimit) break;
}

if (!features.length) throw new Error("BIG returned no village features");

const output: Collection = {
  type: "FeatureCollection",
  features: features.map((feature) => ({
    ...feature,
    properties: {
      ...feature.properties,
      name: feature.properties?.NAMOBJ ?? feature.properties?.name ?? "Unnamed village",
      source: "BIG Rupabumi Indonesia",
      source_layer: "Batas Desa/Kelurahan Administratif",
      retrieved_at: RETRIEVED_AT,
    },
  })),
};

await mkdir(new URL("public/data/boundaries/", ROOT), { recursive: true });
await writeFile(OUTPUT_URL, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${output.features.length} village features to ${OUTPUT_URL.pathname}`);
