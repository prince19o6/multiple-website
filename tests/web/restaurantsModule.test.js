const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

describe("Restaurants Module Web Tests", () => {
  const sites = [
    { id: "gujjutours", currency: "INR" },
    { id: "tripgoasia", currency: "USD" },
    { id: "technoheaven", currency: "AED" },
  ];

  const requiredCuisines = [
    "indian",
    "gujarati-thali",
    "jain",
    "vegetarian",
    "asian",
    "seafood",
    "fine-dining",
    "cafe",
    "street-food",
  ];

  for (const { id: site, currency } of sites) {
    describe(`Site: ${site}`, () => {
      const seedDir = path.join(__dirname, "../../seed", site);
      const restaurantsPath = path.join(seedDir, "restaurants.json");

      test("Seed files exist for site", () => {
        assert.ok(fs.existsSync(restaurantsPath), `restaurants.json must exist at ${restaurantsPath}`);
      });

      test("Restaurants seed contains at least 90 valid items with local assets", () => {
        const raw = fs.readFileSync(restaurantsPath, "utf-8");
        const restaurants = JSON.parse(raw);
        assert.ok(Array.isArray(restaurants), "Restaurants must be an array");
        assert.ok(restaurants.length >= 90, `Expected >= 90 restaurants, got ${restaurants.length}`);

        for (const r of restaurants) {
          assert.ok(r.title || r.name, "Restaurant must have title");
          assert.ok(r.slug, "Restaurant must have slug");
          assert.ok(r.cuisine, "Restaurant must have cuisine");
          assert.ok(r.cuisineLabel, "Restaurant must have cuisineLabel");
          assert.ok(r.city, "Restaurant must have city");
          assert.ok(r.address, "Restaurant must have address");
          assert.ok(r.priceRange, "Restaurant must have priceRange");
          assert.ok(r.costForTwo > 0, "Cost for two must be positive");
          assert.equal(r.currency, currency, `Currency must match site ${currency}`);
          assert.ok(r.rating >= 3.8 && r.rating <= 5.0, "Rating between 3.8 and 5.0");
          assert.ok(Array.isArray(r.specialties) && r.specialties.length >= 2, "Must have specialties");

          // Verify images are local SVGs
          assert.ok(
            r.image.startsWith("/seed-images/restaurants/"),
            `Image ${r.image} must be a local SVG, not an external hotlink`
          );
        }
      });

      test("Covers all 9 required cuisines with at least 10 items in EVERY cuisine", () => {
        const raw = fs.readFileSync(restaurantsPath, "utf-8");
        const restaurants = JSON.parse(raw);

        for (const cuisine of requiredCuisines) {
          const count = restaurants.filter(
            (r) => r.cuisine.toLowerCase() === cuisine.toLowerCase()
          ).length;
          assert.ok(
            count >= 10,
            `Site ${site} must have >= 10 items for cuisine '${cuisine}', found ${count}`
          );
        }
      });

      test("Includes Pure Veg and Jain options for travelers", () => {
        const raw = fs.readFileSync(restaurantsPath, "utf-8");
        const restaurants = JSON.parse(raw);

        const pureVegCount = restaurants.filter((r) => r.isPureVeg).length;
        const jainCount = restaurants.filter((r) => r.isJainAvailable).length;

        assert.ok(pureVegCount >= 10, `Site ${site} must have >= 10 Pure Veg options, found ${pureVegCount}`);
        assert.ok(jainCount >= 10, `Site ${site} must have >= 10 Jain options, found ${jainCount}`);
      });

      test("Unique slugs and numeric IDs per site", () => {
        const raw = fs.readFileSync(restaurantsPath, "utf-8");
        const restaurants = JSON.parse(raw);
        const slugs = restaurants.map((r) => r.slug);
        const ids = restaurants.map((r) => r.id);

        assert.equal(slugs.length, new Set(slugs).size, "All restaurant slugs must be unique");
        assert.equal(ids.length, new Set(ids).size, "All restaurant IDs must be unique");
      });
    });
  }
});

