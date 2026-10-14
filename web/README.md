# Tours App - Multi-Website Web Application

A Next.js 15 (App Router) + Tailwind CSS multi-tenant travel platform serving three isolated website brands (`gujjutours`, `tripgoasia`, `technoheaven`) with dedicated ports, separate databases, and independent environments.

---

## 🚀 Run each website

Each website runs on its own **dedicated port** and can be run individually or side-by-side:

| Website Brand | Site ID | Dedicated Port | URL | Backend Database |
| :--- | :--- | :--- | :--- | :--- |
| **Gujju Tours** | `gujjutours` | `3000` | [http://localhost:3000](http://localhost:3000) | `tours_gujjutours` |
| **TripGo Asia** | `tripgoasia` | `3001` | [http://localhost:3001](http://localhost:3001) | `tours_tripgoasia` |
| **Technoheaven** | `technoheaven` | `3002` | [http://localhost:3002](http://localhost:3002) | `tours_technoheaven` |

---

### 1. Dedicated Startup Scripts

Start the development server for any brand using its dedicated script (powered by `cross-env` and `scripts/dev.js`):

```bash
# 1. Run TripGo Asia on Port 3001
npm run dev:tripgoasia

# 2. Run Gujju Tours on Port 3000
npm run dev:gujjutours

# 3. Run Technoheaven on Port 3002
npm run dev:technoheaven

# 4. OR Run All 3 Websites Concurrently in One Terminal
npm run dev:all
```

You can open separate PowerShell terminals to run multiple websites concurrently on ports 3000, 3001, and 3002, or run `npm run dev:all` to run all three simultaneously.

---

### 2. Environment File Priority Order

Next.js and the startup runner evaluate configuration in this strict precedence order (higher wins):

1. **CLI Arguments & Script Overrides** (`npm run dev:tripgoasia`, `cross-env NEXT_PUBLIC_SITE_ID=tripgoasia PORT=3001`)
2. **Terminal Shell Variables** (`$env:NEXT_PUBLIC_SITE_ID`, `$env:PORT`)
3. **Local Active File**: `web/.env.local`
4. **Brand-Specific File**: `web/.env.<siteId>` (e.g. `.env.tripgoasia`, `.env.gujjutours`, `.env.technoheaven`)
5. **Base Fallback**: `web/.env`

> **Single Source of Truth**: `lib/env.ts` is the **only** runtime file in the web app that reads `process.env`. It validates that site ID, hostname, and API URL match the registered brand and fails fast with a clear diagnostic screen if any variable is missing or mismatched. There is **no default website** fallback.

---

### 3. Clearing Overriding Terminal Variables (PowerShell)

If you previously set environment variables in your Windows PowerShell session, they may override file settings. Use these commands to inspect and remove them:

```powershell
# 1. Inspect existing terminal variables
Get-ChildItem Env:NEXT_PUBLIC_*
Get-ChildItem Env:PORT

# 2. Clear any conflicting terminal variables
Remove-Item Env:NEXT_PUBLIC_SITE_ID -ErrorAction SilentlyContinue
Remove-Item Env:NEXT_PUBLIC_SITE_HOSTNAME -ErrorAction SilentlyContinue
Remove-Item Env:NEXT_PUBLIC_API_URL -ErrorAction SilentlyContinue
Remove-Item Env:PORT -ErrorAction SilentlyContinue
```

---

### 4. Cache Cleaning

If you switch environments or notice cached builds from another site, clean the Next.js build cache:

```bash
# Clean .next cache directory
npm run clean
```

---

### 5. Port Conflict Resolution (Windows PowerShell)

If a port (e.g. 3000 or 3001) is already in use by a background process, free it with:

```powershell
# Find process holding port 3001
Get-NetTCPConnection -LocalPort 3001 | Select-Object OwningProcess

# Terminate process (replace <PID>)
Stop-Process -Id <PID> -Force
```

---

### 6. Development Diagnostics Banner

When running in development (`NODE_ENV !== "production"`), a floating diagnostics badge appears in the bottom-right corner of the screen:
- **Active Site ID**: displays the verified brand ID (`tripgoasia`, `gujjutours`, `technoheaven`).
- **Target Hostname**: the hostname sent in `X-Website-Hostname`.
- **Dedicated Port**: confirms the running server port (3000, 3001, 3002).
- **Backend Tenant & Database**: confirms the exact tenant (`tripgoasia`) and database (`tours_tripgoasia`) resolved by ASP.NET Core from the request headers.
- **Config & Tours Status**: real-time status and latency of the backend API.
