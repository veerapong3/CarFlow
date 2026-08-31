/**
 * ทดสอบระบบจองรถแบบครบวงจรผ่าน API ของแอปที่รันอยู่
 * รัน: npm run e2e   (ต้องเปิด npm run dev ไว้ก่อน)
 *
 * สคริปต์จะสร้างข้อมูลทดสอบ ตรวจสอบพฤติกรรม แล้วลบข้อมูลทดสอบทิ้งทั้งหมด
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";

function loadEnv() {
  const envPath = resolve(root, ".env.local");
  if (!existsSync(envPath)) {
    console.error("ไม่พบ .env.local");
    process.exit(1);
  }
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    env[t.slice(0, eq)] = t.slice(eq + 1);
  }
  return env;
}

const env = loadEnv();
const password = env.ADMIN_PASSWORD || "admin123";

const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8AAAwAB/AEB1kUuAAAAAElFTkSuQmCC",
  "base64"
);

let passed = 0;
let failed = 0;
const cleanup = { vehicleId: null, bookingIds: [], driveFileIds: [] };

async function deleteDriveFiles(fileIds) {
  if (fileIds.length === 0) return;
  const auth = new google.auth.OAuth2({
    clientId: env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET,
  });
  auth.setCredentials({ refresh_token: env.GOOGLE_OAUTH_REFRESH_TOKEN });
  const drive = google.drive({ version: "v3", auth });

  for (const fileId of fileIds) {
    try {
      await drive.files.delete({ fileId, supportsAllDrives: true });
      console.log(`  รูปใน Drive ${fileId}: ลบแล้ว`);
    } catch (err) {
      console.log(`  รูปใน Drive ${fileId}: ลบไม่ได้ (${err.message})`);
    }
  }
}

function check(label, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(`  ok   ${label}`);
  } else {
    failed++;
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

async function json(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text };
  }
}

// วันที่ทดสอบ: 300 วันข้างหน้า เพื่อไม่ชนกับการจองจริง
const testDate = new Date();
testDate.setDate(testDate.getDate() + 300);
const dateStr = testDate.toISOString().slice(0, 10);

console.log(`ทดสอบที่ ${BASE}`);
console.log(`วันที่ทดสอบ: ${dateStr}\n`);

try {
  // ---- 1. อัปโหลดรูปไป Google Drive ----
  console.log("1) อัปโหลดรูปรถไป Google Drive");
  const form = new FormData();
  form.append("password", password);
  form.append("file", new Blob([PNG_1PX], { type: "image/png" }), "test.png");
  const uploadRes = await fetch(`${BASE}/api/upload`, { method: "POST", body: form });
  const upload = await json(uploadRes);
  check("อัปโหลดสำเร็จ", uploadRes.ok && !!upload.fileId, upload.error);
  check("แชร์สาธารณะได้ (แสดงผ่าน lh3)", upload.publicAccess === true);
  if (upload.fileId) cleanup.driveFileIds.push(upload.fileId);

  // ---- 2. ปฏิเสธรหัสผ่านผิด ----
  console.log("\n2) ตรวจสอบสิทธิ์ admin");
  const badAuth = await fetch(`${BASE}/api/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "wrong-password-xyz" }),
  });
  check("รหัสผ่านผิดถูกปฏิเสธ", badAuth.status === 401);

  const goodAuth = await fetch(`${BASE}/api/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  check("รหัสผ่านถูกผ่านได้", goodAuth.ok);

  // ---- 3. เพิ่มรถ ----
  console.log("\n3) เพิ่มข้อมูลรถ");
  const vehicleRes = await fetch(`${BASE}/api/vehicles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      password,
      brand: "E2E-TEST-Toyota",
      model: "Commuter",
      color: "ขาว",
      licensePlate: "ทส 9999 มก",
      driver: "นายทดสอบ ระบบ",
      seats: 12,
      imageDriveId: upload.fileId,
      active: true,
    }),
  });
  const vehicle = await json(vehicleRes);
  check("สร้างรถสำเร็จ", vehicleRes.ok && !!vehicle.id, vehicle.error);
  if (vehicle.id) cleanup.vehicleId = vehicle.id;
  check("URL รูปเป็น lh3", (vehicle.imageUrl || "").includes("lh3.googleusercontent.com"));

  const listRes = await fetch(`${BASE}/api/vehicles`);
  const list = await json(listRes);
  check(
    "รถปรากฏในรายการ",
    Array.isArray(list) && list.some((v) => v.id === vehicle.id)
  );

  // ---- 4. รถว่างในวันที่ทดสอบ ----
  console.log("\n4) ตรวจสอบรถว่าง");
  const availRes = await fetch(`${BASE}/api/bookings?date=${dateStr}&available=true`);
  const avail = await json(availRes);
  check("รถว่างก่อนจอง", Array.isArray(avail) && avail.includes(vehicle.id));

  // ---- 5. จองรถ ----
  console.log("\n5) จองรถ");
  const bookingRes = await fetch(`${BASE}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: dateStr,
      firstName: "ทดสอบ",
      lastName: "ระบบ",
      phone: "0812345678",
      activity: "E2E-TEST กิจกรรมทดสอบ",
      destination: "ศาลากลางจังหวัด",
      province: "มุกดาหาร",
      passengers: 10,
      vehicleId: vehicle.id,
    }),
  });
  const booking = await json(bookingRes);
  check("จองสำเร็จ", bookingRes.ok && !!booking.id, booking.error);
  if (booking.id) cleanup.bookingIds.push(booking.id);
  check("สถานะเริ่มต้นเป็น รออนุมัติ", booking.status === "pending");

  // ---- 6. กันจองซ้ำ ----
  console.log("\n6) กันจองซ้ำวันเดียวกัน");
  const dupRes = await fetch(`${BASE}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: dateStr,
      firstName: "ซ้ำ",
      lastName: "ทดสอบ",
      phone: "0899999999",
      activity: "E2E-TEST จองซ้ำ",
      destination: "ที่เดิม",
      province: "มุกดาหาร",
      passengers: 5,
      vehicleId: vehicle.id,
    }),
  });
  const dup = await json(dupRes);
  if (dup.id) cleanup.bookingIds.push(dup.id);
  check("จองซ้ำถูกปฏิเสธ", dupRes.status === 400, `ได้ status ${dupRes.status}`);

  const availAfter = await json(
    await fetch(`${BASE}/api/bookings?date=${dateStr}&available=true`)
  );
  check(
    "รถหายจากรายการว่างแล้ว",
    Array.isArray(availAfter) && !availAfter.includes(vehicle.id)
  );

  // ---- 7. เกินจำนวนที่นั่ง ----
  console.log("\n7) ตรวจสอบจำนวนที่นั่ง");
  const overRes = await fetch(`${BASE}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: "2099-12-31",
      firstName: "เกิน",
      lastName: "ที่นั่ง",
      phone: "0800000000",
      activity: "E2E-TEST เกินที่นั่ง",
      destination: "ที่ไหนก็ได้",
      province: "มุกดาหาร",
      passengers: 99,
      vehicleId: vehicle.id,
    }),
  });
  const over = await json(overRes);
  if (over.id) cleanup.bookingIds.push(over.id);
  check("ผู้โดยสารเกินที่นั่งถูกปฏิเสธ", overRes.status === 400);

  // ---- 8. อนุมัติการจอง ----
  console.log("\n8) อนุมัติการจอง (ฝั่ง admin)");
  const approveRes = await fetch(`${BASE}/api/bookings/${booking.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password, status: "approved" }),
  });
  const approved = await json(approveRes);
  check("อนุมัติสำเร็จ", approveRes.ok && approved.status === "approved", approved.error);

  // ---- 9. บันทึกระยะทาง ----
  console.log("\n9) บันทึกระยะทางสำหรับ Dashboard");
  const distRes = await fetch(`${BASE}/api/bookings/${booking.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password, distance: 123 }),
  });
  const withDist = await json(distRes);
  check("บันทึกระยะทางสำเร็จ", distRes.ok && Number(withDist.distance) === 123, withDist.error);

  // ---- 10. Dashboard ----
  console.log("\n10) ตรวจสอบ Dashboard");
  const dash = await json(await fetch(`${BASE}/api/dashboard`));
  check("Dashboard ตอบข้อมูลได้", typeof dash.totalVehicles === "number");
  check("นับรถที่ใช้งานได้", dash.totalVehicles >= 1);
} catch (err) {
  failed++;
  console.log(`\nเกิดข้อผิดพลาดระหว่างทดสอบ: ${err.message}`);
} finally {
  // ---- ลบข้อมูลทดสอบ ----
  console.log("\nลบข้อมูลทดสอบ");
  for (const id of cleanup.bookingIds) {
    const res = await fetch(`${BASE}/api/bookings/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    console.log(`  การจอง ${id}: ${res.ok ? "ลบแล้ว" : "ลบไม่ได้"}`);
  }
  if (cleanup.vehicleId) {
    const res = await fetch(`${BASE}/api/vehicles/${cleanup.vehicleId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    console.log(`  รถ ${cleanup.vehicleId}: ${res.ok ? "ลบแล้ว" : "ลบไม่ได้"}`);
  }
  await deleteDriveFiles(cleanup.driveFileIds);

  console.log(`\nสรุป: ผ่าน ${passed} ข้อ / ไม่ผ่าน ${failed} ข้อ`);
  process.exit(failed > 0 ? 1 : 0);
}
