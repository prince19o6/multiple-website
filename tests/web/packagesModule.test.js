const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

describe("Holiday Packages Module Web Tests", () => {
  const sites = ["gujjutours", "tripgoasia", "technoheaven"];

  for (const site of sites) {
    describe(`Site: ${site}`, () => {
      const seedDir = path.join(__dirname, "../../seed", site);
      const packagesPath = path.join(seedDir, "packages.json");
      const categoriesPath = path.join(seedDir, "categories.json");

      test("Seed files exist for site", () => {
        assert.ok(fs.existsSync(packagesPath), `packages.json must exist at ${packagesPath}`);
        assert.ok(fs.existsSync(categoriesPath), `categories.json must exist at ${categoriesPath}`);
      });

      test("Packages seed contains at least 50 valid items with local assets", () => {
        const raw = fs.readFileSync(packagesPath, "utf-8");
        const packages = JSON.parse(raw);
        assert.ok(Array.isArray(packages), "Packages must be an array");
        assert.ok(packages.length >= 50, `Expected >= 50 holiday packages, got ${packages.length}`);

        for (const pkg of packages) {
          assert.ok(pkg.title || pkg.name, "Package must have a title");
          assert.ok(pkg.slug, "Package must have a slug");
          assert.ok(pkg.city || pkg.destination, "Package must have city/destination");
          assert.ok(pkg.citiesCovered, "Package must have citiesCovered summary");
          assert.ok(pkg.category, "Package must have a category");
          assert.ok(pkg.categorySlug, "Package must have a categorySlug");
          assert.ok((pkg.startingPrice || pkg.price) > 0, "Package starting price must be positive");
          assert.ok(pkg.rating >= 3.5 && pkg.rating <= 5.0, "Package rating between 3.5 and 5.0");
          assert.ok(Array.isArray(pkg.hotelStays) && pkg.hotelStays.length >= 1, "Package must have hotelStays");
          assert.ok(Array.isArray(pkg.itinerary) && pkg.itinerary.length >= 2, "Package must have multi-day itinerary");
          assert.ok(Array.isArray(pkg.inclusions) && pkg.inclusions.length >= 2, "Package must have inclusions");
          assert.ok(Array.isArray(pkg.exclusions) && pkg.exclusions.length >= 2, "Package must have exclusions");

          // Verify images do NOT hotlink external domains
          if (Array.isArray(pkg.images)) {
            for (const img of pkg.images) {
              assert.ok(
                img.startsWith("/seed-images/") || img.startsWith("/assets/"),
                `Image ${img} must be a local SVG/WebP placeholder, not an external hotlink`
              );
            }
          }
        }
      });

      test("Taxonomy covers all required holiday themes", () => {
        const raw = fs.readFileSync(packagesPath, "utf-8");
        const packages = JSON.parse(raw);
        const categories = packages.map((p) => p.categorySlug.toLowerCase());

        const requiredThemes = [
          "scenic-escapes",
          "spiritual-escapes",
          "visa-free-escapes",
          "honeymoon-getaways",
          "dubai-packages",
          "jain-packages",
          "domestic-holidays",
          "international-packages"
        ];

        for (const theme of requiredThemes) {
          assert.ok(
            categories.includes(theme),
            `Expected packages to include theme "${theme}" for site ${site}`
          );
        }
      });

      if (site === "gujjutours") {
        test("GujjuTours holiday packages include dedicated Pure Veg & Jain features", () => {
          const raw = fs.readFileSync(packagesPath, "utf-8");
          const packages = JSON.parse(raw);
          const vegPackages = packages.filter((p) => p.dietaryFeatures && p.dietaryFeatures.pureVeg);
          const jainPackages = packages.filter((p) => p.dietaryFeatures && p.dietaryFeatures.jainAvailable);

          assert.ok(vegPackages.length >= 20, "Expected at least 20 Pure Veg packages for GujjuTours");
          assert.ok(jainPackages.length >= 20, "Expected at least 20 Jain-friendly packages for GujjuTours");
        });
      }
    });
  }
});
