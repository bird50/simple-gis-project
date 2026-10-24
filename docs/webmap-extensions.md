# Webmap extension API 1.0

โครงสร้างนี้เป็นสัญญาของโครงการสำหรับ React/TypeScript ไม่ใช่มาตรฐาน OGC หรือระบบติดตั้ง JavaScript จาก URL ภายนอก ส่วนขยายต้องผ่านการตรวจโค้ดและรวมเข้ากับ build ของแอป

## ส่วนประกอบ

- `lib/webmap/contracts.ts`: API ที่ไม่ผูกกับ map engine มี version, capability, access level และคำสั่ง navigation/layer
- `components/map/ToolboxHost.tsx`: เลือกเครื่องมือที่ API/capability/สิทธิ์รองรับ แสดง panel และแยก render error แต่ละเครื่องมือ
- `config/toolboxes.tsx`: registry ของเครื่องมือ เพิ่ม/ถอด/เรียงเครื่องมือที่นี่
- `config/layers.ts`: metadata และ renderer ของ layer; visibility/opacity ใช้ state ชุดเดียวกับ sidebar และ legend
- `components/map/RegistryLayers.tsx`: renderer GeoJSON fill/line/circle พร้อม cluster สำหรับจุด โดยใช้ ID ที่สร้างจาก layer ID

## เพิ่มและแลกเปลี่ยน Toolbox

สร้าง React component รับ `{host: WebmapHost}` ใช้ `host.navigate`, `host.setLayerVisible`, `host.setLayerOpacity` และอ่าน `host.layers/visible/opacity` ได้โดยไม่เข้าถึง MapLibre หรือ state ภายใน GISMap ตัวอย่างที่ทำงานอยู่คือ `components/map/toolboxes/NavigationTool.tsx`

ลงทะเบียนใน `config/toolboxes.tsx`:

```tsx
{ id: "organization.my-tool", title: "เครื่องมือของฉัน", version: "1.0.0",
  apiVersion: "1.0", accessLevel: "MEMBER",
  requires: ["map.navigate"], Panel: MyTool }
```

ID ต้องไม่ซ้ำ ใช้ namespace องค์กร; `version` เป็นเวอร์ชันเครื่องมือ ส่วน `apiVersion` เป็นเวอร์ชันสัญญา API ซึ่งตรวจตรงกันก่อน mount เครื่องมือประกาศ capability เท่าที่ต้องใช้ Hooks ของ panel ต้องคืน cleanup เพื่อถอด listeners, ยกเลิก fetch และล้าง object URLs เมื่อ unmount ส่วน async/event errors ต้องแสดง error state ใน panel เอง (error boundary จับ render errors)

Webmap อื่นนำ contract, ToolboxHost และโมดูลเครื่องมือไปใช้ แล้วสร้าง adapter `WebmapHost` ที่แปลงคำสั่งไปยัง map engine ของตน ส่ง host และ services เข้า `<ToolboxHost tools={tools} host={host} services={services}/>` ภายใน client component สามารถใช้ `services={undefined}` สำหรับเครื่องมือที่ใช้เพียง API กลาง ไม่ส่ง object ที่มีฟังก์ชันข้าม Server/Client boundary

Photo และ Draw ถูกแยกเป็นโมดูลแล้ว แต่ยังอาศัย `WorkspaceToolServices` ของ ThaiWater (storage, photo search และ drawing workspace) เมื่อนำไปใช้แอปอื่นต้องติดตั้ง UI/workspace ที่เกี่ยวข้องและ implement services นี้ด้วย การแยก panel ไม่ได้ทำให้บริการเหล่านี้เป็น engine-independent อัตโนมัติ

## เพิ่ม Layer

เพิ่ม `LayerDefinition` ใน `config/layers.ts` โดยระบุ metadata, accessLevel, min/maxZoom, opacity, legend, popupFields และ `render: {kind:"fill"|"line"|"circle"}` สำหรับไฟล์ GeoJSON ขนาดเล็ก ใช้ `render.cluster:true` ได้สำหรับ circle

ข้อมูล API ให้ provider ส่ง `FeatureCollection` ผ่าน `dataKey` เข้า RegistryLayers โดย provider รับผิดชอบ bbox validation, debounce/cancellation, ขนาดผลลัพธ์ และ loading/error/empty UI; renderer ไม่ดาวน์โหลด REST API ทั้งชุดเอง สถานีปัจจุบันยังคงใช้ข้อมูลสาธิตเดิมผ่าน dataKey `monitoring` ข้อมูล photo/drawing ใช้ specialized renderer เดิมผ่าน registry keys

WMS/WFS/vector/raster/ArcGIS ยังไม่มี renderer ใน RegistryLayers นี้ ต้องเพิ่ม adapter ตามชนิดข้อมูลก่อนเปิดใช้งาน URL `local:` สำหรับ photo/drawing ไม่ใช่ GeoJSON ที่ renderer ทั่วไปควร fetch ข้อมูลขนาดใหญ่ใช้ PostGIS/MVT ตามแนวทาง README

## สิทธิ์และความปลอดภัย

Access level และ capability ใช้ควบคุม UI เท่านั้น ไม่ใช่ sandbox สำหรับโค้ดเครื่องมือ API ที่มีสิทธิ์ยังต้องตรวจ `requireUser()`/`requireAdmin()` ฝั่ง server เสมอ Host ส่งเฉพาะ layer ที่ผู้ใช้มีสิทธิ์และตรวจ layer ID, opacity และพิกัดก่อนเรียก map ไม่มี route หรือ environment variable ใหม่

### Local data files

`LayerDefinition.toolboxId?: string` identifies a toolbox-owned layer for the sidebar's orange accent. `render.kind: "mixed"` renders polygon fills/outlines, lines, and points from a single GeoJSON source; its interactive layer IDs have `-fill`, `-line`, and `-point` suffixes. Supply the bounded FeatureCollection through `render.dataKey` in the host's data map. Simple Data Files uses this contract and persists only in browser IndexedDB; it adds no server route or external data request.
