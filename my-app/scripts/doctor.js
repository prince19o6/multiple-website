#!/usr/bin/env node
/**
 * scripts/doctor.js
 *
 * System diagnostic script for ToursApp Expo environment.
 * Checks:
 *  1. Node.js & npm runtime versions.
 *  2. Expo SDK consistency via `npx expo-doctor`.
 *  3. Network interfaces (Wi-Fi LAN IP vs virtual Hyper-V/WSL adapters).
 *  4. Port availability for Metro Bundler (8081) and Backend (5000).
 *  5. Direct API reachability to all 3 staging endpoints + local backend.
 *  6. Prints actionable troubleshooting tips.
 */

const os = require('os');
const net = require('net');
const http = require('http');
const https = require('https');
const { execSync } = require('child_process');

if (typeof globalThis.setImmediate === 'undefined') {
  globalThis.setImmediate = (fn, ...args) => setTimeout(fn, 0, ...args);
}

function checkPort(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => resolve(false))
      .once('listening', () => {
        tester.close(() => resolve(true));
      })
      .listen(port);
  });
}

function pingEndpoint(urlStr, timeoutMs = 6000) {
  return new Promise((resolve) => {
    try {
      const url = new URL(urlStr);
      const client = url.protocol === 'https:' ? https : http;
      const start = Date.now();

      const req = client.get(urlStr, { timeout: timeoutMs }, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            latencyMs: Date.now() - start,
          });
        });
      });

      req.on('timeout', () => {
        req.abort();
        resolve({ ok: false, error: 'Timed out' });
      });

      req.on('error', (e) => {
        resolve({ ok: false, error: e.message });
      });
    } catch (err) {
      resolve({ ok: false, error: err.message });
    }
  });
}

async function runDoctor() {
  console.log('================================================================');
  console.log('  🩺 TOURSAPP SYSTEM & API DOCTOR');
  console.log('================================================================\n');

  // 1. Runtime Versions
  console.log('[1/5] Checking Node.js and system runtime...');
  const nodeVer = process.version;
  console.log(`  ✓ Node.js version: ${nodeVer}`);
  const majorVer = parseInt(nodeVer.replace('v', '').split('.')[0], 10);
  if (majorVer < 18) {
    console.warn('  ⚠️ Node.js >= 18 is required. Please update Node.js.');
  }

  try {
    const npmVer = execSync('npm -v').toString().trim();
    console.log(`  ✓ npm version:     ${npmVer}`);
  } catch {
    console.warn('  ⚠️ Could not determine npm version.');
  }

  // 2. Network & LAN IP
  console.log('\n[2/5] Inspecting network interfaces & LAN detection...');
  const ifaces = os.networkInterfaces();
  let wifiIp = null;
  const virtualIps = [];

  for (const [name, list] of Object.entries(ifaces)) {
    if (!list) continue;
    const lower = name.toLowerCase();
    for (const iface of list) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (
          lower.includes('vethernet') ||
          lower.includes('wsl') ||
          lower.includes('virtual') ||
          lower.includes('docker')
        ) {
          virtualIps.push({ name, ip: iface.address });
        } else if (!wifiIp) {
          wifiIp = { name, ip: iface.address };
        }
      }
    }
  }

  if (wifiIp) {
    console.log(`  ✓ Physical LAN IP: ${wifiIp.ip} (${wifiIp.name})`);
  } else {
    console.warn('  ⚠️ No physical Wi-Fi/Ethernet IPv4 address found!');
  }

  if (virtualIps.length > 0) {
    console.log(`  ℹ️ Virtual adapters filtered out: ${virtualIps.map((v) => `${v.name} (${v.ip})`).join(', ')}`);
  }

  // 3. Port Availability
  console.log('\n[3/5] Checking port availability...');
  const port8081Avail = await checkPort(8081);
  if (port8081Avail) {
    console.log('  ✓ Port 8081 (Metro Bundler): Available');
  } else {
    console.log('  ⚠️ Port 8081 is currently IN USE. Launcher will auto-pick a free port.');
  }

  const port5000Avail = await checkPort(5000);
  if (!port5000Avail) {
    console.log('  ✓ Port 5000: ASP.NET Core backend is listening');
  } else {
    console.log('  ℹ️ Port 5000: Free (local backend is not currently running)');
  }

  // 4. API Reachability
  console.log('\n[4/5] Checking staging API endpoints reachability...');
  const endpoints = [
    {
      name: 'Gujju Tours Staging Config',
      url: 'https://stagingapi.gujjutours.com/api/core/v1/config/www.gujjutours.com?lang=en',
    },
    {
      name: 'TripGo Asia Staging Config',
      url: 'https://stagingapi.tripgoasia.com/api/core/v1/config/www.tripgoasia.com?lang=en',
    },
    {
      name: 'Technoheaven Staging Config',
      url: 'https://stagingapi.technoheaven.com/api/core/v1/config/stagingb2b.technoheaven.com?lang=en',
    },
    {
      name: 'Local Backend (port 5000)',
      url: 'http://localhost:5000/api/core/v1/config/www.gujjutours.com?lang=en',
    },
  ];

  for (const ep of endpoints) {
    // eslint-disable-next-line no-await-in-loop
    const res = await pingEndpoint(ep.url, 6000);
    if (res.ok) {
      console.log(`  ✓ ${ep.name.padEnd(30)} HTTP ${res.status} (${res.latencyMs}ms)`);
    } else {
      console.log(`  ✕ ${ep.name.padEnd(30)} ${res.status ? `HTTP ${res.status}` : res.error}`);
    }
  }

  // 5. Expo SDK Validation
  console.log('\n[5/5] Running Expo SDK validation (expo-doctor)...');
  try {
    execSync('npx expo-doctor', { stdio: 'inherit' });
  } catch {
    console.warn('  ⚠️ expo-doctor reported suggestions.');
  }

  // Troubleshooting Summary
  console.log('\n================================================================');
  console.log('  💡 COMMON TROUBLESHOOTING CHEATSHEET:');
  console.log('================================================================');
  console.log('  1. Phone cannot connect to Expo Metro bundler:');
  console.log('     • Ensure phone and PC are connected to the EXACT same Wi-Fi SSID.');
  console.log('     • If on a guest/college/office network that isolates devices, use:');
  console.log('       npm start -- --tunnel');
  console.log('  2. Windows Defender Firewall blocking LAN:');
  console.log('     • Set network profile to "Private" in Windows Settings.');
  console.log('     • Allow "Node.js JavaScript Runtime" through Windows Defender Firewall.');
  console.log('  3. Stale cache / white screen on reload:');
  console.log('     • Metro cache is automatically cleared every run via `expo start -c`.');
  console.log('  4. Switch site dynamically:');
  console.log('     • npm start -- --site=tripgoasia');
  console.log('     • npm start -- --site=technoheaven');
  console.log('  5. Run with local ASP.NET Core backend:');
  console.log('     • npm start -- --backend');
  console.log('================================================================\n');
}

runDoctor().catch((err) => {
  console.error('Doctor error:', err);
  process.exit(1);
});
