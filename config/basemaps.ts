export type BasemapConfig={id:string;title:string;style:string|object};
export const basemaps:BasemapConfig[]=[
 {id:"osm",title:"OpenStreetMap",style:{version:8,sources:{osm:{type:"raster",tiles:["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],tileSize:256,attribution:"© OpenStreetMap contributors"}},layers:[{id:"osm",type:"raster",source:"osm"}]}},
 {id:"light",title:"Light",style:"https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"},
 {id:"satellite",title:"Satellite (placeholder)",style:{version:8,sources:{sat:{type:"raster",tiles:["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],tileSize:256}},layers:[{id:"sat",type:"raster",source:"sat"}]}}
];
