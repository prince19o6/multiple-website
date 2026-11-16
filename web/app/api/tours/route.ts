import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { resolveSiteFromHost, getSiteById, normalizeHost } from "@/lib/siteRegistry";
import { ENV } from "@/lib/env";

export const dynamic = "force-dynamic";

function loadSeedActivities(site: string): any[] {
  try {
    const seedPath = path.join(process.cwd(), "seed", site, "activities.json");
    if (fs.existsSync(seedPath)) {
      const content = fs.readFileSync(seedPath, "utf-8");
      const list = JSON.parse(content);
      return Array.isArray(list) ? list : [];
    }
  } catch (err: any) {
    console.error("[Tours API] Error reading seed activities:", err.message);
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

    const categoryParam = searchParams.get("category") || searchParams.get("categorySlug") || "";
    const destinationParam = searchParams.get("destination") || searchParams.get("city") || "";
    const searchParam = searchParams.get("search") || searchParams.get("q") || "";
    const pureVegParam = searchParams.get("pureVeg");
    const jainAvailableParam = searchParams.get("jainAvailable");
    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");
    const sortParam = searchParams.get("sort") || searchParams.get("sortBy") || "recommended";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "24", 10);
    const idParam = searchParams.get("id");

    // 1. Attempt to fetch from backend first
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const hostname = siteDef?.backendHostname || (siteId === "tripgoasia" ? "www.tripgoasia.com" : siteId === "technoheaven" ? "stagingb2b.technoheaven.com" : "www.gujjutours.com");

    try {
      const backendUrl = new URL(`${apiUrl}/api/tours`);
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
      // Backend offline, fallback to deterministic seed activities
    }

    // 2. Fallback to deterministic activities.json
    let activities = loadSeedActivities(siteId);
    if (activities.length === 0 && siteId !== "gujjutours") {
      activities = loadSeedActivities("gujjutours");
    }

    // Filter by single ID if requested
    if (idParam) {
      const single = activities.find((a: any) =>
        String(a.id) === idParam ||
        String(a.tourNumericId) === idParam ||
        a.slug === idParam
      );
      if (single) {
        return NextResponse.json({ success: true, data: single });
      }
    }

    // Filter: Category
    if (categoryParam && categoryParam.toLowerCase() !== "all") {
      const c = categoryParam.toLowerCase().trim();
      activities = activities.filter((a: any) =>
        a.categorySlug?.toLowerCase() === c ||
        a.category?.toLowerCase().includes(c) ||
        a.slug?.toLowerCase().includes(c)
      );
    }

    // Filter: Destination / City
    if (destinationParam) {
      const d = destinationParam.toLowerCase().trim();
      activities = activities.filter((a: any) =>
        a.destination?.toLowerCase().includes(d) ||
        a.city?.toLowerCase().includes(d) ||
        a.location?.toLowerCase().includes(d)
      );
    }

    // Filter: Search Query
    if (searchParam) {
      const q = searchParam.toLowerCase().trim();
      activities = activities.filter((a: any) =>
        a.title?.toLowerCase().includes(q) ||
        a.name?.toLowerCase().includes(q) ||
        a.destination?.toLowerCase().includes(q) ||
        a.city?.toLowerCase().includes(q) ||
        a.category?.toLowerCase().includes(q)
      );
    }

    // Filter: Dietary (Pure Veg & Jain)
    if (pureVegParam === "true") {
      activities = activities.filter((a: any) => a.dietaryFeatures?.pureVeg === true);
    }
    if (jainAvailableParam === "true") {
      activities = activities.filter((a: any) => a.dietaryFeatures?.jainAvailable === true);
    }

    // Filter: Price Range
    if (minPriceParam) {
      const min = parseFloat(minPriceParam);
      if (!isNaN(min)) activities = activities.filter((a: any) => a.price >= min);
    }
    if (maxPriceParam) {
      const max = parseFloat(maxPriceParam);
      if (!isNaN(max)) activities = activities.filter((a: any) => a.price <= max);
    }

    // Sort
    if (sortParam === "price_asc") {
      activities.sort((a: any, b: any) => a.price - b.price);
    } else if (sortParam === "price_desc") {
      activities.sort((a: any, b: any) => b.price - a.price);
    } else if (sortParam === "rating") {
      activities.sort((a: any, b: any) => b.rating - a.rating);
    } else {
      // Default: featured first, then rating
      activities.sort((a: any, b: any) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.rating - a.rating);
    }

    // Pagination
    const totalCount = activities.length;
    const startIndex = (page - 1) * pageSize;
    const paginated = activities.slice(startIndex, startIndex + pageSize);

    return NextResponse.json({
      success: true,
      count: paginated.length,
      total: totalCount,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      data: paginated,
      dataSource: "seed-fallback",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, data: [], error: err.message || "Failed to fetch activities" },
      { status: 500 }
    );
  }
}
