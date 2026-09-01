import { format } from "date-fns";
import { th } from "date-fns/locale";

export const MAX_BOOKING_DAYS = 14;

export interface DateRange {
  date: string;
  endDate?: string;
}

export function parseYmd(value: string): Date {
  const [y, m, d] = (value || "").split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return new Date(NaN);
  return new Date(y, m - 1, d);
}

export function formatYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function bookingEndDate(b: DateRange): string {
  if (b.endDate && b.endDate >= b.date) return b.endDate;
  return b.date;
}

export function eachDateInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const last = parseYmd(end);
  const cur = parseYmd(start);
  if (Number.isNaN(cur.getTime()) || Number.isNaN(last.getTime())) return [];
  if (last < cur) return [start];

  while (cur <= last) {
    dates.push(formatYmd(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export function bookingDayCount(b: DateRange): number {
  return eachDateInRange(b.date, bookingEndDate(b)).length;
}

export function bookingCoversDate(b: DateRange, date: string): boolean {
  return date >= b.date && date <= bookingEndDate(b);
}

export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

export function normalizeBookingRange(
  start: string,
  end?: string
): { date: string; endDate: string; days: number } {
  const date = start;
  const endDate = end && end >= start ? end : start;
  const days = eachDateInRange(date, endDate).length;
  return { date, endDate, days };
}

export function formatBookingRange(b: DateRange): string {
  const start = parseYmd(b.date);
  const endStr = bookingEndDate(b);
  const end = parseYmd(endStr);
  const days = eachDateInRange(b.date, endStr).length;
  if (Number.isNaN(start.getTime())) return b.date || "";

  if (days <= 1) {
    return format(start, "d MMMM yyyy", { locale: th });
  }

  const sameMonth =
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();
  const rangeLabel = sameMonth
    ? `${format(start, "d", { locale: th })}–${format(end, "d MMMM yyyy", { locale: th })}`
    : `${format(start, "d MMM yyyy", { locale: th })} – ${format(end, "d MMM yyyy", { locale: th })}`;

  return `${rangeLabel} (${days} วัน)`;
}
