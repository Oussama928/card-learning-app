import { NextResponse } from "next/server";
import db from "@/lib/db";
import { cache } from "@/lib/cache";

export async function GET() {
  const start = Date.now();
  let dbHealthy = false;

  try {
    await db.queryAsync("SELECT 1");
    dbHealthy = true;
  } catch {
    dbHealthy = false;
  }

  const cacheHealthy = await cache.ping();
  const isHealthy = dbHealthy;

  return NextResponse.json(
    {
      status: isHealthy ? "ok" : "degraded",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      db: dbHealthy,
      cache: cacheHealthy,
      responseTimeMs: Date.now() - start,
    },
    { status: isHealthy ? 200 : 503 }
  );
}
