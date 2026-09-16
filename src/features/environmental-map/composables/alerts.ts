import { CHANGE_RULES, type ChangeResult } from "./changeDetection";
import type { AoiAnalysis } from "./useAoiAnalysis";

export interface AlertThresholds {
  vegLossHa: number; // vegetation loss area >= threshold
  distanceM: number; // proximity to river / coast
}

export const DEFAULT_THRESHOLDS: AlertThresholds = { vegLossHa: 5, distanceM: 500 };

export interface AlertEvidence {
  rule: string;
  method: string;
  metric: string;
  changedHa: number;
  coverage: number;
  dateA: string;
  dateB: string;
  bbox: [number, number, number, number];
  thresholds: AlertThresholds;
  context?: Record<string, unknown>;
  source: string;
  generatedAt: string;
}

export interface EnvAlert {
  kind: string;
  severity: "high" | "medium";
  aoi: GeoJSON.Polygon | null;
  sceneId: string | null;
  evidence: AlertEvidence;
}

// Alert kinds double as the D1 `kind` value and the UI filter key.
const KINDS = {
  vegLoss: "vegetation-loss-area",
  nearRiver: "surface-change-near-river",
  nearCoast: "surface-change-near-coast",
  outsideIup: "surface-change-outside-iup",
} as const;

export const ALERT_LABELS: Record<string, string> = {
  [KINDS.vegLoss]: "Vegetation loss",
  [KINDS.nearRiver]: "Change near river",
  [KINDS.nearCoast]: "Change near coast",
  [KINDS.outsideIup]: "Change outside IUP",
};

export const alertLabel = (kind: string) => ALERT_LABELS[kind] ?? kind;

// Rules from PLAN.md Phase 15, evaluated on the AOI change-detection result
// plus the spatial context already computed by analyzeAoi.
export function evaluateAlerts(
  change: ChangeResult,
  analysis: AoiAnalysis | null,
  aoi: GeoJSON.Polygon,
  thresholds: AlertThresholds,
): EnvAlert[] {
  if (change.coverage < 0.3) return []; // too cloudy to judge

  const base = () => ({
    method: CHANGE_RULES[change.type].label,
    metric: change.type === "water-change" ? "mndwi-raw" : "ndvi-raw",
    changedHa: change.changedHa,
    coverage: change.coverage,
    dateA: change.dateA,
    dateB: change.dateB,
    bbox: change.bbox,
    thresholds: { ...thresholds },
    source: "Sentinel-2 L2A",
    generatedAt: new Date().toISOString(),
  });
  const severity = (ha: number) => (ha >= 25 ? "high" : "medium") as "high" | "medium";

  const alerts: EnvAlert[] = [];

  if (change.type === "vegetation-loss" && change.changedHa >= thresholds.vegLossHa) {
    alerts.push({
      kind: KINDS.vegLoss,
      severity: severity(change.changedHa),
      aoi,
      sceneId: null,
      evidence: { ...base(), rule: "vegetation_loss_area >= threshold" },
    });
  }

  if (change.type === "new-bare-land" && analysis) {
    const ctx = { nearestRiver: analysis.nearestRiver?.name, coastDistanceM: analysis.coastDistanceM, permits: analysis.permits };

    if (analysis.nearestRiver && analysis.nearestRiver.distanceM <= thresholds.distanceM) {
      alerts.push({
        kind: KINDS.nearRiver,
        severity: severity(change.changedHa),
        aoi,
        sceneId: null,
        evidence: { ...base(), rule: "surface_change AND distance_to_river <= threshold", context: { ...ctx, distanceM: analysis.nearestRiver.distanceM } },
      });
    }
    if (analysis.coastDistanceM != null && analysis.coastDistanceM <= thresholds.distanceM) {
      alerts.push({
        kind: KINDS.nearCoast,
        severity: severity(change.changedHa),
        aoi,
        sceneId: null,
        evidence: { ...base(), rule: "surface_change AND distance_to_coast <= threshold", context: { ...ctx, distanceM: analysis.coastDistanceM } },
      });
    }
    if (!analysis.permits.length) {
      alerts.push({
        kind: KINDS.outsideIup,
        severity: severity(change.changedHa),
        aoi,
        sceneId: null,
        evidence: { ...base(), rule: "surface_change AND NOT intersects_known_iup", context: ctx },
      });
    }
  }

  return alerts;
}
