import { NextRequest, NextResponse } from "next/server";
import {
  getBookingById,
  updateBooking,
  updateBookingStatus,
  deleteBooking,
} from "@/lib/bookings";
import { notifyBookingStatusChange } from "@/lib/telegram";
import { verifyAdminPassword, getSettings } from "@/lib/settings";
import type { BookingStatus } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const booking = await getBookingById(id);
    if (!booking) {
      return NextResponse.json({ error: "ไม่พบการจอง" }, { status: 404 });
    }
    return NextResponse.json(booking);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { password, ...data } = body;

    const settings = await getSettings();
    if (!verifyAdminPassword(password, settings)) {
      return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    const booking = await updateBooking(id, data);
    if (!booking) {
      return NextResponse.json({ error: "ไม่พบการจอง" }, { status: 404 });
    }
    return NextResponse.json(booking);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update booking" },
      { status: 400 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { password, status, distance, notes } = body as {
      password?: string;
      status: BookingStatus;
      distance?: number;
      notes?: string;
    };

    const settings = await getSettings();
    if (password && !verifyAdminPassword(password, settings)) {
      return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    const booking = await updateBookingStatus(id, status, { distance, notes });
    if (!booking) {
      return NextResponse.json({ error: "ไม่พบการจอง" }, { status: 404 });
    }

    if (status === "approved" || status === "cancelled") {
      notifyBookingStatusChange(booking, status).catch(console.error);
    }

    return NextResponse.json(booking);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update status" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { password } = body;

    const settings = await getSettings();
    if (!verifyAdminPassword(password, settings)) {
      return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    const success = await deleteBooking(id);
    if (!success) {
      return NextResponse.json({ error: "ไม่พบการจอง" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete booking" },
      { status: 500 }
    );
  }
}
