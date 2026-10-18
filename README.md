# ThaiWater GIS

เว็บแอปพลิเคชัน GIS ระดับองค์กรสำหรับบริหารจัดการข้อมูลทรัพยากรน้ำ พัฒนาด้วย Next.js 16 App Router, TypeScript, MapLibre GL, Prisma และ PostgreSQL/PostGIS

## Architecture

- **Web/UI:** Next.js Server Components + Client Components, Tailwind CSS 4
- **Map:** MapLibre ผ่าน `react-map-gl/maplibre`; basemap และ layer แยกจาก component ใน `config/`
- **Server state:** TanStack Query provider พร้อมสำหรับ viewport queries
- **API:** Next.js Route Handlers + Zod; admin endpoints ตรวจ role ฝั่ง server ทุกครั้ง
- **Authentication:** bcrypt (cost 12) + signed JWT ใน HTTP-only, SameSite cookie; Next.js Proxy ป้องกัน route และ server guards ป้องกัน API
- **Database:** Prisma สำหรับ users/system/audit; parameterized `pg` query สำหรับ PostGIS geometry
- **Scale path:** bbox/viewport query → GiST index → Martin หรือ pg_tileserv → MVT สำหรับข้อมูลหลักหมื่นถึงล้าน features

## Setup

1. ติดตั้ง Node.js 22 และ PostgreSQL พร้อม PostGIS
2. คัดลอก `.env.example` เป็น `.env` แล้วกำหนด `DATABASE_URL` และ `AUTH_SECRET` ที่สุ่มอย่างน้อย 32 ตัวอักษร
3. สร้าง spatial table: `psql "$DATABASE_URL" -f db/init-postgis.sql`
4. ติดตั้งและเตรียมฐานข้อมูล:

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

## Environment variables

| Variable         | Purpose                                                       |
| ---------------- | ------------------------------------------------------------- |
| `DATABASE_URL`   | PostgreSQL connection string                                  |
| `AUTH_SECRET`    | secret สำหรับลงนาม session; ต้องสุ่มและห้าม commit            |
| `NEXTAUTH_URL`   | canonical application URL (เตรียมไว้สำหรับ Auth.js migration) |
| `ADMIN_EMAIL`    | email ของ initial admin                                       |
| `ADMIN_PASSWORD` | initial admin password ขั้นต่ำ 12 ตัวอักษร                    |

`ADMIN_PASSWORD` ใช้เฉพาะ seed และถูก hash ก่อนบันทึก ห้ามใช้ค่าตัวอย่างใน production

## Roles and routes

- `MEMBER`: `/gis`, `/profile` และ GIS APIs
- `ADMIN`: ทุกสิทธิ์ของ MEMBER พร้อม `/admin/*` และ `/api/admin/*`
- ผู้สมัครเองจะเป็น `MEMBER` เสมอ สถานะ `INACTIVE` และ `SUSPENDED` ไม่สามารถ login
- การ “ลบ” ผู้ใช้ควรเปลี่ยน status เป็น `INACTIVE`; API ป้องกันการลดสิทธิ์ admin คนสุดท้าย

## Layer configuration

Basemap อยู่ที่ `config/basemaps.ts` และ registry อยู่ที่ `config/layers.ts` แต่ละ layer มี type, URL, zoom range, style, legend, popup fields และ access level. ใน production สามารถย้าย registry ไป `GisLayer` table โดย UI/API contract เดิมไม่ต้องเปลี่ยน Map component

## PostGIS API

`GET /api/gis/stations?bbox=minX,minY,maxX,maxY&province=เชียงใหม่&type=TELEMETRY&limit=500`

Query ใช้ placeholders ทุกค่าและจำกัดผลสูงสุด 5,000 records. สำหรับชุดข้อมูลขนาดใหญ่ควรคืน MVT ตาม tile coordinate แทน GeoJSON.

## Production

```bash
npm run lint
npm run build
npm start
```

ก่อน deploy ให้เปลี่ยน secrets, ใช้ TLS, กำหนด CSP/rate limit ที่ reverse proxy, run Prisma migrations แทน `db push`, ใช้ connection pool และตั้ง tile cache/CDN สำหรับ raster/vector tiles

## GIS workspace UI

หน้า `/gis` ใช้ shadcn/ui (Radix) โดยเก็บ component ไว้ใน `components/ui/` และตั้งค่าที่ `components.json`; สีผ่าน CSS tokens ใน `app/globals.css` ใช้ `cn()` จาก `lib/utils.ts` รวมคลาส Tailwind

แผงชั้นข้อมูลและตารางยุบได้ ค้นหาชื่อสถานี/จังหวัดและเลือกสถานีเพื่อเลื่อนแผนที่ไปยังตำแหน่งนั้น ข้อมูลสถานีและขอบเขตใน workspace เป็นข้อมูลสาธิต ชั้นข้อมูลที่ยังไม่มี URL จะปิดการใช้งานไว้ สิทธิ์เข้าถึง `/gis` ยังคงเป็น MEMBER/ADMIN ตามเดิม
