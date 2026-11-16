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
    console.error("[Flights Slug API] Error reading seed:", err.message);
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
    const targetSlug = segments[segments.length - 1];

    // 1. Backend attempt
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const hostname = siteDef?.backendHostname || (siteId === "tripgoasia" ? "www.tripgoasia.com" : siteId === "technoheaven" ? "stagingb2b.technoheaven.com" : "www.gujjutours.com");

    try {
      const res = await fetch(`${apiUrl}/api/flights/${encodeURIComponent(targetSlug)}`, {
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
    let flights = loadSeedFlights(siteId);
    if (flights.length === 0 && siteId !== "gujjutours") {
      flights = loadSeedFlights("gujjutours");
    }

    // Direct match by ID, flightId, or slug
    const single = flights.find((f: any) =>
      f.slug === targetSlug ||
      String(f.id) === targetSlug ||
      String(f.flightNumericId) === targetSlug ||
      f.flightId === targetSlug
    );

    if (single) {
      return NextResponse.json({ success: true, data: single });
    }

    // Match by routeSlug (e.g. "delhi-to-mumbai-flights-del-bom")
    const routeFlights = flights.filter((f: any) => f.routeSlug === targetSlug);
    if (routeFlights.length > 0) {
      return NextResponse.json({
        success: true,
        data: routeFlights[0],
        allRouteFlights: routeFlights,
        routeSlug: targetSlug,
      });
    }

    return NextResponse.json({ success: false, error: "Flight not found" }, { status: 404 });
  } catch (err: any) {
    console.error("[Flights Slug API Error]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

