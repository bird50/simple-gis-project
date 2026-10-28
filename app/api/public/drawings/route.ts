import {proxyToolbox} from "@/lib/toolbox/service";
import {publicDrawingSearch} from "@/lib/toolbox/queries/drawings";
export function GET(request:Request){
 const query=publicDrawingSearch(new URL(request.url).searchParams);
 if(!query)return Response.json({error:"พื้นที่ค้นหาไม่ถูกต้อง"},{status:400});
 return proxyToolbox(request,`/public/drawings?${query}`);
}
