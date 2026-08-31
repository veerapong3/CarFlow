import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/settings";
import { verifyAdminPassword } from "@/lib/settings";

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({
      telegramChatId: settings.telegramChatId,
      schoolName: settings.schoolName,
      hasTelegram: !!(settings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, ...data } = body;

    const settings = await getSettings();
    if (!verifyAdminPassword(password, settings)) {
      return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    const updated = await updateSettings(data);
    return NextResponse.json({
      telegramChatId: updated.telegramChatId,
      schoolName: updated.schoolName,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update settings" },
      { status: 500 }
    );
  }
}
