// Land-cover metrics over a scope polygon from raw NDVI/MNDWI renders.
// ponytail: single-date snapshot metrics; loss/change stays in the AOI change-detection panel
import { bbox } from "@turf/turf";
import { renderRaw, aoiMask } from "./changeDetection";

export type AnalyticsScope = "island" | "viewport" | "aoi" | "permit";

export interface LandCover {
  scope: AnalyticsScope;
  scopeLabel: string;
  date: string;
  vegetationHa: number;
  bareHa: number;
  waterHa: number;
  totalHa: number;
  coverage: number;
  resolutionM: number;
}

const SIZE = 512;

export async function computeLandCover(
  scope: AnalyticsScope,
  shape: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  date: string,
): Promise<LandCover> {
  const box = bbox(shape as never) as [number, number, number, number];
  const [ndvi, mndwi] = await Promise.all([renderRaw("ndvi-raw", date, box), renderRaw("mndwi-raw", date, box)]);
  const mask = aoiMask(shape, box, ndvi.width, ndvi.height);

  let veg = 0;
  let bare = 0;
  let water = 0;
  let valid = 0;
  let px = -1;
  for (let i = 0; i < ndvi.data.length; i += 4) {
    px++;
    if (!mask.mask[px]) continue;
    if (ndvi.data[i + 3] === 0 || mndwi.data[i + 3] === 0) continue;
    valid++;
    const ndviVal = (ndvi.data[i] / 255) * 2 - 1;
    const mndwiVal = (mndwi.data[i] / 255) * 2 - 1;
    if (mndwiVal > 0.1) water++;
    else if (ndviVal > 0.2) veg++;
    else bare++;
  }

  const [west, south, east, north] = box;
  const midLat = (south + north) / 2;
  const mPerPxX = ((east - west) * 111320 * Math.cos((midLat * Math.PI) / 180)) / ndvi.width;
  const mPerPxY = ((north - south) * 110540) / ndvi.height;
  const pixelM2 = mPerPxX * mPerPxY;
  const ha = (n: number) => (n * pixelM2) / 10_000;

  return {
    scope,
    scopeLabel: "",
    date,
    vegetationHa: ha(veg),
    bareHa: ha(bare),
    waterHa: ha(water),
    totalHa: ha(mask.inside),
    coverage: mask.inside ? valid / mask.inside : 0,
    resolutionM: Math.round((mPerPxX + mPerPxY) / 2),
  };
}
