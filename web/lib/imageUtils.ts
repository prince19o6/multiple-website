// lib/imageUtils.ts
// Robust image handling and actual high-definition travel photography mapping.

export const FALLBACK_TOUR_IMAGE =
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&h=800&fit=crop";

export const FALLBACK_IMAGES_BY_CATEGORY: Record<string, string> = {
  mountains: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&h=800&fit=crop",
  beach: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=800&fit=crop",
  city: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&h=800&fit=crop",
  wildlife: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1200&h=800&fit=crop",
};

// Curated actual high-resolution travel photography pools
const ACTUAL_PHOTOS: Record<string, string[]> = {
  hotels: [
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=85", // Atlantis style luxury resort
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=85", // Grand palace luxury stay
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=85", // Beachfront coastal resort
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=85", // Hill station luxury hotel
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=85", // Tropical infinity pool resort
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=85", // Executive hotel master suite
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=85", // Modern skyline apartment hotel
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200&q=85", // Boutique heritage villa
    "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=1200&q=85", // Private pool villa
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=85", // Premium luxury exterior
  ],
  tours: [
    "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&q=85", // Red dune evening desert safari
    "https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=1200&q=85", // Camel caravan trek at sunset
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=85", // Burj Khalifa & Downtown Dubai tour
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=85", // Dubai Marina luxury yacht cruise
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=85", // Tropical speedboat & island hopping
    "https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=1200&q=85", // Theme park roller coaster & rides
    "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&q=85", // Cultural heritage monument tour
    "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1200&q=85", // Southeast Asia temple excursion
    "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1200&q=85", // Wildlife sanctuary 4x4 safari
    "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=1200&q=85", // Night skyline observation deck
  ],
  packages: [
    "https://images.unsplash.com/photo-1546412414-e1885259563a?w=1200&q=85", // Exotic Dubai Holiday
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=85", // Kashmir Valley & Shikara Ride
    "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&q=85", // Kerala Backwaters Houseboat
    "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=85", // Bali Tropical Honeymoon
    "https://images.unsplash.com/photo-1598890777032-bde835ba27c2?w=1200&q=85", // Royal Rajasthan Heritage
    "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=1200&q=85", // Singapore Marina Bay Holiday
    "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&q=85", // Thailand Beach & Island Vacation
    "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=1200&q=85", // Manali Snow Mountain Escape
  ],
  flights: [
    "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=85", // Commercial airliner flying in clear sky
    "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=85", // Airport runway & sunset departure
    "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=1200&q=85", // Aircraft wing over clouds
    "https://images.unsplash.com/photo-1520437358207-323b43b50729?w=1200&q=85", // Airliner climbing into sky
  ],
  transfers: [
    "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&q=85", // Executive Mercedes-Benz Sedan
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=85", // Luxury Private SUV
    "https://images.unsplash.com/photo-1563720223185-11003d516935?w=1200&q=85", // Premium VIP City Chauffeur
    "https://images.unsplash.com/photo-1559297434-fae8a1916a79?w=1200&q=85", // Executive Minivan Transfer
  ],
  visas: [
    "https://images.unsplash.com/photo-1544717305-2782549b5136?w=1200&q=85", // Passport with visas and boarding pass
    "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1200&q=85", // International travel documentation
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=85", // UAE Dubai destination visa
    "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=1200&q=85", // Singapore landmark visa
  ],
  restaurants: [
    "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=1200&q=85", // Traditional Gujarati & Indian Thali
    "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=85", // Royal Pure Veg Indian Dining
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=85", // Elegant Fine Dining Restaurant
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=85", // Rooftop Lounge & Cafe
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=85", // Gourmet Culinary Spread
  ],
  buildpackage: [
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=85", // Custom Trip Planning
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=85", // Scenic Road Journey
  ],
};

// City-specific photo mapping
const CITY_PHOTOS: Record<string, string> = {
  dubai: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=85",
  "abu dhabi": "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200&q=85",
  goa: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200&q=85",
  singapore: "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=1200&q=85",
  bangkok: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&q=85",
  kashmir: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=85",
  kerala: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&q=85",
  jaipur: "https://images.unsplash.com/photo-1598890777032-bde835ba27c2?w=1200&q=85",
  london: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&q=85",
  phuket: "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1200&q=85",
  bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=85",
  kualalumpur: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1200&q=85",
};

/**
 * Deterministic hash code from string for stable photo assignment.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export interface ActualImageContext {
  title?: string;
  name?: string;
  city?: string;
  category?: string;
  module?: string;
  id?: string | number;
}

/**
 * Resolves any image URL or placeholder SVG into an authentic, actual high-resolution travel photo.
 */
export function getActualImageUrl(
  rawUrl?: string | null,
  context?: ActualImageContext
): string {
  const url = (rawUrl || "").trim();

  // If already a real external photo (Unsplash, CloudFront, etc.) and not an SVG or generic desk placeholder
  const isSvg = url.toLowerCase().endsWith(".svg") || url.toLowerCase().includes(".svg?");
  const isGenericDeskPlaceholder = url.includes("1488646953014-85cb44e25828");
  const isRealPhoto =
    url.startsWith("http") &&
    !isSvg &&
    !isGenericDeskPlaceholder &&
    (url.includes("unsplash.com") ||
      url.includes("cloudfront.net") ||
      url.includes(".jpg") ||
      url.includes(".jpeg") ||
      url.includes(".webp") ||
      url.includes(".png"));

  if (isRealPhoto) {
    return url;
  }

  // Safe string coercion helper to prevent non-string runtime crashes
  const safeStr = (val: unknown): string => (typeof val === "string" ? val : "");

  const rawModule = safeStr(context?.module).toLowerCase();
  const rawTitle = safeStr(context?.title || context?.name);
  const titleLower = rawTitle.toLowerCase();
  const rawCategory = safeStr(context?.category).toLowerCase();
  const rawCity = safeStr(context?.city);
  const city = rawCity.toLowerCase().trim();

  // Determine Module Key
  let moduleKey = rawModule;
  if (!moduleKey || !ACTUAL_PHOTOS[moduleKey]) {
    if (url.includes("hotel") || titleLower.includes("hotel")) {
      moduleKey = "hotels";
    } else if (
      url.includes("package") ||
      titleLower.includes("package") ||
      rawCategory.includes("package")
    ) {
      moduleKey = "packages";
    } else if (
      url.includes("flight") ||
      titleLower.includes("flight")
    ) {
      moduleKey = "flights";
    } else if (
      url.includes("transfer") ||
      titleLower.includes("transfer")
    ) {
      moduleKey = "transfers";
    } else if (
      url.includes("visa") ||
      titleLower.includes("visa")
    ) {
      moduleKey = "visas";
    } else if (
      url.includes("restaurant") ||
      url.includes("dining") ||
      titleLower.includes("dining")
    ) {
      moduleKey = "restaurants";
    } else if (url.includes("buildpackage")) {
      moduleKey = "buildpackage";
    } else {
      moduleKey = "tours";
    }
  }

  // Check specific city match
  if (city && CITY_PHOTOS[city]) {
    // If Desert Safari is in title, prioritize real desert photo
    if (titleLower.includes("desert") || titleLower.includes("safari") || titleLower.includes("dune")) {
      return ACTUAL_PHOTOS.tours[0];
    }
    if (titleLower.includes("yacht") || titleLower.includes("cruise") || titleLower.includes("marina")) {
      return ACTUAL_PHOTOS.tours[3];
    }
    if (titleLower.includes("burj") || titleLower.includes("khalifa") || titleLower.includes("tower")) {
      return ACTUAL_PHOTOS.tours[2];
    }
    return CITY_PHOTOS[city];
  }

  // Match photo pool
  const pool = ACTUAL_PHOTOS[moduleKey] || ACTUAL_PHOTOS.hotels;
  const seedId = context?.id != null && typeof context.id !== "object" ? String(context.id) : "";
  const seedString = `${seedId}_${rawTitle}_${rawCity}_${url}`;
  const index = hashString(seedString) % pool.length;

  return pool[index];
}

/**
 * Event handler for <img> onError to smoothly replace broken URLs with a verified photo.
 */
export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallback: string = FALLBACK_TOUR_IMAGE
) {
  const img = e.currentTarget;
  img.onerror = null;
  img.src = fallback;
}

/**
 * Returns all unique images for a tour (combining cover image and gallery).
 */
export function getAllTourImages(tour?: {
  image?: string;
  images?: string[];
  gallery?: string[];
  title?: string;
  name?: string;
  city?: string;
}): string[] {
  if (!tour) return [FALLBACK_TOUR_IMAGE];

  const rawImages: string[] = [];
  if (tour.image && tour.image.trim()) {
    rawImages.push(tour.image.trim());
  }

  if (Array.isArray(tour.images)) {
    for (const im of tour.images) {
      if (im && im.trim() && !rawImages.includes(im.trim())) {
        rawImages.push(im.trim());
      }
    }
  }

  if (Array.isArray(tour.gallery)) {
    for (const g of tour.gallery) {
      if (g && g.trim() && !rawImages.includes(g.trim())) {
        rawImages.push(g.trim());
      }
    }
  }

  const resolved = rawImages.map((img, idx) =>
    getActualImageUrl(img, {
      title: tour.title || tour.name,
      city: tour.city,
      id: idx,
    })
  );

  return resolved.length > 0 ? resolved : [FALLBACK_TOUR_IMAGE];
}
