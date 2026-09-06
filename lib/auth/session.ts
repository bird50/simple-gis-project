import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { SessionUser } from "@/types/auth";
const COOKIE = "water_gis_session";
const key = () => new TextEncoder().encode(process.env.AUTH_SECRET || "development-only-secret-change-me-now");
export async function createSession(user:SessionUser, remember=false) {
  const maxAge = remember ? 60*60*24*30 : 60*60*8;
  const token = await new SignJWT(user).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime(`${maxAge}s`).sign(key());
  (await cookies()).set(COOKIE, token, {httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge});
}
export async function destroySession(){ (await cookies()).delete(COOKIE); }
export async function getSession():Promise<SessionUser|null>{
  const token=(await cookies()).get(COOKIE)?.value; if(!token)return null;
  try { const {payload}=await jwtVerify(token,key()); return payload as unknown as SessionUser; } catch { return null; }
}
