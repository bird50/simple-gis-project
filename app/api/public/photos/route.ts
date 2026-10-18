import {NextRequest,NextResponse} from "next/server";
import {publicPhotoWhere} from "@/lib/photos/public-search";
import {db} from "@/lib/db";
import {publicPhotoQuery} from "@/lib/gis/public-photo-query";

export async function GET(request:NextRequest) {
  const parsed=publicPhotoQuery.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if(!parsed.success)return NextResponse.json({error:"กรุณาตรวจสอบพื้นที่ เงื่อนไขค้นหา และช่วงวันที่ (วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น)"},{status:400});
  const {limit}=parsed.data;
  try {
    const rows=await db.sharedPhoto.findMany({
      where:publicPhotoWhere(parsed.data),
      orderBy:{id:"desc"},take:limit+1,
      select:{id:true,name:true,shareId:true,longitude:true,latitude:true,capturedAt:true,capturedOffset:true,share:{select:{eventName:true,tags:true,owner:{select:{username:true}}}}},
    });
    return NextResponse.json({photos:rows.slice(0,limit).map(photo=>({id:photo.id,name:photo.name,longitude:photo.longitude,latitude:photo.latitude,capturedAt:photo.capturedAt,capturedOffset:photo.capturedOffset,eventName:photo.share.eventName,username:photo.share.owner.username,tags:photo.share.tags,url:`/api/photo-shares/${photo.shareId}/photos/${photo.id}`,shareUrl:`/share/${photo.shareId}`})),hasMore:rows.length>limit},{headers:{"Cache-Control":"no-store"}});
  } catch(error){
    console.error("Public Photos query failed",JSON.stringify({name:error instanceof Error?error.name:"UnknownError",code:typeof error==="object"&&error!==null&&"code" in error?String(error.code):undefined,modelAvailable:!!db.sharedPhoto,validationField:error instanceof Error?error.message.match(/Unknown (?:argument|field) `([A-Za-z0-9_]+)`/)?.[1]:undefined}));
    return NextResponse.json({error:"ไม่สามารถโหลด Public Photos ได้ในขณะนี้"},{status:503});}
}
