import { NextRequest, NextResponse } from "next/server";
import { loadSeedEntities } from "@/lib/api/seedFallback";
import { getTenantHostname, getDefaultApiKey, getApiBaseUrl } from "@/lib/api/client";

export const dynamic = "force-dynamic";

export interface SuggestionItem {
  id: string;
  name: string;
  subtitle: string;
  city?: string;
  country?: string;
  type: "city" | "hotel" | "popular";
  image?: string;
}

const POPULAR_DESTINATIONS: SuggestionItem[] = [
  {
    id: "pop-dubai",
    name: "Dubai",
    subtitle: "United Arab Emirates",
    city: "Dubai",
    country: "UAE",
    type: "popular",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=200&q=80",
  },
  {
    id: "pop-abu-dhabi",
    name: "Abu Dhabi",
    subtitle: "United Arab Emirates",
    city: "Abu Dhabi",
    country: "UAE",
    type: "popular",
    image: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=200&q=80",
  },
  {
    id: "pop-singapore",
    name: "Singapore",
    subtitle: "Marina Bay & Sentosa",
    city: "Singapore",
    country: "Singapore",
    type: "popular",
    image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=200&q=80",
  },
  {
    id: "pop-bangkok",
    name: "Bangkok",
    subtitle: "Thailand",
    city: "Bangkok",
    country: "Thailand",
    type: "popular",
    image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=200&q=80",
  },
  {
    id: "pop-bali",
    name: "Bali",
    subtitle: "Indonesia",
    city: "Bali",
    country: "Indonesia",
    type: "popular",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=200&q=80",
  },
  {
    id: "pop-goa",
    name: "Goa",
    subtitle: "India",
    city: "Goa",
    country: "India",
    type: "popular",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=200&q=80",
  },
  {
    id: "pop-jaipur",
    name: "Jaipur",
    subtitle: "Rajasthan, India",
    city: "Jaipur",
    country: "India",
    type: "popular",
    image: "https://images.unsplash.com/photo-1603262110263-fb010d6e75dc?w=200&q=80",
  },
  {
    id: "pop-kashmir",
    name: "Kashmir & Srinagar",
    subtitle: "Jammu & Kashmir, India",
    city: "Srinagar",
    country: "India",
    type: "popular",
    image: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=200&q=80",
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = (searchParams.get("query") || searchParams.get("q") || "").trim().toLowerCase();
  const siteId = (searchParams.get("site") || "gujjutours").toLowerCase();

  // If query is empty, return popular destinations
  if (!q) {
    return NextResponse.json({
      success: true,
      data: {
        cities: [],
        hotels: [],
        popular: POPULAR_DESTINATIONS,
      },
    });
  }

  const citiesMap = new Map<string, SuggestionItem>();
  const hotelsList: SuggestionItem[] = [];
  const popularList: SuggestionItem[] = [];

  // 1. Check popular destinations match
  for (const pop of POPULAR_DESTINATIONS) {
    if (
      pop.name.toLowerCase().includes(q) ||
      pop.subtitle.toLowerCase().includes(q) ||
      pop.city?.toLowerCase().includes(q) ||
      pop.country?.toLowerCase().includes(q)
    ) {
      popularList.push(pop);
    }
  }

  // 2. Fetch or load hotels
  let hotelsData: any[] = [];
  try {
    const apiUrl = getApiBaseUrl();
    const hostname = getTenantHostname(siteId);
    const apiKey = getDefaultApiKey(siteId);

    const res = await fetch(`${apiUrl}/api/hotels?search=${encodeURIComponent(q)}`, {
      headers: {
        "X-Website-Id": siteId,
        "X-Website-Hostname": hostname,
        "X-Api-Key": apiKey,
      },
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json().catch(() => null);
      hotelsData = json?.items ?? json?.data ?? (Array.isArray(json) ? json : []);
    }
  } catch {
    // Fall back to disk seed
  }

  if (hotelsData.length === 0) {
    hotelsData = loadSeedEntities(siteId, "hotels");
  }

  // Extract cities and hotels
  for (const h of hotelsData) {
    const name = String(h.name || h.title || "").trim();
    const city = String(h.city || h.location || h.destination || "").trim();
    const country = String(h.country || "").trim();
    const img = h.featuredImage || h.image || (Array.isArray(h.images) ? h.images[0] : undefined);

    // City suggestion
    if (city && (city.toLowerCase().includes(q) || country.toLowerCase().includes(q))) {
      const cityKey = `${city}, ${country || ""}`.trim().toLowerCase();
      if (!citiesMap.has(cityKey)) {
        citiesMap.set(cityKey, {
          id: `city-${cityKey}`,
          name: city,
          subtitle: country || "Destination",
          city,
          country,
          type: "city",
          image: img,
        });
      }
    }

    // Hotel suggestion
    if (name && (name.toLowerCase().includes(q) || city.toLowerCase().includes(q))) {
      hotelsList.push({
        id: String(h.id || h._id || name),
        name,
        subtitle: [city, country].filter(Boolean).join(", "),
        city,
        country,
        type: "hotel",
        image: img,
      });
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      cities: Array.from(citiesMap.values()).slice(0, 5),
      hotels: hotelsList.slice(0, 6),
      popular: popularList.slice(0, 4),
    },
  });
}
