"use client";
import {PanelSplitter,ToolboxProvider,ToolOverlays,ToolDialogs,useDrawingToolbar,useLayerSettings,useLayers} from "@thaiwater/toolbox-sdk/react";
import {MapLibreToolboxBridge,RegistryLayers,interactiveRegistryIds} from "@thaiwater/toolbox-sdk/maplibre";
import {createLayerRegistry,type LayerDefinition} from "@thaiwater/toolbox-sdk";
import {toolboxRuntime} from "@/lib/toolbox/runtime";
import Map,{NavigationControl,FullscreenControl,ScaleControl,Popup,type MapMouseEvent,type MapRef} from "react-map-gl/maplibre";
import {useEffect,useRef,useState} from "react";
import {Layers,Search,MapPinned,PanelLeftClose,PanelLeftOpen,ChevronDown,ChevronUp,LocateFixed,Table2,Database,Info,X,Wrench,Settings,Eye,EyeOff,Camera,Pencil,Globe,Radio,FileUp} from "lucide-react";
import {MapToolbox} from "@/components/map/MapToolbox";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {cn} from "@/lib/utils";
import {basemaps} from "@/config/basemaps";
import {layerRegistry} from "@/config/layers";
import {toolPlugins} from "@/config/toolboxes";
import type {SessionUser} from "@/types/auth";
import type {Feature,FeatureCollection,Point} from "geojson";
const stations:FeatureCollection={type:"FeatureCollection",features:[{type:"Feature",properties:{station_code:"P.1",station_name:"สถานีสะพานนวรัฐ",province:"เชียงใหม่",level:"2.84 m"},geometry:{type:"Point",coordinates:[98.99,18.79]}},{type:"Feature",properties:{station_code:"N.5A",station_name:"สถานีเมืองพิษณุโลก",province:"พิษณุโลก",level:"4.12 m"},geometry:{type:"Point",coordinates:[100.26,16.82]}},{type:"Feature",properties:{station_code:"C.2",station_name:"สถานีค่ายจิรประวัติ",province:"นครสวรรค์",level:"5.30 m"},geometry:{type:"Point",coordinates:[100.14,15.7]}},{type:"Feature",properties:{station_code:"M.7",station_name:"สถานีอุบลราชธานี",province:"อุบลราชธานี",level:"3.67 m"},geometry:{type:"Point",coordinates:[104.86,15.24]}},{type:"Feature",properties:{station_code:"X.40",station_name:"สถานีสุราษฎร์ธานี",province:"สุราษฎร์ธานี",level:"1.92 m"},geometry:{type:"Point",coordinates:[99.33,9.14]}}]};

export function GISMap({user}:{user:SessionUser}) {return <GISRoot key={user.id} user={user}/>;}
/** One layer registry and tool workspace per user; toolbox plugins register their layers above the system layers. */
function GISRoot({user}:{user:SessionUser}) {
  const [registry]=useState(()=>createLayerRegistry(layerRegistry,user.role));
  return <ToolboxProvider runtime={toolboxRuntime} registry={registry} plugins={toolPlugins} user={{id:user.id,accessLevel:user.role}} toolLayers="start"><GISWorkspace/></ToolboxProvider>;
}
/** Settings button for toolbox layers that declare a settings dialog (My Data Files, Public Photos). */
function LayerSettingsButton({layer}:{layer:LayerDefinition}) {
  const settings=useLayerSettings(layer.id);
  return settings?<Button variant="ghost" size="icon" className="size-7 shrink-0 text-sky-600" title={`ตั้งค่า ${layer.title}`} aria-label={`ตั้งค่าชั้นข้อมูล ${layer.title}`} aria-haspopup="dialog" aria-expanded={settings.open} onClick={event=>settings.show(event.currentTarget)}><Settings/></Button>:null;
}
function GISWorkspace() {
  const mapRef=useRef<MapRef>(null);
  const {layers:allowed,registry,visible,opacity}=useLayers();
  const [drawingToolbar]=useDrawingToolbar("thaiwater.draw");
  const [base,setBase]=useState(0);
  const [coords,setCoords]=useState([100.5,13.5]);
  const [popup,setPopup]=useState<{lng:number;lat:number;data:Record<string,unknown>}|null>(null);
  const [query,setQuery]=useState("");
  const [sidebar,setSidebar]=useState(false);
  const [toolbox,setToolbox]=useState(false);
  const [table,setTable]=useState(false);
  const [legend,setLegend]=useState(false);
  const [expandedLayers,setExpandedLayers]=useState<Record<string,boolean>>({});
  const [layerInfo,setLayerInfo]=useState<Record<string,boolean>>({});
  const [sidebarWidth,setSidebarWidth]=useState(320);
  const [toolboxWidth,setToolboxWidth]=useState(288);
  const [tableHeight,setTableHeight]=useState(230);
  const workspaceRef=useRef<HTMLDivElement>(null);
  const [workspaceSize,setWorkspaceSize]=useState({width:1024,height:640});
  useEffect(()=>{
    const element=workspaceRef.current;
    if(!element)return;
    const observer=new ResizeObserver(([entry])=>setWorkspaceSize({width:entry.contentRect.width,height:entry.contentRect.height}));
    observer.observe(element);
    return ()=>observer.disconnect();
  },[]);
  const panelMax=Math.max(240,Math.min(520,workspaceSize.width-80));
  const tableMax=Math.max(120,Math.floor(workspaceSize.height*.65));
  const [loading,setLoading]=useState(true);
  const [mapError,setMapError]=useState(false);
  useEffect(()=>{mapRef.current?.resize();},[sidebar,table,toolbox,sidebarWidth,toolboxWidth,tableHeight,workspaceSize]);
  // The drawing toolbar sits over the map's right edge: when it opens on a narrower screen, close the Toolbox (once, so it can be reopened).
  const [seenToolbar,setSeenToolbar]=useState(drawingToolbar);
  if(drawingToolbar!==seenToolbar){setSeenToolbar(drawingToolbar);if(drawingToolbar&&window.innerWidth<1280)setToolbox(false);}
  const filtered=stations.features.filter(f=>JSON.stringify(f.properties).toLowerCase().includes(query.toLowerCase()));
  const active=allowed.filter(l=>visible[l.id] && l.url).length;
  function selectStation(f:Feature) {
    const c=(f.geometry as Point).coordinates;
    setPopup({lng:c[0],lat:c[1],data:f.properties||{}});
    mapRef.current?.flyTo({center:[c[0],c[1]],zoom:10,duration:1200});
  }
  function click(e:MapMouseEvent) {
    setCoords([e.lngLat.lng,e.lngLat.lat]);
    const f=e.features?.[0];
    if(f)setPopup({lng:e.lngLat.lng,lat:e.lngLat.lat,data:f.properties||{}});
  }
  return <div className="gis-workspace flex h-[calc(100dvh-64px)] min-h-[480px] flex-col bg-slate-100">
    <div ref={workspaceRef} className="relative flex min-h-0 flex-1">
      {sidebar&&<aside id="map-sidebar" aria-label="จัดการชั้นข้อมูล" style={{width:`min(${Math.min(sidebarWidth,panelMax)}px, calc(100vw - 48px))`}} className="layer-panel absolute inset-y-3 left-3 z-20 flex w-[min(320px,calc(100vw-48px))] shrink-0 flex-col overflow-hidden rounded-[28px] border shadow-xl md:relative md:inset-auto md:my-3 md:ml-3 md:w-80">
        <PanelSplitter label="ปรับความกว้างชั้นข้อมูล" axis="x" value={sidebarWidth} min={240} max={panelMax} onChange={setSidebarWidth} className="right-0"/>
        <div className="shrink-0 border-b border-slate-200 p-4">
          <div className="flex items-start justify-between gap-2">
            <div><h1 className="text-sm font-semibold">แผนที่ทรัพยากรน้ำ</h1><p className="mt-1 text-[11px] leading-5 text-slate-500">สำรวจพื้นที่และข้อมูลสถานีตรวจวัดทั่วประเทศ</p></div>
            <Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label="ซ่อนชั้นข้อมูล" aria-expanded={sidebar} aria-controls="map-sidebar" onClick={()=>setSidebar(false)}><PanelLeftClose/></Button>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-medium text-teal-700">{active} ชั้นข้อมูลที่แสดง</span>
            <Button variant="outline" size="sm" onClick={()=>{mapRef.current?.flyTo({center:[100.5,13.5],zoom:5});setPopup(null);}}><LocateFixed/>ประเทศไทย</Button>
          </div>
        </div>
        <div className="border-b border-slate-100 p-4"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-semibold"><Layers className="size-4 text-teal-700"/>ชั้นข้อมูลแผนที่</div></div><label htmlFor="station-search" className="sr-only">ค้นหาสถานีหรือจังหวัด</label><div className="relative"><Search className="absolute left-3 top-3 size-4 text-slate-400"/><Input id="station-search" className="bg-slate-50 pl-9 pr-8" placeholder="ค้นหาสถานี หรือจังหวัด…" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button aria-label="ล้างคำค้นหา" onClick={()=>setQuery("")} className="absolute right-2 top-2 rounded p-1 text-slate-500 focus-visible:ring-2"><X size={16}/></button>}</div>{query&&<div className="mt-2 max-h-44 overflow-auto rounded-lg border border-slate-200" aria-live="polite">{filtered.length?filtered.map(f=><button key={String(f.properties?.station_code)} className="block w-full p-2.5 text-left text-xs hover:bg-teal-50 focus-visible:bg-teal-50" onClick={()=>selectStation(f)}>{String(f.properties?.station_name)}<span className="mt-1 block text-slate-500">{String(f.properties?.province)}</span></button>):<p className="p-3 text-xs text-slate-500">ไม่พบสถานีที่ตรงกับคำค้นหา</p>}</div>}</div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{[...new Set(allowed.map(l=>l.group))].map(group=><div className="mb-6" key={group}><h2 className="mb-2.5 flex items-center justify-between text-[11px] font-semibold text-slate-500">{group}<span>{allowed.filter(l=>l.group===group).length}</span></h2>{allowed.filter(l=>l.group===group).map(l=><div key={l.id} className={cn("layer-row mb-1 rounded-xl border px-2.5 py-1 transition-colors",visible[l.id]&&l.url?"layer-row-active":"layer-row-inactive",l.owner?"layer-row-toolbox":"layer-row-standard")}><div className="flex items-center gap-1"><span className="layer-symbol grid size-6 shrink-0 place-items-center" style={{color:visible[l.id]&&l.url?l.color:undefined}}>{l.owner?.toolId==="thaiwater.photo"?<Camera size={17}/>:l.owner?.toolId==="thaiwater.draw"?<Pencil size={17}/>:l.owner?<FileUp size={17}/>:l.render?.kind==="circle"?<Radio size={17}/>:<Globe size={17}/>}</span><button type="button" className="flex min-w-0 flex-1 items-center gap-1 rounded text-left text-[11px] font-medium leading-4 focus-visible:outline-2 focus-visible:outline-sky-400" aria-expanded={!!expandedLayers[l.id]} aria-controls={`layer-details-${l.id}`} title={l.title} onClick={()=>setExpandedLayers(current=>({...current,[l.id]:!current[l.id]}))}><span className="min-w-0 flex-1 truncate">{l.title}</span>{expandedLayers[l.id]?<ChevronUp className="size-4 shrink-0"/>:<ChevronDown className="size-4 shrink-0"/>}<span className="sr-only">{expandedLayers[l.id]?"ย่อรายละเอียด":"คลี่รายละเอียด"}</span></button><button type="button" aria-label={`คำอธิบาย ${l.title}`} aria-expanded={!!layerInfo[l.id]} aria-controls={`layer-info-${l.id}`} title={l.description} className="grid size-7 shrink-0 place-items-center rounded-full text-slate-400 focus-visible:outline-2 focus-visible:outline-sky-400" onClick={()=>setLayerInfo(current=>({...current,[l.id]:!current[l.id]}))}><Info size={15}/></button><button id={`layer-${l.id}`} type="button" role="switch" aria-checked={!!visible[l.id]&&!!l.url} aria-label={`แสดงชั้นข้อมูล ${l.title}`} disabled={!l.url} title={visible[l.id]&&l.url?"ซ่อนชั้นข้อมูล":"แสดงชั้นข้อมูล"} className="layer-visibility grid size-7 shrink-0 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 disabled:cursor-not-allowed" onClick={()=>registry.setVisible(l.id,!visible[l.id])}>{visible[l.id]&&l.url?<Eye size={18}/>:<EyeOff size={18}/>}</button></div>{layerInfo[l.id]&&<p id={`layer-info-${l.id}`} className="mt-1 border-t border-teal-100 py-2 text-[11px] leading-5 text-slate-500">{l.description}{!l.url&&<span className="mt-1 block text-amber-300">ยังไม่พร้อมใช้งาน</span>}</p>}{expandedLayers[l.id]&&<div id={`layer-details-${l.id}`} className="mt-3 border-t border-teal-100 pt-2.5"><div className="mb-2 flex items-start justify-between gap-2"><p className="text-[10px] leading-5 text-slate-500">{l.url?"ตั้งค่าชั้นข้อมูล":"ยังไม่พร้อมใช้งาน"}</p><LayerSettingsButton layer={l}/></div>{!!l.url&&<><div className="mb-1 flex justify-between text-[10px] text-slate-500"><label htmlFor={`opacity-${l.id}`}>ความทึบ</label><span>{Math.round(opacity[l.id]*100)}%</span></div><input id={`opacity-${l.id}`} className="h-3 w-full cursor-pointer" type="range" min="0" max="1" step=".1" value={opacity[l.id]} onChange={e=>registry.setOpacity(l.id,Number(e.target.value))}/></>}</div>}</div>)}</div>)}<div className="rounded-xl border border-slate-200 p-3"><label htmlFor="basemap" className="mb-3 flex items-center gap-2 text-xs font-semibold"><MapPinned className="size-4 text-slate-500"/>แผนที่ฐาน</label><select id="basemap" className="h-9 w-full rounded-lg border border-input bg-background px-2 text-xs focus-visible:outline-teal-600" value={base} onChange={e=>{setBase(Number(e.target.value));setMapError(false);}}>{basemaps.map((b,i)=><option value={i} key={b.id}>{b.title}</option>)}</select></div></div>
        <div className="flex gap-2 border-t border-slate-100 bg-slate-50 p-4 text-[11px] leading-5 text-slate-500"><Info className="mt-0.5 size-4 shrink-0"/>ข้อมูลสถานีและขอบเขตเป็นข้อมูลตัวอย่างสำหรับสาธิตระบบ</div>
      </aside>}
      <div className="flex min-w-0 flex-1 flex-col">
        <section aria-label="แผนที่ทรัพยากรน้ำ" className="relative min-h-0 flex-1 bg-slate-200"><Map ref={mapRef} onLoad={()=>setLoading(false)} onError={()=>{setLoading(false);setMapError(true)}} initialViewState={{longitude:100.5,latitude:13.5,zoom:5}} mapStyle={basemaps[base].style as never} interactiveLayerIds={interactiveRegistryIds(allowed,visible)} onMouseMove={e=>setCoords([e.lngLat.lng,e.lngLat.lat])} onClick={click} cursor="crosshair"><MapLibreToolboxBridge><NavigationControl position="top-right"/><FullscreenControl position="top-right"/><ScaleControl position="bottom-right" unit="metric"/><RegistryLayers layers={allowed} visible={visible} opacity={opacity} data={{monitoring:stations}}/>{popup&&<Popup longitude={popup.lng} latitude={popup.lat} closeOnClick={false} onClose={()=>setPopup(null)}><div className="min-w-48 p-1"><b className="text-teal-700">ผลการ Identify</b>{Object.entries(popup.data).map(([k,v])=><div className="mt-2 flex justify-between gap-4 text-xs" key={k}><span className="text-slate-400">{k}</span><strong>{String(v)}</strong></div>)}</div></Popup>}<ToolOverlays/></MapLibreToolboxBridge></Map>
          {!toolbox&&<Button variant="outline" size="sm" className="absolute right-14 top-3 z-10 bg-white shadow-sm" aria-expanded={false} aria-controls="map-toolbox" onClick={()=>{setToolbox(true);if(window.innerWidth<768)setSidebar(false);}}><Wrench/>Toolbox</Button>}
          {!sidebar&&<Button variant="outline" size="sm" className="absolute left-3 top-3 z-10 bg-white shadow-sm" aria-label="แสดงชั้นข้อมูล" aria-expanded={sidebar} aria-controls="map-sidebar" onClick={()=>setSidebar(true)}><PanelLeftOpen/>ชั้นข้อมูลแผนที่</Button>}
          {loading&&<div role="status" className="absolute left-1/2 top-4 -translate-x-1/2 rounded-lg border bg-white px-4 py-2 text-xs shadow-sm">กำลังโหลดแผนที่…</div>}
          {mapError&&<div role="alert" className="absolute left-3 top-14 max-w-64 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">โหลดแผนที่บางส่วนไม่สำเร็จ โปรดตรวจสอบการเชื่อมต่อ หรือลองเปลี่ยนแผนที่ฐาน</div>}
          <div className="absolute bottom-3 left-3 z-10 flex gap-2"><Button variant="outline" size="sm" className="bg-white shadow-sm" aria-expanded={table} aria-controls="station-panel" onClick={()=>setTable(value=>!value)}><Table2/>ตารางสถานี</Button><Button variant="outline" size="sm" className="bg-white shadow-sm" aria-expanded={legend} aria-controls="map-legend" onClick={()=>setLegend(value=>!value)}><Layers/>สัญลักษณ์</Button></div>
          {legend&&<div id="map-legend" className="absolute bottom-14 left-3 right-3 w-fit max-w-[calc(100%-24px)] rounded-lg border border-white/80 bg-white/95 px-3 py-2 shadow-sm sm:block"><p className="mb-2 text-[10px] font-semibold text-slate-500">สัญลักษณ์แผนที่</p><div className="flex flex-wrap gap-3">{allowed.filter(l=>visible[l.id]&&l.url).map(l=><span key={l.id} className="flex items-center gap-1.5 text-[10px]"><i className="size-2.5 rounded-full" style={{background:l.color}}/>{l.legend}</span>)}{active===0&&<span className="text-[10px] text-slate-500">ยังไม่ได้เปิดชั้นข้อมูล</span>}</div></div>}
        </section>
        {table&&<section id="station-panel" aria-label="ตารางสถานีตรวจวัด" style={{height:Math.min(tableHeight,tableMax)}} className="relative flex min-h-0 shrink-0 flex-col border-t border-slate-200 bg-white"><PanelSplitter label="ปรับความสูงตารางสถานี" axis="y" direction={-1} value={tableHeight} min={120} max={tableMax} onChange={setTableHeight} className="top-0"/><div className="flex h-12 shrink-0 items-center justify-between gap-2 px-4"><div className="flex items-center gap-2"><Table2 className="size-4 text-teal-700"/><h2 className="text-xs font-semibold">สถานีตรวจวัดน้ำ</h2><span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">{filtered.length} รายการ</span></div><Button variant="ghost" size="sm" aria-expanded={table} aria-controls="station-table" onClick={()=>setTable(!table)}>{table?<ChevronDown/>:<ChevronUp/>}<span className="hidden sm:inline">{table?"ซ่อนตาราง":"แสดงตาราง"}</span></Button></div>{table&&<div id="station-table" className="min-h-0 flex-1 overflow-auto border-t border-slate-100"><table className="w-full min-w-[520px] text-left text-xs"><thead className="sticky top-0 bg-slate-50 text-[10px] text-slate-500"><tr>{["รหัสสถานี","ชื่อสถานี / เลือกเพื่อดูบนแผนที่","จังหวัด","ระดับน้ำ (ม.)"].map(h=><th key={h} className="px-4 py-2 font-medium">{h}</th>)}</tr></thead><tbody>{filtered.map(f=><tr className={cn("border-t border-slate-100 hover:bg-teal-50/60",popup?.data.station_code===f.properties?.station_code&&"bg-teal-50")} key={String(f.properties?.station_code)}><td className="px-4 py-2 font-mono text-teal-700">{String(f.properties?.station_code)}</td><td className="px-4 py-2"><button className="text-left font-medium hover:text-teal-700 focus-visible:underline" onClick={()=>selectStation(f)}>{String(f.properties?.station_name)}</button></td><td className="px-4 py-2 text-slate-500">{String(f.properties?.province)}</td><td className="px-4 py-2 font-mono">{String(f.properties?.level).replace(" m","")}</td></tr>)}{!filtered.length&&<tr><td colSpan={4} className="p-6 text-center text-slate-500">ไม่พบสถานี ลองค้นหาด้วยชื่อสถานีหรือจังหวัดอื่น</td></tr>}</tbody></table></div>}</section>}
      </div>
      <MapToolbox hidden={!toolbox} onClose={()=>setToolbox(false)} width={Math.min(toolboxWidth,panelMax)} maxWidth={panelMax} onWidthChange={setToolboxWidth}/>
      <ToolDialogs/>
    </div>
    <footer className="flex h-7 shrink-0 items-center justify-between border-t border-slate-200 bg-white px-3 text-[10px] text-slate-500"><span className="flex items-center gap-1.5"><Database size={11}/>ข้อมูลตัวอย่าง · {stations.features.length} สถานี</span><span className="font-mono">{coords[1].toFixed(4)}, {coords[0].toFixed(4)} <span className="hidden sm:inline">· WGS84</span></span></footer>
  </div>;
}
