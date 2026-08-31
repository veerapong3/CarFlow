import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword, getSettings } from "@/lib/settings";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const settings = await getSettings();

    if (!password || !verifyAdminPassword(password, settings)) {
      return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
