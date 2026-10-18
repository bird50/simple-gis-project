"use client";

import {Camera,PanelRightClose,Wrench,Settings} from "lucide-react";
import type {PublicPhotoStatus} from "@/components/map/PhotoLayers";
import {Button} from "@/components/ui/button";
import {Switch} from "@/components/ui/switch";

export function MapToolbox({onClose,hidden,count,layerVisible,onLayerVisible,publicVisible,onPublicVisible,publicStatus,onPublicSettings,publicSettingsOpen,filterCount}:{onClose:()=>void;hidden:boolean;count:number;layerVisible:boolean;onLayerVisible:(visible:boolean)=>void;publicVisible:boolean;onPublicVisible:(visible:boolean)=>void;publicStatus:PublicPhotoStatus;onPublicSettings:(trigger:HTMLButtonElement)=>void;publicSettingsOpen:boolean;filterCount:number}) {
  return <aside hidden={hidden} id="map-toolbox" aria-label="Toolbox" className={`${hidden?"hidden":"flex"} absolute inset-y-0 right-0 z-30 w-[min(288px,calc(100vw-48px))] shrink-0 flex-col border-l border-slate-200 bg-white shadow-xl xl:relative xl:w-72 xl:shadow-none`}>
    <div className="flex shrink-0 items-center justify-between border-b border-slate-200 p-4">
      <div><h2 className="flex items-center gap-2 text-sm font-semibold"><Wrench className="size-4 text-teal-700"/>Toolbox</h2><p className="mt-1 text-[11px] text-slate-500">เครื่องมือสำหรับพื้นที่ปฏิบัติงาน</p></div>
      <Button variant="ghost" size="icon" className="size-8" aria-label="ซ่อน Toolbox" aria-expanded={true} aria-controls="map-toolbox" onClick={onClose}><PanelRightClose/></Button>
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <section aria-labelledby="photo-tool-title" className="overflow-hidden rounded-xl border border-slate-200">
        <h3 id="photo-tool-title" className="flex items-center gap-2 border-b border-slate-100 p-3 text-sm font-semibold"><Camera className="size-4 text-teal-700"/>Photo</h3>
        <div className="flex items-center justify-between gap-2 p-3"><label htmlFor="my-photos-layer" className="text-xs font-semibold">Layer My Photos <span className="font-normal text-slate-500">({count})</span></label><Switch id="my-photos-layer" checked={layerVisible} onCheckedChange={onLayerVisible}/></div>
        <p className="px-3 pb-3 text-[10px] leading-5 text-slate-500">เก็บรูปบนเบราว์เซอร์นี้ 15 วันนับจากวันที่เพิ่ม ไม่อัปโหลดไปเซิร์ฟเวอร์</p>
        <div className="border-t border-slate-100 p-3"><div className="flex items-center justify-between gap-2"><label htmlFor="public-photos-layer" className="text-xs font-semibold">Layer Public Photos <span className="font-normal text-slate-500">{publicVisible?`(${publicStatus.count})`:""}</span></label><Button id="toolbox-public-photos-settings" variant="ghost" size="icon" className="size-7 shrink-0 text-sky-600" aria-label="ตั้งค่า Public Photos" aria-haspopup="dialog" aria-expanded={publicSettingsOpen} onClick={event=>onPublicSettings(event.currentTarget)}><Settings/></Button><Switch id="public-photos-layer" checked={publicVisible} onCheckedChange={onPublicVisible}/></div><p className="mt-2 text-[10px] leading-5 text-slate-500">ภาพที่แชร์สาธารณะในพื้นที่แผนที่ปัจจุบัน{filterCount>0&&` · ใช้เงื่อนไขค้นหา ${filterCount} รายการ`}</p>{publicVisible&&<p role={publicStatus.error?"alert":"status"} className={`mt-1 text-[11px] leading-5 ${publicStatus.error?"text-amber-700":"text-slate-500"}`}>{publicStatus.loading?"กำลังโหลด Public Photos…":publicStatus.error|| (publicStatus.hasMore?"มีภาพเพิ่มเติม กรุณาซูมเข้าเพื่อดูครบ":!publicStatus.count?"ไม่พบภาพ Public ในพื้นที่นี้":"")}</p>}</div>
      </section>
    </div>
  </aside>;
}
