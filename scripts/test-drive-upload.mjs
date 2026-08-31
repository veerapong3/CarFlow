/**
 * ทดสอบอัปโหลดรูปไป Google Drive แล้วลบทิ้ง
 * รัน: node scripts/test-drive-upload.mjs
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { Readable } from "stream";
import { google } from "googleapis";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  const envPath = resolve(root, ".env.local");
  if (!existsSync(envPath)) {
    console.error("ไม่พบ .env.local");
    process.exit(1);
  }
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return env;
}

// PNG 1x1 pixel
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8AAAwAB/AEB1kUuAAAAAElFTkSuQmCC",
  "base64"
);

const env = loadEnv();
const credentials = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
const folderId = env.GOOGLE_DRIVE_FOLDER_ID;
const impersonate = env.GOOGLE_IMPERSONATE_USER || undefined;
const refreshToken = env.GOOGLE_OAUTH_REFRESH_TOKEN || undefined;

let auth;
let mode;

if (env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET && refreshToken) {
  mode = "OAuth (ในนามผู้ใช้จริง)";
  auth = new google.auth.OAuth2({
    clientId: env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET,
  });
  auth.setCredentials({ refresh_token: refreshToken });
} else {
  mode = impersonate
    ? `Service Account สวมสิทธิ์เป็น ${impersonate}`
    : "Service Account (ไม่มีโควตา — คาดว่าจะล้มเหลว)";
  auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive"],
    clientOptions: impersonate ? { subject: impersonate } : undefined,
  });
}

console.log(`โหมดยืนยันตัวตน : ${mode}`);
console.log(`Folder ID       : ${folderId}\n`);

const drive = google.drive({ version: "v3", auth });

let fileId;
try {
  const res = await drive.files.create({
    requestBody: {
      name: `test-upload-${Date.now()}.png`,
      parents: [folderId],
      mimeType: "image/png",
    },
    media: { mimeType: "image/png", body: Readable.from(PNG_1PX) },
    fields: "id,name,owners(emailAddress)",
    supportsAllDrives: true,
  });
  fileId = res.data.id;
  console.log(`อัปโหลดสำเร็จ: ${res.data.name}`);
  console.log(`  fileId  : ${fileId}`);
  if (res.data.owners?.length) {
    console.log(`  เจ้าของ : ${res.data.owners.map((o) => o.emailAddress).join(", ")}`);
  }
} catch (err) {
  console.error(`\nอัปโหลดไม่สำเร็จ: ${err.message}\n`);
  if (err.message.includes("storage quota")) {
    console.error("แปลว่ายังไม่ได้ตั้งค่าอย่างใดอย่างหนึ่งต่อไปนี้:");
    console.error("  1) ขอ OAuth refresh token ด้วย npm run get-token");
    console.error("  2) เปิด domain-wide delegation แล้วใส่ GOOGLE_IMPERSONATE_USER");
    console.error("  3) ย้ายโฟลเดอร์รูปไปไว้ใน Shared Drive");
  }
  if (err.message.includes("invalid_grant")) {
    console.error("refresh token ใช้ไม่ได้แล้ว ให้รัน npm run get-token ใหม่");
    console.error("หมายเหตุ: ถ้า OAuth consent screen อยู่โหมด Testing แบบ External");
    console.error("          token จะหมดอายุใน 7 วัน ให้ตั้งเป็น Internal");
  }
  if (err.message.includes("unauthorized_client")) {
    console.error("domain-wide delegation ยังไม่ได้อนุญาต scope ให้ Client ID นี้:");
    console.error(`  Client ID: ${credentials.client_id}`);
    console.error("  Scope    : https://www.googleapis.com/auth/drive");
  }
  process.exit(1);
}

try {
  await drive.permissions.create({
    fileId,
    requestBody: { role: "reader", type: "anyone" },
    supportsAllDrives: true,
  });
  console.log("  แชร์สาธารณะ: สำเร็จ (รูปจะแสดงผ่าน lh3 ได้)");
  console.log(`  ทดลองเปิด : https://lh3.googleusercontent.com/d/${fileId}`);
} catch (err) {
  console.log(`  แชร์สาธารณะ: ไม่สำเร็จ (${err.message})`);
  console.log("  รูปอาจไม่แสดงให้ผู้ใช้ทั่วไปเห็น");
}

await drive.files.delete({ fileId, supportsAllDrives: true });
console.log("\nลบไฟล์ทดสอบเรียบร้อย");
