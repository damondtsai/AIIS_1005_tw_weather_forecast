import { getDbClient } from "./client";
import { initializeDatabase } from "./schema";
import { TemperatureForecast, CityForecastSummary } from "../types";
import { CITY_COORDINATES } from "../city-coordinates";
import { getRegionByCity } from "../regions";

let isDbInitialized = false;

async function ensureDb() {
  if (!isDbInitialized) {
    await initializeDatabase();
    isDbInitialized = true;
  }
}

/**
 * Upsert forecast records into TemperatureForecasts table using parameterized SQL
 */
export async function upsertForecasts(
  records: TemperatureForecast[]
): Promise<{ inserted: number; total: number }> {
  if (records.length === 0) return { inserted: 0, total: 0 };
  await ensureDb();

  const db = getDbClient();
  const upsertSql = `
    INSERT INTO TemperatureForecasts (
      regionName, locationName, dataDate, startTime, endTime,
      minT, maxT, avgT, weather, weatherCode,
      precipitationProbability, comfort, fetchedAt
    ) VALUES (
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?
    )
    ON CONFLICT(locationName, dataDate, startTime, endTime) DO UPDATE SET
      regionName = excluded.regionName,
      minT = excluded.minT,
      maxT = excluded.maxT,
      avgT = excluded.avgT,
      weather = excluded.weather,
      weatherCode = excluded.weatherCode,
      precipitationProbability = excluded.precipitationProbability,
      comfort = excluded.comfort,
      fetchedAt = excluded.fetchedAt;
  `;

  // Execute in batches to avoid query payload limits
  const BATCH_SIZE = 50;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const chunk = records.slice(i, i + BATCH_SIZE);
    const statements = chunk.map((r) => ({
      sql: upsertSql,
      args: [
        r.regionName,
        r.locationName,
        r.dataDate,
        r.startTime,
        r.endTime,
        r.minT,
        r.maxT,
        r.avgT,
        r.weather,
        r.weatherCode,
        r.precipitationProbability,
        r.comfort,
        r.fetchedAt,
      ],
    }));

    await db.batch(statements, "write");
  }

  return { inserted: records.length, total: records.length };
}

/**
 * Query distinct regions available in the database
 */
export async function getRegions(): Promise<string[]> {
  await ensureDb();
  const db = getDbClient();
  const res = await db.execute("SELECT DISTINCT regionName FROM TemperatureForecasts ORDER BY regionName ASC");
  return res.rows.map((row) => String(row.regionName));
}

/**
 * Query distinct locations for a specific region
 */
export async function getLocationsByRegion(regionName: string): Promise<string[]> {
  await ensureDb();
  const db = getDbClient();
  const res = await db.execute({
    sql: "SELECT DISTINCT locationName FROM TemperatureForecasts WHERE regionName = ? ORDER BY locationName ASC",
    args: [regionName],
  });
  return res.rows.map((row) => String(row.locationName));
}

/**
 * Query 7-day forecasts for a specific location
 */
export async function getForecastsByLocation(locationName: string): Promise<TemperatureForecast[]> {
  await ensureDb();
  const db = getDbClient();
  const res = await db.execute({
    sql: `
      SELECT id, regionName, locationName, dataDate, startTime, endTime,
             minT, maxT, avgT, weather, weatherCode,
             precipitationProbability, comfort, fetchedAt
      FROM TemperatureForecasts
      WHERE locationName = ?
      ORDER BY startTime ASC
    `,
    args: [locationName],
  });

  return res.rows.map(mapRowToForecast);
}

/**
 * Query all forecasts for a specific date across all cities
 */
export async function getForecastsByDate(dataDate: string): Promise<TemperatureForecast[]> {
  await ensureDb();
  const db = getDbClient();
  const res = await db.execute({
    sql: `
      SELECT id, regionName, locationName, dataDate, startTime, endTime,
             minT, maxT, avgT, weather, weatherCode,
             precipitationProbability, comfort, fetchedAt
      FROM TemperatureForecasts
      WHERE dataDate = ?
      ORDER BY locationName ASC, startTime ASC
    `,
    args: [dataDate],
  });

  return res.rows.map(mapRowToForecast);
}

/**
 * Query aggregated city forecasts for GIS map and summary cards for a given date
 */
export async function getCityForecastSummariesByDate(dataDate: string): Promise<CityForecastSummary[]> {
  await ensureDb();
  const db = getDbClient();

  const res = await db.execute({
    sql: `
      SELECT id, regionName, locationName, dataDate, startTime, endTime,
             minT, maxT, avgT, weather, weatherCode,
             precipitationProbability, comfort, fetchedAt
      FROM TemperatureForecasts
      WHERE dataDate = ?
      ORDER BY locationName ASC, startTime ASC
    `,
    args: [dataDate],
  });

  const forecasts = res.rows.map(mapRowToForecast);
  const cityMap = new Map<string, TemperatureForecast[]>();

  for (const f of forecasts) {
    if (!cityMap.has(f.locationName)) {
      cityMap.set(f.locationName, []);
    }
    cityMap.get(f.locationName)!.push(f);
  }

  const summaries: CityForecastSummary[] = [];

  for (const [locationName, slots] of cityMap.entries()) {
    const coords = CITY_COORDINATES[locationName] || { lat: 23.8, lng: 121.0 };
    const regionName = slots[0]?.regionName || getRegionByCity(locationName);

    // Calculate aggregated minT, maxT, avgT
    let minT: number | null = null;
    let maxT: number | null = null;
    let totalAvg = 0;
    let avgCount = 0;
    let maxPop: number | null = null;

    for (const s of slots) {
      if (s.minT !== null) {
        minT = minT === null ? s.minT : Math.min(minT, s.minT);
      }
      if (s.maxT !== null) {
        maxT = maxT === null ? s.maxT : Math.max(maxT, s.maxT);
      }
      if (s.avgT !== null) {
        totalAvg += s.avgT;
        avgCount++;
      }
      if (s.precipitationProbability !== null) {
        maxPop = maxPop === null ? s.precipitationProbability : Math.max(maxPop, s.precipitationProbability);
      }
    }

    const avgT = avgCount > 0 ? Math.round((totalAvg / avgCount) * 10) / 10 : (minT !== null && maxT !== null ? Math.round(((minT + maxT) / 2) * 10) / 10 : null);
    const primarySlot = slots.find((s) => s.startTime.includes("06:00") || s.startTime.includes("12:00")) || slots[0];

    summaries.push({
      locationName,
      regionName,
      dataDate,
      minT,
      maxT,
      avgT,
      weather: primarySlot?.weather || "多雲",
      weatherCode: primarySlot?.weatherCode || "1",
      precipitationProbability: maxPop,
      comfort: primarySlot?.comfort || "舒適",
      lat: coords.lat,
      lng: coords.lng,
      timeSlots: slots,
    });
  }

  return summaries;
}

/**
 * Get distinct dates available in the database
 */
export async function getAvailableDates(): Promise<string[]> {
  await ensureDb();
  const db = getDbClient();
  const res = await db.execute("SELECT DISTINCT dataDate FROM TemperatureForecasts ORDER BY dataDate ASC");
  return res.rows.map((r) => String(r.dataDate));
}

/**
 * Get latest update timestamp and total record count
 */
export async function getLastUpdatedInfo(): Promise<{ lastUpdatedAt: string | null; totalRecords: number }> {
  await ensureDb();
  const db = getDbClient();
  const countRes = await db.execute("SELECT COUNT(*) as total, MAX(fetchedAt) as latest FROM TemperatureForecasts");
  const row = countRes.rows[0];
  return {
    totalRecords: Number(row?.total || 0),
    lastUpdatedAt: row?.latest ? String(row.latest) : null,
  };
}

function mapRowToForecast(row: any): TemperatureForecast {
  return {
    id: Number(row.id),
    regionName: String(row.regionName),
    locationName: String(row.locationName),
    dataDate: String(row.dataDate),
    startTime: String(row.startTime),
    endTime: String(row.endTime),
    minT: row.minT !== null && row.minT !== undefined ? Number(row.minT) : null,
    maxT: row.maxT !== null && row.maxT !== undefined ? Number(row.maxT) : null,
    avgT: row.avgT !== null && row.avgT !== undefined ? Number(row.avgT) : null,
    weather: String(row.weather || ""),
    weatherCode: String(row.weatherCode || ""),
    precipitationProbability:
      row.precipitationProbability !== null && row.precipitationProbability !== undefined
        ? Number(row.precipitationProbability)
        : null,
    comfort: String(row.comfort || ""),
    fetchedAt: String(row.fetchedAt || ""),
  };
}
