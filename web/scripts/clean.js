#!/usr/bin/env node
/**
 * scripts/clean.js
 *
 * Cleans all Next.js build cache directories (.next, .next_*, etc.).
 * Safely handles Windows file locks.
 */

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..");

console.log("\n[clean] Cleaning Next.js cache directories...");

const candidates = [
  ".next",
  ".next_gujjutours",
  ".next_tripgoasia",
  ".next_technoheaven",
  ".next_default",
];

// Also find any directories starting with .next_
try {
  const entries = fs.readdirSync(PROJECT_ROOT, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith(".next_") && !candidates.includes(entry.name)) {
      candidates.push(entry.name);
    }
  }
} catch {
  // ignore
}

for (const dirName of candidates) {
  const targetDir = path.join(PROJECT_ROOT, dirName);
  if (fs.existsSync(targetDir)) {
    try {
      fs.rmSync(targetDir, { recursive: true, force: true });
      console.log(`[clean] Successfully deleted ${dirName}`);
    } catch (err) {
      console.warn(`[clean] Failed to delete ${dirName}: ${err.message}`);
    }
  }
}

console.log("[clean] Cache clean complete.\n");
