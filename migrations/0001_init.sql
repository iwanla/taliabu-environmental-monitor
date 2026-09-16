-- Phase 14: D1 Persistence — metadata only, no rasters/tiles
CREATE TABLE satellite_scenes (
  id TEXT PRIMARY KEY,
  collection TEXT NOT NULL,
  acquired_at TEXT NOT NULL,
  cloud_cover REAL,
  bbox TEXT NOT NULL,
  preview_url TEXT,
  provider TEXT NOT NULL DEFAULT 'planetary-computer',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_scenes_acquired ON satellite_scenes (acquired_at DESC);

CREATE TABLE analysis_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  params TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'done', 'failed')),
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  finished_at TEXT
);
CREATE INDEX idx_runs_created ON analysis_runs (created_at DESC);

CREATE TABLE environmental_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  severity TEXT,
  aoi TEXT,
  scene_id TEXT,
  evidence TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
