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

หน้า GIS มีแผง **Toolbox** ด้านขวาซึ่งยุบได้ พร้อมเครื่องมือ **Photo** สำหรับเลือกภาพหลายรูป เพิ่มภาพต่อเนื่อง ดูตัวอย่าง และลบแต่ละรูปได้ รองรับไฟล์ JPG/PNG/WebP ไม่เกิน 10 MB ต่อรูปบนเครื่อง การกด Add to My Photos ไม่อัปโหลดภาพ ส่วน Save & Share Public จะบันทึกขึ้นเซิร์ฟเวอร์

Photo: กดเฟืองที่ชั้น My Photos ใน sidebar ด้านซ้ายเพื่อเปิดหน้าต่างลอยจัดการภาพ (ปิดด้วยปุ่มปิดหรือ Escape) เลือกภาพแล้วระบบอ่านพิกัด GPS จาก EXIF ด้วย `exifr` บนเครื่อง แสดงพิกัดและสถานะของแต่ละรูป กด **Add to My Photos** เพื่อเพิ่มเฉพาะรูปที่มีพิกัดถูกต้องใน WGS84 (EPSG:4326) รูปที่ไม่มีพิกัดหรืออ่านไม่ได้จะคงอยู่ในรายการและไม่ถูกวางที่ตำแหน่งสมมติ สวิตช์ใน Toolbox และ sidebar ใช้สถานะเดียวกัน ภาพเก็บใน IndexedDB แยกตาม user ID ในเบราว์เซอร์เดิมเป็นเวลา 15 วันนับจาก Add สำเร็จ ไม่มีการอัปโหลดไปเซิร์ฟเวอร์

Toolbox → Photo มีสวิตช์เปิด–ปิด Layer My Photos และ Layer Public Photos; การเลือกภาพ ดูตัวอย่าง และ Add to My Photos อยู่ในหน้าต่างลอยจากเฟืองด้านซ้าย หน้าต่างไม่บล็อกการคลิกแผนที่และเก็บรูปที่เลือกระหว่างเปิด–ปิดหน้าต่าง

My Photos storage: `lib/gis/photo-storage.ts` เก็บ Blob, ชื่อภาพ, GPS, user ID, createdAt และ expiresAt ใน IndexedDB (`thaiwater-my-photos`) โดยรอ transaction commit ก่อนแจ้งสำเร็จ การอ่านไม่ต่ออายุ ล้างภาพหมดอายุเมื่อเข้า GIS, กลับมาที่แท็บ และทุก 1 นาทีระหว่างเปิดหน้า (ขณะปิดเว็บจะล้างครั้งถัดไปที่เปิด) ปุ่ม Add จะแจ้งข้อผิดพลาดและเก็บรูปที่เลือกไว้หากบันทึกไม่ได้ UI แจ้งนโยบาย 15 วันและวันหมดอายุในผลบันทึก/ป๊อปอัปภาพ การล้างข้อมูลเว็บไซต์หรือ browser eviction อาจทำให้ภาพหายก่อนกำหนด ข้อมูลบนเครื่องไม่ใช่การสำรองข้อมูล และการเก็บภาพนี้ไม่ได้ทำให้ basemap ใช้งาน offline ได้

## Public photo sharing

จากเฟือง **My Photos** เลือกรูปที่บันทึกบนเครื่องในส่วน **บันทึกเพื่อแชร์ Public** ใส่ชื่อเหตุการณ์และแท็กเพิ่มเติม แล้วกด **Save & Share Public** ระบบอัปโหลดและสร้างลิงก์ `/share/[shareId]` ซึ่งเปิดได้โดยไม่ต้องล็อกอิน ภาพ Public เก็บบนเซิร์ฟเวอร์แยกจาก IndexedDB และไม่ถูกลบตามรอบ 15 วันของรูปบนเครื่อง

- ชื่อเหตุการณ์จำเป็น สูงสุด 160 ตัวอักษร; แท็กเพิ่มเติมไม่เกิน 10 แท็ก แท็กละ 50 ตัวอักษร
- เซิร์ฟเวอร์สร้างแท็ก `shareYYYY-MM-DD` โดยใช้วันที่บันทึกจริงในเขตเวลา Asia/Bangkok ห้ามส่งแท็กแบบนี้จาก client เพื่อแก้หรือแทนที่แท็กระบบ
- แชร์ครั้งละ 1–10 รูป ไม่เกิน 10 MB ต่อรูปและ request รวมไม่เกิน 25 MB รองรับ JPEG/PNG/WebP ภาพไม่เกิน 40 ล้านพิกเซล
- ทุกรูปต้องมี GPS ที่ถูกต้องและ EXIF `DateTimeOriginal`; ไม่มีการใช้เวลาอัปโหลดหรือวันที่แก้ไฟล์แทนวันที่ถ่าย เซิร์ฟเวอร์อ่าน EXIF จากไฟล์ซ้ำและไม่รับพิกัด/วันที่จากฟอร์ม
- `capturedAt` เก็บเวลาตามกล้องเป็นข้อความ ISO local และ `capturedOffset` เก็บ EXIF `OffsetTimeOriginal` ถ้ามี หากไม่มีก็แสดงว่าไม่ระบุเขตเวลา โดยไม่เดาว่าเป็น UTC หรือเวลาไทย
- ภาพ Public ถูกถอดรหัส ตรวจชนิด ย่อด้านยาวสูงสุด 2,400 px และสร้าง JPEG ใหม่ด้วย sharp โดยไม่แนบ EXIF ส่วนเกิน เก็บพิกัด/วันที่เป็นข้อมูลแยกและแสดงต่อสาธารณะ
- ใช้ Prisma models `PhotoShare` / `SharedPhoto`; bytes ของ JPEG เก็บใน PostgreSQL ภายใต้ขนาดที่จำกัด ไม่มี spatial query สำหรับฟีเจอร์นี้ จึงไม่มีคอลัมน์ geometry/GiST หากขยายเป็นข้อมูลขนาดใหญ่ควรย้าย bytes ไป object storage และใช้ PostGIS/MVT สำหรับแผนที่
- `POST /api/photo-shares`: MEMBER/ADMIN ที่บัญชี ACTIVE เท่านั้น ตรวจ session และ origin, Zod validation และเขียน `PHOTO_SHARE_PUBLISHED` ลง AuditLog ใน transaction เดียวกับชุดภาพ
- `/share/[shareId]` และ `GET /api/photo-shares/[shareId]/photos/[photoId]`: PUBLIC เฉพาะชุดที่ published; ไม่คืนข้อมูลบัญชีผู้แชร์หรือรูปจาก IndexedDB

### Database setup for photo shares

การพัฒนาในเครื่องใช้ `npm run db:push` ตาม setup เดิมได้ ไม่ต้อง seed ข้อมูลภาพ สำหรับ production ให้ตรวจทาน SQL ใน `prisma/migrations/` และใช้ Prisma migrations:

```bash
# ฐานข้อมูลใหม่
npx prisma migrate deploy
# จากนั้นสร้าง spatial table ตามขั้นตอน db/init-postgis.sql เดิม
```

ฐานข้อมูลเดิมที่เคยใช้ db:push และยังไม่มี migration history: ตรวจว่าสคีมาเดิมตรงกับ `0_init` ก่อน baseline ด้วย `npx prisma migrate resolve --applied 0_init` แล้วใช้ `npx prisma migrate deploy` เพื่อเพิ่มตารางภาพ หากตารางภาพถูกสร้างด้วย db:push หรือ db execute แล้ว ต้องตรวจว่าสคีมาตรงกับ migration ก่อน mark `20261019000000_public_photo_shares` เป็น applied เช่นกัน ห้ามรัน initial CREATE TABLE ซ้ำบนฐานข้อมูลเดิม ไม่เพิ่ม environment variable หรือ seed password ใหม่สำหรับฟีเจอร์นี้

ตรวจสอบฟีเจอร์ Public sharing โดยไม่ใช้ฐานข้อมูล: `node --import tsx --test tests/photo-sharing.test.ts` ครอบคลุมแท็กวันที่เวลาไทย, ป้องกันการแทนที่แท็กระบบ, EXIF GPS/วันที่ถ่าย, การสร้าง JPEG ที่ไม่มี EXIF ส่วนเกิน และขนาด multipart

## Public Photos map layer

Toolbox → Photo มีสวิตช์ **Layer Public Photos** ซึ่งใช้สถานะเดียวกับชั้น Public Photos ใน sidebar เปิดแล้วโหลดภาพ published ใน viewport ปัจจุบันแบบ debounce 250 ms และยกเลิก request เก่าเมื่อเลื่อนแผนที่หรือปิด layer แสดงไอคอนสีน้ำเงิน คลิกดูภาพ ชื่อเหตุการณ์ แท็ก วันที่ถ่าย และลิงก์ชุดภาพ Public ได้ หลังแชร์ชุดใหม่จะรีเฟรช layer ที่เปิดอยู่

`GET /api/public/photos?bbox=west,south,east,north&limit=200` เป็น PUBLIC คืนเฉพาะ metadata และ URL ภาพ ไม่ส่ง binary ภาพหรือข้อมูลบัญชี ต้องมี bbox ที่ตรวจด้วย Zod (WGS84 รวมกรณีข้ามเส้นวันที่) และ limit 1–200 หากเกินจะแจ้งให้ซูมเข้า มีสถานะกำลังโหลด/ไม่พบภาพ/โหลดผิดพลาด การ query ใช้ Prisma แบบมีตัวกรอง published และ numeric coordinate index ใน migration `20261019010000_public_photo_viewport` หากขยายข้อมูลจำนวนมากควรย้ายไป PostGIS/MVT และ clustering ตามแนวทางโครงการ

Photo renderer ใช้ `photoDataKey` ใน LayerDefinition (`my-photos` / `public-photos`) เพื่อเลือกแหล่งภาพตาม registry โดยไม่เพิ่ม conditional dataset ใน GISMap

Public Photos ใช้ไอคอนกล้องสีฟ้าเหมือน My Photos ปุ่มเฟืองทั้งใน sidebar และ Toolbox เปิดหน้าต่างค้นหา username ผู้แชร์, ชื่อเหตุการณ์ (ค้นหาบางส่วน ไม่แยกตัวพิมพ์ใหญ่เล็ก), วันเริ่มต้น/สิ้นสุดของวันที่ถ่าย EXIF (รวมทั้งสองวัน ตามเวลาของกล้อง), และ tag แบบตรงทั้งแท็ก ชื่อผู้ใช้ เหตุการณ์ ช่วงวันที่ และ tag ใช้ OR: ตรงอย่างน้อยหนึ่งเงื่อนไข โดยช่วงวันที่เป็นเงื่อนไขเดียวที่ต้องอยู่ระหว่างวันเริ่มต้นถึงสิ้นสุดเสมอ และทุกผลลัพธ์ยังต้อง published และอยู่ใน viewport ปัจจุบัน กดค้นหาภาพจะเปิด layer หากยังปิดอยู่ ล้างเงื่อนไขได้ โดยยังจำกัดผล 200 รูป

Public API รองรับ `username`, `eventName`, `startDate=YYYY-MM-DD`, `endDate=YYYY-MM-DD`, `tag` เพิ่มเติม ตรวจรูปแบบวันที่จริงและปฏิเสธช่วงกลับด้านด้วย 400 ค้นหาที่ฐานข้อมูลก่อนจำกัดผล ไม่ส่ง email/ชื่อจริง/ข้อมูลบัญชีอื่น มีเพียง username สาธารณะที่ใช้ระบุผู้แชร์ใน popup ความสัมพันธ์ PhotoShare.owner ใช้ migration `20261019020000_photo_share_owner` และป้องกันการ hard delete บัญชีที่ยังมีชุดภาพ ให้เปลี่ยนสถานะบัญชีตามแนวทางเดิม

หลังแก้ Prisma schema หรือรัน `prisma generate` ให้รีสตาร์ต `npm run dev` ด้วย เพราะ dev server ที่เปิดค้างอาจยัง cache Prisma client เดิม โดยเฉพาะเมื่อเพิ่ม relation (`PhotoShare.owner`) หาก Public Photos คืน 503 แต่ query ด้วย process ใหม่ได้ ให้ตรวจ server log `Public Photos query failed` และรีสตาร์ต dev server ก่อนเปลี่ยนฐานข้อมูล ข้อผิดพลาดภายในไม่ถูกส่งให้ client
