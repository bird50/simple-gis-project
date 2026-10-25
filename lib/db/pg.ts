import {Pool} from "pg";
/** One pooled connection set per server process for raw PostGIS queries (Prisma covers everything else). */
const globalForPg=globalThis as unknown as {pgPool?:Pool};
export const pgPool=globalForPg.pgPool??new Pool({connectionString:process.env.DATABASE_URL,max:10,idleTimeoutMillis:30_000,connectionTimeoutMillis:5_000});
globalForPg.pgPool=pgPool;
