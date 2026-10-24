import {strict as assert} from "node:assert";
import {test} from "node:test";
import {csvData,validateData,parseDataFile,DATA_RETENTION_MS} from "../lib/gis/data-files";

test("CSV supports Thai text, quoted commas, escaped quotes and multiline fields",()=>{
 const result=csvData('lat,lng,name,description\r\n13.5,100.5,"สถานี,หนึ่ง","บรรทัดแรก\nบรรทัดที่สอง ""ทดสอบ"""');
 assert.equal(result.features.length,1);
 assert.deepEqual(result.features[0].geometry,{type:"Point",coordinates:[100.5,13.5]});
 assert.equal(result.features[0].properties?.description,'บรรทัดแรก\nบรรทัดที่สอง "ทดสอบ"');
});
test("CSV rejects missing/invalid coordinates and malformed rows rather than silently dropping data",()=>{
 for(const input of ['name\nstation','lat,lon\n,100','lat,lon\n91,100','lat,lon\n13,NaN','lat,lon\n13,100,extra','lat,lon\n13,"100','lat,lat,lon\n13,13,100'])assert.throws(()=>csvData(input));
});
test("GeoJSON preserves mixed geometry and rejects non-WGS84 or unclosed polygons",()=>{
 const features=[{type:"Feature",properties:{name:"point"},geometry:{type:"Point",coordinates:[100,13]}},{type:"Feature",properties:null,geometry:{type:"Polygon",coordinates:[[[100,13],[101,13],[101,14],[100,13]]]}}];
 assert.equal(validateData({type:"FeatureCollection",features}).features.length,2);
 assert.throws(()=>validateData({type:"FeatureCollection",features:[{...features[0],geometry:{type:"Point",coordinates:[500000,1400000]}}]}));
 assert.throws(()=>validateData({type:"FeatureCollection",features:[{...features[0],geometry:{type:"Polygon",coordinates:[[[100,13],[101,13],[101,14],[100,14]]]}}]}));
 assert.throws(()=>validateData({type:"FeatureCollection",features:[]}));
 assert.throws(()=>validateData({type:"FeatureCollection",features:Array(5001).fill(features[0])}));
});
test("File parser supports BOM/single Feature and bounds input size/type",async()=>{
 const file=new File(['\uFEFF{"type":"Feature","properties":{},"geometry":{"type":"Point","coordinates":[100,13]}}'],'station.geojson');
 assert.equal((await parseDataFile(file)).features.length,1);
 await assert.rejects(parseDataFile(new File(['bad'],'bad.json')),/JSON/);
 await assert.rejects(parseDataFile(new File(['bad'],'bad.exe')),/รองรับ/);
 await assert.rejects(parseDataFile(new File([new Uint8Array(5*1024*1024+1)],'big.csv')),/5 MB/);
 assert.equal(DATA_RETENTION_MS,1296000000);
});
