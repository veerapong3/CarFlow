/**
 * ตรวจสอบว่าโฟลเดอร์ Drive ที่ตั้งค่าไว้เป็น Shared Drive หรือ My Drive
 * รัน: node scripts/check-drive.mjs
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

const env = loadEnv();
const credentials = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
const folderId = env.GOOGLE_DRIVE_FOLDER_ID;

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/drive"],
});
const drive = google.drive({ version: "v3", auth });

console.log(`Service Account: ${credentials.client_email}`);
console.log(`Folder ID: ${folderId}\n`);

try {
  const res = await drive.files.get({
    fileId: folderId,
    fields: "id,name,mimeType,driveId,teamDriveId,owners(emailAddress),capabilities(canAddChildren)",
    supportsAllDrives: true,
  });

  const f = res.data;
  console.log(`ชื่อโฟลเดอร์      : ${f.name}`);
  console.log(`เพิ่มไฟล์ได้ไหม   : ${f.capabilities?.canAddChildren ? "ได้" : "ไม่ได้"}`);
  console.log(`อยู่ใน Shared Drive: ${f.driveId ? `ใช่ (driveId=${f.driveId})` : "ไม่ใช่ (My Drive ธรรมดา)"}`);
  if (f.owners?.length) {
    console.log(`เจ้าของ           : ${f.owners.map((o) => o.emailAddress).join(", ")}`);
  }

  console.log("");
  if (f.driveId) {
    console.log("สรุป: อัปโหลดได้ ต้องส่ง supportsAllDrives: true ใน API");
  } else {
    console.log("สรุป: Service Account ไม่มีพื้นที่เก็บของตัวเอง อัปโหลดเข้า My Drive ไม่ได้");
    console.log("      ต้องใช้ Shared Drive หรือเปลี่ยนวิธีเก็บรูป");
  }
} catch (err) {
  console.error(`เข้าถึงโฟลเดอร์ไม่ได้: ${err.message}`);
  process.exit(1);
}

try {
  const drives = await drive.drives.list({ pageSize: 20 });
  const list = drives.data.drives || [];
  console.log(`\nShared Drive ที่ Service Account เข้าถึงได้: ${list.length} รายการ`);
  for (const d of list) {
    console.log(`  - ${d.name} (id=${d.id})`);
  }
} catch (err) {
  console.log(`\nไม่สามารถอ่านรายการ Shared Drive: ${err.message}`);
}
