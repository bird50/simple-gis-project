import {cookies} from "next/headers";
import {SignJWT,jwtVerify} from "jose";
import {AUTH_ENABLED} from "@/lib/auth/mode";
import {requireUser} from "@/lib/auth/permissions";
import {db} from "@/lib/db";
import {clientAddress,publicationByAddress,tooManyRequests} from "@/lib/security/rate-limit";

export async function toolboxFetch(path:string,init:RequestInit={}) {
  const key=process.env.TOOLBOX_SERVICE_KEY;
  if(!key||key.length<32)throw new Error("Toolbox service is not configured");
  return fetch(new URL(path,process.env.TOOLBOX_SERVICE_URL??"http://127.0.0.1:4010"),{...init,cache:"no-store",signal:AbortSignal.timeout(30_000),headers:{...Object.fromEntries(new Headers(init.headers)),authorization:`Bearer ${key}`}});
}
async function ownerHeaders(){
  if(AUTH_ENABLED){
    const auth=await requireUser();if("error" in auth)return auth.error;
    const user=await db.user.findUnique({where:{id:auth.user.id},select:{status:true,username:true}});
    if(user?.status!=="ACTIVE")return Response.json({error:"บัญชีนี้ไม่สามารถใช้งานได้"},{status:403});
    return {"x-toolbox-owner":`user:${auth.user.id}`,"x-toolbox-username":encodeURIComponent(user.username)};
  }
  const secret=process.env.TOOLBOX_SERVICE_KEY;if(!secret||secret.length<32)throw new Error("Missing service key");
  const key=new TextEncoder().encode(secret),jar=await cookies();let owner:string|undefined;
  try{const token=jar.get("toolbox_guest")?.value;if(token){const {payload}=await jwtVerify(token,key,{algorithms:["HS256"],audience:"toolbox-guest"});if(typeof payload.sub==="string"&&/^guest:[0-9a-f-]{36}$/.test(payload.sub))owner=payload.sub;}}catch{}
  if(!owner){owner=`guest:${crypto.randomUUID()}`;const token=await new SignJWT({}).setSubject(owner).setAudience("toolbox-guest").setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("30d").sign(key);jar.set("toolbox_guest",token,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:30*86400});}
  return {"x-toolbox-owner":owner,"x-toolbox-username":encodeURIComponent("ผู้เยี่ยมชม")};
}
/**
 * CSRF guard: the browser's Origin must name the host it sent the request to. Compare with the Host header
 * (or X-Forwarded-Host behind a proxy), not request.url — Next.js rewrites that to its own hostname, which
 * rejected same-site requests made through a LAN IP or a public domain.
 */
export function sameOrigin(origin:string,request:Request){
  let host:string;try{host=new URL(origin).host;}catch{return false;}
  const target=request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()||request.headers.get("host")||new URL(request.url).host;
  return host.toLowerCase()===target.toLowerCase();
}
export async function proxyToolbox(request:Request,path:string,privateRoute=false){
  try{
    if(request.method!=="GET"){
      const origin=request.headers.get("origin");
      if(origin&&!sameOrigin(origin,request))return Response.json({error:"ไม่อนุญาตคำขอจากเว็บไซต์อื่น"},{status:403});
      if(request.headers.get("sec-fetch-site")==="cross-site")return Response.json({error:"ไม่อนุญาตคำขอจากเว็บไซต์อื่น"},{status:403});
    }
    // Publishing is the only write path open to guests; bound it before reading up to 25 MB of body.
    if(privateRoute&&request.method!=="GET"){const limited=publicationByAddress.take(clientAddress(request));if(!limited.ok)return tooManyRequests(limited.retryAfter);}
    const headers:Record<string,string>={};
    if(privateRoute){const owner=await ownerHeaders();if(owner instanceof Response)return owner;Object.assign(headers,owner);}
    let body:Uint8Array|undefined;
    if(request.method!=="GET"){
      const max=path==="/drawing-shares"?1024*1024:25*1024*1024;
      const reader=request.body?.getReader();if(!reader)return Response.json({error:"ไม่พบข้อมูล"},{status:400});
      const chunks:Uint8Array[]=[];let size=0;
      try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>max){await reader.cancel();return Response.json({error:"ข้อมูลเกินขนาดที่อนุญาต"},{status:413});}chunks.push(part.value);}}finally{reader.releaseLock();}
      body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length;}
      headers["content-type"]=request.headers.get("content-type")??"application/json";
    }
    const upstream=await toolboxFetch(path,{method:request.method,headers,body:body as BodyInit|undefined});
    return new Response(upstream.body,{status:upstream.status,headers:{"Content-Type":upstream.headers.get("content-type")??"application/json","Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'; sandbox"}});
  }catch{return Response.json({error:"ไม่สามารถเชื่อมต่อบริการ Toolbox ได้ กรุณาลองใหม่ภายหลัง"},{status:503});}
}
