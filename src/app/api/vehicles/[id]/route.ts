import { NextRequest, NextResponse } from "next/server";
import { updateVehicle, deleteVehicle, getVehicleById } from "@/lib/vehicles";
import { verifyAdminPassword, getSettings } from "@/lib/settings";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const vehicle = await getVehicleById(id);
    if (!vehicle) {
      return NextResponse.json({ error: "ไม่พบข้อมูลรถ" }, { status: 404 });
    }
    return NextResponse.json(vehicle);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch vehicle" },
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

    const vehicle = await updateVehicle(id, data);
    if (!vehicle) {
      return NextResponse.json({ error: "ไม่พบข้อมูลรถ" }, { status: 404 });
    }
    return NextResponse.json(vehicle);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update vehicle" },
      { status: 500 }
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

    const success = await deleteVehicle(id);
    if (!success) {
      return NextResponse.json({ error: "ไม่พบข้อมูลรถ" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete vehicle" },
      { status: 500 }
    );
  }
}
