# 🌍 ToursApp — Multi-Tenant Tours & Travel Booking Platform

A unified, multi-tenant travel and tours platform powered by:
- **Web**: ONE common **Next.js 15 (App Router)** application running on a single port (`3000`), resolving tenants dynamically from the `Host` header via RFC 6761 `.localhost` subdomains.
- **Backend**: **ASP.NET Core 8.0 REST API** running on port `5000` with strict database-per-website isolation on MongoDB Atlas.
- **Mobile**: **React Native (Expo)** cross-platform app with dynamic LAN reachability and tenant-isolated SecureStore keys.
- **DevOps**: Multi-stage **Docker**, **Docker Compose** orchestration, and **GitHub Actions CI/CD**.
- **Booking Lifecycle & Confirmation**: Complete state machine (`pending` -> `confirmed` | `rejected` | `expired` | `cancelled`), transactional outbox emailing, 1-tap signed decision links, and multi-tenant admin inboxes. See the [Booking Workflow Runbook](BOOKING_WORKFLOW_RUNBOOK.md) for full architectural documentation.

---

## 🏗️ Architecture Overview

```
                                ┌──────────────────────────────────────────────┐
                                │          One Next.js 15 Application          │
                                │                  (Port 3000)                 │
                                └──────────────────────┬───────────────────────┘
                                                       │
               ┌───────────────────────────────────────┼───────────────────────────────────────┐
               │                                       │                                       │
               ▼                                       ▼                                       ▼
  gujjutours.localhost:3000               tripgoasia.localhost:3000               technoheaven.localhost:3000
        (Gujju Tours)                           (TripGo Asia)                           (Technoheaven)
  Host: www.gujjutours.com                 Host: www.tripgoasia.com          Host: stagingb2b.technoheaven.com
               │                                       │                                       │
               └───────────────────────────────────────┼───────────────────────────────────────┘
                                                       │ X-Website-Hostname header
                                                       ▼
                                ┌──────────────────────────────────────────────┐
                                │        ASP.NET Core Web API (Port 5000)      │
                                │          WebsiteContextMiddleware            │
                                └──────────────────────┬───────────────────────┘
                                                       │
               ┌───────────────────────────────────────┼───────────────────────────────────────┐
               │                                       │                                       │
               ▼                                       ▼                                       ▼
         tours_gujjutours                        tours_tripgoasia                        tours_technoheaven
       (Isolated MongoDB DB)                   (Isolated MongoDB DB)                   (Isolated MongoDB DB)
```

### Registered Website Tenants

| Brand | Subdomain | Canonical Backend Host | Isolated MongoDB Database | Primary Color |
|---|---|---|---|---|
| **Gujju Tours** | `http://gujjutours.localhost:3000` | `www.gujjutours.com` | `tours_gujjutours` | `#2563eb` (Blue) |
| **TripGo Asia** | `http://tripgoasia.localhost:3000` | `www.tripgoasia.com` | `tours_tripgoasia` | `#16a34a` (Green) |
| **Technoheaven**| `http://technoheaven.localhost:3000` | `stagingb2b.technoheaven.com` | `tours_technoheaven` | `#dc2626` (Red) |

---

## 🎯 Choose the Website

The active website served at `http://localhost:3000` or on your phone via LAN IP (`http://10.x.x.x:3000`) is controlled directly by `SITE_ID` in `web/.env`:

```env
# In web/.env:
SITE_ID=tripgoasia
```

Allowed values:
- `gujjutours` — Gujju Tours (Canonical: `www.gujjutours.com`)
- `tripgoasia` — TripGo Asia (Canonical: `www.tripgoasia.com`)
- `technoheaven` — Technoheaven (Canonical: `stagingb2b.technoheaven.com`)

To switch websites:
1. Open `web/.env` and update `SITE_ID` (e.g. `SITE_ID=gujjutours`).
2. Restart the development server with `npm run dev`.
3. Open `http://localhost:3000` — the chosen website opens immediately with no chooser page.

*(Optional)* To test multiple sites simultaneously side by side in development, set `ENABLE_HOST_ROUTING=true` in `web/.env` to allow accessing `http://gujjutours.localhost:3000`, `http://tripgoasia.localhost:3000`, etc.

---

## ⚡ Quick Start (Local Development)

### 1. Start the Backend API
```powershell
cd backend/toursApi
dotnet run
```
- API Endpoint: `http://localhost:5000`
- Swagger UI: `http://localhost:5000/swagger`
- Database Health Check: `GET http://localhost:5000/api/health/db` (with `X-Website-Hostname: www.gujjutours.com`)

### 2. Start the Unified Web Application
```powershell
cd web
npm install
npm run dev
```
- Open `http://localhost:3000` in Chrome/Edge or your phone's browser (`http://<PC_IP>:3000`) to view the website directly.

### 3. Start the Mobile App (Expo)
```powershell
cd my-app
npx expo start -c
```

---

## 🔐 Administrator Panel & Default Logins

Access the Admin Dashboard on any site at `/admin` (e.g., `http://gujjutours.localhost:3000/admin/login`):

| Tenant | Admin Email | Default Password |
|---|---|---|
| **Gujju Tours** | `admin@gujjutours.com` | `Admin@12345` |
| **TripGo Asia** | `admin@tripgoasia.com` | `Admin@12345` |
| **Technoheaven** | `admin@technoheaven.com` | `Admin@12345` |

### Tenant Isolation Guarantee
- Admins are strictly scoped to their respective tenant database.
- Tokens from Site A are rejected cryptographically by Site B (HTTP 401/403).

---

## 💳 Checkout & Payment Gateway Flow

Every tour page (`/tour/[id]`) features a responsive 3-step interactive checkout flow:

1. **Step 1 — Traveler Details**: Lead guest full name, email, phone number, traveler count, start and end dates with live price calculation.
2. **Step 2 — Payment Method**:
   - **Credit / Debit Card**: Instant 3D Secure simulation with card formatting.
   - **UPI / QR**: Instant zero-fee VPA verification (Google Pay, PhonePe, Paytm).
   - **PayPal**: Express checkout.
   - **Pay on Arrival**: Guaranteed seats with zero prepayment required.
3. **Step 3 — Confirmation Receipt**: Instant booking reference code (`BK-GT-...`), payment status badge, transaction reference, printable invoice receipt (`window.print()`).

---

## 🐳 Docker & Production Deployment

### Option 1: Docker Compose (All Services)
```bash
# Start both backend and web in background
docker compose up --build -d

# Follow container logs
docker compose logs -f

# Stop containers
docker compose down
```

### Option 2: Individual Docker Containers
```bash
# Build & run Backend API
docker build -t tours-backend ./backend
docker run -d -p 5000:5000 --name tours-backend tours-backend

# Build & run Web Frontend (Standalone Next.js)
docker build -t tours-web ./web
docker run -d -p 3000:3000 --name tours-web tours-web
```

---

## 🧪 Automated Testing & Verification

Run the full automated test suite with:

```powershell
# 1. Backend Isolation & Security Tests (7/7 tests)
cd backend
dotnet test ToursApi.Tests

# 2. Web TypeScript Type Checking (0 errors)
cd ../web
npx tsc --noEmit

# 3. Next.js Production Build
npm run build

# 4. Admin API & Tenant Boundary Checks (7/7 tests per site)
npm run check:admin
node scripts/check-admin-api.js --site=tripgoasia
node scripts/check-admin-api.js --site=technoheaven

# 5. Consumer API Reachability & Health Check
npm run check:api

# 6. Mobile SecureStore Sanitization Tests (11/11 tests)
cd ../my-app
node scripts/test-storage.js
```

---

## 📂 Project Directory Structure

```
toursapp/
├── .github/workflows/
│   └── ci.yml                 # GitHub Actions CI/CD Pipeline
├── backend/
│   ├── toursApi/              # ASP.NET Core Web API (Port 5000)
│   │   ├── controllers/       # Tours, Bookings, Auth, Seed, Health, Admin
│   │   ├── models/            # Tour, Booking, User, Destination, Config
│   │   ├── services/          # Multi-tenant DB provider, Auth, Index Init
│   │   └── Configuration/     # WebsiteRegistry (tenants & canonical domains)
│   ├── ToursApi.Tests/        # 7 Isolation & security xUnit tests
│   └── Dockerfile             # Multi-stage ASP.NET Core production image
├── web/
│   ├── app/
│   │   ├── [site]/            # Multi-tenant home, explore, category, tour details
│   │   ├── admin/             # Unified admin dashboard & metrics
│   │   ├── chooser/           # Developer Site Chooser on localhost:3000
│   │   └── api/               # Proxy endpoints to backend
│   ├── lib/                   # siteRegistry, api, env, adminApi
│   ├── middleware.ts          # Inspects Host header & dynamically rewrites
│   ├── Dockerfile             # Multi-stage Next.js 15 standalone image
│   └── package.json           # Single npm run dev script
├── my-app/                    # React Native Expo Mobile App
│   ├── app/                   # Expo router file-based screens
│   ├── lib/                   # Tenant-isolated storage & API client
│   └── scripts/               # test-storage.js test suite
└── docker-compose.yml         # Production multi-service orchestration
```
