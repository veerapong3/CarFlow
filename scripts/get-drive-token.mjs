/**
 * ขอ OAuth refresh token สำหรับอัปโหลดรูปไป Google Drive (ทำครั้งเดียว)
 * รัน: npm run get-token
 *
 * ต้องใส่ GOOGLE_OAUTH_CLIENT_ID และ GOOGLE_OAUTH_CLIENT_SECRET ใน .env.local ก่อน
 * สคริปต์จะบันทึก GOOGLE_OAUTH_REFRESH_TOKEN กลับลง .env.local ให้อัตโนมัติ
 */

import http from "http";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { google } from "googleapis";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const ENV_PATH = resolve(root, ".env.local");
const PORT = 53682;
const REDIRECT_URI = `http://localhost:${PORT}`;

function loadEnv() {
  if (!existsSync(ENV_PATH)) {
    console.error("ไม่พบ .env.local");
    process.exit(1);
  }
  const env = {};
  for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return env;
}

function saveRefreshToken(token) {
  const content = readFileSync(ENV_PATH, "utf8");
  const lines = content.split("\n");
  const key = "GOOGLE_OAUTH_REFRESH_TOKEN";
  let found = false;

  const updated = lines.map((line) => {
    if (line.trim().startsWith(`${key}=`)) {
      found = true;
      return `${key}=${token}`;
    }
    return line;
  });

  if (!found) updated.push(`${key}=${token}`);
  writeFileSync(ENV_PATH, updated.join("\n"), "utf8");
}

const env = loadEnv();
const clientId = env.GOOGLE_OAUTH_CLIENT_ID;
const clientSecret = env.GOOGLE_OAUTH_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("ยังไม่ได้ใส่ GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET ใน .env.local");
  console.error("\nวิธีสร้าง:");
  console.error("  1. เข้า https://console.cloud.google.com/apis/credentials");
  console.error("  2. Create Credentials -> OAuth client ID");
  console.error("  3. Application type: Desktop app");
  console.error("  4. คัดลอก Client ID และ Client secret มาใส่ .env.local");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2({
  clientId,
  clientSecret,
  redirectUri: REDIRECT_URI,
});

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/drive"],
});

console.log("เปิดลิงก์นี้ในเบราว์เซอร์เพื่ออนุญาตสิทธิ์:\n");
console.log(authUrl);
console.log("\nรออยู่... (กด Ctrl+C เพื่อยกเลิก)\n");

exec(`start "" "${authUrl}"`, () => {});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<h2>ยกเลิกการอนุญาต: ${error}</h2>`);
    console.error(`\nผู้ใช้ปฏิเสธการอนุญาต: ${error}`);
    server.close();
    process.exit(1);
  }

  if (!code) {
    res.writeHead(404);
    res.end();
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h2>ไม่ได้รับ refresh token กรุณาลองใหม่</h2>");
      console.error("\nไม่ได้รับ refresh token");
      console.error("ลองเพิกถอนสิทธิ์ที่ https://myaccount.google.com/permissions แล้วรันใหม่");
      server.close();
      process.exit(1);
    }

    saveRefreshToken(tokens.refresh_token);
    oauth2Client.setCredentials(tokens);

    // Identity lookup is best-effort: the drive scope alone can read it, but a
    // failure here must not discard the token we just saved.
    let account = "(ไม่ทราบ)";
    try {
      const drive = google.drive({ version: "v3", auth: oauth2Client });
      const about = await drive.about.get({ fields: "user(emailAddress)" });
      account = about.data.user?.emailAddress || account;
    } catch {
      // ignore
    }

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(
      `<div style="font-family:sans-serif;padding:40px;text-align:center">
        <h2 style="color:#059669">เชื่อมต่อสำเร็จ</h2>
        <p>บัญชี: ${account}</p>
        <p>บันทึก refresh token ลง .env.local เรียบร้อยแล้ว</p>
        <p style="color:#64748b">ปิดหน้านี้แล้วกลับไปที่ terminal ได้เลย</p>
      </div>`
    );

    console.log(`อนุญาตสิทธิ์สำเร็จในนามบัญชี: ${account}`);
    console.log("บันทึก GOOGLE_OAUTH_REFRESH_TOKEN ลง .env.local เรียบร้อย\n");
    console.log("ขั้นตอนต่อไป: npm run test-upload");

    server.close();
    process.exit(0);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<h2>เกิดข้อผิดพลาด: ${err.message}</h2>`);
    console.error(`\nแลกเปลี่ยน token ไม่สำเร็จ: ${err.message}`);
    server.close();
    process.exit(1);
  }
});

server.listen(PORT);
