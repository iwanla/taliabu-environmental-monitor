import { ref, reactive } from "vue";
import type { MapLayerDefinition } from "@/shared/types/layers";
import { staticLayers } from "../layers/static-layers";

interface LayerState {
  visible: boolean;
  opacity: number;
}

const layerStates = reactive<Record<string, LayerState>>({});
const cloudMaskOn = ref(false);

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

  // ponytail: raster overlays are a radio group — one at a time, since NDVI+SCL etc. can't be read together
  function toggleLayer(layerId: string) {
    if (!layerStates[layerId]) return;
    if (staticLayers.find((l) => l.id === layerId)?.type === "raster" && !layerStates[layerId].visible) {
      staticLayers.forEach((l) => {
        if (l.type === "raster" && l.id !== layerId) layerStates[l.id].visible = false;
      });
    }
    layerStates[layerId].visible = !layerStates[layerId].visible;
  }

  function setLayer(layerId: string, visible: boolean) {
    if (layerStates[layerId]) layerStates[layerId].visible = visible;
  }

  function setOpacity(layerId: string, opacity: number) {
    if (layerStates[layerId]) {
      layerStates[layerId].opacity = opacity;
    }
  }

  function getByCategory(category: MapLayerDefinition["category"]): MapLayerDefinition[] {
    return staticLayers.filter((l) => l.category === category);
  }

  function toggleCloudMask() {
    cloudMaskOn.value = !cloudMaskOn.value;
  }

  return {
    layers,
    isVisible,
    getOpacity,
    toggleLayer,
    setLayer,
    setOpacity,
    getByCategory,
    cloudMaskOn,
    toggleCloudMask,
  };
}
