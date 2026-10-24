import {strict as assert} from "node:assert";
import {test} from "node:test";
import {canAccess,defineToolboxes,toolboxAvailable,type WebmapHost,type ToolboxDefinition} from "../lib/webmap/contracts";
const host:WebmapHost={apiVersion:"1.0",accessLevel:"MEMBER",capabilities:["map.navigate"],layers:[],visible:{},opacity:{},setLayerVisible(){},setLayerOpacity(){},navigate(){}};
const tool:ToolboxDefinition={id:"example.navigation",title:"Navigation",version:"1.0.0",apiVersion:"1.0",accessLevel:"PUBLIC",requires:["map.navigate"],Panel:()=>null};
test("host only mounts tools matching access, API and capabilities",()=>{
 assert.equal(toolboxAvailable(tool,host),true);
 assert.equal(toolboxAvailable({...tool,accessLevel:"ADMIN"},host),false);
 assert.equal(toolboxAvailable({...tool,requires:["layers.control"]},host),false);
 assert.equal(toolboxAvailable(tool,{...host,apiVersion:"2.0" as "1.0"}),false);
 assert.equal(canAccess("PUBLIC","MEMBER"),false);
 assert.equal(canAccess("ADMIN","MEMBER"),true);
});
test("registry rejects ambiguous and empty tool identifiers",()=>{
 assert.throws(()=>defineToolboxes([tool,tool]),/duplicate/);
 assert.throws(()=>defineToolboxes([{...tool,id:" "}]),/Invalid/);
 assert.equal(defineToolboxes([tool]).length,1);
});
