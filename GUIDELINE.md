# Taliabu Environmental Monitor Guide

This guide explains how to use the map, choose layers, read metrics, compare scenes, review alerts, and preserve evidence. It also describes the data sources, calculations, assumptions, and limits behind the results. Its heading structure becomes the navigation in the Guide panel.

## Start with the map

The map is the main workspace. Use the basemap to understand the area, then enable the layers needed to answer the analysis question.

### Map navigation

- Use zoom and pan to move around the area.
- Click a map feature to view its details in the Inspector.
- Use **Draw AOI** to outline the area you want to analyze.

### Map controls

- Use **+** and **-** to change zoom.
- Use **Reset to Taliabu extent** to return to the default map view.
- Use **Locate me** when the browser can provide your location.
- Use the attribution control to show or hide map attribution.

## Observation workflow

Use the application to screen a place, compare observations, and decide what needs closer review. It does not independently confirm an event, its cause, or its legal status.

### Start with an observation question

Write the question before choosing a layer or metric. Keep it tied to something the application can observe:

- **Surface change**: Where did vegetation loss or new bare land appear between two comparison windows?
- **Mining context**: Is the detected change inside or outside a known IUP, and what reference data is available for that location?
- **Hydrology**: Is the change near a mapped river, within a watershed, or connected to a modelled downstream outlet?
- **Coastal or water context**: Is there a visible water-area, shoreline, or turbidity-proxy pattern near a river outlet or the coast?
- **Time and evidence**: Does the pattern remain visible in source imagery and another usable date pair?

Questions such as “Is this activity illegal?”, “What caused the change?”, or “Is the water polluted?” require records, field evidence, or measurements outside this application.

### Select the observation scope

Choose the smallest scope that answers the question:

1. Use **Viewport** for a quick visual scan of the current map view.
2. Draw an **AOI** for a repeatable observation tied to a specific polygon.
3. Use **Permit** to inspect the selected permit feature and its surrounding context.
4. Use **Island** for broad background, not for judging a small site.

Keep the same scope when comparing dates. A Viewport can change when you pan or zoom, while an AOI remains tied to the polygon you drew.

### Inspect the place before reading metrics

1. Start with **Satellite** or **Vector** basemap context.
2. Turn on only the layers related to the question.
3. Check nearby rivers, coastline, settlements, terrain, permits, and watershed boundaries when they provide relevant context.
4. Open the Inspector for the feature or AOI and note its area, location, and available reference metadata.

The reference layers provide spatial context. A mapped feature can be incomplete or outdated, and proximity does not establish a cause.

### Match the observation to the product question

Use the following paths for the main questions in this application:

#### New surface disturbance

1. Draw an AOI around the suspected area.
2. Compare an earlier and later period with **Vegetation loss** or **New bare land**.
3. Inspect the highlighted pixels in true color, false color, vegetation, and bare-soil views.
4. Check the known IUP boundary, nearest river, watershed, slope, and settlement context.
5. Record the changed area and quality indicator as screening evidence, not as a measured mine footprint.

#### Relationship to mining areas

1. Select or draw the area of interest.
2. Turn on **Mining** or **Mining Impact** layers.
3. Compare the detected change with the known IUP polygons.
4. Read **inside known IUP**, **outside known IUP**, or missing context as a spatial relationship only.
5. Check permit metadata and its retrieval information before reporting the result.

An area outside the known IUP layer means there was no intersection with the permit data available to the application. It does not prove that no permit exists or that the activity is illegal.

#### River, watershed, and downstream context

1. Turn on rivers, watershed, terrain, and river-outlet layers.
2. Use the Inspector to check nearest-river distance, watershed, slope, and downstream outlet when available.
3. Compare the location of the detected change with the modelled drainage context.
4. Use the result to decide where downstream imagery or field checks may be useful.

The downstream path is a modelled orientation aid. It does not prove that sediment, pollution, or any other material travelled from the changed area.

#### Coastal or water pattern

1. Compare the selected water or coastline layers for two usable periods.
2. Use **Water change** for pixels crossing the MNDWI threshold.
3. Use the scene water edge and baseline coastline to inspect shoreline context.
4. Use **Turbidity (NDTI)** near river outlets or the coast only as a sediment or water-reflectance proxy.
5. Check rainfall, tide, cloud masking, source imagery, and another date pair when available.

These layers can show a spatial pattern that deserves review. They cannot establish water chemistry, pollution, discharge, or the cause of a shoreline change.

### Measure the selected scope

Run Land Cover for the selected date and scope. Record vegetation, bare / sparse, water, scope area, and cloud-free coverage. Read the values as threshold-based pixel estimates for that date window, not as a field inventory.

If the question is about change, use Change Detection instead of comparing two unrelated Land Cover screenshots:

1. Draw or reuse the AOI.
2. Choose **Vegetation loss**, **New bare land**, or **Water change**.
3. Set the earlier and later dates.
4. Run the analysis.
5. Record the method, changed area, date windows, cloud-free coverage, and source.

### Check the evidence before making a statement

Review the highlighted pixels against true-color, false-color, and relevant reference layers. Then check whether the result is broad and consistent or isolated and close to the raster resolution. Repeat important observations with another usable date pair when possible.

Use wording that matches the evidence:

> The selected AOI contains pixels that meet the vegetation-loss rule between the two comparison windows.

Avoid wording that claims more than the application measured:

> The application proved illegal mining occurred.

The first sentence describes an index result. The second claims cause and legal status that the application cannot establish.

### Record the observation

For a useful record, keep the AOI or map location, scope type, observation question, active layers, date or date pair, method, metric values, cloud-free coverage, source, export, and notes about what remains uncertain. Save an alert only when the result meets the configured alert rule and the evidence has been reviewed.

## Layers

The Layers panel controls the basemap and reference layers. Each layer has a category and visibility state. Raster layers may also have an opacity control.

### Basemaps

Choose **Vector** for boundaries and labels, **Satellite** for imagery, or **Minimal** when thematic layers need to remain the focus.

### Thematic layers

Enable only the layers that help answer the current question. Category colors are consistent across environment, mining, hydrology, coastal, terrain, and satellite layers.

### Layer opacity slider

The layer opacity slider changes how strongly a visible overlay appears on the map. It is a visual comparison control, not an analysis control.

1. Turn a layer on.
2. Click the layer name to open its description and legend.
3. Move the **opacity** slider to compare the layer with the basemap and other visible layers.
4. Read the percentage beside the slider as display opacity, from `0%` transparent to `100%` fully visible.

The slider does not change Land Cover, Change Detection, Alert thresholds, cloud-free coverage, area calculations, or exported metric values. A layer can look faint while still being active in the map, and changing its opacity does not rerun an analysis.

Use opacity according to the question:

- **Satellite imagery**: lower an overlay to see the surface below it; increase it when the thematic pattern is the main subject.
- **NDVI or another index**: lower the index to compare its pattern with true-color imagery; increase it to inspect the spatial continuity of the index signal.
- **Permit boundaries**: lower the fill when checking the surface inside an IUP; increase the boundary when checking whether a detected pattern crosses the permit edge.
- **Rivers and watershed boundaries**: lower fills and lines when locating a change; increase them when checking river distance or the catchment containing the AOI.
- **Coastline and scene water edge**: lower one line at a time when comparing a baseline with the selected scene; do not treat line overlap alone as measured shoreline change.
- **Turbidity or other raster proxies**: lower the proxy to keep the river outlet or coastline visible; increase it only after checking the source imagery and legend.
- **Settlement and terrain layers**: lower the context layer when inspecting the change itself; increase it when checking proximity or landscape setting.

Do not use opacity to make a weak pattern look stronger. When a result is difficult to see, check the layer legend, scene date, cloud-free coverage, and source imagery before changing the interpretation.

### Layer groups

- **Environment** includes scene classification and vegetation or water indices. NDVI is a vegetation proxy. NDWI and MNDWI are water-related proxies.
- **Mining** includes permit boundaries. Use them as spatial context when reviewing change, not as proof of activity or compliance.
- **Hydrology** includes rivers, watershed boundaries, and derived drainage or catchment layers.
- **Coastal** includes the coastline, scene water edge, turbidity proxy, and river outlets.
- **Terrain** includes settlements, settlement areas, elevation, and slope.
- **Satellite** includes optical scene imagery and SAR availability. SAR can help provide context when optical imagery is affected by cloud.

### Mining Impact mode

Mining Impact mode is a map preset for reviewing possible surface change in relation to mining and environmental context. It switches to the satellite basemap and turns on only these layers:

- **Permit boundaries**: known IUP polygons from BIG Kebijakan Satu Peta records.
- **NDVI**: scene-derived vegetation index for viewing vegetation patterns.
- **Rivers & watershed**: mapped river lines used for spatial context and nearest-river analysis.
- **Watershed boundaries**: catchment context for the visible area.
- **Coastline**: baseline coastline used for coastal context and distance analysis.
- **Settlement areas**: settlement context around a possible change.

The mode does not calculate a mining-impact score, identify a mine automatically, run Change Detection, or create an alert. It only changes the basemap and layer visibility so the relevant context is visible together.

### How to read Mining Impact mode

Use the mode in this order:

1. Look at the satellite basemap for visible exposed ground, vegetation patterns, roads, water, or other surface context.
2. Compare the visible pattern with the NDVI layer. A low-vegetation pattern is a screening signal, not a confirmed mining footprint.
3. Check whether the pattern overlaps a known permit boundary. Read the boundary as a comparison with available permit data, not as proof of current activity or authorization.
4. Check the nearest river, watershed, coastline, and settlement layers. These show which environmental or community features may deserve closer review.
5. Draw an AOI around the specific pattern and run Land Cover or Change Detection. The mode itself is not the analysis result.
6. Record the imagery date, scope, metric, cloud-free coverage, source, and relevant context before reporting the observation.

For example, this is an appropriate reading:

> A low-vegetation pattern is visible in the selected scene inside a known IUP and near a mapped river. Further AOI analysis is needed to test whether the pattern changed between usable observation windows.

This is not supported by the mode alone:

> Mining Impact mode proves that illegal mining is occurring and polluting the river.

The first statement separates what the map shows from what still needs analysis. The second claims activity, legality, and pollution that this preset cannot establish. Turning the mode off restores each layer's default visibility, not necessarily the custom visibility state from before activation.

### What to read first in Mining Impact mode

Read the active map layers in this order. Each layer answers a different context question:

1. **Satellite basemap**: read the visible surface pattern: vegetation, exposed ground, roads, water, or settlement areas. It does not establish the cause or date of the pattern.
2. **NDVI**: read where vegetation appears stronger or weaker in the selected scene. It does not prove forest quality, clearing, or mining by itself.
3. **Permit boundaries**: read whether the visible pattern overlaps a known IUP polygon. It does not prove that mining is active, permitted, illegal, or responsible for the pattern.
4. **Rivers and watershed**: read whether the pattern is near a mapped river and which watershed contains it. It does not prove that material or pollution travelled through the river.
5. **Coastline**: read whether the pattern is near the baseline coast. It does not prove shoreline change, erosion, discharge, or coastal impact.
6. **Settlement areas**: read whether the pattern is near a mapped settlement area. It does not prove actual exposure, impact on residents, or community harm.

The practical reading is a relationship, not a verdict. For example: **a low-vegetation pattern is visible on the selected scene, overlaps a known IUP, and lies near a mapped river within one watershed**. That observation tells you where to draw an AOI and what to investigate next. It does not say that mining caused the pattern or that the river was affected.

After reading these layers, use the Inspector to draw an AOI and check area, permit overlap, nearest river, watershed, distance to coast, settlement distance, slope, and downstream outlet when available. Then run Change Detection to test whether the suspected pattern changed between two observation windows. The Inspector metrics and change result are the evidence to read next; the preset layers only provide the spatial context.

### Using the slider in Mining Impact mode

Mining Impact mode turns on the relevant context layers, but it does not choose the best opacity for every observation. Use the slider to expose the relationship you are checking:

- Lower **NDVI** when comparing a vegetation pattern with the satellite basemap.
- Lower **Permit boundaries** when checking the surface inside a permit, then raise the boundary to inspect the permit edge.
- Lower **Rivers and watershed boundaries** when locating a disturbance, then raise them to check its environmental context.
- Lower **Coastline** or **Settlement areas** when they cover the pattern you are inspecting.

The visible strength of a color or boundary is not a metric value. Record the layer name and scene date, not the slider percentage, as part of the observation evidence. The slider percentage may help someone reproduce the screenshot, but it does not change the result.

## Inspector

The Inspector shows details for the selected feature or area. For an AOI, run the land-cover analysis and check the source, scene date, cloud coverage, and permit context.

### Quick Stats

Quick Stats summarizes the current map view. It shows the active layers and visible features when those values are available. It is a view summary, not an AOI measurement.

### AOI analysis

1. Draw an AOI on the map.
2. Wait for the area metrics to finish calculating.
3. Check vegetation, bare/sparse, water, scope area, and cloud-free values.
4. Use **Clear AOI** before creating a new area.

### Land cover metrics

The Land cover panel reports vegetation, bare or sparse land, water, total scope area, and cloud-free coverage. These are coarse satellite estimates from the selected date and scope. They are useful for screening and comparison, not for replacing a field survey or an official land-cover map.

The scope selector changes the area being summarized:

- **Island** analyzes the Taliabu island boundary.
- **Viewport** analyzes the current map view.
- **AOI** analyzes the polygon you drew.
- **Permit** analyzes the selected permit feature when one is selected.

Use the scope that matches the question. A viewport result changes when you pan or zoom, while an AOI result stays tied to the drawn polygon. The Permit option is available after selecting a mining permit feature.

### What the panel is measuring

The panel does not identify every land-cover class. It divides valid pixels into three broad groups:

- **Vegetation**: pixels with NDVI greater than `0.2`, unless the same pixel is first classified as water.
- **Bare / sparse**: valid pixels that are not water and have NDVI less than or equal to `0.2`.
- **Water**: pixels with MNDWI greater than `0.1`. Water is tested first, so a pixel that meets both thresholds is counted as water.

Bare / sparse is a residual group. It can include exposed soil, rock, sand, built surfaces, sparse vegetation, shadows, or other pixels with low NDVI. It is not a formal geological, settlement, or mining classification.

### Vegetation

Vegetation is estimated with the Normalized Difference Vegetation Index, or NDVI. The calculation uses Sentinel-2 L2A red reflectance from band B04 and near-infrared reflectance from band B08:

```text
NDVI = (B08 - B04) / (B08 + B04)
```

The application counts a valid pixel as vegetation when `NDVI > 0.2`. Higher NDVI generally indicates stronger green vegetation reflectance, but the value is affected by plant type, density, moisture, season, shadows, atmosphere, and pixel mixing.

A high vegetation area means that more of the analyzed pixel area passed this threshold on the selected satellite composite. It does not, by itself, prove intact forest, good ecological condition, legal land use, or the absence of mining.

### Bare / sparse

Bare / sparse is calculated after water and vegetation have been removed from the valid pixels. In code, it means:

```text
valid pixel AND MNDWI <= 0.1 AND NDVI <= 0.2
```

This category is intentionally broad. A high value can reflect exposed ground, roads, roofs, rock, sand, sparse vegetation, or shadows. Use the true-color, false-color, and bare-soil layers to inspect the map before interpreting a change in this value.

Do not read the value as the measured area of a mine, a cleared forest, or a landslide. Those interpretations require additional evidence and field verification.

### Water

Water is estimated with the Modified Normalized Difference Water Index, or MNDWI. The application uses Sentinel-2 green band B03 and short-wave infrared band B11:

```text
MNDWI = (B03 - B11) / (B03 + B11)
```

The application counts a valid pixel as water when `MNDWI > 0.1`. MNDWI can help separate open water from vegetation and some built or exposed surfaces, but it is sensitive to shallow or turbid water, wet ground, shoreline mixing, sun glint, and shadows.

Cloud shadows can resemble water in index imagery. The calculation masks the scene classes used for no-data, saturated pixels, cloud shadows, unclassified pixels, clouds, and cirrus, but the result can still contain classification uncertainty. Check the source imagery and cloud-free percentage before treating a water change as real.

### Scope area

Scope area is the area of the raster pixels inside the selected scope mask. The application requests a 512 by 512 image covering the scope bounding box, rasterizes the scope into that grid, and estimates pixel width and height from the bounding-box coordinates and latitude. It converts pixel counts to hectares:

```text
area in hectares = pixel count × pixel width × pixel height / 10,000
```

Because the scope boundary is rasterized, the result is an estimate. Small polygons, narrow coastlines, and complex boundaries can have a larger boundary error than broad areas.

The displayed **Scope area** is not necessarily the exact geodesic area of the original polygon. For an AOI, the Inspector's **Area** value is calculated separately from the polygon geometry and is the better reference for the drawn polygon's geometric area.

### Cloud-free coverage

Cloud-free is the proportion of pixels inside the scope that contain valid values in both the NDVI and MNDWI renders:

```text
cloud-free coverage = valid pixels / pixels inside the scope mask
```

The render request uses a Sentinel-2 L2A time window ending on the selected date. The window covers the selected date and the previous nine days, with a maximum provider cloud-cover filter of 20 percent. Therefore, the metric is not necessarily calculated from one instantaneous image. It is a satellite render assembled from the available data in that request window.

Cloud-free coverage is a quality indicator, not a statistical confidence interval. For example, `80% cloud-free` means 80% of the scope pixels passed the data mask for both indices. It does not mean the result is 80% accurate.

### Why percentages may not add up to 100%

The UI calculates each displayed percentage using the full scope area as the denominator:

```text
category percentage = category area / scope area × 100
```

The category areas count only valid pixels, while the scope area includes all pixels inside the scope, including pixels rejected by the data mask. When cloud-free coverage is below 100 percent, vegetation, bare / sparse, and water percentages can therefore add up to less than 100 percent. The missing portion is not automatically another land-cover class; it is usually masked or unavailable imagery.

### How to read the result

Use these values as a first-pass description of the selected scope and date:

- Compare vegetation, bare / sparse, and water only when the scopes, dates, and cloud-free coverage are comparable.
- Prefer a higher cloud-free percentage before making a visual comparison.
- Inspect the source imagery when a result changes sharply.
- Use AOI for a fixed place and Viewport for a quick view of what is currently on screen.
- Use Island for broad context, not for conclusions about a small site.
- Treat small differences as uncertain when they are close to the raster resolution or when cloud-free coverage is low.

Use the layer opacity slider only to compare the metric's map pattern with the satellite basemap or reference layers. It does not change these values or make a low-coverage result more reliable.

### Example: reading a Land Cover result

The following is an illustrative result, not an observation from a real site:

```text
Scope: AOI
Vegetation: 62 ha (62%)
Bare / sparse: 18 ha (18%)
Water: 5 ha (5%)
Scope area: 100 ha
Cloud-free: 85%
```

Read it as follows: within the drawn AOI, the selected satellite composite classified about 62 hectares of valid pixels as vegetation, 18 hectares as bare or sparse, and 5 hectares as water. The remaining area is not automatically a fourth land-cover class. Because cloud-free coverage is 85%, some pixels were masked or unavailable. The result describes the selected date window and thresholds. It does not prove that the 18 hectares are a mine or that the 62 hectares are intact forest.

An appropriate report sentence would be: **The AOI contained approximately 62 ha classified as vegetation and 18 ha classified as bare or sparse in the selected satellite composite, with 85% cloud-free coverage.**

### What this metric cannot prove

Land Cover does not prove:

- forest quality, species composition, or biodiversity;
- legal or illegal land use;
- the exact boundary of a mine, clearing, settlement, or water body;
- soil type, water chemistry, sediment concentration, or pollution;
- a cause for the observed pattern;
- that a change happened on the selected date rather than during the render window.

Use the metric with the map layers, scene dates, change-detection evidence, official records, and field verification. The application labels it as a coarse satellite estimate because the result is derived from remotely sensed pixels, thresholds, masking, and a fixed output resolution.

### Change detection

Change detection compares two satellite renders over the AOI you drew. It marks pixels that pass a predefined rule and converts the number of marked pixels into an estimated area. It does not identify the cause of a change and it does not prove that a particular activity happened.

To run it:

1. Draw an AOI on the map.
2. Choose the change type in the Inspector.
3. Choose the earlier date in **From** and the later date in **To**.
4. Select **Run analysis**.
5. Read the changed area together with the method, dates, source, and cloud-free percentage.

The application swaps the dates if they are entered in reverse order, so the result still uses the earlier date as date A and the later date as date B.

### What the result means

The colored overlay shows pixels that passed the selected change rule. **Changed area** is the estimated total area of those pixels. It is not the area of a confirmed mine, clearing, flood, sediment plume, or other real-world event.

The Inspector labels the cloud-free percentage as **Confidence**. Read this as data coverage, not as model accuracy. It tells you how much of the AOI had valid values in both date renders. A high value does not guarantee that the change is real, and a low value makes the result less complete and harder to interpret.

### Vegetation loss

Vegetation loss uses the raw NDVI render for both dates. A pixel is marked when its NDVI drops by at least `0.15`:

```text
NDVI at date B - NDVI at date A <= -0.15
```

The rule detects a decrease in the index. It does not require the pixel to become bare land, and it does not require the pixel to cross the vegetation threshold of `0.2`. A forest pixel can therefore trigger vegetation loss even when its later NDVI is still above `0.2`.

Possible causes include clearing, harvest, fire damage, drought, seasonal change, flooding, shadow, atmospheric effects, or differences between the available satellite observations. Review the true-color and false-color imagery, scene quality, acquisition dates, and cloud mask before treating the result as environmental damage.

### New bare land

New bare land uses raw NDVI and looks for a specific transition:

```text
NDVI at date A >= 0.2 AND NDVI at date B < 0.2
```

The rule marks a pixel that was above the application's vegetation threshold at date A and below it at date B. It does not prove that the pixel became bare ground. The later low NDVI value can also come from water, shadow, seasonal vegetation change, cloud-related artifacts that passed the mask, or another surface condition.

Use the **Bare / sparse** Land Cover metric and the source imagery to add context. A new-bare-land result is an indication that the pixel crossed this index threshold, not a land survey.

### Water change

Water change uses raw MNDWI and the same water threshold as the Land Cover calculation, `0.1`. It marks either direction of crossing:

```text
water gain:  MNDWI at date A < 0.1 AND MNDWI at date B >= 0.1
water loss:  MNDWI at date A >= 0.1 AND MNDWI at date B < 0.1
```

The two directions use different overlay colors. The result indicates that the pixel moved across the water threshold. It does not measure water depth, water quality, flood depth, shoreline position, or the cause of the change.

Shallow water, turbid water, wet soil, shoreline mixing, sun glint, and shadows can affect MNDWI. Compare the result with the true-color imagery, Scene water edge, coastline baseline, rainfall or tide information when available, and field evidence.

### How the two dates are rendered

For each requested date, the application requests a raw NDVI or MNDWI image from the Copernicus Data Space Process API. The request covers the selected date and the previous nine days, so each date represents a ten-day render window rather than necessarily one instantaneous observation:

```text
from = selected date - 9 days
to   = selected date
```

The request uses Sentinel-2 L2A data and a provider maximum cloud-cover filter of 20 percent. The raw render encodes each index value into a pixel channel so the browser can decode it back to the range `-1` to `1`. The alpha channel carries the valid-data mask.

Because each date is a window, the comparison can reflect differences in the observations available within those windows. The date shown in the result is the requested end date, not a guarantee that every pixel was observed exactly on that day.

### Cloud and invalid-pixel masking

The raw render checks the Sentinel-2 Scene Classification Layer, or SCL. The application excludes these SCL classes from the valid mask:

- no data;
- saturated or defective pixels;
- cloud shadows;
- unclassified pixels;
- medium-probability clouds;
- high-probability clouds;
- cirrus.

A pixel is usable for change detection only when both date renders have valid alpha values. If either date is invalid, the pixel is excluded from both the changed-pixel count and the valid-pixel count.

The mask reduces obvious cloud and shadow errors, but it does not remove every source of uncertainty. A valid pixel can still be affected by haze, seasonal conditions, mixed land cover, water level, or differences in illumination.

### Change area calculation

The application uses the AOI bounding box as a 512 by 512 comparison grid. It rasterizes the AOI into that grid and counts only pixels inside the polygon. For every inside pixel that is valid in both dates, it applies the selected rule.

The displayed changed area is calculated as:

```text
changed area in hectares = changed pixel count × pixel width × pixel height / 10,000
```

Pixel width uses the longitude span adjusted by the cosine of the AOI midpoint latitude. Pixel height uses the latitude span. This is an estimate based on the bounding box and raster grid, not a geodesic calculation for every pixel.

Small AOIs, narrow features, complex boundaries, and long or irregular polygons can have more noticeable rasterization error. The result should be read as an approximate area, especially when only a small number of pixels changed.

### Cloud-free coverage in change detection

Change-detection coverage is calculated as:

```text
cloud-free coverage = pixels valid in both dates / pixels inside the AOI mask
```

The denominator is the number of raster pixels inside the AOI. The numerator requires valid data at both dates. A pixel that is clear on one date but cloudy on the other is not counted as valid for the comparison.

The analysis can return a result with low coverage, but the alert evaluator refuses to generate alerts when coverage is below `30%`. This prevents the alert system from treating a heavily masked result as actionable evidence. The change overlay itself should still be treated cautiously whenever coverage is low.

### How to interpret a change result

- Start with the method. Vegetation loss, new bare land, and water change answer different questions.
- Check date A and date B. Confirm that the period matches the question you are asking.
- Check cloud-free coverage for both dates together through the reported coverage value.
- Inspect the source imagery around the highlighted pixels.
- Compare the result with nearby rivers, coastline, permits, settlements, terrain, and other relevant layers.
- Repeat the analysis with a nearby pair of usable dates when the result is important.
- Treat a broad, consistent pattern as stronger screening evidence than one isolated pixel cluster.

Use opacity to inspect the highlighted change against the source imagery and context layers. A stronger overlay color only makes the pixels easier to see; it does not increase changed area, confidence, or evidence strength.

### Example: reading a Change Detection result

The following is an illustrative result, not an observation from a real site:

```text
Method: Vegetation loss
From: 2024-06-01
To: 2024-09-01
Changed area: 8.4 ha
Confidence: 78%
Source: Sentinel-2 L2A
```

Read **Changed area: 8.4 ha** as the estimated area of AOI pixels where the raw NDVI decreased by at least `0.15`. Read **Confidence: 78%** as the proportion of AOI pixels valid in both date renders, not as an accuracy score. The dates are the ends of ten-day render windows, not proof that the change happened exactly on either date.

An appropriate report sentence would be: **The analysis detected approximately 8.4 ha of pixels meeting the vegetation-loss rule between the selected comparison windows, with 78% valid coverage. The result needs review against source imagery and additional evidence.**

### What change detection cannot prove

Change detection cannot prove:

- that mining, logging, construction, flooding, or another specific activity caused the change;
- that the change occurred exactly on date B;
- that every highlighted pixel changed on the ground;
- the legal status of an activity or whether a permit condition was violated;
- the quality, chemistry, depth, or contamination of water;
- the exact boundary or volume of removed material;
- that an unhighlighted area did not change when it was masked or unavailable.

Use the result to decide where to look next. Confirm important findings with additional imagery, official records, local knowledge, and field verification.

## Timeline

The Timeline lists Sentinel-2 acquisitions that intersect the Taliabu search area. Select a scene to make its date active for the map layers and Land Cover metrics. The timeline is a scene browser, not a time-series chart of a measured environmental variable.

### Date shortcuts

The shortcuts change the acquisition search period:

- **Latest** searches the previous 30 days.
- **1 Month** searches the previous month.
- **6 Months** searches the previous six months.
- **1 Year** searches the previous year.

The search uses the current date as the end of the period. The list can change as new scenes arrive or as the provider updates its catalog.

### Scene quality and dates

Each timeline chip shows the acquisition date and the provider's cloud-cover value when one is available. The colored dot and chip style provide a quick quality cue:

- **Excellent**: cloud cover at or below 10 percent.
- **Good**: cloud cover above 10 percent and at or below 30 percent.
- **Cloudy**: cloud cover above 30 percent.
- **Partial**: cloud-cover metadata is not available.

These labels describe the STAC acquisition metadata, not the exact cloud-free percentage inside your selected AOI. The value displayed for a grouped acquisition is the lowest reported cloud-cover value among the tiles grouped for that acquisition. It should not be read as an island-wide average or as a guarantee that every part of Taliabu is clear.

The acquisition date is the date and time recorded by the scene catalog. It is different from the date when the provider indexed the scene and different from the date when the application rendered an analysis. Provider processing can delay when a new acquisition appears in the list.

Cloud cover and cloud-free coverage answer different questions:

- **Cloud cover** is provider metadata used when searching and labeling an acquisition.
- **Cloud-free coverage** is calculated for the requested raster and scope after the application applies its pixel mask.

Use the cloud-free value from the analysis result when judging whether a particular Land Cover or Change Detection result has enough usable pixels.

### How a scene becomes active

When you select a timeline scene, the application uses its acquisition date for the active map date and requests the corresponding imagery layers. Land Cover calculations use a ten-day render window ending on that date and apply a maximum provider cloud-cover filter of 20 percent. The active date therefore identifies the end of the analysis window; it does not guarantee that every displayed pixel came from one image captured on that date.

If no scene is selected, the Land Cover panel asks you to select a scene before it computes metrics. If the render service cannot return imagery for the selected date, the panel shows that metrics are unavailable for the scene.

### Compare scenes

Compare is a visual side-by-side review of two selected acquisitions. It does not calculate a change area and it does not apply the Land Cover or Change Detection thresholds.

Select a second scene from the Timeline, then choose a compare mode when available:

- **Swipe** compares two scenes with a movable divider.
- **Split** shows the scenes in separate map areas.

Both comparison maps move together so you can inspect the same location. The comparison uses a fixed imagery extent around Taliabu, shows a boundary overlay, and renders each selected acquisition as true-color imagery. It does not reproduce the currently enabled thematic layers from the main map.

The compare render requests the calendar date of each acquisition with no additional date window. The provider may still choose the available observation returned for that date. The two images can differ because of illumination, tide, haze, seasonal conditions, cloud, or the time between acquisitions.

Use Swipe when you want to inspect one location while revealing one date at a time. Use Split when you want both dates visible at once. After comparing, exit compare mode to return to the main map and its active layers.

### How to choose dates

- Choose dates far enough apart to match the process you want to observe, but not so far apart that seasonality dominates the comparison.
- Prefer dates with similar cloud quality and similar usable coverage over dates that are simply the newest.
- Use the acquisition timestamps and cloud metadata as screening information, then inspect the actual imagery.
- For a numeric change result, use Change Detection with an AOI. Compare mode alone is visual evidence.
- Do not compare a cloudy date with a clear date and call the visual difference environmental change.

## Alerts

Alerts are rule-based flags generated from a Change Detection result and the spatial context of the AOI. They help prioritize review. They are not automatic findings of illegal activity, environmental damage, or a legal violation.

An alert can be produced only after you:

1. Draw an AOI.
2. Run one of the supported Change Detection analyses.
3. Have enough valid coverage for the alert evaluator.
4. Meet the selected alert threshold or spatial rule.

The alert panel shows the rule, method, changed area, date window, cloud-free coverage, threshold, context, and source. Read these fields before saving an alert.

### Alert log

The Alert log stores saved monitoring events in the application's D1 database. Use the kind filter to narrow the list, then select a row to expand its evidence. Selecting an alert can focus its AOI on the map. Collapse it to clear the focus and restore the previous map view.

The list shows the alert kind, severity dot, changed area, and later date. The expanded evidence adds the exact method, cloud-free coverage, analysis window, threshold, spatial context, source, and generation date.

The application currently loads up to 50 recent entries in the panel. The server endpoint supports a larger limit, but the interface does not display an archive browser or a delete action. An empty log means that no saved entries were returned for the selected filter; it does not prove that no change has ever been detected.

### Alert coverage gate

The alert evaluator refuses to create any alert when Change Detection coverage is below `30%`:

```text
if cloud-free coverage < 30%: create no alert
```

This is a screening safeguard. It does not mean that a result at 30% is accurate or that a result at 29% is impossible. It means the application does not promote a heavily masked comparison into an alert. The underlying Change Detection result can still be inspected, but it needs stronger caution.

### Vegetation loss alert

This alert is evaluated only when the selected Change Detection type is **Vegetation loss**. The default threshold is `5 ha`:

```text
changed vegetation-loss area >= vegetation-loss threshold
```

You can change the threshold in the alert panel before saving. The threshold changes the alert decision, not the underlying Change Detection result or its marked pixels.

The alert kind is **Vegetation loss**. It uses the same NDVI drop rule described in Change Detection. It does not mean that the whole changed area was cleared or that vegetation loss was caused by mining.

### New bare land context alerts

These alerts are evaluated only when the selected Change Detection type is **New bare land**. The system combines the index threshold result with the AOI context calculated from static reference data.

The default distance threshold is `500 m`. The distance is calculated from the AOI centroid to the nearest known river or the baseline coastline, not from every changed pixel:

- **Change near river**: new-bare-land result and AOI centroid within 500 m of the nearest known river.
- **Change near coast**: new-bare-land result and AOI centroid within 500 m of the baseline coastline.
- **Change outside IUP**: new-bare-land result and the AOI does not intersect a known IUP polygon.

The distance threshold can be changed in the alert panel. The IUP rule has no numeric threshold; it depends on whether the selected AOI intersects a known permit polygon.

These rules describe spatial context, not causation. A change near a river is not necessarily river-related. A change outside a known IUP is not proof of illegal mining because the permit dataset may be incomplete, outdated, or unrelated to the activity being investigated.

### Water change and alerts

Water Change is available as a Change Detection method, but the current alert evaluator does not create an alert for it. It can still produce a visual result and an estimated changed area. Save it as supporting evidence through the export or record it separately if the observation matters.

### Severity

Alert severity is assigned from the changed area:

- **Medium**: changed area is below `25 ha`.
- **High**: changed area is `25 ha` or more.

Severity is a size-based display category. It is not a probability, a confidence score, a measure of harm, or a legal priority. A small change can still matter, and a large detected area can be caused by imagery conditions rather than a real-world event.

### Alert evidence fields

Each generated alert includes:

- **Rule**: the condition that caused the alert.
- **Method**: the Change Detection threshold used.
- **Metric**: `ndvi-raw` for vegetation-related analysis or `mndwi-raw` for water analysis.
- **Changed area**: estimated area of pixels that passed the rule.
- **Cloud-free**: pixels valid in both dates divided by pixels inside the AOI.
- **Window**: the earlier and later analysis dates.
- **Threshold**: the user-configured area or distance values at the time of analysis.
- **Context**: nearest river, coastline distance, and known permits when relevant.
- **Source**: Sentinel-2 L2A.
- **Generated**: the date the application created the evidence object, not the acquisition date.

Keep the evidence with any report or export. The generated date tells you when the application evaluated the result; it does not tell you when the environmental change happened.

### Saving and deduplication

Select **Save to alert log** to store the currently displayed alerts. The server writes the alert kind, severity, AOI, optional scene ID, evidence, and a deduplication fingerprint to D1.

Saving the same analysis again does not create another row. The fingerprint combines:

- alert kind;
- date A and date B;
- changed area rounded to one decimal hectare;
- analysis bounding box rounded to four decimal places;
- AOI coordinates rounded to five decimal places.

The generated timestamp is excluded, so rerunning the same analysis is treated as a duplicate. Small changes to the AOI, dates, result area, or bounding box can produce a new fingerprint and therefore a new entry.

Deduplication prevents repeated saves from inflating the log. It does not determine whether two alerts describe the same real-world event across different date windows.

### How to interpret an alert

- Treat an alert as a prompt to inspect evidence, not as a conclusion.
- Open the evidence and check the rule, dates, method, and cloud-free coverage.
- Review the highlighted change on the map and inspect the source imagery.
- Check whether the spatial context comes from a river, coastline, or known IUP dataset that matches the question.
- Compare with another usable date pair before escalating a finding.
- Confirm important findings with official records, local knowledge, and field verification.

If an alert is focused on the map, adjust nearby layer opacity to inspect its AOI against permits, rivers, coastline, settlements, or source imagery. The slider does not change the saved alert rule or evidence.

### Example: reading an Alert Log entry

The following is an illustrative alert entry, not a saved event from the application:

```text
Kind: Vegetation loss
Severity: Medium
Changed area: 8.4 ha
Window: 2024-06-01 to 2024-09-01
Cloud-free: 78%
Threshold: 5 ha
Source: Sentinel-2 L2A
```

Read this entry as: the vegetation-loss result crossed the configured `5 ha` area threshold, so the application saved it as a **Medium** alert because the changed area is below `25 ha`. The alert records a screening condition and its supporting evidence. It does not say that 8.4 hectares were definitely cleared, that mining caused the change, or that a legal violation occurred.

An appropriate report sentence would be: **The alert log contains a Medium vegetation-loss alert for approximately 8.4 ha between the selected comparison windows. The result passed the 5 ha alert threshold and had 78% valid coverage. It should be checked against the map, source imagery, records, and field evidence.**

## Export and evidence

The Inspector provides CSV, GeoJSON, JSON, and PNG exports. Read every export together with its source, method, period, AOI, and proxy disclaimer. An export records the current application state; it does not create a new measurement or improve the accuracy of the underlying data.

### CSV

CSV is a flat table of the metrics available in the current Inspector state. It can include:

- AOI area, permit overlap, nearest river, nearest settlement, coast distance, watershed, elevation, slope, and downstream distance;
- Change Detection changed area and cloud-free coverage;
- Land Cover vegetation, bare / sparse, water, scope area, cloud-free coverage, and raster resolution.

Each row has `metric`, `value`, `unit`, and an optional `note` column. The file contains only values available when you click export. For example, it may contain change metrics but no AOI context if no AOI analysis is available.

Use the unit column when importing the file into a spreadsheet. Hectares are abbreviated as `ha`, percentages as `%`, distances as `m` or `km`, slope as `deg`, and raster resolution as `m/px`. A CSV value is not meaningful without its analysis date, scope, source, and method, so keep the related JSON or a written record with it.

### GeoJSON

GeoJSON exports the current AOI polygon as one feature. Its properties include the observation date, optional comparison period, imagery source, active layer names, generation time, map attribution, and the proxy disclaimer. When available, it also includes AOI area, permits, permit overlap, nearest river, coast distance, watershed, and Change Detection context.

GeoJSON is useful when another GIS application needs the AOI geometry and its analysis context. The geometry is the drawn polygon, not a rasterized outline of the changed pixels. Change properties describe the current result, but the GeoJSON does not contain the full change overlay image.

### JSON

JSON is the most complete snapshot export. It can contain:

- export context and attribution;
- AOI coordinates and geometric area;
- Change Detection type, method, changed area, coverage, and bounding box;
- current generated alerts;
- current Land Cover result.

JSON is suitable for preserving a machine-readable monitoring snapshot. It still represents the state at export time. If the source imagery, static reference data, or calculation code changes later, rerunning the same analysis may produce a different result.

### PNG

PNG captures the visible map canvas after the next map repaint and adds an attribution bar beneath it. The screenshot includes the active layer visibility and opacity at capture time. The footer identifies the Taliabu Environmental Monitor, Sentinel-2 L2A when applicable, the observation date, and OpenFreeMap or OpenStreetMap attribution.

Before exporting PNG, set the slider so the pattern and its context are both readable. The slider affects this screenshot only. CSV, GeoJSON, and JSON metric values do not change when opacity changes.

PNG is a visual record. It does not contain the underlying pixel values, AOI geometry, threshold settings, cloud-free calculation, or full source metadata. Use CSV, GeoJSON, or JSON when another person needs to inspect or reproduce the analysis.

### Share link

**Copy share link** stores the current camera and AOI in URL parameters. The camera stores longitude, latitude, and zoom. AOI coordinates are rounded to five decimal places before encoding.

The share link does not store the selected scene, active layer visibility, basemap, comparison mode, thresholds, or generated alert. The recipient may therefore see a different scene or layer state when opening the link later. Treat it as a way to share location and AOI context, not as a permanent evidence package.

### Evidence checklist

When sharing an export, include:

- the export file;
- the acquisition date or comparison window;
- the selected scope or AOI;
- the Change Detection method or Land Cover scope;
- cloud cover and cloud-free coverage;
- the data source and retrieval date when available;
- any relevant reference layer, permit, river, or coastline context;
- the date when you generated the export.

## Data sources and refresh

The application combines live or provider-rendered satellite imagery with prepared reference datasets. These sources have different update schedules and different meanings. A layer's presence on the map does not mean that it was captured at the same time as the satellite scene.

### Satellite acquisition metadata

The application searches the [Microsoft Planetary Computer STAC](https://planetarycomputer.microsoft.com/) API for `sentinel-2-l2a` acquisition metadata over the Taliabu search bounding box. The results include acquisition time, cloud-cover metadata, scene identifier, tile count, and provider information. Successful scene searches are written to the D1 `satellite_scenes` table. If the provider search fails, the worker can return matching cached acquisitions.

The acquisition catalog is metadata. It tells the application which observations are available to search; it is not itself the Land Cover or Change Detection result.

### Satellite imagery processing

The application requests Sentinel-2 L2A imagery from the [Copernicus Data Space](https://dataspace.copernicus.eu/) Process API. It sends a bounding box, time range, cloud-cover limit, output size, and an evalscript for the requested layer. The evalscript selects the Sentinel-2 bands and index or composite:

- true color: B04, B03, B02;
- NDVI: B08 and B04;
- NDWI: B03 and B08;
- MNDWI: B03 and B11;
- false color: B08, B04, B03;
- SWIR composite: B12, B11, B04;
- SCL: Sentinel-2 Scene Classification Layer;
- SAR: Sentinel-1 VV and VH for the radar layer.

The application applies a scene-class mask to the layers that support masking. Raw NDVI and MNDWI renders use that mask for Land Cover and Change Detection. The output is a rendered PNG raster, not a downloaded original satellite archive.

### Reference layers

Reference layers are prepared GeoJSON or raster files served from the application. They provide spatial context and are not refreshed every time a user opens the map.

- **Taliabu and administrative boundaries**: [BIG boundary services](https://geoservices.big.go.id/gis/rest/services/DISIGT/BatasWilayah/FeatureServer/0).
- **Permit boundaries**: [BIG Kebijakan Satu Peta](https://kspservices.big.go.id/satupeta/rest/services/PUBLIK/PERIZINAN_DAN_PERTANAHAN/MapServer/4) mining permit records, represented as known IUP polygons.
- **Rivers**: [BIG Rupabumi Indonesia](https://geoservices.big.go.id/rbi/rest/services/BASEMAP/Rupabumi_Indonesia/MapServer/673) river network.
- **Watersheds**: [BIG Atlas Wilayah Sungai](https://geoservices.big.go.id/gis/rest/services/PTRA/Atlas_Wilayah_Sungai/MapServer/5) watershed boundaries.
- **Coastline**: BIG baseline coastline used for distance-to-coast context.
- **Settlement points and settlement areas**: prepared reference layers from [BIG Rupabumi Indonesia points](https://geoservices.big.go.id/rbi/rest/services/BASEMAP/Rupabumi_Indonesia/MapServer/97) and [area](https://geoservices.big.go.id/rbi/rest/services/BASEMAP/Rupabumi_Indonesia/MapServer/808) services. Coverage can be sparse, so missing settlement features do not prove that no settlement exists.
- **Elevation**: [DEMNAS data from BIG](https://geoservices.big.go.id/raster/rest/services/DEMNAS/DEM_Indonesia/ImageServer/exportImage), preprocessed into a static raster with EGM2008 vertical datum.
- **Slope**: derived from the DEMNAS elevation raster using a Horn 3×3 terrain operator.
- **Derived drainage and catchments**: generated from DEMNAS using a D8 flow model. They are model outputs for orientation, not surveyed hydrology or official watershed boundaries.
- **River outlets**: D8-derived stream mouths with modeled catchment and nearest-permit context.
- **Basemap**: [OpenFreeMap](https://openfreemap.org/) tiles with [OpenStreetMap](https://www.openstreetmap.org/) contributors attribution.

The layer Inspector can show source, version, retrieval date, and refresh policy for supported reference features. The metadata file records the source and notes used by the application. Raster indices such as NDVI, MNDWI, NDTI, and SCL are scene-derived products and should be read with the active scene date and source imagery.

### Refresh and cache behavior

Satellite acquisition searches use a write-through cache: successful results are saved to D1, and a matching cached result can be returned when the provider is unavailable. The rendered imagery endpoint sends a one-hour browser cache directive for analysis renders and a longer immutable cache for map tiles. A cached response can therefore outlive a provider catalog update.

Prepared reference layers follow their configured refresh policy. Some are manual snapshots, mining permits are marked for monthly refresh, and scene-derived satellite layers refresh per scene. Check the retrieval date and version when a reference layer matters to the decision.

The availability date of a scene is not the same as the moment it was captured. Provider processing can create a delay before a new scene appears in the search.

## Interpretation limits

This application is a monitoring and screening tool. It helps people find places and dates that deserve closer attention. It does not replace field measurements, official maps, permit documents, laboratory tests, community reports, or legal review.

### Limits of satellite observations

Satellite sensors measure reflected or returned energy, not the thing a person wants to know directly. The application converts those measurements into indices, masks, visual layers, or threshold results. Clouds, haze, shadows, sun angle, wet ground, water level, vegetation season, mixed pixels, and provider processing can affect the result.

One pixel can contain several surfaces. A pixel may include vegetation, exposed soil, a road, a roof, and shadow at the same time. The resulting index value represents the combined signal, not one perfectly identified object.

### Limits of resolution and area

The Land Cover and Change Detection calculations use a fixed 512 by 512 output grid over the requested scope bounding box. The displayed resolution is an approximate pixel size. A feature smaller than a pixel, or a feature that crosses several mixed pixels, may not be detected reliably.

The calculated area is an estimate from pixel counts and approximate pixel dimensions. It is not a cadastral survey, engineering measurement, or legal boundary. Small AOIs and narrow features are especially sensitive to rasterization and boundary error.

### Limits of classification

NDVI, MNDWI, NDWI, SCL, and the Land Cover groups are not complete land-cover maps. They are indices or diagnostic classifications designed for a specific screening purpose. A value or color should not be treated as a direct label such as forest, mine, pollution, settlement, or flood unless the application explicitly defines that result and the evidence supports it.

The **Bare / sparse** group is intentionally broad. It can include natural and built surfaces. A **Vegetation loss** result identifies an NDVI decrease, not the cause. A **Water change** result identifies a threshold crossing, not water depth or water quality.

### Limits of dates and causality

An acquisition date is not always the date of an event. Land Cover and Change Detection renders use time windows, and Compare uses provider imagery requested for a calendar date. A detected difference may have happened at any point between the observations or may reflect different observation conditions.

The application does not infer causality. It cannot determine from the satellite result alone whether a change came from mining, farming, logging, construction, fire, drought, flood, tide, erosion, or another process.

### Limits of reference data

Permit, river, coastline, watershed, settlement, elevation, and administrative layers are separate datasets with separate dates, scales, and update policies. A map overlay can be useful context without being an exact current boundary. Missing features in a reference layer do not prove that the real-world feature is absent.

An AOI outside the known IUP layer means that the AOI did not intersect the permit polygons available to this application. It does not prove that no permit exists or that an activity is illegal. A change near a river or coast does not prove that the river or coast caused the change.

### Limits of alerts

An alert is the output of a rule applied to an analysis result and reference context. Severity is a size-based category, not a risk score. Cloud-free coverage is data availability, not statistical confidence. A saved alert is a record that the rule was met, not a verified incident.

### Responsible interpretation

Use this order when reviewing a result:

1. Read the method and threshold.
2. Check the acquisition dates and render window.
3. Check cloud-free coverage and source imagery.
4. Compare the result with relevant map context.
5. Repeat with another suitable date or method when possible.
6. Confirm important findings with official records and field verification.

When reporting a result, use language that matches the evidence. Say **the analysis detected an NDVI decrease in this AOI during this comparison window**, not **the application proved illegal clearing**.

### Questions the application cannot answer alone

The application cannot answer these questions without additional evidence:

- Is an activity legal?
- Who caused the observed change?
- What material entered a river or coastal water?
- Is water safe for people, animals, or ecosystems?
- How much material was removed or deposited?
- What species or habitat was affected?
- Did a change happen on an exact day?
- Is a permit current, valid, or compliant with its conditions?

Use the application to support better questions and better site selection for follow-up work.

## Glossary

### Acquisition

A satellite observation recorded by the provider with a date and time. The acquisition metadata helps the application list and compare available scenes.

### AOI

**Area of Interest**. The polygon drawn by the user. Land Cover and Change Detection use the AOI as their analysis scope. The current AOI limit is 10,000 hectares, or 100 square kilometres.

### B03, B04, B08, B11, B12

Sentinel-2 spectral bands. B03 is green, B04 is red, B08 is near-infrared, and B11 and B12 are short-wave infrared bands. The application combines these bands to calculate indices and create visual composites.

### Basemap

The background map used for geographic orientation. Vector, Satellite, and Minimal are basemap choices. A basemap is not automatically an analysis layer.

### Bbox

**Bounding box**. A rectangle defined by west, south, east, and north coordinates. The application uses bounding boxes to request imagery and create raster grids. A bounding box can include area outside an irregular AOI, which is then removed by the AOI mask.

### Cloud cover

A provider-reported scene metadata value used to search and label acquisitions. It is not the same as the cloud-free percentage calculated inside a selected scope.

### Cloud-free coverage

The share of pixels inside the analysis scope that have valid values in the required imagery renders. It measures usable data coverage, not accuracy or confidence.

### DEMNAS

Indonesia's national digital elevation model distributed through BIG services. This application uses prepared DEMNAS-derived elevation, slope, drainage, catchment, and river-outlet context layers.

### D8 flow model

A terrain method that assigns each elevation cell's flow direction to one of its eight neighboring cells. The application uses it to derive drainage and catchment context. The output is a model, not a surveyed river network.

### GeoJSON

A geographic data format based on JSON. The application uses it for vector layers and AOI export. It can store points, lines, polygons, and their properties.

### IUP

**Izin Usaha Pertambangan**, or mining business permit. In this application, IUP refers to known permit polygons from the configured reference dataset. It is not a complete legal registry by itself.

### Index

A value calculated from spectral bands to emphasize a property such as vegetation or water. NDVI and MNDWI are indices. An index is a proxy, not a direct field measurement.

### Land Cover

The panel that groups valid pixels into Vegetation, Bare / sparse, and Water using NDVI and MNDWI thresholds. It is a broad satellite estimate, not a complete land-cover classification.

### L2A

Sentinel-2 Level-2A data. It is atmospherically corrected surface-reflectance data with scene classification information. The application requests this collection for optical imagery.

### MNDWI

**Modified Normalized Difference Water Index**. In this application it is calculated from B03 and B11 and used to identify water-related pixels and water threshold changes.

### NDVI

**Normalized Difference Vegetation Index**. In this application it is calculated from B08 and B04 and used to describe green vegetation and vegetation-related change.

### NDWI

**Normalized Difference Water Index**. In this application it is a visual water-related index using B03 and B08. Land Cover and Change Detection use MNDWI instead.

### NDTI

**Normalized Difference Turbidity Index**. This visual layer uses red and green bands as a proxy for relative water turbidity. It does not identify a pollutant or measure water chemistry.

### Pixel

One cell in a raster image. A pixel represents an area on the ground, not a single object. The ground area represented by a pixel depends on the requested output extent and image dimensions.

### Proxy

An indirect indicator used when the application cannot measure the target directly. NDVI can act as a vegetation proxy; NDTI can act as a turbidity proxy. A proxy needs context and validation before supporting a strong conclusion.

### Raster

An image made of pixels, such as an index layer, satellite image, elevation raster, or slope raster.

### Resolution

The approximate ground size represented by one output pixel. The Land Cover and Change Detection panels show an approximate metres-per-pixel value for the requested raster grid.

### SCL

**Scene Classification Layer** from Sentinel-2 processing. It labels pixels such as vegetation, water, cloud shadow, cloud, cirrus, and no data. The application uses selected SCL classes to mask invalid pixels.

### STAC

**SpatioTemporal Asset Catalog**. A standard way to search geospatial assets by location, date, collection, and metadata such as cloud cover. The application uses a STAC API for acquisition metadata.

### Scope

The geographic area summarized by Land Cover. It can be Taliabu island, the current viewport, the drawn AOI, or a selected permit.

### Threshold

A rule boundary used to classify or flag a result. Examples include NDVI greater than `0.2`, MNDWI greater than `0.1`, or vegetation loss of at least `5 ha` for an alert.

### Vector

Geographic features represented by coordinates and geometry, such as a river line, permit polygon, settlement point, or AOI.
