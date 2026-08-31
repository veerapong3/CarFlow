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

function getOAuthClient() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;

  const client = new google.auth.OAuth2({ clientId, clientSecret });
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

/**
 * Service accounts have no Drive storage quota of their own, so uploads must be
 * attributed to a real user (OAuth refresh token or an impersonated Workspace
 * account) or to a shared drive. Reads work with the plain service account.
 */
export function getDriveClient() {
  const oauth = getOAuthClient();
  if (oauth) {
    return google.drive({ version: "v3", auth: oauth });
  }
  const auth = getGoogleAuth(process.env.GOOGLE_IMPERSONATE_USER);
  return google.drive({ version: "v3", auth });
}

export function getDriveAuthMode(): "oauth" | "impersonate" | "service-account" {
  if (getOAuthClient()) return "oauth";
  if (process.env.GOOGLE_IMPERSONATE_USER) return "impersonate";
  return "service-account";
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
