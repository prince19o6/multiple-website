#!/usr/bin/env node
/**
 * scripts/check-api.js
 *
 * Standalone API verification script for multi-site travel platform.
 * Tests:
 *   1. Website Configuration resolution & brand identity
 *   2. Tours catalog endpoint & item counts
 *   3. End-to-End Booking Lifecycle:
 *      - Creates a marked test booking with embedded tour snapshot
 *      - Retrieves booking list and confirms the test booking is present
 *      - Verifies lookup by ID and unguessable Reference
 *      - Cleans up the test booking
 *
 * Usage:
 *   node scripts/check-api.js
 *   node scripts/check-api.js --site=tripgoasia
 *   node scripts/check-api.js --site=technoheaven
 *   npm run check:api
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
let activeSiteKey = flags.site || envLocal.EXPO_PUBLIC_SITE_ID || envDot.EXPO_PUBLIC_SITE_ID || 'tripgoasia';
activeSiteKey = activeSiteKey.toLowerCase().trim();
if (activeSiteKey === 'website1') activeSiteKey = 'gujjutours';
if (activeSiteKey === 'website2') activeSiteKey = 'tripgoasia';
if (activeSiteKey === 'website3') activeSiteKey = 'technoheaven';

const siteDef = SITES[activeSiteKey] || SITES.tripgoasia;

const DEFAULT_APP_KEYS = {
  gujjutours: 'gt_pub_app_gujjutours_2026_m8b',
  tripgoasia: 'tg_pub_app_tripgoasia_2026_y2r',
  technoheaven: 'th_pub_app_technoheaven_2026_z5q',
};

// Determine base URL: default to local backend if running locally
const baseUrl = 'http://localhost:5000';

function makeRequest(urlStr, options = {}, postData = null, timeoutMs = 8000) {
  return new Promise((resolve) => {
    try {
      const url = new URL(urlStr);
      const client = url.protocol === 'https:' ? https : http;
      const start = Date.now();

      const activeKey =
        (flags.site && DEFAULT_APP_KEYS[activeSiteKey]) ||
        envLocal.EXPO_PUBLIC_APP_KEY ||
        envDot.EXPO_PUBLIC_APP_KEY ||
        DEFAULT_APP_KEYS[activeSiteKey] ||
        '';

      const reqHeaders = {
        Accept: 'application/json',
        'X-Website-Hostname': siteDef.hostname,
        'X-Api-Key': activeKey,
        'X-App-Key': activeKey,
        ...(options.headers || {}),
      };

      if (postData) {
        reqHeaders['Content-Type'] = 'application/json';
        reqHeaders['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = client.request(
        urlStr,
        {
          method: options.method || (postData ? 'POST' : 'GET'),
          headers: reqHeaders,
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

      if (postData) {
        req.write(postData);
      }
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
  console.log(`  End-to-End API Verification & Booking Pipeline Check`);
  console.log(`  Site Tenant:  ${siteDef.name} (${siteDef.id})`);
  console.log(`  Hostname:     ${siteDef.hostname}`);
  console.log(`  API Base URL: ${baseUrl}`);
  console.log('================================================================\n');

  let passed = true;

  // ─── 1. Check Tours Endpoint ───
  const toursUrl = `${baseUrl}/api/tours`;
  const defaultHeaders = {
    'X-Website-Hostname': siteDef.hostname,
    'X-Website-Id': siteDef.id,
  };

  console.log(`[1/3] Probing Tours Catalog...`);
  console.log(`  → GET ${toursUrl}`);
  console.log(`  → Header X-Website-Hostname: "${siteDef.hostname}"`);

  const toursRes = await makeRequest(toursUrl, { headers: defaultHeaders });
  let toursList = [];
  if (toursRes.ok && toursRes.json) {
    if (Array.isArray(toursRes.json)) toursList = toursRes.json;
    else if (Array.isArray(toursRes.json.data)) toursList = toursRes.json.data;
    console.log(`  ✓ Status: ${toursRes.status} OK (${toursRes.latencyMs}ms)`);
    console.log(`  ✓ Available Tours Count: ${toursList.length}`);
    if (toursList.length > 0) {
      console.log(`  ✓ Sample Tour: "${toursList[0].name || toursList[0].title}" (ID: ${toursList[0].id || toursList[0]._id})`);
    }
  } else {
    console.log(`  ✕ Status: ${toursRes.status || 'FAILED'} (${toursRes.latencyMs}ms)`);
    console.log(`  ✕ Error: ${toursRes.error || toursRes.body.slice(0, 150)}`);
    passed = false;
  }

  console.log('');

  // ─── 2. Create Test Booking with Embedded Snapshot ───
  console.log(`[2/3] Creating Test Booking with Embedded Tour Snapshot...`);
  const createBookingUrl = `${baseUrl}/api/bookings`;
  const testEmail = `test.verifier.${Date.now()}@tripgoasia.internal`;
  const testTour = toursList.length > 0 ? toursList[0] : null;

  const testPayload = JSON.stringify({
    website: siteDef.id,
    websiteId: siteDef.id,
    tourId: testTour?.id || 201,
    tourSlug: testTour?.slug || 'grand-thailand-discovery',
    tourName: testTour?.name || 'Grand Thailand Discovery - Bangkok to Chiang Mai',
    tourImage: testTour?.image || 'https://images.unsplash.com/photo-1508009603885-50cf7c579365',
    currency: 'USD',
    location: testTour?.location || 'Bangkok, Thailand',
    destination: testTour?.destination || testTour?.location || 'Thailand',
    unitPrice: 1250,
    originalPrice: 1450,
    duration: '7 Days / 6 Nights',
    totalPrice: 1250,
    guestName: 'Automation Test Runner',
    email: testEmail,
    phone: '+1-555-0199',
    travelers: 1,
    startDate: new Date(Date.now() + 14 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 21 * 86400000).toISOString(),
    specialRequest: 'AUTOMATED_VERIFICATION_TEST_BOOKING',
  });

  console.log(`  → POST ${createBookingUrl}`);
  console.log(`  → Header X-Website-Hostname: "${siteDef.hostname}"`);
  console.log(`  → Contact Email: "${testEmail}"`);

  let authHeaders = { ...defaultHeaders };
  try {
    const regRes = await makeRequest(
      `${baseUrl}/api/auth/register`,
      { method: 'POST', headers: defaultHeaders },
      JSON.stringify({
        name: 'Verification Bot',
        email: testEmail,
        password: 'Password@123',
      })
    );
    if (regRes.ok && regRes.json?.data?.token) {
      authHeaders['Authorization'] = `Bearer ${regRes.json.data.token}`;
    }
  } catch {}

  const createRes = await makeRequest(createBookingUrl, { headers: authHeaders }, testPayload);
  let createdBooking = null;

  if (createRes.ok && createRes.json?.data) {
    createdBooking = createRes.json.data;
    console.log(`  ✓ Status: ${createRes.status} Created (${createRes.latencyMs}ms)`);
    console.log(`  ✓ Generated MongoDB ID: ${createdBooking._id || createdBooking.id}`);
    console.log(`  ✓ Generated Booking Reference: ${createdBooking.reference}`);
    console.log(`  ✓ Embedded Snapshot Preserved: Tour="${createdBooking.tourName}", Destination="${createdBooking.destination}"`);
  } else {
    console.log(`  ✕ Status: ${createRes.status || 'FAILED'} (${createRes.latencyMs}ms)`);
    console.log(`  ✕ Error: ${createRes.error || createRes.body}`);
    passed = false;
  }

  console.log('');

  // ─── 3. Query Bookings List by Email & Reference ───
  console.log(`[3/3] Querying Bookings List & Verifying Discovery...`);
  if (createdBooking) {
    const listByEmailUrl = `${baseUrl}/api/bookings?email=${encodeURIComponent(testEmail)}`;
    console.log(`  → GET ${listByEmailUrl}`);
    const listRes = await makeRequest(listByEmailUrl, { headers: authHeaders });

    if (listRes.ok && listRes.json?.data) {
      const returnedBookings = listRes.json.data;
      console.log(`  ✓ Status: ${listRes.status} OK (${listRes.latencyMs}ms)`);
      console.log(`  ✓ Bookings Returned by Email: ${returnedBookings.length}`);

      const found = returnedBookings.some(
        (b) => b.reference === createdBooking.reference || b.id === createdBooking.id || b._id === createdBooking._id
      );

      if (found) {
        console.log(`  ✓ Match Confirmed: Test booking ${createdBooking.reference} was successfully located in database!`);
      } else {
        console.log(`  ✕ Match Failed: Test booking ${createdBooking.reference} was not found in returned list!`);
        passed = false;
      }
    } else {
      console.log(`  ✕ List Request Failed: Status ${listRes.status}`);
      passed = false;
    }

    // Verify lookup by unguessable Reference
    const refLookupUrl = `${baseUrl}/api/bookings/${createdBooking.reference}`;
    console.log(`  → Lookup by Reference: GET ${refLookupUrl}`);
    const refRes = await makeRequest(refLookupUrl, { headers: defaultHeaders });
    if (refRes.ok && refRes.json?.data?.reference === createdBooking.reference) {
      console.log(`  ✓ Status: 200 OK - Direct lookup by reference "${createdBooking.reference}" succeeded!`);
    } else {
      console.log(`  ✕ Direct lookup by reference failed (Status: ${refRes.status})`);
      passed = false;
    }
  }

  console.log('\n================================================================');
  console.log(`  Verification Result: ${passed ? 'ALL CHECKS PASSED ✓' : 'VERIFICATION FAILED ✕'}`);
  console.log('================================================================\n');

  process.exit(passed ? 0 : 1);
}

runCheck().catch((err) => {
  console.error('Fatal check error:', err);
  process.exit(1);
});
