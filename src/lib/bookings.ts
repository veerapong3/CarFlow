import type { Booking, BookingFormData, BookingStatus } from "@/types";
import { generateId, getSheetsClient, getSpreadsheetId, isGoogleConfigured } from "./google-auth";
import { getAllVehicles } from "./vehicles";
import { isVehicleBookable } from "./vehicle-status";
import {
  MAX_BOOKING_DAYS,
  bookingCoversDate,
  bookingEndDate,
  normalizeBookingRange,
  rangesOverlap,
} from "./booking-dates";

const SHEET = "Bookings";
const RANGE = `${SHEET}!A2:Q1000`;

function rowToBooking(row: string[]): Booking {
  const date = row[1] || "";
  return {
    id: row[0] || "",
    date,
    endDate: row[16] || date,
    firstName: row[2] || "",
    lastName: row[3] || "",
    phone: row[4] || "",
    activity: row[5] || "",
    destination: row[6] || "",
    province: row[7] || "",
    passengers: parseInt(row[8] || "0", 10),
    vehicleId: row[9] || "",
    vehicleName: row[10] || "",
    status: (row[11] as BookingStatus) || "pending",
    distance: row[12] ? parseFloat(row[12]) : undefined,
    notes: row[13] || "",
    createdAt: row[14] || "",
    updatedAt: row[15] || "",
  };
}

function bookingToRow(b: Booking): string[] {
  return [
    b.id,
    b.date,
    b.firstName,
    b.lastName,
    b.phone,
    b.activity,
    b.destination,
    b.province,
    String(b.passengers),
    b.vehicleId,
    b.vehicleName || "",
    b.status,
    b.distance !== undefined ? String(b.distance) : "",
    b.notes || "",
    b.createdAt,
    b.updatedAt,
    bookingEndDate(b),
  ];
}

const DEMO_BOOKINGS: Booking[] = [];

export async function getAllBookings(): Promise<Booking[]> {
  if (!isGoogleConfigured()) {
    return [...DEMO_BOOKINGS].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: RANGE,
  });

  const rows = res.data.values || [];
  return rows
    .filter((r) => r[0])
    .map(rowToBooking)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getBookingsByDate(date: string): Promise<Booking[]> {
  const all = await getAllBookings();
  return all.filter(
    (b) => bookingCoversDate(b, date) && b.status !== "cancelled"
  );
}

export async function getBookingsByMonth(year: number, month: number): Promise<Booking[]> {
  const all = await getAllBookings();
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return all.filter((b) =>
    rangesOverlap(b.date, bookingEndDate(b), monthStart, monthEnd)
  );
}

const SUCCESS_STATUSES: BookingStatus[] = ["approved", "completed"];

/** รายการจองที่อนุมัติแล้วหรือเสร็จสิ้น ล่าสุดตามวันที่เดินทาง — ไม่ส่งเบอร์โทรออกไป (หน้าสาธารณะ) */
export async function getRecentSuccessfulBookings(
  limit = 10
): Promise<Booking[]> {
  const all = await getAllBookings();
  return all
    .filter((b) => SUCCESS_STATUSES.includes(b.status))
    .sort((a, b) => {
      const byDate = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (byDate !== 0) return byDate;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, Math.max(1, Math.min(limit, 50)))
    .map((b) => ({ ...b, phone: "" }));
}

export async function isVehicleAvailable(
  vehicleId: string,
  date: string,
  excludeBookingId?: string,
  endDate?: string
): Promise<boolean> {
  const { date: start, endDate: end } = normalizeBookingRange(date, endDate);
  const bookings = await getAllBookings();
  return !bookings.some(
    (b) =>
      b.vehicleId === vehicleId &&
      b.status !== "cancelled" &&
      b.id !== excludeBookingId &&
      rangesOverlap(b.date, bookingEndDate(b), start, end)
  );
}

export async function getAvailableVehicles(
  date: string,
  endDate?: string
): Promise<string[]> {
  const { date: start, endDate: end } = normalizeBookingRange(date, endDate);
  const vehicles = await getAllVehicles(true);
  const bookings = await getAllBookings();
  const bookedIds = new Set(
    bookings
      .filter(
        (b) =>
          b.status !== "cancelled" &&
          rangesOverlap(b.date, bookingEndDate(b), start, end)
      )
      .map((b) => b.vehicleId)
  );
  return vehicles.filter((v) => !bookedIds.has(v.id)).map((v) => v.id);
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const all = await getAllBookings();
  return all.find((b) => b.id === id) || null;
}

export async function createBooking(data: BookingFormData): Promise<Booking> {
  const range = normalizeBookingRange(data.date, data.endDate);
  if (!data.date) {
    throw new Error("กรุณาเลือกวันที่เริ่มต้น");
  }
  if (data.endDate && data.endDate < data.date) {
    throw new Error("วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น");
  }
  if (range.days > MAX_BOOKING_DAYS) {
    throw new Error(`จองต่อเนื่องได้สูงสุด ${MAX_BOOKING_DAYS} วัน`);
  }

  const available = await isVehicleAvailable(
    data.vehicleId,
    range.date,
    undefined,
    range.endDate
  );
  if (!available) {
    throw new Error(
      range.days > 1
        ? "รถคันนี้ถูกจองในบางวันของช่วงที่เลือก กรุณาเลือกรถหรือช่วงวันอื่น"
        : "รถคันนี้ถูกจองในวันที่เลือกแล้ว กรุณาเลือกรถคันอื่น"
    );
  }

  const vehicles = await getAllVehicles();
  const vehicle = vehicles.find((v) => v.id === data.vehicleId);
  if (!vehicle) throw new Error("ไม่พบข้อมูลรถ");
  if (!isVehicleBookable(vehicle.status)) {
    throw new Error("รถคันนี้ไม่พร้อมให้จอง (ระหว่างซ่อมหรือไม่ใช้งาน)");
  }
  if (data.passengers > vehicle.seats) {
    throw new Error(`จำนวนผู้โดยสารเกินที่นั่ง (สูงสุด ${vehicle.seats} ที่)`);
  }

  const now = new Date().toISOString();
  const booking: Booking = {
    id: generateId(),
    ...data,
    date: range.date,
    endDate: range.endDate,
    vehicleName: `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  if (!isGoogleConfigured()) {
    DEMO_BOOKINGS.push(booking);
    return booking;
  }

  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET}!A:Q`,
    valueInputOption: "RAW",
    requestBody: { values: [bookingToRow(booking)] },
  });

  return booking;
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
  extra?: { distance?: number; notes?: string }
): Promise<Booking | null> {
  return updateBooking(id, { status, ...extra });
}

export async function updateBooking(
  id: string,
  data: Partial<Booking> & { distance?: number; notes?: string }
): Promise<Booking | null> {
  const applyUpdate = async (existing: Booking): Promise<Booking> => {
    const nextDate = data.date || existing.date;
    const nextEnd = data.endDate || existing.endDate || nextDate;
    const nextVehicle = data.vehicleId || existing.vehicleId;
    const range = normalizeBookingRange(nextDate, nextEnd);

    if (
      data.vehicleId ||
      data.date ||
      data.endDate
    ) {
      const available = await isVehicleAvailable(
        nextVehicle,
        range.date,
        id,
        range.endDate
      );
      if (!available) {
        throw new Error("รถคันนี้ถูกจองในบางวันของช่วงที่เลือก");
      }
    }

    const updated: Booking = {
      ...existing,
      ...data,
      id,
      date: range.date,
      endDate: range.endDate,
      updatedAt: new Date().toISOString(),
    };

    if (data.vehicleId && data.vehicleId !== existing.vehicleId) {
      const vehicles = await getAllVehicles();
      const vehicle = vehicles.find((v) => v.id === data.vehicleId);
      if (vehicle) {
        updated.vehicleName = `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`;
      }
    }

    return updated;
  };

  if (!isGoogleConfigured()) {
    const idx = DEMO_BOOKINGS.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    const updated = await applyUpdate(DEMO_BOOKINGS[idx]);
    DEMO_BOOKINGS[idx] = updated;
    return updated;
  }

  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: RANGE,
  });

  const rows = res.data.values || [];
  const rowIndex = rows.findIndex((r) => r[0] === id);
  if (rowIndex === -1) return null;

  const existing = rowToBooking(rows[rowIndex]);
  const updated = await applyUpdate(existing);

  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET}!A${rowIndex + 2}:Q${rowIndex + 2}`,
    valueInputOption: "RAW",
    requestBody: { values: [bookingToRow(updated)] },
  });

  return updated;
}

export async function deleteBooking(id: string): Promise<boolean> {
  if (!isGoogleConfigured()) {
    const idx = DEMO_BOOKINGS.findIndex((b) => b.id === id);
    if (idx === -1) return false;
    DEMO_BOOKINGS.splice(idx, 1);
    return true;
  }

  const sheets = getSheetsClient();
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: getSpreadsheetId(),
  });
  const sheet = meta.data.sheets?.find((s) => s.properties?.title === SHEET);
  const sheetId = sheet?.properties?.sheetId;
  if (sheetId === undefined) return false;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET}!A2:A1000`,
  });

  const rows = res.data.values || [];
  const rowIndex = rows.findIndex((r) => r[0] === id);
  if (rowIndex === -1) return false;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: getSpreadsheetId(),
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowIndex + 1,
              endIndex: rowIndex + 2,
            },
          },
        },
      ],
    },
  });

  return true;
}

export { SHEET as BOOKING_SHEET };
