import ExcelJS from "exceljs";
import type { Booking, DashboardStats, Vehicle } from "@/types";
import { bookingDayCount, bookingEndDate, formatBookingRange } from "./booking-dates";
import { vehicleStatusLabel } from "./vehicle-status";

const BOOKING_STATUS: Record<string, string> = {
  pending: "รออนุมัติ",
  approved: "อนุมัติแล้ว",
  cancelled: "ยกเลิก",
  completed: "เสร็จสิ้น",
};

export const BOOKING_CSV_HEADERS = [
  "รหัสการจอง",
  "วันเริ่มต้น",
  "วันสิ้นสุด",
  "จำนวนวัน",
  "ช่วงวันที่",
  "คำนำหน้า",
  "ชื่อ",
  "นามสกุล",
  "โทรศัพท์",
  "กิจกรรม",
  "ปลายทาง",
  "จังหวัด",
  "จำนวนผู้โดยสาร",
  "รถ",
  "สถานะ",
  "ระยะทาง (กม.)",
  "หมายเหตุ",
];

export const VEHICLE_CSV_HEADERS = [
  "รหัสรถ",
  "ยี่ห้อ",
  "รุ่น",
  "สี",
  "ทะเบียน",
  "พนักงานประจำรถ",
  "ที่นั่ง",
  "สถานะ",
];

function bookingRow(b: Booking): (string | number)[] {
  return [
    b.id,
    b.date,
    bookingEndDate(b),
    bookingDayCount(b),
    formatBookingRange(b),
    b.title || "",
    b.firstName,
    b.lastName,
    b.phone,
    b.activity,
    b.destination,
    b.province,
    b.passengers,
    b.vehicleName || "",
    BOOKING_STATUS[b.status] || b.status,
    b.distance ?? "",
    b.notes || "",
  ];
}

function vehicleRow(v: Vehicle): (string | number)[] {
  return [
    v.id,
    v.brand,
    v.model,
    v.color,
    v.licensePlate,
    v.driver,
    v.seats,
    vehicleStatusLabel(v.status),
  ];
}

function monthLabel(year: number, month: number): string {
  return `${month}/${year}`;
}

export function summaryRows(
  stats: DashboardStats,
  schoolName: string,
  year: number,
  month: number
): [string, string | number][] {
  return [
    ["โรงเรียน", schoolName],
    ["เดือนที่สรุป", monthLabel(year, month)],
    ["ระยะทางรวม (กม.)", stats.totalDistanceThisMonth],
    ["วันที่เดินทาง (วัน)", stats.travelDaysThisMonth],
    ["การจองเดือนนี้ (ใบ)", stats.totalBookingsThisMonth],
    ["รออนุมัติ (ทั้งหมด)", stats.pendingBookings],
    ["อนุมัติแล้ว (ทั้งหมด)", stats.approvedBookings],
    ["รถที่ใช้งานได้", stats.totalVehicles],
  ];
}

function csvCell(value: string | number): string {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function csvTable(headers: string[], rows: (string | number)[][]): string {
  return [headers.map(csvCell).join(","), ...rows.map((r) => r.map(csvCell).join(","))].join(
    "\r\n"
  );
}

export function buildCsvReport(input: {
  stats: DashboardStats;
  bookings: Booking[];
  vehicles: Vehicle[];
  schoolName: string;
  year: number;
  month: number;
}): string {
  const summary = summaryRows(input.stats, input.schoolName, input.year, input.month);
  const parts = [
    "สรุปสถิติ",
    csvTable(["รายการ", "ค่า"], summary),
    "",
    "รายการจอง",
    csvTable(BOOKING_CSV_HEADERS, input.bookings.map(bookingRow)),
    "",
    "ข้อมูลรถ",
    csvTable(VEHICLE_CSV_HEADERS, input.vehicles.map(vehicleRow)),
  ];
  return `\uFEFF${parts.join("\r\n")}`;
}

export async function buildXlsxReport(input: {
  stats: DashboardStats;
  bookings: Booking[];
  vehicles: Vehicle[];
  schoolName: string;
  year: number;
  month: number;
}): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "CarFlow";
  wb.created = new Date();

  const summary = wb.addWorksheet("สรุปสถิติ", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  summary.columns = [
    { header: "รายการ", key: "label", width: 32 },
    { header: "ค่า", key: "value", width: 40 },
  ];
  for (const [label, value] of summaryRows(
    input.stats,
    input.schoolName,
    input.year,
    input.month
  )) {
    summary.addRow({ label, value });
  }
  styleHeader(summary);

  const bookingsSheet = wb.addWorksheet("รายการจอง", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  bookingsSheet.columns = BOOKING_CSV_HEADERS.map((header) => ({
    header,
    width: header.length > 12 ? 18 : 14,
  }));
  bookingsSheet.getColumn(1).width = 22;
  bookingsSheet.getColumn(9).width = 24;
  bookingsSheet.getColumn(13).width = 28;
  for (const b of input.bookings) {
    bookingsSheet.addRow(bookingRow(b));
  }
  styleHeader(bookingsSheet);

  const vehiclesSheet = wb.addWorksheet("ข้อมูลรถ", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  vehiclesSheet.columns = VEHICLE_CSV_HEADERS.map((header) => ({
    header,
    width: 16,
  }));
  for (const v of input.vehicles) {
    vehiclesSheet.addRow(vehicleRow(v));
  }
  styleHeader(vehiclesSheet);

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

function styleHeader(sheet: ExcelJS.Worksheet) {
  const row = sheet.getRow(1);
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF059669" },
  };
}

export function exportFilename(format: "csv" | "xlsx", year: number, month: number): string {
  const mm = String(month).padStart(2, "0");
  return `CarFlow-สถิติ-${year}-${mm}.${format}`;
}
