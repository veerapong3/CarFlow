import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/settings";

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch dashboard" },
      { status: 500 }
    );
  }
}
