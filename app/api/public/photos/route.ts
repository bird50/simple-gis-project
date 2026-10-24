import {proxyToolbox} from "@/lib/toolbox/service";
import {publicPhotoQuery} from "@/lib/gis/public-photo-query";
export function GET(request:Request){
 const query=new URL(request.url).searchParams;
 if(!publicPhotoQuery.safeParse(Object.fromEntries(query)).success)return Response.json({error:"เงื่อนไขค้นหาไม่ถูกต้อง"},{status:400});
 return proxyToolbox(request,`/public/photos?${query}`);
}
