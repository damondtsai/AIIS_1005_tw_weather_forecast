import { describe, it, expect } from "vitest";
import { normalizeCwaData, formatToTaipeiDate } from "@/lib/cwa/normalize";
import { CWAResponse } from "@/lib/cwa/schema";

describe("CWA Weather Normalizer", () => {
  it("should format timestamps to Asia/Taipei YYYY-MM-DD", () => {
    const d1 = formatToTaipeiDate("2026-10-05 06:00:00");
    expect(d1).toBe("2026-10-05");

    const d2 = formatToTaipeiDate("2026-10-05T18:00:00+08:00");
    expect(d2).toBe("2026-10-05");
  });

  it("should parse standard CWA JSON and compute avgT safely", () => {
    const mockJson: CWAResponse = {
      records: {
        location: [
          {
            locationName: "臺中市",
            weatherElement: [
              {
                elementName: "Wx",
                time: [
                  {
                    startTime: "2026-10-05 06:00:00",
                    endTime: "2026-10-05 18:00:00",
                    parameter: { parameterName: "晴時多雲", parameterValue: "2" },
                  },
                ],
              },
              {
                elementName: "MinT",
                time: [
                  {
                    startTime: "2026-10-05 06:00:00",
                    endTime: "2026-10-05 18:00:00",
                    parameter: { parameterName: "24", parameterUnit: "C" },
                  },
                ],
              },
              {
                elementName: "MaxT",
                time: [
                  {
                    startTime: "2026-10-05 06:00:00",
                    endTime: "2026-10-05 18:00:00",
                    parameter: { parameterName: "32", parameterUnit: "C" },
                  },
                ],
              },
              {
                elementName: "PoP",
                time: [
                  {
                    startTime: "2026-10-05 06:00:00",
                    endTime: "2026-10-05 18:00:00",
                    parameter: { parameterName: "10", parameterUnit: "百分比" },
                  },
                ],
              },
            ],
          },
        ],
      },
    };

    const results = normalizeCwaData(mockJson);
    expect(results).toHaveLength(1);

    const r = results[0];
    expect(r.locationName).toBe("臺中市");
    expect(r.regionName).toBe("中部地區");
    expect(r.dataDate).toBe("2026-10-05");
    expect(r.minT).toBe(24);
    expect(r.maxT).toBe(32);
    expect(r.avgT).toBe(28); // (24 + 32) / 2
    expect(r.weather).toBe("晴時多雲");
    expect(r.precipitationProbability).toBe(10);
  });

  it("should handle missing weatherElement or invalid numbers without crashing", () => {
    const degradedJson: CWAResponse = {
      records: {
        location: [
          {
            locationName: "基隆市",
            weatherElement: [
              {
                elementName: "Wx",
                time: [
                  {
                    startTime: "2026-10-05 06:00:00",
                    endTime: "2026-10-05 18:00:00",
                    parameter: { parameterName: "陰天" },
                  },
                ],
              },
              {
                elementName: "MinT",
                time: [
                  {
                    startTime: "2026-10-05 06:00:00",
                    endTime: "2026-10-05 18:00:00",
                    parameter: { parameterName: "invalid-number" },
                  },
                ],
              },
            ],
          },
        ],
      },
    };

    const results = normalizeCwaData(degradedJson);
    expect(results).toHaveLength(1);
    expect(results[0].locationName).toBe("基隆市");
    expect(results[0].minT).toBeNull();
    expect(results[0].maxT).toBeNull();
    expect(results[0].avgT).toBeNull();
    expect(results[0].precipitationProbability).toBeNull();
  });
});
