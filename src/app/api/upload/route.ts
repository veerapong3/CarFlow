import { NextRequest, NextResponse } from "next/server";
import { uploadImageToDrive, validateImageFile } from "@/lib/drive";
import { verifyAdminPassword, getSettings } from "@/lib/settings";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const password = formData.get("password") as string;
    const file = formData.get("file") as File | null;

    const settings = await getSettings();
    if (!verifyAdminPassword(password, settings)) {
      return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    if (!file) {
      return NextResponse.json({ error: "กรุณาเลือกไฟล์รูปภาพ" }, { status: 400 });
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadImageToDrive(buffer, file.type, file.name);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "อัปโหลดรูปภาพไม่สำเร็จ ตรวจสอบว่าแชร์โฟลเดอร์ Drive ให้ Service Account แล้ว",
      },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
