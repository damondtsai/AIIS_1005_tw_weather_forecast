import { createClient, Client } from "@libsql/client";
import path from "path";
import os from "os";

let clientInstance: Client | null = null;

export function getDbClient(): Client {
  if (clientInstance) {
    return clientInstance;
  }

  let dbUrl = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  // On Vercel / serverless environments without Turso, fallback to /tmp directory for writable SQLite
  if (!dbUrl || dbUrl === "file:weather.db") {
    if (process.env.VERCEL || process.env.NODE_ENV === "production") {
      const tmpPath = path.join(os.tmpdir(), "weather.db");
      dbUrl = `file:${tmpPath}`;
    } else {
      dbUrl = "file:weather.db";
    }
  }

  clientInstance = createClient({
    url: dbUrl,
    authToken: authToken || undefined,
  });

  return clientInstance;
}
