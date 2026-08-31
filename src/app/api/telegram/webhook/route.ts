import { NextRequest, NextResponse } from "next/server";
import { updateBookingStatus, getBookingById } from "@/lib/bookings";
import {
  answerCallbackQuery,
  notifyBookingStatusChange,
} from "@/lib/telegram";

interface TelegramUpdate {
  callback_query?: {
    id: string;
    data?: string;
    message?: { message_id: number; chat: { id: number } };
  };
  message?: {
    text?: string;
    chat: { id: number };
  };
}

export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json();

    if (update.callback_query?.data) {
      const { id: queryId, data } = update.callback_query;
      const [action, bookingId] = data.split(":");

      if (!bookingId || !["approve", "cancel"].includes(action)) {
        await answerCallbackQuery(queryId, "คำสั่งไม่ถูกต้อง");
        return NextResponse.json({ ok: true });
      }

      const booking = await getBookingById(bookingId);
      if (!booking) {
        await answerCallbackQuery(queryId, "ไม่พบการจอง");
        return NextResponse.json({ ok: true });
      }

      const status = action === "approve" ? "approved" : "cancelled";
      const updated = await updateBookingStatus(bookingId, status);

      if (updated) {
        await answerCallbackQuery(
          queryId,
          status === "approved" ? "อนุมัติการจองแล้ว ✅" : "ยกเลิกการจองแล้ว ❌"
        );
        await notifyBookingStatusChange(updated, status);
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Telegram webhook active" });
}
