"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { THAI_PROVINCES } from "@/lib/provinces";
import type { Vehicle } from "@/types";
import ImageLightbox from "./ImageLightbox";
import { bookingDayCount, formatBookingRange } from "@/lib/booking-dates";
import { NAME_TITLES } from "@/lib/person-name";

interface BookingFormProps {
  startDate: Date;
  endDate: Date;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function BookingForm({
  startDate,
  endDate,
  onSuccess,
  onCancel,
}: BookingFormProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dateStr = format(startDate, "yyyy-MM-dd");
  const endStr = format(endDate, "yyyy-MM-dd");

  const [form, setForm] = useState({
    title: "",
    firstName: "",
    lastName: "",
    phone: "",
    activity: "",
    destination: "",
    province: "มุกดาหาร",
    passengers: 1,
    vehicleId: "",
  });

  useEffect(() => {
    setForm((f) => ({ ...f, vehicleId: "" }));
  }, [dateStr, endStr]);

  useEffect(() => {
    async function load() {
      const params = new URLSearchParams({
        date: dateStr,
        available: "true",
      });
      if (endStr !== dateStr) params.set("endDate", endStr);

      const [vehiclesRes, availableRes] = await Promise.all([
        fetch("/api/vehicles"),
        fetch(`/api/bookings?${params.toString()}`),
      ]);
      const allVehicles: Vehicle[] = await vehiclesRes.json();
      const availableIds: string[] = await availableRes.json();
      const available = allVehicles.filter(
        (v) => v.status === "available" && availableIds.includes(v.id)
      );
      setVehicles(available);
      setForm((f) => {
        if (available.length === 1) {
          return { ...f, vehicleId: available[0].id };
        }
        if (f.vehicleId && !available.some((v) => v.id === f.vehicleId)) {
          return { ...f, vehicleId: "" };
        }
        return f;
      });
    }
    load();
  }, [dateStr, endStr]);

  const range = { date: dateStr, endDate: endStr };
  const days = bookingDayCount(range);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.title) {
      setError("กรุณาเลือกคำนำหน้า");
      return;
    }
    if (!/^\d{10}$/.test(form.phone)) {
      setError("เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          date: dateStr,
          endDate: endStr,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  const selectedVehicle = vehicles.find((v) => v.id === form.vehicleId);

  return (
    <div className="card">
      <h3 className="mb-1 text-lg font-semibold text-slate-900">
        จองรถ — {formatBookingRange(range)}
      </h3>
      <p className="mb-6 text-sm text-slate-500">
        {days > 1
          ? `จองต่อเนื่อง ${days} วัน รถต้องว่างทุกวันในช่วงนี้`
          : "จองวันเดียว"}{" "}
        · กรอกข้อมูลด้านล่าง ระบบจะแจ้ง Admin เพื่ออนุมัติ
      </p>

      {vehicles.length === 0 ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            ไม่มีรถว่างตลอดช่วงวันที่เลือก กรุณาเลือกวันหรือช่วงวันอื่น
          </div>
          <button type="button" className="btn-secondary" onClick={onCancel}>
            ยกเลิก
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[7.5rem_1fr_1fr]">
            <div>
              <label className="label">คำนำหน้า *</label>
              <select
                className="input-field"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              >
                <option value="">เลือก</option>
                {NAME_TITLES.map((title) => (
                  <option key={title} value={title}>
                    {title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">ชื่อ *</label>
              <input
                className="input-field"
                required
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">นามสกุล *</label>
              <input
                className="input-field"
                required
                value={form.lastName}
                onChange={(e) =>
                  setForm({ ...form, lastName: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="label">เบอร์โทรศัพท์ติดต่อ *</label>
            <input
              className="input-field"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              required
              minLength={10}
              maxLength={10}
              pattern="[0-9]{10}"
              placeholder="0812345678"
              value={form.phone}
              onChange={(e) =>
                setForm({
                  ...form,
                  phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                })
              }
            />
            <p className="mt-1 text-xs text-slate-500">
              กรอกตัวเลข 10 หลักเท่านั้น ({form.phone.length}/10)
            </p>
          </div>

          <div>
            <label className="label">ชื่อกิจกรรมที่เข้าร่วม *</label>
            <input
              className="input-field"
              required
              value={form.activity}
              onChange={(e) => setForm({ ...form, activity: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">ปลายทาง (สถานที่) *</label>
              <input
                className="input-field"
                required
                value={form.destination}
                onChange={(e) =>
                  setForm({ ...form, destination: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">จังหวัด *</label>
              <select
                className="input-field"
                required
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
              >
                {THAI_PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">จำนวนผู้ร่วมเดินทาง *</label>
              <input
                className="input-field"
                type="number"
                min={1}
                max={selectedVehicle?.seats || 50}
                required
                value={form.passengers}
                onChange={(e) =>
                  setForm({ ...form, passengers: parseInt(e.target.value, 10) })
                }
              />
              {selectedVehicle && (
                <p className="mt-1 text-xs text-slate-500">
                  ที่นั่งสูงสุด {selectedVehicle.seats} ที่
                </p>
              )}
            </div>
            <div>
              <label className="label">เลือกรถ *</label>
              <select
                className="input-field"
                required
                value={form.vehicleId}
                onChange={(e) =>
                  setForm({ ...form, vehicleId: e.target.value })
                }
              >
                <option value="">-- เลือกรถ --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.brand} {v.model} ({v.licensePlate}) — {v.seats} ที่
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedVehicle?.imageUrl && (
            <div>
              <label className="label">รูปรถ</label>
              <div className="relative h-32 w-48">
                <ImageLightbox
                  src={selectedVehicle.imageUrl}
                  alt={`${selectedVehicle.brand} ${selectedVehicle.model}`}
                  className="h-32 w-48"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? "กำลังส่ง..." : "ส่งคำขอจอง"}
            </button>
            <button type="button" className="btn-secondary" onClick={onCancel}>
              ยกเลิก
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
