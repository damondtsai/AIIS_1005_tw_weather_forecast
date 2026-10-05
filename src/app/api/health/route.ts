import { NextResponse } from "next/server";
import { getLastUpdatedInfo, getAvailableDates } from "@/lib/db/repository";

/**
 * GET /api/health
 * Health check endpoint for system monitoring, database status, and uptime checks.
 * Zero secret exposure.
 */
export async function GET() {
  try {
    const { totalRecords, lastUpdatedAt } = await getLastUpdatedInfo();
    const dates = await getAvailableDates();

    const isHealthy = totalRecords > 0;

    return NextResponse.json({
      ok: true,
      status: isHealthy ? "healthy" : "degraded",
      database: "connected",
      totalRecords,
      availableDatesCount: dates.length,
      latestDataDate: dates.length > 0 ? dates[dates.length - 1] : null,
      lastUpdatedAt,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: "unhealthy",
        database: "disconnected",
        error: "資料庫連線失敗或系統發生異常",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
