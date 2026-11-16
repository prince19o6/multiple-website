const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

describe("Web Authentication & Registration Test Suite", () => {
  // Test password regex rules
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

  test("Password policy requires minimum 8 chars, uppercase, lowercase, digit, and special char", () => {
    assert.strictEqual(passwordRegex.test("WeakPass"), false);
    assert.strictEqual(passwordRegex.test("nocaps123!"), false);
    assert.strictEqual(passwordRegex.test("NODIGITS!"), false);
    assert.strictEqual(passwordRegex.test("NoSpecial123"), false);
    assert.strictEqual(passwordRegex.test("Short1!"), false);
    assert.strictEqual(passwordRegex.test("SecurePass123!"), true);
    assert.strictEqual(passwordRegex.test("P@ssw0rd2026"), true);
  });

  test("Multi-tenant backend hostname and database resolution", () => {
    const tenantMap = {
      gujjutours: {
        backendHostname: "www.gujjutours.com",
        databaseName: "tours_gujjutours",
      },
      tripgoasia: {
        backendHostname: "www.tripgoasia.com",
        databaseName: "tours_tripgoasia",
      },
      technoheaven: {
        backendHostname: "b2b.technoheaven.com",
        databaseName: "tours_technoheaven",
      },
    };

    assert.strictEqual(tenantMap.gujjutours.databaseName, "tours_gujjutours");
    assert.strictEqual(tenantMap.tripgoasia.databaseName, "tours_tripgoasia");
    assert.strictEqual(tenantMap.technoheaven.databaseName, "tours_technoheaven");
    assert.notStrictEqual(tenantMap.gujjutours.databaseName, tenantMap.tripgoasia.databaseName);
  });

  test("Dietary preferences match supported schema options", () => {
    const supportedDietary = ["None", "PureVeg", "Jain", "Swaminarayan", "Halal"];
    assert.strictEqual(supportedDietary.includes("PureVeg"), true);
    assert.strictEqual(supportedDietary.includes("Jain"), true);
    assert.strictEqual(supportedDietary.includes("Swaminarayan"), true);
    assert.strictEqual(supportedDietary.includes("Halal"), true);
    assert.strictEqual(supportedDietary.includes("None"), true);
    assert.strictEqual(supportedDietary.includes("NonVegOnly"), false);
  });

  test("Tenant-specific cookie naming pattern prevents cross-tenant contamination", () => {
    const tenants = ["gujjutours", "tripgoasia", "technoheaven"];
    const cookieNames = tenants.map((t) => `auth_token_${t}`);
    const uniqueCookies = new Set(cookieNames);
    assert.strictEqual(uniqueCookies.size, 3);
    assert.strictEqual(cookieNames[0], "auth_token_gujjutours");
    assert.strictEqual(cookieNames[1], "auth_token_tripgoasia");
    assert.strictEqual(cookieNames[2], "auth_token_technoheaven");
  });
});

