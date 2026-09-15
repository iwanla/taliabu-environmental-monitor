import { getAccessToken } from "./copernicus-token";

const PROCESS_URL = "https://sh.dataspace.copernicus.eu/process/v1";

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
  ndvi: `//VERSION=3
function setup() {
  return {
    input: ["B08", "B04", "dataMask"],
    output: { bands: 4 }
  };
}
function evaluatePixel(s) {
  var ndvi = (s.B08 - s.B04) / (s.B08 + s.B04 + 1e-10);
  var c = colorBlend(ndvi, [0.0, 0.25, 0.5, 0.75, 1.0], [
    [0.65, 0.15, 0.10, 1],
    [0.90, 0.60, 0.15, 1],
    [0.95, 0.90, 0.40, 1],
    [0.45, 0.75, 0.25, 1],
    [0.05, 0.40, 0.05, 1]
  ]);
  return [c[0], c[1], c[2], s.dataMask];
}`,
  ndwi: `//VERSION=3
function setup() {
  return {
    input: ["B03", "B08", "dataMask"],
    output: { bands: 4 }
  };
}
function evaluatePixel(s) {
  var ndwi = (s.B03 - s.B08) / (s.B03 + s.B08 + 1e-10);
  var c = colorBlend(ndwi, [0.0, 0.3, 0.5, 0.7, 1.0], [
    [0.85, 0.82, 0.75, 1],
    [0.55, 0.75, 0.82, 1],
    [0.20, 0.55, 0.75, 1],
    [0.05, 0.30, 0.65, 1],
    [0.00, 0.10, 0.45, 1]
  ]);
  return [c[0], c[1], c[2], s.dataMask];
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
  "bare-soil": `//VERSION=3
function setup() {
  return {
    input: ["B12", "B08A", "B04", "dataMask"],
    output: { bands: 4 }
  };
}
function evaluatePixel(s) {
  return [2.5 * s.B12, 2.5 * s.B08A, 2.5 * s.B04, s.dataMask];
}`,
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
  const evalscript = opts.evalscript ?? EVALSCRIPTS[type] ?? TRUE_COLOR_EVALSCRIPT;

  const isSAR = type === "sar";
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
