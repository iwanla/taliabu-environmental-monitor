import { Hono } from "hono";
import { cors } from "hono/cors";
import scenes, { persistScenes } from "./routes/scenes";
import render from "./routes/render";
import alerts from "./routes/alerts";
import { searchScenes } from "./services/planetary-computer-stac";

type Env = {
  ASSETS: Fetcher;
  DB: D1Database;
  COPERNICUS_CLIENT_ID: string;
  COPERNICUS_CLIENT_SECRET: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use("/api/*", cors());

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

app.notFound((c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

// ponytail: cron daily 06:00 UTC — fetch last 30 days, dedup via INSERT OR IGNORE
async function scheduledHandler(event: ScheduledEvent, env: Env): Promise<void> {
  const from = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const to = new Date().toISOString().slice(0, 10);

  const tiles = await searchScenes({ collection: "sentinel-2-l2a", from, to, maxCloudCover: 20 });
  await persistScenes(env.DB, tiles);

  console.log(`[cron] scene discovery: ${tiles.length} tiles fetched, ${from} → ${to}`);
}

export default {
  fetch: app.fetch,
  scheduled: scheduledHandler,
};
