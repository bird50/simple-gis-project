import {NextResponse} from "next/server";
import {z} from "zod";
import {requireUser} from "@/lib/auth/permissions";
import {db} from "@/lib/db";
import {automaticShareTag,MAX_SHARE_PHOTOS,shareFields} from "@/lib/gis/photo-share";
import {boundedFormData,PhotoUploadError,prepareSharedPhoto} from "@/lib/photos/upload";

export const runtime="nodejs";

export async function POST(request:Request) {
  const auth=await requireUser();
  if("error" in auth)return auth.error;
  const origin=request.headers.get("origin");
  if(origin){
    let sameOrigin=false;
    try {const url=new URL(origin);sameOrigin=["http:","https:"].includes(url.protocol)&&url.host===(request.headers.get("host")??new URL(request.url).host);}catch {}
    if(!sameOrigin)return NextResponse.json({error:"ไม่อนุญาตคำขอจากเว็บไซต์อื่น"},{status:403});
  }
  try {
    const owner=await db.user.findUnique({where:{id:auth.user.id},select:{status:true}});
    if(owner?.status!=="ACTIVE")return NextResponse.json({error:"บัญชีนี้ไม่สามารถแชร์ภาพได้"},{status:403});
    const form=await boundedFormData(request);
    let tags:unknown;
    try {tags=JSON.parse(String(form.get("tags")??"[]"));}catch {throw new PhotoUploadError("รูปแบบแท็กไม่ถูกต้อง");}
    const fields=shareFields.parse({eventName:form.get("eventName"),tags});
    const files=form.getAll("photos");
    if(!files.length||files.length>MAX_SHARE_PHOTOS||files.some(file=>!(file instanceof File)))throw new PhotoUploadError("เลือกภาพตั้งแต่ 1 ถึง 10 รูปต่อการแชร์");
    const photos:Awaited<ReturnType<typeof prepareSharedPhoto>>[]=[];
    for(const [index,file] of (files as File[]).entries())photos.push(await prepareSharedPhoto(file,index));
    const now=new Date();
    const tag=automaticShareTag(now);
    const share=await db.$transaction(async tx=>{
      const created=await tx.photoShare.create({data:{ownerId:auth.user.id,eventName:fields.eventName,tags:[tag,...new Set(fields.tags)],createdAt:now,photos:{create:photos}},select:{id:true,tags:true}});
      await tx.auditLog.create({data:{userId:auth.user.id,action:"PHOTO_SHARE_PUBLISHED",resource:"PhotoShare",resourceId:created.id}});
      return created;
    });
    return NextResponse.json({...share,url:`/share/${share.id}`},{status:201});
  } catch(error){
    if(error instanceof PhotoUploadError)return NextResponse.json({error:error.message},{status:error.status});
    if(error instanceof z.ZodError)return NextResponse.json({error:"กรุณาระบุชื่อเหตุการณ์ไม่เกิน 160 ตัวอักษร และแท็กไม่เกิน 10 แท็ก (แท็กละ 50 ตัวอักษร) ห้ามกำหนดแท็กวันที่แชร์เอง"},{status:400});
    return NextResponse.json({error:"บันทึกภาพ Public ไม่สำเร็จ กรุณาลองใหม่ภายหลัง"},{status:503});
  }
}
