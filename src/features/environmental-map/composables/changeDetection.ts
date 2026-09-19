import { bbox } from "@turf/turf";

export type ChangeType = "vegetation-loss" | "new-bare-land" | "water-change";

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
  metric: "ndvi-raw" | "mndwi-raw";
  label: string;
  test: (a: number, b: number) => number; // 0 = no change, 1/2 = change class
  colors: [number, number, number][];
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
};

const decode = (v: number) => (v / 255) * 2 - 1;

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
    const cls = rule.test(decode(a[i]), decode(b[i]));
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

export async function renderRaw(metric: Rule["metric"], date: string, box: [number, number, number, number]): Promise<ImageData> {
  const to = date;
  // 10-day lookback: per-tile revisit can still leave windows empty; SCL masks cloudy pixels.
  const from = new Date(new Date(date).getTime() - 9 * 86400000).toISOString().slice(0, 10);
  const res = await fetch("/api/render", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bbox: box, from, to, maxCloudCoverage: 100, width: 512, height: 512, type: metric }),
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
  const metric = CHANGE_RULES[type].metric;
  const [a, b] = await Promise.all([renderRaw(metric, dateA, box), renderRaw(metric, dateB, box)]);

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

// Rasterize polygon exterior/interior rings into a 0/1 pixel mask over the bbox grid.
// Accepts Polygon and MultiPolygon (holes filled via evenodd).
export function aoiMask(shape: GeoJSON.Polygon | GeoJSON.MultiPolygon, box: [number, number, number, number], w: number, h: number) {
  const [west, south, east, north] = box;
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d")!;
  ctx.beginPath();
  const polys = shape.type === "Polygon" ? [shape.coordinates] : shape.coordinates;
  for (const poly of polys) {
    for (const ring of poly) {
      ring.forEach(([lon, lat], i) => {
        const x = ((lon - west) / (east - west)) * w;
        const y = ((north - lat) / (north - south)) * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
    }
  }
  ctx.fill("evenodd");
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
