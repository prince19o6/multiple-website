import type {
  SupportedSiteId,
  CatalogItem,
  BannerSection,
  CityDestination,
  HotelItem,
  ActivityItem,
  LiveWeatherInfo,
  ReviewItem
} from "./types";

const CDN_GUJJU = "https://d3bfv5x1dw8ekm.cloudfront.net";
const CDN_TRIPGO = "https://d21bqxhdty55n7.cloudfront.net";
const CDN_TECHNO = "https://stagingimage.technoheaven.com/uploads/2d10d5d6-5278-817d-ddf1-3a2036a6c997";

export function resolveCatalogImage(imagePath: string | undefined | null, siteId: SupportedSiteId): string {
  if (!imagePath || typeof imagePath !== "string") {
    return "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80";
  }

  const clean = imagePath.trim();
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }

  if (siteId === "tripgoasia") {
    if (clean.startsWith("tour-images/") || clean.startsWith("hotel-images/")) {
      return `${CDN_TRIPGO}/${clean}`;
    }
    return `${CDN_TRIPGO}/uploads/${clean}`;
  }

  if (siteId === "technoheaven") {
    if (clean.startsWith("cemalimage") || clean.includes("technologomain")) {
      return `${CDN_TECHNO}/WebsiteMaster/iconId/${clean}`;
    }
    return `${CDN_TECHNO}/${clean}`;
  }

  // Default Gujju Tours
  if (clean.startsWith("/")) {
    return `${CDN_GUJJU}${clean}`;
  }
  return `${CDN_GUJJU}/uploads/${clean}`;
}

export function generateSlug(name: string, id: number | string): string {
  const safeName = (name || "item")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${safeName}-${id}`;
}

export function normalizeRawProduct(raw: Record<string, any>, siteId: SupportedSiteId, defaultServiceType: string = "STATIC"): CatalogItem {
  const id = raw.id ?? raw.serviceId ?? raw.tourId ?? raw.hotelId ?? Math.floor(Math.random() * 100000);
  const title = raw.name || raw.defaultName || raw.title || "Experience";
  const defaultTitle = raw.defaultName || raw.name;
  const description = raw.description || raw.shortDescription || raw.Address || "";
  const image = resolveCatalogImage(raw.imagePath || raw.ImagePath || raw.image, siteId);
  
  // Price handling
  const price = typeof raw.price === "number" ? raw.price : parseFloat(raw.price) || 0;
  let originalPrice: number | undefined = undefined;
  let discountPercent: number | undefined = undefined;

  if (raw.discount && typeof raw.discount === "object") {
    const d = raw.discount;
    if (typeof d.discountPrice === "number" && d.discountPrice > price) {
      originalPrice = d.discountPrice;
      discountPercent = Math.round(((d.discountPrice - price) / d.discountPrice) * 100);
    } else if (typeof d.dicountPercentage === "number" && d.dicountPercentage > 0 && d.dicountPercentage < 100) {
      discountPercent = d.dicountPercentage;
      originalPrice = Math.round(price / (1 - d.dicountPercentage / 100));
    }
  }

  // Currency code
  const currencyCode = raw.supplierCurrencyCode || (siteId === "tripgoasia" ? "USD" : siteId === "gujjutours" ? "INR" : "USD");

  // Rating & Reviews
  const starNum = parseFloat(raw.StartRating || raw.rating || "0");
  const rating = !isNaN(starNum) && starNum > 0 ? starNum : 4.5;
  const reviewsCount = parseInt(raw.review?.reviewName || raw.reviewsCount || "0", 10) || 12;

  // Badge
  const badge = raw.bedgeList?.bedgeName || (raw.additionalInfo?.propertyType) || undefined;

  // City and Country
  const cityName = raw.city?.cityName || raw.categoryName || (typeof raw.city === "string" ? raw.city : undefined);
  const countryName = raw.country?.countryName || (typeof raw.country === "string" ? raw.country : undefined);
  const address = raw.Address || raw.fullAddress || "";

  // Weather details
  let weather: LiveWeatherInfo | undefined = undefined;
  if (raw.weatherDetails && (raw.weatherDetails.minTemp || raw.weatherDetails.maxTemp)) {
    weather = {
      minTemp: raw.weatherDetails.minTemp || 0,
      maxTemp: raw.weatherDetails.maxTemp || 0,
      weatherCode: raw.weatherDetails.weatherCode || "clear",
      aqiValue: raw.weatherDetails.aqiValue,
      aqiIcon: raw.weatherDetails.aiqIcon
    };
  }

  let serviceType: CatalogItem["serviceType"] = "STATIC";
  const typeStr = (raw.serviceType?.code || defaultServiceType || "").toUpperCase();
  if (typeStr.includes("HOTEL")) serviceType = "HOTEL";
  else if (typeStr.includes("TOUR") || typeStr.includes("ATTRACTION")) serviceType = "TOUR";
  else if (typeStr.includes("PACKAGE") || typeStr.includes("HOLIDAY")) serviceType = "PACKAGE";
  else if (typeStr.includes("TRANSFER")) serviceType = "TRANSFER";
  else if (typeStr.includes("FLIGHT")) serviceType = "FLIGHT";
  else if (typeStr.includes("VISA")) serviceType = "VISA";
  else if (typeStr.includes("B2B")) serviceType = "B2B";

  return {
    id,
    slug: generateSlug(title, id),
    title,
    defaultTitle,
    description,
    shortDescription: raw.shortDescription,
    image,
    price,
    originalPrice,
    discountPercent,
    currencyCode,
    rating,
    reviewsCount,
    badge,
    category: raw.categoryName || raw.additionalInfo?.propertyType || (serviceType === "HOTEL" ? "Hotels" : "Tours"),
    categoryId: raw.categoryId || raw.city?.cityId,
    cityName,
    countryName,
    address,
    starRating: raw.StartRating || starNum,
    weather,
    serviceType,
    raw
  };
}

export function normalizeRawBanner(raw: Record<string, any>, siteId: SupportedSiteId): BannerSection {
  const bannerMasterId = raw.bannerMasterId ?? raw.id ?? Math.floor(Math.random() * 1000);
  const name = raw.name || raw.title || "Featured Collection";
  const patternName = raw.patternDetails?.patternName || raw.pattern || "carousel-1-4";
  const serviceTypeCode = raw.serviceType?.code || raw.serviceType?.name || "STATIC";

  const rawProducts = Array.isArray(raw.productDetails) ? raw.productDetails : [];
  const items = rawProducts.map((p: any) => normalizeRawProduct(p, siteId, serviceTypeCode));

  return {
    bannerMasterId,
    name,
    tagLine: raw.tagLine || "",
    patternName,
    serviceType: serviceTypeCode,
    items,
    rawCount: rawProducts.length
  };
}

export function extractCityDestinations(banners: BannerSection[]): CityDestination[] {
  const destinationMap = new Map<string, CityDestination>();

  for (const banner of banners) {
    for (const item of banner.items) {
      if (item.cityName) {
        const key = item.cityName.toLowerCase();
        if (!destinationMap.has(key)) {
          destinationMap.set(key, {
            id: item.categoryId || item.id,
            name: item.cityName,
            countryName: item.countryName || "Asia",
            image: item.image,
            hotelCount: item.serviceType === "HOTEL" ? 1 : 0,
            tourCount: item.serviceType === "TOUR" ? 1 : 0,
            weather: item.weather,
            slug: item.cityName.toLowerCase().replace(/[^a-z0-9]+/g, "-")
          });
        } else {
          const dest = destinationMap.get(key)!;
          if (item.serviceType === "HOTEL") dest.hotelCount = (dest.hotelCount || 0) + 1;
          if (item.serviceType === "TOUR") dest.tourCount = (dest.tourCount || 0) + 1;
          if (!dest.weather && item.weather) dest.weather = item.weather;
        }
      }
    }
  }

  return Array.from(destinationMap.values());
}

export function toHotelItem(item: CatalogItem): HotelItem {
  const stars = typeof item.starRating === "number" ? item.starRating : parseInt(String(item.starRating || "4"), 10) || 4;
  return {
    ...item,
    serviceType: "HOTEL",
    starRating: stars,
    address: item.address || `${item.cityName || "City Center"}, ${item.countryName || ""}`,
    amenities: ["Free Wi-Fi", "Swimming Pool", "Breakfast Included", "Airport Shuttle", "Air Conditioning"],
    rooms: [
      {
        id: `${item.id}-std`,
        name: "Deluxe King Room",
        price: item.price,
        capacity: "2 Adults",
        boardType: "Breakfast Included",
        cancellationPolicy: "Free cancellation before 48h"
      },
      {
        id: `${item.id}-suite`,
        name: "Executive Ocean Suite",
        price: Math.round(item.price * 1.45),
        capacity: "3 Adults or 2 Adults + 2 Children",
        boardType: "All Inclusive",
        cancellationPolicy: "Non-refundable discount"
      }
    ]
  };
}

export function toActivityItem(item: CatalogItem): ActivityItem {
  return {
    ...item,
    serviceType: "TOUR",
    duration: "Full Day (6-8 hours)",
    difficulty: "Easy to Moderate",
    groupSize: "Shared or Private Group",
    highlights: [
      "Hotel pickup and drop-off included",
      "English speaking certified expert guide",
      "Instant e-voucher confirmation",
      "All admission and national park fees covered"
    ],
    inclusions: [
      "Guided sightseeing tour",
      "Entry tickets & access permits",
      "Complimentary bottled water & light snacks"
    ],
    exclusions: [
      "Personal travel insurance",
      "Gratuities & tips for driver/guide"
    ],
    cancellationPolicy: "Cancel up to 24 hours in advance for a full refund",
    options: [
      {
        id: `${item.id}-std`,
        title: "Standard Admission",
        price: item.price,
        duration: "Flexible"
      },
      {
        id: `${item.id}-vip`,
        title: "VIP Fast-Track with Private Transfer",
        price: Math.round(item.price * 1.6),
        duration: "Full Day"
      }
    ]
  };
}

export function extractReviewItems(banners: BannerSection[]): ReviewItem[] {
  const reviews: ReviewItem[] = [];
  const reviewBanners = banners.filter(b => b.patternName.includes("review") || b.name.toLowerCase().includes("traveler") || b.name.toLowerCase().includes("say"));

  for (const b of reviewBanners) {
    for (const item of b.items) {
      reviews.push({
        id: item.id,
        author: item.title || "Verified Traveler",
        rating: item.rating || 5,
        comment: item.description || "Incredible service, seamless booking and responsive concierge throughout our journey!",
        avatar: item.image,
        location: item.cityName || "India"
      });
    }
  }

  if (reviews.length === 0) {
    reviews.push(
      {
        id: 1,
        author: "Aarav Patel",
        rating: 5,
        comment: "Booked our family Dubai package. The Jain meal arrangements and 24/7 WhatsApp concierge were beyond expectations!",
        location: "Ahmedabad, Gujarat"
      },
      {
        id: 2,
        author: "Emily Tan",
        rating: 5,
        comment: "Instant confirmation for our Langkawi island ATV and sunset cruise. The prices were noticeably better than on-site booking.",
        location: "Singapore"
      },
      {
        id: 3,
        author: "Rajesh Sharma",
        rating: 5,
        comment: "Excellent hotel rates in Udaipur and prompt customer support when we needed to adjust our check-in time.",
        location: "Mumbai"
      }
    );
  }

  return reviews;
}
