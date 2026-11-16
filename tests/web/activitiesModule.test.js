const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

describe("Activities & Tours Module Web Tests", () => {
  const sites = ["gujjutours", "tripgoasia", "technoheaven"];

  for (const site of sites) {
    describe(`Site: ${site}`, () => {
      const seedDir = path.join(__dirname, "../../seed", site);
      const activitiesPath = path.join(seedDir, "activities.json");
      const categoriesPath = path.join(seedDir, "categories.json");

      test("Seed files exist for site", () => {
        assert.ok(fs.existsSync(activitiesPath), `activities.json must exist at ${activitiesPath}`);
        assert.ok(fs.existsSync(categoriesPath), `categories.json must exist at ${categoriesPath}`);
      });

      test("Activities seed contains at least 50 valid items with local assets", () => {
        const raw = fs.readFileSync(activitiesPath, "utf-8");
        const activities = JSON.parse(raw);
        assert.ok(Array.isArray(activities), "Activities must be an array");
        assert.ok(activities.length >= 50, `Expected >= 50 activities, got ${activities.length}`);

        for (const act of activities) {
          assert.ok(act.title || act.name, "Activity must have a title");
          assert.ok(act.slug, "Activity must have a slug");
          assert.ok(act.city || act.destination, "Activity must have city/destination");
          assert.ok(act.category, "Activity must have a category");
          assert.ok(act.categorySlug, "Activity must have a categorySlug");
          assert.ok(act.price > 0, "Activity price must be positive");
          assert.ok(act.rating >= 3.5 && act.rating <= 5.0, "Activity rating between 3.5 and 5.0");
          assert.ok(Array.isArray(act.packageOptions) && act.packageOptions.length >= 2, "Activity must have at least 2 package options");

          // Verify images do NOT hotlink external domains
          if (Array.isArray(act.images)) {
            for (const img of act.images) {
              assert.ok(
                img.startsWith("/seed-images/") || img.startsWith("/assets/"),
                `Image ${img} must be a local SVG/WebP placeholder, not an external hotlink`
              );
            }
          }
        }
      });

      test("Categories seed contains activities categories", () => {
        const raw = fs.readFileSync(categoriesPath, "utf-8");
        const categories = JSON.parse(raw);
        assert.ok(Array.isArray(categories));
        const activityCats = categories.filter((c) => c.module === "activities" || c.module === "tours");
        assert.ok(activityCats.length >= 8, `Expected >= 8 activity categories, got ${activityCats.length}`);

        const slugs = activityCats.map((c) => c.slug);
        assert.ok(slugs.includes("desert-safari"));
        assert.ok(slugs.includes("water-sports"));
        assert.ok(slugs.includes("city-tours"));
        assert.ok(slugs.includes("theme-parks"));
      });
    });
  }

  test("Gujju Tours has dietary features (Pure Veg & Jain) represented", () => {
    const raw = fs.readFileSync(path.join(__dirname, "../../seed/gujjutours/activities.json"), "utf-8");
    const activities = JSON.parse(raw);
    const pureVegCount = activities.filter((a) => a.dietaryFeatures?.pureVeg === true).length;
    const jainCount = activities.filter((a) => a.dietaryFeatures?.jainAvailable === true).length;

    assert.ok(pureVegCount >= 10, `Expected >= 10 Pure Veg activities, got ${pureVegCount}`);
    assert.ok(jainCount >= 10, `Expected >= 10 Jain-available activities, got ${jainCount}`);
  });
});

