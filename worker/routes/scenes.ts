import { Hono } from "hono";
import { groupAcquisitions, searchScenes, getLatestAcquisition, type SatelliteTile } from "../services/copernicus-stac";

type Env = {
  DB: D1Database;
};

const scenes = new Hono<{ Bindings: Env }>();

scenes.get("/acquisitions", async (c) => {
  const from = c.req.query("from") ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const to = c.req.query("to") ?? new Date().toISOString().slice(0, 10);
  const collection = c.req.query("collection") ?? "sentinel-2-l2a";
  const maxCloudCover = Number(c.req.query("maxCloudCover") ?? "100");

  const cached = await cachedAcquisitions(c.env.DB, collection, from, to, maxCloudCover);
  if (cached) return c.json({ items: cached, cached: true }, 200, { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" });

  try {
    const tiles = await searchScenes({ collection, from, to, maxCloudCover });
    await persistScenes(c.env.DB, tiles);
    return c.json({ items: groupAcquisitions(tiles) }, 200, { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return c.json({ error: "STAC_PROVIDER_ERROR", message: msg, retryable: true }, 502);
  }
});

export async function persistScenes(db: D1Database, tiles: SatelliteTile[]) {
  if (!tiles.length) return;
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO satellite_scenes (id, collection, acquired_at, cloud_cover, bbox, preview_url, provider)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  await db.batch(tiles.map((t) => stmt.bind(t.id, t.collection, t.acquiredAt, t.cloudCover ?? null, JSON.stringify(t.bbox), t.previewUrl ?? null, t.provider)));
}

async function cachedAcquisitions(db: D1Database, collection: string, from: string, to: string, maxCloudCover: number) {
  const rows = await db
    .prepare(
      `SELECT * FROM satellite_scenes WHERE collection = ? AND provider = ? AND acquired_at >= ? AND acquired_at <= ? AND (cloud_cover IS NULL OR cloud_cover <= ?)`,
    )
    .bind(collection, "copernicus", `${from}T00:00:00Z`, `${to}T23:59:59Z`, maxCloudCover)
    .all<{ id: string; collection: string; acquired_at: string; cloud_cover: number | null; bbox: string; preview_url: string | null; provider: string }>();
  if (!rows.results.length) return null;
  const tiles: SatelliteTile[] = rows.results.map((r) => ({
    id: r.id,
    collection: r.collection,
    acquiredAt: r.acquired_at,
    cloudCover: r.cloud_cover ?? undefined,
    bbox: JSON.parse(r.bbox),
    provider: r.provider as SatelliteTile["provider"],
    previewUrl: r.preview_url ?? undefined,
  }));
  return groupAcquisitions(tiles);
}

scenes.get("/acquisitions/latest", async (c) => {
  const maxCloudCover = Number(c.req.query("maxCloudCover") ?? "100");
  const from = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const to = new Date().toISOString().slice(0, 10);

  const cached = await cachedAcquisitions(c.env.DB, "sentinel-2-l2a", from, to, maxCloudCover);
  if (cached?.length) return c.json(cached[0], 200, { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" });

  try {
    const acquisition = await getLatestAcquisition(maxCloudCover);
    if (!acquisition) {
      return c.json({ error: "NO_USABLE_ACQUISITION", message: "No acquisition found within the last 30 days.", retryable: true }, 404);
    }
    return c.json(acquisition, 200, { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return c.json({ error: "STAC_PROVIDER_ERROR", message: msg, retryable: true }, 502);
  }
});

export default scenes;
