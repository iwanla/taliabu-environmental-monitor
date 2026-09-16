import { Hono } from "hono";
import { renderScene, getEvalscript } from "../services/sentinel-hub";

type Env = {
  COPERNICUS_CLIENT_ID: string;
  COPERNICUS_CLIENT_SECRET: string;
};

const VALID_TYPES = ["true-color", "ndvi", "ndwi", "mndwi", "false-color", "bare-soil", "sar", "ndvi-raw", "mndwi-raw"];

const render = new Hono<{ Bindings: Env }>();

render.post("/render", async (c) => {
  const clientId = c.env.COPERNICUS_CLIENT_ID;
  const clientSecret = c.env.COPERNICUS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return c.json(
      { error: "COPERNICUS_NOT_CONFIGURED", message: "Copernicus credentials not set." },
      500,
    );
  }

  const body = await c.req.json<{
    bbox?: [number, number, number, number];
    from?: string;
    to?: string;
    maxCloudCoverage?: number;
    width?: number;
    height?: number;
    type?: string;
    evalscript?: string;
  }>();

  const type = body.type ?? "true-color";
  if (!VALID_TYPES.includes(type)) {
    return c.json({ error: "INVALID_TYPE", message: `Unknown type: ${type}. Valid: ${VALID_TYPES.join(", ")}` }, 400);
  }

  const bbox = body.bbox ?? [124.42, -2.10, 125.22, -1.52];
  const now = new Date();
  const from = body.from ?? new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
  const to = body.to ?? now.toISOString().slice(0, 10);

  try {
    const imageStream = await renderScene(clientId, clientSecret, {
      bbox: bbox as [number, number, number, number],
      from,
      to,
      maxCloudCoverage: body.maxCloudCoverage ?? 20,
      width: body.width ?? 1024,
      height: body.height ?? 1024,
      type,
      evalscript: body.evalscript,
    });

    return new Response(imageStream, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return c.json({ error: "RENDER_ERROR", message: msg, retryable: true }, 502);
  }
});

export default render;
