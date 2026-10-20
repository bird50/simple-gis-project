"use client";

import {Layer,Source} from "react-map-gl/maplibre";
import type {FeatureCollection} from "geojson";
import type {LayerDefinition} from "@/types/gis";

type DrawingDataKey=NonNullable<LayerDefinition["drawingDataKey"]>;
const emptyDrawings:FeatureCollection={type:"FeatureCollection",features:[]};

export function DrawingLayers({layers,visible,opacity,data={}}:{
  layers:LayerDefinition[];
  visible:Record<string,boolean>;
  opacity:Record<string,number>;
  data?:Partial<Record<DrawingDataKey,FeatureCollection>>;
}) {
  return layers.filter(layer=>layer.drawingDataKey&&visible[layer.id]).map(layer=><Source key={layer.id} id={`drawing-${layer.id}`} type="geojson" data={data[layer.drawingDataKey!]??emptyDrawings}>
    <Layer id={`${layer.id}-fill`} type="fill" minzoom={layer.minZoom} maxzoom={layer.maxZoom} filter={["==",["geometry-type"],"Polygon"]} paint={{"fill-color":layer.color,"fill-opacity":(opacity[layer.id]??layer.opacity)*.25}}/>
    <Layer id={`${layer.id}-line`} type="line" minzoom={layer.minZoom} maxzoom={layer.maxZoom} filter={["match",["geometry-type"],["LineString","Polygon"],true,false]} paint={{"line-color":layer.color,"line-width":3,"line-opacity":opacity[layer.id]??layer.opacity}}/>
    <Layer id={`${layer.id}-point`} type="circle" minzoom={layer.minZoom} maxzoom={layer.maxZoom} filter={["==",["geometry-type"],"Point"]} paint={{"circle-color":layer.color,"circle-radius":6,"circle-stroke-color":"#fff","circle-stroke-width":2,"circle-opacity":opacity[layer.id]??layer.opacity,"circle-stroke-opacity":opacity[layer.id]??layer.opacity}}/>
  </Source>);
}
