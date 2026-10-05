import { describe, it, expect, beforeAll } from "vitest";
import {
  upsertForecasts,
  getForecastsByLocation,
  getCityForecastSummariesByDate,
  getAvailableDates,
  getLastUpdatedInfo,
} from "@/lib/db/repository";
import { TemperatureForecast } from "@/lib/types";

describe("Database Repository & UPSERT Tests", () => {
  const sampleForecast: TemperatureForecast = {
    regionName: "中部地區",
    locationName: "臺中市",
    dataDate: "2026-10-05",
    startTime: "2026-10-05 06:00:00",
    endTime: "2026-10-05 18:00:00",
    minT: 24.5,
    maxT: 31.5,
    avgT: 28.0,
    weather: "晴時多雲",
    weatherCode: "2",
    precipitationProbability: 10,
    comfort: "舒適",
    fetchedAt: new Date().toISOString(),
  };

  it("should upsert a forecast record", async () => {
    const res = await upsertForecasts([sampleForecast]);
    expect(res.inserted).toBe(1);

    const forecasts = await getForecastsByLocation("臺中市");
    expect(forecasts.length).toBeGreaterThanOrEqual(1);

    const match = forecasts.find((f) => f.startTime === "2026-10-05 06:00:00");
    expect(match).toBeDefined();
    expect(match?.weather).toBe("晴時多雲");
    expect(match?.minT).toBe(24.5);
  });

  it("should not create duplicate records on repeated upserts (UPSERT behavior)", async () => {
    const updatedForecast: TemperatureForecast = {
      ...sampleForecast,
      minT: 25.0,
      weather: "多雲時晴",
    };

    await upsertForecasts([updatedForecast]);
    const forecasts = await getForecastsByLocation("臺中市");

    // Filter by the exact slot
    const slots = forecasts.filter((f) => f.startTime === "2026-10-05 06:00:00");
    expect(slots).toHaveLength(1);
    expect(slots[0].minT).toBe(25.0);
    expect(slots[0].weather).toBe("多雲時晴");
  });

  it("should query city summaries for GIS map", async () => {
    const summaries = await getCityForecastSummariesByDate("2026-10-05");
    expect(Array.isArray(summaries)).toBe(true);
    const taichung = summaries.find((s) => s.locationName === "臺中市");
    expect(taichung).toBeDefined();
    expect(taichung?.lat).toBeDefined();
    expect(taichung?.lng).toBeDefined();
  });

  it("should return last updated information", async () => {
    const info = await getLastUpdatedInfo();
    expect(info.totalRecords).toBeGreaterThan(0);
    expect(info.lastUpdatedAt).toBeDefined();
  });
});
