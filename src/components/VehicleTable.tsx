"use client";

import { useState } from "react";
import type { Vehicle, VehicleFormData } from "@/types";
import ImageLightbox from "./ImageLightbox";
import { Pencil, Trash2, Plus } from "lucide-react";

interface VehicleTableProps {
  vehicles: Vehicle[];
  password: string;
  onRefresh: () => void;
}

const EMPTY_FORM: VehicleFormData = {
  brand: "",
  model: "",
  color: "",
  licensePlate: "",
  driver: "",
  seats: 12,
  imageDriveId: "",
  active: true,
};

export default function VehicleTable({
  vehicles,
  password,
  onRefresh,
}: VehicleTableProps) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<VehicleFormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError("");
  }

  function openEdit(v: Vehicle) {
    setEditing(v);
    setForm({
      brand: v.brand,
      model: v.model,
      color: v.color,
      licensePlate: v.licensePlate,
      driver: v.driver,
      seats: v.seats,
      imageDriveId: v.imageDriveId || "",
      active: v.active,
    });
    setShowForm(true);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = editing ? `/api/vehicles/${editing.id}` : "/api/vehicles";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowForm(false);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("ต้องการลบรถคันนี้ใช่หรือไม่?")) return;
    const res = await fetch(`/api/vehicles/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) onRefresh();
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button type="button" className="btn-primary" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          เพิ่มรถ
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="mb-4 text-lg font-semibold">
            {editing ? "แก้ไขข้อมูลรถ" : "เพิ่มรถใหม่"}
          </h3>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">ยี่ห้อ *</label>
              <input
                className="input-field"
                required
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
            </div>
            <div>
              <label className="label">รุ่น *</label>
              <input
                className="input-field"
                required
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
              />
            </div>
            <div>
              <label className="label">สี *</label>
              <input
                className="input-field"
                required
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
              />
            </div>
            <div>
              <label className="label">ป้ายทะเบียน *</label>
              <input
                className="input-field"
                required
                value={form.licensePlate}
                onChange={(e) =>
                  setForm({ ...form, licensePlate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">พนักงานประจำรถ *</label>
              <input
                className="input-field"
                required
                value={form.driver}
                onChange={(e) => setForm({ ...form, driver: e.target.value })}
              />
            </div>
            <div>
              <label className="label">จำนวนที่นั่ง *</label>
              <input
                className="input-field"
                type="number"
                min={1}
                required
                value={form.seats}
                onChange={(e) =>
                  setForm({ ...form, seats: parseInt(e.target.value, 10) })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">
                Google Drive File ID (รูปภาพ — lh3)
              </label>
              <input
                className="input-field"
                placeholder="เช่น 1ABC...xyz จากลิงก์ Drive"
                value={form.imageDriveId || ""}
                onChange={(e) =>
                  setForm({ ...form, imageDriveId: e.target.value })
                }
              />
              <p className="mt-1 text-xs text-slate-500">
                อัปโหลดรูปไป Google Drive แล้วคัดลอก File ID มาใส่
                ระบบจะแสดงผ่าน lh3.googleusercontent.com
              </p>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.active !== false}
                  onChange={(e) =>
                    setForm({ ...form, active: e.target.checked })
                  }
                />
                <span className="text-sm">ใช้งานได้</span>
              </label>
            </div>
            {error && (
              <div className="sm:col-span-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="flex gap-2 sm:col-span-2">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "กำลังบันทึก..." : "บันทึก"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowForm(false)}
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">รูป</th>
              <th className="px-4 py-3 font-medium">ยี่ห้อ/รุ่น</th>
              <th className="px-4 py-3 font-medium">สี</th>
              <th className="px-4 py-3 font-medium">ทะเบียน</th>
              <th className="px-4 py-3 font-medium">คนขับ</th>
              <th className="px-4 py-3 font-medium">ที่นั่ง</th>
              <th className="px-4 py-3 font-medium">สถานะ</th>
              <th className="px-4 py-3 font-medium">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vehicles.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  {v.imageUrl ? (
                    <div className="relative h-12 w-16">
                      <ImageLightbox
                        src={v.imageUrl}
                        alt={`${v.brand} ${v.model}`}
                        className="h-12 w-16"
                      />
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 font-medium">
                  {v.brand} {v.model}
                </td>
                <td className="px-4 py-3">{v.color}</td>
                <td className="px-4 py-3">{v.licensePlate}</td>
                <td className="px-4 py-3">{v.driver}</td>
                <td className="px-4 py-3">{v.seats}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      v.active
                        ? "text-emerald-600"
                        : "text-slate-400 line-through"
                    }
                  >
                    {v.active ? "ใช้งาน" : "ปิด"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(v)}
                      className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-primary-600"
                      title="แก้ไข"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(v.id)}
                      className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      title="ลบ"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {vehicles.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  ยังไม่มีข้อมูลรถ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
