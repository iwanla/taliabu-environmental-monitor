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

// ponytail: tolerance fingerprint — 0.1 ha / 4dp bbox / 5dp AOI; tighten if real duplicates slip through.
// Excludes generatedAt so re-running the same analysis cannot re-log the same alert.
function fingerprint(a: AlertInput): string {
  const e = a.evidence as { dateA?: string; dateB?: string; changedHa?: number; bbox?: number[] };
  const ring = a.aoi?.coordinates[0]?.map((p) => p.map((n) => n.toFixed(5)).join(",")).join(";") ?? "";
  return [a.kind, e.dateA ?? "", e.dateB ?? "", (e.changedHa ?? 0).toFixed(1), (e.bbox ?? []).map((n) => n.toFixed(4)).join(","), ring].join("|");
}

alerts.post("/alerts", async (c) => {
  const body = await c.req.json<{ alerts?: AlertInput[] }>();
  if (!Array.isArray(body.alerts) || !body.alerts.length) {
    return c.json({ error: "NO_ALERTS" }, 400);
  }
  const stmt = c.env.DB.prepare(
    `INSERT OR IGNORE INTO environmental_alerts (kind, severity, aoi, scene_id, evidence, fingerprint) VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const results = await c.env.DB.batch(
    body.alerts.map((a) =>
      stmt.bind(a.kind, a.severity ?? "medium", a.aoi ? JSON.stringify(a.aoi) : null, a.sceneId ?? null, JSON.stringify(a.evidence), fingerprint(a)),
    ),
  );
  const saved = results.reduce((n, r) => n + (r.meta.changes ?? 0), 0);
  return c.json({ saved, duplicates: body.alerts.length - saved });
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
  }, 200, { "Cache-Control": "public, max-age=60" });
});

export default alerts;
