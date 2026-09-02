import type { Booking } from "@/types";
import { getSettings } from "./settings";
import { formatBookingRange } from "./booking-dates";
import { formatBookerName } from "./person-name";
import { destinationLine, escapeHtml, chatMenuKeyboard, BOOKING_SITE_URL } from "./telegram-format";

const TELEGRAM_API = "https://api.telegram.org/bot";

export async function sendTelegramMessage(
  text: string,
  options?: {
    chatId?: string;
    replyMarkup?: object;
  }
): Promise<boolean> {
  const settings = await getSettings();
  const token = settings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
  const chatId =
    options?.chatId ||
    settings.telegramChatId ||
    process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("Telegram not configured");
    return false;
  }

  try {
    const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        reply_markup: options?.replyMarkup ?? chatMenuKeyboard(),
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error("Telegram send failed:", res.status, detail);
    }
    return res.ok;
  } catch (err) {
    console.error("Telegram send error:", err);
    return false;
  }
}

export async function notifyNewBooking(booking: Booking): Promise<void> {
  const text = [
    "🚗 <b>คำขอจองรถใหม่</b>",
    "",
    `📅 วันที่: ${escapeHtml(formatBookingRange(booking))}`,
    `👤 ผู้จอง: ${escapeHtml(formatBookerName(booking))}`,
    `📞 โทร: ${escapeHtml(booking.phone)}`,
    `🎯 กิจกรรม: ${escapeHtml(booking.activity)}`,
    `📍 ปลายทาง: ${escapeHtml(destinationLine(booking))}`,
    `👥 ผู้โดยสาร: ${booking.passengers} คน`,
    `🚌 รถ: ${escapeHtml(booking.vehicleName || "")}`,
    "",
    `รหัสการจอง: <code>${booking.id}</code>`,
  ].join("\n");

  await sendTelegramMessage(text, {
    replyMarkup: {
      inline_keyboard: [
        [
          {
            text: "✅ อนุมัติ",
            callback_data: `approve:${booking.id}`,
          },
          {
            text: "❌ ยกเลิก",
            callback_data: `cancel:${booking.id}`,
          },
        ],
      ],
    },
  });
}

export async function notifyBookingStatusChange(
  booking: Booking,
  action: "approved" | "cancelled"
): Promise<void> {
  const emoji = action === "approved" ? "✅" : "❌";
  const label = action === "approved" ? "อนุมัติแล้ว" : "ยกเลิกแล้ว";

  const text = [
    `${emoji} <b>การจอง${label}</b>`,
    "",
    `📅 ${escapeHtml(formatBookingRange(booking))}`,
    `👤 ${escapeHtml(formatBookerName(booking))}`,
    `🎯 ${escapeHtml(booking.activity)}`,
    `📍 ปลายทาง: ${escapeHtml(destinationLine(booking))}`,
    `🚌 ${escapeHtml(booking.vehicleName || "")}`,
  ].join("\n");

  await sendTelegramMessage(text);
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string
): Promise<void> {
  const settings = await getSettings();
  const token = settings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  await fetch(`${TELEGRAM_API}${token}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
    }),
  });
}

export async function setTelegramWebhook(webhookUrl: string): Promise<boolean> {
  const settings = await getSettings();
  const token = settings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;

  const res = await fetch(`${TELEGRAM_API}${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ["message", "callback_query"],
    }),
  });
  if (!res.ok) return false;
  await setTelegramCommands();
  await setTelegramMenuButton();
  return true;
}

export async function setTelegramCommands(): Promise<boolean> {
  const settings = await getSettings();
  const token = settings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;

  const res = await fetch(`${TELEGRAM_API}${token}/setMyCommands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      commands: [
        {
          command: "free",
          description: "ดูวันที่รถว่าง 14 วันข้างหน้า",
        },
        {
          command: "month",
          description: "ดูรถว่างทั้งเดือนนี้",
        },
        {
          command: "cancel",
          description: "ยกเลิกการจองที่มีอยู่",
        },
        {
          command: "web",
          description: "เปิดเว็บจองรถ",
        },
        {
          command: "menu",
          description: "แสดงเมนูในแชท",
        },
        {
          command: "help",
          description: "วิธีใช้คำสั่งบอท",
        },
      ],
    }),
  });
  return res.ok;
}

export async function setTelegramMenuButton(): Promise<boolean> {
  const settings = await getSettings();
  const token = settings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;

  const res = await fetch(`${TELEGRAM_API}${token}/setChatMenuButton`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      menu_button: {
        type: "web_app",
        text: "เว็บจองรถ",
        web_app: { url: BOOKING_SITE_URL },
      },
    }),
  });
  return res.ok;
}
