"use client";

import { useEffect, useState } from "react";
import AdminLogin, { useAdminAuth } from "@/components/AdminLogin";
import PageLoading from "@/components/PageLoading";
import StatusBadge from "@/components/StatusBadge";
import type { DashboardStats } from "@/types";
import {
  Route,
  CalendarDays,
  ClipboardList,
  Clock,
  Car,
  LogOut,
} from "lucide-react";
import { formatBookingRange } from "@/lib/booking-dates";
import Link from "next/link";
import ExportButtons from "@/components/ExportButtons";

export default function AdminDashboard() {
  const { password, ready, login, logout } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (!password) return;
    setLoadingStats(true);
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoadingStats(false));
  }, [password]);

  if (!ready) return <PageLoading />;

  if (!password) {
    return <AdminLogin onLogin={login} />;
  }

  const cards = [
    {
      label: "ระยะทางรวม (เดือนนี้)",
      value: `${stats?.totalDistanceThisMonth?.toLocaleString() || 0} km`,
      icon: Route,
      color: "bg-blue-500",
    },
    {
      label: "วันที่เดินทาง (เดือนนี้)",
      value: stats?.travelDaysThisMonth || 0,
      icon: CalendarDays,
      color: "bg-emerald-500",
    },
    {
      label: "การจอง (เดือนนี้)",
      value: stats?.totalBookingsThisMonth || 0,
      icon: ClipboardList,
      color: "bg-violet-500",
    },
    {
      label: "รออนุมัติ",
      value: stats?.pendingBookings || 0,
      icon: Clock,
      color: "bg-amber-500",
    },
    {
      label: "อนุมัติแล้ว",
      value: stats?.approvedBookings || 0,
      icon: ClipboardList,
      color: "bg-teal-500",
    },
    {
      label: "รถที่ใช้งาน",
      value: stats?.totalVehicles || 0,
      icon: Car,
      color: "bg-school-green",
    },
  ];

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600">
            สรุปภาพรวมการใช้รถโรงเรียน — ส่งออก CSV หรือ Excel ได้
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

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loadingStats ? (
          <div className="col-span-full">
            <PageLoading label="กำลังโหลดข้อมูล Dashboard..." />
          </div>
        ) : (
          cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl text-white ${color}`}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">{label}</p>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
            </div>
          </div>
        ))
        )}
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">การจองล่าสุด</h2>
          <Link href="/admin/bookings" className="text-sm text-primary-600 hover:underline">
            ดูทั้งหมด →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-slate-500">
              <tr>
                <th className="pb-3 pr-4 font-medium">วันที่</th>
                <th className="pb-3 pr-4 font-medium">ผู้จอง</th>
                <th className="pb-3 pr-4 font-medium">กิจกรรม</th>
                <th className="pb-3 font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.recentBookings?.map((b) => (
                <tr key={b.id}>
                  <td className="py-3 pr-4">
                    {formatBookingRange(b)}
                  </td>
                  <td className="py-3 pr-4">
                    {b.firstName} {b.lastName}
                  </td>
                  <td className="py-3 pr-4">{b.activity}</td>
                  <td className="py-3">
                    <StatusBadge status={b.status} />
                  </td>
                </tr>
              ))}
              {!stats?.recentBookings?.length && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500">
                    ยังไม่มีการจอง
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
