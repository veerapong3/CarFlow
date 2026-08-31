import { NextRequest, NextResponse } from "next/server";
import { getAllVehicles, createVehicle } from "@/lib/vehicles";
import { verifyAdminPassword, getSettings } from "@/lib/settings";

export async function GET() {
  try {
    const vehicles = await getAllVehicles();
    return NextResponse.json(vehicles);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch vehicles" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, ...data } = body;

    const settings = await getSettings();
    if (!verifyAdminPassword(password, settings)) {
      return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    const vehicle = await createVehicle(data);
    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create vehicle" },
      { status: 500 }
    );
  }
}
