#!/usr/bin/env node
/**
 * scripts/check-api.js
 *
 * Standalone API health check script for multi-site travel platform.
 * Tests both the Configuration endpoint and the Tours endpoint for the chosen website.
 *
 * Usage:
 *   node scripts/check-api.js
 *   node scripts/check-api.js --site=tripgoasia
 *   node scripts/check-api.js --site=technoheaven
 *   node scripts/check-api.js --backend
 *   npm run check:api
 *   npm run check:api -- --site=tripgoasia
 *   npm run check:api -- --backend
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const result = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      result[key] = val;
    }
  }
  return result;
}

const envLocal = readEnvFile(path.join(PROJECT_ROOT, '.env.local'));
const envDot = readEnvFile(path.join(PROJECT_ROOT, '.env'));

const SITES = {
  gujjutours: {
    id: 'gujjutours',
    name: 'Gujju Tours',
    hostname: 'www.gujjutours.com',
    stagingApi: 'https://stagingapi.gujjutours.com',
  },
  website1: {
    id: 'gujjutours',
    name: 'Gujju Tours',
    hostname: 'www.gujjutours.com',
    stagingApi: 'https://stagingapi.gujjutours.com',
  },
  tripgoasia: {
    id: 'tripgoasia',
    name: 'TripGo Asia',
    hostname: 'www.tripgoasia.com',
    stagingApi: 'https://stagingapi.tripgoasia.com',
  },
  website2: {
    id: 'tripgoasia',
    name: 'TripGo Asia',
    hostname: 'www.tripgoasia.com',
    stagingApi: 'https://stagingapi.tripgoasia.com',
  },
  technoheaven: {
    id: 'technoheaven',
    name: 'Technoheaven',
    hostname: 'stagingb2b.technoheaven.com',
    stagingApi: 'https://stagingapi.technoheaven.com',
  },
  website3: {
    id: 'technoheaven',
    name: 'Technoheaven',
    hostname: 'stagingb2b.technoheaven.com',
    stagingApi: 'https://stagingapi.technoheaven.com',
  },
};

// Parse command line arguments
const args = process.argv.slice(2);
const flags = {
  site: '',
  backend: false,
};

for (const arg of args) {
  if (arg.startsWith('--site=')) {
    flags.site = arg.split('=')[1].trim().toLowerCase();
  } else if (arg === '--backend' || arg === '--local') {
    flags.backend = true;
  }
}

// Determine active site
let activeSiteKey = flags.site || envLocal.EXPO_PUBLIC_SITE_ID || envDot.EXPO_PUBLIC_SITE_ID || 'gujjutours';
activeSiteKey = activeSiteKey.toLowerCase().trim();
if (activeSiteKey === 'website1') activeSiteKey = 'gujjutours';
if (activeSiteKey === 'website2') activeSiteKey = 'tripgoasia';
if (activeSiteKey === 'website3') activeSiteKey = 'technoheaven';

const envSitePath = path.join(PROJECT_ROOT, `.env.${activeSiteKey}`);
const envSite = readEnvFile(envSitePath);

const siteDef = SITES[activeSiteKey] || SITES.gujjutours;

// Determine base URL
const useLocalBackend =
  flags.backend ||
  envLocal.EXPO_PUBLIC_USE_LOCAL_BACKEND === 'true' ||
  envSite.EXPO_PUBLIC_USE_LOCAL_BACKEND === 'true' ||
  envDot.EXPO_PUBLIC_USE_LOCAL_BACKEND === 'true';

let baseUrl = '';
if (useLocalBackend) {
  baseUrl = 'http://localhost:5000';
} else {
  const customApi =
    flags.site
      ? envSite.EXPO_PUBLIC_API_URL || envSite.EXPO_PUBLIC_CONFIG_API_URL || siteDef.stagingApi
      : envLocal.EXPO_PUBLIC_API_URL || envSite.EXPO_PUBLIC_API_URL || envDot.EXPO_PUBLIC_API_URL || siteDef.stagingApi;
  if (customApi && !customApi.includes(':5000') && !customApi.includes('localhost')) {
    baseUrl = customApi.replace(/\/+$/, '');
  } else {
    baseUrl = siteDef.stagingApi;
  }
}

function fetchUrl(urlStr, headers = {}, timeoutMs = 4000) {
  return new Promise((resolve) => {
    try {
      const url = new URL(urlStr);
      const client = url.protocol === 'https:' ? https : http;
      const start = Date.now();

      const req = client.request(
        urlStr,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            ...headers,
          },
          timeout: timeoutMs,
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            const latencyMs = Date.now() - start;
            let json = null;
            try {
              json = JSON.parse(body);
            } catch {
              // non-json
            }
            resolve({
              ok: res.statusCode >= 200 && res.statusCode < 300,
              status: res.statusCode,
              latencyMs,
              body,
              json,
            });
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        resolve({
          ok: false,
          status: 0,
          latencyMs: Date.now() - start,
          error: `Request timed out after ${timeoutMs}ms`,
        });
      });

      req.on('error', (err) => {
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
  console.log('================================================================');
  console.log(`  API Health & Reachability Verification`);
  console.log(`  Target Site:  ${siteDef.name} (${siteDef.id})`);
  console.log(`  Hostname:     ${siteDef.hostname}`);
  console.log(`  Base URL:     ${baseUrl} (${useLocalBackend ? 'Local Backend' : 'Cloud Staging'})`);
  console.log('================================================================\n');

  // ─── 1. Check Config Endpoint ───
  let configUrl = `${baseUrl}/api/core/v1/config/${siteDef.hostname}?lang=en`;
  console.log(`[1/2] Checking Config Endpoint...`);
  console.log(`  → GET ${configUrl}`);

  let configRes = await fetchUrl(configUrl, {}, 10000);

  // If local backend config fails/times out (e.g. Mongo is offline), probe staging gateway for config
  if (!configRes.ok && baseUrl.includes('localhost')) {
    const stagingConfigUrl = `${siteDef.stagingApi}/api/core/v1/config/${siteDef.hostname}?lang=en`;
    console.log(`  ℹ️ Local backend config timed out (MongoDB may be offline). Checking staging gateway:`);
    console.log(`  → GET ${stagingConfigUrl}`);
    const stagingRes = await fetchUrl(stagingConfigUrl, {}, 10000);
    if (stagingRes.ok) {
      configRes = stagingRes;
      configUrl = stagingConfigUrl;
      console.log(`  ✓ Status: ${stagingRes.status} OK (${stagingRes.latencyMs}ms) [Cloud Gateway Active]`);
    }
  }

  if (configRes.ok) {
    const brandName =
      configRes.json?.result?.website?.name ||
      configRes.json?.result?.theme?.searchbox ||
      siteDef.name;
    console.log(`  ✓ Status: ${configRes.status} OK (${configRes.latencyMs}ms)`);
    console.log(`  ✓ Brand Identity Resolved: "${brandName}"`);
  } else {
    console.log(`  ✕ Status: ${configRes.status || 'FAILED'} (${configRes.latencyMs}ms)`);
    console.log(`  ✕ Error: ${configRes.error || configRes.body.slice(0, 120)}`);
  }

  console.log('');

  // ─── 2. Check Tours Endpoint ───
  const toursUrl = `${baseUrl}/api/tours`;
  const toursHeaders = {
    'X-Website-Hostname': siteDef.hostname,
    'X-Website-Id': siteDef.id,
  };

  console.log(`[2/2] Checking Tours Endpoint...`);
  console.log(`  → GET ${toursUrl}`);
  console.log(`  → Headers: ${JSON.stringify(toursHeaders)}`);

  let toursRes = await fetchUrl(toursUrl, toursHeaders, 10000);

  // If staging API returns 404 (stagingapi.* only hosts config), probe the local backend fallback
  if (toursRes.status === 404 && baseUrl.includes('stagingapi.')) {
    const fallbackBackendUrl = 'http://localhost:5000/api/tours';
    console.log(`  ℹ️ Cloud staging gateway returned 404 for /api/tours (staging only hosts config).`);
    console.log(`     Checking ASP.NET Core database backend: ${fallbackBackendUrl}`);
    const fallbackRes = await fetchUrl(fallbackBackendUrl, toursHeaders, 8000);
    if (fallbackRes.ok) {
      toursRes = fallbackRes;
    }
  }

  let itemCount = 0;
  let firstItemTitle = '';

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
      firstItemTitle = list[0].name || list[0].Name || list[0].title || 'Unknown Title';
    }
    console.log(`  ✓ Status: ${toursRes.status} OK (${toursRes.latencyMs}ms)`);
    console.log(`  ✓ Tours Item Count: ${itemCount}`);
    if (itemCount > 0) {
      console.log(`  ✓ First Tour: "${firstItemTitle}"`);
    }
  } else {
    console.log(`  ✕ Status: ${toursRes.status || 'FAILED'} (${toursRes.latencyMs}ms)`);
    if (toursRes.status === 404) {
      console.log(`  ℹ️ Diagnosis: The endpoint returned HTTP 404.`);
      if (baseUrl.includes('stagingapi.')) {
        console.log(`     The cloud staging gateway (${baseUrl}) does not route /api/tours directly.`);
        console.log(`     To serve tours from the multi-site platform backend, start backend/toursApi and run:`);
        console.log(`       npm run check:api -- --backend`);
      }
    } else {
      console.log(`  ✕ Error: ${toursRes.error || toursRes.body.slice(0, 120)}`);
    }
  }

  console.log('\n----------------------------------------------------------------');
  console.log('  Summary:');
  console.log(`    Config:  ${configRes.ok ? '✓ PASS' : '✕ FAIL'} (${configRes.latencyMs}ms)`);
  console.log(`    Tours:   ${toursRes.ok ? '✓ PASS' : '✕ FAIL'} (${toursRes.latencyMs}ms, ${itemCount} items)`);
  console.log('----------------------------------------------------------------\n');

  if (configRes.ok && toursRes.ok) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runCheck().catch((err) => {
  console.error('Fatal check error:', err);
  process.exit(1);
});
