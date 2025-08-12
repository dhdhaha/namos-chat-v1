// src/lib/secrets-loader.ts
import fs from "fs";
import path from "path";

const p = path.join(process.cwd(), "secrets", "runtime.json");
if (fs.existsSync(p)) {
  const obj = JSON.parse(fs.readFileSync(p, "utf8"));
  for (const [k, v] of Object.entries(obj)) {
    if (!process.env[k]) process.env[k] = String(v);
  }
} else {
  console.warn("⚠️ secrets/runtime.json not found — skipping secrets load");
}