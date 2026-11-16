import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { resolveSiteFromHost, getSiteById, normalizeHost } from "@/lib/siteRegistry";
import { ENV } from "@/lib/env";

export const dynamic = "force-dynamic";

function loadSeedFlights(site: string): any[] {
  try {
    const seedPath = path.join(process.cwd(), "seed", site, "flights.json");
    if (fs.existsSync(seedPath)) {
      const content = fs.readFileSync(seedPath, "utf-8");
      const list = JSON.parse(content);
      return Array.isArray(list) ? list : [];
    }
  } catch (err: any) {
    console.error("[Flights API] Error reading seed:", err.message);
  }
  return [];
}

function loadSeedRoutes(site: string): any[] {
  try {
    const seedPath = path.join(process.cwd(), "seed", site, "flight-routes.json");
    if (fs.existsSync(seedPath)) {
      const content = fs.readFileSync(seedPath, "utf-8");
      const list = JSON.parse(content);
      return Array.isArray(list) ? list : [];
    }
  } catch (err: any) {
    console.error("[Flights Routes API] Error reading seed:", err.message);
  }
  return [];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rawHost =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      "";
    const host = normalizeHost(rawHost);

    const siteQuery = searchParams.get("site");
    const siteHeader = request.headers.get("x-site-id");
    const siteDef =
      resolveSiteFromHost(host) ||
      getSiteById(siteQuery) ||
      getSiteById(siteHeader) ||
      (ENV.defaultSiteId ? getSiteById(ENV.defaultSiteId) : null);

    const siteId = (siteDef?.siteId || siteQuery || process.env.SITE_ID || "gujjutours").toLowerCase();

    // Query filters
    const fromParam = searchParams.get("from") || searchParams.get("origin") || "";
    const toParam = searchParams.get("to") || searchParams.get("destination") || "";
    const cabinClassParam = searchParams.get("cabinClass") || searchParams.get("class") || "";
    const airlineParam = searchParams.get("airline") || "";
    const nonStopParam = searchParams.get("nonStop") || searchParams.get("directOnly");
    const pureVegMealsParam = searchParams.get("pureVegMeals") || searchParams.get("pureVeg");
    const domesticParam = searchParams.get("domestic");
    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");
    const sortParam = searchParams.get("sort") || "price-asc";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
    const popularRoutesOnly = searchParams.get("popularRoutes") === "true";
    const idParam = searchParams.get("id");

    // Check if requesting popular routes list
    if (popularRoutesOnly) {
      let routes = loadSeedRoutes(siteId);
      if (routes.length === 0 && siteId !== "gujjutours") {
        routes = loadSeedRoutes("gujjutours");
      }
      return NextResponse.json({ success: true, data: routes });
    }

    // 1. Attempt to fetch from backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const hostname = siteDef?.backendHostname || (siteId === "tripgoasia" ? "www.tripgoasia.com" : siteId === "technoheaven" ? "stagingb2b.technoheaven.com" : "www.gujjutours.com");

    try {
      const backendUrl = new URL(`${apiUrl}/api/flights`);
      searchParams.forEach((val, key) => backendUrl.searchParams.set(key, val));

      const res = await fetch(backendUrl.toString(), {
        headers: { "X-Website-Hostname": hostname },
        next: { revalidate: 30 },
      });

      if (res.ok) {
        const json = await res.json();
        if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
          return NextResponse.json(json);
        }
      }
    } catch {
      // Backend unavailable, fallback
    }

    // 2. Fallback to deterministic flights.json
    let flights = loadSeedFlights(siteId);
    if (flights.length === 0 && siteId !== "gujjutours") {
      flights = loadSeedFlights("gujjutours");
    }

    // Filter by single ID
    if (idParam) {
      const single = flights.find((f: any) =>
        String(f.id) === idParam ||
        String(f.flightNumericId) === idParam ||
        f.flightId === idParam ||
        f.slug === idParam
      );
      if (single) {
        return NextResponse.json({ success: true, data: single });
      }
    }

    // Filter: From
    if (fromParam) {
      const q = fromParam.toLowerCase().trim();
      flights = flights.filter((f: any) =>
        f.fromAirport?.code?.toLowerCase() === q ||
        f.fromAirport?.city?.toLowerCase().includes(q) ||
        f.fromAirport?.name?.toLowerCase().includes(q)
      );
    }

    // Filter: To
    if (toParam) {
      const q = toParam.toLowerCase().trim();
      flights = flights.filter((f: any) =>
        f.toAirport?.code?.toLowerCase() === q ||
        f.toAirport?.city?.toLowerCase().includes(q) ||
        f.toAirport?.name?.toLowerCase().includes(q)
      );
    }

    // Filter: Cabin Class
    if (cabinClassParam && cabinClassParam.toLowerCase() !== "all") {
      const c = cabinClassParam.toLowerCase().trim();
      flights = flights.filter((f: any) => f.cabinClass?.toLowerCase().includes(c));
    }

    // Filter: Airline
    if (airlineParam) {
      const a = airlineParam.toLowerCase().trim();
      flights = flights.filter((f: any) =>
        f.airline?.toLowerCase().includes(a) ||
        f.airlineCode?.toLowerCase() === a
      );
    }

    // Filter: Non-stop only
    if (nonStopParam === "true" || nonStopParam === "1") {
      flights = flights.filter((f: any) => (f.stopsCount || 0) === 0);
    }

    // Filter: Pure Veg In-Flight Meals
    if (pureVegMealsParam === "true") {
      flights = flights.filter((f: any) => f.meals?.pureVegGuaranteed === true);
    }

    // Filter: Domestic Only
    if (domesticParam === "true") {
      flights = flights.filter((f: any) => f.isDomestic === true);
    } else if (domesticParam === "false") {
      flights = flights.filter((f: any) => f.isDomestic === false);
    }

    // Filter: Price
    if (minPriceParam) {
      const min = parseFloat(minPriceParam);
      if (!isNaN(min)) flights = flights.filter((f: any) => f.price >= min);
    }
    if (maxPriceParam) {
      const max = parseFloat(maxPriceParam);
      if (!isNaN(max)) flights = flights.filter((f: any) => f.price <= max);
    }

    // Sorting
    if (sortParam === "price-asc") {
      flights.sort((a: any, b: any) => a.price - b.price);
    } else if (sortParam === "price-desc") {
      flights.sort((a: any, b: any) => b.price - a.price);
    } else if (sortParam === "duration-asc") {
      flights.sort((a: any, b: any) => (a.durationMinutes || 0) - (b.durationMinutes || 0));
    } else if (sortParam === "departure-asc") {
      flights.sort((a: any, b: any) => a.departureTime.localeCompare(b.departureTime));
    }

    const total = flights.length;
    const startIndex = (page - 1) * pageSize;
    const paginated = flights.slice(startIndex, startIndex + pageSize);

    // Extract facets
    const allAirlines = Array.from(new Set(flights.map((f: any) => f.airline).filter(Boolean)));
    const allRoutes = loadSeedRoutes(siteId);

    return NextResponse.json({
      success: true,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      data: paginated,
      popularRoutes: allRoutes.slice(0, 8),
      facets: {
        airlines: allAirlines,
      },
    });
  } catch (err: any) {
    console.error("[Flights API Error]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

