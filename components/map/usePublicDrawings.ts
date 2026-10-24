"use client";
import {useEffect,useState} from "react";
import {useMap} from "react-map-gl/maplibre";
import {photoViewportBbox} from "@/lib/gis/public-photo-query";
import {drawingSchema} from "@/lib/gis/drawing-contract";
import {z} from "zod";
import type {LayerDefinition} from "@/types/gis";
const responseSchema=z.object({drawings:z.array(drawingSchema.safeExtend({shareName:z.string(),username:z.string(),shareId:z.string()})).max(50),hasMore:z.boolean()});
export function usePublicDrawings(layer:LayerDefinition|undefined,visible:boolean){
 const {current:map}=useMap();
 const [state,setState]=useState<{drawings:z.infer<typeof responseSchema>["drawings"];message:string;error:boolean}>({drawings:[],message:"",error:false});
 useEffect(()=>{
 if(!map||!visible||!layer)return;
 let disposed=false,controller:AbortController|undefined,timer:ReturnType<typeof setTimeout>;
 async function load(){
 controller?.abort();controller=new AbortController();const active=controller;
 const bounds=map!.getBounds();if(!bounds)return;
 if(map!.getZoom()<layer!.minZoom||map!.getZoom()>=layer!.maxZoom){setState({drawings:[],message:"ซูมเพื่อดู Public Drawing",error:false});return;}
 setState({drawings:[],message:"กำลังโหลด Public Drawing…",error:false});
 try{
 const bbox=photoViewportBbox(bounds.getWest(),bounds.getSouth(),bounds.getEast(),bounds.getNorth());
 const response=await fetch(`${layer!.url}?${new URLSearchParams({bbox,limit:"50"})}`,{cache:"no-store",signal:active.signal});
 if(!response.ok)throw new Error();const result=responseSchema.parse(await response.json());
 if(!disposed&&!active.signal.aborted)setState({drawings:result.drawings,message:result.hasMore?"มีรูปวาดเพิ่มเติม กรุณาซูมเข้า":`${result.drawings.length} วัตถุ Public ในพื้นที่นี้`,error:false});
 }catch{if(!disposed&&!active.signal.aborted)setState({drawings:[],message:"โหลด Public Drawing ไม่สำเร็จ ลองปิด–เปิด Layer อีกครั้ง",error:true});}
 }
 function schedule(){controller?.abort();clearTimeout(timer);timer=setTimeout(()=>void load(),250);}
 map.on("load",schedule);map.on("moveend",schedule);window.addEventListener("thaiwater:public-drawings-updated",schedule);schedule();
 return ()=>{disposed=true;controller?.abort();clearTimeout(timer);map.off("load",schedule);map.off("moveend",schedule);window.removeEventListener("thaiwater:public-drawings-updated",schedule);};
 },[map,layer,visible]);
 return state;
}
