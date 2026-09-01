"use client";

import { useState, useEffect, useCallback } from "react";
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  format,
  isBefore,
  startOfDay,
} from "date-fns";
import { th } from "date-fns/locale";
import Calendar from "@/components/Calendar";
import BookingForm from "@/components/BookingForm";
import StatusBadge from "@/components/StatusBadge";
import RecentBookings from "@/components/RecentBookings";
import type { Booking } from "@/types";
import { CheckCircle } from "lucide-react";
import {
  MAX_BOOKING_DAYS,
  bookingCoversDate,
  formatBookingRange,
} from "@/lib/booking-dates";

export default function HomePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);

  const loadBookings = useCallback(async () => {
    const next = addMonths(currentDate, 1);
    const queries = [
      { year: currentDate.getFullYear(), month: currentDate.getMonth() + 1 },
      { year: next.getFullYear(), month: next.getMonth() + 1 },
    ];
    const [monthA, monthB, recentRes] = await Promise.all([
      fetch(`/api/bookings?year=${queries[0].year}&month=${queries[0].month}`),
      fetch(`/api/bookings?year=${queries[1].year}&month=${queries[1].month}`),
      fetch("/api/bookings?recent=10"),
    ]);
    const [a, b, recentData] = await Promise.all([
      monthA.json(),
      monthB.json(),
      recentRes.json(),
    ]);
    const merged = [
      ...(Array.isArray(a) ? a : []),
      ...(Array.isArray(b) ? b : []),
    ];
    const unique = [...new Map(merged.map((item: Booking) => [item.id, item])).values()];
    setBookings(unique);
    setRecentBookings(Array.isArray(recentData) ? recentData : []);
  }, [currentDate]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  function handleSelectDate(date: Date) {
    const day = startOfDay(date);
    setSuccess(false);

    if (!startDate || endDate) {
      setStartDate(day);
      setEndDate(null);
      setShowForm(false);
      return;
    }

    if (isBefore(day, startDate)) {
      setStartDate(day);
      return;
    }

    const days = differenceInCalendarDays(day, startDate) + 1;
    setEndDate(
      days > MAX_BOOKING_DAYS
        ? addDays(startDate, MAX_BOOKING_DAYS - 1)
        : day
    );
    setShowForm(true);
  }

  function handleSuccess() {
    setSuccess(true);
    setShowForm(false);
    setStartDate(null);
    setEndDate(null);
    loadBookings();
  }

  const previewDate = startDate;
  const selectedBookings = previewDate
    ? bookings.filter(
        (b) =>
          bookingCoversDate(b, format(previewDate, "yyyy-MM-dd")) &&
          b.status !== "cancelled"
      )
    : [];

  const rangeComplete = Boolean(startDate && endDate);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          ระบบจองรถโรงเรียน
        </h1>
        <p className="mt-1 text-slate-600">
          เลือกวันเริ่มต้นและวันสิ้นสุดจากปฏิทินเหมือนจองโรงแรม
          แล้วกรอกใบจองด้านขวา
        </p>
      </div>

      {success && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">ส่งคำขอจองเรียบร้อยแล้ว</p>
            <p className="text-sm">
              รอ Admin อนุมัติการจอง คุณจะได้รับการยืนยันผ่านระบบ
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Calendar
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            startDate={startDate}
            endDate={endDate}
            onSelectDate={handleSelectDate}
            bookings={bookings}
          />
        </div>

        <div className="flex flex-col gap-6 lg:col-span-2">
          {showForm && startDate && endDate ? (
            <BookingForm
              startDate={startDate}
              endDate={endDate}
              onSuccess={handleSuccess}
              onCancel={() => setShowForm(false)}
            />
          ) : (
            <div className="card">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                {!startDate
                  ? "เลือกวันที่จากปฏิทิน"
                  : !endDate
                    ? "เลือกวันสิ้นสุด"
                    : `การจอง ${formatBookingRange({
                        date: format(startDate, "yyyy-MM-dd"),
                        endDate: format(endDate, "yyyy-MM-dd"),
                      })}`}
              </h3>

              {startDate && selectedBookings.length > 0 ? (
                <ul className="space-y-3">
                  {selectedBookings.map((b) => (
                    <li
                      key={b.id}
                      className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-slate-900">
                            {b.activity}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatBookingRange(b)}
                          </p>
                          <p className="text-sm text-slate-600">
                            {b.firstName} {b.lastName} · {b.passengers} คน
                          </p>
                          <p className="text-xs text-slate-500">
                            {b.destination}, {b.province}
                          </p>
                        </div>
                        <StatusBadge status={b.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">
                  {!startDate
                    ? "คลิกวันเริ่มต้นในปฏิทิน แล้วคลิกวันสิ้นสุด ช่วงวันที่จะไฮไลต์เหมือนจองโรงแรม"
                    : !endDate
                      ? `คลิกวันสิ้นสุด หรือคลิก ${format(startDate, "d MMM", { locale: th })} อีกครั้งถ้าจองวันเดียว`
                      : "คลิกปุ่มด้านล่างเพื่อจองรถในช่วงที่เลือก"}
                </p>
              )}

              {rangeComplete && (
                <button
                  type="button"
                  className="btn-primary mt-4 w-full"
                  onClick={() => setShowForm(true)}
                >
                  จองรถช่วงนี้
                </button>
              )}
            </div>
          )}

          <RecentBookings bookings={recentBookings} />
        </div>
      </div>
    </div>
  );
}
