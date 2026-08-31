import { google } from "googleapis";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive",
];

function getCredentials() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (json) {
    return JSON.parse(json);
  }
  return null;
}

export function getGoogleAuth(impersonateUser?: string) {
  const credentials = getCredentials();
  if (!credentials) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not configured");
  }
  return new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
    clientOptions: impersonateUser ? { subject: impersonateUser } : undefined,
  });
}

export function getSheetsClient() {
  const auth = getGoogleAuth();
  return google.sheets({ version: "v4", auth });
}

/**
 * Service accounts have no Drive storage quota of their own, so writes must be
 * attributed to either a shared drive or an impersonated Workspace user.
 */
export function getDriveClient() {
  const auth = getGoogleAuth(process.env.GOOGLE_IMPERSONATE_USER);
  return google.drive({ version: "v3", auth });
}

export function getSpreadsheetId() {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) throw new Error("GOOGLE_SHEET_ID is not configured");
  return id;
}

export function driveImageUrl(fileId: string): string {
  return `https://lh3.googleusercontent.com/d/${fileId}`;
}

export function driveViewUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

export async function verifyDriveFile(fileId: string): Promise<boolean> {
  try {
    const drive = getDriveClient();
    await drive.files.get({ fileId, fields: "id", supportsAllDrives: true });
    return true;
  } catch {
    return false;
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function isGoogleConfigured(): boolean {
  return !!(process.env.GOOGLE_SERVICE_ACCOUNT_JSON && process.env.GOOGLE_SHEET_ID);
}

export function getDriveFolderId(): string {
  const id = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!id) throw new Error("GOOGLE_DRIVE_FOLDER_ID is not configured");
  return id;
}
