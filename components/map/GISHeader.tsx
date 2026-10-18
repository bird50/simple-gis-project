import Link from "next/link";
import {Droplets,Home,ShieldCheck,User,ChevronRight} from "lucide-react";
import {LogoutButton} from "@/components/auth/LogoutButton";
import {Button} from "@/components/ui/button";
import type {SessionUser} from "@/types/auth";

export function GISHeader({user}:{user:SessionUser}) {
  return <header className="flex h-16 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 md:px-5">
    <div className="flex items-center gap-3"><Link href="/" aria-label="ThaiWater GIS หน้าหลัก" className="grid size-9 place-items-center rounded-xl bg-teal-700 text-white shadow-sm"><Droplets size={21}/></Link><div><b className="block text-sm tracking-tight">ThaiWater <span className="font-normal text-teal-700">GIS</span></b><p className="text-[10px] text-slate-500">ระบบภูมิสารสนเทศทรัพยากรน้ำ</p></div><ChevronRight className="ml-3 hidden size-4 text-slate-300 lg:block"/><span className="hidden text-xs text-slate-500 lg:block">พื้นที่ปฏิบัติงาน</span></div>
    <nav aria-label="เมนูบัญชีผู้ใช้" className="flex items-center gap-1"><Button asChild variant="ghost" size="icon"><Link aria-label="หน้าหลัก" title="หน้าหลัก" href="/"><Home/></Link></Button>{user.role==="ADMIN"&&<Button asChild variant="ghost" size="icon"><Link aria-label="ผู้ดูแลระบบ" title="ผู้ดูแลระบบ" href="/admin"><ShieldCheck/></Link></Button>}<Link className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-teal-600" href="/profile" aria-label={`โปรไฟล์ ${user.firstName}`}><span className="grid size-8 place-items-center rounded-full bg-teal-50 text-teal-700"><User size={16}/></span><span className="hidden md:block"><b className="block text-xs font-medium">{user.firstName}</b><small className="block text-[10px] text-slate-500">{user.role==="ADMIN"?"ผู้ดูแลระบบ":"สมาชิก"}</small></span></Link><div className="ml-1 hidden border-l border-slate-200 pl-2 text-slate-500 sm:block"><LogoutButton compact/></div></nav>
  </header>;
}
