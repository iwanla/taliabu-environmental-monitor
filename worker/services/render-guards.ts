// Input bounds for the Sentinel Hub Process API proxy.
// The largest caller is CompareView (1536x1024); cap with headroom so a client
// cannot ask for an unbounded raster and burn provider processing units.
export const MAX_RENDER_DIM = 1600;
export const DEFAULT_RENDER_DIM = 1024;

// Union of the scene-selection bbox [124.42, -2.10, 125.22, -1.52] and the
// render bbox [123.8, -2.5, 125.8, -1.0] used by CompareView/MapView.
export const RENDER_BBOX_LIMIT: [number, number, number, number] = [123.8, -2.5, 125.8, -1.0];

export function clampDimension(value: unknown, fallback = DEFAULT_RENDER_DIM): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(16, Math.min(Math.round(n), MAX_RENDER_DIM));
}

export function isBboxInBounds(bbox: [number, number, number, number]): boolean {
  const [w, s, e, n] = bbox;
  if (![w, s, e, n].every((v) => Number.isFinite(v))) return false;
  if (w >= e || s >= n) return false;
  const [lw, ls, le, ln] = RENDER_BBOX_LIMIT;
  const eps = 1e-6;
  return w >= lw - eps && s >= ls - eps && e <= le + eps && n <= ln + eps;
}

// Deterministic cache key for a render request. Sorted params so the same
// request built in a different order always maps to the same key.
export function renderCacheKey(parts: Record<string, string | number>): Request {
  const params = new URLSearchParams();
  for (const key of Object.keys(parts).sort()) params.set(key, String(parts[key]));
  return new Request(`https://render-cache.taliabu.internal/?${params}`);
}

// Historical windows are stable; the last couple of days can still take new
// acquisitions, so cache them briefly.
export function cacheTtlSeconds(to: string): number {
  const recent = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
  return to >= recent ? 3600 : 604800;
}