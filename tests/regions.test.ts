import { describe, it, expect } from "vitest";
import {
  ALL_22_CITIES,
  TAIWAN_REGIONS,
  getRegionByCity,
  normalizeCityName,
  isValidTaiwanCity,
} from "@/lib/regions";

describe("Taiwan Regions & 22 Cities Mapping", () => {
  it("should contain exactly 22 recognized counties/cities in Taiwan", () => {
    expect(ALL_22_CITIES).toHaveLength(22);
    expect(ALL_22_CITIES).toContain("臺北市");
    expect(ALL_22_CITIES).toContain("臺中市");
    expect(ALL_22_CITIES).toContain("臺南市");
    expect(ALL_22_CITIES).toContain("高雄市");
    expect(ALL_22_CITIES).toContain("宜蘭縣");
    expect(ALL_22_CITIES).toContain("花蓮縣");
    expect(ALL_22_CITIES).toContain("臺東縣");
    expect(ALL_22_CITIES).toContain("澎湖縣");
    expect(ALL_22_CITIES).toContain("金門縣");
    expect(ALL_22_CITIES).toContain("連江縣");
  });

  it("should normalize '台北市' -> '臺北市' to follow CWA standard", () => {
    expect(normalizeCityName("台北市")).toBe("臺北市");
    expect(normalizeCityName("台中市")).toBe("臺中市");
    expect(normalizeCityName("台南市")).toBe("臺南市");
    expect(normalizeCityName("台東縣")).toBe("臺東縣");
    expect(normalizeCityName("新北市")).toBe("新北市");
  });

  it("should map cities to the correct region", () => {
    expect(getRegionByCity("臺北市")).toBe("北部地區");
    expect(getRegionByCity("臺中市")).toBe("中部地區");
    expect(getRegionByCity("高雄市")).toBe("南部地區");
    expect(getRegionByCity("宜蘭縣")).toBe("東北部地區");
    expect(getRegionByCity("花蓮縣")).toBe("東部地區");
    expect(getRegionByCity("臺東縣")).toBe("東南部地區");
    expect(getRegionByCity("澎湖縣")).toBe("離島地區");
  });

  it("should validate legitimate Taiwan cities and reject invalid names", () => {
    expect(isValidTaiwanCity("臺中市")).toBe(true);
    expect(isValidTaiwanCity("台中市")).toBe(true);
    expect(isValidTaiwanCity("東京")).toBe(false);
    expect(isValidTaiwanCity("紐約")).toBe(false);
    expect(isValidTaiwanCity("")).toBe(false);
  });
});
