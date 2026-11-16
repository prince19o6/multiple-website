#!/usr/bin/env node

/**
 * scripts/scan-keys.js
 *
 * BUILD-TIME SECURITY SCANNER.
 *
 * Verifies that NO secret server API keys or environment variables
 * have leaked into Next.js client-side bundles (.next/static).
 *
 * Fails the build (exit code 1) if any secret string or pattern is found.
 */

const fs = require('fs');
const path = require('path');

// 1. Secret keys and patterns that MUST NEVER appear in client-side code
const KNOWN_SECRETS = [
  'gt_sec_live_web_gujjutours_2026_x7a',
  'tg_sec_live_web_tripgoasia_2026_k9p',
  'th_sec_live_web_technoheaven_2026_v4w',
  process.env.GUJJUTOURS_API_KEY,
  process.env.TRIPGOASIA_API_KEY,
  process.env.TECHNOHEAVEN_API_KEY,
].filter((k) => typeof k === 'string' && k.trim().length > 6);

const SECRET_PATTERNS = [
  /_sec_live_web_/i,
  /gt_sec_[a-z0-9_]+/i,
  /tg_sec_[a-z0-9_]+/i,
  /th_sec_[a-z0-9_]+/i,
];

console.log('====================================================');
console.log(' [SECURITY SCANNER] Verifying Client Bundles for Key Leaks');
console.log('====================================================');
console.log(`[SCAN] Tracking ${KNOWN_SECRETS.length} known secret keys and ${SECRET_PATTERNS.length} regex patterns.`);

const staticDir = path.join(__dirname, '..', '.next', 'static');

if (!fs.existsSync(staticDir)) {
  console.log(`[INFO] .next/static not found at "${staticDir}". Run "npm run build" first to test production bundles.`);
  console.log('[PASS] Pre-build check clean.');
  process.exit(0);
}

function getAllFiles(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.json') || entry.name.endsWith('.html'))) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const files = getAllFiles(staticDir);
console.log(`[SCAN] Scanning ${files.length} client bundle files in .next/static...`);

let violations = 0;

for (const filePath of files) {
  const relative = path.relative(path.join(__dirname, '..'), filePath);
  const content = fs.readFileSync(filePath, 'utf8');

  // Check exact strings
  for (const secret of KNOWN_SECRETS) {
    if (content.includes(secret)) {
      console.error(`\x1b[31m[CRITICAL LEAK DETECTED]\x1b[0m Secret key found in client bundle!`);
      console.error(`  File:   ${relative}`);
      console.error(`  Secret: ${secret.slice(0, 10)}... (redacted)`);
      violations++;
    }
  }

  // Check regex patterns
  for (const pattern of SECRET_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      console.error(`\x1b[31m[CRITICAL LEAK DETECTED]\x1b[0m Secret pattern "${pattern}" matched in client bundle!`);
      console.error(`  File:    ${relative}`);
      console.error(`  Matched: ${match[0]}`);
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\n\x1b[31mFAILED:\x1b[0m ${violations} security violation(s) found in client bundles.`);
  console.error('Make sure server keys are only used in server-only modules or Next API Route Handlers.');
  process.exit(1);
}

console.log('\x1b[32m[PASS]\x1b[0m All client bundles in .next/static are 100% free of server API keys!');
process.exit(0);

