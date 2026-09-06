import { PrismaClient, Role, UserStatus } from "@prisma/client";
import { hash } from "bcryptjs";
const prisma = new PrismaClient();
async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (minimum 12 characters)");
  await prisma.user.upsert({ where:{email}, update:{role:Role.ADMIN,status:UserStatus.ACTIVE}, create:{email,username:"admin",passwordHash:await hash(password,12),firstName:"System",lastName:"Administrator",role:Role.ADMIN} });
}
main().finally(()=>prisma.$disconnect());
