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
    console.error("[Visas Slug API] Error reading seed:", err.message);
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
      const res = await fetch(`${apiUrl}/api/visas/${encodeURIComponent(targetSlug)}`, {
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
      } else if (res.status === 404) {
        // Fallback to country endpoint
        const cRes = await fetch(`${apiUrl}/api/visas/country/${encodeURIComponent(targetSlug)}`, {
          headers: {
            "X-Website-Hostname": hostname,
            "X-Site-Id": siteId,
            "X-Website-Id": siteId,
          },
          next: { revalidate: 30 },
        });
        if (cRes.ok) {
          const cJson = await cRes.json();
          if (cJson?.data && Array.isArray(cJson.data) && cJson.data.length > 0) {
            const first = cJson.data[0];
            return NextResponse.json({
              success: true,
              isCountry: true,
              country: {
                name: first.country,
                code: first.countryCode,
                slug: first.countrySlug,
                flag: first.flag,
                continent: first.continent,
              },
              data: cJson.data,
            });
          }
        }
      }
    } catch {
      // Backend unavailable, fallback
    }

    // 2. Local seed fallback
    let visas = loadSeedVisas(siteId);
    if (visas.length === 0 && siteId !== "gujjutours") {
      visas = loadSeedVisas("gujjutours");
    }

    // Check if target is a country slug
    const matchingCountryVisas = visas.filter(
      (v: any) => v.countrySlug === targetSlug || v.country.toLowerCase() === targetSlug.toLowerCase()
    );

    if (matchingCountryVisas.length > 0) {
      const countryFirst = matchingCountryVisas[0];
      return NextResponse.json({
        success: true,
        isCountry: true,
        country: {
          name: countryFirst.country,
          code: countryFirst.countryCode,
          slug: countryFirst.countrySlug,
          flag: countryFirst.flag,
          continent: countryFirst.continent,
        },
        data: matchingCountryVisas,
      });
    }

    // Check if target is a specific visa slug or ID
    const single = visas.find((v: any) =>
      v.slug === targetSlug ||
      String(v.id) === targetSlug ||
      String(v.visaNumericId) === targetSlug ||
      v.visaId === targetSlug
    );

    if (single) {
      return NextResponse.json({ success: true, data: single });
    }

    return NextResponse.json({ success: false, error: "Visa product or country not found" }, { status: 404 });
  } catch (err: any) {
    console.error("[Visas Slug API Error]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

