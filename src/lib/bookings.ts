import type { Booking, BookingFormData, BookingStatus } from "@/types";
import { generateId, getSheetsClient, getSpreadsheetId, isGoogleConfigured } from "./google-auth";
import { getAllVehicles } from "./vehicles";

const SHEET = "Bookings";

function rowToBooking(row: string[]): Booking {
  return {
    id: row[0] || "",
    date: row[1] || "",
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
    range: `${SHEET}!A2:P1000`,
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
    (b) => b.date === date && b.status !== "cancelled"
  );
}

export async function getBookingsByMonth(year: number, month: number): Promise<Booking[]> {
  const all = await getAllBookings();
  return all.filter((b) => {
    const d = new Date(b.date);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
}

export async function isVehicleAvailable(
  vehicleId: string,
  date: string,
  excludeBookingId?: string
): Promise<boolean> {
  const bookings = await getBookingsByDate(date);
  return !bookings.some(
    (b) =>
      b.vehicleId === vehicleId &&
      b.status !== "cancelled" &&
      b.id !== excludeBookingId
  );
}

export async function getAvailableVehicles(date: string): Promise<string[]> {
  const vehicles = await getAllVehicles(true);
  const bookings = await getBookingsByDate(date);
  const bookedIds = new Set(
    bookings.filter((b) => b.status !== "cancelled").map((b) => b.vehicleId)
  );
  return vehicles.filter((v) => !bookedIds.has(v.id)).map((v) => v.id);
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const all = await getAllBookings();
  return all.find((b) => b.id === id) || null;
}

export async function createBooking(data: BookingFormData): Promise<Booking> {
  const available = await isVehicleAvailable(data.vehicleId, data.date);
  if (!available) {
    throw new Error("รถคันนี้ถูกจองในวันที่เลือกแล้ว กรุณาเลือกรถคันอื่น");
  }

  const vehicles = await getAllVehicles();
  const vehicle = vehicles.find((v) => v.id === data.vehicleId);
  if (!vehicle) throw new Error("ไม่พบข้อมูลรถ");
  if (data.passengers > vehicle.seats) {
    throw new Error(`จำนวนผู้โดยสารเกินที่นั่ง (สูงสุด ${vehicle.seats} ที่)`);
  }

  const now = new Date().toISOString();
  const booking: Booking = {
    id: generateId(),
    ...data,
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
    range: `${SHEET}!A:P`,
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
  if (!isGoogleConfigured()) {
    const idx = DEMO_BOOKINGS.findIndex((b) => b.id === id);
    if (idx === -1) return null;

    if (data.vehicleId && data.date) {
      const available = await isVehicleAvailable(
        data.vehicleId,
        data.date,
        id
      );
      if (!available) {
        throw new Error("รถคันนี้ถูกจองในวันที่เลือกแล้ว");
      }
    }

    DEMO_BOOKINGS[idx] = {
      ...DEMO_BOOKINGS[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return DEMO_BOOKINGS[idx];
  }

  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET}!A2:P1000`,
  });

  const rows = res.data.values || [];
  const rowIndex = rows.findIndex((r) => r[0] === id);
  if (rowIndex === -1) return null;

  const existing = rowToBooking(rows[rowIndex]);

  if (data.vehicleId && (data.date || existing.date)) {
    const date = data.date || existing.date;
    const available = await isVehicleAvailable(data.vehicleId, date, id);
    if (!available) {
      throw new Error("รถคันนี้ถูกจองในวันที่เลือกแล้ว");
    }
  }

  const updated: Booking = {
    ...existing,
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  };

  if (data.vehicleId && data.vehicleId !== existing.vehicleId) {
    const vehicles = await getAllVehicles();
    const vehicle = vehicles.find((v) => v.id === data.vehicleId);
    if (vehicle) {
      updated.vehicleName = `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`;
    }
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET}!A${rowIndex + 2}:P${rowIndex + 2}`,
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
