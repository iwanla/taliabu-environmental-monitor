const PC_STAC_URL = "https://planetarycomputer.microsoft.com/api/stac/v1/search";

export interface SatelliteTile {
  id: string;
  collection: string;
  acquiredAt: string;
  cloudCover?: number;
  bbox: number[];
  provider: "planetary-computer";
  previewUrl?: string;
}

export interface SatelliteAcquisition {
  id: string;
  date: string;
  acquiredAt: string;
  tiles: SatelliteTile[];
  tileCount: number;
  coverage: number;
  cloudCover?: number;
  quality: "excellent" | "good" | "cloudy" | "partial";
  source: "sentinel-2";
}

interface StacFeature {
  id: string;
  collection: string;
  bbox: number[];
  properties: {
    datetime: string;
    "eo:cloud_cover"?: number;
  };
  assets: {
    tilejson?: { href: string };
    rendered_preview?: { href: string };
  };
}

interface StacSearchResponse {
  features: StacFeature[];
}

const TALIABU_BBOX: [number, number, number, number] = [124.42, -2.10, 125.22, -1.52];

export async function searchScenes(opts: {
  collection?: string;
  from: string;
  to: string;
  maxCloudCover?: number;
  limit?: number;
}): Promise<SatelliteTile[]> {
  const collection = opts.collection ?? "sentinel-2-l2a";

  const response = await fetch(PC_STAC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      collections: [collection],
      bbox: TALIABU_BBOX,
      datetime: `${opts.from}T00:00:00Z/${opts.to}T23:59:59Z`,
      query: opts.maxCloudCover !== undefined
        ? { "eo:cloud_cover": { lte: opts.maxCloudCover } }
        : undefined,
      sortby: [{ field: "properties.datetime", direction: "desc" }],
      limit: opts.limit ?? 50,
    }),
  });

  if (!response.ok) {
    throw new Error(`Planetary Computer STAC error: ${response.status}`);
  }

  const result = await response.json<StacSearchResponse>();

  return result.features.map((feature) => ({
    id: feature.id,
    collection: feature.collection,
    acquiredAt: feature.properties.datetime,
    cloudCover: feature.properties["eo:cloud_cover"],
    bbox: feature.bbox,
    provider: "planetary-computer" as const,
    previewUrl: feature.assets?.rendered_preview?.href,
  }));
}

export function groupAcquisitions(tiles: SatelliteTile[]): SatelliteAcquisition[] {
  const groups = new Map<string, SatelliteTile[]>();

  for (const tile of tiles) {
    const key = `${tile.collection}:${tile.acquiredAt}`;
    groups.set(key, [...(groups.get(key) ?? []), tile]);
  }

  return [...groups.values()]
    .map((group) => {
      const acquiredAt = group[0].acquiredAt;
      const cloudCover = group.reduce<number | undefined>((best, tile) =>
        tile.cloudCover === undefined ? best : Math.min(best ?? Infinity, tile.cloudCover), undefined);

      return {
        id: `s2-${acquiredAt}`,
        date: acquiredAt.slice(0, 10),
        acquiredAt,
        tiles: group,
        tileCount: group.length,
        coverage: 1,
        cloudCover,
        quality: cloudCover === undefined ? "partial" : cloudCover <= 10 ? "excellent" : cloudCover <= 30 ? "good" : "cloudy",
        source: "sentinel-2" as const,
      };
    })
    .sort((a, b) => b.acquiredAt.localeCompare(a.acquiredAt));
}

export async function getLatestAcquisition(
  maxCloudCover: number = 20,
): Promise<SatelliteAcquisition | null> {
  const acquisitions = groupAcquisitions(await searchScenes({
    from: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
    maxCloudCover,
    limit: 5,
  }));
  return acquisitions[0] ?? null;
}
