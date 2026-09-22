import { bbox } from "@turf/turf";
import { apiUrl } from "@/shared/api";
import { RenderError, throwFriendlyRenderError } from "@/shared/render-errors";
import { CHANGE_RULES, diffPixels, type ChangeType } from "./changeDetectionCore";

export { CHANGE_RULES, diffPixels, type ChangeType } from "./changeDetectionCore";
export { RenderError } from "@/shared/render-errors";

export interface ChangeResult {
  type: ChangeType;
  url: string;
  bbox: [number, number, number, number];
  dateA: string;
  dateB: string;
  changedHa: number;
  coverage: number;
}

export async function renderRaw(metric: "ndvi-raw" | "mndwi-raw", date: string, box: [number, number, number, number]): Promise<ImageData> {
  const to = date;
  // 10-day lookback: per-tile revisit can still leave windows empty; SCL masks cloudy pixels.
  const from = new Date(new Date(date).getTime() - 9 * 86400000).toISOString().slice(0, 10);
  const res = await fetch(apiUrl("/api/render"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bbox: box, from, to, maxCloudCoverage: 100, width: 512, height: 512, type: metric }),
  });
  if (!res.ok) await throwFriendlyRenderError(res);
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
