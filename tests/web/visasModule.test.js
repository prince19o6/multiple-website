const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

describe("Visas Module Web Tests", () => {
  const sites = [
    { id: "gujjutours", currency: "INR" },
    { id: "tripgoasia", currency: "USD" },
    { id: "technoheaven", currency: "AED" },
  ];

  for (const { id: site, currency } of sites) {
    describe(`Site: ${site}`, () => {
      const seedDir = path.join(__dirname, "../../seed", site);
      const visasPath = path.join(seedDir, "visas.json");

      test("Seed files exist for site", () => {
        assert.ok(fs.existsSync(visasPath), `visas.json must exist at ${visasPath}`);
      });

      test("Visas seed contains at least 50 valid items with local assets", () => {
        const raw = fs.readFileSync(visasPath, "utf-8");
        const visas = JSON.parse(raw);
        assert.ok(Array.isArray(visas), "Visas must be an array");
        assert.ok(visas.length >= 50, `Expected >= 50 visas, got ${visas.length}`);

        for (const v of visas) {
          assert.ok(v.title || v.name, "Visa must have title");
          assert.ok(v.slug, "Visa must have slug");
          assert.ok(v.country, "Visa must have country");
          assert.ok(v.countryCode, "Visa must have countryCode");
          assert.ok(v.visaType, "Visa must have visaType");
          assert.ok(v.validity, "Visa must have validity");
          assert.ok(v.stayDuration, "Visa must have stayDuration");
          assert.ok(v.processingTime, "Visa must have processingTime");
          assert.ok(v.price > 0, "Visa price must be positive");
          assert.equal(v.currency, currency, `Currency must match site ${currency}`);
          assert.ok(v.approvalRate >= 98.0, "Approval rate must be >= 98.0%");
          assert.ok(Array.isArray(v.documentsRequired) && v.documentsRequired.length >= 3, "Must have >= 3 documents");

          // Verify images are local SVGs
          assert.ok(
            v.image.startsWith("/seed-images/visas/"),
            `Image ${v.image} must be a local SVG, not an external hotlink`
          );
        }
      });

      test("Covers core visa types (tourist, express, business, multiple-entry)", () => {
        const raw = fs.readFileSync(visasPath, "utf-8");
        const visas = JSON.parse(raw);
        const types = visas.map((v) => v.visaType.toLowerCase());

        assert.ok(types.includes("tourist"), "Must include Tourist eVisa");
        assert.ok(types.includes("express"), "Must include Express Fast-Track eVisa");
        assert.ok(types.includes("business"), "Must include Business eVisa");
        assert.ok(types.includes("multiple-entry"), "Must include Multiple Entry eVisa");
      });

      test("Unique slugs and numeric IDs per site", () => {
        const raw = fs.readFileSync(visasPath, "utf-8");
        const visas = JSON.parse(raw);
        const slugs = visas.map((v) => v.slug);
        const ids = visas.map((v) => v.id);

        assert.equal(slugs.length, new Set(slugs).size, "All visa slugs must be unique");
        assert.equal(ids.length, new Set(ids).size, "All visa IDs must be unique");
      });
    });
  }
});

