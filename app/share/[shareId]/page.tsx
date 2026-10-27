import Link from "next/link";
import {notFound} from "next/navigation";
import {z} from "zod";
import {Camera,MapPin,CalendarDays} from "lucide-react";
import {toolboxFetch} from "@/lib/toolbox/service";
const shareSchema=z.object({eventName:z.string(),tags:z.array(z.string()),photos:z.array(z.object({id:z.string(),name:z.string(),latitude:z.number(),longitude:z.number(),capturedAt:z.string(),capturedOffset:z.string().nullable(),caption:z.string().optional()}))});
export const dynamic="force-dynamic";
export default async function PublicPhotoShare({params}:{params:Promise<{shareId:string}>}) {
  const {shareId}=await params;
  if(!z.string().uuid().safeParse(shareId).success)notFound();
  const result=await toolboxFetch(`/shares/${shareId}`).then(async response=>{
    if(response.status===404)return {share:null,unavailable:false};
    if(!response.ok)throw new Error("Service unavailable");
    return {share:shareSchema.parse(await response.json()),unavailable:false};
  }).catch(()=>({share:null,unavailable:true}));
  if(result.unavailable)return <main className="shell py-16"><h1 className="text-xl font-semibold">ไม่สามารถโหลดภาพได้ในขณะนี้</h1><p className="mt-3 text-slate-500">กรุณาลองเปิดลิงก์นี้อีกครั้งภายหลัง</p></main>;
  if(!result.share)notFound();
  const share=result.share;
  return <main className="min-h-screen bg-slate-50"><header className="border-b bg-white"><div className="shell flex items-center justify-between py-5"><Link href="/" className="font-bold text-teal-700">ThaiWater GIS</Link><span className="flex items-center gap-2 text-xs text-slate-500"><Camera size={16}/>Public Photos</span></div></header><div className="shell py-8"><h1 className="text-2xl font-bold">{share.eventName}</h1><div className="mt-3 flex flex-wrap gap-2">{share.tags.map(tag=><span key={tag} className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs text-teal-800">#{tag}</span>)}</div><p className="mt-3 text-sm text-slate-500">{share.photos.length} ภาพ · พิกัดและวันเวลาถ่ายจาก EXIF ของแต่ละภาพ</p><div className="mt-6 grid gap-6 md:grid-cols-2">{share.photos.map(photo=><article key={photo.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={`/api/photo-shares/${shareId}/photos/${photo.id}`} alt={photo.caption||photo.name} loading="lazy" className="h-80 w-full bg-slate-100 object-contain"/>
    <div className="space-y-2 p-4 text-sm"><h2 className="break-words font-semibold">{photo.name}</h2>{photo.caption&&<p className="whitespace-pre-line break-words leading-6 text-slate-800">{photo.caption}</p>}<p className="flex items-center gap-2 text-slate-600"><MapPin size={15}/>{photo.latitude.toFixed(6)}, {photo.longitude.toFixed(6)} · WGS84</p><p className="flex items-start gap-2 text-slate-600"><CalendarDays size={15} className="mt-0.5 shrink-0"/>{photo.capturedAt.replace("T"," ")} {photo.capturedOffset?`UTC${photo.capturedOffset}`:"(เวลาตามกล้อง ไม่ระบุเขตเวลา)"}</p></div>
  </article>)}</div></div></main>;
}
