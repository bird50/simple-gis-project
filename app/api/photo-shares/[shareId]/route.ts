import {z} from "zod";
import {proxyToolbox} from "@/lib/toolbox/service";
/** Public: one photo set (name, tags, user, photo metadata) for Add to map, read with the read-only key. */
export async function GET(request:Request,{params}:{params:Promise<{shareId:string}>}){
 const parsed=z.string().uuid().safeParse((await params).shareId);
 if(!parsed.success)return Response.json({error:"ไม่พบข้อมูล"},{status:404});
 return proxyToolbox(request,`/shares/${parsed.data}`);
}
