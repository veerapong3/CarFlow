import { NextRequest, NextResponse } from "next/server";
import { updateBookingStatus, getBookingById } from "@/lib/bookings";
import {
  answerCallbackQuery,
  notifyBookingStatusChange,
  sendTelegramMessage,
} from "@/lib/telegram";
import {
  availabilityReply,
  handleTelegramCommand,
} from "@/lib/telegram-commands";

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
      const chatId = update.callback_query.message?.chat.id;
      const sep = data.indexOf(":");
      const action = sep === -1 ? data : data.slice(0, sep);
      const payload = sep === -1 ? "" : data.slice(sep + 1);

      if (action === "avail") {
        const reply = await availabilityReply(payload || "range");
        await answerCallbackQuery(queryId);
        if (chatId) {
          await sendTelegramMessage(reply.text, {
            chatId: String(chatId),
            replyMarkup: reply.replyMarkup,
          });
        }
        return NextResponse.json({ ok: true });
      }

      if (!payload || !["approve", "cancel"].includes(action)) {
        await answerCallbackQuery(queryId, "คำสั่งไม่ถูกต้อง");
        return NextResponse.json({ ok: true });
      }

      const booking = await getBookingById(payload);
      if (!booking) {
        await answerCallbackQuery(queryId, "ไม่พบการจอง");
        return NextResponse.json({ ok: true });
      }

      const status = action === "approve" ? "approved" : "cancelled";
      const updated = await updateBookingStatus(payload, status);

      if (updated) {
        await answerCallbackQuery(
          queryId,
          status === "approved" ? "อนุมัติการจองแล้ว ✅" : "ยกเลิกการจองแล้ว ❌"
        );
        await notifyBookingStatusChange(updated, status);
      }

      return NextResponse.json({ ok: true });
    }

    if (update.message?.text) {
      const reply = await handleTelegramCommand(update.message.text);
      if (reply) {
        await sendTelegramMessage(reply.text, {
          chatId: String(update.message.chat.id),
          replyMarkup: reply.replyMarkup,
        });
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
