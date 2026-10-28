/** Shared by the Public set searches of drawings and data files: the same filters, offset and limit. */
const SET_FILTERS=["name","username","tag","startDate","endDate"] as const;
export function setSearch(parsed:{offset:number;limit:number}&Record<(typeof SET_FILTERS)[number],string>){
  const upstream=new URLSearchParams({offset:String(parsed.offset),limit:String(parsed.limit)});
  for(const key of SET_FILTERS)if(parsed[key])upstream.set(key,parsed[key]);
  return upstream;
}
