import { NextResponse } from "next/server";
import { getSession } from "./session";
export async function requireUser(){const user=await getSession(); if(!user)return {error:NextResponse.json({error:"Unauthorized"},{status:401})}; return {user};}
export async function requireAdmin(){const auth=await requireUser(); if("error" in auth)return auth; if(auth.user.role!=="ADMIN")return {error:NextResponse.json({error:"Forbidden"},{status:403})}; return auth;}
