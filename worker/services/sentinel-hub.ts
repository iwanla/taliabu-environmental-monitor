import { getAccessToken } from "./copernicus-token";

const PROCESS_URL = "https://sh.dataspace.copernicus.eu/process/v1";

const SCL_HELPERS = `
function isValid(scl) {
  return scl != 0 && scl != 1 && scl != 3 && scl != 7 && scl != 8 && scl != 9 && scl != 10;
}`;

// ponytail: generated per-request by adding SCL to the input and gating alpha on isValid;
// regenerate server-side if a script's alpha expression ever stops ending in `.dataMask]`
function maskedScript(script: string): string {
  return (
    script
      .replace('"dataMask"]', '"SCL", "dataMask"]')
      .replace(/(\w+)\.dataMask\]/g, "$1.dataMask * (isValid($1.SCL) ? 1 : 0)]") + SCL_HELPERS
  );
}

const MASKED_TYPES = new Set(["ndvi", "ndwi", "mndwi", "false-color", "ndti", "shore-band"]);

const EVALSCRIPTS: Record<string, string> = {
  "true-color": `//VERSION=3
function setup() {
  return {
    input: ["B04", "B03", "B02", "dataMask"],
    output: { bands: 4 }
  };
}
function evaluatePixel(s) {
  return [2.5 * s.B04, 2.5 * s.B03, 2.5 * s.B02, s.dataMask];
}`,
  // Copernicus Browser NDVI default output - stepped if/else, verbatim from their custom script
  ndvi: `//VERSION=3
function setup() {
  return {
    input: ["B04", "B08", "dataMask"],
    output: { bands: 4 }
  };
}
function evaluatePixel(samples) {
  let val = index(samples.B08, samples.B04);
  let imgVals = null;
  if (val<-0.5) imgVals = [0.05,0.05,0.05,samples.dataMask];
  else if (val<-0.2) imgVals = [0.75,0.75,0.75,samples.dataMask];
  else if (val<-0.1) imgVals = [0.86,0.86,0.86,samples.dataMask];
  else if (val<0) imgVals = [0.92,0.92,0.92,samples.dataMask];
  else if (val<0.025) imgVals = [1,0.98,0.8,samples.dataMask];
  else if (val<0.05) imgVals = [0.93,0.91,0.71,samples.dataMask];
  else if (val<0.075) imgVals = [0.87,0.85,0.61,samples.dataMask];
  else if (val<0.1) imgVals = [0.8,0.78,0.51,samples.dataMask];
  else if (val<0.125) imgVals = [0.74,0.72,0.42,samples.dataMask];
  else if (val<0.15) imgVals = [0.69,0.76,0.38,samples.dataMask];
  else if (val<0.175) imgVals = [0.64,0.8,0.35,samples.dataMask];
  else if (val<0.2) imgVals = [0.57,0.75,0.32,samples.dataMask];
  else if (val<0.25) imgVals = [0.5,0.7,0.28,samples.dataMask];
  else if (val<0.3) imgVals = [0.44,0.64,0.25,samples.dataMask];
  else if (val<0.35) imgVals = [0.38,0.59,0.21,samples.dataMask];
  else if (val<0.4) imgVals = [0.31,0.54,0.18,samples.dataMask];
  else if (val<0.45) imgVals = [0.25,0.49,0.14,samples.dataMask];
  else if (val<0.5) imgVals = [0.19,0.43,0.11,samples.dataMask];
  else if (val<0.55) imgVals = [0.13,0.38,0.07,samples.dataMask];
  else if (val<0.6) imgVals = [0.06,0.33,0.04,samples.dataMask];
  else imgVals = [0,0.27,0,samples.dataMask];
  return imgVals;
}`,
  // Copernicus Browser NDWI default output: green ramp on -val, blue ramp on val^(1/4)
  // Copernicus Browser SCL script, verbatim
  scl: `//VERSION=3
function RGBToColor(r, g, b, dataMask) {
  return [r / 255, g / 255, b / 255, dataMask];
}
function setup() {
  return {
    input: ["SCL", "dataMask"],
    output: { bands: 4 }
  };
}
function evaluatePixel(samples) {
  const SCL = samples.SCL;
  switch (SCL) {
    case 0: return RGBToColor(0, 0, 0, samples.dataMask);
    case 1: return RGBToColor(255, 0, 0, samples.dataMask);
    case 2: return RGBToColor(47, 47, 47, samples.dataMask);
    case 3: return RGBToColor(100, 50, 0, samples.dataMask);
    case 4: return RGBToColor(0, 160, 0, samples.dataMask);
    case 5: return RGBToColor(255, 230, 90, samples.dataMask);
    case 6: return RGBToColor(0, 0, 255, samples.dataMask);
    case 7: return RGBToColor(128, 128, 128, samples.dataMask);
    case 8: return RGBToColor(192, 192, 192, samples.dataMask);
    case 9: return RGBToColor(255, 255, 255, samples.dataMask);
    case 10: return RGBToColor(100, 200, 255, samples.dataMask);
    case 11: return RGBToColor(255, 150, 255, samples.dataMask);
    default: return RGBToColor(0, 0, 0, samples.dataMask);
  }
}`,
  ndwi: `//VERSION=3
function setup() {
  return {
    input: ["B03", "B08", "dataMask"],
    output: { bands: 4 }
  };
}
function evaluatePixel(samples) {
  let val = index(samples.B03, samples.B08);
  let imgVals = null;
  if (val < 0) {
    imgVals = colorBlend(-val, [0, 1], [[1, 1, 1], [0, 0.502, 0]]);
  } else {
    imgVals = colorBlend(Math.sqrt(Math.sqrt(val)), [0, 1], [[1, 1, 1], [0, 0, 0.8]]);
  }
  return [imgVals[0], imgVals[1], imgVals[2], samples.dataMask];
}`,
  mndwi: `//VERSION=3
function setup() {
  return {
    input: ["B03", "B11", "dataMask"],
    output: { bands: 4 }
  };
}
function evaluatePixel(s) {
  var mndwi = (s.B03 - s.B11) / (s.B03 + s.B11 + 1e-10);
  var c = colorBlend(mndwi, [-1.0, -0.2, 0.0, 0.3, 1.0], [
    [0.70, 0.50, 0.20, 1],
    [0.85, 0.82, 0.75, 1],
    [0.55, 0.75, 0.82, 1],
    [0.05, 0.30, 0.65, 1],
    [0.00, 0.10, 0.45, 1]
  ]);
  return [c[0], c[1], c[2], s.dataMask];
}`,
  "false-color": `//VERSION=3
function setup() {
  return {
    input: ["B08", "B04", "B03", "dataMask"],
    output: { bands: 4 }
  };
}
function evaluatePixel(s) {
  return [2.5 * s.B08, 2.5 * s.B04, 2.5 * s.B03, s.dataMask];
}`,
  // NDTI (Normalized Difference Turbidity Index, Lacaux et al. 2007):
  // (Red - Green) / (Red + Green) — higher = more turbid water
  ndti: `//VERSION=3
function setup() {
  return {
    input: ["B04", "B03", "dataMask"],
    output: { bands: 4 }
  };
}
function evaluatePixel(s) {
  var val = (s.B04 - s.B03) / (s.B04 + s.B03 + 1e-10);
  var c = colorBlend(val, [-0.4, -0.1, 0.05, 0.25, 0.6], [
    [0.05, 0.25, 0.45, 1],
    [0.15, 0.45, 0.60, 1],
    [0.45, 0.65, 0.60, 1],
    [0.75, 0.65, 0.35, 1],
    [0.55, 0.30, 0.10, 1]
  ]);
  return [c[0], c[1], c[2], s.dataMask];
}`,
  // Scene water edge: NDWI > 0 water with a bright shoreline band for
  // comparison with the baseline coastline across scenes/periods
  "shore-band": `//VERSION=3
function setup() {
  return {
    input: ["B03", "B08", "dataMask"],
    output: { bands: 4 }
  };
}
function evaluatePixel(s) {
  var val = (s.B03 - s.B08) / (s.B03 + s.B08 + 1e-10);
  if (val <= 0) return [0, 0, 0, 0];
  if (val < 0.08) return [0.92, 0.58, 0.15, s.dataMask];
  return [0.35, 0.62, 0.78, s.dataMask];
}`,
  // Copernicus Browser SWIR composite, verbatim
  "bare-soil": `//VERSION=3
let minVal = 0.0;
let maxVal = 0.4;
let viz = new HighlightCompressVisualizer(minVal, maxVal);
function setup() {
  return {
    input: ["B12", "B11", "B04", "dataMask"],
    output: { bands: 4 }
  };
}
function evaluatePixel(samples) {
  let val = [samples.B12, samples.B11, samples.B04, samples.dataMask];
  return viz.processList(val);
}`,
  // Raw metric values encoded as R = (value + 1) / 2, alpha = dataMask * SCL validity.
  // Invalid classes (0 no-data, 1 saturated, 3 shadow, 7 unclassified, 8/9 cloud, 10 cirrus) -> alpha 0.
  // Client-side change detection decodes these back to NDVI/MNDWI and thresholds the delta.
  "ndvi-raw": `//VERSION=3
function setup() {
  return {
    input: ["B08", "B04", "SCL", "dataMask"],
    output: { bands: 4 }
  };
}
function isValid(scl) {
  return scl != 0 && scl != 1 && scl != 3 && scl != 7 && scl != 8 && scl != 9 && scl != 10;
}
function evaluatePixel(s) {
  var ndvi = (s.B08 - s.B04) / (s.B08 + s.B04 + 1e-10);
  return [(ndvi + 1) / 2, 0, 0, s.dataMask * (isValid(s.SCL) ? 1 : 0)];
}
`,
  "mndwi-raw": `//VERSION=3
function setup() {
  return {
    input: ["B03", "B11", "SCL", "dataMask"],
    output: { bands: 4 }
  };
}
function isValid(scl) {
  return scl != 0 && scl != 1 && scl != 3 && scl != 7 && scl != 8 && scl != 9 && scl != 10;
}
function evaluatePixel(s) {
  var mndwi = (s.B03 - s.B11) / (s.B03 + s.B11 + 1e-10);
  return [(mndwi + 1) / 2, 0, 0, s.dataMask * (isValid(s.SCL) ? 1 : 0)];
}
`,
  // SAR raw: VV -> R, VH -> G as dB over [-30, 0], encoded to 0..1. Bands arrive as LINEAR sigma0 power.
  "sar-raw": `//VERSION=3
function setup() {
  return {
    input: ["VV", "VH", "dataMask"],
    output: { bands: 4 }
  };
}
function evaluatePixel(s) {
  var toDb = (v) => 10 * Math.log(v + 1e-8) / Math.LN10;
  var enc = (db) => Math.max(0, Math.min(1, (db + 30) / 30));
  return [enc(toDb(s.VV)), enc(toDb(s.VH)), 0, s.dataMask];
}
`,
  sar: `//VERSION=3
function setup() {
  return {
    input: ["VV", "VH"],
    output: { bands: 4 }
  };
}
function evaluatePixel(s) {
  var vv = 2.5 * Math.pow(s.VV, 0.5);
  var vh = 2.5 * Math.pow(s.VH, 0.5);
  return [vv, vh, vv, 1.0];
}`,
};

export const TRUE_COLOR_EVALSCRIPT = EVALSCRIPTS["true-color"];

export interface RenderOptions {
  bbox: [number, number, number, number];
  from: string;
  to: string;
  maxCloudCoverage?: number;
  width?: number;
  height?: number;
  type?: string;
  evalscript?: string;
  masked?: boolean;
  signal?: AbortSignal;
}

export function getEvalscript(type: string): string | undefined {
  return EVALSCRIPTS[type];
}

export async function renderScene(
  clientId: string,
  clientSecret: string,
  opts: RenderOptions,
): Promise<ReadableStream<Uint8Array>> {
  const token = await getAccessToken(clientId, clientSecret);
  const type = opts.type ?? "true-color";
  const masked = !!opts.masked && MASKED_TYPES.has(type);
  const evalscript = opts.evalscript ?? (masked ? maskedScript(EVALSCRIPTS[type]) : EVALSCRIPTS[type]) ?? TRUE_COLOR_EVALSCRIPT;

  const isSAR = type.startsWith("sar");
  const dataType = isSAR ? "sentinel-1-grd" : "sentinel-2-l2a";

  const dataFilter: Record<string, any> = {
    timeRange: {
      from: `${opts.from}T00:00:00Z`,
      to: `${opts.to}T23:59:59Z`,
    },
  };
  if (!isSAR) {
    dataFilter.maxCloudCoverage = opts.maxCloudCoverage ?? 20;
  }

  const res = await fetch(PROCESS_URL, {
    method: "POST",
    signal: opts.signal,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: {
        bounds: { bbox: opts.bbox },
        data: [
          {
            type: dataType,
            dataFilter,
          },
        ],
      },
      output: {
        width: opts.width ?? 1024,
        height: opts.height ?? 1024,
        responses: [
          {
            identifier: "default",
            format: { type: "image/png" },
          },
        ],
      },
      evalscript,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sentinel Hub Process API error ${res.status}: ${text}`);
  }

  if (!res.body) {
    throw new Error("No response body");
  }

  return res.body;
}
