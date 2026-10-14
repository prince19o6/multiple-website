#!/usr/bin/env node
/**
 * scripts/start.js
 *
 * Universal, cross-platform one-command launcher for the Expo mobile app.
 * Works on Windows, macOS, and Linux.
 *
 * Capabilities:
 *  1. Environment validation: checks required EXPO_PUBLIC_* variables.
 *  2. Multi-site selection: CLI flag (--site=gujjutours|tripgoasia|technoheaven)
 *     takes absolute precedence over files and shell variables.
 *  3. File precedence: CLI flag > .env.local > .env > defaults.
 *  4. Warns prominently if .env.local overrides .env.
 *  5. API check: calls config endpoint for chosen hostname, measures latency,
 *     and prints OK/FAILED with diagnostic details.
 *  6. Dependency validation: auto-runs npm install if node_modules is missing.
 *  7. Connection mode: defaults to LAN, detects real Wi-Fi/Ethernet IPv4,
 *     filters out virtual adapters (WSL, Hyper-V, Docker), sets REACT_NATIVE_PACKAGER_HOSTNAME.
 *  8. Port conflict resolution (port 8081).
 *  9. Always clears Metro cache (expo start -c).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');
const http = require('http');
const https = require('https');
const { spawn, execSync } = require('child_process');

// ─── Polyfills for Windows / Node runtime quirks ────────────────────────────
if (typeof globalThis.setImmediate === 'undefined') {
  globalThis.setImmediate = (fn, ...args) => setTimeout(fn, 0, ...args);
}

// ─── Known Multi-Tenant Sites ───────────────────────────────────────────────
const SITES = {
  gujjutours: {
    id: 'gujjutours',
    name: 'Gujju Tours',
    hostname: 'www.gujjutours.com',
    configApiUrl: 'https://stagingapi.gujjutours.com',
    stagingApiUrl: 'https://stagingapi.gujjutours.com',
    aliases: ['www.gujjutours.com', 'gujjutours.com', 'b2b.gujjutours.com', 'website1'],
  },
  tripgoasia: {
    id: 'tripgoasia',
    name: 'TripGo Asia',
    hostname: 'www.tripgoasia.com',
    configApiUrl: 'https://stagingapi.tripgoasia.com',
    stagingApiUrl: 'https://stagingapi.tripgoasia.com',
    aliases: ['www.tripgoasia.com', 'tripgoasia.com', 'adventureworld.com', 'website2'],
  },
  technoheaven: {
    id: 'technoheaven',
    name: 'Technoheaven',
    hostname: 'stagingb2b.technoheaven.com',
    configApiUrl: 'https://stagingapi.technoheaven.com',
    stagingApiUrl: 'https://stagingapi.technoheaven.com',
    aliases: ['stagingb2b.technoheaven.com', 'technoheaven.com', 'www.technoheaven.com', 'website3'],
  },
};

// ─── Simple In-Memory .env Loader ───────────────────────────────────────────
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const result = {};
  const content = fs.readFileSync(filePath, 'utf-8');
  for (const line of content.split('\n')) {
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

// ─── CLI Arguments Parser ───────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {
    site: null,
    tunnel: false,
    lan: false,
    web: false,
    android: false,
    ios: false,
    backend: false,
    checkOnly: false,
    port: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--site=')) {
      flags.site = arg.slice(7).trim().toLowerCase();
    } else if (arg === '--site' && args[i + 1]) {
      flags.site = args[++i].trim().toLowerCase();
    } else if (arg === '--tunnel') {
      flags.tunnel = true;
    } else if (arg === '--lan') {
      flags.lan = true;
    } else if (arg === '--web') {
      flags.web = true;
    } else if (arg === '--android') {
      flags.android = true;
    } else if (arg === '--ios') {
      flags.ios = true;
    } else if (arg === '--backend') {
      flags.backend = true;
    } else if (arg === '--check-only') {
      flags.checkOnly = true;
    } else if (arg.startsWith('--port=')) {
      flags.port = parseInt(arg.slice(7).trim(), 10);
    } else if (arg === '--port' && args[i + 1]) {
      flags.port = parseInt(args[++i].trim(), 10);
    }
  }

  return flags;
}

// ─── LAN IP Detection (Excludes WSL / Hyper-V / Docker Virtual Adapters) ───
function detectLanIp() {
  const ifaces = os.networkInterfaces();
  const candidates = [];

  for (const [name, list] of Object.entries(ifaces)) {
    if (!list) continue;
    const lowerName = name.toLowerCase();

    // Skip virtual, VPN, or container network adapters
    if (
      lowerName.includes('vethernet') ||
      lowerName.includes('wsl') ||
      lowerName.includes('virtual') ||
      lowerName.includes('docker') ||
      lowerName.includes('hyper-v') ||
      lowerName.includes('loopback') ||
      lowerName.includes('teredo') ||
      lowerName.includes('npcap')
    ) {
      continue;
    }

    for (const iface of list) {
      if (iface.family === 'IPv4' && !iface.internal) {
        // Exclude link-local (169.254.x.x) and loopback
        if (iface.address.startsWith('169.254.') || iface.address.startsWith('127.')) {
          continue;
        }
        candidates.push({ name, address: iface.address });
      }
    }
  }

  if (candidates.length === 0) return '127.0.0.1';

  // Prefer Wi-Fi or Ethernet
  const preferred = candidates.find(
    (c) =>
      c.name.toLowerCase().includes('wi-fi') ||
      c.name.toLowerCase().includes('wifi') ||
      c.name.toLowerCase().includes('ethernet')
  );

  return (preferred || candidates[0]).address;
}

// ─── Check Port Availability ───────────────────────────────────────────────
function checkPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port);
  });
}

async function findAvailablePort(startPort) {
  let port = startPort;
  while (port < startPort + 20) {
    // eslint-disable-next-line no-await-in-loop
    const available = await checkPortAvailable(port);
    if (available) return port;
    port++;
  }
  return startPort;
}

// ─── HTTP(S) GET Request Helper ────────────────────────────────────────────
function fetchUrl(targetUrl, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(targetUrl);
    const client = urlObj.protocol === 'https:' ? https : http;
    const startTime = Date.now();

    const req = client.get(
      targetUrl,
      {
        timeout: timeoutMs,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'ToursApp-Launcher/1.0',
        },
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          const latencyMs = Date.now() - startTime;
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            latencyMs,
            body: rawData,
          });
        });
      }
    );

    req.on('timeout', () => {
      req.abort();
      reject(new Error(`Timed out after ${timeoutMs}ms`));
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}

// ─── Step 1: Validate & Resolve Environment ────────────────────────────────
function validateAndResolveEnv(flags, projectRoot, lanIp) {
  console.log('\n[1/5] Validating environment configuration...');

  const envDotEnv = loadEnvFile(path.join(projectRoot, '.env'));
  const envLocal = loadEnvFile(path.join(projectRoot, '.env.local'));

  // Warn if .env.local overrides any site configuration from .env
  const siteRelatedKeys = [
    'EXPO_PUBLIC_SITE_ID',
    'EXPO_PUBLIC_SITE_HOSTNAME',
    'EXPO_PUBLIC_CONFIG_API_URL',
    'EXPO_PUBLIC_API_URL',
  ];
  const overrides = [];
  for (const k of siteRelatedKeys) {
    if (envLocal[k] && envDotEnv[k] && envLocal[k] !== envDotEnv[k]) {
      overrides.push(`${k}: "${envDotEnv[k]}" (.env) overridden by "${envLocal[k]}" (.env.local)`);
    }
  }
  if (overrides.length > 0) {
    console.warn('\n  ⚠️ [WARNING] .env.local is overriding site settings from .env:');
    overrides.forEach((o) => console.warn(`     • ${o}`));
    console.warn('     Note: CLI flag --site will take precedence over all files.\n');
  }

  // Precedence order: CLI flag (--site) > .env.local > .env.<siteKey> > .env > default (gujjutours)
  let source = '.env';
  let siteKey = '';

  if (flags.site) {
    siteKey = flags.site.toLowerCase().trim();
    source = `CLI flag (--site=${flags.site})`;
  } else if (envLocal.EXPO_PUBLIC_SITE_ID) {
    siteKey = envLocal.EXPO_PUBLIC_SITE_ID.toLowerCase().trim();
    source = '.env.local';
  } else if (envDotEnv.EXPO_PUBLIC_SITE_ID) {
    siteKey = envDotEnv.EXPO_PUBLIC_SITE_ID.toLowerCase().trim();
    source = '.env';
  } else {
    siteKey = 'gujjutours';
    source = 'default (gujjutours)';
  }

  // Normalize legacy aliases
  if (siteKey === 'website1') siteKey = 'gujjutours';
  if (siteKey === 'website2') siteKey = 'tripgoasia';
  if (siteKey === 'website3') siteKey = 'technoheaven';

  const siteDef = SITES[siteKey] || SITES.gujjutours;

  // Load tenant-specific .env.<siteKey> if present
  const envSitePath = path.join(projectRoot, `.env.${siteKey}`);
  const envSite = loadEnvFile(envSitePath);
  if (fs.existsSync(envSitePath) && !flags.site && source === '.env') {
    source = `.env.${siteKey}`;
  }

  let siteHostname;
  let unifiedBaseUrl;

  if (flags.site) {
    // When CLI flag is passed, CLI values / .env.<siteKey> win completely over .env
    siteHostname = envSite.EXPO_PUBLIC_SITE_HOSTNAME || siteDef.hostname;
    if (flags.backend) {
      unifiedBaseUrl = flags.web ? 'http://localhost:5000' : `http://${lanIp}:5000`;
    } else {
      const configuredApi = envSite.EXPO_PUBLIC_API_URL || envSite.EXPO_PUBLIC_CONFIG_API_URL;
      unifiedBaseUrl = configuredApi && !configuredApi.includes(':5000') && !configuredApi.includes('localhost')
        ? configuredApi.replace(/\/+$/, '')
        : siteDef.stagingApiUrl;
    }
  } else {
    // When reading from files, resolve hostname and URLs from files with site defaults
    siteHostname =
      envLocal.EXPO_PUBLIC_SITE_HOSTNAME ||
      envSite.EXPO_PUBLIC_SITE_HOSTNAME ||
      envDotEnv.EXPO_PUBLIC_SITE_HOSTNAME ||
      siteDef.hostname;

    if (flags.backend) {
      unifiedBaseUrl = flags.web ? 'http://localhost:5000' : `http://${lanIp}:5000`;
    } else {
      const configuredApi =
        envLocal.EXPO_PUBLIC_API_URL ||
        envSite.EXPO_PUBLIC_API_URL ||
        envDotEnv.EXPO_PUBLIC_API_URL;
      const configuredConfig =
        envLocal.EXPO_PUBLIC_CONFIG_API_URL ||
        envSite.EXPO_PUBLIC_CONFIG_API_URL ||
        envDotEnv.EXPO_PUBLIC_CONFIG_API_URL;
      const customUrl = configuredApi || configuredConfig;
      unifiedBaseUrl = customUrl && !customUrl.includes(':5000') && !customUrl.includes('localhost')
        ? customUrl.replace(/\/+$/, '')
        : siteDef.stagingApiUrl;
    }

    // Check for mismatch between site ID and hostname/API
    const hostMatches =
      siteHostname === siteDef.hostname ||
      (siteDef.aliases && siteDef.aliases.includes(siteHostname.toLowerCase()));

    if (!hostMatches) {
      console.warn(
        `\n  ⚠️ [MISMATCH DETECTED] EXPO_PUBLIC_SITE_ID is "${siteDef.id}" but EXPO_PUBLIC_SITE_HOSTNAME is "${siteHostname}".`
      );
      console.warn(`     Expected hostname: "${siteDef.hostname}". The mobile app will display a mismatch error screen.`);
    }
  }

  const configApiUrl = unifiedBaseUrl;
  const apiUrl = unifiedBaseUrl;

  const defaultLang =
    envLocal.EXPO_PUBLIC_DEFAULT_LANG ||
    envSite.EXPO_PUBLIC_DEFAULT_LANG ||
    envDotEnv.EXPO_PUBLIC_DEFAULT_LANG ||
    'en';

  const requiredVars = {
    EXPO_PUBLIC_SITE_ID: siteDef.id,
    EXPO_PUBLIC_SITE_HOSTNAME: siteHostname,
    EXPO_PUBLIC_CONFIG_API_URL: configApiUrl,
    EXPO_PUBLIC_API_URL: apiUrl,
  };

  const missing = Object.entries(requiredVars)
    .filter(([_, val]) => !val)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.error(`  ❌ Missing required environment variable(s): ${missing.join(', ')}`);
    process.exit(1);
  }

  console.log(`  ✓ Active Site:      ${siteDef.name} (${siteDef.id})`);
  console.log(`  ✓ Site Hostname:    ${siteHostname}`);
  console.log(`  ✓ Config API URL:   ${configApiUrl}`);
  console.log(`  ✓ Backend API Base: ${apiUrl}`);
  console.log(`  ✓ Resolved From:    ${source}`);
  console.log(`  ✓ Default Lang:     ${defaultLang}`);

  return {
    siteDef,
    source,
    env: {
      ...requiredVars,
      EXPO_PUBLIC_ENV_SOURCE: source,
      EXPO_PUBLIC_DEFAULT_LANG: defaultLang,
      EXPO_PUBLIC_USE_LOCAL_BACKEND: flags.backend ? 'true' : 'false',
      REACT_NATIVE_PACKAGER_HOSTNAME: lanIp,
    },
  };
}

// ─── Step 2: Check API Reachability ────────────────────────────────────────
async function checkApi(configApiUrl, hostname) {
  console.log('\n[2/5] Checking API reachability...');
  const endpoint = `${configApiUrl}/api/core/v1/config/${hostname}?lang=en`;
  console.log(`  → Requesting: ${endpoint}`);

  try {
    const result = await fetchUrl(endpoint, 8000);
    if (result.ok) {
      console.log(`  ✓ API Check: OK (HTTP ${result.status}, response time: ${result.latencyMs}ms)`);
      return true;
    }
    console.warn(`  ⚠️ API Check: FAILED with HTTP ${result.status} (${result.latencyMs}ms)`);
    console.warn(`     Likely cause: Endpoint responded with non-200. Check hostname or API routing.`);
    return false;
  } catch (err) {
    console.warn(`  ⚠️ API Check: FAILED (${err.message})`);
    if (err.message.includes('ENOTFOUND')) {
      console.warn(`     Likely cause: DNS resolution failed. Check your internet connection or URL.`);
    } else if (err.message.includes('ECONNREFUSED')) {
      console.warn(`     Likely cause: Server is down or refusing connections on specified port.`);
    } else if (err.message.includes('Timed out')) {
      console.warn(`     Likely cause: Network latency or firewall blocking outgoing requests.`);
    } else {
      console.warn(`     Likely cause: Network or server error. (Note: CORS does NOT apply to native apps).`);
    }
    console.log(`  ℹ️ Continuing app startup (cached/baseline fallback available)...`);
    return false;
  }
}

// ─── Step 3: Check Dependencies ────────────────────────────────────────────
function checkDependencies(projectRoot) {
  console.log('\n[3/5] Checking dependencies...');
  const nodeModulesPath = path.join(projectRoot, 'node_modules');
  const expoPackage = path.join(nodeModulesPath, 'expo');

  if (!fs.existsSync(nodeModulesPath) || !fs.existsSync(expoPackage)) {
    console.log('  ⚠️ node_modules not found or incomplete. Running npm install automatically...');
    execSync('npm install', { cwd: projectRoot, stdio: 'inherit' });
    console.log('  ✓ Dependencies installed successfully.');
    return;
  }

  console.log('  ✓ Dependencies are installed and verified.');
}

// ─── Step Optional: Start ASP.NET Backend if --backend was requested ────────
async function ensureBackendStarted(projectRoot, hostname) {
  console.log('\n[+] Checking local ASP.NET Core backend on port 5000...');
  const healthUrl = `http://localhost:5000/api/core/v1/config/${hostname}?lang=en`;

  try {
    const res = await fetchUrl(healthUrl, 2000);
    if (res.ok) {
      console.log('  ✓ Local backend is already running and healthy on port 5000.');
      return null;
    }
  } catch {
    // not running, proceed to launch
  }

  const candidatePaths = [
    path.resolve(projectRoot, '../backend/toursapi'),
    path.resolve(projectRoot, '../../backend/toursapi'),
  ];
  const backendDir = candidatePaths.find((p) => fs.existsSync(p));

  if (!backendDir) {
    console.warn('  ⚠️ Backend directory not found in ../backend/toursapi. Skipping local backend launch.');
    return null;
  }

  console.log(`  → Starting backend with "dotnet run" in: ${backendDir}`);
  const backendProc = spawn('dotnet', ['run'], {
    cwd: backendDir,
    stdio: 'ignore',
    shell: true,
  });

  console.log('  → Waiting for backend to respond...');
  const startTime = Date.now();
  let ready = false;

  while (Date.now() - startTime < 30000) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const res = await fetchUrl(healthUrl, 1500);
      if (res.ok) {
        ready = true;
        break;
      }
    } catch {
      // still starting up
    }
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 1000));
  }

  if (ready) {
    console.log('  ✓ Backend started and answering on port 5000!');
  } else {
    console.warn('  ⚠️ Backend did not respond within 30s. Continuing startup...');
  }

  return backendProc;
}

// ─── Main Startup Orchestrator ─────────────────────────────────────────────
async function main() {
  console.log('================================================================');
  console.log('  🚀 TOURSAPP UNIFIED LAUNCHER');
  console.log('================================================================');

  const flags = parseArgs();
  const projectRoot = path.resolve(__dirname, '..');
  const lanIp = detectLanIp();

  console.log(`[LAN] Detected computer LAN IP: ${lanIp}`);

  // Step 1: Validate & resolve environment
  const { siteDef, env: resolvedEnv } = validateAndResolveEnv(flags, projectRoot, lanIp);

  // Optional: Backend setup if --backend is specified
  let backendProc = null;
  if (flags.backend) {
    backendProc = await ensureBackendStarted(projectRoot, siteDef.hostname);
  }

  // Step 2: Check API
  if (flags.checkOnly) {
    await checkApi(resolvedEnv.EXPO_PUBLIC_CONFIG_API_URL, resolvedEnv.EXPO_PUBLIC_SITE_HOSTNAME);
    process.exit(0);
  }
  await checkApi(resolvedEnv.EXPO_PUBLIC_CONFIG_API_URL, resolvedEnv.EXPO_PUBLIC_SITE_HOSTNAME);

  // Step 3: Check dependencies
  checkDependencies(projectRoot);

  // Step 4: Configure Expo connection & ports
  console.log('\n[4/5] Configuring Expo connection & ports...');
  const targetPort = flags.port || (await findAvailablePort(8081));
  if (targetPort !== 8081) {
    console.log(`  ℹ️ Port 8081 was in use. Selected free port: ${targetPort}`);
  } else {
    console.log(`  ✓ Metro Bundler port: 8081 (available)`);
  }

  const expoArgs = ['start', '-c'];

  if (flags.tunnel) {
    console.log('  ✓ Mode: TUNNEL (Cloud proxy via @expo/ngrok)');
    expoArgs.push('--tunnel');
  } else {
    console.log(`  ✓ Mode: LAN (Physical phone connects to ${lanIp}:${targetPort})`);
    if (flags.lan) expoArgs.push('--lan');
  }

  if (targetPort !== 8081) {
    expoArgs.push('--port', String(targetPort));
  }

  if (flags.web) expoArgs.push('--web');
  if (flags.android) expoArgs.push('--android');
  if (flags.ios) expoArgs.push('--ios');

  console.log('\n[5/5] Launching Expo with cleared cache...');
  console.log(`  → Command: npx expo ${expoArgs.join(' ')}\n`);

  // Ensure resolved environment variables overwrite any stale variables in parent process.env
  const spawnEnv = {
    ...process.env,
    ...resolvedEnv,
    PORT: String(targetPort),
  };

  const expoCliPath = path.join(projectRoot, 'node_modules', 'expo', 'bin', 'cli');
  let expoProc;

  if (fs.existsSync(expoCliPath)) {
    expoProc = spawn(process.execPath, [expoCliPath, ...expoArgs], {
      cwd: projectRoot,
      stdio: 'inherit',
      env: spawnEnv,
    });
  } else {
    const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    expoProc = spawn(npxCmd, ['expo', ...expoArgs], {
      cwd: projectRoot,
      stdio: 'inherit',
      env: spawnEnv,
      shell: true,
    });
  }

  const cleanup = () => {
    if (backendProc) {
      try {
        backendProc.kill();
      } catch {
        // ignore
      }
    }
  };

  process.on('SIGINT', () => {
    cleanup();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(0);
  });
  process.on('exit', cleanup);

  expoProc.on('exit', (code) => {
    cleanup();
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error('\n❌ Fatal startup error:', err);
  process.exit(1);
});
