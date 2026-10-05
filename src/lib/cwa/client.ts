import { CWAResponseSchema, CWAResponse } from "./schema";
import sampleJsonData from "@/data/sample_cwa.json";

const CWA_BASE_URL = "https://opendata.cwa.gov.tw/api/v1/rest/datastore/";
const DEFAULT_DATASET_ID = "F-D0047-091";

export interface FetchCwaResult {
  data: CWAResponse;
  isFallback: boolean;
  datasetId: string;
  source: string;
}

/**
 * Fetch raw weather data from Central Weather Administration (CWA) Open Data API.
 * Server-side only. API key is never exposed to the client or log files.
 */
export async function fetchCwaWeather(customApiKey?: string): Promise<FetchCwaResult> {
  const apiKey = customApiKey || process.env.CWA_API_KEY;
  const datasetId = process.env.CWA_DATASET_ID || DEFAULT_DATASET_ID;

  if (apiKey && apiKey.trim() !== "" && apiKey !== "your_cwa_api_key_here") {
    try {
      const endpoint = `${CWA_BASE_URL}${datasetId}`;
      const url = new URL(endpoint);
      url.searchParams.set("Authorization", apiKey.trim());
      url.searchParams.set("format", "JSON");

      const res = await fetch(url.toString(), {
        cache: "no-store",
        signal: AbortSignal.timeout(10_000), // 10s timeout
      });

      if (res.ok) {
        const rawJson = await res.json();
        const parsed = CWAResponseSchema.parse(rawJson);
        return {
          data: parsed,
          isFallback: false,
          datasetId,
          source: `CWA Open Data API (${datasetId})`,
        };
      } else {
        console.warn(`[CWA Client] CWA API returned status ${res.status}. Falling back to sample dataset.`);
      }
    } catch (error) {
      console.warn("[CWA Client] Network or parsing error when contacting CWA API, falling back:", error instanceof Error ? error.message : "Unknown error");
    }
  }

  // Graceful fallback to bundled mock JSON
  try {
    const parsed = CWAResponseSchema.parse(sampleJsonData);
    return {
      data: parsed,
      isFallback: true,
      datasetId: "bundled-mock-data",
      source: "本地離線預報資料集 (Local Mock Data)",
    };
  } catch (err) {
    console.error("[CWA Client] Failed to parse local mock dataset:", err);
    throw new Error("無法取得中央氣象署資料，且本地預設資料格式錯誤。");
  }
}
