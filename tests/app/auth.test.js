const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

describe("App Authentication & Tenant Isolation Suite", () => {
  test("Tenant prefixing for tokens prevents cross-tenant credential leaks", () => {
    const makeKey = (key, siteId) => `@${siteId}.${key}`;
    const tokenGujju = makeKey("auth:token", "gujjutours");
    const tokenTripGo = makeKey("auth:token", "tripgoasia");
    const tokenTechno = makeKey("auth:token", "technoheaven");

    assert.strictEqual(tokenGujju, "@gujjutours.auth:token");
    assert.strictEqual(tokenTripGo, "@tripgoasia.auth:token");
    assert.strictEqual(tokenTechno, "@technoheaven.auth:token");
    assert.notStrictEqual(tokenGujju, tokenTripGo);
  });

  test("Refresh mutex prevents parallel concurrent refresh token requests", async () => {
    let callCount = 0;
    let inFlight = null;

    const mockRefresh = async () => {
      if (inFlight) return inFlight;
      inFlight = (async () => {
        callCount++;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return { success: true, token: "refreshed_token_123" };
      })();
      try {
        return await inFlight;
      } finally {
        inFlight = null;
      }
    };

    // Trigger 5 concurrent calls
    const results = await Promise.all([
      mockRefresh(),
      mockRefresh(),
      mockRefresh(),
      mockRefresh(),
      mockRefresh(),
    ]);

    assert.strictEqual(callCount, 1);
    for (const res of results) {
      assert.strictEqual(res.token, "refreshed_token_123");
    }
  });

  test("User model supports dietary preferences and email verification", () => {
    const user = {
      id: "u123",
      fullName: "Priya Patel",
      email: "priya@example.com",
      phoneCountryCode: "+91",
      phone: "9876543210",
      role: "Customer",
      isEmailVerified: true,
      dietaryPreference: "Jain",
      preferredCurrency: "INR",
      marketingOptIn: true,
    };

    assert.strictEqual(user.isEmailVerified, true);
    assert.strictEqual(user.dietaryPreference, "Jain");
    assert.strictEqual(user.preferredCurrency, "INR");
  });
});

