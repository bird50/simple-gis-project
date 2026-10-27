import {z} from "zod";
import {publicPhotoQuery} from "@/lib/gis/public-photo-query";
import {publicDataFileQuery,publicDataFileSetQuery,publicDrawingSetQuery,publicPhotoSetQuery} from "@thaiwater/toolbox-sdk";

const FILTERS=["username","eventName","tag","startDate","endDate"] as const;
const drawingLimit=z.coerce.number().int().min(1).max(50).default(50);

/**
 * Rebuilds the upstream query from validated values only, so unknown or duplicate parameters never
 * reach the Toolbox service. Returns null when the request is invalid.
 */
export function publicPhotoSearch(query:URLSearchParams){
  const parsed=publicPhotoQuery.safeParse(Object.fromEntries(query));
  if(!parsed.success)return null;
  const upstream=new URLSearchParams({bbox:parsed.data.bbox.join(","),limit:String(parsed.data.limit)});
  for(const key of FILTERS)if(parsed.data[key])upstream.set(key,parsed.data[key]);
  return upstream;
}
/** Public drawings answer at most 50 objects, so larger limits are rejected rather than silently capped. */
export function publicDrawingSearch(query:URLSearchParams){
  const area=publicPhotoQuery.safeParse({bbox:query.get("bbox")??""}),limit=drawingLimit.safeParse(query.get("limit")??undefined);
  if(!area.success||!limit.success)return null;
  return new URLSearchParams({bbox:area.data.bbox.join(","),limit:String(limit.data)});
}
/** Public data files: bbox, limit (1–1000) and the optional search/tag filters, nothing else. */
export function publicDataFileSearch(query:URLSearchParams){
  const parsed=publicDataFileQuery.safeParse(Object.fromEntries(query));
  if(!parsed.success)return null;
  const upstream=new URLSearchParams({bbox:parsed.data.bbox.join(","),limit:String(parsed.data.limit)});
  if(parsed.data.search)upstream.set("search",parsed.data.search);
  if(parsed.data.tag)upstream.set("tag",parsed.data.tag);
  return upstream;
}
/** Public photo sets: the photo filters (AND), offset and limit (1–50), nothing else. */
export function publicPhotoSetSearch(query:URLSearchParams){
  const parsed=publicPhotoSetQuery.safeParse(Object.fromEntries(query));
  if(!parsed.success)return null;
  const upstream=new URLSearchParams({offset:String(parsed.data.offset),limit:String(parsed.data.limit)});
  for(const key of FILTERS)if(parsed.data[key])upstream.set(key,parsed.data[key]);
  return upstream;
}
const SET_FILTERS=["name","username","tag","startDate","endDate"] as const;
function setSearch(parsed:{offset:number;limit:number}&Record<(typeof SET_FILTERS)[number],string>){
  const upstream=new URLSearchParams({offset:String(parsed.offset),limit:String(parsed.limit)});
  for(const key of SET_FILTERS)if(parsed[key])upstream.set(key,parsed[key]);
  return upstream;
}
/** Public drawing sets: name/username/tag and published-date filters (AND), offset and limit (1–50), nothing else. */
export function publicDrawingSetSearch(query:URLSearchParams){
  const parsed=publicDrawingSetQuery.safeParse(Object.fromEntries(query));
  return parsed.success?setSearch(parsed.data):null;
}
/** Public data file sets: the same filters, offset and limit as drawing sets, nothing else. */
export function publicDataFileSetSearch(query:URLSearchParams){
  const parsed=publicDataFileSetQuery.safeParse(Object.fromEntries(query));
  return parsed.success?setSearch(parsed.data):null;
}
