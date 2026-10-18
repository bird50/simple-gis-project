import assert from "node:assert/strict";
import {test} from "node:test";
import {publicPhotoWhere} from "@/lib/photos/public-search";
import sharp from "sharp";
import {photoViewportBbox,publicPhotoQuery,publicPhotoFilters} from "@/lib/gis/public-photo-query";
import {readPhotoMetadata} from "@/lib/gis/photo-gps";
import {automaticShareTag,MAX_SHARE_BYTES,shareFields} from "@/lib/gis/photo-share";
import {boundedFormData,PhotoUploadError,prepareSharedPhoto} from "@/lib/photos/upload";

async function fixture(gps=true,date=true){
 const jpeg=await sharp({create:{width:64,height:64,channels:3,background:'#087f73'}}).jpeg().toBuffer();
 if(!gps)return jpeg;
 const t=Buffer.alloc(288);t.write('II');t.writeUInt16LE(42,2);t.writeUInt32LE(8,4);t.writeUInt16LE(2,8);
 function tag(off:number,id:number,type:number,count:number,value:number){t.writeUInt16LE(id,off);t.writeUInt16LE(type,off+2);t.writeUInt32LE(count,off+4);t.writeUInt32LE(value,off+8);}
 tag(10,0x8769,4,1,38);tag(22,0x8825,4,1,80);
 t.writeUInt16LE(date?2:0,38);
 if(date){tag(40,0x9003,2,20,200);tag(52,0x9011,2,7,224);t.write('2026:10:18 09:30:45\0',200);t.write('+07:00\0',224);}
 t.writeUInt16LE(4,80);tag(82,1,2,2,78);tag(94,2,5,3,240);tag(106,3,2,2,69);tag(118,4,5,3,264);
 for(const [off,value] of [[240,13],[248,30],[256,0],[264,100],[272,15],[280,0]]){t.writeUInt32LE(value,off);t.writeUInt32LE(1,off+4);}
 const payload=Buffer.concat([Buffer.from('Exif\0\0'),t]);const header=Buffer.from([0xff,0xe1,0,0]);header.writeUInt16BE(payload.length+2,2);
 return Buffer.concat([jpeg.subarray(0,2),header,payload,jpeg.subarray(2)]);
}

test("share tag uses the Bangkok date across UTC midnight and cannot be supplied by clients",()=>{
  assert.equal(automaticShareTag(new Date("2026-10-18T17:00:00Z")),"share2026-10-19");
  assert.equal(shareFields.safeParse({eventName:"น้ำท่วม",tags:["share2026-10-19"]}).success,false);
  assert.equal(shareFields.safeParse({eventName:"  ",tags:[]}).success,false);
  assert.equal(shareFields.safeParse({eventName:"สำรวจ",tags:["น้ำท่วม"]}).success,true);
});

test("EXIF capture time and timezone are preserved while public image metadata is removed",async()=>{
  const bytes=await fixture();
  assert.deepEqual(await readPhotoMetadata(bytes),{latitude:13.5,longitude:100.25,capturedAt:"2026-10-18T09:30:45",capturedOffset:"+07:00"});
  const result=await prepareSharedPhoto(new File([bytes],"test.jpg",{type:"image/jpeg"}),0);
  assert.equal(result.latitude,13.5);
  assert.equal(result.capturedAt,"2026-10-18T09:30:45");
  assert.equal(result.capturedOffset,"+07:00");
  const image=await sharp(result.image).metadata();
  assert.equal(image.format,"jpeg");assert.equal(image.exif,undefined);
});

test("public sharing rejects photos without GPS or DateTimeOriginal",async()=>{
  for(const bytes of [await fixture(false),await fixture(true,false)]){
    await assert.rejects(()=>prepareSharedPhoto(new File([bytes],"test.jpg",{type:"image/jpeg"}),0),error=>error instanceof PhotoUploadError&&error.status===422);
  }
});

test("multipart requests are parsed within the limit and oversized declared bodies rejected",async()=>{
  const form=new FormData();form.set("eventName","สำรวจ");
  const request=new Request("http://localhost/api/photo-shares",{method:"POST",body:form});
  assert.equal((await boundedFormData(request)).get("eventName"),"สำรวจ");
  const oversized=new Request("http://localhost/api/photo-shares",{method:"POST",headers:{"content-type":"multipart/form-data; boundary=test","content-length":String(MAX_SHARE_BYTES+1)},body:"test"});
  await assert.rejects(()=>boundedFormData(oversized),error=>error instanceof PhotoUploadError&&error.status===413);
});

test("public photo viewport is required, bounded, and supports antimeridian views",()=>{
  assert.equal(publicPhotoQuery.safeParse({}).success,false);
  for(const bbox of ["1,2,3","1,,3,4","181,0,182,5","0,20,10,10","0,0,NaN,5","0,-91,5,10"]){assert.equal(publicPhotoQuery.safeParse({bbox}).success,false);}
  assert.equal(publicPhotoQuery.safeParse({bbox:"90,0,110,20",limit:201}).success,false);
  assert.equal(publicPhotoQuery.safeParse({bbox:"90,0,110,20",limit:0}).success,false);
  assert.equal(publicPhotoQuery.safeParse({bbox:"170,-10,-170,10"}).success,true);
  assert.equal(photoViewportBbox(-240,-20,240,20),"-180,-20,180,20");
  assert.equal(photoViewportBbox(170,-10,190,10),"170,-10,-170,10");
});

test("public filters validate real dates, inclusive single-day ranges, and input bounds",()=>{
  assert.equal(publicPhotoFilters.safeParse({startDate:"2026-10-19",endDate:"2026-10-18"}).success,false);
  assert.equal(publicPhotoFilters.safeParse({startDate:"2026-02-30"}).success,false);
  assert.equal(publicPhotoFilters.safeParse({startDate:"2024-02-29",endDate:"2024-02-29"}).success,true);
  assert.equal(publicPhotoFilters.safeParse({username:"x".repeat(101)}).success,false);
  assert.equal(publicPhotoFilters.safeParse({tag:"x".repeat(51)}).success,false);
  assert.equal(publicPhotoQuery.safeParse({bbox:"90,0,110,20",startDate:"yesterday"}).success,false);
  const parsed=publicPhotoFilters.parse({username:"  member  ",eventName:"  น้ำท่วม  ",tag:"  share2026-10-19  "});
  assert.equal(parsed.username,"member");assert.equal(parsed.eventName,"น้ำท่วม");assert.equal(parsed.tag,"share2026-10-19");
});

test("OR searches keep publication and viewport mandatory, with dates as one bounded range",()=>{
  const query=publicPhotoQuery.parse({bbox:"170,-10,-170,10",username:"member",eventName:"น้ำท่วม",tag:"สำรวจ",startDate:"2026-10-01",endDate:"2026-10-19"});
  const where=publicPhotoWhere(query);
  assert.deepEqual(where.AND,[
    {share:{published:true}},
    {latitude:{gte:-10,lte:10}},
    {OR:[{longitude:{gte:170}},{longitude:{lte:-170}}]},
    {OR:[
      {share:{owner:{username:{contains:"member",mode:"insensitive"}}}},
      {share:{eventName:{contains:"น้ำท่วม",mode:"insensitive"}}},
      {share:{tags:{has:"สำรวจ"}}},
      {capturedAt:{gte:"2026-10-01T00:00:00",lte:"2026-10-19T23:59:59"}},
    ]},
  ]);
  assert.deepEqual(publicPhotoWhere(publicPhotoQuery.parse({bbox:"90,0,110,20"})).AND,[{share:{published:true}},{latitude:{gte:0,lte:20}},{longitude:{gte:90,lte:110}}]);
});
