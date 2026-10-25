import {NextRequest,NextResponse} from "next/server";import {hash} from "bcryptjs";import {z} from "zod";import {Prisma} from "@prisma/client";import {db} from "@/lib/db";import {requireAdmin} from "@/lib/auth/permissions";import {removesActiveAdmin} from "@/lib/auth/admin-guard";
const update=z.object({email:z.email().optional(),firstName:z.string().min(1).max(80).optional(),lastName:z.string().min(1).max(80).optional(),role:z.enum(["MEMBER","ADMIN"]).optional(),status:z.enum(["ACTIVE","INACTIVE","SUSPENDED"]).optional(),password:z.string().min(8).max(128).optional()});
class LastAdminError extends Error {}
class NotFoundError extends Error {}
/** The last-admin check and the update share one serializable transaction, so two admins cannot demote each other concurrently. */
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){const auth=await requireAdmin();if("error" in auth)return auth.error;const {id}=await params;try{const input=update.parse(await req.json());const {password,...data}=input;const passwordHash=password?await hash(password,12):undefined;
 const user=await db.$transaction(async tx=>{
  const target=await tx.user.findUnique({where:{id},select:{role:true,status:true}});if(!target)throw new NotFoundError();
  if(removesActiveAdmin(target,data)&&await tx.user.count({where:{role:"ADMIN",status:"ACTIVE",id:{not:id}}})===0)throw new LastAdminError();
  const updated=await tx.user.update({where:{id},data:{...data,...data.email?{email:data.email.toLowerCase()}:{},...passwordHash?{passwordHash}:{}}});
  await tx.auditLog.create({data:{userId:auth.user.id,action:password?"RESET_PASSWORD":"UPDATE_USER",resource:"USER",resourceId:id,ipAddress:req.headers.get("x-forwarded-for"),userAgent:req.headers.get("user-agent")}});
  return updated;
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
 return NextResponse.json({id:user.id,role:user.role,status:user.status})}catch(e){
 if(e instanceof z.ZodError)return NextResponse.json({error:e.issues[0]?.message},{status:400});
 if(e instanceof NotFoundError)return NextResponse.json({error:"ไม่พบผู้ใช้"},{status:404});
 if(e instanceof LastAdminError)return NextResponse.json({error:"ไม่สามารถลดสิทธิ์หรือระงับผู้ดูแลระบบคนสุดท้ายได้"},{status:409});
 if(e instanceof Prisma.PrismaClientKnownRequestError&&e.code==="P2002")return NextResponse.json({error:"อีเมลนี้มีผู้ใช้แล้ว"},{status:409});
 if(e instanceof Prisma.PrismaClientKnownRequestError&&e.code==="P2034")return NextResponse.json({error:"มีการแก้ไขพร้อมกัน กรุณาลองใหม่"},{status:409});
 return NextResponse.json({error:"ไม่สามารถบันทึกผู้ใช้ได้"},{status:500})}}
