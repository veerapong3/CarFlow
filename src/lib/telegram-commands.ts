import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  isBefore,
  isValid,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { th } from "date-fns/locale";
import type { Booking, Vehicle } from "@/types";
import { getAllBookings } from "./bookings";
import {
  bookingCoversDate,
  formatYmd,
  MAX_BOOKING_DAYS,
  parseYmd,
} from "./booking-dates";
import { formatBookerName } from "./person-name";
import { destinationLine, escapeHtml } from "./telegram-format";
import { getAllVehicles } from "./vehicles";

export type TelegramReply = {
  text: string;
  replyMarkup?: object;
};

const THAI_MONTHS: Record<string, number> = {
  มกราคม: 1,
  มค: 1,
  กุมภาพันธ์: 2,
  กพ: 2,
  มีนาคม: 3,
  มีค: 3,
  เมษายน: 4,
  เมย: 4,
  พฤษภาคม: 5,
  พค: 5,
  มิถุนายน: 6,
  มิย: 6,
  กรกฎาคม: 7,
  กค: 7,
  สิงหาคม: 8,
  สค: 8,
  กันยายน: 9,
  กย: 9,
  ตุลาคม: 10,
  ตค: 10,
  พฤศจิกายน: 11,
  พย: 11,
  ธันวาคม: 12,
  ธค: 12,
};

function toGregorianYear(year: number): number {
  if (year >= 2400) return year - 543;
  return year;
}

function makeDate(year: number, month: number, day: number): Date | null {
  const date = new Date(year, month - 1, day);
  if (
    !isValid(date) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return startOfDay(date);
}

type DateQuery =
  | { type: "range" }
  | { type: "month"; year: number; month: number }
  | { type: "day"; date: Date }
  | { type: "error"; hint: string };

export function parseAvailabilityArg(
  arg: string,
  now = new Date()
): DateQuery {
  const raw = arg.trim();
  if (!raw) return { type: "range" };

  if (/^(เดือนนี้|เดือน|month)$/i.test(raw)) {
    return {
      type: "month",
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    };
  }

  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const date = makeDate(
      toGregorianYear(parseInt(iso[1], 10)),
      parseInt(iso[2], 10),
      parseInt(iso[3], 10)
    );
    return date
      ? { type: "day", date }
      : { type: "error", hint: "วันที่ไม่ถูกต้อง" };
  }

  const dmy = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{2,4}))?$/);
  if (dmy) {
    const day = parseInt(dmy[1], 10);
    const month = parseInt(dmy[2], 10);
    let year = now.getFullYear();
    if (dmy[3]) {
      const parsedYear = parseInt(dmy[3], 10);
      year = parsedYear < 100 ? parsedYear + 2000 : toGregorianYear(parsedYear);
    } else {
      const candidate = makeDate(year, month, day);
      if (candidate && isBefore(candidate, startOfDay(now))) {
        year += 1;
      }
    }
    const date = makeDate(year, month, day);
    return date
      ? { type: "day", date }
      : { type: "error", hint: "วันที่ไม่ถูกต้อง ลองแบบ 15/9 หรือ 2026-09-15" };
  }

  if (/^\d{1,2}$/.test(raw)) {
    const day = parseInt(raw, 10);
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    let date = makeDate(year, month, day);
    if (date && isBefore(date, startOfDay(now))) {
      const next = addMonths(now, 1);
      date = makeDate(next.getFullYear(), next.getMonth() + 1, day);
    }
    return date
      ? { type: "day", date }
      : { type: "error", hint: "วันที่ไม่ถูกต้อง" };
  }

  const monthToken = raw.replace(/[.\s]/g, "");
  const monthNum = THAI_MONTHS[monthToken];
  if (monthNum) {
    let year = now.getFullYear();
    if (monthNum < now.getMonth() + 1) year += 1;
    return { type: "month", year, month: monthNum };
  }

  return {
    type: "error",
    hint: "ไม่เข้าใจวันที่ ลอง <code>/ว่าง 15/9</code> หรือ <code>/ว่าง 2026-09-15</code>",
  };
}

function vehicleLabel(vehicle: Vehicle): string {
  return `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`;
}

function activeBookingsOnDate(bookings: Booking[], dateStr: string): Booking[] {
  return bookings.filter(
    (b) => b.status !== "cancelled" && bookingCoversDate(b, dateStr)
  );
}

function formatDayHeading(date: Date): string {
  return format(date, "EEEE d MMMM yyyy", { locale: th });
}

async function loadFleet() {
  const [vehicles, bookings] = await Promise.all([
    getAllVehicles(true),
    getAllBookings(),
  ]);
  return { vehicles, bookings };
}

function summaryForDates(
  title: string,
  dates: string[],
  vehicles: Vehicle[],
  bookings: Booking[]
): string {
  if (vehicles.length === 0) {
    return "ยังไม่มีรถที่พร้อมให้จอง";
  }

  const free: string[] = [];
  const partial: string[] = [];
  const full: string[] = [];

  for (const dateStr of dates) {
    const taken = new Set(
      activeBookingsOnDate(bookings, dateStr).map((b) => b.vehicleId)
    );
    const remaining = vehicles.filter((v) => !taken.has(v.id)).length;
    const label = format(parseYmd(dateStr), "EEE d MMM", {
      locale: th,
    });
    if (remaining === vehicles.length) {
      free.push(`• ${label}`);
    } else if (remaining === 0) {
      full.push(`• ${label}`);
    } else {
      partial.push(`• ${label} — เหลือ ${remaining}/${vehicles.length} คัน`);
    }
  }

  const lines = [
    `🚗 <b>${escapeHtml(title)}</b>`,
    `รถที่จองได้ ${vehicles.length} คัน`,
    "",
  ];

  if (free.length) {
    lines.push("✅ <b>ว่างทุกคัน</b>", ...free, "");
  }
  if (partial.length) {
    lines.push("⚠️ <b>ว่างบางคัน</b>", ...partial, "");
  }
  if (full.length) {
    lines.push("❌ <b>เต็ม</b>", ...full, "");
  }

  lines.push("ดูรายคันในวันใดวันหนึ่ง: <code>/ว่าง 15/9</code>");
  return lines.join("\n").trim();
}

function dayReport(date: Date, vehicles: Vehicle[], bookings: Booking[]): string {
  const dateStr = formatYmd(date);
  const taken = activeBookingsOnDate(bookings, dateStr);
  const takenIds = new Set(taken.map((b) => b.vehicleId));
  const free = vehicles.filter((v) => !takenIds.has(v.id));

  const lines = [`📅 <b>${escapeHtml(formatDayHeading(date))}</b>`, ""];

  if (vehicles.length === 0) {
    lines.push("ยังไม่มีรถที่พร้อมให้จอง");
    return lines.join("\n");
  }

  if (free.length) {
    lines.push(`✅ <b>ว่าง ${free.length} คัน</b>`);
    for (const v of free) {
      lines.push(
        `• ${escapeHtml(vehicleLabel(v))} — ${v.seats} ที่`
      );
    }
    lines.push("");
  } else {
    lines.push("❌ <b>เต็มทุกคัน</b>", "");
  }

  if (taken.length) {
    lines.push("📌 <b>จองแล้ว</b>");
    for (const b of taken) {
      const status = b.status === "pending" ? "รออนุมัติ" : "อนุมัติแล้ว";
      lines.push(
        `• ${escapeHtml(b.vehicleName || "รถ")} — ${escapeHtml(formatBookerName(b))}`
      );
      lines.push(
        `  📍 ${escapeHtml(destinationLine(b))} (${status})`
      );
    }
  }

  return lines.join("\n").trim();
}

export function helpReply(): TelegramReply {
  return {
    text: [
      "🤖 <b>คำสั่งบอทจองรถ</b>",
      "",
      "<code>/ว่าง</code> — ดูรถว่าง 14 วันข้างหน้า",
      "<code>/ว่าง 15/9</code> — ดูรถว่างวันที่ระบุ",
      "<code>/ว่างเดือน</code> — ดูทั้งเดือนนี้",
      "<code>/ว่าง กันยายน</code> — ดูทั้งเดือนที่ระบุ",
      "",
      "วันที่ใช้ได้เช่น 15/9, 15/9/2569, 2026-09-15",
      "",
      "เมื่อมีคำขอจองใหม่ กดปุ่มอนุมัติหรือยกเลิกในข้อความได้เลย",
    ].join("\n"),
    replyMarkup: {
      inline_keyboard: [
        [
          { text: "14 วันข้างหน้า", callback_data: "avail:range" },
          { text: "เดือนนี้", callback_data: "avail:month" },
        ],
      ],
    },
  };
}

export async function availabilityReply(payload: string): Promise<TelegramReply> {
  const now = startOfDay(new Date());
  const query =
    payload === "range"
      ? ({ type: "range" } as const)
      : payload === "month"
        ? parseAvailabilityArg("เดือนนี้", now)
        : parseAvailabilityArg(payload, now);

  if (query.type === "error") {
    return { text: query.hint };
  }

  const { vehicles, bookings } = await loadFleet();

  if (query.type === "day") {
    return { text: dayReport(query.date, vehicles, bookings) };
  }

  if (query.type === "month") {
    const start = startOfMonth(new Date(query.year, query.month - 1, 1));
    const from = isBefore(start, now) ? now : start;
    const to = endOfMonth(start);
    const dates: string[] = [];
    for (let d = from; !isBefore(to, d); d = addDays(d, 1)) {
      dates.push(formatYmd(d));
    }
    const title = `รถว่าง ${format(start, "MMMM yyyy", { locale: th })}`;
    return { text: summaryForDates(title, dates, vehicles, bookings) };
  }

  const dates: string[] = [];
  for (let i = 0; i < MAX_BOOKING_DAYS; i++) {
    dates.push(formatYmd(addDays(now, i)));
  }
  return {
    text: summaryForDates(
      `รถว่าง ${MAX_BOOKING_DAYS} วันข้างหน้า`,
      dates,
      vehicles,
      bookings
    ),
  };
}

export async function handleTelegramCommand(
  text: string
): Promise<TelegramReply | null> {
  const cleaned = text.trim().replace(/^\/([^\s@]+)@\S+/, "/$1");
  if (!cleaned) return null;

  const isSlash = cleaned.startsWith("/");
  const [rawCmd, ...rest] = cleaned.split(/\s+/);
  const cmd = rawCmd.replace(/^\//, "").toLowerCase();
  const arg = rest.join(" ").trim();

  if (
    cmd === "start" ||
    cmd === "help" ||
    cmd === "ช่วย" ||
    cmd === "คำสั่ง"
  ) {
    return helpReply();
  }

  if (cmd === "month" || cmd === "ว่างเดือน") {
    return availabilityReply("month");
  }

  if (cmd === "free" || cmd === "available" || cmd === "ว่าง") {
    return availabilityReply(arg || "range");
  }

  if (isSlash) {
    return helpReply();
  }

  return null;
}
