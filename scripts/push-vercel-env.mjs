/**
 * ส่งค่าใน .env.local ขึ้น Vercel
 * รัน: npm run push-env
 *
 * ค่าถูกส่งผ่าน stdin ของ `vercel env add` เพื่อไม่ให้ shell แปลงอักขระพิเศษ
 * ในค่ายาว ๆ เช่น GOOGLE_SERVICE_ACCOUNT_JSON
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TARGETS = ["production", "preview"];

// ค่าที่ Vercel จัดการเอง ไม่ต้องส่งขึ้นไป
const SKIP = new Set(["VERCEL_OIDC_TOKEN"]);

const KEYS = [
  "GOOGLE_SHEET_ID",
  "GOOGLE_SERVICE_ACCOUNT_JSON",
  "GOOGLE_DRIVE_FOLDER_ID",
  "GOOGLE_IMPERSONATE_USER",
  "GOOGLE_OAUTH_CLIENT_ID",
  "GOOGLE_OAUTH_CLIENT_SECRET",
  "GOOGLE_OAUTH_REFRESH_TOKEN",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
  "ADMIN_PASSWORD",
];

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

function runVercel(args, stdinValue = null) {
  return new Promise((done) => {
    const child = spawn("npx", ["vercel", ...args], {
      cwd: root,
      shell: true,
      stdio: [stdinValue === null ? "ignore" : "pipe", "pipe", "pipe"],
    });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    if (stdinValue !== null) {
      child.stdin.write(stdinValue);
      child.stdin.end();
    }
    child.on("close", (code) => done({ code, out }));
  });
}

const env = loadEnv();

console.log(`ส่ง environment variables ขึ้น Vercel (${TARGETS.join(", ")})\n`);

let added = 0;
let skipped = 0;
let failed = 0;

for (const key of KEYS) {
  if (SKIP.has(key)) continue;

  const value = env[key];
  if (!value) {
    console.log(`  ข้าม   ${key} (ยังไม่มีค่าใน .env.local)`);
    skipped++;
    continue;
  }

  for (const target of TARGETS) {
    // ลบค่าเดิมก่อน เพื่อให้รันสคริปต์ซ้ำได้โดยไม่ error
    await runVercel(["env", "rm", key, target, "--yes"]);

    const { code, out } = await runVercel(["env", "add", key, target], value);
    if (code === 0) {
      console.log(`  ตั้งค่า ${key} → ${target}`);
      added++;
    } else {
      const reason = out.split("\n").filter(Boolean).slice(-2).join(" ");
      console.log(`  ล้มเหลว ${key} → ${target}: ${reason}`);
      failed++;
    }
  }
}

console.log(`\nสรุป: ตั้งค่า ${added} รายการ / ข้าม ${skipped} คีย์ / ล้มเหลว ${failed}`);
process.exit(failed > 0 ? 1 : 0);
