import { mkdir, readFile, writeFile } from "node:fs/promises";
import { bbox, booleanIntersects } from "@turf/turf";

const ROOT = new URL("../", import.meta.url);
const RETRIEVED_AT = new Date().toISOString().slice(0, 10);
const PAGE_SIZE = 1000;
const REQUEST_TIMEOUT_MS = 300_000;

const SOURCES = {
  mining: {
    url: "https://kspservices.big.go.id/satupeta/rest/services/PUBLIK/PERIZINAN_DAN_PERTANAHAN/MapServer/4",
    output: "public/data/mining/iup.geojson",
  },
  rivers: {
    url: "https://geoservices.big.go.id/rbi/rest/services/BASEMAP/Rupabumi_Indonesia/MapServer/673",
    output: "public/data/hydrology/rivers.geojson",
  },
  watersheds: {
    url: "https://geoservices.big.go.id/gis/rest/services/PTRA/Atlas_Wilayah_Sungai/MapServer/5",
    output: "public/data/hydrology/watersheds.geojson",
  },
  settlements: {
    url: "https://geoservices.big.go.id/rbi/rest/services/BASEMAP/Rupabumi_Indonesia/MapServer/97",
    output: "public/data/human/settlements.geojson",
    allowEmpty: true,
  },
  "settlement-areas": {
    url: "https://geoservices.big.go.id/rbi/rest/services/BASEMAP/Rupabumi_Indonesia/MapServer/808",
    output: "public/data/human/settlement-areas.geojson",
  },
} as const;
const only = process.argv.find((arg) => arg.startsWith("--only="))?.split("=")[1];

type Collection = GeoJSON.FeatureCollection<GeoJSON.Geometry>;

async function fetchJson(url: string): Promise<any> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json() as Collection & { error?: { code?: number; message?: string; details?: string[] } };
      if (data.error) {
        const details = data.error.details?.filter(Boolean).join("; ");
        throw new Error(`ArcGIS ${data.error.code ?? "error"}: ${data.error.message ?? "query failed"}${details ? ` (${details})` : ""}`);
      }
      return data;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 2_000));
    }
  }
  throw lastError;
}

async function fetchArcGisGeoJson(url: string, extent: [number, number, number, number], outFields = "*") {
  const features: GeoJSON.Feature[] = [];
  let offset = 0;

  while (true) {
    const [xmin, ymin, xmax, ymax] = extent;
    const params = new URLSearchParams({
      where: "1=1",
      geometry: `${xmin},${ymin},${xmax},${ymax}`,
      geometryType: "esriGeometryEnvelope",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      outFields,
      returnGeometry: "true",
      outSR: "4326",
      resultOffset: String(offset),
      resultRecordCount: String(PAGE_SIZE),
      f: "geojson",
    });
    const page = await fetchJson(`${url}/query?${params}`);
    const collection = page as Collection;
    features.push(...collection.features);
    if (page.features.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return { type: "FeatureCollection", features } as Collection;
}

function prop(properties: Record<string, unknown>, ...keys: string[]) {
  return keys.map((key) => properties[key]).find((value) => value !== null && value !== undefined && value !== "");
}

function dateValue(value: unknown) {
  if (typeof value !== "number") return value ?? null;
  return new Date(value).toISOString().slice(0, 10);
}

function keepIntersecting(collection: Collection, taliabu: GeoJSON.Feature) {
  return collection.features.filter((feature) => feature.geometry && booleanIntersects(feature, taliabu));
}

function normalizeMining(collection: Collection): Collection {
  return {
    type: "FeatureCollection",
    features: collection.features.map((feature) => ({
      ...feature,
      properties: {
        name: prop(feature.properties ?? {}, "nmoprt") ?? "Unnamed IUP",
        type: "mining_permit",
        permit_id: prop(feature.properties ?? {}, "idblok"),
        permit_number: prop(feature.properties ?? {}, "skblok"),
        permit_class: prop(feature.properties ?? {}, "tipopr"),
        commodity: prop(feature.properties ?? {}, "commdt"),
        status: prop(feature.properties ?? {}, "status"),
        issuer: prop(feature.properties ?? {}, "issuer"),
        valid_from: dateValue(prop(feature.properties ?? {}, "datstr")),
        valid_to: dateValue(prop(feature.properties ?? {}, "datend")),
        area_ha: prop(feature.properties ?? {}, "lublok"),
        province: prop(feature.properties ?? {}, "prov"),
        regency: prop(feature.properties ?? {}, "kab"),
        source: "BIG Kebijakan Satu Peta",
        source_layer: "Peta Wilayah Izin Usaha Pertambangan",
        retrieved_at: RETRIEVED_AT,
      },
    })),
  };
}

function normalizeRivers(collection: Collection): Collection {
  return {
    type: "FeatureCollection",
    features: collection.features.map((feature) => ({
      ...feature,
      properties: {
        name: prop(feature.properties ?? {}, "NAMOBJ", "name")
          ?? (prop(feature.properties ?? {}, "LCODE") ? `Sungai ${prop(feature.properties ?? {}, "LCODE")}` : "Unnamed river"),
        river_type: prop(feature.properties ?? {}, "REMARK", "river_type"),
        type_code: prop(feature.properties ?? {}, "TIPSNG", "type_code"),
        river_order: prop(feature.properties ?? {}, "KLSSNG", "river_order"),
        water_region: prop(feature.properties ?? {}, "NAMWS", "water_region"),
        watershed: prop(feature.properties ?? {}, "NAMDAS", "watershed"),
        status: prop(feature.properties ?? {}, "STATUS", "status"),
        source: "BIG Rupabumi Indonesia",
        source_layer: "Sungai (Garis)",
        retrieved_at: RETRIEVED_AT,
      },
    })),
  };
}

function normalizeWatersheds(collection: Collection): Collection {
  return {
    type: "FeatureCollection",
    features: collection.features.map((feature) => ({
      ...feature,
      properties: {
        code: prop(feature.properties ?? {}, "kode_das", "code"),
        name: prop(feature.properties ?? {}, "Nama_DAS", "nama_das", "name") ?? "Unnamed watershed",
        area_ha: prop(feature.properties ?? {}, "luas_ha", "area_ha"),
        classification: prop(feature.properties ?? {}, "klsfks", "classification"),
        management_unit: prop(feature.properties ?? {}, "bpdashl", "management_unit"),
        notes: prop(feature.properties ?? {}, "keterangan", "notes"),
        source: "BIG Atlas Wilayah Sungai",
        source_layer: "SUMBERDAYAAIR_DAERAHALIRANSUNGAI",
        retrieved_at: RETRIEVED_AT,
      },
    })),
  };
}

function normalizeSettlements(collection: Collection): Collection {
  return {
    type: "FeatureCollection",
    features: collection.features.map((feature) => ({
      ...feature,
      properties: {
        name: prop(feature.properties ?? {}, "NAMOBJ", "name") ?? "Unnamed settlement",
        type: prop(feature.properties ?? {}, "REMARK", "type") ?? "settlement",
        description: prop(feature.properties ?? {}, "REMARK", "description"),
        source_code: prop(feature.properties ?? {}, "FCODE", "source_code"),
        source_updated_at: dateValue(prop(feature.properties ?? {}, "UPDATED", "source_updated_at")),
        source: "BIG Rupabumi Indonesia",
        source_layer: "Permukiman (titik)",
        retrieved_at: RETRIEVED_AT,
      },
    })),
  };
}

function normalizeSettlementAreas(collection: Collection): Collection {
  return {
    type: "FeatureCollection",
    features: collection.features.map((feature) => ({
      ...feature,
      properties: {
        name: prop(feature.properties ?? {}, "NAMOBJ", "name") ?? "Unnamed settlement area",
        type: prop(feature.properties ?? {}, "REMARK", "type") ?? "settlement_area",
        description: prop(feature.properties ?? {}, "REMARK", "description"),
        source_code: prop(feature.properties ?? {}, "FCODE", "source_code"),
        source_updated_at: dateValue(prop(feature.properties ?? {}, "UPDATED", "source_updated_at")),
        source: "BIG Rupabumi Indonesia",
        source_layer: "Permukiman (area)",
        retrieved_at: RETRIEVED_AT,
      },
    })),
  };
}

const boundary = JSON.parse(await readFile(new URL("public/data/boundaries/taliabu-island.web.geojson", ROOT), "utf8")) as Collection;
const taliabu = boundary.features[0];
if (!taliabu) throw new Error("Taliabu boundary is empty");
const extent = bbox(taliabu) as [number, number, number, number];

console.log(`Syncing BIG reference layers for bbox ${extent.join(",")}`);
const selectedSources = Object.entries(SOURCES).filter(([name]) => !only || name === only);
if (only && !selectedSources.length) throw new Error(`Unknown source: ${only}`);

const raw = await Promise.all(selectedSources.map(async ([name, source]) => {
  console.log(`Fetching ${name}...`);
    const outFields = name === "rivers"
      ? "OBJECTID,NAMOBJ,REMARK,NAMDAS,NAMWS,TIPSNG,KLSSNG,STATUS,LCODE"
      : name === "settlements" || name === "settlement-areas"
        ? "OBJECTID,NAMOBJ,REMARK,FCODE,UPDATED"
      : "*";
    return [name, source, keepIntersecting(await fetchArcGisGeoJson(source.url, extent, outFields), taliabu)] as const;
}));

const outputs: Record<string, Collection> = {};
for (const [name, , features] of raw) {
  outputs[name] = name === "mining" ? normalizeMining({ type: "FeatureCollection", features })
    : name === "rivers" ? normalizeRivers({ type: "FeatureCollection", features })
    : name === "watersheds" ? normalizeWatersheds({ type: "FeatureCollection", features })
    : name === "settlements" ? normalizeSettlements({ type: "FeatureCollection", features })
    : normalizeSettlementAreas({ type: "FeatureCollection", features });
}

for (const [name, source] of selectedSources) {
  const output = outputs[name];
  if (!output.features.length && !source.allowEmpty) {
    throw new Error(`${name}: query returned no intersecting features; refusing to overwrite existing data`);
  }
  await mkdir(new URL(`./${source.output.substring(0, source.output.lastIndexOf("/"))}/`, ROOT), { recursive: true });
  await writeFile(new URL(`./${source.output}`, ROOT), `${JSON.stringify(output, null, 2)}\n`);
  console.log(`${name}: ${output.features.length} features`);
}
