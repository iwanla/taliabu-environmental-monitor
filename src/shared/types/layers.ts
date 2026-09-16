export type LayerCategory =
  | "satellite"
  | "environment"
  | "mining"
  | "hydrology"
  | "coastal"
  | "terrain"
  | "administrative";

export type LayerType = "raster" | "vector";
export type BasemapMode = "vector" | "satellite" | "minimal";

export interface LayerPaint {
  "fill-color"?: string;
  "fill-opacity"?: number;
  "line-color"?: string;
  "line-width"?: number;
  "line-dasharray"?: number[];
  "circle-radius"?: number;
  "circle-color"?: string;
  "circle-stroke-color"?: string;
  "circle-stroke-width"?: number;
}

export type MapLayerDefinition =
  | VectorLayerDefinition
  | RasterLayerDefinition;

export interface VectorLayerDefinition {
  id: string;
  name: string;
  sub?: string;
  category: LayerCategory;
  type: "vector";
  defaultVisible: boolean;
  opacity: number;
  source: { type: "geojson"; url: string };
  layerType: "fill" | "line" | "point";
  paint: LayerPaint;
}

export interface RasterLayerDefinition {
  id: string;
  name: string;
  sub?: string;
  category: LayerCategory;
  type: "raster";
  defaultVisible: boolean;
  opacity: number;
  source: {
    type: "raster";
    evalscriptKey: string;
    maskable?: boolean;
  };
}
