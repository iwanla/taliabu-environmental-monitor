# PRD — Taliabu Environmental Monitor

## 1. Overview

**Taliabu Environmental Monitor** adalah aplikasi web single-page untuk memantau kondisi lingkungan Pulau Taliabu, Maluku Utara, dengan fokus pada perubahan lingkungan yang berkaitan dengan aktivitas pertambangan.

Aplikasi menggabungkan citra satelit, data pertambangan, data hidrologi, topografi, garis pantai, dan analisis perubahan temporal dalam satu peta interaktif.

Product ini dirancang untuk:
- berjalan sebagai single-page web application;
- menggunakan stack yang kompatibel dengan Cloudflare Workers;
- memprioritaskan layanan dan data gratis;
- tidak membutuhkan server GIS berbayar, VM, VPS, PostGIS, atau container untuk MVP;
- memanfaatkan Copernicus Data Space sebagai sumber utama data Sentinel dan remote-sensing processing.

---

## 2. Problem Statement

Pulau Taliabu memiliki aktivitas pertambangan yang dapat menyebabkan perubahan tutupan lahan, vegetasi, aliran permukaan, badan air, dan area pesisir.

Informasi tersebut tersedia dari berbagai sumber, tetapi:
- tersebar di banyak portal;
- sulit dibandingkan lintas waktu;
- tidak mudah dikaitkan dengan area pertambangan;
- tidak memiliki satu tampilan terpadu untuk melihat hubungan antara bukaan lahan, sungai, DAS, pesisir, dan area permukiman;
- sulit digunakan oleh pengguna non-GIS.

Aplikasi perlu menyederhanakan data tersebut menjadi satu environmental monitoring dashboard berbasis peta.

---

## 3. Product Goal

Menyediakan satu halaman interaktif yang memungkinkan pengguna memahami kondisi lingkungan Pulau Taliabu saat ini dan perubahan historisnya melalui citra satelit serta layer geospasial yang relevan.

Aplikasi harus dapat membantu menjawab pertanyaan seperti:

- Di mana bukaan lahan baru muncul?
- Berapa luas vegetasi yang berkurang dalam periode tertentu?
- Apakah bukaan baru berada di dalam atau di luar wilayah izin pertambangan?
- Apakah bukaan berada dekat sungai?
- Ke mana aliran air dari area tersebut menuju?
- Apakah terdapat perubahan di pesisir atau badan air downstream?
- Bagaimana kondisi sekarang dibandingkan bulan atau tahun sebelumnya?
- Area mana yang mengalami perubahan lingkungan paling besar?

---

## 4. Product Principles

### 4.1 Map First

Peta adalah pusat aplikasi. Seluruh analisis dan informasi harus dapat ditelusuri kembali ke lokasi geografis.

### 4.2 Evidence Over Conclusion

Aplikasi menampilkan indikator perubahan lingkungan, bukan membuat klaim hukum atau ilmiah yang tidak didukung data lapangan.

Contoh:
- "vegetation loss detected" diperbolehkan;
- "illegal mining detected" tidak boleh disimpulkan hanya dari citra;
- "sediment/turbidity anomaly" diperbolehkan;
- "water is chemically polluted" tidak boleh disimpulkan tanpa data laboratorium.

### 4.3 Temporal by Default

Setiap layer dinamis sebisa mungkin memiliki dimensi waktu.

Pengguna harus dapat melihat:
- kondisi terbaru;
- kondisi historis;
- perubahan antar dua periode.

### 4.4 Free Infrastructure First

Desain harus memprioritaskan:
- Cloudflare Workers Free;
- Cloudflare Static Assets;
- Cloudflare D1 Free;
- Cloudflare Workflows/Queues jika tersedia dalam free tier;
- Copernicus Data Space;
- Sentinel-1;
- Sentinel-2;
- OpenFreeMap/OpenStreetMap;
- static GeoJSON/PMTiles untuk data referensi.

### 4.5 Reproducible Analysis

Setiap hasil analisis harus menyimpan:
- sumber data;
- tanggal citra;
- periode analisis;
- metode/index yang digunakan;
- AOI;
- confidence atau quality indicator jika tersedia.

---

## 5. Target Users

### Primary User

Pengguna lokal Pulau Taliabu yang ingin memahami kondisi lingkungan sekitar pulau dan perubahan yang berkaitan dengan aktivitas pertambangan.

### Secondary Users

- komunitas lokal;
- peneliti;
- jurnalis data;
- pemerhati lingkungan;
- mahasiswa;
- organisasi masyarakat;
- pengguna GIS non-spesialis.

---

## 6. Scope

### 6.1 Geographic Scope

MVP dan versi awal hanya mencakup:

**Pulau Taliabu, Maluku Utara, Indonesia**

Sistem tetap dirancang agar secara teknis dapat mendukung AOI lain di masa depan, tetapi generalisasi multi-region bukan prioritas awal.

### 6.2 Temporal Scope

Target awal:
- histori Sentinel-2 yang tersedia;
- histori Sentinel-1 yang relevan;
- komparasi bulanan;
- komparasi tahunan;
- custom date range jika data tersedia.

---

## 7. Main User Experience

Aplikasi terdiri dari satu halaman.

Struktur utama:

```text
+--------------------------------------------------------------------------------+
| Taliabu Environmental Monitor        Latest Acquisition      Compare   Export   |
+----------------+-----------------------------------------------+---------------+
| Layers         |                                               | Inspector     |
|                |                                               |               |
| Satellite      |                                               | Selected AOI  |
| Environment    |                 INTERACTIVE MAP               | Metrics       |
| Mining         |                                               | History       |
| Hydrology      |                                               | Metadata      |
| Coastal        |                                               |               |
+----------------+-----------------------------------------------+---------------+
| Timeline / Date Selector / Before-After / Timelapse                            |
+--------------------------------------------------------------------------------+
| Environmental Metrics / Trend / Alerts                                         |
+--------------------------------------------------------------------------------+
```

---

## 8. Core Features

## 8.1 Interactive Map

Map engine:
- MapLibre GL JS.

Capabilities:
- pan;
- zoom;
- layer toggling;
- opacity control;
- legend;
- geolocation when explicitly permitted by user;
- inspect point;
- inspect polygon;
- draw AOI;
- reset to Taliabu extent.

Acceptance criteria:
- initial map loads centered on Pulau Taliabu;
- map remains usable on desktop and mobile;
- layer switching does not require page reload.

---

## 8.2 Basemap

Default basemap:
- OpenFreeMap/OpenStreetMap-compatible vector basemap.

Additional display modes:
- light basemap;
- satellite-only mode;
- minimal labels mode.

---

## 8.3 Sentinel-2 True Color

Display recent usable Sentinel-2 imagery.

Requirements:
- show acquisition date;
- show cloud cover where available;
- support opacity;
- support switching between available scenes;
- exclude or de-prioritize imagery with excessive cloud coverage;
- expose source metadata.

---

## 8.4 Sentinel-2 False Color

Provide false-color visualization to make vegetation and land-cover differences easier to inspect.

Must support:
- vegetation-oriented false color;
- configurable legend;
- acquisition metadata.

---

## 8.5 Sentinel-1 SAR

Provide SAR imagery for periods where optical imagery is obstructed by clouds.

Use cases:
- cloudy-season monitoring;
- surface-change comparison;
- supplementary validation of changes.

The UI must clearly distinguish SAR imagery from optical imagery.

---

## 8.6 Vegetation Monitoring

Primary index:
- NDVI.

Features:
- NDVI layer;
- vegetation classification;
- vegetation-loss detection;
- trend over selected period;
- area calculation in hectares.

Metrics:
- current vegetation area;
- estimated vegetation loss;
- estimated vegetation gain;
- percent change.

---

## 8.7 Bare Land / Mining Footprint

Provide a layer representing exposed/bare land and potential mining-related surface disturbance.

Inputs may include:
- spectral indices;
- temporal change;
- vegetation removal;
- known mining-area overlays.

Results must be labeled as:
- exposed land;
- detected surface disturbance;
- potential mining footprint.

The application must not automatically label detected changes as illegal mining.

---

## 8.8 Mining Permit Overlay

Display available mining permit/concession boundaries obtained from public government geospatial sources such as ESDM/MOMI where legally and technically available.

Features:
- polygon overlay;
- company/name metadata where available;
- permit metadata where available;
- toggle layer;
- inspect polygon;
- compare surface-change polygons against permit boundaries.

Possible classifications:
- change inside known permit boundary;
- change outside known permit boundary;
- unknown / insufficient permit data.

---

## 8.9 Rivers and Hydrology

Display:
- rivers;
- streams where data is available;
- watershed/catchment boundaries;
- drainage direction or downstream relationship.

Features:
- nearest river distance;
- watershed lookup;
- downstream path context;
- relationship between detected land change and hydrological network.

---

## 8.10 Terrain

Terrain-related data:
- elevation;
- slope;
- optionally hillshade.

Terrain data is primarily static and should be preprocessed before deployment.

Use cases:
- understand runoff direction;
- identify steep disturbed terrain;
- contextualize erosion risk.

---

## 8.11 Water Monitoring

Indices:
- NDWI;
- MNDWI where useful.

Features:
- water-body detection;
- water-area change;
- coastal water visualization;
- temporal comparison.

---

## 8.12 Sediment / Turbidity Proxy

Provide a visual indicator for changes in water reflectance that may correlate with suspended sediment or turbidity.

Requirements:
- must be labeled as a proxy/anomaly;
- must not be presented as laboratory-confirmed pollution;
- allow before/after comparison;
- show relationship with nearby river outlets and mining areas.

---

## 8.13 Coastline Monitoring

Features:
- baseline coastline;
- extracted coastline for selected observation if feasible;
- coastline comparison;
- highlight significant shoreline movement;
- calculate changed area or approximate displacement.

---

## 8.14 Change Detection

Central product capability.

Modes:
- date A vs date B;
- month vs month;
- year vs year;
- latest vs historical baseline.

Visualization modes:
- swipe;
- split screen;
- blink;
- difference overlay;
- change polygons.

Categories:
- vegetation loss;
- new bare land;
- water change;
- coastline change;
- surface disturbance.

---

## 8.15 Timeline

Bottom timeline provides:
- available satellite acquisition dates;
- cloud quality indicator;
- current selected date;
- comparison date;
- shortcuts for 1 month, 6 months, 1 year, and custom periods.

---

## 8.16 AOI Drawing

Users can:
- draw polygon;
- select existing feature;
- clear AOI.

For selected AOI calculate:
- area;
- vegetation coverage;
- vegetation change;
- bare land;
- water;
- distance to river;
- intersection with mining boundaries;
- temporal changes.

Client-side spatial operations should use Turf.js where practical.

---

## 8.17 Inspector

Clicking a location or feature opens an inspector panel.

Inspector may show:
- coordinates;
- administrative location;
- acquisition date;
- NDVI;
- water index;
- current land classification;
- mining-boundary intersection;
- nearest river;
- watershed;
- recent changes;
- source metadata.

---

## 8.18 Mining Impact Mode

Provide one-click preset named:

**Mining Impact**

It automatically enables:
- latest satellite imagery;
- mining permit boundary;
- detected surface disturbance;
- vegetation loss;
- rivers;
- watershed;
- coastline;
- sediment/turbidity proxy;
- settlements if available.

Goal:
make relationships between mining activity and environmental context visible immediately.

---

## 8.19 Analytics Panel

Display summary metrics for:
- entire Pulau Taliabu;
- current viewport;
- selected AOI;
- selected mining area.

Metrics may include:
- vegetation area;
- vegetation-loss area;
- exposed-land area;
- water-area change;
- detected-change area;
- coastline change;
- number of detected change zones.

---

## 8.20 Environmental Alerts

System can produce event records such as:
- significant new bare land;
- vegetation loss above configured threshold;
- surface change near river;
- change inside coastal buffer;
- change outside known permit boundary;
- new water/sediment anomaly.

Alerts are evidence markers, not legal findings.

---

## 8.21 Export

Support:
- PNG map snapshot;
- GeoJSON for derived vector features;
- CSV for statistics;
- JSON metadata;
- shareable URL with map state when feasible.

Snapshot should include:
- observation date;
- source;
- active layers;
- bounding area;
- generated timestamp.

---

## 9. Data Sources

Primary planned sources:

### Copernicus Data Space

Use for:
- Sentinel-2;
- Sentinel-1;
- STAC discovery;
- Sentinel Hub processing;
- Statistical API;
- openEO for heavier temporal analysis.

### Government Geospatial Data

Potential sources:
- ESDM/MOMI for mining-related spatial data;
- BIG/Ina-Geoportal;
- DEMNAS;
- public administrative boundaries;
- hydrological datasets where permitted.

### OpenStreetMap / OpenFreeMap

Use for:
- roads;
- settlements;
- labels;
- general basemap context.

All source licenses and redistribution constraints must be reviewed before bundling derived/static datasets.

---

## 10. Processing Strategy

Processing is divided into three levels.

### Level 1 — Browser

Technology:
- Turf.js;
- MapLibre.

Operations:
- area;
- distance;
- point-in-polygon;
- simple intersection;
- AOI drawing;
- viewport calculations.

### Level 2 — Sentinel Hub

Operations:
- true color;
- false color;
- NDVI;
- NDWI;
- MNDWI;
- bare-soil visualization;
- cloud masking;
- selected multi-date visualization;
- statistics where supported.

### Level 3 — openEO

Operations:
- temporal composites;
- long-term vegetation trends;
- change detection;
- multi-scene aggregation;
- larger temporal analysis.

Cloudflare Workers must orchestrate processing, not perform large raster processing directly.

---

## 11. Non-Goals

Initial versions will not:
- provide real-time video satellite imagery;
- identify individual vehicles or equipment;
- provide chemical water-quality measurements;
- claim environmental-law violations automatically;
- replace field surveys;
- replace laboratory testing;
- guarantee sub-meter imagery;
- host a full GIS desktop-equivalent workflow;
- support arbitrary global locations in MVP.

---

## 12. Functional Requirements

### FR-001
The system shall open directly to Pulau Taliabu.

### FR-002
The user shall be able to select available Sentinel observations.

### FR-003
The system shall expose imagery acquisition metadata.

### FR-004
The user shall be able to toggle environmental and mining layers independently.

### FR-005
The system shall provide before/after comparison.

### FR-006
The user shall be able to draw an AOI and receive calculated statistics.

### FR-007
The system shall provide vegetation monitoring.

### FR-008
The system shall provide water monitoring.

### FR-009
The system shall provide bare-land/surface-disturbance monitoring.

### FR-010
The system shall provide mining-boundary overlays when public data is available.

### FR-011
The system shall provide river/watershed context.

### FR-012
The system shall provide coastline context and comparison.

### FR-013
The system shall show data quality, acquisition date, and source for derived analysis.

### FR-014
The system shall support export of selected evidence and metrics.

### FR-015
The system shall preserve current map state in a shareable representation where feasible.

---

## 13. Non-Functional Requirements

### Performance

Target:
- initial UI shell loads quickly on typical Indonesian broadband/mobile connection;
- basemap interaction remains smooth;
- static layers are cached aggressively;
- expensive satellite requests execute only when needed.

### Reliability

- external API failures must not break the entire map;
- each remote layer has explicit loading/error state;
- cached metadata may be used when external discovery service is unavailable.

### Cost

Architecture must target zero infrastructure cost under normal personal/community usage.

No required dependency may assume:
- paid VPS;
- paid container runtime;
- paid PostGIS;
- commercial satellite imagery;
- paid map tiles.

### Security

- Copernicus credentials must not be exposed to browser code if credentials are required;
- secrets are stored in Cloudflare Worker secrets;
- API endpoints validate inputs;
- AOI payload size is limited;
- outbound requests are restricted to expected providers.

### Accessibility

- keyboard-accessible controls;
- readable map legends;
- labels not dependent on color alone;
- responsive layout.

---

## 14. Data Quality Requirements

Every dynamic analysis should preserve:
- satellite/platform;
- product type;
- acquisition datetime;
- cloud cover where relevant;
- processing method;
- source endpoint/service;
- analysis period;
- AOI;
- generated timestamp.

Every derived result should expose a quality note.

Example:

```json
{
  "source": "Sentinel-2 L2A",
  "acquiredAt": "2026-09-09T02:18:00Z",
  "cloudCover": 7.2,
  "analysis": "NDVI change",
  "comparisonStart": "2026-08-01",
  "comparisonEnd": "2026-09-09",
  "quality": "medium"
}
```

---

## 15. Success Metrics

Product success is primarily usefulness, not traffic.

Suggested indicators:
- user can identify latest usable observation without leaving the app;
- user can compare two periods in under 30 seconds;
- user can inspect a detected change and understand its spatial relationship to mining, river, watershed, and coastline;
- every displayed environmental change can be traced to source date and method;
- normal operation remains within free-tier limits.

---

## 16. Suggested Delivery Phases

### Phase 1 — Map Foundation

Deliver:
- Vue application;
- MapLibre;
- Taliabu boundary;
- basemap;
- static reference layers;
- responsive one-page layout.

### Phase 2 — Satellite

Deliver:
- Copernicus authentication/server integration;
- STAC scene discovery;
- Sentinel-2 true color;
- cloud metadata;
- timeline.

### Phase 3 — Environmental Layers

Deliver:
- NDVI;
- NDWI/MNDWI;
- false color;
- bare-soil visualization;
- Sentinel-1 view.

### Phase 4 — Mining Context

Deliver:
- mining-boundary data;
- inspector;
- surface-change overlay;
- Mining Impact mode.

### Phase 5 — Change Detection

Deliver:
- before/after;
- swipe;
- change polygons;
- statistics.

### Phase 6 — Hydrology and Coastal

Deliver:
- rivers;
- watershed;
- terrain;
- coastline;
- sediment/turbidity proxy.

### Phase 7 — Evidence and Monitoring

Deliver:
- environmental alerts;
- snapshots;
- CSV/GeoJSON export;
- saved analysis metadata;
- scheduled discovery of new usable scenes.

---

## 17. Definition of Done

The first complete release is considered done when a user can:

1. open one URL and immediately see Pulau Taliabu;
2. select a recent usable Sentinel observation;
3. view true-color and environmental-index layers;
4. inspect mining boundaries and detected land changes;
5. compare two periods;
6. inspect vegetation, water, bare land, river, watershed, and coastal context;
7. draw an AOI and obtain statistics;
8. export an evidence snapshot or structured result;
9. understand the source and date of every dynamic observation;
10. use the application without requiring paid infrastructure.
