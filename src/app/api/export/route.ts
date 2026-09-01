import { NextRequest, NextResponse } from "next/server";
import { getAllBookings } from "@/lib/bookings";
import { getAllVehicles } from "@/lib/vehicles";
import {
  getDashboardStats,
  getSettings,
  verifyAdminPassword,
} from "@/lib/settings";
import {
  buildCsvReport,
  buildXlsxReport,
  exportFilename,
} from "@/lib/export-report";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const password = String(body.password || "");
    const format = body.format === "xlsx" ? "xlsx" : "csv";

    const settings = await getSettings();
    if (!verifyAdminPassword(password, settings)) {
      return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const [stats, bookings, vehicles] = await Promise.all([
      getDashboardStats(),
      getAllBookings(),
      getAllVehicles(),
    ]);

    const payload = {
      stats,
      bookings,
      vehicles,
      schoolName: settings.schoolName,
      year,
      month,
    };

    const filename = exportFilename(format, year, month);

    if (format === "xlsx") {
      const buffer = await buildXlsxReport(payload);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        },
      });
    }

    const csv = buildCsvReport(payload);
    return new NextResponse(Buffer.from(csv, "utf8"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ส่งออกไม่สำเร็จ" },
      { status: 500 }
    );
  }
}
