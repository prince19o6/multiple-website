import { getEnv } from "@/src/config/env";
import { storeGetObject, storeSetObject } from "@/src/lib/storage";
import type {
  SupportedSiteId,
  BannerSection,
  CityDestination,
  HotelItem,
  ActivityItem,
  ReviewItem,
  LiveWeatherInfo,
} from "../lib/catalog/types";
import {
  normalizeRawBanner,
  extractCityDestinations,
  toHotelItem,
  toActivityItem,
  extractReviewItems,
} from "../lib/catalog/adapters";

function getSiteId(): SupportedSiteId {
  try {
    const env = getEnv();
    const id = (env.siteId || "gujjutours").toLowerCase();
    if (id.includes("gujju") || id === "website1") return "gujjutours";
    if (id.includes("tripgo") || id === "website2") return "tripgoasia";
    return "technoheaven";
  } catch {
    return "gujjutours";
  }
}

export async function fetchBanners(forceRefresh: boolean = false): Promise<BannerSection[]> {
  const siteId = getSiteId();
  const cacheKey = `catalog.banners.${siteId}`;

  if (!forceRefresh) {
    try {
      const cached = await storeGetObject<BannerSection[]>(cacheKey);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return cached;
      }
    } catch {
      // cache miss
    }
  }

  const env = getEnv();
  const baseUrl = env.apiUrl || "http://localhost:5000";

  const res = await fetch(`${baseUrl}/api/catalog/banners?site=${encodeURIComponent(siteId)}`, {
    headers: {
      Accept: "application/json",
      "X-Website-Hostname": env.siteHostname,
      "X-Website-Id": siteId,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to load catalog banners (HTTP ${res.status}: ${res.statusText})`);
  }

  const json = await res.json();
  if (json.success && Array.isArray(json.data)) {
    const normalized = json.data.map((b: any) => normalizeRawBanner(b, siteId));
    await storeSetObject(cacheKey, normalized);
    return normalized;
  }

  throw new Error("Invalid banners response format from backend API");
}

export async function fetchDestinations(): Promise<CityDestination[]> {
  const banners = await fetchBanners();
  return extractCityDestinations(banners);
}

export async function fetchHotels(city?: string): Promise<HotelItem[]> {
  const banners = await fetchBanners();
  const hotels: HotelItem[] = [];

  for (const b of banners) {
    for (const item of b.items) {
      if (item.serviceType === "HOTEL") {
        hotels.push(toHotelItem(item));
      }
    }
  }

  if (city) {
    const q = city.toLowerCase();
    return hotels.filter(
      (h) =>
        (h.cityName && h.cityName.toLowerCase().includes(q)) ||
        (h.countryName && h.countryName.toLowerCase().includes(q))
    );
  }

  return hotels;
}

export async function fetchHotelDetail(slugOrId: string | number): Promise<HotelItem | null> {
  const hotels = await fetchHotels();
  const target = String(slugOrId).toLowerCase();
  const found = hotels.find(
    (h) =>
      String(h.id) === target ||
      h.slug === target ||
      h.slug.endsWith(`-${target}`)
  );
  return found || null;
}

export async function fetchTours(destination?: string): Promise<ActivityItem[]> {
  const banners = await fetchBanners();
  const tours: ActivityItem[] = [];

  for (const b of banners) {
    for (const item of b.items) {
      if ((item.serviceType as string) === "ACTIVITY" || item.serviceType === "TOUR") {
        tours.push(toActivityItem(item));
      }
    }
  }

  if (destination) {
    const q = destination.toLowerCase();
    return tours.filter(
      (t) =>
        (t.cityName && t.cityName.toLowerCase().includes(q)) ||
        (t.countryName && t.countryName.toLowerCase().includes(q))
    );
  }

  return tours;
}

export async function fetchReviews(): Promise<ReviewItem[]> {
  const banners = await fetchBanners();
  return extractReviewItems(banners);
}

export async function fetchWeather(city: string): Promise<LiveWeatherInfo | null> {
  const env = getEnv();
  const baseUrl = env.apiUrl || "http://localhost:5000";
  const siteId = getSiteId();

  try {
    const res = await fetch(
      `${baseUrl}/api/weather?city=${encodeURIComponent(city)}&site=${encodeURIComponent(siteId)}`,
      {
        headers: {
          Accept: "application/json",
          "X-Website-Hostname": env.siteHostname,
        },
      }
    );
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data as LiveWeatherInfo;
      }
    }
  } catch {
    // live weather can fail without crashing catalog
  }

  return null;
}
