const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

describe("Build Package Module Web Tests", () => {
  const sites = [
    { id: "gujjutours", currency: "INR", symbol: "₹" },
    { id: "tripgoasia", currency: "USD", symbol: "$" },
    { id: "technoheaven", currency: "AED", symbol: "AED " },
  ];

  for (const { id: site, currency, symbol } of sites) {
    describe(`Site: ${site}`, () => {
      const seedDir = path.join(__dirname, "../../seed", site);
      const buildPackagePath = path.join(seedDir, "build-package-options.json");
      const categoriesPath = path.join(seedDir, "categories.json");

      test("Seed files exist for site", () => {
        assert.ok(fs.existsSync(buildPackagePath), `build-package-options.json must exist at ${buildPackagePath}`);
        assert.ok(fs.existsSync(categoriesPath), `categories.json must exist at ${categoriesPath}`);
      });

      test("Build Package seed contains at least 10 valid destination options with local assets", () => {
        const raw = fs.readFileSync(buildPackagePath, "utf-8");
        const options = JSON.parse(raw);
        assert.ok(Array.isArray(options), "Options must be an array");
        assert.ok(options.length >= 10, `Expected >= 10 destination options, got ${options.length}`);

        for (const opt of options) {
          assert.ok(opt.destinationName, "Option must have destinationName");
          assert.ok(opt.destinationSlug, "Option must have destinationSlug");
          assert.ok(opt.country, "Option must have country");
          assert.ok(opt.flag, "Option must have flag emoji");
          assert.ok(opt.tagline, "Option must have tagline");
          assert.ok(opt.badge, "Option must have badge");
          assert.ok(opt.startingPrice > 0, "Starting price must be positive");
          assert.equal(opt.currency, currency, `Currency must match site ${currency}`);
          assert.equal(opt.currencySymbol, symbol, `Currency symbol must match site ${symbol}`);
          assert.ok(opt.rating >= 4.0 && opt.rating <= 5.0, "Rating between 4.0 and 5.0");

          // Verify images are local SVGs
          assert.ok(
            opt.image.startsWith("/seed-images/buildpackage/"),
            `Image ${opt.image} must be a local SVG, not an external hotlink`
          );
        }
      });

      test("Each destination has complete customizable component suites", () => {
        const raw = fs.readFileSync(buildPackagePath, "utf-8");
        const options = JSON.parse(raw);

        for (const opt of options) {
          // Durations (at least 4 tiers)
          assert.ok(Array.isArray(opt.durations) && opt.durations.length >= 4, `${opt.destinationSlug} must have >= 4 durations`);
          for (const d of opt.durations) {
            assert.ok(d.id && d.label && d.nights > 0 && d.days > 0, "Duration must be valid");
            assert.ok(d.priceMultiplier >= 1.0, "Duration multiplier must be >= 1.0");
          }

          // Flight options (at least 3 choices: Economy, Business, None)
          assert.ok(Array.isArray(opt.flightOptions) && opt.flightOptions.length >= 3, `${opt.destinationSlug} must have >= 3 flight options`);
          const hasNoneFlight = opt.flightOptions.some((f) => f.type === "None" && f.pricePerPerson === 0);
          assert.ok(hasNoneFlight, "Must have an option for self-arranged flights (0 cost)");

          // Hotel tiers (at least 3 tiers)
          assert.ok(Array.isArray(opt.hotelTiers) && opt.hotelTiers.length >= 3, `${opt.destinationSlug} must have >= 3 hotel tiers`);
          for (const h of opt.hotelTiers) {
            assert.ok(h.id && h.tierName && h.hotelName, "Hotel must have valid metadata");
            assert.ok(h.starRating >= 3 && h.starRating <= 5, "Star rating between 3 and 5");
            assert.ok(h.pricePerPerson > 0, "Hotel price must be positive");
          }

          // Activities (at least 5 checkable activities)
          assert.ok(Array.isArray(opt.activityOptions) && opt.activityOptions.length >= 5, `${opt.destinationSlug} must have >= 5 activities`);
          const hasRecommended = opt.activityOptions.some((a) => a.isRecommended);
          assert.ok(hasRecommended, "Must have at least one recommended activity");

          // Transfers (at least 2 transfer options)
          assert.ok(Array.isArray(opt.transferOptions) && opt.transferOptions.length >= 2, `${opt.destinationSlug} must have >= 2 transfer choices`);

          // Visa options (at least 2 visa options)
          assert.ok(Array.isArray(opt.visaOptions) && opt.visaOptions.length >= 2, `${opt.destinationSlug} must have >= 2 visa choices`);

          // Meal plans (at least 3 meal plans)
          assert.ok(Array.isArray(opt.mealPlans) && opt.mealPlans.length >= 3, `${opt.destinationSlug} must have >= 3 meal plans`);
          const hasBreakfast = opt.mealPlans.some((m) => m.id === "breakfast-only" && m.pricePerPerson === 0);
          assert.ok(hasBreakfast, "Must include complimentary breakfast option");
        }
      });

      if (site === "technoheaven") {
        test("Technoheaven includes B2B Net and Gross pricing across all components", () => {
          const raw = fs.readFileSync(buildPackagePath, "utf-8");
          const options = JSON.parse(raw);

          for (const opt of options) {
            assert.ok(opt.netStartingPrice !== null && opt.netStartingPrice > 0, "Must have netStartingPrice");
            assert.ok(opt.netStartingPrice < opt.startingPrice, "Net price must be lower than gross price");

            for (const h of opt.hotelTiers) {
              assert.ok(h.netPricePerPerson !== null && h.netPricePerPerson > 0, "Hotel must have netPricePerPerson");
            }
          }
        });
      }

      test("Categories seed contains buildpackage module category", () => {
        const raw = fs.readFileSync(categoriesPath, "utf-8");
        const categories = JSON.parse(raw);
        const bpCat = categories.find((c) => c.module === "buildpackage" && c.slug === "custom-package-builder");
        assert.ok(bpCat, "Categories must contain buildpackage/custom-package-builder");
        assert.equal(bpCat.enabled, true, "Category must be enabled");
      });
    });
  }

  test("Local SVG placeholder assets exist on disk for all build package components", () => {
    const assetsDir = path.join(__dirname, "../../web/public/seed-images/buildpackage");
    const requiredSvgFiles = [
      "build-destination.svg",
      "build-flight.svg",
      "build-hotel.svg",
      "build-activity.svg",
      "build-transfer.svg",
      "build-visa.svg",
    ];

    for (const file of requiredSvgFiles) {
      const fullPath = path.join(assetsDir, file);
      assert.ok(fs.existsSync(fullPath), `SVG placeholder ${file} must exist at ${fullPath}`);
    }
  });
});

