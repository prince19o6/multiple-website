#!/usr/bin/env node
/**
 * scripts/check-api.js
 *
 * Standalone API health check script for the web application.
 * Calls the config and tours endpoints for the chosen website and prints
 * URL, status, response time, brand name, and item count.
 *
 * Usage:
 *   node scripts/check-api.js
 *   npm run check:api
 *   npm run check:api -- --site=tripgoasia
 *   npm run check:api -- --site=technoheaven
 */

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..");

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");
  const result = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      result[key] = val;
    }
  }
  return result;
}

const BRAND_CONFIGS = {
  gujjutours: {
    id: "gujjutours",
    name: "Gujju Tours",
    hostname: "www.gujjutours.com",
    apiUrl: "https://stagingapi.gujjutours.com",
  },
  tripgoasia: {
    id: "tripgoasia",
    name: "TripGo Asia",
    hostname: "www.tripgoasia.com",
    apiUrl: "https://stagingapi.tripgoasia.com",
  },
  technoheaven: {
    id: "technoheaven",
    name: "Technoheaven",
    hostname: "stagingb2b.technoheaven.com",
    apiUrl: "https://stagingapi.technoheaven.com",
  },
};

// Parse command line arguments
const args = process.argv.slice(2);
let siteFlag = "";
for (const arg of args) {
  if (arg.startsWith("--site=")) {
    siteFlag = arg.split("=")[1].trim().toLowerCase();
  }
}

const envLocal = readEnvFile(path.join(PROJECT_ROOT, ".env.local"));

let siteId = (siteFlag || process.env.NEXT_PUBLIC_SITE_ID || envLocal.NEXT_PUBLIC_SITE_ID || "gujjutours")
  .toLowerCase()
  .trim();

if (siteId === "website1") siteId = "gujjutours";
if (siteId === "website2") siteId = "tripgoasia";
if (siteId === "website3") siteId = "technoheaven";

const brand = BRAND_CONFIGS[siteId] || BRAND_CONFIGS.gujjutours;

const hostname = siteFlag
  ? brand.hostname
  : (process.env.NEXT_PUBLIC_SITE_HOSTNAME ||
     envLocal.NEXT_PUBLIC_SITE_HOSTNAME ||
     brand.hostname);

const apiUrl = siteFlag
  ? brand.apiUrl
  : (process.env.NEXT_PUBLIC_API_URL ||
     envLocal.NEXT_PUBLIC_API_URL ||
     brand.apiUrl);

const fallbackBackendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  envLocal.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5000";

function fetchUrl(urlStr, headers = {}, timeoutMs = 8000) {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(urlStr);
      const client = parsedUrl.protocol === "https:" ? https : http;
      const start = Date.now();

      const reqOptions = {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
        path: `${parsedUrl.pathname}${parsedUrl.search}`,
        method: "GET",
        headers: {
          Accept: "application/json",
          ...headers,
        },
        timeout: timeoutMs,
      };

      const req = client.request(reqOptions, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          const latencyMs = Date.now() - start;
          let json = null;
          try {
            json = JSON.parse(body);
          } catch {
            // not json
          }
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            latencyMs,
            body,
            json,
          });
        });
      });

      req.on("timeout", () => {
        req.destroy();
        resolve({
          ok: false,
          status: 0,
          latencyMs: Date.now() - start,
          error: `Request timed out after ${timeoutMs}ms`,
        });
      });

      req.on("error", (err) => {
        resolve({
          ok: false,
          status: 0,
          latencyMs: Date.now() - start,
          error: err.message,
        });
      });

      req.end();
    } catch (err) {
      resolve({
        ok: false,
        status: 0,
        latencyMs: 0,
        error: err.message,
      });
    }
  });
}

async function runCheck() {
  console.log("================================================================");
  console.log("  API HEALTH & REACHABILITY VERIFICATION");
  console.log(`  Active Site:  ${brand.name} (${brand.id})`);
  console.log(`  Hostname:     ${hostname}`);
  console.log(`  API Base URL: ${apiUrl}`);
  console.log("================================================================\n");

  // 1. Check Config Endpoint
  const configUrl = `${apiUrl}/api/core/v1/config/${encodeURIComponent(hostname)}?lang=en`;
  console.log(`[1/2] Checking Config Endpoint...`);
  console.log(`  → GET ${configUrl}`);

  const configRes = await fetchUrl(configUrl, { "X-Website-Hostname": hostname }, 6000);

  let brandTitle = brand.name;
  if (configRes.ok && configRes.json) {
    brandTitle =
      configRes.json?.result?.website?.name ||
      configRes.json?.result?.website?.fullName ||
      brand.name;
    console.log(`  ✓ Status: ${configRes.status} OK (${configRes.latencyMs}ms)`);
    console.log(`  ✓ Resolved Brand Identity: "${brandTitle}"`);
  } else {
    console.log(`  ✕ Status: ${configRes.status || "FAILED"} (${configRes.latencyMs}ms)`);
    console.log(`  ✕ Error: ${configRes.error || configRes.body.slice(0, 160)}`);
  }

  console.log("");

  // 2. Check Tours Endpoint
  let toursUrl = `${apiUrl}/api/tours`;
  console.log(`[2/2] Checking Tours Endpoint...`);
  console.log(`  → GET ${toursUrl}`);
  console.log(`  → Header: X-Website-Hostname: ${hostname}`);

  let toursRes = await fetchUrl(toursUrl, { "X-Website-Hostname": hostname }, 5000);
  let usedFallback = false;

  // If staging API returns 404 (because tours live in the local/remote database), check fallback backend
  if (toursRes.status === 404 && fallbackBackendUrl && !apiUrl.includes(fallbackBackendUrl)) {
    console.log(`  ℹ️ Primary gateway returned 404 for /api/tours.`);
    console.log(`     Checking ASP.NET Core database backend: ${fallbackBackendUrl}/api/tours`);
    toursUrl = `${fallbackBackendUrl}/api/tours`;
    const fallbackRes = await fetchUrl(toursUrl, { "X-Website-Hostname": hostname }, 8000);
    if (fallbackRes.ok) {
      toursRes = fallbackRes;
      usedFallback = true;
    } else {
      console.log(`     Fallback probe status: ${fallbackRes.status}, error: ${fallbackRes.error}`);
    }
  }

  let itemCount = 0;
  let firstItemTitle = "";

  if (toursRes.ok && toursRes.json) {
    let list = [];
    if (Array.isArray(toursRes.json)) {
      list = toursRes.json;
    } else if (Array.isArray(toursRes.json.data)) {
      list = toursRes.json.data;
    } else if (Array.isArray(toursRes.json.result)) {
      list = toursRes.json.result;
    } else if (Array.isArray(toursRes.json.tours)) {
      list = toursRes.json.tours;
    }
    itemCount = list.length;
    if (list.length > 0) {
      firstItemTitle =
        list[0].name || list[0].Name || list[0].title || "Unknown Tour";
    }
    console.log(`  ✓ Status: ${toursRes.status} OK (${toursRes.latencyMs}ms)${usedFallback ? " [via backend]" : ""}`);
    console.log(`  ✓ Tours Item Count: ${itemCount}`);
    if (itemCount > 0) {
      console.log(`  ✓ First Tour: "${firstItemTitle}"`);
    }
  } else {
    console.log(`  ✕ Status: ${toursRes.status || "FAILED"} (${toursRes.latencyMs}ms)`);
    console.log(`  ✕ Error: ${toursRes.error || toursRes.body.slice(0, 160)}`);
  }

  console.log("\n----------------------------------------------------------------");
  console.log("  Summary:");
  console.log(`    Config:  ${configRes.ok ? "✓ PASS" : "✕ FAIL"} (${configRes.latencyMs}ms)`);
  console.log(`    Tours:   ${toursRes.ok ? "✓ PASS" : "✕ FAIL"} (${toursRes.latencyMs}ms, ${itemCount} items)`);
  console.log("----------------------------------------------------------------\n");

  if (configRes.ok && toursRes.ok) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runCheck().catch((err) => {
  console.error("Fatal check error:", err);
  process.exit(1);
});
