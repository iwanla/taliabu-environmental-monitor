import { ref } from "vue";

interface DatasetMetadata {
  id: string;
  category: string;
  source: string;
  sourceUrl: string | null;
  retrievedAt: string;
  sourceUpdatedAt: string | null;
  version: string;
  refreshPolicy: string;
  license: string | null;
  notes: string;
}

const cache = ref<DatasetMetadata[]>([]);
const loaded = ref(false);

export function useDatasetMetadata() {
  async function load() {
    if (loaded.value) return cache.value;
    const res = await fetch("/data/metadata/datasets.json");
    cache.value = await res.json();
    loaded.value = true;
    return cache.value;
  }

  function getByLayerId(layerId: string): DatasetMetadata | undefined {
    const mapping: Record<string, string> = {
      "mining-iup-layer": "mining-iup",
      "rivers-layer": "rivers",
      "watersheds-layer": "watersheds",
      "coastline-layer": "baseline-coastline",
      "settlements-layer": "settlements",
      "settlement-areas-layer": "settlement-areas",
      "admin-boundary-layer": "administrative-boundaries",
    };
    const datasetId = mapping[layerId];
    return cache.value.find((d) => d.id === datasetId);
  }

  return { load, getByLayerId, cache };
}
