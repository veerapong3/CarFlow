import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/settings";
import { verifyAdminPassword } from "@/lib/settings";

export async function GET() {
  try {
    const settings = await getSettings();
    const token = settings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || "";
    return NextResponse.json({
      telegramChatId: settings.telegramChatId,
      schoolName: settings.schoolName,
      hasTelegram: !!token,
      hasTelegramBotToken: !!token,
      telegramBotTokenHint: token ? `••••${token.slice(-4)}` : "",
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
    const { password, ...data } = body as {
      password?: string;
      telegramChatId?: string;
      telegramBotToken?: string;
      schoolName?: string;
    };

    const settings = await getSettings();
    if (!verifyAdminPassword(password || "", settings)) {
      return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    const patch: {
      telegramChatId?: string;
      telegramBotToken?: string;
      schoolName?: string;
    } = {};
    if (typeof data.telegramChatId === "string") {
      patch.telegramChatId = data.telegramChatId.trim();
    }
    if (typeof data.schoolName === "string") {
      patch.schoolName = data.schoolName.trim();
    }
    if (typeof data.telegramBotToken === "string") {
      const token = data.telegramBotToken.trim();
      if (token) {
        if (!/^\d{6,}:[A-Za-z0-9_-]{20,}$/.test(token)) {
          return NextResponse.json(
            { error: "รูปแบบ Bot Token ไม่ถูกต้อง" },
            { status: 400 }
          );
        }
        patch.telegramBotToken = token;
      }
    }

    const updated = await updateSettings(patch);
    const token = updated.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || "";
    return NextResponse.json({
      telegramChatId: updated.telegramChatId,
      schoolName: updated.schoolName,
      hasTelegramBotToken: !!token,
      telegramBotTokenHint: token ? `••••${token.slice(-4)}` : "",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update settings" },
      { status: 500 }
    );
  }
}
