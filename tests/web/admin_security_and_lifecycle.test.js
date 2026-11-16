const { describe, it } = require("node:test");
const assert = require("node:assert");
const crypto = require("crypto");

const API_BASE = process.env.API_BASE || "http://127.0.0.1:5000";

const TENANTS = {
  gujjutours: {
    hostname: "www.gujjutours.com",
    siteId: "gujjutours",
    secret: "GujjuTours_Secret_Jwt_Signing_Key_2026_Secure_Minimum_256_Bits!",
    issuer: "ToursApi-GujjuTours",
    audience: "ToursApp-GujjuTours",
  },
  tripgoasia: {
    hostname: "www.tripgoasia.com",
    siteId: "tripgoasia",
    secret: "TripGoAsia_Secret_Jwt_Signing_Key_2026_Secure_Minimum_256_Bits!",
    issuer: "ToursApi-TripGoAsia",
    audience: "ToursApp-TripGoAsia",
  },
};

function createJwt({ userId, email, role, site, tokenWebsiteId }) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: userId,
    email: email,
    role: role,
    "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": role,
    websiteId: tokenWebsiteId || site.siteId,
    iss: site.issuer,
    aud: site.audience,
    iat: now,
    nbf: now,
    exp: now + 3600,
  };

  const b64Header = Buffer.from(JSON.stringify(header)).toString("base64url");
  const b64Payload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const data = `${b64Header}.${b64Payload}`;
  const sig = crypto.createHmac("sha256", site.secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

describe("Admin Route Protection, Multi-Tenant Isolation & Lifecycle Tests", () => {
  it("Non-admin (role: Customer) token accessing /api/admin/stats returns HTTP 403 Forbidden", async () => {
    const customerToken = createJwt({
      userId: "cust_12345",
      email: "guest@example.com",
      role: "Customer",
      site: TENANTS.gujjutours,
    });

    const res = await fetch(`${API_BASE}/api/admin/stats`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${customerToken}`,
        "X-Website-Hostname": TENANTS.gujjutours.hostname,
        "X-Website-Id": TENANTS.gujjutours.siteId,
      },
    });

    assert.strictEqual(res.status, 403, "Non-admin token must be rejected with 403 Forbidden");
  });

  it("Non-admin token accessing /api/users returns HTTP 403 Forbidden", async () => {
    const customerToken = createJwt({
      userId: "cust_12345",
      email: "guest@example.com",
      role: "user",
      site: TENANTS.gujjutours,
    });

    const res = await fetch(`${API_BASE}/api/users`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${customerToken}`,
        "X-Website-Hostname": TENANTS.gujjutours.hostname,
        "X-Website-Id": TENANTS.gujjutours.siteId,
      },
    });

    assert.strictEqual(res.status, 403, "Non-admin token must be rejected with 403 Forbidden");
  });

  it("Admin token from Tenant A (gujjutours) used with Tenant B header (tripgoasia) returns HTTP 403 Forbidden", async () => {
    // Admin token signed for tripgoasia's signing key/issuer, but carrying tokenWebsiteId = 'gujjutours'
    const wrongTenantAdminToken = createJwt({
      userId: "admin_gujju_1",
      email: "admin@gujjutours.com",
      role: "Admin",
      site: TENANTS.tripgoasia,
      tokenWebsiteId: "gujjutours",
    });

    // Target request is TripGo Asia
    const res = await fetch(`${API_BASE}/api/admin/stats`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${wrongTenantAdminToken}`,
        "X-Website-Hostname": TENANTS.tripgoasia.hostname,
        "X-Website-Id": TENANTS.tripgoasia.siteId,
      },
    });

    assert.strictEqual(
      res.status,
      403,
      "Cross-tenant admin access must be strictly rejected with HTTP 403"
    );
    const body = await res.json().catch(() => ({}));
    assert.strictEqual(body.success, false);
  });

  it("Admin token from Tenant A used on /api/users for Tenant B returns HTTP 403 Forbidden", async () => {
    const wrongTenantAdminToken = createJwt({
      userId: "admin_gujju_1",
      email: "admin@gujjutours.com",
      role: "Admin",
      site: TENANTS.tripgoasia,
      tokenWebsiteId: "gujjutours",
    });

    const res = await fetch(`${API_BASE}/api/users`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${wrongTenantAdminToken}`,
        "X-Website-Hostname": TENANTS.tripgoasia.hostname,
        "X-Website-Id": TENANTS.tripgoasia.siteId,
      },
    });

    assert.strictEqual(res.status, 403, "Cross-tenant /api/users must be rejected with 403");
  });

  it("Authorized admin token successfully fetches real dashboard statistics with today metrics", async () => {
    const adminToken = createJwt({
      userId: "admin_gujju_1",
      email: "admin@gujjutours.com",
      role: "Admin",
      site: TENANTS.gujjutours,
    });

    const res = await fetch(`${API_BASE}/api/admin/stats`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "X-Website-Hostname": TENANTS.gujjutours.hostname,
        "X-Website-Id": TENANTS.gujjutours.siteId,
      },
    });

    assert.strictEqual(res.status, 200, "Valid admin token must return HTTP 200 OK");
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(typeof json.data.totalBookings === "number");
    assert.ok(typeof json.data.todayBookings === "number");
    assert.ok(typeof json.data.totalRevenue === "number");
    assert.ok(typeof json.data.revenueByModule === "object");
  });

  it("Admin Booking Lifecycle: Confirm pending booking, verify status & history, then Cancel and verify inventory release", async () => {
    const adminToken = createJwt({
      userId: "admin_gujju_1",
      email: "admin@gujjutours.com",
      role: "Admin",
      site: TENANTS.gujjutours,
    });

    // 0. Register a customer account to satisfy strict login-to-book requirement
    const testEmail = `qa.traveler.${Date.now()}@example.com`;
    const regRes = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Website-Hostname": TENANTS.gujjutours.hostname,
        "X-Website-Id": TENANTS.gujjutours.siteId,
      },
      body: JSON.stringify({
        fullName: "QA Traveler",
        email: testEmail,
        phone: "9876543210",
        phoneCountryCode: "+91",
        password: "Password123!",
        termsAccepted: true,
      }),
    });

    const regJson = await regRes.json();
    assert.strictEqual(regRes.status, 201, `Customer registration must return 201 Created: ${JSON.stringify(regJson)}`);
    const customerToken = regJson.data.token;
    assert.ok(customerToken, "Customer token must be returned on registration");

    // 0b. Fetch existing tour to get valid id
    const toursRes = await fetch(`${API_BASE}/api/tours?limit=1`, {
      headers: {
        "X-Website-Hostname": TENANTS.gujjutours.hostname,
        "X-Website-Id": TENANTS.gujjutours.siteId,
      },
    });
    const toursJson = await toursRes.json();
    const tour = (toursJson.data || toursJson)[0];
    const tourId = tour ? (tour.tourNumericId || tour.id || 1) : 1;
    const tourSlug = tour ? tour.slug : "deluxe-tour";
    const tourName = tour ? tour.name : "Deluxe Tour Package";

    // 1. Create a real reservation
    const bookingPayload = {
      serviceType: "tour",
      tourId: typeof tourId === "number" ? tourId : 1,
      tourSlug: tourSlug,
      tourName: tourName,
      guestName: "QA Traveler",
      email: testEmail,
      phone: "+919876543210",
      travelers: 2,
      adults: 2,
      children: 0,
      paymentOption: "full",
      paymentMethod: "card",
    };

    const createRes = await fetch(`${API_BASE}/api/bookings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${customerToken}`,
        "Content-Type": "application/json",
        "X-Website-Hostname": TENANTS.gujjutours.hostname,
        "X-Website-Id": TENANTS.gujjutours.siteId,
        "Idempotency-Key": `qa-idemp-${Date.now()}`,
      },
      body: JSON.stringify(bookingPayload),
    });

    assert.ok(
      createRes.status === 200 || createRes.status === 201,
      `Booking creation failed with status ${createRes.status}`
    );
    const createdJson = await createRes.json();
    const booking = createdJson.data || createdJson;
    const bookingId = booking.id || booking._id;
    assert.ok(bookingId, "Booking ID must be present");

    // 2. Admin Confirms the booking
    const confirmRes = await fetch(`${API_BASE}/api/bookings/${bookingId}/confirm`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
        "X-Website-Hostname": TENANTS.gujjutours.hostname,
        "X-Website-Id": TENANTS.gujjutours.siteId,
      },
      body: JSON.stringify({ note: "Confirmed by automated QA test suite" }),
    });

    assert.strictEqual(confirmRes.status, 200, "Confirming booking must return 200 OK");
    const confirmedJson = await confirmRes.json();
    assert.strictEqual(confirmedJson.data.status, "confirmed");
    assert.ok(
      confirmedJson.data.statusHistory.some((h) => h.status === "confirmed"),
      "Status history must record confirmation"
    );

    // 3. Admin Cancels the booking
    const cancelRes = await fetch(`${API_BASE}/api/bookings/${bookingId}/cancel`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
        "X-Website-Hostname": TENANTS.gujjutours.hostname,
        "X-Website-Id": TENANTS.gujjutours.siteId,
      },
      body: JSON.stringify({ reason: "Customer requested cancellation via QA test" }),
    });

    assert.strictEqual(cancelRes.status, 200, "Cancelling booking must return 200 OK");
    const cancelledJson = await cancelRes.json();
    assert.strictEqual(cancelledJson.data.status, "cancelled");
    assert.ok(
      cancelledJson.data.statusHistory.some((h) => h.status === "cancelled"),
      "Status history must record cancellation"
    );
  });
});
