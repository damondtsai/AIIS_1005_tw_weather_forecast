import { NextRequest, NextResponse } from "next/server";
import {
  getForecastsByLocation,
  getCityForecastSummariesByDate,
  getAvailableDates,
  getLastUpdatedInfo,
  upsertForecasts,
} from "@/lib/db/repository";
import { fetchCwaWeather } from "@/lib/cwa/client";
import { normalizeCwaData } from "@/lib/cwa/normalize";
import { isValidTaiwanCity, normalizeCityName } from "@/lib/regions";

export const dynamic = "force-dynamic";

/**
 * GET /api/weather
 * Query Parameters:
 *  - location: string (e.g. 臺中市)
 *  - region: string (e.g. 中部地區)
 *  - date: string (e.g. 2026-10-05)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const locationParam = searchParams.get("location");
    const dateParam = searchParams.get("date");

    // Check if database has data; if empty, trigger an initial auto-sync
    let { totalRecords, lastUpdatedAt } = await getLastUpdatedInfo();
    let isFallback = false;

    if (totalRecords === 0) {
      try {
        const cwaResult = await fetchCwaWeather();
        const records = normalizeCwaData(cwaResult.data);
        await upsertForecasts(records);
        const updated = await getLastUpdatedInfo();
        totalRecords = updated.totalRecords;
        lastUpdatedAt = updated.lastUpdatedAt;
        isFallback = cwaResult.isFallback;
      } catch (syncErr) {
        console.warn("[Weather API] Initial auto-sync failed:", syncErr);
      }
    }

    // Available dates
    const availableDates = await getAvailableDates();
    const effectiveDate = dateParam || availableDates[0] || new Date().toISOString().slice(0, 10);

    // Validate location parameter if provided
    let locationData = null;
    let targetCity = "臺中市";

    if (locationParam) {
      const normalized = normalizeCityName(locationParam);
      if (!isValidTaiwanCity(normalized)) {
        return NextResponse.json(
          { ok: false, error: `無效的縣市名稱：「${locationParam}」，請輸入正確的台灣 22 縣市名稱。` },
          { status: 400 }
        );
      }
      targetCity = normalized;
    }

    locationData = await getForecastsByLocation(targetCity);

    // City summaries for the selected date (for GIS Map & City Cards)
    const summaryData = await getCityForecastSummariesByDate(effectiveDate);

    return NextResponse.json({
      ok: true,
      data: locationData,
      summary: summaryData,
      selectedCity: targetCity,
      selectedDate: effectiveDate,
      availableDates,
      totalRecords,
      updatedAt: lastUpdatedAt,
      isFallback,
    });
  } catch (error) {
    console.error("[Weather API Error]:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "讀取氣象預報資料時發生伺服器錯誤，請稍後再試。",
      },
      { status: 500 }
    );
  }
}
