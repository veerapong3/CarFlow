import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword, getSettings } from "@/lib/settings";
import { setTelegramWebhook } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, webhookUrl } = body;

    const settings = await getSettings();
    if (!verifyAdminPassword(password, settings)) {
      return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    const success = await setTelegramWebhook(webhookUrl);
    if (!success) {
      return NextResponse.json({ error: "ตั้งค่า webhook ไม่สำเร็จ" }, { status: 500 });
    }

    return NextResponse.json({ success: true, webhookUrl });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to set webhook" },
      { status: 500 }
    );
  }
}
