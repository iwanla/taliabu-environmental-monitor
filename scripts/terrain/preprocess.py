# ponytail: one-time preprocessing, artifacts versioned to public/data/terrain/ — rerun only when DEM source changes
"""Fetch DEMNAS (BIG ImageServer) for Taliabu, derive elevation + slope PNGs.

Usage: python3 scripts/terrain/preprocess.py [--bbox=124.2,-2.3,125.4,-1.2] [--size=4000]
Output: public/data/terrain/{elevation.png,slope.png,terrain.json}
"""

import argparse
import json
import sys
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

import numpy as np
from PIL import Image

# Taliabu context window (matches /api/render PROCESS_BBOX roughly)
DEFAULT_BBOX = (124.2, -2.3, 125.4, -1.2)
# spikes ~1e20 from broken nodata encoding + ocean voids; Taliabu max is ~1393 m
VALID_RANGE = (-100.0, 1700.0)
ELEV_NORM = (0.0, 1400.0)
SLOPE_NORM = (0.0, 60.0)
OUT = Path("public/data/terrain")

M_DEG = 111_320.0


def fetch_dem(bbox: tuple, size: int) -> np.ndarray:
    params = {
        "bbox": ",".join(str(v) for v in bbox),
        "bboxSR": "4326",
        "imageSR": "4326",
        "size": f"{size},{size}",
        "format": "tiff",
        "pixelType": "F32",
        "f": "json",
    }
    query = "&".join(f"{k}={urllib.parse.quote(v, safe=',')}" for k, v in params.items())
    url = f"https://geoservices.big.go.id/raster/rest/services/DEMNAS/DEM_Indonesia/ImageServer/exportImage?{query}"
    print(f"exportImage {size}x{size} ...")
    with urllib.request.urlopen(url, timeout=60) as r:
        href = json.load(r)["href"]
    tif_path = OUT / "demnas.tif"
    print(f"downloading {href[-60:]}")
    urllib.request.urlretrieve(href, tif_path)
    return np.array(Image.open(tif_path), dtype=np.float32)


def clean(dem: np.ndarray) -> np.ndarray:
    dem = dem.copy()
    lo, hi = VALID_RANGE
    dem[(dem < lo) | (dem > hi) | (dem <= 0.5)] = np.nan  # <=0.5: ocean is 0 m in DEMNAS
    return dem


def slope(dem: np.ndarray) -> np.ndarray:
    cell = abs((DEFAULT_BBOX[2] - DEFAULT_BBOX[0]) / dem.shape[1]) * M_DEG
    z = np.pad(np.where(np.isnan(dem), 0.0, dem), 1, mode="edge")
    # Horn 3x3: sobel-weighted central differences
    w = np.array([[1, 2, 1]])
    dzx = ((z[:-2, 2:] + 2 * z[1:-1, 2:] + z[2:, 2:]) - (z[:-2, :-2] + 2 * z[1:-1, :-2] + z[2:, :-2])) / (8 * cell)
    dzy = ((z[2:, :-2] + 2 * z[2:, 1:-1] + z[2:, 2:]) - (z[:-2, :-2] + 2 * z[:-2, 1:-1] + z[:-2, 2:])) / (8 * cell)
    deg = np.degrees(np.arctan(np.hypot(dzx, dzy)))
    deg[np.isnan(dem)] = np.nan
    return deg


def encode(arr: np.ndarray, norm: tuple, path: Path) -> None:
    lo, hi = norm
    v = np.clip((arr - lo) / (hi - lo), 0, 1)
    png = np.nan_to_num(v * 255).astype(np.uint8)
    alpha = np.where(np.isnan(arr), 0, 255).astype(np.uint8)
    rgba = np.dstack([png, png, png, alpha])
    Image.fromarray(rgba, "RGBA").save(path)
    print(f"wrote {path} ({path.stat().st_size // 1024} KB)")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--bbox", default=",".join(str(v) for v in DEFAULT_BBOX))
    ap.add_argument("--size", type=int, default=2000)
    args = ap.parse_args()
    bbox = tuple(float(v) for v in args.bbox.split(","))

    OUT.mkdir(parents=True, exist_ok=True)
    dem = clean(fetch_dem(bbox, args.size))
    slp = slope(dem)

    encode(dem, ELEV_NORM, OUT / "elevation.png")
    encode(slp, SLOPE_NORM, OUT / "slope.png")

    meta = {
        "source": "DEMNAS via BIG ImageServer (geoservices.big.go.id)",
        "retrievedAt": date.today().isoformat(),
        "bbox": list(bbox),
        "width": dem.shape[1],
        "height": dem.shape[0],
        "elevation": {"range": list(ELEV_NORM), "nodata": "alpha=0"},
        "slope": {"range": list(SLOPE_NORM), "unit": "degrees", "method": "Horn 3x3"},
    }
    (OUT / "terrain.json").write_text(json.dumps(meta, indent=2))
    print(f"wrote {OUT/'terrain.json'}")


if __name__ == "__main__":
    sys.exit(main())
