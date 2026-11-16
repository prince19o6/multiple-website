import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function loadSeedHotels(site: string): any[] {
  try {
    const seedPath = path.join(process.cwd(), "seed", site, "hotels.json");
    if (fs.existsSync(seedPath)) {
      const content = fs.readFileSync(seedPath, "utf-8");
      const list = JSON.parse(content);
      return Array.isArray(list) ? list : [];
    }
  } catch (err: any) {
    console.error("[Hotels API] Error reading seed:", err.message);
  }
  return [];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const pathSegment = slug.join("/");
  const searchParams = request.nextUrl.searchParams;
  const site = (searchParams.get("site") || process.env.SITE_ID || "gujjutours").toLowerCase();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const hostname = site === "tripgoasia" ? "www.tripgoasia.com" : site === "technoheaven" ? "stagingb2b.technoheaven.com" : "www.gujjutours.com";

  // ─── 1. COLLECTIONS ENDPOINT (/api/hotels/collections) ──────────────────────
  if (pathSegment === "collections") {
    try {
      const res = await fetch(`${apiUrl}/api/hotels/collections`, {
        headers: { "X-Website-Hostname": hostname },
        next: { revalidate: 60 }
      });
      if (res.ok) {
        return NextResponse.json(await res.json());
      }
    } catch {
      // Backend offline
    }

    const hotels = loadSeedHotels(site);
    const cityMap: Record<string, { cityName: string; country: string; count: number; minPrice: number; image: string }> = {};

    for (const h of hotels) {
      const city = h.destination?.cityName || "Dubai";
      if (!cityMap[city]) {
        cityMap[city] = {
          cityName: city,
          country: h.destination?.country || "",
          count: 0,
          minPrice: h.pricePerNight ?? 5000,
          image: h.images?.[0] || "/seed-images/hotels/hotel-1.svg",
        };
      }
      cityMap[city].count += 1;
      if ((h.pricePerNight ?? 0) < cityMap[city].minPrice) {
        cityMap[city].minPrice = h.pricePerNight;
      }
    }

    const cityCards = Object.values(cityMap).sort((a, b) => b.count - a.count);

    const curatedCollections = [
      { id: "hill-stations", title: "Scenic Hill Stations", count: hotels.filter(h => h.collections?.includes("hill-stations")).length, image: "/seed-images/hotels/hotel-2.svg" },
      { id: "beach-stays", title: "Beachfront & Coastal Resorts", count: hotels.filter(h => h.collections?.includes("beach-stays")).length, image: "/seed-images/hotels/hotel-3.svg" },
      { id: "pilgrimage", title: "Spiritual & Pilgrimage Escapes", count: hotels.filter(h => h.collections?.includes("pilgrimage")).length, image: "/seed-images/hotels/hotel-4.svg" },
      { id: "luxury-stays", title: "Iconic Luxury & Heritage Stays", count: hotels.filter(h => h.collections?.includes("luxury-stays")).length, image: "/seed-images/hotels/hotel-5.svg" },
      { id: "budget-stays", title: "Smart Value & City Stays", count: hotels.filter(h => h.collections?.includes("budget-stays")).length, image: "/seed-images/hotels/hotel-6.svg" },
      { id: "family-stays", title: "Family Stays & Kids Suites", count: hotels.filter(h => h.collections?.includes("family-stays")).length, image: "/seed-images/hotels/hotel-7.svg" },
    ];

    return NextResponse.json({
      success: true,
      cityCards,
      collections: curatedCollections,
    });
  }

  // ─── 2. AUTOCOMPLETE ENDPOINT (/api/hotels/autocomplete) ───────────────────
  if (pathSegment === "autocomplete") {
    const q = (searchParams.get("q") || "").toLowerCase().trim();
    const hotels = loadSeedHotels(site);

    const cities = Array.from(new Set(hotels.map(h => h.destination?.cityName).filter(Boolean)))
      .filter(c => !q || c.toLowerCase().includes(q))
      .slice(0, 5)
      .map(c => ({ type: "city", name: c, subtitle: "Popular Destination" }));

    const hotelMatches = hotels
      .filter(h => !q || h.title?.toLowerCase().includes(q) || h.destination?.cityName?.toLowerCase().includes(q))
      .slice(0, 5)
      .map(h => ({
        type: "hotel",
        id: h.id,
        slug: h.slug,
        name: h.title,
        city: h.destination?.cityName,
        starRating: h.starRating,
        pricePerNight: h.pricePerNight,
      }));

    return NextResponse.json({
      success: true,
      data: [...cities, ...hotelMatches],
    });
  }

  // ─── 3. HOTEL DETAIL ENDPOINT (/api/hotels/{slug}) ─────────────────────────
  const targetSlug = slug[slug.length - 1].toLowerCase();

  try {
    const res = await fetch(`${apiUrl}/api/hotels/${encodeURIComponent(targetSlug)}`, {
      headers: { "X-Website-Hostname": hostname },
      next: { revalidate: 30 }
    });
    if (res.ok) {
      return NextResponse.json(await res.json());
    }
  } catch {
    // Backend offline
  }

  const hotels = loadSeedHotels(site);
  const found = hotels.find(
    (h: any) =>
      h.slug?.toLowerCase() === targetSlug ||
      h.id?.toLowerCase() === targetSlug ||
      h.slug?.toLowerCase().endsWith(`-${targetSlug}`)
  );

  if (found) {
    return NextResponse.json({ success: true, data: found });
  }

  // If not found by exact slug, return first item as safe mock fallback rather than 404
  if (hotels.length > 0) {
    return NextResponse.json({ success: true, data: hotels[0] });
  }

  return NextResponse.json({ success: false, error: "Hotel not found" }, { status: 404 });
}

