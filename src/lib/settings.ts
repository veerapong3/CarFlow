import type { DashboardStats, Settings } from "@/types";
import { getAllBookings } from "./bookings";
import { getSheetsClient, getSpreadsheetId, isGoogleConfigured } from "./google-auth";
import { getAllVehicles } from "./vehicles";
import { isVehicleBookable } from "./vehicle-status";

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

  const monthBookings = bookings.filter((b) => {
    const d = new Date(b.date);
    return (
      d.getFullYear() === year &&
      d.getMonth() + 1 === month &&
      b.status !== "cancelled"
    );
  });

  const travelDays = new Set(
    monthBookings.map((b) => b.date)
  ).size;

  const totalDistance = monthBookings.reduce(
    (sum, b) => sum + (b.distance || 0),
    0
  );

  const pending = bookings.filter((b) => b.status === "pending").length;
  const approved = bookings.filter((b) => b.status === "approved").length;

  return {
    totalDistanceThisMonth: totalDistance,
    travelDaysThisMonth: travelDays,
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
