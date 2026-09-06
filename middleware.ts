import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
export async function middleware(req:NextRequest){
  const token=req.cookies.get("water_gis_session")?.value; const login=new URL("/login",req.url); login.searchParams.set("next",req.nextUrl.pathname);
  if(!token)return NextResponse.redirect(login);
  try{const {payload}=await jwtVerify(token,new TextEncoder().encode(process.env.AUTH_SECRET||"development-only-secret-change-me-now")); if(req.nextUrl.pathname.startsWith("/admin")&&payload.role!=="ADMIN")return NextResponse.redirect(new URL("/gis",req.url)); return NextResponse.next();}catch{return NextResponse.redirect(login)}
}
export const config={matcher:["/gis/:path*","/profile/:path*","/admin/:path*"]};
