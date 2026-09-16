import { Hono } from "hono";

type Env = {
  DB: D1Database;
};

interface AlertInput {
  kind: string;
  severity?: string;
  aoi?: GeoJSON.Polygon | null;
  sceneId?: string | null;
  evidence: Record<string, unknown>;
}

const alerts = new Hono<{ Bindings: Env }>();

alerts.post("/alerts", async (c) => {
  const body = await c.req.json<{ alerts?: AlertInput[] }>();
  if (!Array.isArray(body.alerts) || !body.alerts.length) {
    return c.json({ error: "NO_ALERTS" }, 400);
  }
  const stmt = c.env.DB.prepare(
    `INSERT INTO environmental_alerts (kind, severity, aoi, scene_id, evidence) VALUES (?, ?, ?, ?, ?)`,
  );
  await c.env.DB.batch(
    body.alerts.map((a) =>
      stmt.bind(a.kind, a.severity ?? "medium", a.aoi ? JSON.stringify(a.aoi) : null, a.sceneId ?? null, JSON.stringify(a.evidence)),
    ),
  );
  return c.json({ saved: body.alerts.length });
});

alerts.get("/alerts", async (c) => {
  const kind = c.req.query("kind");
  const limit = Math.min(Number(c.req.query("limit") ?? 50), 200);
  const rows = await (kind
    ? c.env.DB.prepare(`SELECT * FROM environmental_alerts WHERE kind = ? ORDER BY id DESC LIMIT ?`).bind(kind, limit)
    : c.env.DB.prepare(`SELECT * FROM environmental_alerts ORDER BY id DESC LIMIT ?`).bind(limit)
  ).all<{ id: number; kind: string; severity: string; aoi: string | null; scene_id: string | null; evidence: string; created_at: string }>();
  return c.json({
    alerts: rows.results.map((r) => ({
      id: r.id,
      kind: r.kind,
      severity: r.severity,
      aoi: r.aoi ? JSON.parse(r.aoi) : null,
      sceneId: r.scene_id,
      evidence: JSON.parse(r.evidence),
      createdAt: r.created_at,
    })),
  });
});

export default alerts;
