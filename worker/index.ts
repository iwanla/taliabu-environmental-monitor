import { Hono } from "hono";
import { cors } from "hono/cors";
import scenes from "./routes/scenes";
import render from "./routes/render";

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

app.all("/api/*", (c) => {
  return c.json({ error: "Not found" }, 404);
});

app.notFound((c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
