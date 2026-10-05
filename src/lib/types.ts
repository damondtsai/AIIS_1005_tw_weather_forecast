export interface TemperatureForecast {
  id?: number;
  regionName: string;
  locationName: string;
  dataDate: string; // YYYY-MM-DD
  startTime: string; // ISO or YYYY-MM-DD HH:mm:ss
  endTime: string;
  minT: number | null;
  maxT: number | null;
  avgT: number | null;
  weather: string;
  weatherCode: string;
  precipitationProbability: number | null;
  comfort: string;
  fetchedAt: string;
}

export interface CityForecastSummary {
  locationName: string;
  regionName: string;
  dataDate: string;
  minT: number | null;
  maxT: number | null;
  avgT: number | null;
  weather: string;
  weatherCode: string;
  precipitationProbability: number | null;
  comfort: string;
  lat: number;
  lng: number;
  timeSlots: TemperatureForecast[];
}

export interface WeatherApiResponse {
  ok: boolean;
  data?: TemperatureForecast[];
  summary?: CityForecastSummary[];
  updatedAt?: string;
  isFallback?: boolean;
  error?: string;
}

export interface SyncApiResponse {
  ok: boolean;
  message: string;
  insertedCount?: number;
  updatedCount?: number;
  totalRecords?: number;
  fetchedAt?: string;
  isFallback?: boolean;
  error?: string;
}

export interface HealthApiResponse {
  ok: boolean;
  status: "healthy" | "degraded" | "unhealthy";
  database: "connected" | "disconnected";
  totalRecords: number;
  latestDataDate: string | null;
  lastUpdatedAt: string | null;
  timestamp: string;
  error?: string;
}

export interface RegionMapping {
  region: string;
  cities: string[];
}
