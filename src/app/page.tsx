"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import Calendar from "@/components/Calendar";
import BookingForm from "@/components/BookingForm";
import StatusBadge from "@/components/StatusBadge";
import type { Booking } from "@/types";
import { CheckCircle } from "lucide-react";

export default function HomePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);

  const loadBookings = useCallback(async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const res = await fetch(`/api/bookings?year=${year}&month=${month}`);
    const data = await res.json();
    setBookings(data);
  }, [currentDate]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  function handleSelectDate(date: Date) {
    setSelectedDate(date);
    setShowForm(true);
    setSuccess(false);
  }

  function handleSuccess() {
    setSuccess(true);
    setShowForm(false);
    loadBookings();
  }

  const selectedBookings = selectedDate
    ? bookings.filter(
        (b) =>
          b.date === format(selectedDate, "yyyy-MM-dd") &&
          b.status !== "cancelled"
      )
    : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          ระบบจองรถโรงเรียน
        </h1>
        <p className="mt-1 text-slate-600">
          เลือกวันที่จากปฏิทินเพื่อจองรถ — โรงเรียนดอนตาลวิทยา สพม.มุกดาหาร
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
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            bookings={bookings}
          />
        </div>

        <div className="lg:col-span-2">
          {showForm && selectedDate ? (
            <BookingForm
              selectedDate={selectedDate}
              onSuccess={handleSuccess}
              onCancel={() => setShowForm(false)}
            />
          ) : (
            <div className="card">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                {selectedDate
                  ? `การจองวันที่ ${format(selectedDate, "d MMMM yyyy", { locale: th })}`
                  : "เลือกวันที่จากปฏิทิน"}
              </h3>

              {selectedDate && selectedBookings.length > 0 ? (
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
              ) : selectedDate ? (
                <p className="text-sm text-slate-500">
                  คลิกปุ่มด้านล่างเพื่อจองรถในวันนี้
                </p>
              ) : (
                <p className="text-sm text-slate-500">
                  คลิกวันที่ในปฏิทินทางซ้ายเพื่อดูรายการจองหรือสร้างการจองใหม่
                </p>
              )}

              {selectedDate &&
                selectedDate >= new Date(new Date().setHours(0, 0, 0, 0)) && (
                  <button
                    type="button"
                    className="btn-primary mt-4 w-full"
                    onClick={() => setShowForm(true)}
                  >
                    จองรถในวันนี้
                  </button>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
