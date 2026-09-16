import { bbox } from "@turf/turf";

export type ChangeType = "vegetation-loss" | "new-bare-land" | "water-change" | "sar-loss";

export interface ChangeResult {
  type: ChangeType;
  url: string;
  bbox: [number, number, number, number];
  dateA: string;
  dateB: string;
  changedHa: number;
  coverage: number;
}

interface Rule {
  metric: "ndvi-raw" | "mndwi-raw" | "sar-raw";
  label: string;
  test: (a: number, b: number) => number; // 0 = no change, 1/2 = change class
  colors: [number, number, number][];
  channel?: "r" | "g"; // encoded metric channel (default r)
  range?: [number, number]; // encoded value range (default [-1, 1])
  lookbackDays?: number; // per-date acquisition window (default 10)
}

const WATER = 0.1;

export const CHANGE_RULES: Record<ChangeType, Rule> = {
  "vegetation-loss": {
    metric: "ndvi-raw",
    label: "NDVI drop >= 0.15",
    test: (a, b) => (b - a <= -0.15 ? 1 : 0),
    colors: [[192, 57, 43]],
  },
  "new-bare-land": {
    metric: "ndvi-raw",
    label: "NDVI >= 0.2 dropped below 0.2",
    test: (a, b) => (a >= 0.2 && b < 0.2 ? 1 : 0),
    colors: [[214, 137, 16]],
  },
  "water-change": {
    metric: "mndwi-raw",
    label: "MNDWI crossed 0.1 (gain or loss)",
    test: (a, b) => (a < WATER && b >= WATER ? 1 : a >= WATER && b < WATER ? 2 : 0),
    colors: [[31, 93, 154], [230, 126, 34]],
  },
  "sar-loss": {
    metric: "sar-raw",
    label: "SAR VH backscatter drop >= 2.5 dB",
    test: (a, b) => (b - a <= -2.5 ? 1 : 0),
    colors: [[146, 43, 33]],
    channel: "g", // VH
    range: [-30, 0], // dB
    lookbackDays: 13, // Sentinel-1 revisit is 12 days; guarantee >=1 pass per window
  },
};

const decode = (v: number, [min, max]: [number, number]) => (v / 255) * (max - min) + min;

// Pure diff over raw-metric RGBA buffers (alpha = dataMask). Returns changed-pixel count and a painted RGBA buffer.
export function diffPixels(
  a: Uint8ClampedArray,
  b: Uint8ClampedArray,
  type: ChangeType,
  mask?: Uint8Array, // per-pixel 0/1, e.g. rasterized AOI polygon; omit = count everything
) {
  const rule = CHANGE_RULES[type];
  const out = new Uint8ClampedArray(a.length);
  let changed = 0;
  let valid = 0;
  let px = -1;
  for (let i = 0; i < a.length; i += 4) {
    px++;
    if (mask && !mask[px]) continue;
    if (a[i + 3] === 0 || b[i + 3] === 0) continue;
    valid++;
    const ch = rule.channel === "g" ? i + 1 : i;
    const cls = rule.test(decode(a[ch], rule.range ?? [-1, 1]), decode(b[ch], rule.range ?? [-1, 1]));
    if (!cls) continue;
    changed++;
    const c = rule.colors[cls - 1];
    out[i] = c[0];
    out[i + 1] = c[1];
    out[i + 2] = c[2];
    out[i + 3] = 255;
  }
  return { out, changed, valid };
}

async function renderRaw(metric: Rule["metric"], date: string, box: [number, number, number, number], lookbackDays: number): Promise<ImageData> {
  const to = date;
  const from = new Date(new Date(date).getTime() - (lookbackDays - 1) * 86400000).toISOString().slice(0, 10);
  const res = await fetch("/api/render", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bbox: box, from, to, maxCloudCoverage: 20, width: 512, height: 512, type: metric }),
  });
  if (!res.ok) throw new Error(`render ${metric} @ ${date}: HTTP ${res.status}`);
  const bitmap = await createImageBitmap(await res.blob());
  const canvas = new OffscreenCanvas(512, 512);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  return ctx.getImageData(0, 0, 512, 512);
}

export async function runChangeDetection(
  type: ChangeType,
  dateA: string,
  dateB: string,
  aoi: GeoJSON.Polygon,
): Promise<ChangeResult> {
  if (dateA > dateB) [dateA, dateB] = [dateB, dateA];
  const [west, south, east, north] = bbox(aoi);
  const box: [number, number, number, number] = [west, south, east, north];
  const rule = CHANGE_RULES[type];
  const [a, b] = await Promise.all([
    renderRaw(rule.metric, dateA, box, rule.lookbackDays ?? 10),
    renderRaw(rule.metric, dateB, box, rule.lookbackDays ?? 10),
  ]);

  const mask = aoiMask(aoi, box, a.width, a.height);
  const { out, changed, valid } = diffPixels(a.data, b.data, type, mask.mask);
  const canvas = new OffscreenCanvas(a.width, a.height);
  canvas.getContext("2d")!.putImageData(new ImageData(out, a.width, a.height), 0, 0);
  const url = URL.createObjectURL(await canvas.convertToBlob({ type: "image/png" }));

  const midLat = (south + north) / 2;
  const mPerPxX = ((east - west) * 111320 * Math.cos((midLat * Math.PI) / 180)) / a.width;
  const mPerPxY = ((north - south) * 110540) / a.height;
  const pixelM2 = mPerPxX * mPerPxY;

  return {
    type,
    url,
    bbox: box,
    dateA,
    dateB,
    changedHa: (changed * pixelM2) / 10_000,
    coverage: mask.inside ? valid / mask.inside : 0,
  };
}

// Rasterize AOI exterior ring into a 0/1 pixel mask over the bbox grid.
function aoiMask(aoi: GeoJSON.Polygon, box: [number, number, number, number], w: number, h: number) {
  const [west, south, east, north] = box;
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d")!;
  ctx.beginPath();
  aoi.coordinates[0].forEach(([lon, lat], i) => {
    const x = ((lon - west) / (east - west)) * w;
    const y = ((north - lat) / (north - south)) * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
  const data = ctx.getImageData(0, 0, w, h).data;
  const mask = new Uint8Array(w * h);
  let inside = 0;
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    if (data[i + 3] > 0) {
      mask[p] = 1;
      inside++;
    }
  }
  return { mask, inside };
}
