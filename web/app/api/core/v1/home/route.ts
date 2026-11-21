import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getHomeData } from "@/lib/api/home";

export const dynamic = "force-dynamic";

function getSeedFallbackHomeData(site: string, moduleParam: string) {
  const s = (site || "gujjutours").toLowerCase().trim();
  const mod = (moduleParam || "hotels").toLowerCase().trim();

  const cwd = process.cwd();
  const candidateDirs = [
    path.join(cwd, "seed", s),
    path.join(cwd, "web", "seed", s),
    path.join(cwd, "seed", "gujjutours"),
    path.join(cwd, "web", "seed", "gujjutours"),
  ];

  function readJson(filename: string): any[] {
    for (const d of candidateDirs) {
      const p = path.join(d, filename);
      if (fs.existsSync(p)) {
        try {
          const raw = fs.readFileSync(p, "utf-8");
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : parsed.items || parsed.data || [];
        } catch {
          // ignore parsing error
        }
      }
    }
    return [];
  }

  let moduleFile = `${mod}.json`;
  if (mod === "tours") moduleFile = `tours.${s}.json`;
  if (mod === "buildpackage") moduleFile = "build-package-options.json";

  let items = readJson(moduleFile);
  if (items.length === 0 && mod === "tours") {
    items = readJson("activities.json");
  }

  const categories = readJson("categories.json")
    .filter((c: any) => !c.module || c.module === mod || c.module === "all")
    .map((c: any) => {
      const resolvedName =
        typeof c.name === "object" && c.name !== null
          ? c.name.en || c.name.gu || c.name.ms || Object.values(c.name)[0] || c.slug || "Category"
          : c.name || c.title || c.label || c.slug || "Category";
      return {
        ...c,
        name: resolvedName,
        label: resolvedName,
      };
    });
  const packages = readJson("packages.json").slice(0, 8);

  const currency = s === "gujjutours" ? "INR" : s === "technoheaven" ? "AED" : "USD";

  const featured = items.slice(0, 8).map((item: any, idx: number) => ({
    id: item.id || item._id || item.packageId || `${mod}-${idx}`,
    slug: item.slug || String(item.id || idx),
    title: item.title || item.name || `${mod} item`,
    name: item.name || item.title || `${mod} item`,
    rating: typeof item.rating === "number" ? item.rating : 4.8,
    reviewsCount: item.reviews || item.reviewCount || 42,
    price: item.price || item.startingPrice || item.costForTwo || 1500,
    currency: item.currency || currency,
    image:
      item.image ||
      (Array.isArray(item.images) && item.images[0]) ||
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    location: item.location || item.destination || item.city || "Dubai",
    badge: item.featured ? "FEATURED" : "POPULAR",
    duration: item.duration || "4 Nights / 5 Days",
  }));

  const destinationNames = Array.from(
    new Set(items.map((i: any) => i.destination || i.city).filter(Boolean))
  );

  const destinations =
    destinationNames.length > 0
      ? destinationNames.slice(0, 8).map((city: any, idx: number) => ({
          id: `dest-${idx}`,
          name: String(city),
          city: String(city),
          image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
          count: items.filter((i: any) => (i.destination || i.city) === city).length || 10,
        }))
      : [
          { id: "dest-1", name: "Dubai", city: "Dubai", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80", count: 24 },
          { id: "dest-2", name: "Bali", city: "Bali", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80", count: 18 },
          { id: "dest-3", name: "Singapore", city: "Singapore", image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80", count: 15 },
        ];

  return {
    success: true,
    websiteId: s,
    module: mod,
    meta: {
      title: `${mod.charAt(0).toUpperCase() + mod.slice(1)} Collection`,
      subtitle: "Verified travel inventory with best rate guarantee.",
      badge: "VERIFIED",
      searchModule: mod,
      citySectionTitle: `Top ${mod.charAt(0).toUpperCase() + mod.slice(1)} Destinations`,
      viewMoreUrl: `/en/${mod}`,
    },
    banners: [],
    heroBanners: [],
    offers: [],
    featured,
    destinations,
    categories,
    packages,
    videos: [],
    reviews: [],
    faq: [],
    partners: [],
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const site = (
    searchParams.get("site") ||
    process.env.NEXT_PUBLIC_SITE_ID ||
    process.env.SITE_ID ||
    "gujjutours"
  ).toLowerCase();
  const moduleParam = (searchParams.get("module") || "hotels").toLowerCase();

  try {
    const data = await getHomeData(
      { module: moduleParam, site },
      { cache: "no-store" }
    );
    if (data && (Array.isArray(data.featured) ? data.featured.length > 0 : true)) {
      return NextResponse.json(data);
    }
    // If backend returned empty payload, supplement with fallback
    const fallback = getSeedFallbackHomeData(site, moduleParam);
    return NextResponse.json({ ...fallback, ...data });
  } catch {
    // Backend offline, restarting, or network timeout: serve resilient seed data
    const fallback = getSeedFallbackHomeData(site, moduleParam);
    return NextResponse.json(fallback);
  }
}
