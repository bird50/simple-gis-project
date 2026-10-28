import {proxyToolbox} from "@/lib/toolbox/service";
import {publicPhotoSearch} from "@/lib/toolbox/queries/photos";
export function GET(request:Request){
 const query=publicPhotoSearch(new URL(request.url).searchParams);
 if(!query)return Response.json({error:"เงื่อนไขค้นหาไม่ถูกต้อง"},{status:400});
 return proxyToolbox(request,`/public/photos?${query}`);
}
