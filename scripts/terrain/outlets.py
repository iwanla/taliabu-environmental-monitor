# ponytail: one-time export — rerun after hydro.py when DEM source changes
"""Export D8 stream mouths as river-outlets.geojson with nearest mining IUP context.

Needs the intermediate npz (filled/fdr/acc/dem) — compute via hydro.py internals:
  python3 scripts/terrain/outlets.py
"""

import json
import math
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
import hydro

BBOX = (124.2, -2.35, 125.4, -1.15)
OUT = Path("public/data/hydrology/river-outlets.geojson")
IUP = Path("public/data/mining/iup.geojson")


def haversine_m(a, b):
    (lon1, lat1), (lon2, lat2) = a, b
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    hh = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(hh))


def main() -> None:
    dem = hydro.load_dem()
    filled = hydro.fill_sinks(dem)
    fdr = hydro.flow_direction(filled)
    acc = hydro.flow_accumulation(filled, fdr)
    labels = hydro.label_catchments(filled, fdr, acc, dem)

    west, south, east, north = BBOX
    h, w = dem.shape
    dlat = (north - south) / h
    dlon = (east - west) / w
    cell_area = dlat * 110_540 * dlon * 111_320 * math.cos(math.radians((north + south) / 2))

    stream = (acc >= hydro.STREAM_THRESHOLD) & ~np.isnan(dem)
    my, mx = np.where(stream & (fdr == 0))

    iup_pts = []
    for f in json.load(open(IUP))["features"]:
        g = f["geometry"]
        rings = [g["coordinates"][0]] if g["type"] == "Polygon" else ([r for p in g["coordinates"] for r in p] if g["type"] == "MultiPolygon" else [])
        if not rings:
            continue
        lons = [c[0] for c in rings[0]]
        lats = [c[1] for c in rings[0]]
        iup_pts.append(((sum(lons) / len(lons), sum(lats) / len(lats)), f["properties"].get("name", "IUP")))

    feats = []
    for y, x in zip(my.tolist(), mx.tolist()):
        lon = round(west + (x + 0.5) * dlon, 5)
        lat = round(north - (y + 0.5) * dlat, 5)
        cid = labels[y, x]
        area = round(int((labels == cid).sum()) * cell_area / 1e6, 1)
        km, name = min(((haversine_m((lon, lat), p) / 1000, n) for p, n in iup_pts))
        feats.append({
            "type": "Feature",
            "properties": {
                "name": "River outlet",
                "type": "river_outlet",
                "source": "DEMNAS D8 derived",
                "catchmentAreaKm2": area,
                "nearestIup": name,
                "nearestIupKm": round(km, 1),
            },
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
        })
    OUT.write_text(json.dumps({"type": "FeatureCollection", "features": feats}))
    print(f"wrote {OUT} ({len(feats)} outlets)")


if __name__ == "__main__":
    main()
