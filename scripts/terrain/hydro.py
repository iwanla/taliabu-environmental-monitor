# ponytail: one-time D8 hydrology preprocessing — rerun only when DEM source changes (~2-3 min pure-python heap loop)
"""Derive flow direction, flow accumulation, drainage network and downstream
encoding from the DEMNAS tif fetched by preprocess.py.

Output:
  public/data/terrain/fdr.png        R=D8 code (ESRI 1..128), G=log accumulation, A=land mask
  public/data/hydrology/drainage.geojson  derived stream polylines
  public/data/hydrology/watersheds-derived.geojson  catchment polygon per stream mouth
"""

import json
import heapq
import math
from pathlib import Path

import numpy as np
from PIL import Image

TIF = Path("public/data/terrain/demnas.tif")
OUT = Path("public/data/terrain")
DRAINAGE = Path("public/data/hydrology/drainage.geojson")
WATERSHEDS = Path("public/data/hydrology/watersheds-derived.geojson")
VALID_RANGE = (-100.0, 1700.0)
STREAM_THRESHOLD = 2000  # cells (~8.9 km2 catchment at 66 m/px)

# ESRI D8 codes: E, SE, S, SW, W, NW, N, NE
CODES = [1, 2, 4, 8, 16, 32, 64, 128]
# (dy, dx) matching CODES order
OFFSETS = [(0, 1), (1, 1), (1, 0), (1, -1), (0, -1), (-1, -1), (-1, 0), (-1, 1)]


def load_dem() -> np.ndarray:
    dem = np.array(Image.open(TIF), dtype=np.float32)
    dem[(dem < VALID_RANGE[0]) | (dem > VALID_RANGE[1]) | (dem <= 0.5)] = np.nan
    return dem


def fill_sinks(dem: np.ndarray) -> np.ndarray:
    """Priority-flood (Barnes et al.) — raises pits to their spill elevation."""
    h, w = dem.shape
    filled = dem.copy()
    land = ~np.isnan(dem)
    visited = np.zeros_like(land)
    heap: list[tuple[float, int, int]] = []
    # seed: land cells on grid edge or adjacent to ocean (4-neighbourhood)
    nan = np.isnan(dem)
    nb_nan = np.zeros_like(land)
    nb_nan[:-1, :] |= nan[1:, :]
    nb_nan[1:, :] |= nan[:-1, :]
    nb_nan[:, :-1] |= nan[:, 1:]
    nb_nan[:, 1:] |= nan[:, :-1]
    ocean_adj = land & nb_nan
    ys, xs = np.where(ocean_adj)
    for y, x in zip(ys.tolist(), xs.tolist()):
        visited[y, x] = True
        heapq.heappush(heap, (dem[y, x], y, x))

    n = int(land.sum())
    done = 0
    EPS = 0.01  # epsilon gradient: filled cells strictly increase along pop order -> no flats, no cycles
    while heap:
        e, y, x = heapq.heappop(heap)
        done += 1
        if done % 500_000 == 0:
            print(f"  fill {done}/{n}", flush=True)
        for dy, dx in OFFSETS:
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and land[ny, nx] and not visited[ny, nx]:
                visited[ny, nx] = True
                filled[ny, nx] = dem[ny, nx] if dem[ny, nx] > e else e + EPS
                heapq.heappush(heap, (filled[ny, nx], ny, nx))
    return filled


def flow_direction(filled: np.ndarray) -> np.ndarray:
    """D8 steepest descent; 0 where no neighbour is lower (filled sinks are flat → drain at spill only)."""
    h, w = filled.shape
    fdr = np.zeros((h, w), dtype=np.uint8)
    best = np.full((h, w), -np.inf, dtype=np.float32)
    diag = np.sqrt(2.0)
    for code, (dy, dx) in zip(CODES, OFFSETS):
        dist = diag if dy and dx else 1.0
        shifted = np.full((h, w), -np.inf, dtype=np.float32)
        # shifted[y, x] must equal filled[y+dy, x+dx]
        shifted[max(0, -dy):h - max(0, dy), max(0, -dx):w - max(0, dx)] = filled[max(0, dy):h + min(0, dy), max(0, dx):w + min(0, dx)]
        drop = (filled - shifted) / dist
        take = drop > best
        best[take] = drop[take]
        fdr[take] = code
    fdr[best <= 0] = 0
    fdr[np.isnan(filled)] = 0
    return fdr


def flow_accumulation(filled: np.ndarray, fdr: np.ndarray) -> np.ndarray:
    h, w = filled.shape
    acc = np.ones(h * w, dtype=np.float64)
    order = np.argsort(-filled, axis=None)
    flat_fdr = fdr.ravel()
    valid = ~np.isnan(filled.ravel())
    for idx in order:
        if not valid[idx] or flat_fdr[idx] == 0:
            continue
        code = flat_fdr[idx]
        dy, dx = OFFSETS[CODES.index(code)]
        y, x = divmod(idx, w)
        ny, nx = y + dy, x + dx
        if 0 <= ny < h and 0 <= nx < w:
            acc[ny * w + nx] += acc[idx]
    return acc.reshape(h, w)


def write_fdr_png(fdr: np.ndarray, acc: np.ndarray, dem: np.ndarray) -> None:
    land = ~np.isnan(dem)
    g = np.zeros_like(fdr)
    m = acc > 1
    g[m] = (np.log10(acc[m]) / max(1e-9, np.log10(acc.max())) * 255).astype(np.uint8)
    rgba = np.dstack([fdr, g, np.zeros_like(fdr), np.where(land, 255, 0).astype(np.uint8)])
    Image.fromarray(rgba, "RGBA").save(OUT / "fdr.png")
    print(f"wrote {OUT/'fdr.png'}")


def drainage_geojson(fdr: np.ndarray, acc: np.ndarray, dem: np.ndarray, bbox) -> None:
    west, south, east, north = bbox
    h, w = dem.shape
    dlat = (north - south) / h
    dlon = (east - west) / w
    stream = (acc >= STREAM_THRESHOLD) & ~np.isnan(dem)

    # upstream stream cell count -> heads have zero stream inflow
    inflow = np.zeros((h, w), dtype=np.int32)
    ys, xs = np.where(stream)
    for y, x in zip(ys.tolist(), xs.tolist()):
        code = fdr[y, x]
        if not code:
            continue
        dy, dx = OFFSETS[CODES.index(code)]
        ny, nx = y + dy, x + dx
        if 0 <= ny < h and 0 <= nx < w and stream[ny, nx]:
            inflow[ny, nx] += 1

    def cell_ll(y: int, x: int):
        return [round(west + (x + 0.5) * dlon, 5), round(north - (y + 0.5) * dlat, 5)]

    features = []
    hy, hx = np.where(stream & (inflow == 0))
    for y0, x0 in zip(hy.tolist(), hx.tolist()):
        coords = []
        y, x = y0, x0
        for _ in range(20_000):
            coords.append(cell_ll(y, x))
            code = fdr[y, x]
            if not code:
                break
            dy, dx = OFFSETS[CODES.index(code)]
            y, x = y + dy, x + dx
            if not (0 <= y < h and 0 <= x < w) or not stream[y, x]:
                if 0 <= y < h and 0 <= x < w:
                    coords.append(cell_ll(y, x))
                break
        if len(coords) >= 5:
            features.append({
                "type": "Feature",
                "properties": {"source": "DEMNAS D8 derived", "thresholdCells": STREAM_THRESHOLD},
                "geometry": {"type": "LineString", "coordinates": coords},
            })
    fc = {"type": "FeatureCollection", "features": features}
    DRAINAGE.write_text(json.dumps(fc))
    print(f"wrote {DRAINAGE} ({len(features)} streams)")


def label_catchments(filled: np.ndarray, fdr: np.ndarray, acc: np.ndarray, dem: np.ndarray) -> np.ndarray:
    """Catchment id per land cell: propagate each stream mouth's label upstream by
    walking cells in decreasing filled elevation and copying the downstream label.
    -1 = drains to a non-stream coast cell (excluded)."""
    h, w = dem.shape
    land = ~np.isnan(dem)
    stream = (acc >= STREAM_THRESHOLD) & land
    labels = np.full(h * w, -1, dtype=np.int32)
    mouths = stream & (fdr == 0)
    my, mx = np.where(mouths)
    for i, (y, x) in enumerate(zip(my.tolist(), mx.tolist())):
        labels[y * w + x] = i
    print(f"  {len(my)} stream mouths")
    flat_fdr = fdr.ravel()
    flat_labels = labels
    # ascending filled: a cell's downstream neighbour is strictly lower, so it is
    # labelled before the cell that copies from it (flow_accumulation uses the
    # opposite order because it pushes downstream instead of pulling)
    order = np.argsort(filled, axis=None)
    valid = land.ravel()
    for idx in order:
        if not valid[idx]:
            continue
        code = flat_fdr[idx]
        if not code:
            continue  # mouth (seeded) or non-stream coast outlet (stays -1)
        dy, dx = OFFSETS[CODES.index(code)]
        y, x = divmod(idx, w)
        ny, nx = y + dy, x + dx
        if 0 <= ny < h and 0 <= nx < w:
            flat_labels[idx] = flat_labels[ny * w + nx]
    return labels.reshape(h, w)


def mask_rings(mask: np.ndarray) -> list[list[tuple[int, int]]]:
    """Boundary rings of a bool mask: collect directed boundary edges (interior on the
    right, y-down grid coords) and stitch them into closed rings, skipping collinear
    vertices. Pinch corners may split the boundary into several rings — all are outers."""
    h, w = mask.shape
    M = np.zeros((h + 2, w + 2), dtype=bool)
    M[1:-1, 1:-1] = mask
    c = M[1:-1, 1:-1]
    conds = [
        (c & ~M[:-2, 1:-1], lambda y, x: ((x, y), (x + 1, y))),
        (c & ~M[1:-1, 2:], lambda y, x: ((x + 1, y), (x + 1, y + 1))),
        (c & ~M[2:, 1:-1], lambda y, x: ((x + 1, y + 1), (x, y + 1))),
        (c & ~M[1:-1, :-2], lambda y, x: ((x, y + 1), (x, y))),
    ]
    edges: dict[tuple[int, int], list[tuple[int, int]]] = {}
    for cond, seg in conds:
        ys, xs = np.where(cond)
        for y, x in zip(ys.tolist(), xs.tolist()):
            a, b = seg(y, x)
            edges.setdefault(a, []).append(b)

    rings: list[list[tuple[int, int]]] = []
    while edges:
        start, outs = next(iter(edges.items()))
        cur = outs.pop()
        if not outs:
            del edges[start]
        ring = [start]
        while cur != start:
            ring.append(cur)
            outs = edges[cur]
            nxt = outs.pop()
            if not outs:
                del edges[cur]
            (py, px), (ay, ax) = ring[-2], ring[-1]
            if ay - py == nxt[0] - ay and ax - px == nxt[1] - ax:
                ring[-1] = nxt
            else:
                ring.append(nxt)
            cur = nxt
        rings.append(ring)
    return rings


def watersheds_geojson(labels: np.ndarray, dem: np.ndarray, bbox) -> None:
    west, south, east, north = bbox
    h, w = dem.shape
    dlat = (north - south) / h
    dlon = (east - west) / w
    cell_area = dlat * 110_540 * dlon * 111_320 * math.cos(math.radians((north + south) / 2))

    ids = np.unique(labels)
    ids = ids[ids >= 0]
    sizes = [(int((labels == i).sum()), i) for i in ids.tolist()]
    sizes.sort(reverse=True)

    features = []
    for rank, (cells, lid) in enumerate(sizes, 1):
        if cells < 100:
            break
        mask = labels == lid
        ys, xs = np.where(mask)
        r0, r1, c0, c1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        rings = mask_rings(mask[r0:r1, c0:c1])

        def ring_ll(ring):
            coords = [[round(west + (cx + c0) * dlon, 4), round(north - (cy + r0) * dlat, 4)] for cy, cx in ring]
            coords.append(coords[0])
            return coords

        polys = [ring_ll(r) for r in rings]
        geom = {"type": "Polygon", "coordinates": [polys[0]]} if len(polys) == 1 else {"type": "MultiPolygon", "coordinates": [[p] for p in polys]}
        features.append({
            "type": "Feature",
            "properties": {
                "name": f"Catchment {rank:02d}",
                "source": "DEMNAS D8 derived",
                "areaKm2": round(cells * cell_area / 1e6, 1),
            },
            "geometry": geom,
        })
    fc = {"type": "FeatureCollection", "features": features}
    WATERSHEDS.write_text(json.dumps(fc))
    print(f"wrote {WATERSHEDS} ({len(features)} catchments)")


def main() -> None:
    dem = load_dem()
    print("filling sinks...")
    filled = fill_sinks(dem)
    print("flow direction...")
    fdr = flow_direction(filled)
    print("flow accumulation...")
    acc = flow_accumulation(filled, fdr)
    bbox = (124.2, -2.35, 125.4, -1.15)
    write_fdr_png(fdr, acc, dem)
    drainage_geojson(fdr, acc, dem, bbox)
    print("labeling catchments...")
    labels = label_catchments(filled, fdr, acc, dem)
    watersheds_geojson(labels, dem, bbox)
    print(f"max accumulation: {acc.max():.0f} cells")


if __name__ == "__main__":
    main()
