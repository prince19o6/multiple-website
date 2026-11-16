const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

describe("Transfers Module Web Tests", () => {
  const sites = ["gujjutours", "tripgoasia", "technoheaven"];

  for (const site of sites) {
    describe(`Site: ${site}`, () => {
      const seedDir = path.join(__dirname, "../../seed", site);
      const transfersPath = path.join(seedDir, "transfers.json");

      test("Seed files exist for site", () => {
        assert.ok(fs.existsSync(transfersPath), `transfers.json must exist at ${transfersPath}`);
      });

      test("Transfers seed contains at least 50 valid items with local assets", () => {
        const raw = fs.readFileSync(transfersPath, "utf-8");
        const transfers = JSON.parse(raw);
        assert.ok(Array.isArray(transfers), "Transfers must be an array");
        assert.ok(transfers.length >= 50, `Expected >= 50 transfers, got ${transfers.length}`);

        for (const t of transfers) {
          assert.ok(t.title || t.name, "Transfer must have title");
          assert.ok(t.slug, "Transfer must have slug");
          assert.ok(t.transferType, "Transfer must have transferType");
          assert.ok(t.vehicleType, "Transfer must have vehicleType");
          assert.ok(t.vehicleModel, "Transfer must have vehicleModel");
          assert.ok(t.pickupLocation, "Transfer must have pickupLocation");
          assert.ok(t.dropoffLocation, "Transfer must have dropoffLocation");
          assert.ok(t.city, "Transfer must have city");
          assert.ok(t.price > 0, "Transfer price must be positive");
          assert.ok(t.maxPassengers >= 2, "Max passengers must be at least 2");
          assert.ok(t.rating >= 3.5 && t.rating <= 5.0, "Rating between 3.5 and 5.0");

          // Verify images are local SVGs
          assert.ok(
            t.image.startsWith("/seed-images/transfers/") || t.image.startsWith("/assets/"),
            `Image ${t.image} must be a local SVG, not an external hotlink`
          );
        }
      });

      test("Covers all 4 core vehicle categories", () => {
        const raw = fs.readFileSync(transfersPath, "utf-8");
        const transfers = JSON.parse(raw);
        const types = transfers.map((t) => t.vehicleType.toLowerCase());

        assert.ok(types.includes("sedan"), "Must include Sedan");
        assert.ok(types.includes("suv"), "Must include SUV");
        assert.ok(types.includes("van"), "Must include Van");
        assert.ok(types.includes("luxury"), "Must include Luxury");
      });

      test("Covers required transfer types (Airport, Attraction, Hotel)", () => {
        const raw = fs.readFileSync(transfersPath, "utf-8");
        const transfers = JSON.parse(raw);
        const types = transfers.map((t) => t.transferType.toLowerCase());

        assert.ok(types.includes("airport"), "Must include Airport transfers");
        assert.ok(types.includes("attraction"), "Must include Attraction transfers");
        assert.ok(types.includes("hotel"), "Must include Hotel transfers");
      });
    });
  }
});

