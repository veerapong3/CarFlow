/**
 * สคริปต์สร้าง Sheet และ Header ใน Google Spreadsheet
 * รัน: node scripts/init-google-sheet.mjs
 *
 * ต้องตั้งค่า GOOGLE_SHEET_ID และ GOOGLE_SERVICE_ACCOUNT_JSON ใน .env.local ก่อน
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  const envPath = resolve(root, ".env.local");
  if (!existsSync(envPath)) {
    console.error("ไม่พบ .env.local");
    process.exit(1);
  }
  const content = readFileSync(envPath, "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return env;
}

const SHEETS = {
  Vehicles: [
    "id",
    "brand",
    "model",
    "color",
    "licensePlate",
    "driver",
    "seats",
    "imageDriveId",
    "active",
  ],
  Bookings: [
    "id",
    "date",
    "firstName",
    "lastName",
    "phone",
    "activity",
    "destination",
    "province",
    "passengers",
    "vehicleId",
    "vehicleName",
    "status",
    "distance",
    "notes",
    "createdAt",
    "updatedAt",
    "endDate",
  ],
  Settings: ["key", "value"],
};

const DEFAULT_SETTINGS = [
  ["telegramChatId", ""],
  ["telegramBotToken", ""],
  ["adminPassword", "admin123"],
  ["schoolName", "โรงเรียนดอนตาลวิทยา สพม.มุกดาหาร"],
];

async function main() {
  const env = loadEnv();
  const spreadsheetId = env.GOOGLE_SHEET_ID;
  let credentials;

  try {
    credentials = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON || "");
  } catch {
    console.error(
      "กรุณาใส่ GOOGLE_SERVICE_ACCOUNT_JSON ใน .env.local (JSON ทั้งก้อนในบรรทัดเดียว)"
    );
    process.exit(1);
  }

  if (!spreadsheetId) {
    console.error("กรุณาใส่ GOOGLE_SHEET_ID ใน .env.local");
    process.exit(1);
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  console.log(`เชื่อมต่อ Spreadsheet: ${spreadsheetId}`);
  console.log(
    `ลิงก์: https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit\n`
  );

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = new Set(
    meta.data.sheets?.map((s) => s.properties?.title).filter(Boolean) || []
  );

  const requests = [];

  for (const sheetName of Object.keys(SHEETS)) {
    if (!existing.has(sheetName)) {
      requests.push({
        addSheet: { properties: { title: sheetName } },
      });
    }
  }

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    });
    console.log(`สร้าง Sheet: ${requests.map((r) => r.addSheet.properties.title).join(", ")}`);
  } else {
    console.log("Sheet ทั้งหมดมีอยู่แล้ว");
  }

  for (const [sheetName, headers] of Object.entries(SHEETS)) {
    const range = `${sheetName}!A1`;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: { values: [headers] },
    });
    console.log(`✓ ${sheetName} — header พร้อมแล้ว`);
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "Settings!A2:B5",
    valueInputOption: "RAW",
    requestBody: { values: DEFAULT_SETTINGS },
  });
  console.log("✓ Settings — ค่าเริ่มต้นพร้อมแล้ว");

  console.log("\nเสร็จสิ้น! เปิด Google Sheet เพื่อตรวจสอบได้");
}

main().catch((err) => {
  console.error("เกิดข้อผิดพลาด:", err.message);
  process.exit(1);
});
