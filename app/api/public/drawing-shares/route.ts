import {proxyToolbox} from "@/lib/toolbox/service";
import {publicDrawingSetSearch} from "@/lib/toolbox/public-query";
export function GET(request:Request){
 const query=publicDrawingSetSearch(new URL(request.url).searchParams);
 if(!query)return Response.json({error:"เงื่อนไขค้นหาไม่ถูกต้อง"},{status:400});
 return proxyToolbox(request,`/public/drawing-shares?${query}`);
}
