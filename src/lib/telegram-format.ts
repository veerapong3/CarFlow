import type { Booking } from "@/types";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function destinationLine(booking: Booking): string {
  return [booking.destination, booking.province].filter(Boolean).join(", ");
}

export const BOOKING_SITE_URL = "https://carflow-dtw.vercel.app";

export const MENU_BUTTON = {
  free: "🚗 วันว่าง",
  month: "📅 เดือนนี้",
  list: "📋 รายการจอง",
  cancel: "❌ ยกเลิกการจอง",
  web: "🌐 เว็บจองรถ",
  help: "❓ วิธีใช้",
} as const;

export function chatMenuKeyboard() {
  return {
    keyboard: [
      [{ text: MENU_BUTTON.free }, { text: MENU_BUTTON.month }],
      [{ text: MENU_BUTTON.list }, { text: MENU_BUTTON.cancel }],
      [{ text: MENU_BUTTON.web }, { text: MENU_BUTTON.help }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
}

export function mainInlineMenu() {
  return {
    inline_keyboard: [
      [
        { text: MENU_BUTTON.free, callback_data: "avail:range" },
        { text: MENU_BUTTON.month, callback_data: "avail:month" },
      ],
      [
        { text: MENU_BUTTON.list, callback_data: "list:manage" },
        { text: MENU_BUTTON.cancel, callback_data: "list:cancel" },
      ],
      [{ text: MENU_BUTTON.web, url: BOOKING_SITE_URL }],
      [{ text: MENU_BUTTON.help, callback_data: "help" }],
    ],
  };
}
