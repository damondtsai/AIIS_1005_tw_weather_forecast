import { CWAResponse, CWALocation, CWATime } from "./schema";
import { TemperatureForecast } from "../types";
import { getRegionByCity, normalizeCityName } from "../regions";

/**
 * Extracts a text or numeric value from a CWATime element parameter or elementValue
 */
function extractValue(timeObj: CWATime | undefined): { name: string; value: string; unit?: string } {
  if (!timeObj) return { name: "", value: "" };

  if (timeObj.parameter) {
    return {
      name: timeObj.parameter.parameterName || "",
      value: timeObj.parameter.parameterValue || timeObj.parameter.parameterName || "",
      unit: timeObj.parameter.parameterUnit,
    };
  }

  if (timeObj.elementValue && timeObj.elementValue.length > 0) {
    const first = timeObj.elementValue[0];
    return {
      name: first.value || "",
      value: first.value || "",
      unit: first.measures,
    };
  }

  return { name: "", value: "" };
}

/**
 * Converts a datetime string to YYYY-MM-DD in Asia/Taipei timezone
 */
export function formatToTaipeiDate(dateStr: string): string {
  try {
    const d = new Date(dateStr.replace(" ", "T"));
    if (isNaN(d.getTime())) {
      // Fallback: match YYYY-MM-DD pattern directly
      const match = dateStr.match(/\d{4}-\d{2}-\d{2}/);
      return match ? match[0] : dateStr.slice(0, 10);
    }
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(d); // Returns YYYY-MM-DD
  } catch {
    const match = dateStr.match(/\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : dateStr.slice(0, 10);
  }
}

/**
 * Normalizes any CWA JSON structure into flat TemperatureForecast records
 */
export function normalizeCwaData(cwaData: CWAResponse, fetchedAt?: string): TemperatureForecast[] {
  const fetchTime = fetchedAt || new Date().toISOString();
  const allLocations: CWALocation[] = [];

  // 1. Extract location array from records.location or records.locations
  if (cwaData.records.location && Array.isArray(cwaData.records.location)) {
    allLocations.push(...cwaData.records.location);
  }

  if (cwaData.records.locations) {
    if (Array.isArray(cwaData.records.locations)) {
      for (const locWrap of cwaData.records.locations) {
        if (locWrap.location && Array.isArray(locWrap.location)) {
          allLocations.push(...locWrap.location);
        }
      }
    } else if (cwaData.records.locations.location && Array.isArray(cwaData.records.locations.location)) {
      allLocations.push(...cwaData.records.locations.location);
    }
  }

  const results: TemperatureForecast[] = [];

  for (const loc of allLocations) {
    const rawLocName = loc.locationName;
    const locationName = normalizeCityName(rawLocName);
    const regionName = getRegionByCity(locationName);

    // Build map of weather elements: element name -> Array of times
    const elementMap = new Map<string, CWATime[]>();
    for (const el of loc.weatherElement || []) {
      const elName = el.elementName;
      elementMap.set(elName, el.time || []);
    }

    // Identify available elements (accommodating different dataset element names)
    const wxTimes = elementMap.get("Wx") || elementMap.get("Weather") || [];
    const minTTimes = elementMap.get("MinT") || elementMap.get("MinTemperature") || [];
    const maxTTimes = elementMap.get("MaxT") || elementMap.get("MaxTemperature") || [];
    const popTimes = elementMap.get("PoP") || elementMap.get("PoP12h") || elementMap.get("ProbabilityOfPrecipitation") || [];
    const ciTimes = elementMap.get("CI") || elementMap.get("Comfort") || [];

    // Collect all unique time intervals (startTime + endTime)
    const intervalMap = new Map<
      string,
      {
        startTime: string;
        endTime: string;
        wx?: CWATime;
        minT?: CWATime;
        maxT?: CWATime;
        pop?: CWATime;
        ci?: CWATime;
      }
    >();

    const registerTimes = (times: CWATime[], keyName: "wx" | "minT" | "maxT" | "pop" | "ci") => {
      for (const t of times) {
        const start = t.startTime || t.dataTime || "";
        const end = t.endTime || t.startTime || t.dataTime || "";
        if (!start) continue;

        const timeKey = `${start}_${end}`;
        if (!intervalMap.has(timeKey)) {
          intervalMap.set(timeKey, { startTime: start, endTime: end });
        }
        intervalMap.get(timeKey)![keyName] = t;
      }
    };

    registerTimes(wxTimes, "wx");
    registerTimes(minTTimes, "minT");
    registerTimes(maxTTimes, "maxT");
    registerTimes(popTimes, "pop");
    registerTimes(ciTimes, "ci");

    // If no exact time key match (e.g. MinT/MaxT have 12h slots while PoP is 24h),
    // we also match overlapping time slots
    const intervals = Array.from(intervalMap.values()).sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    for (const item of intervals) {
      const dataDate = formatToTaipeiDate(item.startTime);

      // Extract Wx
      const wxVal = extractValue(item.wx);
      const weather = wxVal.name || "多雲";
      const weatherCode = wxVal.value || "1";

      // Extract MinT
      let minT: number | null = null;
      const minVal = extractValue(item.minT);
      if (minVal.name) {
        const parsed = parseFloat(minVal.name);
        if (!isNaN(parsed)) minT = parsed;
      }

      // Extract MaxT
      let maxT: number | null = null;
      const maxVal = extractValue(item.maxT);
      if (maxVal.name) {
        const parsed = parseFloat(maxVal.name);
        if (!isNaN(parsed)) maxT = parsed;
      }

      // Fallback: If item.minT / item.maxT are missing for this exact interval, check closest interval on the same date
      if (minT === null) {
        for (const mt of minTTimes) {
          if (formatToTaipeiDate(mt.startTime || "") === dataDate) {
            const v = parseFloat(extractValue(mt).name);
            if (!isNaN(v)) {
              minT = v;
              break;
            }
          }
        }
      }

      if (maxT === null) {
        for (const mt of maxTTimes) {
          if (formatToTaipeiDate(mt.startTime || "") === dataDate) {
            const v = parseFloat(extractValue(mt).name);
            if (!isNaN(v)) {
              maxT = v;
              break;
            }
          }
        }
      }

      // Calculate avgT safely
      let avgT: number | null = null;
      if (minT !== null && maxT !== null) {
        avgT = Math.round(((minT + maxT) / 2) * 10) / 10;
      } else if (minT !== null) {
        avgT = minT;
      } else if (maxT !== null) {
        avgT = maxT;
      }

      // Extract PoP
      let pop: number | null = null;
      const popVal = extractValue(item.pop);
      if (popVal.name) {
        const parsed = parseFloat(popVal.name);
        if (!isNaN(parsed)) pop = parsed;
      }

      // Extract CI
      const ciVal = extractValue(item.ci);
      const comfort = ciVal.name || (avgT && avgT > 28 ? "悶熱" : avgT && avgT < 18 ? "稍有寒意" : "舒適");

      results.push({
        regionName,
        locationName,
        dataDate,
        startTime: item.startTime,
        endTime: item.endTime,
        minT,
        maxT,
        avgT,
        weather,
        weatherCode,
        precipitationProbability: pop,
        comfort,
        fetchedAt: fetchTime,
      });
    }
  }

  return results;
}
