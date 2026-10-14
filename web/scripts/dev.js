#!/usr/bin/env node
/**
 * scripts/dev.js
 *
 * Single-Process Multi-Tenant Dev Server Runner.
 * Starts ONE Next.js instance on port 3000.
 * Directly launches the active website configured in .env (SITE_ID).
 */

const fs = require("fs");
const net = require("net");
const path = require("path");
const { spawn } = require("child_process");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const DEFAULT_PORT = parseInt(process.env.PORT || "3000", 10);

const KNOWN_SITES = {
  gujjutours: { name: "Gujju Tours", backendHost: "www.gujjutours.com" },
  tripgoasia: { name: "TripGo Asia", backendHost: "www.tripgoasia.com" },
  technoheaven: { name: "Technoheaven", backendHost: "stagingb2b.technoheaven.com" },
};

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf-8");
  const result = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
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

function checkPortBusy(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(400);

    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });

    socket.once("error", () => {
      resolve(false);
    });

    socket.connect(port, "127.0.0.1");
  });
}

async function main() {
  const port = DEFAULT_PORT;

  const isBusy = await checkPortBusy(port);
  if (isBusy) {
    console.error("\n================================================================");
    console.error(`  [ERROR] Port ${port} is already in use!`);
    console.error("================================================================\n");
    console.error(`  A process is currently listening on http://localhost:${port}.`);
    console.error(`  To stop the occupying process on Windows PowerShell:`);
    console.error(`    Get-NetTCPConnection -LocalPort ${port} | Select-Object OwningProcess`);
    console.error(`    Stop-Process -Id <PID> -Force\n`);
    console.error("================================================================\n");
    process.exit(1);
  }

  // Parse .env and .env.local to inspect SITE_ID
  const envFile = parseEnvFile(path.join(PROJECT_ROOT, ".env"));
  const envLocalFile = parseEnvFile(path.join(PROJECT_ROOT, ".env.local"));

  const fileSiteId = envLocalFile.SITE_ID || envFile.SITE_ID || envLocalFile.ACTIVE_SITE_ID || envFile.ACTIVE_SITE_ID || envLocalFile.DEFAULT_SITE_ID || envFile.DEFAULT_SITE_ID;
  const terminalSiteId = process.env.SITE_ID || process.env.ACTIVE_SITE_ID || process.env.DEFAULT_SITE_ID;

  const effectiveSiteId = (terminalSiteId || fileSiteId || "").trim().toLowerCase();
  const siteInfo = KNOWN_SITES[effectiveSiteId];

  const enableHostRouting = (
    process.env.ENABLE_HOST_ROUTING ||
    envLocalFile.ENABLE_HOST_ROUTING ||
    envFile.ENABLE_HOST_ROUTING ||
    "false"
  ).trim().toLowerCase() === "true";

  console.log("\n================================================================");
  console.log("  MULTI-WEBSITE TRAVEL PLATFORM - COMMON DEV SERVER");
  console.log("================================================================");
  console.log(`  Server Listening Port:  ${port}`);

  if (siteInfo) {
    console.log(`  Active Website:         ${siteInfo.name} (${effectiveSiteId})`);
    console.log(`  Backend Canonical Host: ${siteInfo.backendHost}`);
  } else if (effectiveSiteId) {
    console.log(`  Active Website:         UNKNOWN ("${effectiveSiteId}")`);
  } else {
    console.log(`  Active Website:         NOT CONFIGURED (SITE_ID is empty)`);
  }

  console.log(`  Resolution Mode:        Direct from .env (SITE_ID)`);
  console.log(`  Host Routing (*.local): ${enableHostRouting ? "ENABLED" : "DISABLED (Default)"}`);
  console.log(`  Backend API URL:        ${process.env.NEXT_PUBLIC_API_URL || envLocalFile.NEXT_PUBLIC_API_URL || envFile.NEXT_PUBLIC_API_URL || "http://localhost:5000"}`);
  console.log(`  Direct Launch URL:      http://localhost:${port}`);
  console.log("================================================================");

  // Terminal environment override warning
  if (terminalSiteId && fileSiteId && terminalSiteId.toLowerCase() !== fileSiteId.toLowerCase()) {
    console.warn("\n  ⚠️ [WARNING] Terminal Override Detected!");
    console.warn(`     SITE_ID is set in your active terminal session as "${terminalSiteId}",`);
    console.warn(`     which overrides the value in .env ("${fileSiteId}").`);
    console.warn(`     Next.js will ignore changes to .env until you clear the terminal variable.`);
    console.warn(`     To clear on PowerShell: Remove-Item Env:\\SITE_ID\n`);
  } else if (envLocalFile.SITE_ID && envFile.SITE_ID && envLocalFile.SITE_ID !== envFile.SITE_ID) {
    console.warn("\n  ℹ️ [NOTE] .env.local override:");
    console.warn(`     .env.local (SITE_ID="${envLocalFile.SITE_ID}") takes precedence over .env ("${envFile.SITE_ID}").\n`);
  }

  if (!siteInfo) {
    console.warn("\n  ⚠️ [NOTICE] SITE_ID is missing or not recognized in .env.");
    console.warn(`     Opening http://localhost:${port} will display the configuration error screen naming the variable.\n`);
  }

  const nextBin = require.resolve("next/dist/bin/next");
  const child = spawn(process.execPath, [nextBin, "dev", "-p", String(port)], {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
    shell: false,
    env: {
      ...process.env,
      PORT: String(port),
    },
  });

  child.on("error", (err) => {
    console.error("Failed to start Next.js process:", err);
    process.exit(1);
  });

  child.on("exit", (code) => {
    process.exit(code || 0);
  });
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
