"use client";
import {PanelRightClose,Wrench} from "lucide-react";
import {PanelSplitter,ToolboxPanel} from "@thaiwater/toolbox-sdk/react/core";
import {Button} from "@/components/ui/button";
export function MapToolbox(props:{hidden:boolean;onClose:()=>void;width:number;maxWidth:number;onWidthChange:(width:number)=>void}) {
  return <aside hidden={props.hidden} id="map-toolbox" aria-label="Toolbox" style={{width:`min(${props.width}px, calc(100vw - 48px))`}} className={`${props.hidden?"hidden":"flex"} absolute inset-y-0 right-0 z-30 w-[min(288px,calc(100vw-48px))] shrink-0 flex-col border-l border-slate-200 bg-white shadow-xl xl:relative xl:w-72 xl:shadow-none`}>
    <PanelSplitter label="ปรับความกว้าง Toolbox" axis="x" direction={-1} value={props.width} min={240} max={props.maxWidth} onChange={props.onWidthChange} className="left-0"/>
    <div className="flex shrink-0 items-center justify-between border-b border-slate-200 p-4">
      <div><h2 className="flex items-center gap-2 text-sm font-semibold"><Wrench className="size-4 text-teal-700"/>Toolbox</h2><p className="mt-1 text-[11px] text-slate-500">เครื่องมือสำหรับพื้นที่ปฏิบัติงาน</p></div>
      <Button variant="ghost" size="icon" className="size-8" aria-label="ซ่อน Toolbox" aria-expanded={true} aria-controls="map-toolbox" onClick={props.onClose}><PanelRightClose/></Button>
    </div>
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4"><ToolboxPanel/></div>
  </aside>;
}
