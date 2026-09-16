import { length, lineString } from "@turf/turf";

// D8 grid produced by scripts/terrain/hydro.py (see public/data/terrain/terrain.json)
const FDR_BBOX: [number, number, number, number] = [124.2, -2.35, 125.4, -1.15];
const CODES = [1, 2, 4, 8, 16, 32, 64, 128];
const OFFSETS: [number, number][] = [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]];
const MAX_STEPS = 20_000;

export interface DownstreamPath {
  coordinates: [number, number][];
  distanceKm: number;
  outlet: [number, number];
}

let fdrImage: { data: Uint8ClampedArray; w: number; h: number } | null = null;

async function loadFdr() {
  if (fdrImage) return fdrImage;
  const res = await fetch("/data/terrain/fdr.png");
  if (!res.ok) return null;
  const bitmap = await createImageBitmap(await res.blob());
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  fdrImage = { data: ctx.getImageData(0, 0, bitmap.width, bitmap.height).data, w: bitmap.width, h: bitmap.height };
  return fdrImage;
}

export async function traceDownstream(lon: number, lat: number): Promise<DownstreamPath | null> {
  const img = await loadFdr();
  if (!img) return null;
  const [west, south, east, north] = FDR_BBOX;
  const { data, w, h } = img;
  let x = Math.floor(((lon - west) / (east - west)) * w);
  let y = Math.floor(((north - lat) / (north - south)) * h);
  const toLL = (cx: number, cy: number): [number, number] => [
    +(west + ((cx + 0.5) * (east - west)) / w).toFixed(5),
    +(north - ((cy + 0.5) * (north - south)) / h).toFixed(5),
  ];

  const coordinates: [number, number][] = [toLL(x, y)];
  for (let step = 0; step < MAX_STEPS; step++) {
    const p = (y * w + x) * 4;
    if (data[p + 3] === 0) break; // ocean reached
    const code = data[p];
    if (!code) break; // sink
    const [dy, dx] = OFFSETS[CODES.indexOf(code)];
    x += dx;
    y += dy;
    if (x < 0 || x >= w || y < 0 || y >= h) break;
    if (step % 4 === 0) coordinates.push(toLL(x, y));
  }
  const outlet = coordinates[coordinates.length - 1];
  const distanceKm = length(lineString(coordinates), { units: "kilometers" });
  return { coordinates, distanceKm, outlet };
}
