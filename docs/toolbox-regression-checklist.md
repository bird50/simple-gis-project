# Toolbox regression checklist

ใช้ตรวจพฤติกรรมของ `/gis` ก่อนและหลังแต่ละ phase ของการ refactor `@thaiwater/toolbox-sdk` เป็น Tool Plugin ค่าที่บันทึกไว้ที่นี่คือพฤติกรรมปัจจุบัน (SDK 0.1.2, Host API 1.0, storage schema v1) หากผลต่างจากนี้ ให้ถือเป็น regression เว้นแต่ phase นั้นตั้งใจเปลี่ยนและบันทึกไว้ใน migration note

## เตรียมการ

1. รัน Toolbox Service: `cd ../toolbox_service && npm run dev` (ใช้ `TOOLBOX_SERVICE_KEY` ตรงกับเว็บ)
2. รันเว็บ: `npm run dev` แล้วเปิด `http://localhost:3000/gis`
3. เตรียมไฟล์ทดสอบ:
   - JPEG ที่มี GPS และ `DateTimeOriginal` 2 รูป และ JPEG ที่ไม่มี GPS 1 รูป
   - `.kml` ที่มี Point/LineString/Polygon, `.geojson` แบบ FeatureCollection, `.csv` ที่มีคอลัมน์ `lat,lon`
   - ไฟล์ผิดรูปแบบ เช่น `.kmz` หรือ CSV ที่ไม่มีคอลัมน์พิกัด
4. ทดสอบในโหมดปัจจุบัน (`AUTH_ENABLED=false`, ผู้เยี่ยมชม) ทุกข้อ

ผลที่คาดหวังเขียนไว้หลัง "→" ติ๊ก `[x]` เมื่อผ่าน

## A. Layout 3 Panel

- [ ] เปิด `/gis` ครั้งแรก → แผงชั้นข้อมูล, Toolbox, ตารางข้อมูล และสัญลักษณ์ ถูกซ่อน แผนที่แสดงเต็ม
- [ ] My Photos → Add to My Photos แล้วภาพยังไม่ขึ้นแผนที่, Save ชุดเหตุการณ์โดยไม่ใส่ชื่อแล้วขึ้นข้อความให้ระบุชื่อ, Save ชุด (ชื่อ + แท็ก + เลือกภาพ), Add to map แล้วมี marker และซูมไปที่ชุด (ไม่มีปุ่มซ่อน), เพิ่ม-ลบรูปในชุดแล้ว marker เปลี่ยนตาม, ใส่ข้อความประกอบรูปตอนเพิ่มรูปและในตัวแก้ชุดแล้วเห็นใน popup, หน้า /share และ popup ของ Public Photos, Save to Public ได้ลิงก์และแท็ก shareYYYY-MM-DD และ service เก็บชื่อแอปและผู้ใช้ (ผู้เยี่ยมชม = anonymous), ลบชุดแล้วภาพยังอยู่
- [ ] ตารางข้อมูล → แท็บตาม layer ที่เปิด (ปิด layer แล้วแท็บหาย), ค้นหา, คลิกแถวแล้วแผนที่เลื่อนไปและเปิด Identify, โหมดกราฟ, นำเข้า CSV แล้วแท็บ My Data Files แสดงคอลัมน์ของไฟล์
- [ ] กด "ชั้นข้อมูลแผนที่" และ "Toolbox" → แผงซ้ายและขวาเปิด แผนที่ resize ไม่มีแถบว่าง
- [ ] ลากตัวแบ่งแผง (เมาส์และแป้นลูกศร/Home/End) → ความกว้างเปลี่ยนในช่วงที่จำกัด
- [ ] หน้าจอกว้าง < 768 px เปิด Toolbox → แผงชั้นข้อมูลปิดอัตโนมัติ

## B. Layer Panel ↔ Toolbox sync

- [ ] Layer ของ Toolbox (My Photos, Public Photos, My Drawing, Public Drawing, My Data Files) มีแถบสีส้ม Layer ปกติเป็นสีฟ้า
- [ ] เปิด–ปิด My Photos จาก sidebar → สวิตช์ใน Toolbox เปลี่ยนตาม และกลับกัน (ทำซ้ำกับ My Drawing, Public Drawing, My Data Files; Photo ไม่มีสวิตช์ ใช้ปุ่มตาของแต่ละชุดใน sidebar)
- [ ] ปรับความทึบใน sidebar → marker/รูปวาด/ข้อมูลไฟล์บนแผนที่จางลงตามค่า
- [ ] ลำดับการวาด GeoJSON (ขอบเขตลุ่มน้ำ, สถานี, My Data Files) เป็นไปตามลำดับใน registry → บันทึกลำดับที่เห็นไว้เป็นค่าอ้างอิง เพราะ SDK 0.1.2 เริ่มใช้ `moveLayer`
- [ ] Layer ระดับ ADMIN (พื้นที่เสี่ยงน้ำท่วม) ไม่ปรากฏในโหมดผู้เยี่ยมชม

## C. Photo

- [ ] Toolbox → Photo → เฟือง My Photos → เพิ่ม JPEG ที่มี GPS 2 รูป → จำนวนรูปเป็น 2 และยังไม่มี layer ใหม่, Save ชุดแล้ว Add to map → มี layer "My Photos/<ชื่อชุด>" ในกลุ่มข้อมูลของฉัน (ไอคอนกล้อง) และแผนที่ซูมไปที่ชุด, ปุ่มตาของ layer ซ่อนเฉพาะชุดนั้น, เฟืองของ layer เปิดจัดการ My Photos, ลบชุดแล้ว layer หาย
- [ ] เพิ่ม JPEG ที่ไม่มี GPS → แสดงข้อความแจ้งเตือน ไม่ถูกเพิ่ม
- [ ] คลิก marker → popup แสดงชื่อ, รูป และวันหมดอายุบนเครื่อง
- [ ] รีเฟรชหน้า → My Photos ยังอยู่ (IndexedDB `thaiwater-my-photos`)
- [ ] เลือกรูปแล้ว Save & Share Public พร้อมชื่อเหตุการณ์และแท็ก → สำเร็จ; ค้นหาชุดใน Public Photos แล้ว Add to map เห็นรูปที่แชร์ พร้อมลิงก์ "ดูชุดภาพ Public" ที่เปิด `/share/<id>` ได้
- [ ] เฟือง Public Photos → แสดงชุดรูปภาพล่าสุดก่อน (ยังไม่มีอะไรขึ้นแผนที่) → กรองด้วยชื่อผู้ใช้/เหตุการณ์/แท็ก/ช่วงวัน (AND) → Add to map แต่ละชุดได้ layer "Public Photos/ชื่อชุด" และซูมไปที่ชุด, ปุ่มตาซ่อนเฉพาะชุดนั้น, เอาออกจากหน้าค้นหาแล้ว layer หาย, รีเฟรชหน้าแล้วชุดยังอยู่
- [ ] Toolbox → Photo ไม่มีสวิตช์ Public Photos มีเฉพาะเฟืองและจำนวน "ชุดบนแผนที่ N"
- [ ] หยุด Toolbox Service แล้วเลื่อนแผนที่ → ข้อความ error ใน Toolbox แต่ My Photos ยังใช้ได้

## D. Draw

- [ ] Toolbox → Draw → เปิด Drawing Toolbar → แถบเครื่องมือขวาบนปรากฏ, Layer My Drawing เปิดอัตโนมัติ
- [ ] วาด Point, Line, Polygon, Rectangle, Circle, Arrow, Text, Sticky Note อย่างละ 1 → จำนวนวัตถุใน Toolbox เพิ่มตาม
- [ ] Select วัตถุ → แสดงพิกัด WGS84 ลากย้ายและปรับขนาดได้ แก้สี/ขนาด/การหมุนได้
- [ ] Undo/Redo (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z), Delete, Escape ทำงาน และไม่ทำงานขณะพิมพ์ในช่องข้อความ
- [ ] เลื่อน/ซูม/หมุนแผนที่ → รูปวาดอยู่ตำแหน่งเดิมบนพื้นโลก
- [ ] กด "บันทึก My Drawing" แล้วรีเฟรช → รูปวาดกลับมาครบ; ถ้าไม่กดบันทึก รีเฟรชแล้วหาย
- [ ] Save & Share Public พร้อมชื่อชุด → เปิด Layer Public Drawing เห็นรูปวาดพร้อมสี/ข้อความ/การหมุนเดิม และแก้ไขไม่ได้
- [ ] ปิด Drawing Toolbar → กลับไปเลื่อนแผนที่ได้ รูปวาดยังแสดงจนปิด Layer

## E. Simple Data Files

- [ ] Toolbox → Simple Data Files → เฟือง → นำเข้า `.kml` พร้อมคำอธิบาย → Layer My Data Files เปิด แผนที่ซูมไปยังข้อมูล จำนวนไฟล์เพิ่ม
- [ ] นำเข้า `.geojson` และ `.csv` → แสดงจุด เส้น และพื้นที่ร่วมกันใน Layer เดียว
- [ ] คลิก feature ของไฟล์ → popup Identify แสดง `data_file`, `file_description` และ properties
- [ ] นำเข้าไฟล์ผิดรูปแบบ → ข้อความ error ชัดเจน ไม่มีข้อมูลบางส่วนถูกเพิ่ม
- [ ] ลบไฟล์จากรายการ → หายจากแผนที่และจำนวนลดลง
- [ ] รีเฟรช → ไฟล์ยังอยู่ (IndexedDB `thaiwater-data-files`)

## F. Navigation tool และส่วนของเว็บ

- [ ] เครื่องมือ "มุมมองแผนที่" → กด "แสดงประเทศไทย" แผนที่บินไปที่ประเทศไทย และนับจำนวน Layer ที่เปิดถูกต้อง
- [ ] ค้นหาสถานี/จังหวัดแล้วเลือก → แผนที่เลื่อนไปยังสถานี
- [ ] คลิกสถานีหรือขอบเขตลุ่มน้ำ → popup Identify แสดงข้อมูล
- [ ] เปลี่ยน basemap → Layer ทั้งหมดยังแสดงและลำดับไม่เปลี่ยน

## G. ข้อมูลเดิมและความปลอดภัย

- [ ] ข้อมูล My Photos/My Drawing/My Data Files ที่บันทึกก่อนอัปเดต SDK ยังอ่านได้ (ชื่อ IndexedDB เดิมใน `lib/toolbox/runtime.ts`)
- [ ] DevTools → Network: ไม่มี request ใดส่ง `TOOLBOX_SERVICE_KEY` หรือ header `authorization` จากเบราว์เซอร์
- [ ] My Photos, My Drawing และ My Data Files ไม่สร้าง request ไป server จนกว่าจะกด Share Public

## ผลการตรวจ

| วันที่ | Phase / เวอร์ชัน SDK | ผู้ตรวจ | ผ่าน | ข้อที่ไม่ผ่าน / หมายเหตุ |
|---|---|---|---|---|
| 2026-10-26 | Phase 3 / SDK 0.4.0 | Claude (ตรวจบางข้อ) | A, B, D บางส่วน, E บางส่วน, F บางข้อ | ผ่าน: Layer↔Toolbox sync, ปุ่มเฟืองใน sidebar, dialog เปิดได้ครั้งละหนึ่ง, นำเข้า GeoJSON, Identify feature ของไฟล์, เปลี่ยน basemap แล้ว layer ไฟล์ยังอยู่, Drawing Toolbar + วาด/บันทึก/รีโหลด, Toolbox ปิดเมื่อเปิด Drawing Toolbar ที่กว้าง 1024 px ยังไม่ได้ตรวจ: C (Photo กับรูปจริง/Share Public เพราะไม่ได้รัน Toolbox Service), Public Drawing, KML/CSV ในเบราว์เซอร์, ลบไฟล์ หมายเหตุ: ในกลุ่ม "ข้อมูลของฉัน" ลำดับเปลี่ยนเป็น My Data Files, My Photos, My Drawing และกลุ่มภาพถ่ายสาธารณะขึ้นก่อนรูปวาดสาธารณะ |
| 2026-10-26 | Phase 4–6 / SDK 1.0.0 | Claude (ตรวจบางข้อ) | A, B, C บางส่วน | ผ่าน: `/gis` โหลดบน Next 16.4.3, เครื่องมือครบ 4 ตัว, marker My Photos แบบ HTML และ popup (ใช้รูปทดสอบที่ใส่ใน IndexedDB แล้วลบออก) ยังไม่ได้ตรวจ: เพิ่มรูปผ่านหน้าต่าง My Photos ด้วยรูปที่มี EXIF จริง, Public Photos/Drawing กับ Toolbox Service, ข้อ D/E ซ้ำหลังเปลี่ยนสีเป็น token |
| 2026-10-26 | SDK 1.2.0 (Data Panel) | Claude (ตรวจบางข้อ) | A บางส่วน, ตารางข้อมูล | ผ่าน: แท็บขอบเขตลุ่มน้ำ/สถานี, ข้อความแจ้งเมื่อ PostGIS ไม่พร้อม (ใช้สถานีตัวอย่าง), คลิกแถวสถานีแล้วบินไปและเปิด Identify ที่มีหัวข้อไทย, กราฟพื้นที่ลุ่มน้ำ, หน้าจอ 375 px ไม่มี scroll แนวนอน ยังไม่ได้ตรวจ: นำเข้า CSV ผ่านหน้าต่างในเบราว์เซอร์ (ตรวจด้วย DOM test ของ SDK), สถานีจาก PostGIS จริง |
| 2026-10-27 | SDK 1.4.0 (ชุดเหตุการณ์ภาพ) | Claude (ตรวจบางข้อ) | ข้อ My Photos | ผ่านบน production build พอร์ต 3100 ด้วยภาพทดสอบที่มี GPS: เพิ่มภาพแล้วไม่ขึ้นแผนที่, Save ชุด 2 ภาพพร้อมแท็ก, Add to map ได้ marker 2 จุด, Share Public ได้ลิงก์ (หน้า /share ตอบ 200) แล้วลบรายการทดสอบออกจาก service ยังไม่ได้ตรวจ: อัปเกรดฐานข้อมูลเดิมในเบราว์เซอร์จริงของผู้ใช้ (ตรวจด้วย test ของ SDK) |
| 2026-10-27 | SDK 1.4.0 + service 1.3.0 (ชื่อบังคับ, เพิ่ม-ลบรูป, Save to Public) | Claude (ตรวจบางข้อ) | ข้อ My Photos | ผ่านบน production build พอร์ต 3100: Save โดยไม่ใส่ชื่อขึ้น "กรุณาระบุชื่อเหตุการณ์", Save ชุดแล้วเพิ่มรูปเป็น 2 รูป marker ขึ้นครบ, ไม่มีปุ่มซ่อน, Save to Public ได้ลิงก์ (/share ตอบ 200) และ service เก็บ appName "ThaiWater GIS", username "anonymous" แล้วลบรายการทดสอบ ยังไม่ได้ตรวจ: โหมดเปิดระบบบัญชี (ชื่อผู้ใช้จริง) |
| 2026-10-27 | SDK 1.4.0 + service 1.3.0 (ข้อความประกอบรูป) | Claude (ตรวจบางข้อ) | ข้อ My Photos | ผ่านบน production build พอร์ต 3100: ใส่ข้อความตอน Add to My Photos, popup บนแผนที่แสดงข้อความ, Save to Public แล้วหน้า /share และ GET /api/public/photos มีข้อความ แล้วลบรายการทดสอบ ยังไม่ได้ตรวจ: แก้ข้อความในตัวแก้ชุดผ่านเบราว์เซอร์จริง (ตรวจด้วย test ของ SDK) |
| 2026-10-27 | SDK 1.5.0 (layer แยกต่อชุดเหตุการณ์) | Claude (ตรวจบางข้อ) | ข้อ My Photos | ผ่านบน production build พอร์ต 3100: ไม่มี layer My Photos รวม, ชุดเดิมขึ้นเป็น "My Photos/<ชื่อชุด>", สร้าง 2 ชุดแล้ว Add to map ได้ layer ใหม่ด้านบนสุด (ไอคอนกล้อง) และ Toolbox แสดง "ชุดบนแผนที่ 3 · รูป 5", ปุ่มตาของชุด A ซ่อนเฉพาะ marker ของชุด A, เฟืองของ layer เปิดจัดการ My Photos, ลบชุดแล้ว layer หาย ลบชุดทดสอบทั้งหมดแล้ว |
| 2026-10-27 | SDK 1.6.0 + service 1.4.0 (ค้นหาชุดรูปภาพ Public) | Claude (ตรวจบางข้อ) | ข้อ Public Photos | ผ่านบน production build พอร์ต 3100 กับ service จริง: Toolbox ไม่มีสวิตช์ Public Photos, เฟืองเปิดค้นหาแล้วแสดงชุดล่าสุด (test01) ก่อนโดยไม่มีอะไรขึ้นแผนที่, Add to map ได้ layer "Public Photos/test01" ในกลุ่มภาพถ่ายสาธารณะ (หลัง Data Files ก่อน Draw) พร้อม marker 2 จุดและซูมไปที่ชุด, รีเฟรชแล้วชุดยังอยู่, ปุ่มตาซ่อน marker, เอาออกแล้ว layer หายและ localStorage ว่าง ยังไม่ได้ตรวจ: กรองด้วยเงื่อนไขในเบราว์เซอร์ (ตรวจด้วย test ของ service) |
| | | | | |
