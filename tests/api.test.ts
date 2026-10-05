import { describe, it, expect } from "vitest";
import { GET as weatherGet } from "@/app/api/weather/route";
import { POST as syncPost } from "@/app/api/weather/sync/route";
import { GET as healthGet } from "@/app/api/health/route";
import { NextRequest } from "next/server";

describe("API Routes Tests", () => {
  it("GET /api/health should return system status", async () => {
    const res = await healthGet();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.database).toBe("connected");
  });

  it("GET /api/weather with valid location should return 200 and data", async () => {
    const req = new NextRequest("http://localhost:3000/api/weather?location=臺中市");
    const res = await weatherGet(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.selectedCity).toBe("臺中市");
    expect(Array.isArray(data.data)).toBe(true);
  });

  it("GET /api/weather with invalid city should return 400 with Chinese error message", async () => {
    const req = new NextRequest("http://localhost:3000/api/weather?location=火星市");
    const res = await weatherGet(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.error).toContain("無效的縣市名稱");
  });

  it("POST /api/weather/sync should reject unauthorized request when SYNC_SECRET is set", async () => {
    process.env.SYNC_SECRET = "test-secret-123";

    const req = new NextRequest("http://localhost:3000/api/weather/sync", {
      method: "POST",
      headers: {
        authorization: "Bearer wrong-secret",
      },
    });

    const res = await syncPost(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.ok).toBe(false);
    expect(data.error).toContain("未授權");

    delete process.env.SYNC_SECRET;
  });
});
