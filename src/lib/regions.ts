export const TAIWAN_REGIONS: Record<string, string[]> = {
  北部地區: ["基隆市", "臺北市", "新北市", "桃園市", "新竹市", "新竹縣", "苗栗縣"],
  中部地區: ["臺中市", "彰化縣", "南投縣", "雲林縣", "嘉義市", "嘉義縣"],
  南部地區: ["臺南市", "高雄市", "屏東縣"],
  東北部地區: ["宜蘭縣"],
  東部地區: ["花蓮縣"],
  東南部地區: ["臺東縣"],
  離島地區: ["澎湖縣", "金門縣", "連江縣"],
};

export const ALL_REGIONS = Object.keys(TAIWAN_REGIONS);

export const ALL_22_CITIES = Object.values(TAIWAN_REGIONS).flat();

/**
 * Maps a location name to its corresponding region
 */
export function getRegionByCity(cityName: string): string {
  const normalized = normalizeCityName(cityName);
  for (const [region, cities] of Object.entries(TAIWAN_REGIONS)) {
    if (cities.includes(normalized)) {
      return region;
    }
  }
  return "北部地區";
}

/**
 * Standardize city name to CWA's "臺" format
 */
export function normalizeCityName(cityName: string): string {
  if (!cityName) return "";
  return cityName
    .trim()
    .replace(/^台北市$/, "臺北市")
    .replace(/^台中市$/, "臺中市")
    .replace(/^台南市$/, "臺南市")
    .replace(/^台東縣$/, "臺東縣");
}

/**
 * Verify if a city is in Taiwan's 22 recognized counties/cities
 */
export function isValidTaiwanCity(cityName: string): boolean {
  const normalized = normalizeCityName(cityName);
  return ALL_22_CITIES.includes(normalized);
}
