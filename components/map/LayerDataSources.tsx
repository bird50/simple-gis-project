"use client";
import {useEffect,useState} from "react";
import {useDataSource,useLayers} from "@thaiwater/toolbox-sdk/react";
import type {LayerDefinition} from "@thaiwater/toolbox-sdk";
import type {Feature,FeatureCollection} from "geojson";

const MAX_ROWS=5000;
const none:Feature[]=[];
type Status={note?:string;loading?:boolean};
/**
 * Offers system layers to the Data Panel: layers drawn from host data (`render.dataKey`) use that data,
 * small static GeoJSON files are fetched once when the layer is first shown. Other layer types (WMS, tiles) have no rows.
 */
export function LayerDataSources({layers,data,status}:{layers:readonly LayerDefinition[];data:Record<string,FeatureCollection>;status?:Record<string,Status>}){
  return <>{layers.filter(layer=>!layer.owner&&layer.url).map(layer=><LayerDataSource key={layer.id} layer={layer} data={layer.render?.dataKey?data[layer.render.dataKey]:undefined} status={status?.[layer.id]}/>)}</>;
}
function LayerDataSource({layer,data,status}:{layer:LayerDefinition;data?:FeatureCollection;status?:Status}){
  const shown=!!useLayers().visible[layer.id];
  const file=!data&&layer.type==="GEOJSON"&&layer.url.startsWith("/");
  const [fetched,setFetched]=useState<{features:Feature[];error?:string}>();
  useEffect(()=>{
    if(!file||!shown||fetched)return;
    const abort=new AbortController();
    fetch(layer.url,{signal:abort.signal}).then(response=>response.ok?response.json():Promise.reject(new Error(String(response.status))))
      .then((json:Partial<FeatureCollection>)=>setFetched({features:Array.isArray(json.features)?json.features.slice(0,MAX_ROWS):[]}))
      .catch(()=>{if(!abort.signal.aborted)setFetched({features:[],error:"โหลดข้อมูลตารางของชั้นนี้ไม่สำเร็จ"});});
    return ()=>abort.abort();
  },[file,shown,fetched,layer.url]);
  useDataSource(data||file?{id:layer.id,title:layer.title,layerId:layer.id,features:data?.features??fetched?.features??none,columns:layer.popupFields,note:status?.note,loading:status?.loading||(file&&shown&&!fetched),error:fetched?.error}:undefined);
  return null;
}
