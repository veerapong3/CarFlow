import type { VehicleStatus } from "@/types";

export const VEHICLE_STATUSES: {
  value: VehicleStatus;
  label: string;
  className: string;
}[] = [
  {
    value: "available",
    label: "ใช้งานได้",
    className: "bg-emerald-100 text-emerald-800",
  },
  {
    value: "repair",
    label: "ระหว่างซ่อม",
    className: "bg-amber-100 text-amber-800",
  },
  {
    value: "inactive",
    label: "ไม่ใช้งาน",
    className: "bg-slate-100 text-slate-600",
  },
];

export function parseVehicleStatus(value?: string | boolean): VehicleStatus {
  if (value === false) return "inactive";
  if (value === true) return "available";

  const v = String(value ?? "")
    .trim()
    .toLowerCase();
  if (
    v === "repair" ||
    v === "ระหว่างซ่อม" ||
    v === "ซ่อม"
  ) {
    return "repair";
  }
  if (
    v === "inactive" ||
    v === "false" ||
    v === "ไม่ใช้งาน" ||
    v === "ปิด"
  ) {
    return "inactive";
  }
  return "available";
}

export function resolveVehicleStatus(
  data: { status?: string; active?: boolean },
  fallback: VehicleStatus = "available"
): VehicleStatus {
  if (data.status !== undefined && data.status !== "") {
    return parseVehicleStatus(data.status);
  }
  if (data.active === false) return "inactive";
  if (data.active === true) return "available";
  return fallback;
}

export function isVehicleBookable(status: VehicleStatus): boolean {
  return status === "available";
}

export function vehicleStatusLabel(status: VehicleStatus): string {
  return VEHICLE_STATUSES.find((s) => s.value === status)?.label || status;
}
