import { NextRequest, NextResponse } from "next/server";
import {
  getAllBookings,
  createBooking,
  getBookingsByMonth,
  getAvailableVehicles,
} from "@/lib/bookings";
import { notifyNewBooking } from "@/lib/telegram";
import { verifyAdminPassword, getSettings } from "@/lib/settings";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const date = searchParams.get("date");
    const available = searchParams.get("available");

    if (date && available === "true") {
      const vehicleIds = await getAvailableVehicles(date);
      return NextResponse.json(vehicleIds);
    }

    if (year && month) {
      const bookings = await getBookingsByMonth(
        parseInt(year, 10),
        parseInt(month, 10)
      );
      return NextResponse.json(bookings);
    }

    const bookings = await getAllBookings();
    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const booking = await createBooking(body);

    notifyNewBooking(booking).catch(console.error);

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create booking" },
      { status: 400 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;
    const settings = await getSettings();
    if (!verifyAdminPassword(password, settings)) {
      return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }
    return NextResponse.json({ error: "Use /api/bookings/[id] for updates" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
