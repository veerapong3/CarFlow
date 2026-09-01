"use client";

import type { Booking } from "@/types";
import StatusBadge from "./StatusBadge";
import { CalendarCheck } from "lucide-react";
import { formatBookingRange } from "@/lib/booking-dates";

interface RecentBookingsProps {
  bookings: Booking[];
}

export default function RecentBookings({ bookings }: RecentBookingsProps) {
  return (
    <div className="card">
      <div className="mb-4 flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <CalendarCheck className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            รายการจองสำเร็จล่าสุด
          </h3>
          <p className="text-sm text-slate-500">
            10 รายการที่อนุมัติแล้วหรือเสร็จสิ้น
          </p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <p className="text-sm text-slate-500">ยังไม่มีรายการจองที่สำเร็จ</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {bookings.map((b) => (
            <li key={b.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">
                    {formatBookingRange(b)}
                  </p>
                  <p className="mt-0.5 truncate font-medium text-slate-900">
                    {b.activity}
                  </p>
                  <p className="truncate text-sm text-slate-600">
                    {b.destination}, {b.province}
                    {b.passengers ? ` · ${b.passengers} คน` : ""}
                  </p>
                  {(b.firstName || b.vehicleName) && (
                    <p className="truncate text-xs text-slate-500">
                      {[
                        [b.firstName, b.lastName].filter(Boolean).join(" "),
                        b.vehicleName,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </div>
                <StatusBadge status={b.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
