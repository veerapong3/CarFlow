"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLogin, { useAdminAuth } from "@/components/AdminLogin";
import BookingTable from "@/components/BookingTable";
import type { Booking } from "@/types";
import { LogOut } from "lucide-react";

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

  if (!ready) return null;
  if (!password) return <AdminLogin onLogin={login} />;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">จัดการการจอง</h1>
          <p className="text-slate-600">
            อนุมัติ ยกเลิก แก้ไข ลบ — บันทึกระยะทางสำหรับ Dashboard
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={logout}>
          <LogOut className="h-4 w-4" />
          ออกจากระบบ
        </button>
      </div>
      <BookingTable
        bookings={bookings}
        password={password}
        onRefresh={load}
      />
    </div>
  );
}
