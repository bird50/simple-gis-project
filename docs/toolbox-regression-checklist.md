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

- [ ] เปิด `/gis` ครั้งแรก → แผงชั้นข้อมูล, Toolbox, ตารางสถานี และสัญลักษณ์ ถูกซ่อน แผนที่แสดงเต็ม
- [ ] กด "ชั้นข้อมูลแผนที่" และ "Toolbox" → แผงซ้ายและขวาเปิด แผนที่ resize ไม่มีแถบว่าง
- [ ] ลากตัวแบ่งแผง (เมาส์และแป้นลูกศร/Home/End) → ความกว้างเปลี่ยนในช่วงที่จำกัด
- [ ] หน้าจอกว้าง < 768 px เปิด Toolbox → แผงชั้นข้อมูลปิดอัตโนมัติ

## B. Layer Panel ↔ Toolbox sync

- [ ] Layer ของ Toolbox (My Photos, Public Photos, My Drawing, Public Drawing, My Data Files) มีแถบสีส้ม Layer ปกติเป็นสีฟ้า
- [ ] เปิด–ปิด My Photos จาก sidebar → สวิตช์ใน Toolbox เปลี่ยนตาม และกลับกัน (ทำซ้ำกับ Public Photos, My Drawing, Public Drawing, My Data Files)
- [ ] ปรับความทึบใน sidebar → marker/รูปวาด/ข้อมูลไฟล์บนแผนที่จางลงตามค่า
- [ ] ลำดับการวาด GeoJSON (ขอบเขตลุ่มน้ำ, สถานี, My Data Files) เป็นไปตามลำดับใน registry → บันทึกลำดับที่เห็นไว้เป็นค่าอ้างอิง เพราะ SDK 0.1.2 เริ่มใช้ `moveLayer`
- [ ] Layer ระดับ ADMIN (พื้นที่เสี่ยงน้ำท่วม) ไม่ปรากฏในโหมดผู้เยี่ยมชม

## C. Photo

- [ ] Toolbox → Photo → เฟือง My Photos → เพิ่ม JPEG ที่มี GPS 2 รูป → จำนวนเป็น `(2)`, Layer My Photos เปิด, แผนที่บินไปยังรูปแรก
- [ ] เพิ่ม JPEG ที่ไม่มี GPS → แสดงข้อความแจ้งเตือน ไม่ถูกเพิ่ม
- [ ] คลิก marker → popup แสดงชื่อ, รูป และวันหมดอายุบนเครื่อง
- [ ] รีเฟรชหน้า → My Photos ยังอยู่ (IndexedDB `thaiwater-my-photos`)
- [ ] เลือกรูปแล้ว Save & Share Public พร้อมชื่อเหตุการณ์และแท็ก → สำเร็จ; เปิด Layer Public Photos แล้วเห็นรูปที่แชร์ พร้อมลิงก์ "ดูชุดภาพ Public" ที่เปิด `/share/<id>` ได้
- [ ] เฟือง Public Photos → กรองด้วยชื่อผู้ใช้/เหตุการณ์/แท็ก/ช่วงวัน → ข้อความ "ใช้เงื่อนไขค้นหา N รายการ" และผลกรองตรง (เงื่อนไขเป็น OR)
- [ ] เลื่อนหรือซูมแผนที่ → Public Photos โหลดใหม่ตาม viewport แสดง "กำลังโหลด…" แล้วแสดงจำนวน หรือ "ไม่พบภาพ Public ในพื้นที่นี้"
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
| | | | | |
