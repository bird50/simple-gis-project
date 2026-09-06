export type AppRole = "MEMBER" | "ADMIN";
export type SessionUser = { id:string; email:string; username:string; firstName:string; lastName:string; role:AppRole };
