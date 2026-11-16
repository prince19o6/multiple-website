#!/usr/bin/env node
/**
 * scripts/scan-secrets.js
 *
 * Repository-wide Secret Scanner Quality Gate.
 * Scans source files for leaked credentials, private keys, API keys, and sensitive tokens.
 * Run in CI and pre-commit hooks to prevent credential leakage.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

const IGNORED_DIRS = new Set([
  '.git',
  '.next',
  'node_modules',
  'bin',
  'obj',
  '.expo',
  'dist',
  'build',
  'coverage',
  '.system_generated',
  'brain',
  'logs',
  'scratch',
  'tests'
]);

const IGNORED_FILES = new Set([
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  '.env.example',
  '.env.local',
  '.env.gujjutours',
  '.env.tripgoasia',
  '.env.technoheaven',
  'scan-secrets.js',
  'scan-keys.js',
  'accurate_pressables.json',
  'inventory.json',
  'all_app_endpoints.json'
]);

// High-confidence regex rules for leaked secrets
const SECRET_RULES = [
  {
    name: 'Private Key Block',
    pattern: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/,
    severity: 'CRITICAL'
  },
  {
    name: 'AWS Access Key ID',
    pattern: /\b(AKIA|ABIA|ACCA)[0-9A-Z]{16}\b/,
    severity: 'CRITICAL'
  },
  {
    name: 'Google API Key',
    pattern: /\bAIza[0-9A-Za-z\-_]{35}\b/,
    severity: 'HIGH'
  },
  {
    name: 'SendGrid API Key',
    pattern: /\bSG\.[a-zA-Z0-9_\-\.]{22}\.[a-zA-Z0-9_\-\.]{43}\b/,
    severity: 'HIGH'
  },
  {
    name: 'Stripe Live Secret Key',
    pattern: /\bsk_live_[0-9a-zA-Z]{24,}\b/,
    severity: 'CRITICAL'
  },
  {
    name: 'Hardcoded JWT Bearer Token',
    pattern: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
    severity: 'HIGH'
  },
  {
    name: 'Hardcoded Live Web Secret Prefix',
    pattern: /(gt|tg|th)_sec_live_web_[a-z0-9_]{10,}/i,
    severity: 'HIGH'
  }
];

function scanDirectory(currentDir, findings = []) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        scanDirectory(path.join(currentDir, entry.name), findings);
      }
    } else if (entry.isFile()) {
      if (IGNORED_FILES.has(entry.name)) continue;

      // Only scan code, text, json, yaml, env files
      const ext = path.extname(entry.name).toLowerCase();
      const allowedExts = new Set(['.ts', '.tsx', '.js', '.jsx', '.cs', '.json', '.env', '.yaml', '.yml', '.md']);
      if (!allowedExts.has(ext) && !entry.name.startsWith('.env')) continue;

      const filePath = path.join(currentDir, entry.name);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          // Skip comment-only mentions in docs or tests fixtures
          if (line.includes('// test-secret-ignore') || line.includes('// scan-secrets:ignore')) return;

          for (const rule of SECRET_RULES) {
            if (rule.pattern.test(line)) {
              // Ensure it's not a generic placeholder
              if (line.includes('YOUR_') || line.includes('REPLACE_') || line.includes('example') || line.includes('dummy')) {
                continue;
              }

              findings.push({
                file: path.relative(ROOT_DIR, filePath),
                line: index + 1,
                rule: rule.name,
                severity: rule.severity,
                sample: line.trim().slice(0, 80)
              });
            }
          }
        });
      } catch (err) {
        // Skip unreadable files
      }
    }
  }

  return findings;
}

console.log('====================================================');
console.log('   🔍 REPOSITORY SECRET SCANNER QUALITY GATE        ');
console.log('====================================================');

const findings = scanDirectory(ROOT_DIR);

if (findings.length > 0) {
  console.error(`\n❌ [FAILED] Detected ${findings.length} potential secret leak(s):`);
  findings.forEach((f) => {
    console.error(`  - [${f.severity}] ${f.file}:${f.line} -> ${f.rule}`);
    console.error(`    Preview: ${f.sample}`);
  });
  console.error('\nPlease move credentials to environment variables or secret vaults before committing.');
  process.exit(1);
} else {
  console.log('\n✅ [PASS] No leaked secrets, private keys, or credentials detected in repository.');
  process.exit(0);
}
