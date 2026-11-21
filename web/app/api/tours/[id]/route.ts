import { NextRequest, NextResponse } from "next/server";
import { fetchTourById } from "@/lib/api";
import { resolveSiteFromHost } from "@/lib/siteRegistry";
import { findSeedEntity } from "@/lib/api/seedFallback";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const siteQuery = request.nextUrl.searchParams.get("site") || request.nextUrl.searchParams.get("siteId");
  const host =
    siteQuery ||
    request.headers.get("x-website-hostname") ||
    request.headers.get("x-website-id") ||
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    process.env.SITE_ID ||
    "";
  const site = resolveSiteFromHost(host);
  const siteId = site?.siteId || (process.env.SITE_ID as any) || "gujjutours";

  try {
    const tour = await fetchTourById(id, site ?? undefined);
    if (tour) {
      return NextResponse.json(
        { success: true, data: tour },
        {
          status: 200,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }
  } catch {
    // Backend offline / error — fall back to disk seed
  }

  const seedTour =
    findSeedEntity(siteId, "tours", id) ||
    findSeedEntity(siteId, "packages", id) ||
    findSeedEntity(siteId, "hotels", id) ||
    findSeedEntity(siteId, "activities", id) ||
    findSeedEntity(siteId, "restaurants", id);
  if (seedTour) {
    return NextResponse.json(
      { success: true, data: seedTour },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  return NextResponse.json(
    { success: false, data: null, error: "Tour not found" },
    { status: 404 }
  );
}
