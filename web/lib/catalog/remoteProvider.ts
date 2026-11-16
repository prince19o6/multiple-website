import type {
  SupportedSiteId,
  CatalogProvider,
  BannerSection,
  CityDestination,
  HotelItem,
  ActivityItem,
  ReviewItem,
  LiveWeatherInfo,
  HotelSearchParams,
  TourSearchParams
} from "./types";
import {
  normalizeRawBanner,
  toHotelItem,
  toActivityItem,
  extractReviewItems
} from "./adapters";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  revalidateAfter: number;
}

export class RemotePlatformProvider implements CatalogProvider {
  private cache = new Map<string, CacheEntry<any>>();
  private baseUrl: string;

  constructor(backendUrl?: string) {
    this.baseUrl = (backendUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
  }

  // Cache TTLs in milliseconds
  readonly TTL_CONFIG = 5 * 60 * 1000;      // 5 min
  readonly TTL_CATALOG = 10 * 60 * 1000;    // 10 min
  readonly TTL_WEATHER = 30 * 60 * 1000;    // 30 min

  assertSiteIsolation(siteId: SupportedSiteId, targetHostname: string): void {
    if (siteId === "gujjutours" && !targetHostname.includes("gujjutours")) {
      throw new Error(`[Security Violation] Site gujjutours cannot make calls to ${targetHostname}`);
    }
    if (siteId === "tripgoasia" && !targetHostname.includes("tripgoasia")) {
      throw new Error(`[Security Violation] Site tripgoasia cannot make calls to ${targetHostname}`);
    }
    if (siteId === "technoheaven" && !targetHostname.includes("technoheaven")) {
      throw new Error(`[Security Violation] Site technoheaven cannot make calls to ${targetHostname}`);
    }
  }

  private normalizeSiteId(siteId: SupportedSiteId): string {
    const s = (siteId || "gujjutours").toLowerCase();
    if (s.includes("gujju") || s === "website1") return "gujjutours";
    if (s.includes("tripgo") || s === "website2") return "tripgoasia";
    return "technoheaven";
  }

  private getHostname(siteId: string): string {
    if (siteId === "tripgoasia") return "www.tripgoasia.com";
    if (siteId === "technoheaven") return "stagingb2b.technoheaven.com";
    return "www.gujjutours.com";
  }

  private async getCachedOrFetch<T>(
    key: string,
    ttl: number,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && now < cached.revalidateAfter) {
      return cached.data;
    }

    const data = await fetchFn();
    this.cache.set(key, {
      data,
      timestamp: now,
      revalidateAfter: now + ttl
    });
    return data;
  }

  async getBanners(siteId: SupportedSiteId, lang: string = "en"): Promise<BannerSection[]> {
    const normalizedSite = this.normalizeSiteId(siteId);
    const hostname = this.getHostname(normalizedSite);
    const cacheKey = `banners:${normalizedSite}:${lang}`;

    return this.getCachedOrFetch<BannerSection[]>(
      cacheKey,
      this.TTL_CATALOG,
      async () => {
        const res = await fetch(`${this.baseUrl}/api/catalog/banners?site=${encodeURIComponent(normalizedSite)}`, {
          headers: {
            "Accept": "application/json",
            "X-Website-Hostname": hostname,
            "X-Website-Id": normalizedSite
          },
          next: { revalidate: 300 }
        });

        if (!res.ok) {
          throw new Error(`Catalog banners API failed with HTTP ${res.status}`);
        }

        const json = await res.json();
        const rawItems = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
        return rawItems.map((b: any) => normalizeRawBanner(b, normalizedSite as SupportedSiteId));
      }
    );
  }

  async getDestinations(siteId: SupportedSiteId, lang: string = "en"): Promise<CityDestination[]> {
    const normalizedSite = this.normalizeSiteId(siteId);
    const hostname = this.getHostname(normalizedSite);
    const cacheKey = `destinations:${normalizedSite}:${lang}`;

    return this.getCachedOrFetch<CityDestination[]>(
      cacheKey,
      this.TTL_CATALOG,
      async () => {
        const res = await fetch(`${this.baseUrl}/api/destinations?site=${encodeURIComponent(normalizedSite)}`, {
          headers: {
            "Accept": "application/json",
            "X-Website-Hostname": hostname,
            "X-Website-Id": normalizedSite
          },
          next: { revalidate: 300 }
        });

        if (!res.ok) {
          throw new Error(`Destinations API failed with HTTP ${res.status}`);
        }

        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
        return list.map((d: any, idx: number) => ({
          id: d.id || d._id || idx,
          name: d.name || d.cityName,
          countryName: d.country || d.countryName || "",
          image: d.image || d.imageUrl || "",
          toursCount: d.toursCount || d.count || 0
        }));
      }
    );
  }

  async getHotels(siteId: SupportedSiteId, params?: HotelSearchParams): Promise<HotelItem[]> {
    const normalizedSite = this.normalizeSiteId(siteId);
    const hostname = this.getHostname(normalizedSite);

    const queryParams = new URLSearchParams();
    queryParams.set("site", normalizedSite);
    if (params?.cityIdOrName) queryParams.set("destination", params.cityIdOrName);
    if (params?.minStars) queryParams.set("stars", String(params.minStars));
    if (params?.propertyType) queryParams.set("propertyType", params.propertyType);

    const res = await fetch(`${this.baseUrl}/api/hotels?${queryParams.toString()}`, {
      headers: {
        "Accept": "application/json",
        "X-Website-Hostname": hostname,
        "X-Website-Id": normalizedSite
      },
      next: { revalidate: 120 }
    });

    if (!res.ok) {
      throw new Error(`Hotels API failed with HTTP ${res.status}`);
    }

    const json = await res.json();
    const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
    return list.map((h: any) => ({
      id: h.id || h._id,
      slug: h.slug || String(h.id),
      title: h.title || h.name,
      cityName: h.destination?.cityName || h.city || "",
      countryName: h.destination?.country || h.country || "",
      address: h.destination?.address || "",
      starRating: h.starRating || 4,
      rating: h.rating || 4.5,
      reviewsCount: h.reviewCount || h.reviewsCount || 0,
      price: h.pricePerNight || h.price || 0,
      images: Array.isArray(h.images) ? h.images : [h.image].filter(Boolean),
      amenities: Array.isArray(h.amenities) ? h.amenities : [],
      dietaryFeatures: h.dietaryFeatures || { pureVeg: false, jainAvailable: false, halalCertified: false },
      badge: h.featured ? "Featured" : undefined
    }));
  }

  async getHotelDetail(siteId: SupportedSiteId, slugOrId: string | number): Promise<HotelItem | null> {
    const normalizedSite = this.normalizeSiteId(siteId);
    const hostname = this.getHostname(normalizedSite);

    const res = await fetch(`${this.baseUrl}/api/hotels/${encodeURIComponent(String(slugOrId))}?site=${encodeURIComponent(normalizedSite)}`, {
      headers: {
        "Accept": "application/json",
        "X-Website-Hostname": hostname,
        "X-Website-Id": normalizedSite
      },
      next: { revalidate: 120 }
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Hotel detail API failed with HTTP ${res.status}`);
    }

    const json = await res.json();
    const h = json.data || json;
    if (!h) return null;

    const img = Array.isArray(h.images) && h.images.length > 0 ? h.images[0] : (h.image || "");
    return toHotelItem({
      id: h.id || h._id,
      slug: h.slug || String(h.id),
      title: h.title || h.name,
      description: h.description || h.shortDescription || "",
      cityName: h.destination?.cityName || h.city || "",
      countryName: h.destination?.country || h.country || "",
      address: h.destination?.address || "",
      starRating: h.starRating || 4,
      rating: h.rating || 4.5,
      reviewsCount: h.reviewCount || h.reviewsCount || 0,
      price: h.pricePerNight || h.price || 0,
      currencyCode: h.currencyCode || "USD",
      image: img,
      gallery: Array.isArray(h.images) ? h.images : [img],
      category: h.category || "Hotel",
      serviceType: "HOTEL",
      badge: h.featured ? "Featured" : undefined
    });
  }

  async getTours(siteId: SupportedSiteId, params?: TourSearchParams): Promise<ActivityItem[]> {
    const normalizedSite = this.normalizeSiteId(siteId);
    const hostname = this.getHostname(normalizedSite);

    const queryParams = new URLSearchParams();
    queryParams.set("site", normalizedSite);
    if (params?.destination) queryParams.set("destination", params.destination);
    if (params?.category) queryParams.set("category", params.category);
    if (params?.sort) queryParams.set("sort", params.sort);

    const res = await fetch(`${this.baseUrl}/api/tours?${queryParams.toString()}`, {
      headers: {
        "Accept": "application/json",
        "X-Website-Hostname": hostname,
        "X-Website-Id": normalizedSite
      },
      next: { revalidate: 120 }
    });

    if (!res.ok) {
      throw new Error(`Tours API failed with HTTP ${res.status}`);
    }

    const json = await res.json();
    const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
    return list.map((t: any) => ({
      id: t.id || t._id,
      slug: t.slug || String(t.id),
      title: t.name || t.title,
      cityName: t.destination || t.cityName || "",
      duration: t.duration || "",
      rating: t.rating || 4.8,
      reviewsCount: t.reviewCount || t.reviewsCount || 0,
      price: t.price || 0,
      images: Array.isArray(t.images) ? t.images : [t.image].filter(Boolean),
      category: t.category || "Sightseeing",
      badge: t.featured ? "Featured" : undefined
    }));
  }

  async getTourDetail(siteId: SupportedSiteId, slugOrId: string | number): Promise<ActivityItem | null> {
    const normalizedSite = this.normalizeSiteId(siteId);
    const hostname = this.getHostname(normalizedSite);

    const res = await fetch(`${this.baseUrl}/api/tours/${encodeURIComponent(String(slugOrId))}?site=${encodeURIComponent(normalizedSite)}`, {
      headers: {
        "Accept": "application/json",
        "X-Website-Hostname": hostname,
        "X-Website-Id": normalizedSite
      },
      next: { revalidate: 120 }
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Tour detail API failed with HTTP ${res.status}`);
    }

    const json = await res.json();
    const t = json.data || json;
    if (!t) return null;

    const img = Array.isArray(t.images) && t.images.length > 0 ? t.images[0] : (t.image || "");
    return toActivityItem({
      id: t.id || t._id,
      slug: t.slug || String(t.id),
      title: t.name || t.title,
      description: t.description || t.shortDescription || "",
      cityName: t.destination || t.cityName || "",
      countryName: t.country || "",
      rating: t.rating || 4.8,
      reviewsCount: t.reviewCount || t.reviewsCount || 0,
      price: t.price || 0,
      currencyCode: t.currencyCode || "USD",
      image: img,
      gallery: Array.isArray(t.images) ? t.images : [img],
      category: t.category || "Sightseeing",
      serviceType: "TOUR",
      badge: t.featured ? "Featured" : undefined
    });
  }

  async getReviews(siteId: SupportedSiteId): Promise<ReviewItem[]> {
    const banners = await this.getBanners(siteId);
    return extractReviewItems(banners);
  }

  async getWeather(siteId: SupportedSiteId, cityIdOrName: string): Promise<LiveWeatherInfo | null> {
    const normalizedSite = this.normalizeSiteId(siteId);
    const hostname = this.getHostname(normalizedSite);

    try {
      const res = await fetch(`${this.baseUrl}/api/weather/destinations?site=${encodeURIComponent(normalizedSite)}`, {
        headers: {
          "Accept": "application/json",
          "X-Website-Hostname": hostname
        },
        next: { revalidate: 1800 }
      });

      if (!res.ok) return null;
      const json = await res.json();
      const list = Array.isArray(json.data) ? json.data : [];
      const match = list.find((c: any) => c.name?.toLowerCase() === cityIdOrName.toLowerCase());
      return match?.weather || null;
    } catch {
      return null;
    }
  }
}
