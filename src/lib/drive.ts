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

const QUOTA_HINT =
  "Service Account ไม่มีพื้นที่เก็บไฟล์ของตัวเอง ต้องตั้งค่า GOOGLE_IMPERSONATE_USER " +
  "(เปิด domain-wide delegation) หรือย้ายโฟลเดอร์รูปไปไว้ใน Shared Drive";

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return "รองรับเฉพาะไฟล์ JPG, PNG, WebP, GIF";
  }
  if (file.size > MAX_SIZE) {
    return "ขนาดไฟล์ต้องไม่เกิน 5 MB";
  }
  return null;
}

export interface UploadResult {
  fileId: string;
  imageUrl: string;
  publicAccess: boolean;
}

export async function uploadImageToDrive(
  buffer: Buffer,
  mimeType: string,
  originalName: string
): Promise<UploadResult> {
  if (!isGoogleConfigured()) {
    throw new Error("Google Drive is not configured");
  }

  const drive = getDriveClient();
  const folderId = getDriveFolderId();
  const ext = originalName.split(".").pop() || "jpg";
  const fileName = `car-${generateId()}.${ext}`;

  let fileId: string;
  try {
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
      supportsAllDrives: true,
    });

    if (!res.data.id) throw new Error("Drive did not return a file id");
    fileId = res.data.id;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("storage quota")) {
      throw new Error(QUOTA_HINT);
    }
    throw new Error(`อัปโหลดไป Google Drive ไม่สำเร็จ: ${message}`);
  }

  // lh3 can only render the image when the file is readable without auth.
  let publicAccess = true;
  try {
    await drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
      supportsAllDrives: true,
    });
  } catch {
    publicAccess = false;
  }

  return {
    fileId,
    imageUrl: driveImageUrl(fileId),
    publicAccess,
  };
}
