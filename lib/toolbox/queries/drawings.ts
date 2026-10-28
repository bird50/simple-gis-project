import {z} from "zod";
import {publicPhotoQuery} from "@/lib/gis/public-photo-query";
import {publicDrawingSetQuery} from "@thaiwater/toolbox-sdk";
import {setSearch} from "./sets";

const drawingLimit=z.coerce.number().int().min(1).max(50).default(50);

/** Public drawings answer at most 50 objects, so larger limits are rejected rather than silently capped. */
export function publicDrawingSearch(query:URLSearchParams){
  const area=publicPhotoQuery.safeParse({bbox:query.get("bbox")??""}),limit=drawingLimit.safeParse(query.get("limit")??undefined);
  if(!area.success||!limit.success)return null;
  return new URLSearchParams({bbox:area.data.bbox.join(","),limit:String(limit.data)});
}
/** Public drawing sets: name/username/tag and published-date filters (AND), offset and limit (1–50), nothing else. */
export function publicDrawingSetSearch(query:URLSearchParams){
  const parsed=publicDrawingSetQuery.safeParse(Object.fromEntries(query));
  return parsed.success?setSearch(parsed.data):null;
}
