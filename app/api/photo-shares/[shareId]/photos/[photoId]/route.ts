import {z} from "zod";
import {proxyToolbox} from "@/lib/toolbox/service";
export async function GET(request:Request,{params}:{params:Promise<{shareId:string;photoId:string}>}){
 const parsed=z.object({shareId:z.string().uuid(),photoId:z.string().uuid()}).safeParse(await params);
 if(!parsed.success)return Response.json({error:"ไม่พบภาพ"},{status:404});
 return proxyToolbox(request,`/shares/${parsed.data.shareId}/photos/${parsed.data.photoId}`);
}
