"use client";

import { useEffect, useState } from "react";
import AdminLogin, { useAdminAuth } from "@/components/AdminLogin";
import { LogOut, Send } from "lucide-react";

export default function AdminSettingsPage() {
  const { password, ready, login, logout } = useAdminAuth();
  const [telegramChatId, setTelegramChatId] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [saved, setSaved] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setTelegramChatId(data.telegramChatId || "");
        setSchoolName(data.schoolName || "");
      });
  }, []);

  if (!ready) return null;
  if (!password) return <AdminLogin onLogin={login} />;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, telegramChatId, schoolName }),
    });
    setLoading(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  async function setupWebhook() {
    const baseUrl = window.location.origin;
    const webhookUrl = `${baseUrl}/api/telegram/webhook`;
    setWebhookStatus("กำลังตั้งค่า...");

    const res = await fetch("/api/telegram/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, webhookUrl }),
    });
    const data = await res.json();
    setWebhookStatus(
      res.ok ? `✅ ตั้งค่า webhook สำเร็จ: ${webhookUrl}` : `❌ ${data.error}`
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ตั้งค่าระบบ</h1>
          <p className="text-slate-600">Telegram, ชื่อโรงเรียน และ Webhook</p>
        </div>
        <button type="button" className="btn-secondary" onClick={logout}>
          <LogOut className="h-4 w-4" />
          ออกจากระบบ
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSave} className="card space-y-4">
          <h2 className="text-lg font-semibold">การตั้งค่าทั่วไป</h2>

          <div>
            <label className="label">ชื่อโรงเรียน</label>
            <input
              className="input-field"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Telegram Chat ID</label>
            <input
              className="input-field"
              placeholder="เช่น -1001234567890 หรือ 123456789"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">
              ใส่ Chat ID ของกลุ่มหรือบุคคลที่จะรับแจ้งเตือนการจอง
              ใช้ @userinfobot หรือ @getidsbot เพื่อหา Chat ID
            </p>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
          </button>
          {saved && (
            <p className="text-sm text-emerald-600">บันทึกเรียบร้อยแล้ว</p>
          )}
        </form>

        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Telegram Bot</h2>
          <p className="text-sm text-slate-600">
            ตั้งค่า Bot Token ใน Environment Variables ของ Vercel
            (<code className="rounded bg-slate-100 px-1">TELEGRAM_BOT_TOKEN</code>)
          </p>

          <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-medium mb-2">วิธีใช้งาน Telegram:</p>
            <ol className="list-decimal space-y-1 pl-4">
              <li>สร้าง Bot ผ่าน @BotFather แล้วคัดลอก Token</li>
              <li>เพิ่ม Bot เข้ากลุ่ม Admin หรือแชทส่วนตัว</li>
              <li>ใส่ Chat ID ด้านซ้าย</li>
              <li>กดปุ่มตั้งค่า Webhook ด้านล่าง</li>
              <li>เมื่อมีการจองใหม่ Bot จะส่งข้อความพร้อมปุ่ม อนุมัติ/ยกเลิก</li>
            </ol>
          </div>

          <button type="button" className="btn-primary" onClick={setupWebhook}>
            <Send className="h-4 w-4" />
            ตั้งค่า Telegram Webhook
          </button>
          {webhookStatus && (
            <p className="text-sm text-slate-600 break-all">{webhookStatus}</p>
          )}
        </div>
      </div>
    </div>
  );
}
