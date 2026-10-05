import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const apiDir = path.resolve("./src/app/api");
const apiBakDir = path.resolve("./src/app/_api_temp_disabled");

let moved = false;
try {
  if (fs.existsSync(apiDir)) {
    fs.renameSync(apiDir, apiBakDir);
    moved = true;
  }

  process.env.GITHUB_PAGES = "true";
  console.log("Building static export for GitHub Pages...");
  execSync("npx next build", { stdio: "inherit", env: process.env });
  console.log("GitHub Pages static export completed successfully in ./out directory!");
} catch (error) {
  console.error("Build failed:", error);
  process.exitCode = 1;
} finally {
  if (moved && fs.existsSync(apiBakDir)) {
    fs.renameSync(apiBakDir, apiDir);
  }
}
