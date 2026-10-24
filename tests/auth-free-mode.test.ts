import {strict as assert} from "node:assert";
import {test} from "node:test";
import {NextRequest} from "next/server";
import {AUTH_ENABLED,guestWorkspaceUser} from "../lib/auth/mode";
import {requireAdmin,requireUser} from "../lib/auth/permissions";
import {proxy} from "../proxy";
import {GET as layers} from "../app/api/gis/layers/route";
import {POST as login} from "../app/api/auth/login/route";
import {POST as register} from "../app/api/auth/register/route";

test("account-free mode exposes workspace without granting administrator access",async()=>{
 assert.equal(AUTH_ENABLED,false);
 assert.equal(guestWorkspaceUser.role,"MEMBER");
 const open=await proxy(new NextRequest("http://localhost/gis"));
 assert.equal(open.status,200);
 for(const path of ["/admin/users","/profile"]){
  const response=await proxy(new NextRequest(`http://localhost${path}`));
  assert.equal(response.headers.get("location"),"http://localhost/gis");
 }
 const result=await layers();
 const data=await result.json();
 assert.ok(data.some((layer:{accessLevel:string})=>layer.accessLevel==="MEMBER"));
 assert.ok(data.every((layer:{accessLevel:string})=>layer.accessLevel!=="ADMIN"));
});
test("account endpoints fail intentionally before reading cookies, requests or database",async()=>{
 for(const guard of [requireUser,requireAdmin]){
  const result=await guard();
  assert.ok("error" in result);
  assert.equal(result.error?.status,503);
 }
 for(const handler of [login,register]){
  const result=await handler(new NextRequest("http://localhost/api/auth",{method:"POST"}));
  assert.equal(result.status,503);
 }
});
