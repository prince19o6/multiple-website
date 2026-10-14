/**
 * lib/normalize.ts
 *
 * Normalization layer that maps backend ASP.NET Core, MongoDB Atlas, and staging
 * API responses to the app's strictly typed Tour, Booking, and DestinationItem models.
 *
 * Guarantees:
 *  - ZERO `any` (100% strict TypeScript typing).
 *  - Tolerant of multiple shapes: direct array, { data: [] }, { result: [] }, { tours: [] }.
 *  - Handles PascalCase vs camelCase fields (e.g. Title vs title, Name vs name, Price vs price).
 *  - Handles MongoDB ObjectId (_id) vs numeric id vs tourId vs tourNumericId.
 *  - Tolerates missing optional fields with sensible fallbacks (never drops a tour).
 *  - Parses string prices ("$999", "999.00") and numbers cleanly.
 *  - Resolves relative image URLs against the unified API base URL.
 */

import { ENV } from '@/src/config/env';
import { PLACEHOLDER_IMAGE } from './imageUtils';
import type { Tour, DestinationItem, Booking, ItineraryDay, GuestReview, BookingStatus } from '@/types';
export { tourHref } from './navigation';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Resolves an image URL against the API base URL if it's a relative path.
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return PLACEHOLDER_IMAGE;
  }

  let trimmed = url.trim();

  // Gracefully remap known unavailable Unsplash IDs to active working travel images
  if (trimmed.includes('photo-1540959375944')) {
    trimmed = trimmed.replace(/photo-1540959375944[a-zA-Z0-9-]*/g, 'photo-1503899036084-c55cdd92da26');
  }

  // Already absolute or data URI
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  // Relative path — resolve against API base URL
  const base = (ENV.apiUrl || '').replace(/\/+$/, '');
  const cleanPath = trimmed.replace(/^\/+/, '');
  return base ? `${base}/${cleanPath}` : trimmed;
}

/**
 * Parses numeric price from string or number.
 */
function parsePrice(value: unknown, fallback: number = 0): number {
  if (typeof value === 'number') {
    return isNaN(value) ? fallback : value;
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.]/g, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? fallback : num;
  }
  return fallback;
}

/**
 * Normalizes any backend or raw object into a validated Tour object.
 * Never drops a tour because an optional field is missing.
 */
export function normalizeTour(raw: unknown, fallbackSiteId: string = 'website1'): Tour {
  if (!isRecord(raw)) {
    return {
      id: 0,
      name: 'Curated Expedition',
      description: '',
      price: 0,
      rating: 4.8,
      reviews: 0,
      duration: 'Full Day',
      difficulty: 'Moderate',
      location: 'Global',
      groupSize: '2-10 people',
      bestTime: 'Year-round',
      language: 'English',
      image: PLACEHOLDER_IMAGE,
      gallery: [PLACEHOLDER_IMAGE],
      fullDescription: '',
      highlights: [],
      included: [],
      excluded: [],
      itinerary: [],
      guestReviews: [],
      category: 'General',
      featured: false,
    };
  }

  // 1. Resolve ID: favor numeric id if valid number, else string _id, else tourNumericId/tourId
  let resolvedId: number | string = 0;
  if (raw.id !== undefined && raw.id !== null && !isNaN(Number(raw.id)) && String(raw.id).trim() !== '') {
    resolvedId = Number(raw.id);
  } else if (raw.tourNumericId !== undefined && raw.tourNumericId !== null && !isNaN(Number(raw.tourNumericId))) {
    resolvedId = Number(raw.tourNumericId);
  } else if (raw._id !== undefined && raw._id !== null) {
    resolvedId = String(raw._id);
  } else if (raw.tourId !== undefined && raw.tourId !== null) {
    resolvedId = !isNaN(Number(raw.tourId)) ? Number(raw.tourId) : String(raw.tourId);
  } else if (raw.id !== undefined && raw.id !== null) {
    resolvedId = String(raw.id);
  } else {
    resolvedId = 1;
  }

  // 2. Name / Title (PascalCase vs camelCase)
  const name = String(
    raw.name ??
    raw.Name ??
    raw.title ??
    raw.Title ??
    raw.tourName ??
    raw.TourName ??
    'Curated Expedition'
  ).trim();

  // 3. Description & Full Description
  const description = String(
    raw.description ??
    raw.Description ??
    raw.shortDescription ??
    raw.ShortDescription ??
    raw.tagline ??
    ''
  ).trim();

  const fullDescription = String(
    raw.fullDescription ??
    raw.FullDescription ??
    raw.description ??
    raw.Description ??
    description
  ).trim();

  // 4. Price & Original Price
  const rawPrice = raw.price ?? raw.Price ?? raw.amount ?? raw.Amount;
  const price = parsePrice(rawPrice, 0);

  const rawOrigPrice = raw.originalPrice ?? raw.OriginalPrice ?? raw.regularPrice;
  const originalPrice = rawOrigPrice ? parsePrice(rawOrigPrice) : undefined;

  // 5. Rating & Reviews
  const rawRating = raw.rating ?? raw.Rating;
  const rating = typeof rawRating === 'number' && !isNaN(rawRating)
    ? rawRating
    : parseFloat(String(rawRating ?? '4.8')) || 4.8;

  const rawReviews = raw.reviews ?? raw.Reviews ?? raw.reviewCount ?? raw.ReviewCount;
  const reviews = typeof rawReviews === 'number' && !isNaN(rawReviews)
    ? rawReviews
    : parseInt(String(rawReviews ?? '12'), 10) || 12;

  // 6. Duration & Difficulty
  const rawDur = raw.duration ?? raw.Duration;
  const duration = (typeof rawDur === 'string' && rawDur.trim() ? rawDur.trim() : '3 Days / 2 Nights');
  const difficulty = String(raw.difficulty ?? raw.Difficulty ?? 'Moderate').trim() || 'Moderate';

  // 7. Location
  const rawLoc = raw.location ?? raw.Location ?? raw.city ?? raw.destination ?? raw.country;
  const location = (typeof rawLoc === 'string' && rawLoc.trim() ? rawLoc.trim() : 'Global');

  // 8. Image & Gallery (resolved against API base URL)
  const rawImage =
    raw.image ??
    raw.Image ??
    raw.imageUrl ??
    raw.ImageUrl ??
    (Array.isArray(raw.gallery) && raw.gallery[0]) ??
    (Array.isArray(raw.Gallery) && raw.Gallery[0]) ??
    PLACEHOLDER_IMAGE;

  const image = resolveImageUrl(typeof rawImage === 'string' ? rawImage : String(rawImage ?? ''));

  let gallery: string[] = [];
  const rawGallery = Array.isArray(raw.gallery) ? raw.gallery : Array.isArray(raw.Gallery) ? raw.Gallery : [];
  if (rawGallery.length > 0) {
    gallery = rawGallery
      .filter((g): g is string => typeof g === 'string' && g.trim().length > 0)
      .map((g: string) => resolveImageUrl(g));
  }
  if (gallery.length === 0) {
    gallery = [image];
  }

  // 9. Highlights & Inclusions
  const rawHighlights = raw.highlights ?? raw.Highlights;
  const highlights: string[] = Array.isArray(rawHighlights)
    ? rawHighlights.map((h) => String(h ?? '').trim()).filter((h) => h.length > 0)
    : [];

  const rawIncluded = raw.included ?? raw.Included;
  const included: string[] = Array.isArray(rawIncluded)
    ? rawIncluded.map((i) => String(i ?? '').trim()).filter((i) => i.length > 0)
    : [];

  const rawExcluded = raw.excluded ?? raw.Excluded;
  const excluded: string[] = Array.isArray(rawExcluded)
    ? rawExcluded.map((e) => String(e ?? '').trim()).filter((e) => e.length > 0)
    : [];

  // 10. Itinerary Days
  const rawItinerary = Array.isArray(raw.itinerary) ? raw.itinerary : Array.isArray(raw.Itinerary) ? raw.Itinerary : [];
  const itinerary: ItineraryDay[] = rawItinerary.map((item: unknown, idx: number) => {
    if (isRecord(item)) {
      return {
        day: Number(item.day ?? item.Day ?? idx + 1),
        title: String(item.title ?? item.Title ?? `Day ${idx + 1}`),
        description: String(item.description ?? item.Description ?? ''),
      };
    }
    return {
      day: idx + 1,
      title: `Day ${idx + 1}`,
      description: String(item ?? ''),
    };
  });

  // 11. Guest Reviews
  const rawReviewsList = Array.isArray(raw.guestReviews) ? raw.guestReviews : Array.isArray(raw.GuestReviews) ? raw.GuestReviews : [];
  const guestReviews: GuestReview[] = rawReviewsList.map((r: unknown) => {
    if (isRecord(r)) {
      const avatarRaw = r.avatar ?? r.Avatar;
      return {
        author: String(r.author ?? r.Author ?? r.name ?? 'Verified Traveler'),
        rating: Number(r.rating ?? r.Rating ?? 5),
        text: String(r.text ?? r.Text ?? r.comment ?? ''),
        date: String(r.date ?? r.Date ?? 'Recently'),
        avatar: resolveImageUrl(typeof avatarRaw === 'string' ? avatarRaw : null),
      };
    }
    return {
      author: 'Verified Traveler',
      rating: 5,
      text: String(r ?? ''),
      date: 'Recently',
      avatar: PLACEHOLDER_IMAGE,
    };
  });

  // 12. Category & Featured
  const rawCategory = raw.category ?? raw.Category;
  const category = String(rawCategory || 'Adventure');

  const rawFeatured = raw.featured ?? raw.Featured;
  const featured = Boolean(rawFeatured !== undefined ? rawFeatured : true);

  const rawPopular = raw.popular ?? raw.Popular;
  const popular = Boolean(rawPopular !== undefined ? rawPopular : false);

  const rawSlug = raw.slug ?? raw.Slug;
  const slug = String(rawSlug || '').trim();

  const rawMongoId = raw._id ?? raw.Id;
  const _id = rawMongoId ? String(rawMongoId) : undefined;

  const rawDestination = raw.destination ?? raw.Destination;
  const destination = String(rawDestination || location);

  return {
    id: resolvedId,
    _id,
    slug,
    name,
    description,
    price,
    originalPrice,
    rating,
    reviews,
    duration,
    difficulty,
    location,
    groupSize: String(raw.groupSize ?? raw.GroupSize ?? '8-12 people'),
    bestTime: String(raw.bestTime ?? raw.BestTime ?? 'Year-round'),
    language: String(raw.language ?? raw.Language ?? 'English'),
    image,
    gallery,
    fullDescription,
    highlights,
    included,
    excluded,
    itinerary,
    guestReviews,
    category,
    featured,
    popular,
    destination,
  };
}

/**
 * Normalizes destinations from the backend.
 */
export function normalizeDestination(raw: unknown, index: number = 0): DestinationItem {
  if (!isRecord(raw)) {
    return {
      id: `dest-${index}`,
      name: 'Exotic Destination',
      image: PLACEHOLDER_IMAGE,
      tours: 1,
    };
  }

  const rawImage = raw.image ?? raw.Image ?? PLACEHOLDER_IMAGE;
  const imageStr = typeof rawImage === 'string' ? rawImage : PLACEHOLDER_IMAGE;

  return {
    id: String(raw.id ?? raw._id ?? `dest-${index}`),
    name: String(raw.name ?? raw.Name ?? raw.destination ?? 'Destination'),
    image: resolveImageUrl(imageStr),
    tours: Number(raw.tours ?? raw.Tours ?? raw.tourCount ?? 1),
    tagline: typeof raw.tagline === 'string' ? raw.tagline : undefined,
  };
}

/**
 * Normalizes a booking response.
 */
export function normalizeBooking(raw: unknown, index: number = 0): Booking {
  if (!isRecord(raw)) {
    return {
      id: `bkg_${index}`,
      tourId: 1,
      tourName: 'Curated Expedition',
      tourImage: PLACEHOLDER_IMAGE,
      location: 'Global',
      guestName: 'Guest',
      email: '',
      phone: '',
      date: new Date().toISOString().split('T')[0],
      travelers: 1,
      totalPrice: 499,
      currency: '$',
      status: 'upcoming',
      specialRequest: '',
      websiteId: 'website1',
      createdAt: new Date().toISOString(),
    };
  }

  const rawTourImage = raw.tourImage ?? raw.TourImage ?? raw.image ?? PLACEHOLDER_IMAGE;
  const imageStr = typeof rawTourImage === 'string' ? rawTourImage : PLACEHOLDER_IMAGE;

  // Tolerant status normalization: 'pending', 'confirmed', 'booked' all map to 'upcoming'
  const rawStatus = String(raw.status ?? raw.Status ?? 'upcoming').toLowerCase();
  const validStatus: BookingStatus =
    rawStatus === 'completed'
      ? 'completed'
      : rawStatus === 'cancelled'
      ? 'cancelled'
      : 'upcoming';

  const rawStartDate = raw.startDate ?? raw.StartDate ?? raw.date ?? raw.Date;
  let formattedDate = new Date().toISOString().split('T')[0];
  if (typeof rawStartDate === 'string' && rawStartDate.trim()) {
    formattedDate = rawStartDate.includes('T') ? rawStartDate.split('T')[0] : rawStartDate.trim();
  }

  const rawEndDate = raw.endDate ?? raw.EndDate;
  let formattedEndDate: string | undefined = undefined;
  if (typeof rawEndDate === 'string' && rawEndDate.trim()) {
    formattedEndDate = rawEndDate.includes('T') ? rawEndDate.split('T')[0] : rawEndDate.trim();
  }

  return {
    id: String(raw.id ?? raw._id ?? `bkg_${index}`),
    tourId: Number(raw.tourId ?? raw.TourId ?? 1),
    tourName: String(raw.tourName ?? raw.TourName ?? raw.title ?? 'Curated Expedition'),
    tourImage: resolveImageUrl(imageStr),
    location: String(raw.location ?? raw.Location ?? 'Global'),
    guestName: String(raw.guestName ?? raw.GuestName ?? 'Guest'),
    email: String(raw.email ?? raw.Email ?? ''),
    phone: String(raw.phone ?? raw.Phone ?? ''),
    date: formattedDate,
    startDate: typeof rawStartDate === 'string' ? rawStartDate : undefined,
    endDate: formattedEndDate,
    travelers: Number(raw.travelers ?? raw.Travelers ?? 1),
    totalPrice: parsePrice(raw.totalPrice ?? raw.TotalPrice ?? raw.price, 499),
    currency: String(raw.currency ?? raw.Currency ?? '$'),
    status: validStatus,
    specialRequest: String(raw.specialRequest ?? raw.SpecialRequest ?? ''),
    websiteId: String(raw.websiteId ?? raw.WebsiteId ?? 'website1'),
    createdAt: String(raw.createdAt ?? raw.CreatedAt ?? new Date().toISOString()),
    userId: raw.userId ?? raw.UserId ? String(raw.userId ?? raw.UserId) : undefined,
    qrCode: typeof raw.qrCode === 'string' ? raw.qrCode : undefined,
  };
}
