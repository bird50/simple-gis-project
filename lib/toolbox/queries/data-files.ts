import {publicDataFileQuery,publicDataFileSetQuery} from "@thaiwater/toolbox-sdk";
import {setSearch} from "./sets";

/** Public data files: bbox, limit (1–1000) and the optional search/tag filters, nothing else. */
export function publicDataFileSearch(query:URLSearchParams){
  const parsed=publicDataFileQuery.safeParse(Object.fromEntries(query));
  if(!parsed.success)return null;
  const upstream=new URLSearchParams({bbox:parsed.data.bbox.join(","),limit:String(parsed.data.limit)});
  if(parsed.data.search)upstream.set("search",parsed.data.search);
  if(parsed.data.tag)upstream.set("tag",parsed.data.tag);
  return upstream;
}
/** Public data file sets: the same filters, offset and limit as drawing sets, nothing else. */
export function publicDataFileSetSearch(query:URLSearchParams){
  const parsed=publicDataFileSetQuery.safeParse(Object.fromEntries(query));
  return parsed.success?setSearch(parsed.data):null;
}
