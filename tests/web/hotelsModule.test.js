const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

describe("Hotels Module Web Tests", () => {
  const sites = ["gujjutours", "tripgoasia", "technoheaven"];

  for (const site of sites) {
    describe(`Site: ${site}`, () => {
      const seedDir = path.join(__dirname, "../../seed", site);
      const hotelsPath = path.join(seedDir, "hotels.json");
      const categoriesPath = path.join(seedDir, "categories.json");

      test("Seed files exist for site", () => {
        assert.ok(fs.existsSync(hotelsPath), `hotels.json must exist at ${hotelsPath}`);
        assert.ok(fs.existsSync(categoriesPath), `categories.json must exist at ${categoriesPath}`);
      });

      test("Hotels seed contains at least 50 valid items with local assets", () => {
        const raw = fs.readFileSync(hotelsPath, "utf-8");
        const hotels = JSON.parse(raw);
        assert.ok(Array.isArray(hotels), "Hotels must be an array");
        assert.ok(hotels.length >= 50, `Expected >= 50 hotels, got ${hotels.length}`);

        for (const h of hotels) {
          assert.ok(h.title, "Hotel must have a title");
          assert.ok(h.slug, "Hotel must have a slug");
          assert.ok(h.destination?.cityName, "Hotel destination must have cityName");
          assert.ok(h.propertyType, "Hotel must have a propertyType");
          assert.ok(h.pricePerNight > 0, "Hotel pricePerNight must be positive");
          assert.ok(h.starRating >= 3 && h.starRating <= 5, "Hotel starRating between 3 and 5");
          assert.ok(Array.isArray(h.rooms) && h.rooms.length > 0, "Hotel must have at least 1 room option");

          // Verify images do NOT hotlink external domains
          if (Array.isArray(h.images)) {
            for (const img of h.images) {
              assert.ok(
                img.startsWith("/seed-images/") || img.startsWith("/assets/"),
                `Image ${img} must be a local SVG/WebP placeholder, not an external hotlink`
              );
            }
          }
        }
      });

      test("Categories seed contains hotel property types", () => {
        const raw = fs.readFileSync(categoriesPath, "utf-8");
        const categories = JSON.parse(raw);
        assert.ok(Array.isArray(categories));
        const hotelCats = categories.filter((c) => c.module === "hotels");
        assert.ok(hotelCats.length >= 6, `Expected >= 6 hotel categories, got ${hotelCats.length}`);

        const slugs = hotelCats.map((c) => c.slug);
        assert.ok(slugs.includes("hotel"));
        assert.ok(slugs.includes("resort"));
        assert.ok(slugs.includes("villa"));
      });
    });
  }

  test("Gujju Tours has dietary features (Pure Veg & Jain) represented", () => {
    const raw = fs.readFileSync(path.join(__dirname, "../../seed/gujjutours/hotels.json"), "utf-8");
    const hotels = JSON.parse(raw);
    const pureVegCount = hotels.filter((h) => h.dietaryFeatures?.pureVeg === true).length;
    const jainCount = hotels.filter((h) => h.dietaryFeatures?.jainAvailable === true).length;

    assert.ok(pureVegCount >= 10, `Expected >= 10 Pure Veg hotels, got ${pureVegCount}`);
    assert.ok(jainCount >= 10, `Expected >= 10 Jain-available hotels, got ${jainCount}`);
  });
});
