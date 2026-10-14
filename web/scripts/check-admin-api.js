#!/usr/bin/env node
/**
 * scripts/check-admin-api.js
 *
 * Automated verification script for the Admin API, authentication,
 * tenant isolation, and administrative management endpoints.
 *
 * Usage:
 *   node scripts/check-admin-api.js
 *   npm run check:admin
 *   npm run check:admin -- --site=tripgoasia
 *   npm run check:admin -- --site=technoheaven
 */

const API_BASE = process.env.API_BASE || "http://localhost:5000";

const SITES = {
  gujjutours: {
    id: "website1",
    name: "Gujju Tours",
    hostname: "www.gujjutours.com",
    email: "admin@gujjutours.com",
    password: "Admin@12345",
  },
  tripgoasia: {
    id: "website2",
    name: "TripGoAsia",
    hostname: "www.tripgoasia.com",
    email: "admin@tripgoasia.com",
    password: "Admin@12345",
  },
  technoheaven: {
    id: "website3",
    name: "Technoheaven",
    hostname: "stagingb2b.technoheaven.com",
    email: "admin@technoheaven.com",
    password: "Admin@12345",
  },
};

// Parse command line arguments
const args = process.argv.slice(2);
let selectedKey = "gujjutours";
for (const arg of args) {
  if (arg.startsWith("--site=")) {
    selectedKey = arg.split("=")[1].toLowerCase();
  }
}

const site = SITES[selectedKey] || SITES.gujjutours;

console.log("==================================================================");
console.log(`🔍 ADMIN API VERIFICATION: ${site.name} (${site.id})`);
console.log(`🌐 Base URL: ${API_BASE} | Hostname: ${site.hostname}`);
console.log("==================================================================\n");

async function runCheck(title, fn) {
  const start = Date.now();
  process.stdout.write(`⏳ ${title}... `);
  try {
    const result = await fn();
    const duration = Date.now() - start;
    console.log(`\x1b[32mPASS\x1b[0m (${duration}ms)`);
    if (result) console.log(`   ↳ ${result}`);
    return true;
  } catch (err) {
    const duration = Date.now() - start;
    console.log(`\x1b[31mFAIL\x1b[0m (${duration}ms)`);
    console.log(`   ↳ \x1b[31mError:\x1b[0m ${err.message}`);
    return false;
  }
}

async function execute() {
  let adminToken = null;
  let passedCount = 0;
  let totalCount = 0;

  // 1. Admin Login
  totalCount++;
  const loginPassed = await runCheck("Admin Authentication (POST /api/auth/login)", async () => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Website-Hostname": site.hostname,
      },
      body: JSON.stringify({ email: site.email, password: site.password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    if (!data.data?.token) throw new Error("No token returned");
    if (data.data.user?.role !== "Admin" && data.data.user?.role !== "SuperAdmin") {
      throw new Error(`Unexpected role: ${data.data.user?.role}`);
    }

    adminToken = data.data.token;
    return `Logged in as ${data.data.user.name} [Role: ${data.data.user.role}]`;
  });
  if (loginPassed) passedCount++;

  if (!adminToken) {
    console.error("\n❌ Cannot continue verification without valid admin token.");
    process.exit(1);
  }

  // 2. Admin Stats
  totalCount++;
  const statsPassed = await runCheck("Admin Dashboard Stats (GET /api/admin/stats)", async () => {
    const res = await fetch(`${API_BASE}/api/admin/stats`, {
      headers: {
        "Authorization": `Bearer ${adminToken}`,
        "X-Website-Hostname": site.hostname,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    const s = data.data;
    return `Tours: ${s.totalTours} | Bookings: ${s.totalBookings} | Revenue: $${s.totalRevenue} | Users: ${s.totalUsers}`;
  });
  if (statsPassed) passedCount++;

  // 3. Admin Analytics
  totalCount++;
  const analyticsPassed = await runCheck("Admin Analytics Aggregations (GET /api/admin/analytics)", async () => {
    const res = await fetch(`${API_BASE}/api/admin/analytics`, {
      headers: {
        "Authorization": `Bearer ${adminToken}`,
        "X-Website-Hostname": site.hostname,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    const a = data.data;
    return `Avg Order: $${a.avgBookingValue} | Status Groups: ${a.bookingsByStatus?.length} | Categories: ${a.toursByCategory?.length}`;
  });
  if (analyticsPassed) passedCount++;

  // 4. Admin Bookings
  totalCount++;
  const bookingsPassed = await runCheck("Admin Bookings Management (GET /api/bookings)", async () => {
    const res = await fetch(`${API_BASE}/api/bookings`, {
      headers: {
        "Authorization": `Bearer ${adminToken}`,
        "X-Website-Hostname": site.hostname,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return `Total tenant bookings returned: ${data.data?.length ?? 0}`;
  });
  if (bookingsPassed) passedCount++;

  // 5. Admin Users
  totalCount++;
  const usersPassed = await runCheck("Admin User Management (GET /api/users)", async () => {
    const res = await fetch(`${API_BASE}/api/users`, {
      headers: {
        "Authorization": `Bearer ${adminToken}`,
        "X-Website-Hostname": site.hostname,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return `Total tenant users returned: ${data.data?.length ?? 0}`;
  });
  if (usersPassed) passedCount++;

  // 6. Security: Unauthenticated Access Guard
  totalCount++;
  const unauthPassed = await runCheck("Security Guard: Unauthenticated Access Block (401)", async () => {
    const res = await fetch(`${API_BASE}/api/admin/stats`, {
      headers: {
        "X-Website-Hostname": site.hostname,
      },
    });

    if (res.status === 401) {
      return "Successfully blocked unauthenticated caller (401 Unauthorized)";
    }
    throw new Error(`Expected HTTP 401, got HTTP ${res.status}`);
  });
  if (unauthPassed) passedCount++;

  // 7. Security: Cross-Tenant Isolation Defense
  totalCount++;
  const breachPassed = await runCheck("Security Guard: Cross-Tenant Breach Defense (403)", async () => {
    // Attempt to access website2 using website1 admin token (or website1 using website2)
    const victimSite = site.id === "website1" ? SITES.tripgoasia : SITES.gujjutours;
    const res = await fetch(`${API_BASE}/api/admin/stats`, {
      headers: {
        "Authorization": `Bearer ${adminToken}`,
        "X-Website-Hostname": victimSite.hostname,
      },
    });

    if (res.status === 403 || res.status === 401) {
      return `Successfully blocked cross-tenant access to ${victimSite.name} (HTTP ${res.status})`;
    }
    throw new Error(`Expected HTTP 403 Forbidden or 401 Unauthorized, got HTTP ${res.status}`);
  });
  if (breachPassed) passedCount++;

  console.log("\n==================================================================");
  if (passedCount === totalCount) {
    console.log(`\x1b[32m🎉 ALL CHECKS PASSED: ${passedCount}/${totalCount} Verified Successfully!\x1b[0m`);
  } else {
    console.log(`\x1b[31m⚠️ SOME CHECKS FAILED: ${passedCount}/${totalCount} Passed\x1b[0m`);
    process.exit(1);
  }
  console.log("==================================================================\n");
}

execute();
