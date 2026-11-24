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

  const fallbackBannersMap: Record<string, any[]> = {
    flights: [
      {
        id: "banner-flight-1",
        title: "Surat & Mumbai to Dubai Direct Airfares",
        subtitle: "Special group airfares with 30kg luggage allowance and confirmed 100% Pure Veg dining.",
        tag: "Direct Flights",
        badge: "Direct Flights",
        buttonText: "Book Airfare",
        ctaText: "Book Airfare",
        buttonUrl: "/en/flights",
        ctaLink: "/en/flights",
        imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=85",
        gradient: "linear-gradient(135deg, #0369a1 0%, #1e40af 60%, #312e81 100%)",
      },
      {
        id: "banner-flight-2",
        title: "Emirates & Air India Special Holiday Fares",
        subtitle: "Save up to 15% on return tickets with flexible date change and zero hidden booking fees.",
        tag: "Limited Offer",
        badge: "Limited Offer",
        buttonText: "View Flight Deals",
        ctaText: "View Flight Deals",
        buttonUrl: "/en/flights",
        ctaLink: "/en/flights",
        imageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=85",
        gradient: "linear-gradient(135deg, #991b1b 0%, #881337 60%, #451a03 100%)",
      },
    ],
    hotels: [
      {
        id: "banner-hotel-1",
        title: "Book Now, Pay Later on Luxury Stays",
        subtitle: "Reserve 4-star and 5-star verified hotels with zero upfront advance payment.",
        tag: "Zero Down Payment",
        badge: "Zero Down Payment",
        buttonText: "Explore Stays",
        ctaText: "Explore Stays",
        buttonUrl: "/en/hotels",
        ctaLink: "/en/hotels",
        imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=85",
        gradient: "linear-gradient(135deg, #0284c7 0%, #1d4ed8 60%, #312e81 100%)",
      },
      {
        id: "banner-hotel-2",
        title: "Complimentary Pure Veg Breakfast & Upgrades",
        subtitle: "Exclusive member perks on top family hotels across Dubai & global destinations.",
        tag: "Member Perk",
        badge: "Member Perk",
        buttonText: "View Hotel Deals",
        ctaText: "View Hotel Deals",
        buttonUrl: "/en/hotels",
        ctaLink: "/en/hotels",
        imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=85",
        gradient: "linear-gradient(135deg, #047857 0%, #0f766e 60%, #0e7490 100%)",
      },
    ],
    tours: [
      {
        id: "banner-tour-1",
        title: "Red Dune Desert Safari & BBQ Dinner Combo",
        subtitle: "4x4 Land Cruiser dune bashing, sandboarding, camel rides, and vegetarian BBQ buffet.",
        tag: "Top Rated",
        badge: "Top Rated",
        buttonText: "Book Safari Deal",
        ctaText: "Book Safari Deal",
        buttonUrl: "/en/tours",
        ctaLink: "/en/tours",
        imageUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&q=85",
        gradient: "linear-gradient(135deg, #b45309 0%, #c2410c 60%, #9f1239 100%)",
      },
      {
        id: "banner-tour-2",
        title: "Burj Khalifa 124th + Dubai Aquarium Combo",
        subtitle: "Save up to 25% with the official fast-track combo pass. Instant mobile voucher.",
        tag: "Super Saver",
        badge: "Super Saver",
        buttonText: "Get Combo Pass",
        ctaText: "Get Combo Pass",
        buttonUrl: "/en/tours",
        ctaLink: "/en/tours",
        imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=85",
        gradient: "linear-gradient(135deg, #1d4ed8 0%, #0284c7 60%, #1e1b4b 100%)",
      },
    ],
    packages: [
      {
        id: "banner-pkg-1",
        title: "All-Inclusive Dubai Family Holidays with Jain Food",
        subtitle: "5D/4N luxury package with 4-star stays, desert safari, Burj Khalifa, and private cabs.",
        tag: "Family Special",
        badge: "Family Special",
        buttonText: "Explore Packages",
        ctaText: "Explore Packages",
        buttonUrl: "/en/packages",
        ctaLink: "/en/packages",
        imageUrl: "https://images.unsplash.com/photo-1546412414-e1885259563a?w=1200&q=85",
        gradient: "linear-gradient(135deg, #047857 0%, #0f766e 60%, #0891b2 100%)",
      },
      {
        id: "banner-pkg-2",
        title: "Bali Private Pool Villa 6D/5N Honeymoon Escape",
        subtitle: "Includes floating breakfast, Nusa Penida speedboat tour, and daily dedicated chauffeur.",
        tag: "Romantic Escape",
        badge: "Romantic Escape",
        buttonText: "Discover Bali",
        ctaText: "Discover Bali",
        buttonUrl: "/en/packages",
        ctaLink: "/en/packages",
        imageUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=85",
        gradient: "linear-gradient(135deg, #6d28d9 0%, #7e22ce 60%, #312e81 100%)",
      },
    ],
  };

  const seedBanners = fallbackBannersMap[mod] || fallbackBannersMap.hotels;

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
    banners: seedBanners,
    heroBanners: seedBanners,
    offers: seedBanners,
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
