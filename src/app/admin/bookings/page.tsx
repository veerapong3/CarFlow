"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLogin, { useAdminAuth } from "@/components/AdminLogin";
import PageLoading from "@/components/PageLoading";
import BookingTable from "@/components/BookingTable";
import type { Booking } from "@/types";
import { LogOut } from "lucide-react";
import ExportButtons from "@/components/ExportButtons";

export default function AdminBookingsPage() {
  const { password, ready, login, logout } = useAdminAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/bookings");
    setBookings(await res.json());
  }, []);

  useEffect(() => {
    if (password) load();
  }, [password, load]);

  if (!ready) return <PageLoading />;
  if (!password) return <AdminLogin onLogin={login} />;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">จัดการการจอง</h1>
          <p className="text-slate-600">
            อนุมัติ ยกเลิก แก้ไข ลบ — บันทึกระยะทางสำหรับ Dashboard
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons password={password} />
          <button type="button" className="btn-secondary" onClick={logout}>
            <LogOut className="h-4 w-4" />
            ออกจากระบบ
          </button>
        </div>
      </div>
      <BookingTable
        bookings={bookings}
        password={password}
        onRefresh={load}
      />
    </div>
  );
}
