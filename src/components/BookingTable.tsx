"use client";

import { useState } from "react";
import type { Booking } from "@/types";
import StatusBadge from "./StatusBadge";
import { Check, X, Trash2 } from "lucide-react";
import { formatBookingRange } from "@/lib/booking-dates";

interface BookingTableProps {
  bookings: Booking[];
  password: string;
  onRefresh: () => void;
}

export default function BookingTable({
  bookings,
  password,
  onRefresh,
}: BookingTableProps) {
  const [editing, setEditing] = useState<Booking | null>(null);
  const [distance, setDistance] = useState("");
  const [loading, setLoading] = useState(false);

  async function updateStatus(id: string, status: "approved" | "cancelled") {
    setLoading(true);
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, status }),
    });
    setLoading(false);
    onRefresh();
  }

  async function saveDistance(id: string) {
    await fetch(`/api/bookings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password,
        distance: parseFloat(distance) || 0,
      }),
    });
    setEditing(null);
    onRefresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("ต้องการลบการจองนี้ใช่หรือไม่?")) return;
    await fetch(`/api/bookings/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    onRefresh();
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
          <tr>
            <th className="px-4 py-3 font-medium">วันที่</th>
            <th className="px-4 py-3 font-medium">ผู้จอง</th>
            <th className="px-4 py-3 font-medium">กิจกรรม</th>
            <th className="px-4 py-3 font-medium">ปลายทาง</th>
            <th className="px-4 py-3 font-medium">รถ</th>
            <th className="px-4 py-3 font-medium">ระยะทาง (km)</th>
            <th className="px-4 py-3 font-medium">สถานะ</th>
            <th className="px-4 py-3 font-medium">จัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {bookings.map((b) => (
            <tr key={b.id} className="hover:bg-slate-50">
              <td className="whitespace-nowrap px-4 py-3">
                {formatBookingRange(b)}
              </td>
              <td className="px-4 py-3">
                <div className="font-medium">
                  {b.firstName} {b.lastName}
                </div>
                <div className="text-xs text-slate-500">{b.phone}</div>
              </td>
              <td className="px-4 py-3">{b.activity}</td>
              <td className="px-4 py-3">
                {b.destination}, {b.province}
                <div className="text-xs text-slate-500">
                  {b.passengers} คน
                </div>
              </td>
              <td className="px-4 py-3 text-xs">{b.vehicleName}</td>
              <td className="px-4 py-3">
                {editing?.id === b.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      className="input-field w-20 py-1"
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                    />
                    <button
                      type="button"
                      className="text-emerald-600"
                      onClick={() => saveDistance(b.id)}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="text-slate-600 hover:text-primary-600"
                    onClick={() => {
                      setEditing(b);
                      setDistance(String(b.distance || ""));
                    }}
                  >
                    {b.distance ? `${b.distance} km` : "—"}
                  </button>
                )}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={b.status} />
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  {b.status === "pending" && (
                    <>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => updateStatus(b.id, "approved")}
                        className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50"
                        title="อนุมัติ"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => updateStatus(b.id, "cancelled")}
                        className="rounded p-1.5 text-red-600 hover:bg-red-50"
                        title="ยกเลิก"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(b.id)}
                    className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                    title="ลบ"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {bookings.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                ยังไม่มีการจอง
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
