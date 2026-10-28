import {publicPhotoQuery} from "@/lib/gis/public-photo-query";
import {publicPhotoSetQuery} from "@thaiwater/toolbox-sdk";

const FILTERS=["username","eventName","tag","startDate","endDate"] as const;

/** Public photos in a viewport: bbox, limit and the photo filters, nothing else. Null when the request is invalid. */
export function publicPhotoSearch(query:URLSearchParams){
  const parsed=publicPhotoQuery.safeParse(Object.fromEntries(query));
  if(!parsed.success)return null;
  const upstream=new URLSearchParams({bbox:parsed.data.bbox.join(","),limit:String(parsed.data.limit)});
  for(const key of FILTERS)if(parsed.data[key])upstream.set(key,parsed.data[key]);
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
