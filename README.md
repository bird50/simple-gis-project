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
| `AUTH_SECRET`    | secret สำหรับลงนาม session; ต้องสุ่มอย่างน้อย 32 ตัวอักษรและห้าม commit — production ปฏิเสธค่าว่าง สั้น หรือค่าตัวอย่าง |
| `NEXTAUTH_URL`   | canonical application URL (เตรียมไว้สำหรับ Auth.js migration) |
| `ADMIN_EMAIL`    | email ของ initial admin                                       |
| `ADMIN_PASSWORD` | initial admin password ขั้นต่ำ 12 ตัวอักษร                    |

`ADMIN_PASSWORD` ใช้เฉพาะ seed และถูก hash ก่อนบันทึก ห้ามใช้ค่าตัวอย่างใน production

## Roles and routes

- `MEMBER`: `/gis`, `/profile` และ GIS APIs
- `ADMIN`: ทุกสิทธิ์ของ MEMBER พร้อม `/admin/*` และ `/api/admin/*`
- ผู้สมัครเองจะเป็น `MEMBER` เสมอ สถานะ `INACTIVE` และ `SUSPENDED` ไม่สามารถ login
- การ “ลบ” ผู้ใช้ควรเปลี่ยน status เป็น `INACTIVE`; API ป้องกันการลดสิทธิ์หรือระงับ admin ที่ ACTIVE คนสุดท้าย ไม่ว่าจะแก้บัญชีตนเองหรือผู้อื่น (ตรวจและบันทึกใน serializable transaction)
- cookie session ใช้ระบุตัวผู้ใช้เท่านั้น `getSession`/`requireUser`/`requireAdmin` อ่าน role และ status จากฐานข้อมูลทุกครั้ง ผู้ใช้ที่ถูกระงับหรือลดสิทธิ์จึงหมดสิทธิ์ทันที ส่วน `proxy.ts` ใช้ JWT เพื่อ redirect เบื้องต้นเท่านั้น
- จำกัดอัตราคำขอในหน่วยความจำต่อ process: login 20 ครั้ง/15 นาที/IP และ 10 ครั้ง/15 นาที/ชื่อผู้ใช้, สมัคร 5 ครั้ง/ชั่วโมง/IP, เผยแพร่ Public Photos/Drawing 20 ครั้ง/ชั่วโมง/IP (ตอบ 429 พร้อม `Retry-After`) IP มาจาก `X-Forwarded-For` จึงต้องอยู่หลัง reverse proxy ที่เขียน header นี้ทับ และเมื่อรันหลาย instance ให้จำกัดที่ reverse proxy ด้วย

## Layer configuration

Basemap อยู่ที่ `config/basemaps.ts` และ registry อยู่ที่ `config/layers.ts` แต่ละ layer มี type, URL, zoom range, style, legend, popup fields และ access level. ใน production สามารถย้าย registry ไป `GisLayer` table โดย UI/API contract เดิมไม่ต้องเปลี่ยน Map component

## PostGIS API

`GET /api/gis/stations?bbox=minX,minY,maxX,maxY&province=เชียงใหม่&type=TELEMETRY&limit=500`

Query ใช้ placeholders ทุกค่า ใช้ connection pool ร่วม (`lib/db/pg.ts`) ตรวจ bbox ให้อยู่ในช่วง WGS84 และ west<east, south<north และจำกัดผลสูงสุด 5,000 records. สำหรับชุดข้อมูลขนาดใหญ่ควรคืน MVT ตาม tile coordinate แทน GeoJSON.

## Production

```bash
npm run lint
npm run build
npm start
```

ก่อน deploy ให้เปลี่ยน secrets, ใช้ TLS, กำหนด CSP/rate limit ที่ reverse proxy, run Prisma migrations แทน `db push`, ใช้ connection pool และตั้ง tile cache/CDN สำหรับ raster/vector tiles

## GIS workspace UI

ลากขอบขวาของ Layer / ขอบซ้ายของ Toolbox เพื่อปรับความกว้าง และลากขอบบนตารางข้อมูลเพื่อปรับความสูงได้ รองรับเมาส์และสัมผัส หรือ Tab ไปที่ตัวแบ่งแล้วใช้ปุ่มลูกศร (Shift เพื่อปรับครั้งละมากขึ้น, Home/End เพื่อเลือกขนาดต่ำสุด/สูงสุด) จำกัดขนาดตามพื้นที่หน้าจอและเลื่อนเนื้อหาภายในได้ ขนาดเก็บระหว่างเปิด–ปิด panel ในหน้านี้

ขอบซ้ายรายการ Layer จาก Toolbox Photo/Draw ใช้แถบสีส้ม ส่วน Layer ปกติใช้สีฟ้า แสดงทั้งขณะเปิดและปิดเลเยอร์

รายการ Layer เริ่มต้นแสดงชื่อหนึ่งบรรทัดและปุ่มดวงตา กดไอคอน ⓘ เพื่อแสดง/ซ่อนคำอธิบาย กดชื่อหรือลูกศรเพื่อคลี่ตัวปรับความทึบและปุ่มตั้งค่า กดซ้ำเพื่อย่อ โดยการคลี่ไม่เปลี่ยนสถานะเปิด–ปิดเลเยอร์

แผง Layer ใช้ธีมมืดไล่เฉด มุมโค้ง พร้อมไอคอนดวงตาสำหรับเปิด–ปิดชั้นข้อมูล แถวที่เปิดแสดงพื้นหลังเข้มและดวงตาสีฟ้า โดยยังปรับความทึบและตั้งค่า Public Photos ได้ตามเดิม

หน้า `/gis` ใช้ shadcn/ui (Radix) โดยเก็บ component ไว้ใน `components/ui/` และตั้งค่าที่ `components.json`; สีผ่าน CSS tokens ใน `app/globals.css` ใช้ `cn()` จาก `lib/utils.ts` รวมคลาส Tailwind

เมื่อเปิด `/gis` จะซ่อนแผงชั้นข้อมูล, Toolbox, ตารางข้อมูล และสัญลักษณ์แผนที่เป็นค่าเริ่มต้น เปิด–ปิดได้จากปุ่มบนแผนที่ แผงชั้นข้อมูลและตารางยุบได้ ค้นหาชื่อสถานี/จังหวัดและเลือกสถานีเพื่อเลื่อนแผนที่ไปยังตำแหน่งนั้น สถานีโหลดจาก `GET /api/gis/stations` ตามขอบเขตแผนที่ (สูงสุด 500 จุด โหลดใหม่หลังเลื่อนแผนที่) ถ้า PostGIS ไม่พร้อมจะแสดงสถานีตัวอย่าง 5 จุดและแจ้งในตารางและแถบล่าง ขอบเขตลุ่มน้ำเป็นข้อมูลสาธิต

**ตารางข้อมูล (Data Panel)** อยู่ใต้แผนที่ แสดงแท็บละหนึ่งชั้นข้อมูลที่เปิดอยู่และมีข้อมูลตาราง (สถานี, ขอบเขตลุ่มน้ำ, My Data Files รวมคอลัมน์ของ CSV) ค้นหาในตาราง แบ่งหน้าละ 100 รายการ คลิกแถวเพื่อเลื่อนแผนที่และเปิด Identify และสลับเป็นกราฟสรุปคอลัมน์ (ฮิสโทแกรมสำหรับตัวเลข หรือ 10 กลุ่มที่พบมากสำหรับข้อความ) หัวคอลัมน์และ popup ใช้ชื่อไทยจาก `fieldLabels` ใน `config/layers.ts` และเรียง `popupFields` ก่อน ยังไม่มีกราฟตามเวลา เพราะยังไม่มีข้อมูลตรวจวัดรายช่วงเวลา ชั้นข้อมูลที่ยังไม่มี URL จะปิดการใช้งานไว้ สิทธิ์เข้าถึง `/gis` ยังคงเป็น MEMBER/ADMIN ตามเดิม

## Toolbox photo service (SQLite)

เฉพาะ Public Photos แยกเป็นระบบ Node.js ใน `../toolbox_service` โดยเว็บเรียกผ่าน Next.js API proxy; service เป็นผู้ตรวจ EXIF, แปลงภาพ, บันทึก JPEG/metadata และ audit ลง SQLite ทั้งหมด ไม่ใช้ Prisma/PostgreSQL สำหรับภาพใหม่ บัญชีและข้อมูล GIS อื่นยังใช้ฐานข้อมูลเดิม

ตั้งค่า `TOOLBOX_SERVICE_URL=http://127.0.0.1:4010`, `TOOLBOX_SERVICE_KEY` (scope `read,write` ใช้ตอนกด Save to Public ของ Photo และ Share Public ของ Draw/Data Files) และ `TOOLBOX_SERVICE_READ_KEY` (scope `read` ใช้กับชั้นข้อมูล Public Photos/Drawings, รูปภาพ และหน้า `/share/...`; เว้นว่างได้ จะใช้ key แรกแทน) ใน `.env` ของเว็บ ออก key ทั้งสองด้วย `npm run key:create -- --app thaiwater --scopes read,write` และ `--scopes read` ใน `../toolbox_service` gateway เลือก key ตาม method: GET ใช้ key อ่าน, POST ใช้ key เขียน Data Files เก็บในเบราว์เซอร์เท่านั้น ไม่เรียก service จึงไม่ใช้ key โดย key ต้องสุ่มอย่างน้อย 32 ตัวอักษร และตรงกับ `.env` ของ service (key ของแอป `TOOLBOX_DEFAULT_APP_ID`) หรือเป็น key ที่ออกด้วย `npm run key:create` ใน `../toolbox_service` gateway ส่งชื่อแอปจาก `TOOLBOX_APP_NAME` (ค่าเริ่มต้น "ThaiWater GIS") และชื่อผู้ใช้ของแอปไปกับทุกการบันทึก Public ให้ service เก็บ ผู้เยี่ยมชมที่ไม่ได้ล็อกอินไม่ส่งชื่อ service จึงเก็บเป็น `anonymous` ห้ามใช้ตัวแปร `NEXT_PUBLIC_*` สำหรับ key แอปอื่นที่ใช้ service เดียวกันต้องได้ key ของตัวเอง และมองไม่เห็นข้อมูลที่แชร์ของเว็บนี้

```bash
cd ../toolbox_service
npm install
# คัดลอก .env.example เป็น .env และตั้ง key ให้ตรงกับเว็บ
npm run dev
```

เปิดอีก terminal รัน `npm run dev` ในเว็บ รีสตาร์ตเว็บหลังเปลี่ยน environment รายละเอียด API/การสำรองอยู่ใน `../toolbox_service/README.md`

- รูปถูกเลือกเข้าชุดเหตุการณ์โดยตรง (SDK 1.7 ไม่มีขั้น Add to My Photos แล้ว) แล้วบันทึกไฟล์ต้นฉบับพร้อมชุดใน IndexedDB `thaiwater-my-photos` ของเบราว์เซอร์ แยกตาม user ID; ผู้เยี่ยมชมใช้ namespace เดิม `guest-workspace-v1` เก็บ 15 วัน ไม่ต่ออายุเมื่ออ่าน ไม่เรียก API หรืออัปโหลดไป service รองรับ JPEG/PNG/WebP รูปละ 10 MB และ GPS จาก EXIF การล้างข้อมูลเว็บไซต์อาจทำให้รูปหายก่อนกำหนด
- **ข้อความประกอบรูป** (ไม่บังคับ ไม่เกิน 500 ตัวอักษร) ใส่ได้ตอนเลือกรูปเข้าชุด และแก้ภายหลังในปุ่ม **จัดการชุดรูปเหตุการณ์** ของชุด แสดงใน popup ของ marker และส่งไปกับ Save to Public (multipart `captions` เรียงตามรูป) หน้า `/share/<id>` และ popup ของ Public Photos แสดงข้อความนี้
- แถว layer ชุดรูปภาพ (My Photos/... และ Public Photos/...) ในแผงชั้นข้อมูลมีปุ่ม − (Remove from map) เอา layer ออกจากแผนที่ ชุดยังอยู่ (`useLayerRemove` ของ SDK 1.8)
- layer รูปภาพที่เปิดอยู่ (My Photos/... และ Public Photos/...) แสดงในตารางข้อมูลด้านล่าง แถวละรูป (ชื่อรูป ข้อความประกอบ วันที่ถ่าย ชุดเหตุการณ์ แชร์โดย แท็ก) กดชื่อรูปแล้วแผนที่ซูมไปที่รูปและเปิด popup ของรูป
- **Save ชุดเหตุการณ์** ตั้งชื่อเหตุการณ์ (บังคับกรอก) แท็ก และเลือกรูป 1–10 รูปที่มีพิกัด GPS (รูปที่ไม่มีพิกัดถูกข้าม) เก็บในเบราว์เซอร์เท่านั้น แต่ละชุดมีปุ่ม **Add to map** (ไอคอน + พร้อมคำว่า Add to map และเมื่อชุดอยู่บนแผนที่จะมี **Remove from map** ไอคอน − เพื่อเอา layer ออกโดยชุดและรูปยังอยู่ เพิ่ม layer "My Photos/ชื่อเหตุการณ์" ของชุดนั้นในกลุ่ม "ข้อมูลของฉัน" และซูมไปที่ชุด ซ่อนได้ด้วยปุ่มตาของ layer นั้น ลบชุดแล้ว layer หายไป ตั้งแต่ SDK 1.5 ไม่มี layer My Photos รวมแล้ว) **จัดการชุดรูปเหตุการณ์** (แก้ชื่อเหตุการณ์และแท็ก ชื่อ layer เปลี่ยนตาม ติ๊กออกเพื่อเอารูปออก หรือเลือกไฟล์ใหม่เพิ่มเข้าชุด) **Save to Public** (อัปโหลดทั้งชุดครั้งเดียวและเก็บลิงก์ไว้ การแก้รูปภายหลังไม่เปลี่ยนชุดบน Public) และลบชุด (รูปที่ไม่อยู่ในชุดใดแล้วถูกลบจากเบราว์เซอร์ด้วย) ภาพที่มีอยู่ก่อนอัปเดตถูกรวมเป็นชุด "My Photos เดิม" ซึ่งขึ้นเป็น layer "My Photos/My Photos เดิม" ไว้แล้ว
- ล้างภาพในเครื่องที่หมดอายุเมื่อเข้า GIS, กลับมาที่แท็บ และทุก 1 นาที My Photos ใช้งานได้แม้ service ไม่พร้อม
- **Save to Public** ของชุดเหตุการณ์อัปโหลดภาพในชุด เป็น multipart `{eventName,tags,photos,captions}` ครั้งละ 1–10 รูป รวม request ไม่เกิน 25 MB ตรวจ GPS/วันที่ถ่ายจาก EXIF ใหม่ แปลงเป็น JPEG ด้านยาวสูงสุด 2,400 px และถอด EXIF ส่วนเกิน บันทึก Public พร้อม audit ใน transaction และแท็ก `shareYYYY-MM-DD` เวลาไทย ภาพ Public ไม่หมดอายุตาม My Photos
- `POST /api/photo-shares`: เมื่อเปิดระบบบัญชีใช้ requireUser และตรวจ ACTIVE; โหมดผู้เยี่ยมชมใช้ signed HTTP-only cookie ระบุผู้เผยแพร่ ไม่เกี่ยวกับการบันทึก/อ่าน My Photos ไม่มี My Photos API ในเว็บหรือ service
- `GET /api/public/photo-shares` (ค้นหาชุดรูปภาพ), `GET /api/photo-shares/[shareId]` (ข้อมูลชุดสำหรับ Add to map), `GET /api/public/photos?bbox=west,south,east,north&limit=200` (คงไว้ให้ client เดิม), `/share/[shareId]` และ `GET /api/photo-shares/[shareId]/photos/[photoId]`: PUBLIC ผ่าน proxy โดยไม่เปิดเผย service key; gateway ส่งต่อเฉพาะพารามิเตอร์ที่ผ่านการตรวจ (`lib/toolbox/public-query.ts`)
- Public Photos (SDK 1.6) ไม่มี layer ที่โหลดตาม viewport และไม่มีสวิตช์ใน Toolbox แล้ว ปุ่มเฟืองเปิด **ค้นหาชุดรูปภาพ Public**: เปิดแล้วแสดงชุดล่าสุดก่อน กรองด้วย `eventName`, `username` (ค้นหาบางส่วน), `tag` (ทั้งคำ) และ `startDate`/`endDate` (ชุดที่มีภาพถ่ายในช่วงนั้น) แบบ AND ทีละ 20 ชุดพร้อมปุ่มโหลดเพิ่ม แต่ละชุดมีปุ่ม **Add to map** ที่เพิ่ม layer "Public Photos/ชื่อชุด" ในกลุ่ม "ภาพถ่ายสาธารณะ" และซูมไปที่ชุด เอาออกได้ด้วยปุ่ม **Remove from map** (ไอคอน −) ในหน้าค้นหา ชุดที่เพิ่มไว้จำใน localStorage ของเบราว์เซอร์ (เฉพาะ ID และชื่อ) และถูกตัดออกเองเมื่อชุดถูกลบจาก service
- `capturedAt` เป็นเวลาตามกล้องและ `capturedOffset` เป็น timezone จาก EXIF ไม่ใช้เวลาอัปโหลดแทนวันที่ถ่าย

My Photos ใน IndexedDB เดิมที่ยังไม่หมดอายุอ่านต่อได้ทันที ข้อมูล Public เดิมใน Prisma ยังไม่ย้ายเข้า SQLite อัตโนมัติ ข้อมูล My Photos ที่เคยบันทึกใน SQLite ระหว่างการพัฒนายังไม่ถูกลบ แต่ไม่ได้อ่านกลับเข้าหน้า My Photos; ไม่มีการย้ายกลับเบราว์เซอร์อัตโนมัติ Simple Data Files และ Draw เก็บแยกบนเบราว์เซอร์

ตรวจ service ด้วย `npm run lint`, `npm run build`, `npm test` ในโฟลเดอร์ `toolbox_service` ทดสอบ multipart publication, validation, atomicity, ตัวกรอง และข้อมูลหลังเปิดฐานข้อมูลใหม่

## Drawing Toolbar

Toolbox → Draw → **Drawing Toolbar** เปิด/ปิดแถบเครื่องมือด้านขวาบนแผนที่ สีเริ่มต้นของรูปวาดเป็นสีแดง เปิดแล้วเปิด Layer My Drawing ด้วย ปิดแถบแล้วกลับไปเลื่อนแผนที่ได้และรูปวาดยังแสดงจนกว่าจะปิด layer

- Select: แสดงพิกัดทุกจุดของวัตถุที่เลือกเป็นละติจูด, ลองจิจูด (WGS84) ในแถบเครื่องมือ อัปเดตขณะย้ายหรือปรับขนาด คลิกเลือกและลากย้าย ลากจุดมุมล่างขวาเพื่อปรับขนาด; Pan: เลื่อนแผนที่ตามปกติ
- Pen / Highlighter: ลากเมาส์หรือนิ้วเพื่อวาดเส้นอิสระหรือเน้นด้วยสีโปร่งใส; Eraser: คลิกเพื่อลบทั้งวัตถุ
- Point: คลิกเพิ่มจุด; Line / Polygon: คลิกเพิ่มจุดแล้วกดเสร็จสิ้นหรือ Enter (อย่างน้อย 2 / 3 จุด)
- Rectangle / Circle / Arrow: ลากเพื่อสร้าง; วงกลมใช้ระยะทางบนโลกผ่าน Turf.js
- Text / Textbox / Label / Sticky Note / Legend: กรอกข้อความแล้วคลิกวาง; Legend ใช้หนึ่งรายการต่อบรรทัด; Callout: ลากจากจุดที่ต้องการชี้ไปตำแหน่งข้อความ; Number Marker: เพิ่มเลขต่อเนื่องอัตโนมัติ
- เลือกวัตถุเพื่อแก้ข้อความและรูปแบบได้: Font, Size, Color, Background, Border, Transparency, Rotation และ Alignment; ขนาดเส้นกำหนดความหนากรอบด้วย
- Undo/Redo (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z), Delete ลบวัตถุที่เลือก, Escape ยกเลิกการวาดที่ยังไม่เสร็จ; ไม่จับคีย์ลัดขณะพิมพ์ในฟอร์ม

รูปวาดที่กำลังแก้ไขอยู่ในหน่วยความจำ กด **บันทึก My Drawing** ใน Drawing Toolbar เพื่อเก็บใน IndexedDB `thaiwater-my-drawing` แยกตาม user ID (guest ใช้ namespace เดิม) เป็นเวลา 15 วันนับจากบันทึกครั้งล่าสุด อ่านกลับเมื่อเข้า GIS และล้างรายการหมดอายุเมื่อเปิดครั้งถัดไป การแก้ไขที่ไม่ได้กดบันทึกจะหายเมื่อรีเฟรช ไม่ส่ง My Drawing ไป service จำกัด 500 วัตถุ / 2,000 จุดต่อเส้น / Undo 50 ขั้น พิกัดใช้ WGS84 และ overlay ฉายตำแหน่งใหม่เมื่อเลื่อน ซูม หมุน หรือปรับขนาดแผนที่ ข้อความใช้ JSX ไม่ใช้ HTML จากผู้ใช้

## Webmap extensions

Toolbox ใช้ Tool API 2.0 ของ SDK: `config/toolboxes.tsx` เป็นรายการ plugin (Simple Data Files, Photo, Draw, มุมมองแผนที่) ซึ่งแต่ละตัวลงทะเบียน layer, state, overlay และ dialog ของตัวเอง ส่วน `config/layers.ts` เหลือเฉพาะ layer ระบบ การเพิ่ม GeoJSON ทั่วไปใช้ `render` ใน layer registry ได้ อ่านสัญญา วิธีเพิ่ม layer/toolbox และข้อกำหนดการนำไปใช้กับ Webmap อื่นใน [Webmap extension guide](docs/webmap-extensions.md)

## Temporary account-free mode

ขณะนี้ `AUTH_ENABLED=false` ใน `lib/auth/mode.ts`: `/gis`, `GET /api/gis/layers` และ `GET /api/gis/stations` ใช้งานได้โดยไม่ล็อกอิน ผู้เยี่ยมชมเห็น layer ระดับ PUBLIC/MEMBER ส่วน ADMIN ยังคงไม่เปิดเผย หน้าแรกแสดงปุ่มเปิด GIS โดยตรง

My Photos และ Simple Data Files ใช้ namespace `guest-workspace-v1` ใน IndexedDB ของเบราว์เซอร์ ภาพเดิมยังไม่ถูกย้าย/ลบ; signed cookie ของ Toolbox ใช้เฉพาะระบุผู้เผยแพร่ Public

หน้า login/register/profile/admin ส่งไป `/gis`; API login/register/profile/admin พักใช้งานด้วย 503 โดยไม่เปิดข้อมูลบัญชีหรือสร้างบัญชีสมมติ Logout ยังล้าง cookie ได้ หากต้องการเปิดระบบบัญชีกลับ ให้เปลี่ยน `AUTH_ENABLED=true` แล้ว build/restart โดยใช้ AUTH_SECRET และฐานข้อมูลตาม setup เดิม ข้อกำหนดสิทธิ์ในส่วนอื่นของ README อธิบายการทำงานเมื่อเปิดระบบบัญชี

## Simple Data Files (frontend)

Toolbox → **Simple Data Files** → เฟือง **Layer My Data Files** เปิดหน้าต่างนำเข้าไฟล์หนึ่งไฟล์ต่อครั้งพร้อมคำอธิบาย (ไม่บังคับ สูงสุด 1,000 ตัวอักษร) เพิ่มแล้วเปิด Layer และซูมไปยังข้อมูลอัตโนมัติ รายการแสดงชื่อ คำอธิบาย จำนวน features วันหมดอายุ และปุ่มลบ สวิตช์ใน Toolbox กับ sidebar ใช้สถานะเดียวกัน ปรับความทึบใน sidebar ได้ และขอบซ้ายเป็นสีส้ม

- `.kml`: Point, LineString, Polygon (รวมรูด้านใน) และ MultiGeometry ที่ประกอบด้วยชนิดเหล่านี้ อ่านชื่อ/คำอธิบายเป็นข้อความ ไม่โหลด NetworkLink, รูปภาพ หรือ URL ภายนอก ไม่รองรับ KMZ, GroundOverlay หรือ gx:Track
- `.geojson` / `.json`: Feature หรือ FeatureCollection ของ Point, LineString, Polygon และ MultiPoint/MultiLineString/MultiPolygon; properties เป็น string/number/boolean/null ไม่รองรับ GeometryCollection, null geometry หรือ properties แบบซ้อน
- `.csv`: แถวหัวคอลัมน์ต้องมี `latitude`/`lat` และ `longitude`/`lon`/`lng` (ไม่แยกตัวพิมพ์ใหญ่เล็ก) รองรับ UTF-8/BOM, quoted commas และ multiline fields คอลัมน์อื่นแสดงใน popup เป็นข้อความ แถวผิดพลาดทำให้ปฏิเสธไฟล์ทั้งหมด
- พิกัด WGS84 (`EPSG:4326`, longitude ก่อน latitude) ทุกประเภท ไฟล์ไม่เกิน 5 MB / 5,000 features / 50,000 จุดพิกัด; รวมไม่เกิน 20 ไฟล์ / 10,000 features / 20 MB หลังแปลง ไม่เหมาะกับข้อมูลขนาดใหญ่ ซึ่งควรให้บริการผ่าน viewport/MVT

เก็บข้อมูลที่แปลงแล้วและ metadata ใน IndexedDB `thaiwater-data-files` แยกตาม user ID; โหมดผู้เยี่ยมชมใช้ namespace `guest-workspace-v1` ไม่อัปโหลดหรือสร้าง API ใหม่ เก็บ 15 วันนับจาก transaction บันทึกสำเร็จ การอ่านไม่ต่ออายุ ล้างข้อมูลหมดอายุเมื่อเข้า GIS, กลับมาที่แท็บ และทุก 1 นาทีระหว่างเปิดหน้า เมื่อปิดเว็บจะล้างครั้งถัดไปที่เปิด การล้างข้อมูลเว็บไซต์หรือ browser eviction อาจทำให้ข้อมูลหายก่อนกำหนด

plugin `dataFilesTool` วาดจุด เส้น และพื้นที่ร่วมกันผ่าน GeoJSON surface ของ map adapter โดยใช้ layer ID เดิม (`registry-my-data-files-*`) จึงคลิก Identify ได้และคงอยู่เมื่อเปลี่ยนแผนที่ฐาน แถบสีส้มใน sidebar มาจาก layer ที่มี owner เป็นเครื่องมือ และปุ่มเฟืองใน sidebar เปิด dialog เดียวกับ Toolbox ผ่าน `useLayerSettings`

ตรวจ parser: `node --import tsx --test tests/data-files.test.ts`

## Public Drawing service

ใน Drawing Toolbar ระบุชื่อชุดและกด **Save & Share Public** เพื่ออัปโหลดวัตถุที่เลือก หากไม่ได้เลือกจะส่งทั้งชุด ผู้ใช้เห็นข้อความยืนยันขอบเขตก่อนกด ทุกคนเห็นรูปวาดและข้อความที่เผยแพร่แล้ว การแก้ไข My Drawing ไม่เปลี่ยนสำเนา Public เปิด Layer Public Drawing เพื่อดูผล โดยรักษาสี รูปแบบ ข้อความ ลูกศร และการหมุนตามต้นฉบับ

- `POST /api/drawing-shares` ส่ง JSON `{name,drawings}` ผ่าน proxy ไป `/drawing-shares` ใน Toolbox; requireUser/ACTIVE เมื่อเปิดบัญชี หรือ signed guest identity ในโหมดปัจจุบัน พร้อม same-origin check ใช้ key เฉพาะฝั่งเซิร์ฟเวอร์
- Zod ตรวจชนิดวัตถุ พิกัด WGS84 รูปทรงปิด สี hex และรูปแบบที่อนุญาต แชร์ 1–100 วัตถุ ไม่เกิน 20,000 จุด / 1 MB; การบันทึก My Drawing จำกัด 500 วัตถุ / 20,000 จุด / 1 MB ข้อความวัตถุละ 1,000 ตัวอักษร
- `POST /api/data-file-shares` ส่ง JSON `{name,description,tags,data}` (FeatureCollection ของไฟล์หนึ่งไฟล์ ไม่เกิน 5,000 รายการ / 50,000 พิกัด / 5 MB) ผ่าน proxy ไป `/data-file-shares` ด้วยการตรวจตัวตน, same-origin, rate limit และ key `read,write` แบบเดียวกับรูปวาด ระบบเพิ่มแท็ก `shareYYYY-MM-DD` เอง
- `GET /api/public/data-files?bbox=west,south,east,north&limit=500&search=&tag=` เป็น PUBLIC ส่งต่อเฉพาะพารามิเตอร์ที่ผ่าน `publicDataFileSearch` (limit 1–1000) คืน features ที่กรอบทับ viewport พร้อม `share_name`, `share_description`, `share_username`, `share_tags`, `share_id` จำกัด 100,000 พิกัด / 4 MB ต่อคำตอบ
- `GET /api/public/drawings?bbox=west,south,east,north&limit=50` เป็น PUBLIC และ proxy ไป `/public/drawings` ค้นหากรอบรูปวาดที่ทับ viewport ด้วย indexed numeric bounds ใน SQLite รวม viewport ข้ามเส้นวันที่ จำกัด 50 วัตถุ (gateway ปฏิเสธ `limit` เกิน 50) / 20,000 จุด / ประมาณ 1 MB ต่อคำตอบ พร้อม `hasMore` ให้ซูมเข้า เป็นการค้นหากรอบ ไม่ใช่ exact geometry intersection
- ไม่ดึงข้อมูลทั้งชุดฐานข้อมูล; debounce 250 ms และยกเลิก request เก่า รองรับ loading/empty/error และปรับ opacity/visibility ผ่าน registry เดิม Public Drawing เป็น read-only ไม่แก้หรือลบด้วยเครื่องมือ My Drawing
- SQLite เก็บ `drawing_shares`, `drawings`, `drawing_bounds` และ audit `DRAWING_SHARE_PUBLISHED` ใน transaction เดียว ไม่เพิ่ม environment variable และไม่ใช้ PostgreSQL สำหรับรูปวาด

## Toolbox SDK และ 3 Panels

โค้ดเครื่องมือที่ใช้ซ้ำอยู่ใน `../toolbox_sdk` เป็น npm package `@thaiwater/toolbox-sdk` เว็บติดตั้งด้วย local file dependency (`install-links=true`) ไม่ import source ด้วย alias ข้ามโครงการ ก่อนติดตั้งเว็บใน checkout ใหม่ให้มีโฟลเดอร์ SDK อยู่ข้างกัน และรัน `npm install` ใน SDK เพื่อสร้าง JavaScript/type declarations จากนั้นรัน `npm install` ในเว็บ

- **Map Panel**: แอปเลือก map engine และ basemap; `<ToolOverlays/>` ภายใน MapLibreToolboxBridge แสดง overlay ของทุกเครื่องมือ (Data Files ผ่าน GeoJSON surface, Drawing SVG และ Photo markers/popup แบบ HTML ที่วางตำแหน่งผ่าน `MapAdapter.project` จึงไม่ผูกกับ MapLibre)
- **Layer Panel**: ใช้ LayerRegistry ของ SDK เป็นสถานะกลาง visibility/opacity/ลำดับ/การลงทะเบียน (`useLayers()`) ทั้ง sidebar และ Toolbox อ่าน/เขียนสถานะชุดเดียวกัน เว็บนี้คงหน้าตา Layer Panel เดิม Layer ของเครื่องมืออยู่บนสุดตามลำดับ plugin
- **Toolbox Panel**: `<ToolboxPanel/>` แสดงเครื่องมือตามสิทธิ์และความสามารถของแผนที่ (เครื่องมือขึ้นเมื่อแผนที่พร้อม) และ `<ToolDialogs/>` แสดงหน้าตั้งค่า ซึ่งเปิดได้ครั้งละหนึ่งหน้าต่าง ปรับตำแหน่งผ่าน CSS variables ได้

`GET /api/gis/layers` และหน้า `/admin/layers` แสดงเฉพาะ layer ระบบใน `config/layers.ts` เพราะ layer ของ Toolbox ลงทะเบียนในเบราว์เซอร์โดย plugin

`lib/toolbox/runtime.ts` ระบุ appId, storage และ gateway client ของเว็บนี้ ใช้ชื่อ IndexedDB เดิมอย่างชัดเจนเพื่ออ่านข้อมูลเดิมต่อได้ ไม่อัปโหลดหรือย้าย My Photos/My Drawing โดยอัตโนมัติ แอปใหม่เรียก `createBrowserStorage(appId)` จะได้ namespace แยกแอปและ schema v1; userId แยกเจ้าของภายในฐานข้อมูล

เว็บใช้ SDK 1.2 ผ่าน entry ที่ประกาศไว้เท่านั้น (`@thaiwater/toolbox-sdk`, `/react/core`, `/maplibre`, `/storage`, `/core/*`, `/tools/*`) ไฟล์ compatibility re-export เดิมใน `components/map/` ถูกลบแล้ว ส่วน `lib/gis/{data-files,drawing,photo-gps,photo-share,public-photo-query}.ts` ยังเป็น re-export สำหรับโค้ดและ test ฝั่ง server; API routes และการตรวจสิทธิ์ยังอยู่ในเว็บ/Toolbox Service ไม่ย้าย secrets เข้า SDK ข้อความใน UI ของเครื่องมือมาจาก `thMessages` ของ SDK และสีเปลี่ยนได้ผ่าน CSS variables `--sdk-*` (ดู `../toolbox_sdk/README.md`)

การแก้ SDK: รัน lint/build/test ใน `../toolbox_sdk`, อัปเดต package version เมื่อเปลี่ยน release แล้ว `npm install ../toolbox_sdk --install-links` ในเว็บ เพื่ออัปเดตสำเนาแพ็กเกจที่ติดตั้ง ไม่แก้ไฟล์ใน node_modules

ก่อนและหลังเปลี่ยน SDK ให้ตรวจพฤติกรรม `/gis` ด้วยมือตาม [Toolbox regression checklist](docs/toolbox-regression-checklist.md) และบันทึกผลท้ายไฟล์

ดูรายละเอียดใน `../toolbox_sdk/README.md` และแอปตัวอย่างอิสระ `../toolbox_sdk/examples/react-maplibre` กับ `../toolbox_sdk/examples/leaflet` (เครื่องมือชุดเดียวกันบน Leaflet) ซึ่งมี Map/Layer/Toolbox และไม่ import source ของ ThaiWater แอปตัวอย่างใช้พื้นหลังว่าง ไม่ต้องใช้ tile API key; Public API ต้องกำหนด gateway ของระบบปลายทาง
