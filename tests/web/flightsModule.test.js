const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

describe("Flights Module Web Tests", () => {
  const sites = ["gujjutours", "tripgoasia", "technoheaven"];

  for (const site of sites) {
    describe(`Site: ${site}`, () => {
      const seedDir = path.join(__dirname, "../../seed", site);
      const flightsPath = path.join(seedDir, "flights.json");
      const routesPath = path.join(seedDir, "flight-routes.json");

      test("Seed files exist for site", () => {
        assert.ok(fs.existsSync(flightsPath), `flights.json must exist at ${flightsPath}`);
        assert.ok(fs.existsSync(routesPath), `flight-routes.json must exist at ${routesPath}`);
      });

      test("Flights seed contains at least 50 valid items with local assets", () => {
        const raw = fs.readFileSync(flightsPath, "utf-8");
        const flights = JSON.parse(raw);
        assert.ok(Array.isArray(flights), "Flights must be an array");
        assert.ok(flights.length >= 50, `Expected >= 50 scheduled flights, got ${flights.length}`);

        for (const f of flights) {
          assert.ok(f.flightNumber, "Flight must have a flightNumber");
          assert.ok(f.airline, "Flight must have an airline");
          assert.ok(f.airlineCode, "Flight must have an airlineCode");
          assert.ok(f.fromAirport && f.fromAirport.code, "Flight must have fromAirport code");
          assert.ok(f.toAirport && f.toAirport.code, "Flight must have toAirport code");
          assert.ok(f.departureTime, "Flight must have departureTime");
          assert.ok(f.arrivalTime, "Flight must have arrivalTime");
          assert.ok(f.duration, "Flight must have duration");
          assert.ok(f.price > 0, "Flight price must be positive");
          assert.ok(f.cabinClass, "Flight must have cabinClass");
          assert.ok(f.baggage && f.baggage.cabin, "Flight must have baggage info");
          assert.ok(f.meals && typeof f.meals.included === "boolean", "Flight must have meals info");

          // Verify airline logo uses local SVG
          assert.ok(
            f.airlineLogo.startsWith("/seed-images/flights/") || f.airlineLogo.startsWith("/assets/"),
            `Airline logo ${f.airlineLogo} must be local SVG, not external hotlink`
          );
        }
      });

      test("Flight routes seed contains popular routes with domestic and international breakdown", () => {
        const raw = fs.readFileSync(routesPath, "utf-8");
        const routes = JSON.parse(raw);
        assert.ok(Array.isArray(routes), "Routes must be an array");
        assert.ok(routes.length >= 8, `Expected >= 8 popular routes, got ${routes.length}`);

        const hasDomestic = routes.some((r) => r.isDomestic);
        const hasInternational = routes.some((r) => !r.isDomestic);

        assert.ok(hasDomestic, "Must have domestic popular routes");
        assert.ok(hasInternational, "Must have international popular routes");

        for (const r of routes) {
          assert.ok(r.routeSlug, "Route must have routeSlug");
          assert.ok(r.fromCode && r.toCode, "Route must have airport codes");
          assert.ok(r.startingPrice > 0, "Route starting price must be positive");
          assert.ok(
            r.image.startsWith("/seed-images/flights/") || r.image.startsWith("/assets/"),
            `Route image ${r.image} must be a local SVG, not external hotlink`
          );
        }
      });

      if (site === "gujjutours") {
        test("GujjuTours flights guarantee hot Pure Veg & Jain in-flight meals", () => {
          const raw = fs.readFileSync(flightsPath, "utf-8");
          const flights = JSON.parse(raw);
          const vegFlights = flights.filter((f) => f.meals && f.meals.pureVegGuaranteed);
          const jainFlights = flights.filter((f) => f.meals && f.meals.jainMealAvailable);

          assert.ok(vegFlights.length >= 30, "Expected >= 30 Pure Veg flights in GujjuTours");
          assert.ok(jainFlights.length >= 30, "Expected >= 30 Jain meal flights in GujjuTours");
        });
      }
    });
  }
});

