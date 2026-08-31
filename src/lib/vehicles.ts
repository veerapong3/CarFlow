import type { Vehicle, VehicleFormData } from "@/types";
import {
  driveImageUrl,
  generateId,
  getSheetsClient,
  getSpreadsheetId,
  isGoogleConfigured,
} from "./google-auth";

const SHEET = "Vehicles";
const HEADERS = [
  "id",
  "brand",
  "model",
  "color",
  "licensePlate",
  "driver",
  "seats",
  "imageDriveId",
  "active",
];

function rowToVehicle(row: string[]): Vehicle {
  return {
    id: row[0] || "",
    brand: row[1] || "",
    model: row[2] || "",
    color: row[3] || "",
    licensePlate: row[4] || "",
    driver: row[5] || "",
    seats: parseInt(row[6] || "0", 10),
    imageDriveId: row[7] || undefined,
    imageUrl: row[7] ? driveImageUrl(row[7]) : undefined,
    active: row[8] !== "false",
  };
}

function vehicleToRow(v: Vehicle): string[] {
  return [
    v.id,
    v.brand,
    v.model,
    v.color,
    v.licensePlate,
    v.driver,
    String(v.seats),
    v.imageDriveId || "",
    v.active ? "true" : "false",
  ];
}

// Demo data when Google Sheets is not configured
const DEMO_VEHICLES: Vehicle[] = [
  {
    id: "demo-1",
    brand: "Toyota",
    model: "Commuter",
    color: "ขาว",
    licensePlate: "กข 1234 มก",
    driver: "นายสมชาย ใจดี",
    seats: 12,
    active: true,
  },
  {
    id: "demo-2",
    brand: "Isuzu",
    model: "MU-X",
    color: "ดำ",
    licensePlate: "กค 5678 มก",
    driver: "นายสมศักดิ์ รักเรียน",
    seats: 7,
    active: true,
  },
];

export async function getAllVehicles(activeOnly = false): Promise<Vehicle[]> {
  if (!isGoogleConfigured()) {
    return activeOnly
      ? DEMO_VEHICLES.filter((v) => v.active)
      : DEMO_VEHICLES;
  }

  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET}!A2:I1000`,
  });

  const rows = res.data.values || [];
  let vehicles = rows.filter((r) => r[0]).map(rowToVehicle);
  if (activeOnly) vehicles = vehicles.filter((v) => v.active);
  return vehicles;
}

export async function getVehicleById(id: string): Promise<Vehicle | null> {
  const vehicles = await getAllVehicles();
  return vehicles.find((v) => v.id === id) || null;
}

export async function createVehicle(data: VehicleFormData): Promise<Vehicle> {
  const vehicle: Vehicle = {
    id: generateId(),
    brand: data.brand,
    model: data.model,
    color: data.color,
    licensePlate: data.licensePlate,
    driver: data.driver,
    seats: data.seats,
    imageDriveId: data.imageDriveId,
    imageUrl: data.imageDriveId ? driveImageUrl(data.imageDriveId) : undefined,
    active: data.active !== false,
  };

  if (!isGoogleConfigured()) {
    DEMO_VEHICLES.push(vehicle);
    return vehicle;
  }

  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET}!A:I`,
    valueInputOption: "RAW",
    requestBody: { values: [vehicleToRow(vehicle)] },
  });

  return vehicle;
}

export async function updateVehicle(
  id: string,
  data: Partial<VehicleFormData>
): Promise<Vehicle | null> {
  if (!isGoogleConfigured()) {
    const idx = DEMO_VEHICLES.findIndex((v) => v.id === id);
    if (idx === -1) return null;
    const updated = {
      ...DEMO_VEHICLES[idx],
      ...data,
      imageUrl: data.imageDriveId
        ? driveImageUrl(data.imageDriveId)
        : DEMO_VEHICLES[idx].imageUrl,
    };
    DEMO_VEHICLES[idx] = updated;
    return updated;
  }

  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET}!A2:I1000`,
  });

  const rows = res.data.values || [];
  const rowIndex = rows.findIndex((r) => r[0] === id);
  if (rowIndex === -1) return null;

  const existing = rowToVehicle(rows[rowIndex]);
  const updated: Vehicle = {
    ...existing,
    ...data,
    id,
    imageUrl: data.imageDriveId
      ? driveImageUrl(data.imageDriveId)
      : existing.imageUrl,
    active: data.active !== undefined ? data.active : existing.active,
  };

  await sheets.spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET}!A${rowIndex + 2}:I${rowIndex + 2}`,
    valueInputOption: "RAW",
    requestBody: { values: [vehicleToRow(updated)] },
  });

  return updated;
}

export async function deleteVehicle(id: string): Promise<boolean> {
  if (!isGoogleConfigured()) {
    const idx = DEMO_VEHICLES.findIndex((v) => v.id === id);
    if (idx === -1) return false;
    DEMO_VEHICLES.splice(idx, 1);
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

export { HEADERS as VEHICLE_HEADERS, SHEET as VEHICLE_SHEET };
