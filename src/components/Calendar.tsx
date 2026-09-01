"use client";

import { useState } from "react";
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import { th } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Booking } from "@/types";
import clsx from "clsx";
import {
  MAX_BOOKING_DAYS,
  bookingEndDate,
  eachDateInRange,
} from "@/lib/booking-dates";

interface CalendarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  startDate: Date | null;
  endDate: Date | null;
  onSelectDate: (date: Date) => void;
  bookings: Booking[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500",
  approved: "bg-emerald-600",
  cancelled: "bg-slate-300",
  completed: "bg-sky-500",
};

const STATUS_DAY: Record<
  string,
  { wash: string; circle: string; pastWash: string; past: string }
> = {
  pending: {
    wash: "bg-amber-100",
    circle:
      "bg-amber-200 font-bold text-amber-950 ring-2 ring-amber-500",
    pastWash: "bg-amber-50",
    past: "bg-amber-50 font-semibold text-amber-800 ring-1 ring-amber-300",
  },
  approved: {
    wash: "bg-emerald-100",
    circle:
      "bg-emerald-200 font-bold text-emerald-950 ring-2 ring-emerald-600",
    pastWash: "bg-emerald-50",
    past: "bg-emerald-50 font-semibold text-emerald-800 ring-1 ring-emerald-300",
  },
  completed: {
    wash: "bg-sky-100",
    circle: "bg-sky-200 font-bold text-sky-950 ring-2 ring-sky-500",
    pastWash: "bg-sky-50",
    past: "bg-sky-50 font-semibold text-sky-800 ring-1 ring-sky-300",
  },
};

function dominantBookingStatus(bookings: Booking[]): string | null {
  if (bookings.some((b) => b.status === "pending")) return "pending";
  if (bookings.some((b) => b.status === "approved")) return "approved";
  if (bookings.some((b) => b.status === "completed")) return "completed";
  return bookings[0]?.status || null;
}

export default function Calendar({
  currentDate,
  onDateChange,
  startDate,
  endDate,
  onSelectDate,
  bookings,
}: CalendarProps) {
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const today = startOfDay(new Date());
  const selectingEnd = Boolean(startDate && !endDate);
  const previewEnd =
    selectingEnd && hoverDate && !isBefore(hoverDate, startDate!)
      ? hoverDate
      : endDate;

  const previewDays =
    startDate && previewEnd
      ? differenceInCalendarDays(previewEnd, startDate) + 1
      : 0;

  const bookingsByDate = bookings.reduce<Record<string, Booking[]>>(
    (acc, b) => {
      if (b.status === "cancelled") return acc;
      for (const day of eachDateInRange(b.date, bookingEndDate(b))) {
        if (!acc[day]) acc[day] = [];
        acc[day].push(b);
      }
      return acc;
    },
    {}
  );

  const months = [currentDate, addMonths(currentDate, 1)];

  return (
    <div className="card">
      <div className="mb-5 grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200">
        <DateChip
          label="วันเริ่มต้น"
          placeholder="เลือกวัน"
          date={startDate}
          active={!startDate}
        />
        <DateChip
          label="วันสิ้นสุด"
          placeholder="เลือกวัน"
          date={endDate}
          active={selectingEnd}
        />
      </div>

      <p className="mb-4 text-sm text-slate-500">
        {!startDate
          ? "คลิกวันเริ่มต้น แล้วคลิกวันสิ้นสุดบนปฏิทิน — คลิกวันเดิมอีกครั้งถ้าจองวันเดียว"
          : selectingEnd
            ? `เลือกวันสิ้นสุด (สูงสุด ${MAX_BOOKING_DAYS} วัน) หรือคลิกวันเริ่มต้นอีกครั้งถ้าจองวันเดียว`
            : previewDays > 1
              ? `เลือกแล้ว ${previewDays} วัน — คลิกวันใหม่ถ้าต้องการเลือกช่วงอื่น`
              : "จอง 1 วัน — คลิกวันใหม่ถ้าต้องการเลือกช่วงอื่น"}
      </p>

      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onDateChange(subMonths(currentDate, 1))}
          className="rounded-lg p-2 hover:bg-slate-100"
          aria-label="เดือนก่อนหน้า"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="hidden text-sm font-semibold text-slate-900 lg:block">
          {format(currentDate, "MMMM yyyy", { locale: th })}
          <span className="mx-2 font-normal text-slate-300">|</span>
          {format(addMonths(currentDate, 1), "MMMM yyyy", { locale: th })}
        </div>
        <div className="text-sm font-semibold capitalize text-slate-900 lg:hidden">
          {format(currentDate, "MMMM yyyy", { locale: th })}
        </div>
        <button
          type="button"
          onClick={() => onDateChange(addMonths(currentDate, 1))}
          className="rounded-lg p-2 hover:bg-slate-100"
          aria-label="เดือนถัดไป"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div
        className="grid gap-8 lg:grid-cols-2"
        onMouseLeave={() => setHoverDate(null)}
      >
        {months.map((month, index) => (
          <div
            key={format(month, "yyyy-MM")}
            className={index === 1 ? "hidden lg:block" : undefined}
          >
            <h2 className="mb-3 hidden text-center text-sm font-semibold capitalize text-slate-800 lg:block">
              {format(month, "MMMM yyyy", { locale: th })}
            </h2>
            <MonthGrid
              month={month}
              today={today}
              startDate={startDate}
              endDate={endDate}
              rangeStart={startDate}
              rangeEnd={previewEnd}
              selectingEnd={selectingEnd}
              bookingsByDate={bookingsByDate}
              onSelectDate={onSelectDate}
              onHoverDate={setHoverDate}
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-md bg-amber-200 ring-2 ring-amber-500" />{" "}
          มีการจอง · รออนุมัติ
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-md bg-emerald-200 ring-2 ring-emerald-600" />{" "}
          มีการจอง · อนุมัติแล้ว
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-md bg-sky-200 ring-2 ring-sky-500" />{" "}
          มีการจอง · เสร็จสิ้น
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-full bg-primary-600" /> ช่วงที่เลือก
        </span>
      </div>
    </div>
  );
}

function DateChip({
  label,
  placeholder,
  date,
  active,
}: {
  label: string;
  placeholder: string;
  date: Date | null;
  active: boolean;
}) {
  return (
    <div
      className={clsx(
        "px-4 py-3",
        active ? "bg-primary-50" : "bg-white",
        label === "วันสิ้นสุด" && "border-l border-slate-200"
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={clsx(
          "mt-0.5 text-sm font-semibold",
          date ? "text-slate-900" : "text-slate-400"
        )}
      >
        {date ? format(date, "d MMM yyyy", { locale: th }) : placeholder}
      </p>
    </div>
  );
}

function MonthGrid({
  month,
  today,
  startDate,
  endDate,
  rangeStart,
  rangeEnd,
  selectingEnd,
  bookingsByDate,
  onSelectDate,
  onHoverDate,
}: {
  month: Date;
  today: Date;
  startDate: Date | null;
  endDate: Date | null;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  selectingEnd: boolean;
  bookingsByDate: Record<string, Booking[]>;
  onSelectDate: (date: Date) => void;
  onHoverDate: (date: Date | null) => void;
}) {
  const monthStart = startOfMonth(month);
  const days = eachDayOfInterval({
    start: monthStart,
    end: endOfMonth(month),
  });
  const startPadding = getDay(monthStart);
  const maxEnd = startDate ? addDays(startDate, MAX_BOOKING_DAYS - 1) : null;

  return (
    <div>
      <div className="mb-1 grid grid-cols-7 text-center text-xs font-medium text-slate-500">
        {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {Array.from({ length: startPadding }).map((_, i) => (
          <div key={`pad-${i}`} className="aspect-square" />
        ))}

        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const activeBookings = bookingsByDate[dateStr] || [];
          const isStart = Boolean(startDate && isSameDay(day, startDate));
          const isConfirmedEnd = Boolean(endDate && isSameDay(day, endDate));
          const isHoverEnd = Boolean(
            selectingEnd && rangeEnd && isSameDay(day, rangeEnd) && !isStart
          );
          const isEnd = isConfirmedEnd || isHoverEnd;
          const sameDayRange = Boolean(
            startDate &&
              rangeEnd &&
              isSameDay(startDate, rangeEnd) &&
              isStart
          );
          const inRange = Boolean(
            rangeStart &&
              rangeEnd &&
              !isBefore(day, rangeStart) &&
              !isBefore(rangeEnd, day)
          );
          const isPast = isBefore(day, today);
          const beyondMax = Boolean(
            selectingEnd && maxEnd && isBefore(maxEnd, day)
          );
          const disabled = isPast || beyondMax;
          const isEndpoint = isStart || isEnd;
          const tone = dominantBookingStatus(activeBookings);
          const dayStyle = tone ? STATUS_DAY[tone] : null;
          const booked = Boolean(dayStyle);

          return (
            <button
              key={dateStr}
              type="button"
              disabled={disabled}
              onClick={() => onSelectDate(day)}
              onMouseEnter={() => {
                if (!disabled) onHoverDate(day);
              }}
              aria-label={
                booked
                  ? `${format(day, "d MMMM yyyy", { locale: th })} มีการจองแล้ว`
                  : format(day, "d MMMM yyyy", { locale: th })
              }
              className={clsx(
                "relative aspect-square text-sm",
                disabled && !booked
                  ? "cursor-not-allowed text-slate-300"
                  : disabled
                    ? "cursor-not-allowed"
                    : "cursor-pointer text-slate-700",
                !isSameMonth(day, month) && "text-slate-300"
              )}
            >
              {inRange && !sameDayRange && (
                <span
                  className={clsx(
                    "absolute inset-y-1 bg-primary-100",
                    isStart && "left-1/2 right-0",
                    isEnd && !isStart && "left-0 right-1/2",
                    !isStart && !isEnd && "inset-x-0"
                  )}
                />
              )}
              {!isEndpoint && dayStyle && (
                <span
                  className={clsx(
                    "absolute inset-1 rounded-xl",
                    isPast ? dayStyle.pastWash : dayStyle.wash
                  )}
                />
              )}
              <span
                className={clsx(
                  "relative z-[1] mx-auto flex h-[82%] w-[82%] flex-col items-center justify-center rounded-full",
                  isToday(day) &&
                    !isEndpoint &&
                    !booked &&
                    "font-bold ring-1 ring-school-green/40",
                  isStart || isConfirmedEnd
                    ? "bg-primary-600 font-semibold text-white"
                    : isHoverEnd
                      ? "bg-primary-500 font-semibold text-white"
                      : dayStyle && !isEndpoint
                        ? isPast
                          ? dayStyle.past
                          : dayStyle.circle
                        : !disabled
                          ? "hover:bg-primary-50"
                          : undefined
                )}
              >
                {format(day, "d")}
                {isEndpoint && (
                  <span className="text-[9px] leading-none">
                    {sameDayRange
                      ? "1 วัน"
                      : isStart
                        ? "เริ่ม"
                        : "สิ้นสุด"}
                  </span>
                )}
                {!isEndpoint && activeBookings.length > 0 && (
                  <span className="mt-0.5 flex items-center gap-0.5">
                    {activeBookings.slice(0, 3).map((b) => (
                      <span
                        key={b.id}
                        className={clsx(
                          "h-1.5 w-1.5 rounded-full",
                          STATUS_COLORS[b.status] || "bg-slate-400"
                        )}
                      />
                    ))}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
