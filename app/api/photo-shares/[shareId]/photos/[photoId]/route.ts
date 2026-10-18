import {NextResponse} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db";
const paramsSchema=z.object({shareId:z.string().cuid(),photoId:z.string().cuid()});
export async function GET(_request:Request,{params}:{params:Promise<{shareId:string;photoId:string}>}) {
  const parsed=paramsSchema.safeParse(await params);
  if(!parsed.success)return NextResponse.json({error:"ไม่พบภาพ"},{status:404});
  try {
    const photo=await db.sharedPhoto.findFirst({where:{id:parsed.data.photoId,shareId:parsed.data.shareId,share:{published:true}},select:{image:true,mimeType:true}});
    if(!photo)return NextResponse.json({error:"ไม่พบภาพ"},{status:404});
    return new Response(new Uint8Array(photo.image),{headers:{"Content-Type":"image/jpeg","X-Content-Type-Options":"nosniff","Content-Disposition":"inline; filename=photo.jpg","Cache-Control":"no-store","Content-Security-Policy":"default-src 'none'; sandbox"}});
  } catch {return NextResponse.json({error:"ไม่สามารถโหลดภาพได้ในขณะนี้"},{status:503});}
}
