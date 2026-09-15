import { Hono } from "hono";
import { groupAcquisitions, searchScenes, getLatestAcquisition } from "../services/planetary-computer-stac";

type Env = {
  DB: D1Database;
};

const scenes = new Hono<{ Bindings: Env }>();

scenes.get("/acquisitions", async (c) => {
  const from = c.req.query("from") ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const to = c.req.query("to") ?? new Date().toISOString().slice(0, 10);
  const collection = c.req.query("collection") ?? "sentinel-2-l2a";
  const maxCloudCover = Number(c.req.query("maxCloudCover") ?? "20");

  try {
    const tiles = await searchScenes({ collection, from, to, maxCloudCover });
    return c.json({ items: groupAcquisitions(tiles) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return c.json({ error: "STAC_PROVIDER_ERROR", message: msg, retryable: true }, 502);
  }
});

scenes.get("/acquisitions/latest", async (c) => {
  const maxCloudCover = Number(c.req.query("maxCloudCover") ?? "20");

  try {
    const acquisition = await getLatestAcquisition(maxCloudCover);
    if (!acquisition) {
      return c.json({ error: "NO_USABLE_ACQUISITION", message: "No acquisition found within the last 30 days.", retryable: true }, 404);
    }
    return c.json(acquisition);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return c.json({ error: "STAC_PROVIDER_ERROR", message: msg, retryable: true }, 502);
  }
});

export default scenes;
