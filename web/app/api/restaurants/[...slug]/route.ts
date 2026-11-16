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
    console.error("[Restaurants Slug API] Error reading seed:", err.message);
  }
  return [];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const segments = resolvedParams?.slug || [];
    if (segments.length === 0) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const rawHost =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      "";
    const host = normalizeHost(rawHost);

    const searchParams = request.nextUrl.searchParams;
    const siteQuery = searchParams.get("site");
    const siteHeader = request.headers.get("x-site-id");
    const siteDef =
      resolveSiteFromHost(host) ||
      getSiteById(siteQuery) ||
      getSiteById(siteHeader) ||
      (ENV.defaultSiteId ? getSiteById(ENV.defaultSiteId) : null);

    const siteId = (siteDef?.siteId || siteQuery || process.env.SITE_ID || "gujjutours").toLowerCase();

    // Check all segments: can be /restaurants/<slug>/<id> or /restaurants/<slug>
    const lastSegment = segments[segments.length - 1];
    const firstSegment = segments[0];

    // 1. Backend attempt
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const hostname = siteDef?.backendHostname || (siteId === "tripgoasia" ? "www.tripgoasia.com" : siteId === "technoheaven" ? "stagingb2b.technoheaven.com" : "www.gujjutours.com");

    try {
      const target = lastSegment || firstSegment;
      const res = await fetch(`${apiUrl}/api/restaurants/${encodeURIComponent(target)}`, {
        headers: { "X-Website-Hostname": hostname },
        next: { revalidate: 30 },
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          return NextResponse.json(json);
        }
      }
    } catch {
      // Backend unavailable, fallback
    }

    // 2. Local seed fallback
    let restaurants = loadSeedRestaurants(siteId);
    if (restaurants.length === 0 && siteId !== "gujjutours") {
      restaurants = loadSeedRestaurants("gujjutours");
    }

    const single = restaurants.find((r: any) =>
      r.slug === lastSegment ||
      r.slug === firstSegment ||
      String(r.id) === lastSegment ||
      String(r.restaurantNumericId) === lastSegment ||
      r.restaurantId === lastSegment ||
      String(r.id) === firstSegment ||
      String(r.restaurantNumericId) === firstSegment
    );

    if (single) {
      return NextResponse.json({ success: true, data: single });
    }

    return NextResponse.json({ success: false, error: "Restaurant not found" }, { status: 404 });
  } catch (err: any) {
    console.error("[Restaurants Slug API Error]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

