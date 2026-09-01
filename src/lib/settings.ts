import type { DashboardStats, Settings } from "@/types";
import { getAllBookings } from "./bookings";
import { getSheetsClient, getSpreadsheetId, isGoogleConfigured } from "./google-auth";
import { getAllVehicles } from "./vehicles";
import { isVehicleBookable } from "./vehicle-status";
import {
  bookingEndDate,
  eachDateInRange,
  rangesOverlap,
} from "./booking-dates";

const SHEET = "Settings";

const DEFAULT_SETTINGS: Settings = {
  telegramChatId: process.env.TELEGRAM_CHAT_ID || "",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
  adminPassword: process.env.ADMIN_PASSWORD || "admin123",
  schoolName: "โรงเรียนดอนตาลวิทยา สพม.มุกดาหาร",
};

function rowToSettings(rows: string[][]): Settings {
  const map: Record<string, string> = {};
  for (const row of rows) {
    if (row[0]) map[row[0]] = row[1] || "";
  }
  return {
    telegramChatId: map.telegramChatId || DEFAULT_SETTINGS.telegramChatId,
    telegramBotToken: map.telegramBotToken || DEFAULT_SETTINGS.telegramBotToken,
    adminPassword: map.adminPassword || DEFAULT_SETTINGS.adminPassword,
    schoolName: map.schoolName || DEFAULT_SETTINGS.schoolName,
  };
}

export async function getSettings(): Promise<Settings> {
  if (!isGoogleConfigured()) return DEFAULT_SETTINGS;

  try {
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: getSpreadsheetId(),
      range: `${SHEET}!A2:B20`,
    });
    return rowToSettings(res.data.values || []);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function updateSettings(
  data: Partial<Settings>
): Promise<Settings> {
  if (!isGoogleConfigured()) {
    Object.assign(DEFAULT_SETTINGS, data);
    return DEFAULT_SETTINGS;
  }

  const current = await getSettings();
  const updated = { ...current, ...data };
  const rows = [
    ["telegramChatId", updated.telegramChatId],
    ["telegramBotToken", updated.telegramBotToken],
    ["adminPassword", updated.adminPassword],
    ["schoolName", updated.schoolName],
  ];

  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET}!A2:B5`,
    valueInputOption: "RAW",
    requestBody: { values: rows },
  });

  return updated;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [bookings, vehicles] = await Promise.all([
    getAllBookings(),
    getAllVehicles(),
  ]);

  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const monthBookings = bookings.filter(
    (b) =>
      b.status !== "cancelled" &&
      rangesOverlap(b.date, bookingEndDate(b), monthStart, monthEnd)
  );

  const travelDays = new Set<string>();
  for (const b of monthBookings) {
    for (const day of eachDateInRange(b.date, bookingEndDate(b))) {
      if (day >= monthStart && day <= monthEnd) travelDays.add(day);
    }
  }

  const totalDistance = monthBookings.reduce(
    (sum, b) => sum + (b.distance || 0),
    0
  );

  const pending = bookings.filter((b) => b.status === "pending").length;
  const approved = bookings.filter((b) => b.status === "approved").length;

  return {
    totalDistanceThisMonth: totalDistance,
    travelDaysThisMonth: travelDays.size,
    totalBookingsThisMonth: monthBookings.length,
    pendingBookings: pending,
    approvedBookings: approved,
    totalVehicles: vehicles.filter((v) => isVehicleBookable(v.status)).length,
    recentBookings: bookings.slice(0, 10),
  };
}

export function verifyAdminPassword(
  password: string,
  settings: Settings
): boolean {
  return password === settings.adminPassword;
}
