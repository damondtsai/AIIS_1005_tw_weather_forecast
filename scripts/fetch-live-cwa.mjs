import fs from "fs";
import path from "path";
import https from "https";

const API_KEY = process.env.CWA_API_KEY || "CWA-55FDA6D3-A43C-4AE0-BB30-E62D5F684FB2";
const DATASET_ID = process.env.CWA_DATASET_ID || "F-D0047-091";
const CWA_URL = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/${DATASET_ID}?Authorization=${API_KEY}&format=JSON`;

console.log(`Fetching latest live forecast from CWA Open Data API (${DATASET_ID})...`);

https.get(CWA_URL, (res) => {
  if (res.statusCode !== 200) {
    console.warn(`CWA API returned HTTP status ${res.statusCode}. Keeping existing cached dataset.`);
    return;
  }

  let rawData = "";
  res.on("data", (chunk) => (rawData += chunk));
  res.on("end", () => {
    try {
      const json = JSON.parse(rawData);
      if (json.success === "true" || json.records) {
        const dest1 = path.resolve("./src/data/sample_cwa.json");
        const dest2 = path.resolve("./public/mock/cwa-weather.json");
        const dest3 = path.resolve("./data/sample_cwa.json");

        fs.writeFileSync(dest1, JSON.stringify(json, null, 2), "utf8");
        fs.writeFileSync(dest2, JSON.stringify(json, null, 2), "utf8");
        fs.writeFileSync(dest3, JSON.stringify(json, null, 2), "utf8");

        console.log(`✅ Successfully updated live weather dataset with 22 cities 7-day forecast from CWA API!`);
      } else {
        console.warn("Invalid CWA JSON response, keeping cached version.");
      }
    } catch (err) {
      console.error("Error parsing CWA JSON:", err);
    }
  });
}).on("error", (err) => {
  console.warn("Network error fetching CWA data:", err.message);
});
