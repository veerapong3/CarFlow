"use client";

import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
  isToday,
} from "date-fns";
import { th } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Booking } from "@/types";
import clsx from "clsx";
import { bookingEndDate, eachDateInRange } from "@/lib/booking-dates";

interface CalendarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  bookings: Booking[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-400",
  approved: "bg-emerald-500",
  cancelled: "bg-slate-300",
  completed: "bg-blue-500",
};

export default function Calendar({
  currentDate,
  onDateChange,
  selectedDate,
  onSelectDate,
  bookings,
}: CalendarProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  const bookingsByDate = bookings.reduce<Record<string, Booking[]>>((acc, b) => {
    if (b.status === "cancelled") return acc;
    for (const day of eachDateInRange(b.date, bookingEndDate(b))) {
      if (!acc[day]) acc[day] = [];
      acc[day].push(b);
    }
    return acc;
  }, {});

  return (
    <div className="card">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onDateChange(subMonths(currentDate, 1))}
          className="rounded-lg p-2 hover:bg-slate-100"
          aria-label="เดือนก่อนหน้า"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold capitalize text-slate-900">
          {format(currentDate, "MMMM yyyy", { locale: th })}
        </h2>
        <button
          type="button"
          onClick={() => onDateChange(addMonths(currentDate, 1))}
          className="rounded-lg p-2 hover:bg-slate-100"
          aria-label="เดือนถัดไป"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
        {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startPadding }).map((_, i) => (
          <div key={`pad-${i}`} className="aspect-square" />
        ))}

        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayBookings = bookingsByDate[dateStr] || [];
          const activeBookings = dayBookings.filter((b) => b.status !== "cancelled");
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(day)}
              disabled={isPast}
              className={clsx(
                "relative aspect-square rounded-lg p-1 text-sm transition",
                isSelected && "ring-2 ring-primary-500 ring-offset-1",
                isToday(day) && "font-bold",
                isPast
                  ? "cursor-not-allowed text-slate-300"
                  : "hover:bg-primary-50 text-slate-700",
                !isSameMonth(day, currentDate) && "text-slate-300"
              )}
            >
              <span
                className={clsx(
                  "flex h-full w-full flex-col items-center justify-center rounded-md",
                  isSelected && "bg-primary-100",
                  isToday(day) && !isSelected && "bg-school-green/10"
                )}
              >
                {format(day, "d")}
                {activeBookings.length > 0 && (
                  <div className="mt-0.5 flex gap-0.5">
                    {activeBookings.slice(0, 3).map((b) => (
                      <span
                        key={b.id}
                        className={clsx(
                          "h-1.5 w-1.5 rounded-full",
                          STATUS_COLORS[b.status] || "bg-slate-400"
                        )}
                      />
                    ))}
                  </div>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400" /> รออนุมัติ
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> อนุมัติแล้ว
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-500" /> เสร็จสิ้น
        </span>
      </div>
    </div>
  );
}
