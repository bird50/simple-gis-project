"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import type {FeatureCollection} from "geojson";
import type {MapRef} from "react-map-gl/maplibre";

/** Shown when PostGIS is unavailable, so the workspace still demonstrates the station layer. */
export const sampleStations:FeatureCollection={type:"FeatureCollection",features:[{type:"Feature",properties:{station_code:"P.1",station_name:"สถานีสะพานนวรัฐ",province:"เชียงใหม่",level:"2.84 m"},geometry:{type:"Point",coordinates:[98.99,18.79]}},{type:"Feature",properties:{station_code:"N.5A",station_name:"สถานีเมืองพิษณุโลก",province:"พิษณุโลก",level:"4.12 m"},geometry:{type:"Point",coordinates:[100.26,16.82]}},{type:"Feature",properties:{station_code:"C.2",station_name:"สถานีค่ายจิรประวัติ",province:"นครสวรรค์",level:"5.30 m"},geometry:{type:"Point",coordinates:[100.14,15.7]}},{type:"Feature",properties:{station_code:"M.7",station_name:"สถานีอุบลราชธานี",province:"อุบลราชธานี",level:"3.67 m"},geometry:{type:"Point",coordinates:[104.86,15.24]}},{type:"Feature",properties:{station_code:"X.40",station_name:"สถานีสุราษฎร์ธานี",province:"สุราษฎร์ธานี",level:"1.92 m"},geometry:{type:"Point",coordinates:[99.33,9.14]}}]};
export const STATION_LIMIT=500;
const empty:FeatureCollection={type:"FeatureCollection",features:[]};
const clamp=(value:number,limit:number)=>Math.min(limit,Math.max(-limit,value));
export type StationMode="loading"|"live"|"sample";

/**
 * Stations inside the current map view from `/api/gis/stations` (bbox, at most STATION_LIMIT), refreshed by `reload()`
 * after the map stops moving. Falls back to `sampleStations` while the API answers with an error.
 */
export function useStations(mapRef:React.RefObject<MapRef|null>,enabled:boolean){
  const [stations,setStations]=useState<FeatureCollection>(empty);
  const [mode,setMode]=useState<StationMode>("loading");
  const pending=useRef<{timer?:number;abort?:AbortController}>({});
  const reload=useCallback(()=>{
    const map=mapRef.current;
    if(!map||!enabled)return;
    window.clearTimeout(pending.current.timer);
    pending.current.timer=window.setTimeout(async()=>{
      pending.current.abort?.abort();
      const abort=new AbortController();pending.current.abort=abort;
      const bounds=map.getBounds();
      const bbox=[clamp(bounds.getWest(),180),clamp(bounds.getSouth(),90),clamp(bounds.getEast(),180),clamp(bounds.getNorth(),90)].map(value=>value.toFixed(5)).join(",");
      try{
        const response=await fetch(`/api/gis/stations?bbox=${bbox}&limit=${STATION_LIMIT}`,{signal:abort.signal});
        const data=response.ok?await response.json() as FeatureCollection:undefined;
        if(!Array.isArray(data?.features))throw new Error("Unexpected station response");
        setStations(data);setMode("live");
      }catch{
        if(abort.signal.aborted)return;
        setStations(sampleStations);setMode("sample");
      }
    },300);
  },[mapRef,enabled]);
  useEffect(()=>{reload();},[reload]);
  useEffect(()=>{const current=pending.current;return ()=>{window.clearTimeout(current.timer);current.abort?.abort();};},[]);
  return {stations,mode,reload};
}
