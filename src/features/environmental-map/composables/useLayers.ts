import { ref, reactive } from "vue";
import type { MapLayerDefinition } from "@/shared/types/layers";
import { staticLayers } from "../layers/static-layers";

interface LayerState {
  visible: boolean;
  opacity: number;
}

const layerStates = reactive<Record<string, LayerState>>({});

staticLayers.forEach((layer) => {
  layerStates[layer.id] = {
    visible: layer.defaultVisible,
    opacity: layer.opacity,
  };
});

export function useLayers() {
  const layers = ref<MapLayerDefinition[]>(staticLayers);

  function isVisible(layerId: string): boolean {
    return layerStates[layerId]?.visible ?? false;
  }

  function getOpacity(layerId: string): number {
    return layerStates[layerId]?.opacity ?? 1;
  }

  function toggleLayer(layerId: string) {
    if (layerStates[layerId]) {
      layerStates[layerId].visible = !layerStates[layerId].visible;
    }
  }

  function setOpacity(layerId: string, opacity: number) {
    if (layerStates[layerId]) {
      layerStates[layerId].opacity = opacity;
    }
  }

  function getByCategory(category: MapLayerDefinition["category"]): MapLayerDefinition[] {
    return staticLayers.filter((l) => l.category === category);
  }

  return {
    layers,
    isVisible,
    getOpacity,
    toggleLayer,
    setOpacity,
    getByCategory,
  };
}
