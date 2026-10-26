import type {LayerDefinition} from "@/types/gis";
/** System layers only. Toolbox layers (My Data Files, Photos, Drawing) are registered by their plugins in config/toolboxes.tsx. */
export const layerRegistry:LayerDefinition[]=[
 {id:"water-basins",render:{kind:"fill"},title:"ขอบเขตลุ่มน้ำ",description:"ขอบเขตลุ่มน้ำหลักของประเทศไทย",group:"อุทกวิทยา",type:"GEOJSON",url:"/data/basins.geojson",visible:true,opacity:.7,minZoom:4,maxZoom:18,accessLevel:"MEMBER",color:"#15b8a6",legend:"พื้นที่ลุ่มน้ำ",popupFields:["name","area_km2"]},
 {id:"monitoring",render:{kind:"circle",cluster:true,dataKey:"monitoring"},title:"สถานีตรวจวัดน้ำ",description:"สถานีโทรมาตรและจุดตรวจวัด",group:"สถานีตรวจวัด",type:"REST_API",url:"/api/gis/stations",visible:true,opacity:1,minZoom:5,maxZoom:20,accessLevel:"MEMBER",color:"#2563eb",legend:"สถานีตรวจวัด",popupFields:["station_code","station_name","province"]},
 {id:"flood-risk",title:"พื้นที่เสี่ยงน้ำท่วม",description:"ข้อมูลตัวอย่างพื้นที่เฝ้าระวัง",group:"ภัยพิบัติ",type:"WMS",url:"",visible:false,opacity:.55,minZoom:5,maxZoom:18,accessLevel:"ADMIN",color:"#f97316",legend:"พื้นที่เสี่ยง",popupFields:["risk_level","province"]}
];
/** Thai column headers for the Data Panel and Identify popup; unknown fields show their property name. */
export const fieldLabels:Record<string,string>={station_code:"รหัสสถานี",station_name:"ชื่อสถานี",station_type:"ประเภทสถานี",province:"จังหวัด",level:"ระดับน้ำ",name:"ชื่อ",area_km2:"พื้นที่ (ตร.กม.)",description:"คำอธิบาย",data_file:"ไฟล์",file_description:"คำอธิบายไฟล์",share_name:"ชื่อชุดข้อมูล",share_description:"รายละเอียดข้อมูล",share_username:"ผู้แชร์",share_tags:"แท็ก",share_id:"รหัสการแชร์",risk_level:"ระดับความเสี่ยง"};
