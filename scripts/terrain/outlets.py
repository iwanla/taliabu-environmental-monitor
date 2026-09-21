# One-time export.
# Rerun when DEM/hydrology outputs change.
"""Export D8 stream mouths as river-outlets.geojson.

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

    feats = []
    for y, x in zip(my.tolist(), mx.tolist()):
        lon = round(west + (x + 0.5) * dlon, 5)
        lat = round(north - (y + 0.5) * dlat, 5)
        cid = labels[y, x]
        area = round(int((labels == cid).sum()) * cell_area / 1e6, 1)
        feats.append({
            "type": "Feature",
            "properties": {
                "name": "River outlet",
                "type": "river_outlet",
                "source": "DEMNAS D8 derived",
                "catchmentAreaKm2": area,
            },
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
        })
    OUT.write_text(json.dumps({"type": "FeatureCollection", "features": feats}))
    print(f"wrote {OUT} ({len(feats)} outlets)")


if __name__ == "__main__":
    main()
