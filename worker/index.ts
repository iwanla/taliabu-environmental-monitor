import { Hono } from "hono";
import { cors } from "hono/cors";
import scenes, { persistScenes } from "./routes/scenes";
import render from "./routes/render";
import alerts from "./routes/alerts";
import { searchScenes } from "./services/copernicus-stac";

type Env = {
  ASSETS: Fetcher;
  DB: D1Database;
  ENVIRONMENT: string;
  API_HOST: string;
  COPERNICUS_CLIENT_ID: string;
  COPERNICUS_CLIENT_SECRET: string;
};

const app = new Hono<{ Bindings: Env }>();

const ASSET_PATH_PREFIXES = ["/assets/", "/data/", "/favicon."];

function isAssetPath(pathname: string): boolean {
  return pathname === "/" || pathname === "/index.html" || ASSET_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

const isApiPath = (url: URL) => url.pathname === "/api" || url.pathname.startsWith("/api/");

const isApiHost = (url: URL, apiHost: string) => url.hostname === apiHost;

app.use("/api/*", cors({
  origin: ["https://environment.jelajahtaliabu.web.id", "http://localhost:5173"],
}));

app.use("*", async (c, next) => {
  const url = new URL(c.req.url);
  if (c.env.ENVIRONMENT === "production" && isApiPath(url) !== isApiHost(url, c.env.API_HOST)) {
    return c.json({ error: "Not found" }, 404);
  }
  await next();
});

app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "0.1.0",
  });
});

app.route("/api", scenes);
app.route("/api", render);
app.route("/api", alerts);

app.all("/api/*", (c) => {
  return c.json({ error: "Not found" }, 404);
});

app.notFound(async (c) => {
  const pathname = new URL(c.req.url).pathname;
  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return c.json({ error: "Not found" }, 404);
  }
  if (!isAssetPath(pathname)) {
    const assetResponse = await c.env.ASSETS.fetch(new Request(new URL("/", c.req.url), {
      method: "GET",
      headers: c.req.raw.headers,
    }));
    return new Response(assetResponse.body, {
      status: 404,
      statusText: "Not Found",
      headers: assetResponse.headers,
    });
  }

  return c.env.ASSETS.fetch(c.req.raw).then((response) => {
    // Do not let an asset fallback turn a missing file into a fake 200 page.
    if (pathname !== "/" && response.headers.get("content-type")?.includes("text/html")) {
      return new Response("Not found", { status: 404 });
    }
    return response;
  });
});

// ponytail: cron daily 06:00 UTC — fetch last 30 days, dedup via INSERT OR IGNORE
async function scheduledHandler(event: ScheduledEvent, env: Env): Promise<void> {
  const from = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const to = new Date().toISOString().slice(0, 10);

  const tiles = await searchScenes({ collection: "sentinel-2-l2a", from, to, maxCloudCover: 100 });
  await persistScenes(env.DB, tiles);

  console.log(`[cron] scene discovery: ${tiles.length} tiles fetched, ${from} → ${to}`);
}

export default {
  fetch: app.fetch,
  scheduled: scheduledHandler,
};
