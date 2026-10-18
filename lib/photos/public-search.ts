import type {Prisma} from "@prisma/client";
import type {z} from "zod";
import type {publicPhotoQuery} from "@/lib/gis/public-photo-query";

export function publicPhotoWhere(query:z.infer<typeof publicPhotoQuery>):Prisma.SharedPhotoWhereInput {
  const {bbox:[west,south,east,north],username,eventName,startDate,endDate,tag}=query;
  const conditions:Prisma.SharedPhotoWhereInput[]=[];
  if(username)conditions.push({share:{owner:{username:{contains:username,mode:"insensitive"}}}});
  if(eventName)conditions.push({share:{eventName:{contains:eventName,mode:"insensitive"}}});
  if(tag)conditions.push({share:{tags:{has:tag}}});
  // The start/end dates form one inclusive range, then OR with other search fields.
  if(startDate||endDate)conditions.push({capturedAt:{...(startDate?{gte:`${startDate}T00:00:00`}:{}),...(endDate?{lte:`${endDate}T23:59:59`}:{})}});
  return {AND:[
    {share:{published:true}},
    {latitude:{gte:south,lte:north}},
    west<east?{longitude:{gte:west,lte:east}}:{OR:[{longitude:{gte:west}},{longitude:{lte:east}}]},
    ...(conditions.length?[{OR:conditions}]:[]),
  ]};
}
