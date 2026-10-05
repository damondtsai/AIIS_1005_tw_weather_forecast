import { getDbClient } from "./client";

export async function initializeDatabase(): Promise<void> {
  const db = getDbClient();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS TemperatureForecasts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      regionName TEXT NOT NULL,
      locationName TEXT NOT NULL,
      dataDate TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      minT REAL,
      maxT REAL,
      avgT REAL,
      weather TEXT,
      weatherCode TEXT,
      precipitationProbability REAL,
      comfort TEXT,
      fetchedAt TEXT NOT NULL
    );
  `);

  await db.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_temp_forecast_unique 
    ON TemperatureForecasts (locationName, dataDate, startTime, endTime);
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_temp_forecast_query 
    ON TemperatureForecasts (regionName, locationName, dataDate);
  `);
}
