import { Hono } from "hono";
import { renderScene } from "../services/sentinel-hub";
import {
  cacheTtlSeconds,
  clampDimension,
  isBboxInBounds,
  renderCacheKey,
  RENDER_BBOX_LIMIT,
} from "../services/render-guards";

type Env = {
  DB: D1Database;
  COPERNICUS_CLIENT_ID: string;
  COPERNICUS_CLIENT_SECRET: string;
};

const VALID_TYPES = ["true-color", "ndvi", "ndwi", "mndwi", "false-color", "bare-soil", "sar", "sar-raw", "scl", "ndvi-raw", "mndwi-raw", "ndti", "shore-band"];

interface RenderedImage {
  bytes: ArrayBuffer;
  contentType: string;
  cacheControl: string;
}

// Same-key renders that arrive while one is in flight (component overlap,
// rapid scene switching) share the single provider call. Buffered bytes keep
// each caller's Response independent — a stream body can only be consumed once.
const inflight = new Map<string, Promise<RenderedImage>>();

// Provider failures are not retried automatically; block immediate re-requests
// of the same key so a debounce loop cannot become a retry storm.
const FAILURE_COOLDOWN_SECONDS = 30;
const failures = new Map<string, number>();

const render = new Hono<{ Bindings: Env }>();

async function countRender(db: D1Database, kind: "ok" | "fail") {
  const id = `quota:${new Date().toISOString().slice(0, 10)}:${kind}`;
  await db
    .prepare(
      `INSERT INTO app_config (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT), updated_at = datetime('now')`,
    )
    .bind(id, "1")
    .run();
}

async function renderAndTrack(
  env: Env,
  opts: Parameters<typeof renderScene>[2],
  ttl: number,
): Promise<RenderedImage> {
  const imageStream = await renderScene(env.COPERNICUS_CLIENT_ID, env.COPERNICUS_CLIENT_SECRET, opts);
  return {
    bytes: await new Response(imageStream).arrayBuffer(),
    contentType: "image/png",
    cacheControl: `public, max-age=${ttl}`,
  };
}

function imageResponse(result: RenderedImage): Response {
  return new Response(result.bytes, {
    headers: { "Content-Type": result.contentType, "Cache-Control": result.cacheControl },
  });
}

function isDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function clampCloud(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 100;
  return Math.min(100, Math.max(0, n));
}

function tilesIntersectBounds(tile: [number, number, number, number]): boolean {
  const [lw, ls, le, ln] = RENDER_BBOX_LIMIT;
  return tile[0] < le && tile[2] > lw && tile[1] < ln && tile[3] > ls;
}

render.post("/render", async (c) => {
  const clientId = c.env.COPERNICUS_CLIENT_ID;
  const clientSecret = c.env.COPERNICUS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return c.json(
      { error: "COPERNICUS_NOT_CONFIGURED", message: "Copernicus credentials not set." },
      500,
    );
  }

  let body: {
    bbox?: [number, number, number, number];
    from?: string;
    to?: string;
    maxCloudCoverage?: number;
    width?: number;
    height?: number;
    type?: string;
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "INVALID_BODY", message: "Request body must be valid JSON." }, 400);
  }

  const type = body.type ?? "true-color";
  if (!VALID_TYPES.includes(type)) {
    return c.json({ error: "INVALID_TYPE", message: `Unknown type: ${type}. Valid: ${VALID_TYPES.join(", ")}` }, 400);
  }

  // ponytail: no client-supplied evalscripts over HTTP — the whitelist above is
  // the only way to reach Process API, so a caller cannot run arbitrary code.
  const bbox = body.bbox ?? [124.42, -2.10, 125.22, -1.52];
  if (!isBboxInBounds(bbox)) {
    return c.json(
      { error: "BBOX_OUT_OF_BOUNDS", message: `bbox must lie within ${RENDER_BBOX_LIMIT.join(",")}` },
      400,
    );
  }

  const now = new Date();
  const from = body.from ?? new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
  const to = body.to ?? now.toISOString().slice(0, 10);
  if (!isDateString(from) || !isDateString(to) || from > to) {
    return c.json({ error: "INVALID_TIMERANGE", message: "from/to must be YYYY-MM-DD with from <= to." }, 400);
  }
  const maxCloudCoverage = clampCloud(body.maxCloudCoverage);
  const width = clampDimension(body.width);
  const height = clampDimension(body.height);

  const cacheKey = renderCacheKey({
    type,
    bbox: bbox.join(","),
    from,
    to,
    maxCloudCoverage,
    width,
    height,
  }).url;
  const ttl = cacheTtlSeconds(to);

  const cache = caches.default;
  const cacheReq = new Request(cacheKey);
  const cached = await cache.match(cacheReq);
  if (cached) {
    return cached;
  }

  const failedAt = failures.get(cacheKey);
  if (failedAt && Date.now() - failedAt < FAILURE_COOLDOWN_SECONDS * 1000) {
    return c.json({ error: "RENDER_COOLDOWN", message: "Recent failure for this request; retry shortly.", retryable: true }, 503);
  }

  let pending = inflight.get(cacheKey);
  if (!pending) {
    pending = (async () => {
      const params = JSON.stringify({ bbox, from, to, maxCloudCoverage, width, height });
      const run = await c.env.DB.prepare(`INSERT INTO analysis_runs (type, params) VALUES (?, ?)`)
        .bind(type, params)
        .run<{ meta: { last_row_id: number } }>();

      try {
        const result = await renderAndTrack(c.env, {
          bbox: bbox as [number, number, number, number],
          from,
          to,
          maxCloudCoverage,
          width,
          height,
          type,
        }, ttl);

        await c.env.DB.prepare(`UPDATE analysis_runs SET status = 'done', finished_at = datetime('now') WHERE id = ?`)
          .bind(run.meta.last_row_id)
          .run();
        await countRender(c.env.DB, "ok");
        failures.delete(cacheKey);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        await c.env.DB.prepare(`UPDATE analysis_runs SET status = 'failed', error = ?, finished_at = datetime('now') WHERE id = ?`)
          .bind(msg, run.meta.last_row_id)
          .run();
        await countRender(c.env.DB, "fail");
        failures.set(cacheKey, Date.now());
        throw err;
      } finally {
        inflight.delete(cacheKey);
      }
    })();
    inflight.set(cacheKey, pending);
  }

  try {
    const result = await pending;
    c.executionCtx.waitUntil(cache.put(cacheReq, imageResponse(result)));
    return imageResponse(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return c.json({ error: "RENDER_ERROR", message: msg, retryable: true }, 502);
  }
});

render.get("/render/tile/:z/:x/:y", async (c) => {
  if (!c.env.COPERNICUS_CLIENT_ID || !c.env.COPERNICUS_CLIENT_SECRET) {
    return c.json(
      { error: "COPERNICUS_NOT_CONFIGURED", message: "Copernicus credentials not set." },
      500,
    );
  }

  const z = +c.req.param("z");
  const x = +c.req.param("x");
  const y = +c.req.param("y");
  const n = 2 ** z;
  if (!(z >= 6 && z <= 18) || !(x >= 0 && x < n) || !(y >= 0 && y < n)) {
    return c.json({ error: "INVALID_TILE" }, 400);
  }

  const type = c.req.query("type") ?? "true-color";
  if (!VALID_TYPES.includes(type)) {
    return c.json({ error: "INVALID_TYPE", message: `Unknown type: ${type}. Valid: ${VALID_TYPES.join(", ")}` }, 400);
  }

  const from = c.req.query("from");
  const to = c.req.query("to") ?? from;
  if (!from || !to) {
    return c.json({ error: "MISSING_TIMERANGE", message: "from (and optionally to) query params required." }, 400);
  }
  if (!isDateString(from) || !isDateString(to) || from > to) {
    return c.json({ error: "INVALID_TIMERANGE", message: "from/to must be YYYY-MM-DD with from <= to." }, 400);
  }

  const lat = (t: number) => (Math.atan(Math.sinh(Math.PI * (1 - (2 * t) / n))) * 180) / Math.PI;
  const bbox: [number, number, number, number] = [
    (x / n) * 360 - 180,
    lat(y + 1),
    ((x + 1) / n) * 360 - 180,
    lat(y),
  ];

  // Reject tiles outside the Taliabu render window so the proxy cannot be used
  // as a general-purpose Sentinel Hub tile fetcher.
  if (!tilesIntersectBounds(bbox)) {
    return c.json({ error: "TILE_OUT_OF_BOUNDS" }, 400);
  }

  try {
    const imageStream = await renderScene(c.env.COPERNICUS_CLIENT_ID, c.env.COPERNICUS_CLIENT_SECRET, {
      bbox,
      from,
      to,
      maxCloudCoverage: clampCloud(c.req.query("maxCloud")),
      width: 256,
      height: 256,
      type,
      masked: c.req.query("mask") === "1",
      signal: c.req.raw.signal,
    });
    return new Response(imageStream, {
      headers: {
        "Content-Type": "image/png",
        // Tiles are immutable per (z,x,y,type,from,to,mask); Cloudflare/browser
        // can reuse them for a week without reaching the provider.
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return c.json({ error: "RENDER_ERROR", message: msg, retryable: true }, 502);
  }
});

export default render;