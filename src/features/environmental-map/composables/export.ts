// Phase 16 export helpers: PNG with attribution stamp, CSV with units,
// GeoJSON with context, shareable URL (aoi + cam params).

export const SATELLITE_SOURCE = "Sentinel-2 L2A · Copernicus Data Space (Sentinel Hub)";
export const DATA_ATTRIBUTION = "© OpenFreeMap · © OpenStreetMap contributors";

export interface MapLike {
  once(event: string, handler: () => void): void;
  triggerRepaint(): void;
  getCanvas(): HTMLCanvasElement;
}

export function exportFileStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

export function exportStamp(observationDate: string | null): string {
  return `Taliabu Environmental Monitor · Sentinel-2 L2A · ${observationDate ?? "no scene"} · ${DATA_ATTRIBUTION}`;
}

export function downloadBlob(filename: string, blob: Blob) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

// Capture after the next repaint (WebGL buffer is complete during 'render'),
// then stamp an attribution bar under the map.
export async function exportMapPng(map: MapLike, footer: string): Promise<Blob> {
  const rendered = new Promise<void>((resolve) => map.once("render", resolve));
  map.triggerRepaint();
  await rendered;
  const src = map.getCanvas();
  const dpr = src.width / (src.getBoundingClientRect().width || src.width);
  const barH = Math.round(26 * dpr);
  const out = document.createElement("canvas");
  out.width = src.width;
  out.height = src.height + barH;
  const ctx = out.getContext("2d")!;
  ctx.drawImage(src, 0, 0);
  ctx.fillStyle = "rgba(28, 24, 19, 0.88)";
  ctx.fillRect(0, src.height, out.width, barH);
  ctx.fillStyle = "#F2EEE6";
  ctx.font = `${Math.round(11 * dpr)}px ui-monospace, monospace`;
  ctx.textBaseline = "middle";
  ctx.fillText(footer, 8 * dpr, src.height + barH / 2);
  const blob = await new Promise<Blob | null>((r) => out.toBlob(r, "image/png"));
  if (!blob) throw new Error("PNG export failed");
  return blob;
}

export type CsvRow = [string, number | string, string, string?];

export function toCsv(rows: CsvRow[]): string {
  const esc = (v: unknown) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  return ["metric,value,unit,note", ...rows.map((r) => r.map(esc).join(","))].join("\n");
}

const r5 = (n: number) => +n.toFixed(5);

export function encodeAoi(polygon: GeoJSON.Polygon): string {
  return encodeURIComponent(JSON.stringify(polygon.coordinates.map((ring) => ring.map(([x, y]) => [r5(x), r5(y)]))));
}

export function decodeAoi(raw: string): GeoJSON.Polygon | null {
  try {
    const coordinates = JSON.parse(decodeURIComponent(raw)) as GeoJSON.Position[][];
    const validRing = (ring: unknown) =>
      Array.isArray(ring) && ring.length >= 4 && ring.every((p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite));
    if (!Array.isArray(coordinates) || !coordinates.some(validRing)) return null;
    return { type: "Polygon", coordinates };
  } catch {
    return null;
  }
}

export function buildShareUrl(
  href: string,
  aoi: GeoJSON.Polygon | null,
  camera: { center: [number, number]; zoom: number } | null,
): string {
  const url = new URL(href);
  if (aoi) url.searchParams.set("aoi", encodeAoi(aoi));
  else url.searchParams.delete("aoi");
  if (camera) url.searchParams.set("cam", [r5(camera.center[0]), r5(camera.center[1]), +camera.zoom.toFixed(2)].join(","));
  return url.toString();
}
