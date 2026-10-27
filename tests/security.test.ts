import {strict as assert} from "node:assert";
import {test} from "node:test";
import {authKey} from "../lib/auth/secret";
import {removesActiveAdmin} from "../lib/auth/admin-guard";
import {clientAddress,createRateLimiter} from "../lib/security/rate-limit";
import {publicDataFileSearch,publicDrawingSearch,publicPhotoSearch,publicPhotoSetSearch} from "../lib/toolbox/public-query";
import {stationBbox} from "../lib/gis/bbox";

test("production refuses a missing, short or example AUTH_SECRET; development keeps a local fallback",()=>{
 for(const AUTH_SECRET of [undefined,"short","replace-with-at-least-32-random-characters","development-only-secret-change-me-now"])assert.throws(()=>authKey({AUTH_SECRET,NODE_ENV:"production"}),/AUTH_SECRET/);
 assert.equal(authKey({AUTH_SECRET:"x".repeat(32),NODE_ENV:"production"}).length,32);
 assert.ok(authKey({NODE_ENV:"development"}).length>0);
});
test("any demotion or deactivation of an active administrator counts toward the last-admin rule",()=>{
 const admin={role:"ADMIN" as const,status:"ACTIVE" as const};
 assert.equal(removesActiveAdmin(admin,{role:"MEMBER"}),true);
 assert.equal(removesActiveAdmin(admin,{status:"SUSPENDED"}),true);
 assert.equal(removesActiveAdmin(admin,{status:"INACTIVE",role:"ADMIN"}),true);
 assert.equal(removesActiveAdmin(admin,{role:"ADMIN",status:"ACTIVE"}),false);
 assert.equal(removesActiveAdmin(admin,{}),false);
 assert.equal(removesActiveAdmin({role:"ADMIN",status:"SUSPENDED"},{role:"MEMBER"}),false);
 assert.equal(removesActiveAdmin({role:"MEMBER",status:"ACTIVE"},{status:"SUSPENDED"}),false);
});
test("rate limiter blocks after the limit, resets after the window and bounds its key count",()=>{
 const limiter=createRateLimiter({limit:2,windowMs:1000,maxKeys:2});
 assert.equal(limiter.take("a",0).ok,true);assert.equal(limiter.take("a",10).ok,true);
 const blocked=limiter.take("a",500);assert.equal(blocked.ok,false);assert.equal(blocked.retryAfter,1);
 assert.equal(limiter.take("a",1000).ok,true);
 limiter.take("b",1000);limiter.take("c",1000);
 assert.equal(limiter.take("a",1001).ok,true,"oldest key was evicted to stay within maxKeys");
 assert.equal(clientAddress(new Request("http://x",{headers:{"x-forwarded-for":"203.0.113.9, 10.0.0.1"}})),"203.0.113.9");
 assert.equal(clientAddress(new Request("http://x")),"unknown");
});
test("public searches forward only validated parameters and cap drawings at 50",()=>{
 const photos=publicPhotoSearch(new URLSearchParams("bbox=99,12,101,14&tag=flood&evil=1&limit=20"));
 assert.equal(photos?.toString(),"bbox=99%2C12%2C101%2C14&limit=20&tag=flood");
 assert.equal(publicPhotoSearch(new URLSearchParams("bbox=0,0,0,0")),null);
 assert.equal(publicDrawingSearch(new URLSearchParams("bbox=99,12,101,14&limit=200")),null);
 assert.equal(publicDataFileSearch(new URLSearchParams("bbox=99,12,101,14&search=น้ำ&tag=survey&username=x&extra=1"))?.toString(),"bbox=99%2C12%2C101%2C14&limit=500&search=%E0%B8%99%E0%B9%89%E0%B8%B3&tag=survey");
 for(const bad of ["bbox=99,12,101,14&limit=5000","bbox=1,2,3","bbox=99,12,101,14&tag="+"x".repeat(51)])assert.equal(publicDataFileSearch(new URLSearchParams(bad)),null,bad);
 assert.equal(publicDrawingSearch(new URLSearchParams("bbox=99,12,101,14&username=x"))?.toString(),"bbox=99%2C12%2C101%2C14&limit=50");
});
test("station bbox requires WGS84 ranges and ordered corners",()=>{
 assert.deepEqual(stationBbox.parse("98,12,101,15"),[98,12,101,15]);
 for(const value of ["181,0,182,1","0,91,1,92","101,12,98,15","98,15,101,12","1,2,3"," ,1,2,3"])assert.equal(stationBbox.safeParse(value).success,false);
});
test("same-origin check uses the Host the browser targeted, so LAN IPs and domains work but other sites do not",async()=>{
 const {sameOrigin}=await import("../lib/toolbox/service");
 const request=(host:string,forwarded?:string)=>new Request("http://localhost:3000/api/photo-shares",{method:"POST",headers:{host,...forwarded?{"x-forwarded-host":forwarded}:{}}});
 assert.equal(sameOrigin("http://192.168.1.117:3000",request("192.168.1.117:3000")),true);
 assert.equal(sameOrigin("http://localhost:3000",request("localhost:3000")),true);
 assert.equal(sameOrigin("https://gis.example.org",request("127.0.0.1:3000","gis.example.org")),true);
 assert.equal(sameOrigin("https://evil.example",request("192.168.1.117:3000")),false);
 assert.equal(sameOrigin("http://192.168.1.117:3001",request("192.168.1.117:3000")),false);
 assert.equal(sameOrigin("null",request("localhost:3000")),false);
});
test("gateway reads with the read-only service key and publishes with the read,write key",async()=>{
 const {serviceKey}=await import("../lib/toolbox/service");
 const write="w".repeat(40),read="r".repeat(40);
 const both={TOOLBOX_SERVICE_KEY:write,TOOLBOX_SERVICE_READ_KEY:read};
 for(const method of [undefined,"GET","get","HEAD"])assert.equal(serviceKey(method,both),read);
 for(const method of ["POST","DELETE"])assert.equal(serviceKey(method,both),write);
 assert.equal(serviceKey("GET",{TOOLBOX_SERVICE_KEY:write}),write,"no read key: reads fall back to the read,write key");
 assert.throws(()=>serviceKey("POST",{TOOLBOX_SERVICE_READ_KEY:read}),"a read key never publishes");
 assert.throws(()=>serviceKey("GET",{TOOLBOX_SERVICE_READ_KEY:"short"}));
});
test("gateway names the app on every publish",async()=>{
 const {appNameHeader}=await import("../lib/toolbox/service");
 assert.deepEqual(appNameHeader({}),{"x-toolbox-app-name":"ThaiWater%20GIS"});
 assert.equal(decodeURIComponent(appNameHeader({TOOLBOX_APP_NAME:" ระบบน้ำ "})["x-toolbox-app-name"]),"ระบบน้ำ");
});
test("public photo set search forwards only validated filters",()=>{
 assert.equal(String(publicPhotoSetSearch(new URLSearchParams("eventName=flood&tag=x&evil=1&offset=20"))),"offset=20&limit=20&eventName=flood&tag=x");
 assert.equal(publicPhotoSetSearch(new URLSearchParams("limit=51")),null);
 assert.equal(publicPhotoSetSearch(new URLSearchParams("startDate=2026-10-20&endDate=2026-10-19")),null);
});
