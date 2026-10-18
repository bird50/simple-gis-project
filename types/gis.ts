export type LayerType="GEOJSON"|"VECTOR_TILE"|"RASTER_TILE"|"WMS"|"WFS"|"ARCGIS_REST"|"REST_API";
export type AccessLevel="PUBLIC"|"MEMBER"|"ADMIN";
export type LayerDefinition={id:string;title:string;description:string;group:string;type:LayerType;url:string;visible:boolean;opacity:number;minZoom:number;maxZoom:number;accessLevel:AccessLevel;color:string;legend:string;photoDataKey?:"my-photos"|"public-photos";popupFields:string[]};
