import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { resolveSiteFromHost, getSiteById, normalizeHost } from "@/lib/siteRegistry";
import { ENV } from "@/lib/env";

export const dynamic = "force-dynamic";

function loadSeedRestaurants(site: string): any[] {
  try {
    const seedPath = path.join(process.cwd(), "seed", site, "restaurants.json");
    if (fs.existsSync(seedPath)) {
      const content = fs.readFileSync(seedPath, "utf-8");
      const list = JSON.parse(content);
      return Array.isArray(list) ? list : [];
    }
  } catch (err: any) {
    console.error("[Restaurants API] Error reading seed:", err.message);
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

    // Query parameters
    const queryParam = searchParams.get("q") || searchParams.get("query") || "";
    const cityParam = searchParams.get("city") || searchParams.get("destination") || "";
    const cuisineParam = searchParams.get("cuisine") || searchParams.get("category") || "";
    const pureVegParam = searchParams.get("pureVeg") === "true";
    const jainParam = searchParams.get("jain") === "true";
    const halalParam = searchParams.get("halal") === "true";
    const priceRangeParam = searchParams.get("priceRange") || "";
    const minCostParam = searchParams.get("minCost");
    const maxCostParam = searchParams.get("maxCost");
    const sortParam = searchParams.get("sort") || "popular";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "24", 10);
    const idParam = searchParams.get("id");

    // 1. Attempt backend fetch
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const hostname = siteDef?.backendHostname || (siteId === "tripgoasia" ? "www.tripgoasia.com" : siteId === "technoheaven" ? "stagingb2b.technoheaven.com" : "www.gujjutours.com");

    try {
      const backendUrl = new URL(`${apiUrl}/api/restaurants`);
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

    // 2. Fallback to deterministic restaurants.json
    let restaurants = loadSeedRestaurants(siteId);
    if (restaurants.length === 0 && siteId !== "gujjutours") {
      restaurants = loadSeedRestaurants("gujjutours");
    }

    // Single item by ID
    if (idParam) {
      const single = restaurants.find((r: any) =>
        String(r.id) === idParam ||
        String(r.restaurantNumericId) === idParam ||
        r.restaurantId === idParam ||
        r.slug === idParam
      );
      if (single) {
        return NextResponse.json({ success: true, data: single });
      }
    }

    // Filter: Query
    if (queryParam) {
      const q = queryParam.toLowerCase().trim();
      restaurants = restaurants.filter((r: any) =>
        r.title.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.cuisineLabel.toLowerCase().includes(q) ||
        r.specialties?.some((s: string) => s.toLowerCase().includes(q))
      );
    }

    // Filter: City
    if (cityParam && cityParam.toLowerCase() !== "all") {
      const city = cityParam.toLowerCase().trim();
      restaurants = restaurants.filter((r: any) =>
        r.city.toLowerCase().includes(city) ||
        r.country.toLowerCase().includes(city)
      );
    }

    // Filter: Cuisine
    if (cuisineParam && cuisineParam.toLowerCase() !== "all") {
      const c = cuisineParam.toLowerCase().trim();
      restaurants = restaurants.filter((r: any) =>
        r.cuisine?.toLowerCase() === c ||
        r.cuisineLabel?.toLowerCase().includes(c)
      );
    }

    // Filter: Dietary
    if (pureVegParam) {
      restaurants = restaurants.filter((r: any) => r.isPureVeg);
    }
    if (jainParam) {
      restaurants = restaurants.filter((r: any) => r.isJainAvailable);
    }
    if (halalParam) {
      restaurants = restaurants.filter((r: any) => r.isHalalCertified);
    }

    // Filter: Price Range ($ - $$$$)
    if (priceRangeParam && priceRangeParam.toLowerCase() !== "all") {
      restaurants = restaurants.filter((r: any) => r.priceRange === priceRangeParam.trim());
    }

    // Filter: Cost for two
    if (minCostParam) {
      const min = parseFloat(minCostParam);
      if (!isNaN(min)) restaurants = restaurants.filter((r: any) => r.costForTwo >= min);
    }
    if (maxCostParam) {
      const max = parseFloat(maxCostParam);
      if (!isNaN(max)) restaurants = restaurants.filter((r: any) => r.costForTwo <= max);
    }

    // Sorting
    switch (sortParam) {
      case "cost-asc":
      case "cost_asc":
      case "price-asc":
        restaurants.sort((a: any, b: any) => a.costForTwo - b.costForTwo);
        break;
      case "cost-desc":
      case "cost_desc":
      case "price-desc":
        restaurants.sort((a: any, b: any) => b.costForTwo - a.costForTwo);
        break;
      case "rating-desc":
      case "rating_desc":
        restaurants.sort((a: any, b: any) => b.rating - a.rating);
        break;
      case "newest":
        restaurants.sort((a: any, b: any) => {
          if (a.isNew && !b.isNew) return -1;
          if (!a.isNew && b.isNew) return 1;
          return b.rating - a.rating;
        });
        break;
      case "popular":
      default:
        restaurants.sort((a: any, b: any) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return b.rating - a.rating;
        });
        break;
    }

    // Pagination
    const total = restaurants.length;
    const startIndex = (page - 1) * pageSize;
    const paginated = restaurants.slice(startIndex, startIndex + pageSize);

    return NextResponse.json({
      success: true,
      data: paginated,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err: any) {
    console.error("[Restaurants API Error]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

