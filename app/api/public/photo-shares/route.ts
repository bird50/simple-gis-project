import {proxyToolbox} from "@/lib/toolbox/service";
import {publicPhotoSetSearch} from "@/lib/toolbox/public-query";
export function GET(request:Request){
 const query=publicPhotoSetSearch(new URL(request.url).searchParams);
 if(!query)return Response.json({error:"เงื่อนไขค้นหาไม่ถูกต้อง"},{status:400});
 return proxyToolbox(request,`/public/photo-shares?${query}`);
}
