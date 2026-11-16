import fs from "fs";
import { validateSiteConfig } from "../web/lib/config/siteConfigSchema.ts";

const paths = [
  "./backend/toursApi/seed/gujjutours.siteConfig.json",
  "./backend/toursApi/seed/tripgoasia.siteConfig.json",
  "./backend/toursApi/seed/technoheaven.siteConfig.json",
  "./tests/fixtures/gujjutours.config.json"
];

for (const p of paths) {
  if (fs.existsSync(p)) {
    console.log(`\nTesting: ${p}`);
    const raw = JSON.parse(fs.readFileSync(p, "utf8"));
    const res = validateSiteConfig(raw);
    console.log("IsValid:", res.isValid, "Issues count:", res.errors.length);
    if (res.errors.length > 0) {
      console.log("Issues:", JSON.stringify(res.errors, null, 2));
    }
  }
}

