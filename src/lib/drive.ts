import { Readable } from "stream";
import {
  driveImageUrl,
  generateId,
  getDriveClient,
  getDriveFolderId,
  isGoogleConfigured,
} from "./google-auth";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return "รองรับเฉพาะไฟล์ JPG, PNG, WebP, GIF";
  }
  if (file.size > MAX_SIZE) {
    return "ขนาดไฟล์ต้องไม่เกิน 5 MB";
  }
  return null;
}

export async function uploadImageToDrive(
  buffer: Buffer,
  mimeType: string,
  originalName: string
): Promise<{ fileId: string; imageUrl: string }> {
  if (!isGoogleConfigured()) {
    throw new Error("Google Drive is not configured");
  }

  const drive = getDriveClient();
  const folderId = getDriveFolderId();
  const ext = originalName.split(".").pop() || "jpg";
  const fileName = `car-${generateId()}.${ext}`;

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
      mimeType,
    },
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    fields: "id",
  });

  const fileId = res.data.id;
  if (!fileId) throw new Error("อัปโหลดไม่สำเร็จ");

  await drive.permissions.create({
    fileId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  return {
    fileId,
    imageUrl: driveImageUrl(fileId),
  };
}
