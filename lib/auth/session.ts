import {AUTH_ENABLED} from "./mode";
import {authKey} from "./secret";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { SessionUser } from "@/types/auth";
const COOKIE = "water_gis_session";
export async function createSession(user:SessionUser, remember=false) {
  const maxAge = remember ? 60*60*24*30 : 60*60*8;
  const token = await new SignJWT(user).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime(`${maxAge}s`).sign(authKey());
  (await cookies()).set(COOKIE, token, {httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge});
}
export async function destroySession(){ (await cookies()).delete(COOKIE); }
/**
 * The signed cookie only identifies the user; role and status are read from the database on every call,
 * so suspension, deactivation and demotion take effect immediately instead of when the token expires.
 */
export async function getSession():Promise<SessionUser|null>{
  if(!AUTH_ENABLED)return null;
  const token=(await cookies()).get(COOKIE)?.value; if(!token)return null;
  try {
    const {payload}=await jwtVerify(token,authKey(),{algorithms:["HS256"]});
    if(typeof payload.id!=="string")return null;
    const user=await db.user.findUnique({where:{id:payload.id},select:{id:true,email:true,username:true,firstName:true,lastName:true,role:true,status:true}});
    if(!user||user.status!=="ACTIVE")return null;
    return {id:user.id,email:user.email,username:user.username,firstName:user.firstName,lastName:user.lastName,role:user.role};
  } catch { return null; }
}
