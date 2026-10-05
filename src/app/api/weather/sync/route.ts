import { NextRequest, NextResponse } from "next/server";
import { fetchCwaWeather } from "@/lib/cwa/client";
import { normalizeCwaData } from "@/lib/cwa/normalize";
import { upsertForecasts, getLastUpdatedInfo } from "@/lib/db/repository";

export const dynamic = "force-dynamic";

let lastSyncTimestamp = 0;
const MIN_SYNC_INTERVAL_MS = 10_000; // 10 seconds minimum cooldown

/**
 * POST /api/weather/sync
 * Secure endpoint to fetch latest data from CWA Open Data API and update database.
 * Requires: Authorization: Bearer <SYNC_SECRET> if SYNC_SECRET environment variable is set.
 */
export async function POST(request: NextRequest) {
  try {
    const syncSecret = process.env.SYNC_SECRET;

    // Check authorization if SYNC_SECRET is configured
    if (syncSecret && syncSecret.trim() !== "") {
      const authHeader = request.headers.get("authorization");
      const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7).trim() : null;

      if (!bearerToken || bearerToken !== syncSecret.trim()) {
        return NextResponse.json(
          { ok: false, error: "未授權的同步請求：請提供有效的 SYNC_SECRET Bearer Token。" },
          { status: 401 }
        );
      }
    }

    // Debounce check
    const now = Date.now();
    if (now - lastSyncTimestamp < MIN_SYNC_INTERVAL_MS) {
      return NextResponse.json(
        { ok: false, error: "同步請求過於頻繁，請於 10 秒後再試。" },
        { status: 429 }
      );
    }
    lastSyncTimestamp = now;

    // Fetch from CWA API with fallback to bundled dataset
    const cwaResult = await fetchCwaWeather();
    const fetchedAt = new Date().toISOString();

    // Normalize into flat records
    const normalizedRecords = normalizeCwaData(cwaResult.data, fetchedAt);

    if (normalizedRecords.length === 0) {
      return NextResponse.json(
        { ok: false, error: "未能解析出任何有效的氣象預報資料。" },
        { status: 422 }
      );
    }

    // Upsert into SQLite/libSQL database
    const upsertResult = await upsertForecasts(normalizedRecords);
    const { totalRecords, lastUpdatedAt } = await getLastUpdatedInfo();

    return NextResponse.json({
      ok: true,
      message: `資料同步成功！已儲存 ${upsertResult.inserted} 筆預報紀錄。`,
      insertedCount: upsertResult.inserted,
      totalRecords,
      fetchedAt: lastUpdatedAt || fetchedAt,
      isFallback: cwaResult.isFallback,
      source: cwaResult.source,
    });
  } catch (error) {
    console.error("[Weather Sync API Error]:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "執行氣象資料同步時發生伺服器錯誤，請檢視系統紀錄。",
      },
      { status: 500 }
    );
  }
}
