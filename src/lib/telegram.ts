import type { Booking } from "@/types";
import { getSettings } from "./settings";
import { formatBookingRange } from "./booking-dates";

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
        reply_markup: options?.replyMarkup,
      }),
    });
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
    `📅 วันที่: ${formatBookingRange(booking)}`,
    `👤 ผู้จอง: ${booking.firstName} ${booking.lastName}`,
    `📞 โทร: ${booking.phone}`,
    `🎯 กิจกรรม: ${booking.activity}`,
    `📍 ปลายทาง: ${booking.destination}, ${booking.province}`,
    `👥 ผู้โดยสาร: ${booking.passengers} คน`,
    `🚌 รถ: ${booking.vehicleName}`,
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
    `📅 ${formatBookingRange(booking)}`,
    `👤 ${booking.firstName} ${booking.lastName}`,
    `🎯 ${booking.activity}`,
    `🚌 ${booking.vehicleName}`,
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
    body: JSON.stringify({ url: webhookUrl }),
  });
  return res.ok;
}
