# ARCHITECTURE — Taliabu Environmental Monitor

## 1. Purpose

This document defines the technical architecture for **Taliabu Environmental Monitor**, a single-page environmental monitoring application for Pulau Taliabu, Maluku Utara.

Primary constraints:

- single-page map-centric UX;
- Cloudflare Workers-compatible stack;
- TypeScript-first;
- zero-cost infrastructure target;
- no mandatory VPS;
- no mandatory container runtime;
- no PostGIS requirement;
- no server-side GDAL requirement for normal operation;
- use free/public geospatial services where possible;
- remote-sensing computation delegated to Copernicus services instead of Cloudflare Worker CPU.

---

## 2. Technology Decisions

| Area | Technology |
|---|---|
| Frontend | Vue 3 |
| Language | TypeScript |
| Build | Vite |
| Map | MapLibre GL JS |
| Client GIS | Turf.js |
| Backend | Cloudflare Workers |
| API routing | Hono or native Worker routing |
| Static assets | Cloudflare Static Assets |
| Metadata | Cloudflare D1 |
| Async orchestration | Cloudflare Workflows |
| Background events | Cloudflare Queues where needed |
| Scheduler | Cloudflare Cron Triggers + scheduled Workflows |
| Satellite discovery | Copernicus Data Space STAC |
| Raster processing | Sentinel Hub |
| Temporal processing | openEO |
| Basemap | OpenFreeMap / OpenStreetMap |
| Reference vector data | GeoJSON initially; PMTiles when useful |
| Satellite sources | Sentinel-1, Sentinel-2 |
| Terrain | DEMNAS-derived reference artifacts |
| Mining spatial data | public ESDM/MOMI-derived data where legally usable |

---

## 3. Architecture

```text
+--------------------------------------------------------------------+
|                              Browser                               |
|                                                                    |
| Vue 3 + TypeScript                                                 |
| MapLibre GL JS                                                     |
| Turf.js                                                            |
|                                                                    |
| +-------------+ +------------+ +-----------+ +------------------+  |
| | Layer Panel | | Timeline   | | Inspector | | Analytics / AOI  |  |
| +-------------+ +------------+ +-----------+ +------------------+  |
+-------------------------------+------------------------------------+
                                |
                                | HTTPS / JSON
                                v
+--------------------------------------------------------------------+
|                     Cloudflare Worker                              |
|                                                                    |
| API Router                                                         |
| Auth-less/public read API initially                                |
| Copernicus gateway                                                 |
| Scene discovery                                                    |
| Analysis orchestration                                             |
| Metadata cache                                                     |
| Export metadata                                                    |
+----------------------+---------------------+-----------------------+
                       |                     |
                       v                     v
               +---------------+       +------------+
               | Cloudflare D1 |       | Workflows  |
               | metadata      |       | durable    |
               +---------------+       +------+-----+
                                             ^
                                             |
                                      +------+------+
                                      | Schedules / |
                                      | Cron        |
                                      +------+------+
                                             |
          +----------------------------------+----------------------+
          |                                  |                      |
          v                                  v                      v
+----------------------+         +----------------------+   +------------------+
| Copernicus STAC      |         | Sentinel Hub         |   | openEO           |
| scene discovery      |         | visual/indices/stats |   | temporal compute |
+----------------------+         +----------------------+   +------------------+

Reference sources:
+----------------------+      +----------------------+      +------------------+
| Reference GeoJSON    |      | PMTiles optional     |      | OpenFreeMap      |
| boundary/rivers/IUP  |      | larger vectors       |      | basemap          |
+----------------------+      +----------------------+      +------------------+
```

---

## 4. Core Design Principle

Cloudflare Workers are treated as an orchestration and API layer.

They must not perform:
- large raster downloads and decoding;
- whole-scene GeoTIFF transformations;
- GDAL-like reprojection;
- large matrix operations;
- long-running raster classification.

Remote raster computation is delegated to Copernicus.

Client-side computation is used only for lightweight vector operations.

---

## 5. Repository Structure

Recommended structure:

```text
taliabu-environment/
|
+-- src/
|   +-- app/
|   |   +-- App.vue
|   |   +-- main.ts
|   |   +-- router.ts
|   |
|   +-- features/
|   |   +-- environmental-map/
|   |       +-- EnvironmentalMapPage.vue
|   |       |
|   |       +-- components/
|   |       |   +-- MapView.vue
|   |       |   +-- LayerPanel.vue
|   |       |   +-- Timeline.vue
|   |       |   +-- CompareSlider.vue
|   |       |   +-- InspectorPanel.vue
|   |       |   +-- AnalyticsPanel.vue
|   |       |   +-- MapLegend.vue
|   |       |   +-- AlertPanel.vue
|   |       |
|   |       +-- layers/
|   |       |   +-- satellite.ts
|   |       |   +-- vegetation.ts
|   |       |   +-- mining.ts
|   |       |   +-- hydrology.ts
|   |       |   +-- coastal.ts
|   |       |   +-- terrain.ts
|   |       |
|   |       +-- composables/
|   |       |   +-- useMap.ts
|   |       |   +-- useTimeline.ts
|   |       |   +-- useInspector.ts
|   |       |
|   |       +-- stores/
|   |           +-- environmental-map.store.ts
|   |
|   +-- shared/
|       +-- api/
|       +-- geo/
|       +-- types/
|       +-- utils/
|
+-- worker/
|   +-- index.ts
|   +-- routes/
|   |   +-- scenes.ts
|   |   +-- imagery.ts
|   |   +-- analysis.ts
|   |   +-- alerts.ts
|   |   +-- exports.ts
|   |
|   +-- services/
|   |   +-- copernicus-stac.ts
|   |   +-- sentinel-hub.ts
|   |   +-- openeo.ts
|   |   +-- analysis-service.ts
|   |
|   +-- repositories/
|   |   +-- scenes-repository.ts
|   |   +-- analyses-repository.ts
|   |   +-- alerts-repository.ts
|   |
|   +-- scheduled/
|   |   +-- refresh-iup.ts
|   |   +-- refresh-reference-data.ts
|   |
|   +-- workflows/
|       +-- scene-discovery.workflow.ts
|       +-- environmental-analysis.workflow.ts
|
+-- public/
|   +-- data/
|       +-- boundaries/
|       |   +-- taliabu-island.geojson
|       |   +-- taliabu-island.web.geojson
|       |   +-- taliabu-administrative.geojson
|       |   +-- administrative-boundaries.geojson
|       +-- hydrology/
|       |   +-- rivers.geojson
|       |   +-- watersheds.geojson
|       +-- human/
|       |   +-- settlements.geojson
|       +-- mining/
|       |   +-- iup.geojson
|       +-- coastal/
|       |   +-- baseline-coastline.geojson
|       +-- metadata/
|           +-- datasets.json
|
+-- migrations/
|
+-- wrangler.jsonc
+-- vite.config.ts
+-- package.json
+-- PRD.md
+-- ARCHITECTURE.md
```

---

## 6. Frontend Design

## 6.1 EnvironmentalMapPage

`EnvironmentalMapPage.vue` owns page composition only.

It should not contain provider-specific Copernicus logic.

Responsibilities:
- compose map;
- compose panels;
- bind global feature state;
- manage responsive layout.

---

## 6.2 Map State

Suggested state:

```ts
interface EnvironmentalMapState {
  selectedDate?: string;
  compareDate?: string;

  selectedSceneId?: string;
  compareSceneId?: string;

  activeLayers: string[];

  selectedFeature?: MapFeature;
  selectedAoi?: GeoJSON.Polygon;

  compareMode:
    | "none"
    | "swipe"
    | "split"
    | "blink"
    | "difference";

  miningImpactMode: boolean;

  viewport: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
}
```

State should be serializable so important map state can later be encoded into the URL.

---

## 6.3 Layer Model

Every map layer should implement a common application-level definition.

```ts
interface MapLayerDefinition {
  id: string;
  name: string;
  category:
    | "satellite"
    | "environment"
    | "mining"
    | "hydrology"
    | "coastal"
    | "terrain";

  type: "raster" | "vector";

  defaultVisible: boolean;
  opacity?: number;

  legend?: LegendDefinition;

  source: LayerSourceDefinition;
}
```

Avoid coupling UI directly to Sentinel Hub request format.

---

## 7. Reference Data Strategy

The term **reference data** is used instead of **static data**. These datasets are relatively stable and can be served as cached/static assets at runtime, but they are not assumed to be immutable.

Data is grouped into three lifecycle categories.

### 7.1 Reference Data

Changes rarely and is refreshed manually or when an authoritative source publishes a meaningful update.

Examples:
- Pulau Taliabu boundary (BIG 1:25000 scale);
- administrative boundaries (BIG);
- river network (placeholder → to be replaced with real data);
- watershed boundaries (placeholder → to be replaced with real data);
- terrain-derived reference layers;
- baseline coastline (extracted from BIG boundary).

Typical refresh policy:

```text
manual / source-driven
```

### 7.2 Periodic Reference Data

Changes more frequently than geographic reference data and must not be treated as permanently fixed.

Examples:
- mining IUP/WIUP boundaries and attributes;
- settlements and selected infrastructure context.

Typical refresh policy:

```text
monthly / quarterly / source-driven
```

`mining/iup.geojson` represents a versioned snapshot of the best available public mining-permit dataset. A newer source version may replace it after validation, but previous source metadata must remain traceable.

Hydrology artifacts must not embed relationships to this periodic dataset. `hydrology/river-outlets.geojson` contains only DEM/D8-derived outlet facts; nearest-IUP name and distance to the actual permit boundary are runtime spatial analysis over the current `mining/iup.geojson` snapshot.

### 7.3 Dynamic Observation Data

Generated from satellite acquisitions and selected analysis periods. These are not stored as canonical files under `public/data`.

Examples:
- Sentinel imagery;
- NDVI;
- NDWI / MNDWI;
- vegetation loss;
- bare land / surface disturbance;
- sediment or turbidity proxy;
- extracted coastline for a selected observation date;
- change-detection outputs.

Dynamic coastline analysis must distinguish the stable reference baseline from observation-derived coastlines:

```text
public/data/coastal/baseline-coastline.geojson
                     |
                     +-- reference coastline

Sentinel observation
        |
        +-- extracted coastline: 2025-01-12
        +-- extracted coastline: 2025-08-20
        +-- extracted coastline: 2026-09-09
```

This enables explicit comparison between a reference coastline and a selected satellite observation instead of silently overwriting a single `coastline.geojson`.

### 7.4 Dataset Metadata

Every reference dataset must have source/version metadata. The metadata can initially live in `public/data/metadata/datasets.json`.

Example:

```json
{
  "id": "mining-iup",
  "source": "ESDM/MOMI",
  "retrievedAt": "2026-09-11",
  "sourceUpdatedAt": null,
  "version": "2026-09-11",
  "refreshPolicy": "monthly"
}
```

For a geographic boundary:

```json
{
  "id": "taliabu-boundary",
  "source": "BIG - Badan Informasi Geospasial",
  "sourceUrl": "https://geoservices.big.go.id/gis/rest/services/DISIGT/BatasWilayah/FeatureServer/0",
  "retrievedAt": "2026-09-15",
  "version": "1.0.0",
  "refreshPolicy": "manual"
}
```

Recommended metadata fields:
- dataset ID;
- source organization;
- source URL/reference;
- retrieved date;
- source update date when known;
- local version;
- refresh policy;
- license/redistribution note;
- transformation notes.

### 7.5 Delivery Format

GeoJSON is acceptable for small Taliabu-specific reference datasets.

Use PMTiles when:
- GeoJSON becomes large;
- rendering becomes slow;
- more geographic detail is added.

Because the geographic scope is one island, reference-data preprocessing and cached delivery are preferred over introducing a spatial database.

Serving a dataset as a static asset is a runtime delivery decision; it does not mean the source data is permanently static.

---

## 8. Dynamic Satellite Data

## 8.1 Scene Discovery

Worker queries Copernicus STAC.

Input:

```text
Taliabu bounding polygon
date range
collection
cloud threshold
```

Output normalized to internal scene format:

```json
{
  "id": "scene-id",
  "collection": "sentinel-2-l2a",
  "acquiredAt": "2026-09-09T02:18:00Z",
  "cloudCover": 7.2,
  "bbox": [0, 0, 0, 0],
  "provider": "copernicus"
}
```

Do not expose raw provider response directly to frontend.

---

## 8.2 Scene Selection

Recommended algorithm:

1. query scenes intersecting Taliabu;
2. filter by requested date range;
3. prioritize low cloud cover;
4. prioritize acquisition closest to requested date;
5. store normalized metadata in D1;
6. return top candidates.

For "latest usable":

```text
latest scene
AND cloudCover <= configurable threshold
```

If no suitable scene exists, return best available candidate with a quality warning.

---

## 9. Sentinel Hub Integration

Sentinel Hub is the primary dynamic raster-processing layer.

Worker owns provider credentials and request construction.

### Process API Flow

```text
Vue
 ↓
POST /api/render { bbox, from, to, width, height, evalscript }
 ↓
Cloudflare Worker
 ↓
Copernicus OAuth token (cached)
 ↓
Sentinel Hub Process API
 ↓
PNG image stream
 ↓
MapLibre image source (coordinates matched to bbox)
```

### Image Source Pattern

MapLibre uses `image` source (not `raster` tiles):

```ts
map.addSource(sourceId, {
  type: "image",
  url: imageUrl,        // blob URL from /api/render
  coordinates: [
    [west, north],
    [east, north],
    [east, south],
    [west, south],
  ],
});
```

Advantages:
- single fetch per scene (no per-tile seams);
- bbox matches image coordinates exactly;
- simpler than TileJSON + SAS signing.

### Smooth Scene Transitions

When switching scenes, use `updateImage()` on existing source:

```ts
const existing = map.getSource(sourceId);
if (existing && "updateImage" in existing) {
  (existing as any).updateImage({ url: newImageUrl });
}
```

This avoids flicker — old image stays visible until new one loads.

### Evalscript (True Color)

```js
//VERSION=3
function setup() {
  return {
    input: ["B04", "B03", "B02", "dataMask"],
    output: { bands: 4 },
  };
}
function evaluatePixel(sample) {
  return [2.5 * sample.B04, 2.5 * sample.B03, 2.5 * sample.B02, sample.dataMask];
}
```

### Credentials

- Local: `.dev.vars` (gitignored)
- Production: Worker secrets (`COPERNICUS_CLIENT_ID`, `COPERNICUS_CLIENT_SECRET`)

Frontend should not need to know:
- provider credentials;
- Evalscript details;
- provider token lifecycle.

---

## 10. Analysis Types

Application-level analysis types:

```ts
type AnalysisType =
  | "true-color"
  | "false-color"
  | "ndvi"
  | "ndwi"
  | "mndwi"
  | "bare-soil"
  | "surface-change"
  | "vegetation-change"
  | "water-change"
  | "sediment-proxy"
  | "coastline-change";
```

Provider-specific implementation belongs in `worker/services`.

---

## 11. NDVI

Standard formula:

```text
NDVI = (NIR - RED) / (NIR + RED)
```

Sentinel-2:
- RED: B04;
- NIR: B08.

Output options:
- colored visualization;
- raw numeric statistics.

The frontend should distinguish visualization from measurement.

---

## 12. NDWI / MNDWI

Used for water detection and water-area comparison.

Results can support:
- water mask;
- area statistics;
- temporal difference.

Thresholds should be configurable and documented.

---

## 13. Bare Soil / Surface Disturbance

Do not use one spectral index as authoritative proof of mining.

Recommended model:

```text
surface disturbance confidence
        =
vegetation decrease
+ exposed-soil signal
+ temporal persistence
+ spatial relation to known mining area
```

Output:
- candidate polygons;
- area;
- confidence;
- first observed date;
- last observed date.

---

## 14. Sediment / Turbidity Proxy

This feature must remain explicitly probabilistic.

Output example:

```json
{
  "type": "sediment-proxy",
  "change": "increase",
  "areaHa": 12.4,
  "confidence": "medium",
  "method": "water reflectance anomaly",
  "disclaimer": "Remote-sensing proxy; not a laboratory water-quality measurement."
}
```

---

## 15. Sentinel-1

Sentinel-1 is used as complementary data.

Purpose:
- cloudy-season observation;
- cross-check major surface changes;
- temporal continuity.

Do not expose SAR using the same legend or interpretation as Sentinel-2 optical imagery.

---

## 16. Temporal Analysis

Two execution paths are supported.

### Immediate Comparison

For:
- before/after UI;
- simple selected dates.

Use:
- Sentinel Hub.

### Long-Running Temporal Analysis

For:
- monthly composites;
- multi-year change;
- trend calculation.

Use:
- openEO through an asynchronous workflow.

---

## 17. openEO Job Flow

```text
Browser
   |
   | POST /api/analysis
   v
Worker
   |
   | create analysis record
   v
D1
   |
   v
Workflow
   |
   v
openEO
   |
   | temporal processing
   v
Workflow
   |
   | normalize result
   v
D1
   |
   v
Browser polls /api/analysis/{id}
```

The application must not block a Worker request until long-running processing completes.

---

## 18. Cloudflare Workflow Design

Suggested workflows:

### SceneDiscoveryWorkflow

Runs periodically.

Steps:
1. query STAC;
2. normalize scenes;
3. compare against known scene IDs;
4. store new metadata;
5. mark high-quality candidates;
6. optionally enqueue analysis.

### EnvironmentalAnalysisWorkflow

Steps:
1. validate requested analysis;
2. request remote processing;
3. wait/poll provider if asynchronous;
4. normalize statistics;
5. persist result;
6. generate alerts if thresholds are met.

---

## 19. Scheduled Processing

Scheduling is split into two mechanisms based on job complexity.

### 19.1 Cron Triggers for Simple Periodic Refresh

Use Cloudflare Cron Triggers for short, bounded tasks that do not require a durable multi-step execution model.

Examples:
- refresh mining IUP metadata;
- validate reference-dataset freshness;
- refresh settlements or administrative reference data;
- lightweight cleanup or metadata maintenance.

Suggested structure:

```text
worker/
└── scheduled/
    ├── refresh-iup.ts
    └── refresh-reference-data.ts
```

The top-level Worker `scheduled()` handler should dispatch by `event.cron` instead of embedding refresh logic directly.

Example logical flow:

```text
Cron Trigger
     ↓
scheduled()
     ↓
identify schedule
     ↓
small bounded refresh task
     ↓
finish
```

Cloudflare cron expressions use UTC. Operational documentation should always record both UTC and WIB equivalents.

Example:

```text
00:00 UTC = 07:00 WIB
01:00 UTC = 08:00 WIB
```

### 19.2 Scheduled Workflows for Satellite Pipelines

Use a scheduled Workflow when the job is multi-step, may need retries, or can depend on asynchronous provider processing.

The primary scheduled workflow is `SceneDiscoveryWorkflow`.

```text
Scheduled Workflow
       ↓
query Copernicus STAC
       ↓
normalize scenes
       ↓
new usable scene?
       │
       ├── no → finish
       │
       └── yes
            ↓
        store metadata
            ↓
      analysis required?
            │
            ├── no → finish
            │
            └── yes
                 ↓
      EnvironmentalAnalysisWorkflow
                 ↓
        Sentinel Hub / openEO
                 ↓
         normalize result
                 ↓
        persist analysis metadata
                 ↓
          generate alerts
```

A scheduled Workflow is preferred over placing the entire satellite pipeline inside a Worker `scheduled()` invocation.

### 19.3 Initial Refresh Policy

Recommended initial cadence:

| Data / Job | Mechanism | Initial Cadence |
|---|---|---|
| Sentinel-2 scene discovery | Scheduled Workflow | Daily |
| Sentinel-1 scene discovery | Scheduled Workflow | Daily |
| Environmental analysis | Event-driven from new usable scene | On new scene |
| Mining IUP | Cron Trigger | Monthly |
| Settlements | Cron Trigger or manual refresh | Every 3–6 months |
| Administrative boundaries | Manual / periodic validation | Every 6–12 months |
| Rivers | Manual / periodic validation | Every 6–12 months |
| Watersheds | Manual regeneration | When DEM/method changes |
| Taliabu boundary | Manual | When official boundary changes |
| Baseline coastline | Manual / annual review | Annual or when baseline changes |

The scheduler should check for new source data; it should not blindly regenerate all derived layers on every run.

For observation data, processing is event-driven:

```text
Daily scene discovery
       ↓
new usable scene?
       │
       ├── no → no analysis
       │
       └── yes
            ↓
      derive/update
      ├── NDVI
      ├── NDWI / MNDWI
      ├── bare-land indicators
      ├── vegetation change
      ├── sediment proxy
      ├── coastline observation
      └── environmental alerts
```

### 19.4 Dataset Refresh Policy as Metadata

Refresh cadence must be represented in dataset metadata instead of being scattered as hard-coded scheduling rules.

Example:

```json
{
  "id": "mining-iup",
  "source": "ESDM/MOMI",
  "refreshPolicy": "monthly"
}
```

Observation datasets can use an event-oriented policy:

```json
{
  "id": "sentinel-2",
  "source": "Copernicus Data Space",
  "refreshPolicy": "on-new-scene"
}
```

The scheduler maps these logical policies to Cloudflare Cron Triggers or Workflow schedules.

### 19.5 Quota Protection

Schedules must remain conservative to protect free-tier quotas.

Rules:
- satellite discovery should normally run daily, not hourly;
- skip processing for already-known scene IDs;
- do not run analysis when no new usable scene exists;
- de-prioritize scenes with excessive cloud cover;
- deduplicate identical analysis requests;
- retry provider failures through Workflow semantics rather than aggressive loops;
- persist enough metadata to make jobs idempotent.

---

## 20. D1 Data Model

D1 stores metadata, not large raster files.

Suggested tables:

```sql
CREATE TABLE satellite_scenes (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    collection TEXT NOT NULL,
    acquired_at TEXT NOT NULL,
    cloud_cover REAL,
    bbox_json TEXT NOT NULL,
    metadata_json TEXT,
    created_at TEXT NOT NULL
);

CREATE INDEX idx_satellite_scenes_acquired_at
ON satellite_scenes(acquired_at);

CREATE TABLE analysis_runs (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    scene_id TEXT,
    comparison_scene_id TEXT,
    aoi_json TEXT,
    parameters_json TEXT,
    result_json TEXT,
    error TEXT,
    created_at TEXT NOT NULL,
    completed_at TEXT
);

CREATE TABLE environmental_alerts (
    id TEXT PRIMARY KEY,
    analysis_run_id TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    geometry_json TEXT,
    summary TEXT NOT NULL,
    metadata_json TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE app_config (
    key TEXT PRIMARY KEY,
    value_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

---

## 21. Why No PostGIS

For one island, PostGIS introduces unnecessary infrastructure and cost.

Instead:

### Browser/Turf.js
Use for:
- area;
- distance;
- intersection;
- point in polygon;
- buffers for small features.

### Preprocessing
Use during dataset preparation for:
- watershed;
- terrain;
- river network;
- administrative boundaries.

### D1
Use for metadata and small derived-result JSON.

### Reference Vector Assets
Use for map layers.

If the project later expands to many islands, millions of features, or complex spatial search, PostGIS can be reconsidered.

---

## 22. API Design

Base:

```text
/api
```

### Health

```http
GET /api/health
```

### Scenes

```http
GET /api/scenes
```

Query:
- `from`
- `to`
- `collection`
- `maxCloudCover`

Example response:

```json
{
  "items": [
    {
      "id": "scene-id",
      "collection": "sentinel-2-l2a",
      "acquiredAt": "2026-09-09T02:18:00Z",
      "cloudCover": 7.2
    }
  ]
}
```

### Latest Scene

```http
GET /api/scenes/latest
```

### Analysis

```http
POST /api/analysis
```

Request:

```json
{
  "type": "vegetation-change",
  "sceneId": "current-scene",
  "comparisonSceneId": "previous-scene",
  "aoi": {
    "type": "Polygon",
    "coordinates": []
  }
}
```

Response:

```json
{
  "id": "analysis-id",
  "status": "queued"
}
```

### Analysis Status

```http
GET /api/analysis/{id}
```

### Alerts

```http
GET /api/alerts
```

### Reference Dataset Metadata

```http
GET /api/datasets
```

---

## 23. Raster Delivery

Preferred approach:

- use provider-rendered raster imagery for dynamic views;
- proxy only when required for authentication or normalization;
- avoid storing large raster assets initially.

If provider URLs cannot safely be exposed, Worker provides a controlled proxy.

Cache headers should be used whenever identical imagery requests are deterministic.

---

## 24. Caching Strategy

### Static Assets

Use long cache duration with content hashes.

### Static GeoJSON / PMTiles

Use long cache duration.

### Scene Metadata

Cache for hours.

### Satellite Render Requests

Cache key should include:
- layer type;
- scene;
- AOI/bbox;
- dimensions/resolution;
- visualization version.

### Analysis Results

Immutable analysis results should be cached aggressively after completion.

---

## 25. Client-Side Spatial Analysis

Turf.js handles lightweight geometry operations.

Examples:

```ts
area(aoi);

distance(pointA, pointB);

booleanPointInPolygon(point, polygon);

intersect(featureA, featureB);

buffer(river, 500, { units: "meters" });
```

Avoid heavy operations on very large FeatureCollections in browser.

---

## 26. Mining Impact Analysis

Mining Impact mode composes existing data rather than creating a separate backend.

Preset activates:

```text
true-color
mining boundary
surface disturbance
vegetation loss
rivers
watersheds
coastline
sediment proxy
settlements
```

Inspector computes relationships such as:

```text
change polygon
   |
   +-- intersects known IUP?
   |
   +-- nearest river distance
   |
   +-- watershed
   |
   +-- distance to coastline
   |
   +-- nearest settlement
```

---

## 27. Environmental Alert Rules

Rules must be configurable.

Examples:

```text
vegetation_loss_area >= threshold

surface_change AND
distance_to_river <= threshold

surface_change AND
distance_to_coast <= threshold

surface_change AND
NOT intersects_known_iup
```

These are monitoring alerts, not legal conclusions.

---

## 28. Quality Model

Every analysis result includes:

```ts
interface AnalysisQuality {
  source: string;
  acquiredAt?: string;
  cloudCover?: number;
  method: string;
  confidence: "low" | "medium" | "high";
  warnings: string[];
}
```

Examples of warnings:
- high cloud cover;
- partial coverage;
- SAR-only observation;
- weak spectral separation;
- missing mining permit data;
- derived proxy, not direct measurement.

---

## 29. Security

### Secrets

Store:
- Copernicus client ID;
- Copernicus client secret;
- provider credentials.

Use Cloudflare Worker secrets.

Never expose provider secrets to frontend bundle.

### Request Validation

Validate:
- date range;
- layer type;
- AOI;
- AOI coordinate count;
- AOI bounding box;
- image dimensions;
- analysis type.

### Abuse Protection

Possible protections:
- Cloudflare rate limiting if available;
- application-level per-IP throttling;
- strict expensive-route limits;
- cache-first reads.

---

## 30. Observability

Minimum observability:

Structured logs:

```json
{
  "event": "analysis.requested",
  "analysisId": "...",
  "type": "vegetation-change",
  "sceneId": "...",
  "durationMs": 0
}
```

Track:
- provider errors;
- STAC latency;
- Sentinel Hub failures;
- openEO failures;
- analysis duration;
- cache hit/miss;
- quota-related failures.

No personal location information should be logged unnecessarily.

---

## 31. Error Handling

External providers are expected to fail occasionally.

Frontend states:
- loading;
- ready;
- unavailable;
- degraded;
- no data.

Example:

```json
{
  "code": "SATELLITE_PROVIDER_UNAVAILABLE",
  "message": "Satellite imagery is temporarily unavailable.",
  "retryable": true
}
```

A failed Sentinel layer must not break static mining, river, or basemap layers.

---

## 32. URL State

Important map state should be encoded in query parameters when practical.

Example:

```text
/?date=2026-09-09
&compare=2025-09-10
&layers=satellite,iup,vegetation-loss,rivers
&mode=swipe
```

Avoid putting huge AOI GeoJSON directly into the URL.

Saved AOIs can use an identifier later if persistence is introduced.

---

## 33. Export Architecture

### PNG

Prefer client-side map export when technically possible.

Include:
- map;
- legend;
- date;
- source attribution;
- analysis title.

### CSV

Worker generates or returns tabular analysis data.

### GeoJSON

Derived vector result returned directly when small.

### Evidence Metadata

Every export contains:

```text
source
scene IDs
acquisition dates
analysis type
AOI
generated timestamp
method/version
```

---

## 34. Data Versioning

Static source data should include version metadata.

Example:

```json
{
  "dataset": "mining-iup",
  "source": "ESDM/MOMI",
  "retrievedAt": "YYYY-MM-DD",
  "version": "2026-01",
  "license": "...",
  "notes": "..."
}
```

Never silently replace a regulatory boundary dataset without recording the source/version.

---

## 35. Deployment

Single Cloudflare deployment:

```text
Vite build
   |
   +-- frontend static assets
   |
   +-- Worker API
   |
   +-- D1 binding
   |
   +-- Workflow binding
   |
   +-- Queue binding
```

Suggested environments:

```text
local
preview
production
```

---

## 36. Local Development

Recommended:

```bash
npm install
npm run dev
```

Use Cloudflare Vite integration/Wrangler so Worker APIs and frontend run together locally.

Local reference datasets should have the same shape and metadata contract as production assets.

Provider credentials are supplied through local secrets/environment files that are never committed.

---

## 37. Configuration

Example logical configuration:

```json
{
  "region": {
    "id": "taliabu",
    "name": "Pulau Taliabu"
  },
  "satellite": {
    "defaultCollection": "sentinel-2-l2a",
    "preferredCloudCover": 100
  },
  "analysis": {
    "riverBufferMeters": 500,
    "coastalBufferMeters": 1000
  }
}
```

Thresholds are configuration, not hard-coded business logic.

---

## 38. Future Upgrade Path

If project usage grows beyond free-tier constraints:

### Phase A
Add object storage for persistent derived artifacts.

### Phase B
Use PMTiles broadly for vector delivery.

### Phase C
Introduce dedicated geospatial processing when Copernicus quota becomes insufficient.

### Phase D
Introduce PostGIS only when spatial-query complexity justifies it.

### Phase E
Optionally integrate commercial high-resolution imagery.

None of these are required for initial architecture.

---

## 39. Key Architectural Decisions

### ADR-001 — Cloudflare Worker as Orchestrator

Decision:
Worker does API composition and remote processing orchestration.

Reason:
Raster processing is too heavy for edge request execution.

### ADR-002 — No PostGIS Initially

Decision:
Use reference vector data, Turf.js, and D1 metadata.

Reason:
Single-island scope does not justify managed spatial database complexity.

### ADR-003 — Copernicus as Compute Layer

Decision:
Use Sentinel Hub/openEO for remote-sensing computation.

Reason:
Avoid operating heavy GIS infrastructure.

### ADR-004 — Reference Data First

Decision:
Slow-changing reference data is precomputed, versioned, and served as cached/static assets.

Reason:
Cheaper, faster, simpler.

### ADR-005 — Evidence-Based Outputs

Decision:
Derived environmental signals always expose source and method metadata.

Reason:
Remote sensing indicates environmental change but does not automatically establish causation or legal violations.

---

## 40. Initial Implementation Order

Recommended engineering order:

```text
1. Vue + MapLibre shell
2. Taliabu boundary + basemap
3. reference rivers/coastline/mining layers
4. Cloudflare Worker API
5. Copernicus STAC discovery
6. Sentinel-2 true color
7. timeline
8. NDVI / NDWI
9. before-after compare
10. AOI + Turf analytics
11. mining impact mode
12. change detection
13. watershed/terrain
14. coastal/sediment analysis
15. alerts
16. exports
17. scheduled scene discovery
```

This order delivers a usable map early while preserving the full target architecture.

---

## 41. Final Architecture Summary

The application should remain operationally simple:

```text
Vue + MapLibre + Turf
          |
          v
Cloudflare Worker
          |
  +-------+--------+
  |                |
  v                v
 D1            Workflows
                   |
          +--------+---------+
          |                  |
          v                  v
   Sentinel Hub            openEO
          |
          v
 Sentinel-1 / Sentinel-2
```

Reference environmental and mining context is versioned and served directly as cached web assets; dynamic observations remain acquisition-based.

This architecture keeps the product:
- single-page;
- map-centric;
- Cloudflare-native;
- TypeScript-first;
- compatible with free infrastructure;
- capable of supporting the full environmental-monitoring feature set defined in `PRD.md`.
