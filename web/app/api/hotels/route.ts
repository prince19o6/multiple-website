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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const site = (searchParams.get("site") || process.env.SITE_ID || "gujjutours").toLowerCase();
  const destination = searchParams.get("destination") || searchParams.get("city") || "";
  const starsParam = searchParams.get("stars") || searchParams.get("starRating") || "";
  const propertyTypeParam = searchParams.get("propertyType") || searchParams.get("category") || searchParams.get("categories") || "";
  const pureVegParam = searchParams.get("pureVeg");
  const jainAvailableParam = searchParams.get("jainAvailable");
  const collectionParam = searchParams.get("collection") || "";
  const minPriceParam = searchParams.get("minPrice");
  const maxPriceParam = searchParams.get("maxPrice");
  const searchParam = searchParams.get("search") || searchParams.get("q") || "";
  const sortParam = searchParams.get("sort") || searchParams.get("sortBy") || "recommended";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

  // 1. Try fetching from ASP.NET Core backend first
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const hostname = site === "tripgoasia" ? "www.tripgoasia.com" : site === "technoheaven" ? "stagingb2b.technoheaven.com" : "www.gujjutours.com";

  try {
    const backendUrl = new URL(`${apiUrl}/api/hotels`);
    searchParams.forEach((val, key) => backendUrl.searchParams.set(key, val));

    const res = await fetch(backendUrl.toString(), {
      headers: { "X-Website-Hostname": hostname },
      next: { revalidate: 30 }
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Backend offline, seamlessly fallback to local seed data
  }

  // 2. Fallback: Filter from local seed JSON
  let hotels = loadSeedHotels(site);
  if (hotels.length === 0 && site !== "gujjutours") {
    hotels = loadSeedHotels("gujjutours");
  }

  // Filter: Destination / City
  if (destination) {
    const q = destination.toLowerCase().trim();
    hotels = hotels.filter((h: any) =>
      h.destination?.cityName?.toLowerCase().includes(q) ||
      h.destination?.country?.toLowerCase().includes(q) ||
      h.title?.toLowerCase().includes(q)
    );
  }

  // Filter: Text Search
  if (searchParam) {
    const q = searchParam.toLowerCase().trim();
    hotels = hotels.filter((h: any) =>
      h.title?.toLowerCase().includes(q) ||
      h.destination?.cityName?.toLowerCase().includes(q) ||
      h.destination?.address?.toLowerCase().includes(q) ||
      h.propertyType?.toLowerCase().includes(q)
    );
  }

  // Filter: Star Ratings
  if (starsParam) {
    const stars = starsParam.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
    if (stars.length > 0) {
      hotels = hotels.filter((h: any) => stars.includes(h.starRating));
    }
  }

  // Filter: Property Types
  if (propertyTypeParam) {
    const types = propertyTypeParam.split(",").map((t) => t.trim().toLowerCase());
    if (types.length > 0) {
      hotels = hotels.filter((h: any) => types.includes(h.propertyType?.toLowerCase()));
    }
  }

  // Filter: Dietary
  if (pureVegParam === "true" || pureVegParam === "1") {
    hotels = hotels.filter((h: any) => h.dietaryFeatures?.pureVeg === true);
  }
  if (jainAvailableParam === "true" || jainAvailableParam === "1") {
    hotels = hotels.filter((h: any) => h.dietaryFeatures?.jainAvailable === true);
  }

  // Filter: Collection
  if (collectionParam) {
    const col = collectionParam.toLowerCase().trim();
    hotels = hotels.filter((h: any) =>
      Array.isArray(h.collections) && h.collections.some((c: string) => c.toLowerCase() === col)
    );
  }

  // Filter: Price Range
  if (minPriceParam) {
    const min = parseFloat(minPriceParam);
    if (!isNaN(min)) {
      hotels = hotels.filter((h: any) => (h.pricePerNight ?? 0) >= min);
    }
  }
  if (maxPriceParam) {
    const max = parseFloat(maxPriceParam);
    if (!isNaN(max)) {
      hotels = hotels.filter((h: any) => (h.pricePerNight ?? 0) <= max);
    }
  }

  // Sorting
  if (sortParam === "price_asc" || sortParam === "priceAsc") {
    hotels.sort((a: any, b: any) => (a.pricePerNight ?? 0) - (b.pricePerNight ?? 0));
  } else if (sortParam === "price_desc" || sortParam === "priceDesc") {
    hotels.sort((a: any, b: any) => (b.pricePerNight ?? 0) - (a.pricePerNight ?? 0));
  } else if (sortParam === "rating" || sortParam === "rating_desc") {
    hotels.sort((a: any, b: any) => (b.rating ?? 0) - (a.rating ?? 0));
  } else {
    // Recommended: featured first, then star rating
    hotels.sort((a: any, b: any) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || (b.starRating ?? 0) - (a.starRating ?? 0));
  }

  const total = hotels.length;
  const startIndex = (page - 1) * pageSize;
  const paginated = hotels.slice(startIndex, startIndex + pageSize);

  return NextResponse.json({
    success: true,
    count: paginated.length,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    data: paginated,
  });
}

