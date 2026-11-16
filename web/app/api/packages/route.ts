import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { resolveSiteFromHost, getSiteById, normalizeHost } from "@/lib/siteRegistry";
import { ENV } from "@/lib/env";

export const dynamic = "force-dynamic";

function loadSeedPackages(site: string): any[] {
  try {
    const seedPath = path.join(process.cwd(), "seed", site, "packages.json");
    if (fs.existsSync(seedPath)) {
      const content = fs.readFileSync(seedPath, "utf-8");
      const list = JSON.parse(content);
      return Array.isArray(list) ? list : [];
    }
  } catch (err: any) {
    console.error("[Packages API] Error reading seed:", err.message);
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

    const categoryParam = searchParams.get("category") || searchParams.get("categorySlug") || searchParams.get("theme") || "";
    const destinationParam = searchParams.get("destination") || searchParams.get("city") || searchParams.get("country") || "";
    const searchParam = searchParams.get("search") || searchParams.get("q") || "";
    const pureVegParam = searchParams.get("pureVeg");
    const jainAvailableParam = searchParams.get("jainAvailable");
    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");
    const minDaysParam = searchParams.get("minDays");
    const maxDaysParam = searchParams.get("maxDays");
    const domesticParam = searchParams.get("domestic");
    const sortParam = searchParams.get("sort") || searchParams.get("sortBy") || "recommended";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "24", 10);
    const idParam = searchParams.get("id");

    // 1. Attempt to fetch from backend first
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const hostname = siteDef?.backendHostname || (siteId === "tripgoasia" ? "www.tripgoasia.com" : siteId === "technoheaven" ? "stagingb2b.technoheaven.com" : "www.gujjutours.com");

    try {
      const backendUrl = new URL(`${apiUrl}/api/packages`);
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
      // Backend offline, fallback to deterministic seed packages
    }

    // 2. Fallback to deterministic packages.json
    let packages = loadSeedPackages(siteId);
    if (packages.length === 0 && siteId !== "gujjutours") {
      packages = loadSeedPackages("gujjutours");
    }

    // Filter by single ID if requested
    if (idParam) {
      const single = packages.find((p: any) =>
        String(p.id) === idParam ||
        String(p.packageNumericId) === idParam ||
        p.packageId === idParam ||
        p.slug === idParam
      );
      if (single) {
        return NextResponse.json({ success: true, data: single });
      }
    }

    // Filter: Category / Theme
    if (categoryParam && categoryParam.toLowerCase() !== "all") {
      const c = categoryParam.toLowerCase().trim();
      packages = packages.filter((p: any) =>
        p.categorySlug?.toLowerCase() === c ||
        p.category?.toLowerCase().includes(c) ||
        p.slug?.toLowerCase().includes(c)
      );
    }

    // Filter: Domestic packages only (e.g., India for GujjuTours, UAE for Technoheaven, Thailand/Singapore for TripGoAsia)
    if (domesticParam === "true" || domesticParam === "1") {
      const domesticCountry = siteId === "gujjutours" ? "india" : siteId === "technoheaven" ? "united arab emirates" : "thailand";
      packages = packages.filter((p: any) =>
        p.country?.toLowerCase() === domesticCountry ||
        p.categorySlug === "domestic-escapes" ||
        p.category?.toLowerCase().includes("domestic")
      );
    }

    // Filter: Destination / City / Country
    if (destinationParam) {
      const d = destinationParam.toLowerCase().trim();
      packages = packages.filter((p: any) =>
        p.destination?.toLowerCase().includes(d) ||
        p.city?.toLowerCase().includes(d) ||
        p.country?.toLowerCase().includes(d) ||
        p.citiesCovered?.toLowerCase().includes(d)
      );
    }

    // Filter: Search Query
    if (searchParam) {
      const q = searchParam.toLowerCase().trim();
      packages = packages.filter((p: any) =>
        p.title?.toLowerCase().includes(q) ||
        p.name?.toLowerCase().includes(q) ||
        p.destination?.toLowerCase().includes(q) ||
        p.citiesCovered?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }

    // Filter: Dietary - Pure Veg
    if (pureVegParam === "true") {
      packages = packages.filter((p: any) => p.dietaryFeatures?.pureVeg === true);
    }

    // Filter: Dietary - Jain Available
    if (jainAvailableParam === "true") {
      packages = packages.filter((p: any) => p.dietaryFeatures?.jainAvailable === true);
    }

    // Filter: Price Range
    if (minPriceParam) {
      const min = parseFloat(minPriceParam);
      if (!isNaN(min)) {
        packages = packages.filter((p: any) => (p.startingPrice || p.price || 0) >= min);
      }
    }
    if (maxPriceParam) {
      const max = parseFloat(maxPriceParam);
      if (!isNaN(max)) {
        packages = packages.filter((p: any) => (p.startingPrice || p.price || 0) <= max);
      }
    }

    // Filter: Duration Days
    if (minDaysParam) {
      const minD = parseInt(minDaysParam, 10);
      if (!isNaN(minD)) {
        packages = packages.filter((p: any) => (p.durationDays || 1) >= minD);
      }
    }
    if (maxDaysParam) {
      const maxD = parseInt(maxDaysParam, 10);
      if (!isNaN(maxD)) {
        packages = packages.filter((p: any) => (p.durationDays || 1) <= maxD);
      }
    }

    // Sorting
    if (sortParam === "price-asc") {
      packages.sort((a: any, b: any) => (a.startingPrice || a.price || 0) - (b.startingPrice || b.price || 0));
    } else if (sortParam === "price-desc") {
      packages.sort((a: any, b: any) => (b.startingPrice || b.price || 0) - (a.startingPrice || a.price || 0));
    } else if (sortParam === "rating") {
      packages.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
    } else if (sortParam === "duration-asc") {
      packages.sort((a: any, b: any) => (a.durationDays || 0) - (b.durationDays || 0));
    } else if (sortParam === "duration-desc") {
      packages.sort((a: any, b: any) => (b.durationDays || 0) - (a.durationDays || 0));
    }

    const total = packages.length;
    const startIndex = (page - 1) * pageSize;
    const paginated = packages.slice(startIndex, startIndex + pageSize);

    // Extract available filter facets
    const allCategories = Array.from(
      new Set(packages.map((p: any) => p.category).filter(Boolean))
    );
    const allDestinations = Array.from(
      new Set(packages.map((p: any) => p.destination).filter(Boolean))
    );

    return NextResponse.json({
      success: true,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      data: paginated,
      facets: {
        categories: allCategories,
        destinations: allDestinations,
      },
    });
  } catch (err: any) {
    console.error("[Packages API Error]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

