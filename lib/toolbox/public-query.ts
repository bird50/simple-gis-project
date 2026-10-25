import {z} from "zod";
import {publicPhotoQuery} from "@/lib/gis/public-photo-query";

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
