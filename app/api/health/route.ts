import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    await db.queryAsync("SELECT 1");

    return NextResponse.json(
      {
        status: "ok",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "degraded",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
