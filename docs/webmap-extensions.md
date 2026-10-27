# Webmap extension API (Tool API 2.0)

โครงสร้างนี้เป็นสัญญาของโครงการสำหรับ React/TypeScript ไม่ใช่มาตรฐาน OGC หรือระบบติดตั้ง JavaScript จาก URL ภายนอก ส่วนขยายต้องผ่านการตรวจโค้ดและรวมเข้ากับ build ของแอป

เว็บนี้ใช้ `@thaiwater/toolbox-sdk` 1.0 ซึ่งมีเฉพาะ Tool API 2.0 (plugin); Host API 1.0 (`WebmapHost`, `ToolboxHost`, `WorkspaceToolServices`) และฟิลด์ `photoDataKey`/`drawingDataKey`/`toolboxId` ถูกถอดออกแล้ว layer ของเครื่องมือระบุด้วย `owner.toolId` ดูรายการเปลี่ยนแปลงใน `../toolbox_sdk/CHANGELOG.md`

## ส่วนประกอบ

- `config/toolboxes.tsx`: รายการ plugin (`toolPlugins`) ตามลำดับใน Toolbox Panel เพิ่ม/ถอด/เรียงเครื่องมือที่นี่ แต่ละ plugin ลงทะเบียน layer ของตัวเอง
- `config/layers.ts`: layer ของระบบเท่านั้น (ลุ่มน้ำ สถานี พื้นที่เสี่ยง) ไม่รวม layer ของ Toolbox
- `components/map/GISMap.tsx`: สร้าง LayerRegistry ต่อผู้ใช้ ครอบ workspace ด้วย `ToolboxProvider` (`plugins`, `registry`, `user`, `toolLayers="start"`) วาง `<ToolOverlays/>` ใน `MapLibreToolboxBridge` และ `<ToolDialogs/>` หนึ่งครั้ง
- `components/map/MapToolbox.tsx`: กรอบ Toolbox Panel ของเว็บ (หัวข้อ ปุ่มปิด ตัวปรับความกว้าง) ที่แสดง `<ToolboxPanel/>`
- `components/map/RegistryLayers.tsx`: renderer GeoJSON fill/line/circle ของ layer ระบบ พร้อม cluster สำหรับจุด โดยใช้ ID ที่สร้างจาก layer ID

## 3 Panels

| Panel | ในเว็บนี้ | จาก SDK |
| --- | --- | --- |
| Map | `<Map>` ของ react-map-gl, basemap, layer ระบบ, Identify popup | `<ToolOverlays/>` (Data Files ผ่าน GeoJSON surface, Drawing SVG, Photo markers/popup แบบ HTML) |
| Layer | sidebar ของเว็บ อ่าน/เขียน registry ผ่าน `useLayers()` และใช้ `useLayerSettings(layerId)` แสดงปุ่มตั้งค่าของ layer Toolbox | registry เดียวกับ Toolbox |
| Toolbox | `MapToolbox` | `<ToolboxPanel/>` และ `<ToolDialogs/>` |

## เพิ่มเครื่องมือ

```tsx
import {TOOL_API_VERSION,useLayers,useMapAdapter,useToolState,type ToolPlugin} from "@thaiwater/toolbox-sdk/react/core";
export function myTool():ToolPlugin {
  return {id:"organization.my-tool",title:"เครื่องมือของฉัน",version:"1.0.0",apiVersion:TOOL_API_VERSION,
    accessLevel:"MEMBER",requires:["map.navigate"],
    layers:[/* LayerDefinition ของเครื่องมือ (ถ้ามี) */],
    Panel:MyPanel, Overlay:MyOverlay, Dialogs:MyDialogs, Controller:MyController};
}
```

แล้วเพิ่มใน `toolPlugins` ID ต้องไม่ซ้ำและใช้ namespace องค์กร; `version` เป็นเวอร์ชันเครื่องมือ ส่วน `apiVersion` ต้องเป็น `"2.0"` เครื่องมือประกาศ capability เท่าที่ต้องใช้ (`map.navigate`, `map.viewport`, `map.project`, `map.events`, `map.pointer`, `map.geojson`, `map.overlay`) และ mount เมื่อแผนที่พร้อม ส่วนประกอบของเครื่องมือใช้ state ร่วมกันผ่าน `useToolState`, เปิด dialog ผ่าน `useToolDialog` (เปิดได้ครั้งละหนึ่ง dialog ทั้ง workspace) และอ่าน/เปลี่ยน layer ผ่าน `useLayers`/`useToolLayers` โดยไม่เข้าถึง state ภายใน GISMap Hooks ต้องคืน cleanup เพื่อถอด listeners, ยกเลิก fetch และล้าง object URLs ส่วน async errors ต้องแสดง error state ในเครื่องมือเอง (error boundary จับเฉพาะ render errors) รายละเอียดสัญญาอยู่ใน `../toolbox_sdk/README.md`

## เพิ่ม Layer

Layer ระบบ: เพิ่ม `LayerDefinition` ใน `config/layers.ts` โดยระบุ metadata, accessLevel, min/maxZoom, opacity, legend, popupFields และ `render: {kind:"fill"|"line"|"circle"}` สำหรับไฟล์ GeoJSON ขนาดเล็ก ใช้ `render.cluster:true` ได้สำหรับ circle

ข้อมูล API ให้ provider ส่ง `FeatureCollection` ผ่าน `dataKey` เข้า RegistryLayers โดย provider รับผิดชอบ bbox validation, debounce/cancellation, ขนาดผลลัพธ์ และ loading/error/empty UI; renderer ไม่ดาวน์โหลด REST API ทั้งชุดเอง สถานีโหลดผ่าน `components/map/useStations.ts` (bbox ของแผนที่, debounce 300 ms, ยกเลิกคำขอเก่า, สูงสุด 500 จุด, ใช้ข้อมูลตัวอย่างเมื่อ API ตอบ error) แล้วส่งผ่าน dataKey `monitoring`

ตารางข้อมูล: `components/map/LayerDataSources.tsx` ส่ง layer ระบบเข้า Data Panel ของ SDK ด้วย `useDataSource` — layer ที่มี `render.dataKey` ใช้ข้อมูลชุดเดียวกับแผนที่ ส่วนไฟล์ GeoJSON ขนาดเล็ก (`type:"GEOJSON"`, URL ขึ้นต้นด้วย `/`) โหลดครั้งเดียวเมื่อเปิด layer ครั้งแรก (สูงสุด 5,000 แถว) WMS/tiles ไม่มีแถวข้อมูล คอลัมน์เรียงตาม `popupFields` และหัวคอลัมน์ภาษาไทยอยู่ใน `fieldLabels` เครื่องมือของ Toolbox ส่งข้อมูลของตัวเองได้ด้วย `useDataSource` ใน Controller (Data Files ทำอยู่แล้ว)

Layer ของ Toolbox มาจาก plugin (`my-data-files`, `public-data-files`, `my-drawing`, `public-drawing` และ layer ที่ plugin Photo เพิ่ม-ลบเองตามชุดที่กด Add to map: `my-photos/<eventId>` ชื่อ "My Photos/ชื่อเหตุการณ์" และ `public-photos/<shareId>` ชื่อ "Public Photos/ชื่อชุด") และมี `owner.toolId`; ปรับชื่อ/สี/สิทธิ์ได้ด้วย option ของ factory เช่น `drawTool({mine:{title:"..."}})` และต้องไม่ซ้ำกับ ID ใน `config/layers.ts` มิฉะนั้นเครื่องมือนั้นจะไม่ถูก mount และ Toolbox แสดงข้อความแจ้ง `GET /api/gis/layers` และหน้า `/admin/layers` แสดงเฉพาะ layer ระบบ

WMS/WFS/vector/raster/ArcGIS ยังไม่มี renderer ใน RegistryLayers นี้ ต้องเพิ่ม adapter ตามชนิดข้อมูลก่อนเปิดใช้งาน ข้อมูลขนาดใหญ่ใช้ PostGIS/MVT ตามแนวทาง README

## สิทธิ์และความปลอดภัย

Access level และ capability ใช้ควบคุม UI เท่านั้น ไม่ใช่ sandbox สำหรับโค้ดเครื่องมือ API ที่มีสิทธิ์ยังต้องตรวจ `requireUser()`/`requireAdmin()` ฝั่ง server เสมอ Registry กรอง layer ตาม role ของผู้ใช้ และ adapter ตรวจพิกัด/ซูมก่อนสั่งแผนที่ ไม่มี route หรือ environment variable ใหม่

### Local data files

`render.kind: "mixed"` renders polygon fills/outlines, lines, and points from a single GeoJSON source; its interactive layer IDs have `-fill`, `-line`, and `-point` suffixes. Simple Data Files draws `my-data-files` through the map adapter's GeoJSON surface with the same IDs (`registry-my-data-files-*`), so the web's Identify click keeps working and the layer survives basemap changes. Data persists only in browser IndexedDB; it adds no server route or external data request.

## SDK integration

Core/layer/map contracts, storage และ React components อยู่ในโฟลเดอร์ `../toolbox_sdk` ใช้ LayerRegistry instance เดียวเชื่อม Layer Panel และ Toolbox; ข้อมูลส่วนตัวใช้ storage adapter (`lib/toolbox/runtime.ts` คงชื่อ IndexedDB เดิม) และการแชร์ใช้ PublicClient ซึ่งเรียก gateway ที่ตรวจสิทธิ์ฝั่ง server อีกครั้ง

Next.js ใช้ transpilePackages และ Tailwind @source ของ SDK; ไม่มี Tailwind preflight เพิ่มในเว็บนี้ แอปที่ไม่ใช้ Tailwind import `@thaiwater/toolbox-sdk/styles.css` และตั้ง CSS variables ของตำแหน่ง settings/toolbar ได้
