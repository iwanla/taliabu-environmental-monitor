# PLAN — Taliabu Environmental Monitor

## 1. Purpose

Dokumen ini adalah execution roadmap untuk membangun **Taliabu Environmental Monitor** secara bertahap.

Prinsip utama development:

- selesaikan vertical slice end-to-end lebih awal;
- jangan membangun infrastructure yang belum dibutuhkan;
- map adalah pusat aplikasi;
- gunakan Cloudflare-native stack;
- pertahankan target zero-cost infrastructure;
- delegasikan heavy raster processing ke Copernicus;
- setiap phase harus menghasilkan sesuatu yang dapat diuji secara nyata.

## 2. Target Stack

```text
Frontend
├── Vue 3
├── TypeScript
├── Vite
├── MapLibre GL JS
└── Turf.js

Backend
├── Cloudflare Workers
├── TypeScript
└── Hono optional

Cloudflare
├── Static Assets
├── D1
├── Workflows
├── Queues
└── Cron Triggers

Geospatial / Satellite
├── Copernicus Data Space
├── STAC API
├── Sentinel Hub
├── openEO
├── Sentinel-2
└── Sentinel-1

Map Data
├── OpenFreeMap
├── OpenStreetMap
├── ESDM / MOMI
├── BIG / Ina-Geoportal
└── DEMNAS
```

# Phase 0 — Project Foundation

## Goal

Menyiapkan repository dan development environment yang dapat menjalankan frontend dan Cloudflare Worker secara lokal.

## Scope

- Vue 3;
- TypeScript;
- Vite;
- Cloudflare Workers;
- Cloudflare Vite integration / Wrangler;
- MapLibre GL JS;
- Turf.js;
- linting dan formatting dasar.

## Initial Structure

```text
src/
├── app/
├── features/
│   └── environmental-map/
└── shared/

worker/
├── index.ts
├── routes/
├── services/
└── repositories/

public/
└── data/
```

## Deliverables

- project dapat dijalankan dengan satu development command;
- frontend dan Worker API dapat berjalan bersama;
- endpoint health tersedia.

```http
GET /api/health
```

## Acceptance Criteria

- `npm run dev` menjalankan aplikasi;
- Vue page dapat dibuka;
- Worker endpoint dapat dipanggil dari frontend;
- tidak ada secret atau credential yang di-commit.

## Status

**Completed** — 2026-09-11

- Vue 3 + Vite + TypeScript + MapLibre + Turf.js + Hono + Wrangler initialized
- `worker/index.ts` with `/api/health` endpoint
- Vite proxies `/api/*` to Worker on port 8787

# Phase 1 — Map Foundation

## Goal

Mendapatkan aplikasi map-centric pertama yang menampilkan Pulau Taliabu.

## Scope

Implement:

```text
EnvironmentalMapPage.vue
├── MapView.vue
├── LayerPanel.vue
├── InspectorPanel.vue
├── Timeline.vue
└── MapLegend.vue
```

Pada phase ini `InspectorPanel` dan `Timeline` boleh menggunakan placeholder.

## Features

- MapLibre initialization;
- OpenFreeMap basemap;
- default viewport Pulau Taliabu;
- zoom;
- pan;
- layer control;
- opacity control;
- responsive layout.

## Data

Tambahkan:

```text
public/data/taliabu.geojson
```

## Deliverables

User membuka aplikasi dan langsung melihat Pulau Taliabu dengan boundary yang jelas.

## Acceptance Criteria

- Pulau Taliabu berada pada initial viewport;
- boundary tampil;
- basemap tampil;
- layer dapat diaktifkan/nonaktifkan;
- map tetap usable pada desktop dan mobile.

## Status

**Completed** — 2026-09-11

- OpenFreeMap liberty vector tiles basemap
- `taliabu.geojson` boundary loaded and displayed
- Custom navigation buttons (+, –, ⟲ reset view)
- Geolocation "locate me" button
- MapLegend component
- Responsive 3-column grid layout

# Phase 2 — Static Environmental Context

## Goal

Membangun konteks geografis dasar sebelum integrasi satellite imagery.

## Scope

Tambahkan static datasets:

```text
public/data/
├── taliabu.geojson
├── coastline.geojson
├── rivers.geojson
├── watersheds.geojson
├── settlements.geojson
├── villages.geojson
├── administrative-boundaries.geojson
└── mining-iup.geojson
```

Jika dataset final belum tersedia, placeholder dapat digunakan selama struktur datanya sama.

## Layer Categories

```text
Environment
Mining
Hydrology
Coastal
Administrative
```

## Engineering Task

Buat abstraction:

```ts
interface MapLayerDefinition {
  id: string;
  name: string;
  category: string;
  type: "raster" | "vector";
  defaultVisible: boolean;
  opacity?: number;
}
```

## Deliverables

Layer panel sudah menggunakan declarative layer definitions.

## Acceptance Criteria

- semua static layer dapat di-toggle;
- inspector dapat membaca feature properties;
- layer implementation tidak hard-coded di satu component besar;
- attribution/source dataset dapat ditampilkan.

## Status

**Completed** — 2026-09-11

- `MapLayerDefinition` interface + `useLayers()` composable
- 6 static layers: mining IUP, rivers, watersheds, coastline, settlements, admin boundary
- Declarative layer registry (`static-layers.ts`)
- LayerPanel: category grouping, collapsible sections, opacity slider + value display, toggle switches
- InspectorPanel: feature property display + dataset metadata (source, version, refresh policy)
- Data restructured per ARCHITECTURE: `boundaries/`, `hydrology/`, `human/`, `mining/`, `coastal/`, `metadata/`
- `datasets.json` with traceable metadata per dataset

## Phase 2 Follow-up — Village Boundaries

**Completed** — 2026-09-21

- `public/data/boundaries/villages.geojson` berisi 71 desa/kelurahan dari BIG;
- layer `Village boundaries` terdaftar di registry administratif dengan label desa;
- source attribution dan metadata dataset sudah ditambahkan;
- `scripts/download-villages.ts` tersedia untuk refresh manual.

# Phase 3 — Copernicus Scene Discovery

## Goal

Menghubungkan aplikasi ke data Sentinel aktual.

## Scope

Implement Worker integration ke Copernicus STAC API.

Endpoint:

```http
GET /api/scenes
```

Parameters:

```text
from
to
collection
maxCloudCover
```

Internal flow:

```text
Worker
  ↓
Copernicus STAC
  ↓
Sentinel-2 L2A
  ↓
intersect Taliabu AOI
  ↓
normalize
  ↓
frontend
```

## Internal Scene Model

```ts
interface SatelliteScene {
  id: string;
  collection: string;
  acquiredAt: string;
  cloudCover?: number;
  bbox: number[];
  provider: "copernicus";
}
```

## Deliverables

Frontend dapat menampilkan daftar acquisition Sentinel-2 aktual untuk Taliabu.

## Acceptance Criteria

- hanya scene yang overlap Taliabu dikembalikan;
- cloud cover tersedia jika provider menyediakannya;
- scene diurutkan berdasarkan acquisition date;
- raw provider payload tidak diteruskan langsung ke frontend;
- provider error menghasilkan application-level error yang konsisten.

## Status

**Completed** — 2026-09-15

- `worker/services/copernicus-stac.ts` — STAC search via Copernicus Data Space
- `worker/routes/scenes.ts` — `/api/scenes` and `/api/scenes/latest` endpoints
- Scene normalization: id, collection, acquiredAt, cloudCover, bbox, provider
- Hardcoded Taliabu AOI bbox: [124.42, -2.10, 125.22, -1.52]
- Default collection: `sentinel-2-l2a`, max cloud cover: 100%
- Tested: returns 12 scenes for Sep 2026 with 2–19% cloud cover
- Copernicus credentials (COPERNICUS_CLIENT_ID, COPERNICUS_CLIENT_SECRET) saved as Worker secrets for Phase 4 Sentinel Hub

# Phase 4 — First Vertical Slice: Sentinel-2 True Color

## Goal

Menyelesaikan jalur end-to-end pertama dari browser sampai citra Sentinel tampil di Pulau Taliabu.

Ini adalah milestone teknis utama pertama.

## Target Flow

```text
Vue
 ↓
MapLibre
 ↓
Cloudflare Worker
 ↓
Sentinel Hub Process API
 ↓
PNG image
 ↓
MapLibre image source
```

## Scope

Implement:

- Sentinel Hub Process API proxy;
- Copernicus OAuth token management;
- scene selection;
- true-color raster layer rendering;
- acquisition metadata;
- cloud-cover indicator.

## UI

Timeline mulai menggunakan real scene data.

User dapat:

```text
select acquisition
      ↓
map updates
```

## Deliverables

Pulau Taliabu dapat dilihat menggunakan Sentinel-2 imagery aktual.

## Acceptance Criteria

- user dapat memilih scene;
- map menampilkan imagery sesuai scene;
- tanggal acquisition tampil;
- cloud cover tampil;
- credential tidak berada di browser;
- external API failure tidak merusak basemap/static layers.

## Status

**Completed** — 2026-09-15

- Sentinel Hub Process API untuk true color rendering (bukan Planetary Computer tiles)
- `worker/services/copernicus-token.ts` — OAuth token fetch + cache
- `worker/services/sentinel-hub.ts` — Process API call with evalscript
- `worker/routes/render.ts` — `POST /api/render` endpoint
- `MapView.vue` — `image` source (bukan `raster` tiles), single PNG per bbox
- `Timeline.vue` — horizontal scrollable scene list with date + cloud cover chips
- `EnvironmentalMapPage.vue` — manages scenes array + selectedScene state
- Scene selection uses `updateImage()` for smooth transition (no flicker)
- Process API bbox: [123.8, -2.5, 125.8, -1.0] (wider than island for full coverage)
- Copernicus credentials stored in `.dev.vars` (local) + Worker secrets (production)
- Build verified ✓

# Phase 5 — Satellite Timeline

## Goal

Membuat navigasi temporal sebagai first-class feature.

## Scope

Timeline menampilkan:

- available acquisitions;
- acquisition date;
- cloud quality;
- selected scene;
- compare scene.

Shortcuts:

```text
Latest
1 Bulan
6 Bulan
1 Tahun
```

## Scene Selection Rules

Untuk `latest usable`:

```text
latest scene
AND cloudCover <= preferred threshold
```

Jika tidak tersedia:
- gunakan best available scene;
- tampilkan warning kualitas.

## Deliverables

Pengguna dapat menjelajah imagery Pulau Taliabu berdasarkan waktu.

## Acceptance Criteria

- pergantian scene tidak reload page;
- current scene selalu terlihat jelas;
- high-cloud scene diberi indikator;
- URL state dapat menyimpan selected date jika memungkinkan.

## Status

**Completed** — 2026-09-15

- `Timeline.vue` — shortcut buttons (Latest, 1 Bulan, 6 Bulan, 1 Tahun)
- `EnvironmentalMapPage.vue` — date range management + URL state
- Shortcut buttons dynamically query STAC API with appropriate date ranges
- URL state persists `?from=YYYY-MM-DD&to=YYYY-MM-DD` across page reloads
- High-cloud scenes (>15%) get red border + badge indicator
- Scene selection remains instant (no page reload)
- Build verified ✓

# Phase 6 — Environmental Raster Layers

## Goal

Menambahkan layer remote-sensing utama.

## Implementation Order

```text
1. False Color
2. NDVI
3. NDWI
4. MNDWI
5. Bare Soil
6. Sentinel-1 SAR
```

## NDVI

Purpose:
- vegetation health;
- vegetation coverage.

Formula:

```text
(B08 - B04) / (B08 + B04)
```

## NDWI / MNDWI

Purpose:
- water detection;
- temporal water change.

## Bare Soil

Purpose:
- exposed land;
- surface disturbance.

Must not be interpreted automatically as mining.

## Sentinel-1

Purpose:
- monitoring ketika optical imagery tertutup awan;
- complementary surface-change evidence.

## Deliverables

Layer panel memiliki environmental raster layers.

## Acceptance Criteria

- setiap layer memiliki legend;
- layer memiliki source metadata;
- SAR dibedakan secara visual dan interpretatif dari optical imagery;
- layer switch tidak membutuhkan reload.

## Status

- Visual palettes NDVI/NDWI/SCL/SWIR matched verbatim to Copernicus Browser custom scripts; SWIR replaces old bare-soil composite (B12, B11, B04 + HighlightCompressVisualizer).
- SCL added as diagnostic layer (environment group) — Sen2Cor class palette; bukan pengganti indeks.
- SCL quality mask in change detection: `ndvi-raw`/`mndwi-raw` alpha = dataMask * isValid(SCL); invalid classes 0,1,3,7,8,9,10 dibuang (pola mosaic Copernicus) → confidence = % pixel clear di dalam AOI.

**Completed** — 2026-09-15

- 6 raster layers: NDVI, NDWI, MNDWI, False Color, Bare Soil, SAR
- Evalscripts in `worker/services/sentinel-hub.ts` (EVALSCRIPTS map)
- Render route `/api/render` accepts `type` param, validates against allowed list
- SAR uses `sentinel-1-grd` collection (no cloud filter)
- `RasterLayerDefinition` type with `source.evalscriptKey`
- Layer registry in `static-layers.ts` under `environment` + `satellite` categories
- MapView manages raster layer lifecycle: load/unload on toggle, update on scene change
- All layers default off, fetched on-demand via `/api/render`
- All Sentinel-2 layers share same scene/time window as true-color
- `dataMask` band in all evalscripts handles cloud/no-data

# Phase 7 — Before / After Compare

## Goal

Memberikan kemampuan visual untuk membandingkan kondisi Pulau Taliabu antarperiode.

## Compare Modes

Implement minimal:

```text
Swipe
Split
```

Optional:

```text
Blink
Difference
```

## Flow

```text
Scene A
   +
Scene B
   ↓
Compare Mode
```

## Deliverables

User dapat melihat perubahan secara visual tanpa automated interpretation.

## Acceptance Criteria

- dua tanggal dapat dipilih;
- kedua layer tetap aligned;
- compare slider berjalan smooth;
- metadata kedua scene terlihat;
- compare state dapat disimpan di URL jika memungkinkan.

## Status

**Completed** — 2026-09-15

- Swipe compare menggunakan dua peta MapLibre yang tetap tersinkronisasi
- Split compare tersedia melalui tombol mode pada timeline
- Scene kedua dapat dipilih dari daftar scene
- Tanggal kedua scene ditampilkan sebagai metadata compare
- Compare state disimpan melalui `compare`, `sceneB`, dan `compareMode` di URL

# Phase 8 — AOI and Spatial Inspection

## Goal

Memungkinkan user melakukan analisis pada area tertentu.

## Scope

User dapat:
- draw polygon;
- select feature;
- clear AOI.

Use Turf.js for:

```text
area
distance
point-in-polygon
intersection
simple buffer
```

## AOI Metrics

Tampilkan:
- area;
- intersection dengan IUP;
- nearest river;
- distance to coastline;
- watershed;
- selected environmental metrics.

## Deliverables

Inspector menjadi context-aware berdasarkan selected AOI.

## Acceptance Criteria

- polygon dapat digambar;
- area dihitung dalam hektare;
- intersection dengan known IUP dapat diketahui;
- nearest river dapat dihitung;
- AOI size dibatasi agar tidak menghasilkan request remote yang berlebihan.

## Status

Completed.

- Draw AOI: click vertices, double-click to finish, Escape to cancel; live rubber-band line + vertices (MapView).
- Button "Draw AOI" di LayerPanel fungsional, toggle jadi "Cancel drawing".
- Metrics via Turf.js (useAoiAnalysis.ts): area (ha), IUP intersect % + names, nearest river (m), distance to coastline, watershed by point-in-polygon.
- InspectorPanel context-aware: AOI block dengan Clear AOI, loading, dan error state.
- AOI limit 10.000 ha (100 km²); overshoot menampilkan pesan "AOI too large", tidak ada request remote.
- Verified in browser: draw, metrics, clear, Escape, oversize error; node self-check untuk intersect 100%/null; vue-tsc + vite build pass.

# Phase 9 — Automated Change Detection

## Goal

Mengubah visual comparison menjadi structured environmental change analysis.

## Initial Change Types

```text
Vegetation Loss
New Bare Land
Water Change
Surface Disturbance
```

## Inputs

```text
Scene A
Scene B
AOI
analysis type
```

## Strategy

Simple/synchronous analysis:
- Sentinel Hub.

Long temporal analysis:
- openEO.

## Deliverables

Map dapat menampilkan derived change polygons/statistics.

## Acceptance Criteria

- result selalu memiliki source;
- result selalu memiliki analysis method;
- result selalu memiliki date range;
- quality/confidence tersedia;
- result tidak membuat legal conclusion.

## Status

**Completed** — 2026-09-16

- 3 change types: vegetation loss (NDVI drop >= 0.15), new bare land (NDVI crosses below 0.2), water change (MNDWI crosses 0.1 both directions)
- SAR extension: `sar-loss` (VH backscatter drop >= 2.5 dB, Sentinel-1 GRD, cloud-penetrating untuk Maluku Utara); `sar-raw` evalscript encodes VV->R, VH->G over [-30, 0] dB; 14-day lookback untuk revisit 12 hari
- REVERTED sar-loss rule (same day): two-scene SAR delta proven unsound on dense tropical forest — measured on Taliabu tile, VH sits at S1 noise floor (~-24 dB, cannot drop; all fires were wetland/flood transitions), VV swings 2-3 dB between passes (weather/orbit, 41% of intact tile at 2 dB threshold). Kept: `sar-raw` evalscript (fixed: S1 bands are LINEAR power, not dB; needs 10*log10) and `isSAR` route fix. Real SAR change detection needs a multi-scene baseline (median of >=4 passes) — openEO territory.
- `ndvi-raw` / `mndwi-raw` / `sar-raw` evalscripts encode metric into raw channels, alpha = dataMask
- Client-side per-pixel diff via OffscreenCanvas (`changeDetection.ts`), 2x `/api/render` per analysis (AOI bbox, 512px, 4-day lookback window per date)
- Result: colored change overlay (maplibre image source) + stats in InspectorPanel
- Acceptance criteria met: source (Sentinel-2 L2A), method (threshold label), window (date A → B), confidence (% cloud-free valid pixels), proxy disclaimer
- Self-check: `node --experimental-strip-types scripts/check-change-detection.ts` (pure `diffPixels` rules)
- Browser-verified: draw AOI → run analysis → 753 ha change in 2026-08-15 → 2026-09-14 window, overlay rendered; vue-tsc + build pass

# Phase 10 — Mining Impact Mode

## Goal

Menggabungkan environmental context yang paling relevan terhadap aktivitas pertambangan dalam satu preset.

## Preset Layers

```text
Satellite True Color
Mining IUP
Surface Disturbance
Vegetation Loss
Rivers
Watersheds
Coastline
Sediment Proxy
Settlements
```

## Inspector Relationships

Untuk selected change polygon:

```text
intersects known IUP?
nearest river?
watershed?
distance to coast?
nearest settlement?
first detected?
latest detected?
```

## Deliverables

One-click `Mining Impact` mode.

## Acceptance Criteria

- preset dapat diaktifkan/nonaktifkan;
- mode hanya meng-compose layer yang sudah ada;
- tidak menduplikasi implementation;
- inspector memberikan spatial relationship yang relevan.

## Status

**Completed** — 2026-09-16

- Tombol "Mining Impact mode" di LayerPanel: mengaktifkan basemap Satellite + preset layer (IUP, NDVI, rivers, watersheds, coastline, settlement areas); toggle off mengembalikan visibility ke default.
- Preset hanya meng-compose layer yang sudah ada (reuse `useLayers.setLayer`), tanpa duplikasi; Vegetation Loss tersedia via Change Detection di inspector (tidak auto-request tanpa aksi user).
- Inspector AOI kini menampilkan "Nearest settlement" (jarak ke polygon permukiman BIG terdekat).
- Sediment proxy belum ada — menyusul di Phase 12.
- Browser-verified: mode aktif, basemap+timeline beralih Satellite, NDVI raster termuat, analysis 763 ha / confidence 100%; vue-tsc + build pass.

# Phase 11 — Terrain and Hydrology

## Goal

Menambahkan konteks aliran permukaan dari area tambang menuju sungai dan pesisir.

## Static Processing

Precompute:

```text
Elevation
Slope
Watershed
Flow context
```

Possible source:
- DEMNAS.

## Runtime

Frontend mostly consumes static derived data.

Avoid dynamic DEM processing in Worker.

## Deliverables

- terrain layer;
- slope layer;
- watershed layer;
- downstream context.

## Acceptance Criteria

- selected location dapat dipetakan ke watershed;
- slope context tersedia;
- mining/surface disturbance dapat dilihat bersama hydrology.

## Status

**Complete** — started and finished 2026-09-16

- Source DEM: DEMNAS via BIG ImageServer `exportImage` (geoservices.big.go.id) — verified live; 2000×2000 px (~66 m/px) over bbox [124.2, -2.35, 125.4, -1.15]. NOTE: server menghasilkan export rusak pada size=4000 (p99 = 0 m) — gunakan 2000. DEMNAS portal tanahair.indonesia.go.id dead; AWS terrarium tiles terbukti jalan sebagai fallback.
- `scripts/terrain/preprocess.py` (Python, one-time preprocessing — bukan Worker): fetch tif, filter nodata/garbage spikes (nilai di luar [-100, 1700] m) + laut (<= 0.5 m) → alpha, tulis `public/data/terrain/{elevation,slope}.png` + `terrain.json`; slope via Horn 3×3 (numpy). Verified: max elev 1393 m (puncak Taliabu), slope max ~50°.
- Layer `Elevation` + `Slope` (category terrain): static raster via MapLibre `image` source (`source.staticUrl` + `bbox` di `RasterLayerDefinition`), scene-independent, radio-group dengan raster lain; legend ramp.
- AOI inspector metrics: elevation min/max/mean + slope mean/max via client-side sampling PNG statis (OffscreenCanvas, pola sama dengan changeDetection). Browser-verified: AOI 584 ha → elev 66–615 m, slope mean 17.1°/max 41°.
- Dataset metadata `terrain-dem` di datasets.json.
- Fase B (D8 hydrology) — selesai: `scripts/terrain/hydro.py` (priority-flood epsilon fill, D8 steepest descent, flow accumulation; 3 bug yang ditemukan: salah seed ocean-adjacency, konvensi tanda steepest descent terbalik, slice mapping tetangga terbalik — semua fixed dan verified). Output: `fdr.png` (R=D8 code, G=log accumulation, alpha=land) + `drainage.geojson` (90 stream, threshold ~9 km²). Validasi: 87/90 stream midpoint <650 m dari sungai BIG.
- Layer `Derived drainage` (hydrology, dashed teal) + metrik `Downstream flow` di AOI inspector (trace D8 dari centroid AOI via `terrain.ts`, garis dashed amber di peta). Browser-verified: AOI 1.008 ha → downstream 9,2 km to outlet; drainage toggle OK; console bersih.
- Layer `Derived catchments` (hydrology, fill tan + dashed outline): delineation per muara dari model D8 yang sama — `label_catchments()` menyebar label tiap stream mouth ke hulu (urutan filled ascending; catatan: urutan descending flow_accumulation terbalik arah untuk label-copy — propagasi hanya jalan 1 langkah kalau keliru) + `mask_rings()` polygonize mask via directed edge stitching (tanpa shapely). 48 catchments, ~2.216 km² tercakup; 8 MultiPolygon dari pinch corner.

## Status

**Complete** — 2026-09-16. Semua deliverables: terrain layer, slope layer, watershed (resmi BIG + derived), downstream context.

# Phase 12 — Coastal and Sediment Monitoring

## Goal

Memantau kemungkinan perubahan di pesisir downstream dari aktivitas darat.

## Scope

Implement:
- coastline baseline;
- coastline comparison;
- water reflectance anomaly;
- sediment/turbidity proxy;
- river-mouth context.

## Important Constraint

Sediment/turbidity adalah remote-sensing proxy.

UI harus menyatakan bahwa hasil:

```text
bukan pengukuran laboratorium
```

## Deliverables

Coastal analysis tersedia dalam map dan compare mode.

## Acceptance Criteria

- proxy memiliki method metadata;
- comparison antarperiode tersedia;
- river outlet dan nearby mining context dapat ditampilkan;
- tidak ada klaim chemical pollution otomatis.

## Status

**Complete** — 2026-09-16

- `ndti` evalscript (worker): NDTI (Red−Green)/(Red+Green), Lacaux et al. 2007, ramp clear→turbid; dimasukkan ke MASKED_TYPES (SCL cloud mask — verified: 30% px transparan pada tile bertutup awan). Layer `Turbidity (NDTI)` (coastal), deskripsi + metadata datasets.json menegaskan: proxy remote-sensing, bukan pengukuran laboratorium, tidak bisa dipakai klaim komposisi/polutan.
- `shore-band` evalscript: air = NDWI > 0, band terang di tepi air (0–0.08) → layer `Scene water edge` untuk perbandingan visual tepi pantai scene-berjalan vs `Coastline` baseline BIG, dan antarperiode lewat compare mode. Masked via SCL.
- `scripts/terrain/outlets.py` → `river-outlets.geojson`: 48 muara D8 (dari Phase 11), property hydrology `catchmentAreaKm2`. Layer `River outlets` (point); klik → inspector menghitung IUP terdekat dan jarak ke boundary dari snapshot IUP saat ini. Verified di browser (klik outlet → inspector hit).
- Map handle diekspos sebagai `window.__map` untuk verifikasi browser.
- Tile smoke test: ndti 200 (biru-hijau air), shore-band 200 (amber band hadir), render dua periode berbeda (6842 vs 140 px shoreline) → comparison antarperiode tersedia.
- Tidak ada klaim chemical pollution otomatis — semua deskripsi layer menyatakan model/proxy.

# Phase 13 — Analytics Dashboard

## Goal

Mengubah hasil layer menjadi ringkasan terukur.

## Context

Metrics dapat dihitung untuk:

```text
Entire Taliabu
Current viewport
Selected AOI
Selected mining boundary
```

## Metrics

Contoh:

```text
Vegetation area
Vegetation loss
Bare land
Water area
Surface disturbance
Coastline change
Number of detected change zones
```

## Deliverables

Bottom analytics panel aktif.

## Acceptance Criteria

- unit konsisten;
- selected context terlihat;
- metric source/date dapat ditelusuri;
- metric tidak ditampilkan tanpa metadata periode.

## Status

**Complete** — 2026-09-16

- MetricsRow diganti dari placeholder ke panel analytics aktif: scope selector (Taliabu / Viewport / AOI / Permit, disabled bila konteks belum ada) + metrik land cover nyata — Vegetation (NDVI > 0.2), Bare/sparse, Water (MNDWI > 0.1), luas scope, cloud-free coverage. Semua dalam ha + % (unit konsisten).
- `composables/analytics.ts`: `computeLandCover()` — fetch `ndvi-raw` + `mndwi-raw` 512px via POST /api/render (re-export `renderRaw`/`aoiMask` dari changeDetection; `aoiMask` kini support MultiPolygon + evenodd holes), decode + polygon mask + hitung ha.
- Page wiring: watch scope/date/bounds-rounded-key/aoi/feature → debounce 600ms → compute; cache per (scope|date). Viewport key dibulatkan 2 desimal + kartu metrik min-height fixed — memutus layout feedback loop (panel berubah tinggi → canvas resize → bounds berubah → recompute; berkedip + 1900+ recompute). Hasil tidak di-null saat recompute (anti flicker).
- `viewChanged` MapView kini menyertakan `bounds` + emit sekali saat load.
- Metadata periode selalu tampil: "sentinel-2 l2a · ndvi & mndwi · acquired <date> · ~<res> m/px"; tanpa scene terpilih → panel minta pilih scene (metrik tak pernah tampil tanpa periode).
- Browser-verified: Island 153.601 ha veg 52,3% @ 151 m/px; Viewport (air 55,3% — viewport mencakup laut); Permit "PATRIA SEKAR LAKSANA MULIA" 8.875 ha veg 56,8% @ 21 m/px; cache hit instan; render count stabil (loop mati); console bersih.
- Catatan UX pre-existing: klik fitur mengambil topmost visible layer (watershed fill menutupi IUP) — di luar scope fase ini.
- Vegetation loss / change zones tetap di panel AOI change detection (perbandingan dua tanggal); panel metrik menampilkan hint ke sana.

# Phase 14 — D1 Persistence

## Goal

Menambahkan persistence hanya setelah satellite dan analysis flows stabil.

## Tables

```text
satellite_scenes
analysis_runs
environmental_alerts
app_config
```

## D1 Responsibilities

Store:
- scene metadata;
- analysis metadata;
- alert metadata;
- application config.

Do not store:
- large raster;
- full GeoTIFF;
- large tile sets.

## Deliverables

Scene discovery dan analysis dapat reuse cached metadata.

## Acceptance Criteria

- duplicate scene tidak disimpan;
- analysis status persist;
- schema migrations tersedia;
- storage tetap metadata-focused.

## Status

**Complete** — 2026-09-16

- `migrations/0001_init.sql`: 4 tabel metadata-only — `satellite_scenes` (PK id STAC, index acquired_at), `analysis_runs` (status CHECK running/done/failed), `environmental_alerts` (kosong — diisi Phase 15), `app_config` (kosong, diisi saat ada kebutuhan nyata). Tidak ada raster/tile di D1.
- `routes/scenes.ts`: write-through — tiap STAC search di-upsert ke `satellite_scenes` via `INSERT OR IGNORE` + `db.batch`; saat STAC gagal, fallback baca cache untuk range yang sama (flag `cached: true` di response). Deliverable "reuse cached metadata" terpenuhi; consumer penuh di Phase 17 (Scheduled Discovery).
- `routes/render.ts`: tiap POST `/api/render` tercatat di `analysis_runs` — insert `running` → update `done`/`failed` (+ error message). Path tile GET `/render/tile/:z/:x/:y` tidak dicatat (bukan analysis, hanya render).
- Verified lokal (wrangler dev + D1 local): 12 tile tersimpan dari search 2026-09-01→16; panggilan ulang endpoint yang sama → tetap 12 baris (dedup ✓); POST render NDVI 256px → run #1 status `done` ✓; `vue-tsc` bersih.
- Catatan: `tsconfig.json` hanya include `src/` — worker tidak pernah di-typecheck (dikompilasi esbuild wrangler). Dibiarkan seperti itu.
- Deploy nanti: ganti `database_id` placeholder di wrangler.jsonc → `wrangler d1 migrations apply taliabu-db --remote`.

# Phase 15 — Environmental Alerts

## Goal

Menghasilkan monitoring event berdasarkan perubahan yang telah dihitung.

## Initial Rules

Examples:

```text
vegetation_loss_area >= threshold

surface_change
AND distance_to_river <= threshold

surface_change
AND distance_to_coast <= threshold

surface_change
AND NOT intersects_known_iup
```

## Deliverables

Alert panel pada one-page dashboard.

## Acceptance Criteria

- setiap alert dapat dibuka di peta;
- setiap alert memiliki evidence metadata;
- threshold configurable;
- alert dapat di-filter secara UI.

## Status

**Complete** — 2026-09-16

- `composables/alerts.ts`: 4 rules dari PLAN dievaluasi murni di frontend dari hasil change detection AOI + konteks spasial `analyzeAoi` (river/coast distance, permits) — tanpa render ulang. Guard cloud: coverage <30% → "Too cloudy to judge", tidak ada alert. Severity: high (≥25 ha) / medium.
- `worker/routes/alerts.ts`: GET/POST `/api/alerts` — insert batch ke `environmental_alerts` (kolom kind, severity, aoi JSON, scene_id, evidence JSON), GET dengan filter `kind` + limit. Alert panel ada di InspectorPanel: badge severity + evidence utuh (rule, method, cloud-free %, window, threshold, konteks jarak/sungai/IUP, source+generatedAt) — alert aktif tampil inline, log row expandable on click (sekaligus fokus peta). Input threshold editable (veg loss ha, distance m), tombol "Save to alert log".
- Alert log block di bawah AOI: daftar alert tersimpan (dot severity, kind label, ha, tanggal), dropdown filter by kind, klik entri → expand evidence + `map.fitBounds` ke bbox evidence (maxZoom 13) + poligon AOI tersimpan dirender sebagai outline merah putus-putus (`aoi-alert-casing`/`aoi-alert-line`, prefix `aoi-` agar selamat dari updateBasemap); klik lagi (collapse) → outline dihapus + kamera kembali ke view sebelum fokus (`preFocusCamera`).
- Evidence metadata lengkap: rule, method (label NDVI/MNDWI rule), metric, changedHa, coverage, dateA/B, bbox, thresholds saat evaluasi, source, generatedAt, konteks spasial (distanceM, permits).
- Verified di browser end-to-end: AOI digambar di atas permit INDOMEGA; 2026-08-25→09-04 NDVI diff 42% cloud-free → 0.0 ha change → "No threshold met" (guard negative ✓); threshold 0 → alert "Vegetation loss" medium muncul; save → D1 (kind vegetation-loss-area, evidence 11 keys, aoi JSON ✓); alert log 1 entri; filter kind near-river → 0, all → 1; klik log entri dari posisi jauh → peta fokus zoom 12.2 menutupi bbox ✓. Screenshot `phase15-alerts.png`.
- Catatan data: 2026-09-14 dan 2026-09-01..03 render 0% opaque di bbox uji ( tidak ada scene ≤20% cloud menutupi spot itu pada window 10 hari) — bukan bug; hasil "Too cloudy" adalah perilaku benar untuk kasus itu.
- Threshold + severity + label tersentral di composables/alerts.ts; D1 tetap metadata-only (AOI polygon JSON kecil, bukan raster).

# Phase 16 — Export and Evidence

## Goal

Membuat hasil monitoring dapat didokumentasikan dan dibagikan.

## Export Types

```text
PNG
CSV
GeoJSON
JSON metadata
Shareable URL
```

## Snapshot Metadata

Snapshot minimal berisi:

```text
Observation date
Comparison date
Source
Active layers
AOI
Generated timestamp
```

## Deliverables

Export action tersedia dari dashboard.

## Acceptance Criteria

- screenshot memiliki attribution;
- CSV memiliki units;
- GeoJSON memiliki context yang jelas;
- evidence metadata menyimpan source dan method.

## Status

**Complete** — 2026-09-16

- `composables/export.ts`: `exportMapPng` (capture setelah repaint via `once("render")` + `triggerRepaint`, salin canvas + attribution bar 26 CSS px yang di-scale DPR, teks "Taliabu Environmental Monitor · Sentinel-2 L2A · <date> · © OpenFreeMap · © OpenStreetMap contributors"), `downloadBlob`, `toCsv` (kolom unit + escaping CSV), `encodeAoi`/`decodeAoi` (ring dibulatkan 5 dp, validasi struktur — menolak ring tanpa nesting), `buildShareUrl` (param `aoi` + `cam`), konstanta `SATELLITE_SOURCE` + `DATA_ATTRIBUTION`.
- Blok "Export" di InspectorPanel: CSV (statistik AOI + change detection + land cover, unit ha/%/m/deg/km/m-px), GeoJSON (feature AOI dengan properties context: dates, source, method, changedHa, coverage, permits, jarak river/coast, watershed, attribution, disclaimer), JSON snapshot (observation/comparison date, source, active layers, AOI, change evidence, alerts evidence lengkap, land cover, generatedAt), PNG, dan "Copy share link" (feedback "Link copied" 2 detik).
- Share URL: `aoi` (JSON ring 5 dp) + `cam` (lon,lat,zoom); restore berjalan sebelum MapView mount sehingga `initial-view` memakainya; AOI divalidasi terhadap limit 10.000 ha.
- Perbaikan yang ditemukan saat verifikasi: (1) `decodeAoi` menerima ring tanpa nesting → crash di `shareUrl` computed; kini ada validasi struktur; (2) `watch(props.aoi)` tanpa `immediate` — AOI dari URL diset sebelum panel mount sehingga analisis tidak pernah jalan; (3) deadlock PNG: `triggerRepaint` dipanggil setelah `await once("render")` padahal peta idle tidak pernah render sendiri.
- Verified di browser end-to-end: buka share URL → kamera zoom 11.00 ter-restore, outline AOI tampil, analisis jalan otomatis (1.483 ha · 100.1% dalam IUP ZOUK/WIRA BAHANA PERKASA MAKMUR); change detection 2026-08-25→09-04 (0.0 ha, 5% cloud-free → "Too cloudy", guard positif); keempat download terekam: CSV 21 baris dengan kolom unit + note ter-escape, GeoJSON dengan context lengkap, JSON snapshot 11 field, PNG 1304×1092 dengan bar attribution + glyph teks terverifikasi via pixel sample; label "Link copied"; disabled states benar (GeoJSON tanpa AOI, CSV tanpa data, PNG saat compare mode karena MapView unmount). `vue-tsc` + `vite build` bersih. Screenshot `phase16-export.png`.
- Catatan: clipboard di headless hang saat `readText()` (permission) — copy diverifikasi lewat feedback label; URL yang dicopy identik dengan `location.href` yang menjadi input restore.

# Phase 17 — Scheduled Scene Discovery

## Goal

Mengurangi kebutuhan user untuk mengecek scene baru secara manual.

## Components

```text
Cron Trigger
   ↓
SceneDiscoveryWorkflow
   ↓
Copernicus STAC
   ↓
new usable scene?
```

If yes:

```text
store metadata
optionally enqueue analysis
```

## Scheduling

Gunakan cadence konservatif.

Contoh awal:

```text
daily
```

Tidak perlu hourly karena satellite revisit tidak real-time.

## Deliverables

Latest usable scene dapat diperbarui otomatis.

## Acceptance Criteria

- duplicate processing dihindari;
- quota Copernicus dilindungi;
- workflow failure dapat diretry;
- application tetap berjalan jika workflow gagal.

## Status

**Completed** — 2026-09-18

- `wrangler.jsonc`: cron trigger `0 23 * * *` (daily 23:00 UTC = 08:00 WIT)
- `worker/index.ts`: `scheduledHandler` — fetch STAC last 30 days → `persistScenes` → D1
- `worker/routes/scenes.ts`: export `persistScenes` (dedup via `INSERT OR IGNORE` PK)
- `/api/acquisitions`: baca D1 dulu, fallback STAC hanya saat cache kosong
- `/api/acquisitions/latest`: baca D1 dulu, fallback STAC
- Tested locally: cron trigger → 22 tiles fetched, 2026-08-19 → 2026-09-18
- Build verified ✓

# Phase 18 — Cloudflare Security Hardening

## Goal

Memperkuat proteksi aplikasi di edge Cloudflare sebelum optimasi performa dan deployment publik.

## Checklist

```text
✓ Free Managed Ruleset
✓ Block common scanner paths
✓ Block unsupported server extensions
✓ Rate limit expensive API
✓ Correct unknown-path 404 behavior
✓ Security Events review
✓ Bot Fight Mode after verification
```

## Status

**Complete** — 2026-09-18

# Phase 19 — Performance and Free-Tier Hardening

## Goal

Memastikan aplikasi tetap nyaman digunakan dan tidak mudah melewati free quota.

## Scope

Implement:
- request deduplication;
- response caching;
- scene metadata caching;
- layer request debouncing;
- max AOI;
- max raster dimensions;
- aggressive static caching;
- reuse completed analysis;
- provider quota monitoring.

## Rules

Do not:

```text
request satellite raster on every mouse move
```

Do:

```text
request only on:
- scene change
- layer change
- committed AOI change
```

## Deliverables

Production-ready quota strategy.

## Acceptance Criteria

- common interactions tidak menghasilkan redundant provider requests;
- failed provider request tidak menyebabkan retry storm;
- application tetap berada dalam expected free-tier usage untuk personal/community traffic.

## Status

**Completed** — 2026-09-21

- 19.1 guards (`worker/services/render-guards.ts`, `scripts/check-render-guards.ts`): `POST /api/render` clamp width/height ke 16–1600px (default 1024), bbox harus di dalam window Taliabu `[123.8, -2.5, 125.8, -1.0]` (`BBOX_OUT_OF_BOUNDS`), validasi `from <= to` (`INVALID_TIMERANGE`); tile route menolak tile di luar window (`TILE_OUT_OF_BOUNDS` — sebelumnya proxy mau mengambil tile mana pun di bumi); `evalscript` arbitrer dari client dihapus dari interface (hanya whitelist `VALID_TYPES` yang mencapai Process API); CompareView kini mengirim `type` eksplisit.
- 19.2 dedup + cache: request identik berbagi satu panggilan provider via in-flight map (bytes di-buffer agar tiap caller dapat Response sendiri — stream hanya bisa dikonsumsi sekali); hasil di-cache di `caches.default` — window historis 7 hari, window 2 hari terakhir 1 jam. Verified: 4 request paralel → 1 `analysis_runs`, semua 200 PNG; request ulang → cache hit tanpa run baru.
- 19.3 anti retry-storm: failure per cache-key memicu cooldown 30 detik (`RENDER_COOLDOWN` 503) — verified: request rusak kedua langsung 503 tanpa menyentuh provider.
- 19.4 debounce: pergantian scene di-collapse 150 ms (`scheduleSatelliteLayers`); analytics tetap 600 ms + cache `(scope|date)`; opacity slider hanya paint property (tanpa request).
- 19.5 static caching: `public/_headers` — `/data/*` 1 hari + stale-while-revalidate, `/assets/*` immutable 1 tahun; `/api/acquisitions(+/latest)` `max-age=300, stale-while-revalidate=600`; `GET /api/alerts` `max-age=60`.
- 19.6 quota monitoring: counter harian `quota:<date>:ok|fail` di `app_config` (ditulis tiap render + tiap failure), endpoint `GET /api/quota` → `{ date, renders, failed }`.
- Verified: `vue-tsc` bersih, `vite build` OK, `wrangler deploy --dry-run` OK, self-checks (`check-render-guards`, `check-change-detection`) OK, browser smoke test (NDVI toggle → 9 tile 200, analytics terhitung, 0 console error; screenshot `phase19-ndvi-smoke.png`).

# Phase 20 — Production Readiness

## Goal

Menyiapkan aplikasi untuk deployment publik.

## Scope

- production environment;
- Cloudflare deployment;
- secrets;
- error handling;
- structured logging;
- accessibility review;
- source attribution;
- dataset licensing review;
- responsive QA.

## Deliverables

Public production deployment.

## Acceptance Criteria

User dapat:

1. membuka satu URL;
2. melihat Pulau Taliabu;
3. melihat latest usable satellite imagery;
4. memilih historical imagery;
5. melihat NDVI, water, bare land, dan SAR;
6. melakukan before/after comparison;
7. menggambar AOI;
8. melihat mining, river, watershed, dan coastal context;
9. melihat detected environmental changes;
10. menggunakan Mining Impact mode;
11. membaca analytics;
12. membuka monitoring alerts;
13. export evidence;
14. mengetahui source dan acquisition date setiap hasil;
15. menggunakan aplikasi tanpa dependency infrastruktur berbayar.

# Milestone Summary

```text
M0  Project foundation
M1  Map + Taliabu boundary
M2  Static environmental context
M3  Copernicus scene discovery
M4  Sentinel-2 true color vertical slice (via Planetary Computer)
M5  Satellite timeline
M6  Environmental raster layers
M7  Before/after compare
M8  AOI + spatial inspection
M9  Automated change detection
M10 Mining Impact mode
M11 Terrain + hydrology
M12 Coastal + sediment monitoring
M13 Analytics
M14 D1 persistence
M15 Scheduled scene discovery
M16 Environmental alerts
M17 Export/evidence
M18 Cloudflare security hardening
M19 Performance/free-tier hardening
M20 Production readiness
```

# Recommended Starting Point

Development sebaiknya fokus menyelesaikan:

```text
Phase 0
   ↓
Phase 1
   ↓
Phase 2
   ↓
Phase 3
   ↓
Phase 4
```

Target pertama bukan database, workflow, alert, atau automated analysis.

Target pertama adalah:

```text
Pulau Taliabu
      ↓
real Sentinel-2 scene
      ↓
Cloudflare Worker
      ↓
MapLibre
      ↓
visible in browser
```

Setelah **Phase 4** stabil, architecture utama sudah tervalidasi dan phase berikutnya dapat dikembangkan secara incremental.
