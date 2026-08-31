"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLogin, { useAdminAuth } from "@/components/AdminLogin";
import PageLoading from "@/components/PageLoading";
import VehicleTable from "@/components/VehicleTable";
import type { Vehicle } from "@/types";
import { LogOut } from "lucide-react";

export default function AdminVehiclesPage() {
  const { password, ready, login, logout } = useAdminAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/vehicles");
    setVehicles(await res.json());
  }, []);

  useEffect(() => {
    if (password) load();
  }, [password, load]);

  if (!ready) return <PageLoading />;
  if (!password) return <AdminLogin onLogin={login} />;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">จัดการรถ</h1>
          <p className="text-slate-600">
            เพิ่ม ลบ แก้ไข ข้อมูลรถ — รูปภาพจาก Google Drive (lh3)
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={logout}>
          <LogOut className="h-4 w-4" />
          ออกจากระบบ
        </button>
      </div>
      <VehicleTable
        vehicles={vehicles}
        password={password}
        onRefresh={load}
      />
    </div>
  );
}
