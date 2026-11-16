import { NextRequest, NextResponse } from "next/server";
import { getCatalogProvider } from "@/lib/catalog/gateway";
import type { SupportedSiteId } from "@/lib/catalog/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ route: string[] }> }
) {
  const { route } = await params;
  const searchParams = request.nextUrl.searchParams;
  const site = (searchParams.get("site") || process.env.SITE_ID || "gujjutours") as SupportedSiteId;
  const provider = getCatalogProvider();

  const endpoint = route ? route.join("/") : "";

  try {
    if (endpoint === "banners") {
      const banners = await provider.getBanners(site);
      return NextResponse.json({ success: true, count: banners.length, data: banners });
    }

    if (endpoint === "destinations") {
      const destinations = await provider.getDestinations(site);
      return NextResponse.json({ success: true, count: destinations.length, data: destinations });
    }

    if (endpoint === "hotels") {
      const city = searchParams.get("city") || undefined;
      const hotels = await provider.getHotels(site, { cityIdOrName: city });
      return NextResponse.json({ success: true, count: hotels.length, data: hotels });
    }

    if (endpoint.startsWith("hotel/")) {
      const id = endpoint.replace("hotel/", "");
      const hotel = await provider.getHotelDetail(site, id);
      if (!hotel) return NextResponse.json({ success: false, error: "Hotel not found" }, { status: 404 });
      return NextResponse.json({ success: true, data: hotel });
    }

    if (endpoint === "tours") {
      const destination = searchParams.get("destination") || undefined;
      const tours = await provider.getTours(site, { destination });
      return NextResponse.json({ success: true, count: tours.length, data: tours });
    }

    if (endpoint.startsWith("tour/")) {
      const id = endpoint.replace("tour/", "");
      const tour = await provider.getTourDetail(site, id);
      if (!tour) return NextResponse.json({ success: false, error: "Tour not found" }, { status: 404 });
      return NextResponse.json({ success: true, data: tour });
    }

    if (endpoint === "reviews") {
      const reviews = await provider.getReviews(site);
      return NextResponse.json({ success: true, count: reviews.length, data: reviews });
    }

    if (endpoint === "weather") {
      const city = searchParams.get("city") || "Kuala Lumpur";
      const weather = await provider.getWeather(site, city);
      return NextResponse.json({ success: true, data: weather });
    }

    return NextResponse.json({ success: false, error: "Unknown catalog route" }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

