import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { resolveSiteFromHost, getSiteById, normalizeHost } from "@/lib/siteRegistry";
import { ENV } from "@/lib/env";

export const dynamic = "force-dynamic";

function loadSeedBuildPackageOptions(site: string): any[] {
  try {
    const seedPath = path.join(process.cwd(), "seed", site, "build-package-options.json");
    if (fs.existsSync(seedPath)) {
      const content = fs.readFileSync(seedPath, "utf-8");
      const list = JSON.parse(content);
      return Array.isArray(list) ? list : [];
    }
  } catch (err: any) {
    console.error("[BuildPackage API] Error reading seed:", err.message);
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
    const countryParam = searchParams.get("country") || "";
    const popularParam = searchParams.get("popular") === "true";
    const featuredParam = searchParams.get("featured") === "true";
    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");
    const sortParam = searchParams.get("sort") || "popular";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
    const idParam = searchParams.get("id");

    // 1. Attempt backend fetch
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const hostname =
      siteDef?.backendHostname ||
      (siteId === "tripgoasia"
        ? "www.tripgoasia.com"
        : siteId === "technoheaven"
        ? "stagingb2b.technoheaven.com"
        : "www.gujjutours.com");

    try {
      const backendUrl = new URL(`${apiUrl}/api/buildpackage/options`);
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
      // Backend unavailable, fallback to seed
    }

    // 2. Fallback to deterministic build-package-options.json
    let options = loadSeedBuildPackageOptions(siteId);
    if (options.length === 0 && siteId !== "gujjutours") {
      options = loadSeedBuildPackageOptions("gujjutours");
    }

    // Single item by ID or slug
    if (idParam) {
      const single = options.find(
        (o: any) =>
          String(o.id) === idParam ||
          String(o.destinationNumericId) === idParam ||
          o.destinationId === idParam ||
          o.destinationSlug === idParam
      );
      if (single) {
        return NextResponse.json({ success: true, data: single });
      }
    }

    // Filter: Query
    if (queryParam) {
      const q = queryParam.toLowerCase().trim();
      options = options.filter(
        (o: any) =>
          o.destinationName?.toLowerCase().includes(q) ||
          o.country?.toLowerCase().includes(q) ||
          o.tagline?.toLowerCase().includes(q) ||
          o.overview?.toLowerCase().includes(q)
      );
    }

    // Filter: Country
    if (countryParam && countryParam.toLowerCase() !== "all") {
      const c = countryParam.toLowerCase().trim();
      options = options.filter((o: any) => o.country?.toLowerCase().includes(c));
    }

    // Filter: Popular
    if (popularParam) {
      options = options.filter((o: any) => o.popular);
    }

    // Filter: Featured
    if (featuredParam) {
      options = options.filter((o: any) => o.featured);
    }

    // Filter: Min Price
    if (minPriceParam) {
      const min = parseFloat(minPriceParam);
      if (!isNaN(min)) {
        options = options.filter((o: any) => o.startingPrice >= min);
      }
    }

    // Filter: Max Price
    if (maxPriceParam) {
      const max = parseFloat(maxPriceParam);
      if (!isNaN(max)) {
        options = options.filter((o: any) => o.startingPrice <= max);
      }
    }

    // Sorting
    if (sortParam === "price_asc") {
      options.sort((a: any, b: any) => a.startingPrice - b.startingPrice);
    } else if (sortParam === "price_desc") {
      options.sort((a: any, b: any) => b.startingPrice - a.startingPrice);
    } else if (sortParam === "rating_desc") {
      options.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
    } else {
      // Default: popular
      options.sort((a: any, b: any) => ((b.popular ? 1 : 0) - (a.popular ? 1 : 0)) || (b.reviews - a.reviews));
    }

    // Pagination
    const total = options.length;
    const startIndex = (page - 1) * pageSize;
    const paged = options.slice(startIndex, startIndex + pageSize);

    return NextResponse.json({
      success: true,
      data: paged,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err: any) {
    console.error("[BuildPackage API Error]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

