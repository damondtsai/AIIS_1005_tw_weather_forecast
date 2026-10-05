import { TemperatureForecast } from "../types";
import { getRegionByCity, normalizeCityName } from "../regions";

/**
 * Extracts value from any parameter or elementValue variant
 */
function extractValueFromTimeObj(timeObj: any): { name: string; value: string; unit?: string } {
  if (!timeObj) return { name: "", value: "" };

  // 1. Check parameter (F-C0032 format)
  if (timeObj.parameter) {
    return {
      name: timeObj.parameter.parameterName || "",
      value: timeObj.parameter.parameterValue || timeObj.parameter.parameterName || "",
      unit: timeObj.parameter.parameterUnit,
    };
  }

  // 2. Check elementValue (F-D0047 format)
  const elementVal = timeObj.elementValue || timeObj.ElementValue;
  if (Array.isArray(elementVal) && elementVal.length > 0) {
    const first = elementVal[0];
    const val =
      first.Weather ||
      first.MaxTemperature ||
      first.MinTemperature ||
      first.Temperature ||
      first.ProbabilityOfPrecipitation ||
      first.MaxComfortIndexDescription ||
      first.value ||
      "";
    const code = first.WeatherCode || first.value || val;
    return {
      name: String(val),
      value: String(code),
      unit: first.measures,
    };
  }

  return { name: "", value: "" };
}

/**
 * Converts datetime string to YYYY-MM-DD in Asia/Taipei timezone
 */
export function formatToTaipeiDate(dateStr: string): string {
  try {
    const d = new Date(dateStr.replace(" ", "T"));
    if (isNaN(d.getTime())) {
      const match = dateStr.match(/\d{4}-\d{2}-\d{2}/);
      return match ? match[0] : dateStr.slice(0, 10);
    }
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(d);
  } catch {
    const match = dateStr.match(/\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : dateStr.slice(0, 10);
  }
}

/**
 * Normalizes any CWA JSON structure (F-D0047-091, F-C0032-001, Mock data) into flat records
 */
export function normalizeCwaData(cwaData: any, fetchedAt?: string): TemperatureForecast[] {
  const fetchTime = fetchedAt || new Date().toISOString();
  const allLocations: any[] = [];

  const records = cwaData.records || cwaData.Records || {};

  // Extract locations from all possible CWA structures
  if (records.location && Array.isArray(records.location)) {
    allLocations.push(...records.location);
  } else if (records.Location && Array.isArray(records.Location)) {
    allLocations.push(...records.Location);
  }

  const locationsWrap = records.locations || records.Locations;
  if (locationsWrap) {
    if (Array.isArray(locationsWrap)) {
      for (const locWrap of locationsWrap) {
        const subLocs = locWrap.location || locWrap.Location;
        if (Array.isArray(subLocs)) {
          allLocations.push(...subLocs);
        }
      }
    } else {
      const subLocs = locationsWrap.location || locationsWrap.Location;
      if (Array.isArray(subLocs)) {
        allLocations.push(...subLocs);
      }
    }
  }

  const results: TemperatureForecast[] = [];

  for (const loc of allLocations) {
    const rawLocName = loc.locationName || loc.LocationName;
    if (!rawLocName) continue;

    const locationName = normalizeCityName(rawLocName);
    const regionName = getRegionByCity(locationName);

    // Weather Elements map
    const elementMap = new Map<string, any[]>();
    const weatherElements = loc.weatherElement || loc.WeatherElement || [];

    for (const el of weatherElements) {
      const elName = el.elementName || el.ElementName;
      const times = el.time || el.Time || [];
      if (elName) {
        elementMap.set(elName, times);
      }
    }

    // Identify available elements (Chinese names & English codes)
    const wxTimes =
      elementMap.get("天氣現象") ||
      elementMap.get("Wx") ||
      elementMap.get("Weather") ||
      [];
    const minTTimes =
      elementMap.get("最低溫度") ||
      elementMap.get("MinT") ||
      elementMap.get("MinTemperature") ||
      [];
    const maxTTimes =
      elementMap.get("最高溫度") ||
      elementMap.get("MaxT") ||
      elementMap.get("MaxTemperature") ||
      [];
    const avgTTimes =
      elementMap.get("平均溫度") ||
      elementMap.get("T") ||
      elementMap.get("Temperature") ||
      [];
    const popTimes =
      elementMap.get("12小時降雨機率") ||
      elementMap.get("PoP") ||
      elementMap.get("PoP12h") ||
      elementMap.get("ProbabilityOfPrecipitation") ||
      [];
    const ciTimes =
      elementMap.get("最大舒適度指數") ||
      elementMap.get("舒適度指數") ||
      elementMap.get("CI") ||
      elementMap.get("Comfort") ||
      [];

    // Collect all unique time intervals
    const intervalMap = new Map<
      string,
      {
        startTime: string;
        endTime: string;
        wx?: any;
        minT?: any;
        maxT?: any;
        avgT?: any;
        pop?: any;
        ci?: any;
      }
    >();

    const registerTimes = (times: any[], keyName: "wx" | "minT" | "maxT" | "avgT" | "pop" | "ci") => {
      for (const t of times) {
        const start = t.startTime || t.StartTime || t.dataTime || t.DataTime || "";
        const end = t.endTime || t.EndTime || t.startTime || t.StartTime || "";
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
    registerTimes(avgTTimes, "avgT");
    registerTimes(popTimes, "pop");
    registerTimes(ciTimes, "ci");

    const intervals = Array.from(intervalMap.values()).sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    for (const item of intervals) {
      const dataDate = formatToTaipeiDate(item.startTime);

      // Extract Wx
      const wxVal = extractValueFromTimeObj(item.wx);
      const weather = wxVal.name || "多雲";
      const weatherCode = wxVal.value || "1";

      // Extract MinT
      let minT: number | null = null;
      const minVal = extractValueFromTimeObj(item.minT);
      if (minVal.name) {
        const parsed = parseFloat(minVal.name);
        if (!isNaN(parsed)) minT = parsed;
      }

      // Extract MaxT
      let maxT: number | null = null;
      const maxVal = extractValueFromTimeObj(item.maxT);
      if (maxVal.name) {
        const parsed = parseFloat(maxVal.name);
        if (!isNaN(parsed)) maxT = parsed;
      }

      // Extract or calculate AvgT
      let avgT: number | null = null;
      const avgVal = extractValueFromTimeObj(item.avgT);
      if (avgVal.name) {
        const parsed = parseFloat(avgVal.name);
        if (!isNaN(parsed)) avgT = parsed;
      }

      if (avgT === null) {
        if (minT !== null && maxT !== null) {
          avgT = Math.round(((minT + maxT) / 2) * 10) / 10;
        } else if (minT !== null) {
          avgT = minT;
        } else if (maxT !== null) {
          avgT = maxT;
        }
      }

      // Extract PoP
      let pop: number | null = null;
      const popVal = extractValueFromTimeObj(item.pop);
      if (popVal.name && popVal.name !== " ") {
        const parsed = parseFloat(popVal.name);
        if (!isNaN(parsed)) pop = parsed;
      }

      // Extract CI
      const ciVal = extractValueFromTimeObj(item.ci);
      const comfort =
        ciVal.name || (avgT && avgT > 28 ? "悶熱" : avgT && avgT < 18 ? "稍有寒意" : "舒適");

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
