import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { resolveSiteFromHost, getSiteById, normalizeHost } from "@/lib/siteRegistry";
import { ENV } from "@/lib/env";

export const dynamic = "force-dynamic";

function loadSeedVisas(site: string): any[] {
  try {
    const seedPath = path.join(process.cwd(), "seed", site, "visas.json");
    if (fs.existsSync(seedPath)) {
      const content = fs.readFileSync(seedPath, "utf-8");
      const list = JSON.parse(content);
      return Array.isArray(list) ? list : [];
    }
  } catch (err: any) {
    console.error("[Visas API] Error reading seed:", err.message);
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
    const rawCountryParam = searchParams.get("country") || searchParams.get("destination") || "";
    const countryParam = rawCountryParam.replace(/\s*\([^)]*\)/g, "").trim();
    const visaTypeParam = searchParams.get("visaType") || searchParams.get("type") || "";
    const continentParam = searchParams.get("continent") || "";
    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");
    const sortParam = searchParams.get("sort") || "popular";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "24", 10);
    const idParam = searchParams.get("id");
    const countriesOnly = searchParams.get("countries") === "true" || searchParams.get("format") === "summary";

    // 1. Attempt backend fetch
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const hostname = siteDef?.backendHostname || (siteId === "tripgoasia" ? "www.tripgoasia.com" : siteId === "technoheaven" ? "stagingb2b.technoheaven.com" : "www.gujjutours.com");

    try {
      const endpoint = countriesOnly ? `${apiUrl}/api/visas/countries` : `${apiUrl}/api/visas`;
      const backendUrl = new URL(endpoint);
      searchParams.forEach((val, key) => backendUrl.searchParams.set(key, val));
      if (countryParam) {
        backendUrl.searchParams.set("country", countryParam);
      }

      const res = await fetch(backendUrl.toString(), {
        headers: {
          "X-Website-Hostname": hostname,
          "X-Site-Id": siteId,
          "X-Website-Id": siteId,
        },
        next: { revalidate: 30 },
      });

      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          return NextResponse.json(json);
        }
      }
    } catch {
      // Backend unavailable, fallback to seed
    }

    // 2. Fallback to deterministic visas.json
    let visas = loadSeedVisas(siteId);
    if (visas.length === 0 && siteId !== "gujjutours") {
      visas = loadSeedVisas("gujjutours");
    }

    // Single item by ID
    if (idParam) {
      const single = visas.find((v: any) =>
        String(v.id) === idParam ||
        String(v.visaNumericId) === idParam ||
        v.visaId === idParam ||
        v.slug === idParam
      );
      if (single) {
        return NextResponse.json({ success: true, data: single });
      }
    }

    // Country summaries mode
    if (countriesOnly) {
      const countryMap = new Map<string, any>();
      visas.forEach((v: any) => {
        const key = v.countrySlug || v.country.toLowerCase();
        if (!countryMap.has(key)) {
          countryMap.set(key, {
            country: v.country,
            countryCode: v.countryCode,
            countrySlug: v.countrySlug,
            flag: v.flag,
            continent: v.continent,
            startingPrice: v.price,
            currency: v.currency,
            approvalRate: v.approvalRate,
            totalOptions: 1,
            sampleImage: v.image,
            popular: v.featured
          });
        } else {
          const entry = countryMap.get(key);
          entry.totalOptions += 1;
          if (v.price < entry.startingPrice) {
            entry.startingPrice = v.price;
          }
          if (v.featured) entry.popular = true;
        }
      });

      let summaries = Array.from(countryMap.values());
      if (countryParam && countryParam.toLowerCase() !== "all") {
        const q = countryParam.toLowerCase().trim();
        summaries = summaries.filter((c: any) =>
          c.country.toLowerCase().includes(q) ||
          c.countryCode.toLowerCase().includes(q) ||
          c.countrySlug.includes(q)
        );
      }

      return NextResponse.json({
        success: true,
        data: summaries,
        meta: { total: summaries.length }
      });
    }

    // Filter: Country / Destination
    if (countryParam && countryParam.toLowerCase() !== "all") {
      const q = countryParam.toLowerCase().trim();
      visas = visas.filter((v: any) =>
        v.country.toLowerCase().includes(q) ||
        v.countryCode.toLowerCase().includes(q) ||
        v.countrySlug.includes(q) ||
        v.title.toLowerCase().includes(q)
      );
    }

    // Filter: Visa Type
    if (visaTypeParam && visaTypeParam.toLowerCase() !== "all") {
      const vt = visaTypeParam.toLowerCase().trim();
      visas = visas.filter((v: any) =>
        v.visaType?.toLowerCase() === vt ||
        v.visaTypeLabel?.toLowerCase().includes(vt)
      );
    }

    // Filter: Continent
    if (continentParam && continentParam.toLowerCase() !== "all") {
      const cont = continentParam.toLowerCase().trim();
      visas = visas.filter((v: any) =>
        v.continent?.toLowerCase().includes(cont)
      );
    }

    // Filter: Price
    if (minPriceParam) {
      const min = parseFloat(minPriceParam);
      if (!isNaN(min)) visas = visas.filter((v: any) => v.price >= min);
    }
    if (maxPriceParam) {
      const max = parseFloat(maxPriceParam);
      if (!isNaN(max)) visas = visas.filter((v: any) => v.price <= max);
    }

    // Sorting
    switch (sortParam) {
      case "price-asc":
      case "price_asc":
        visas.sort((a: any, b: any) => a.price - b.price);
        break;
      case "price-desc":
      case "price_desc":
        visas.sort((a: any, b: any) => b.price - a.price);
        break;
      case "rating-desc":
      case "rating_desc":
        visas.sort((a: any, b: any) => b.rating - a.rating);
        break;
      case "popular":
      default:
        visas.sort((a: any, b: any) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return b.rating - a.rating;
        });
        break;
    }

    // Pagination
    const total = visas.length;
    const startIndex = (page - 1) * pageSize;
    const paginated = visas.slice(startIndex, startIndex + pageSize);

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
    console.error("[Visas API Error]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

