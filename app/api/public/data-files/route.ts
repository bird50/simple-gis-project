import {proxyToolbox} from "@/lib/toolbox/service";
import {publicDataFileSearch} from "@/lib/toolbox/public-query";
export function GET(request:Request){
 const query=publicDataFileSearch(new URL(request.url).searchParams);
 if(!query)return Response.json({error:"พื้นที่ค้นหาไม่ถูกต้อง"},{status:400});
 return proxyToolbox(request,`/public/data-files?${query}`);
}
