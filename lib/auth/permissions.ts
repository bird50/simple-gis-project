import {AUTH_ENABLED} from "./mode";
import { NextResponse } from "next/server";
import { getSession } from "./session";
export async function requireUser(){if(!AUTH_ENABLED)return {error:NextResponse.json({error:"ฟังก์ชันบัญชีผู้ใช้พักใช้งานชั่วคราว"},{status:503})};const user=await getSession(); if(!user)return {error:NextResponse.json({error:"Unauthorized"},{status:401})}; return {user};}
export async function requireAdmin(){const auth=await requireUser(); if("error" in auth)return auth; if(auth.user.role!=="ADMIN")return {error:NextResponse.json({error:"Forbidden"},{status:403})}; return auth;}
