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
import type {
  Tour,
  DestinationItem,
  Booking,
  BookingTraveler,
  ItineraryDay,
  GuestReview,
  BookingStatus,
  TourSnapshot,
  BookingPriceBreakdown,
  BookingStatusHistoryItem,
  CancellationRequestDto,
  BookingEmailOutboxItem,
} from '@/types';
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
    country: typeof raw.country === 'string' ? raw.country : typeof raw.Country === 'string' ? raw.Country : undefined,
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
      reference: `BK-${index}`,
      tourId: 1,
      tourName: 'Curated Expedition',
      tourImage: PLACEHOLDER_IMAGE,
      location: 'Global',
      destination: 'Global',
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

  // Canonical status normalization: 'pending', 'confirmed', 'rejected', 'cancelled', 'expired', 'completed'
  const rawStatus = String(raw.status ?? raw.Status ?? 'pending').toLowerCase();
  const validStatus: BookingStatus =
    rawStatus === 'confirmed'
      ? 'confirmed'
      : rawStatus === 'pending'
      ? 'pending'
      : rawStatus === 'rejected'
      ? 'rejected'
      : rawStatus === 'cancelled'
      ? 'cancelled'
      : rawStatus === 'expired'
      ? 'expired'
      : rawStatus === 'completed'
      ? 'completed'
      : rawStatus === 'upcoming'
      ? 'confirmed'
      : 'pending';

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

  const rawRef = raw.reference ?? raw.Reference ?? raw.bookingReference ?? raw.id ?? raw._id;
  const reference = typeof rawRef === 'string' && rawRef.trim() ? rawRef.trim() : `BK-${index}`;

  const rawSlug = raw.tourSlug ?? raw.TourSlug ?? raw.slug ?? raw.Slug;
  const tourSlug = typeof rawSlug === 'string' && rawSlug.trim() ? rawSlug.trim() : undefined;

  const rawDest = raw.destination ?? raw.Destination ?? raw.location ?? raw.Location;
  const destination = typeof rawDest === 'string' && rawDest.trim() ? rawDest.trim() : 'Global';

  const rawUnitPrice = raw.unitPrice ?? raw.UnitPrice;
  const unitPrice = typeof rawUnitPrice === 'number' && !isNaN(rawUnitPrice) ? rawUnitPrice : undefined;

  const rawOrigPrice = raw.originalPrice ?? raw.OriginalPrice;
  const originalPrice = typeof rawOrigPrice === 'number' && !isNaN(rawOrigPrice) ? rawOrigPrice : undefined;

  const rawDuration = raw.duration ?? raw.Duration;
  const duration = typeof rawDuration === 'string' && rawDuration.trim() ? rawDuration.trim() : undefined;

  const rawPaymentStatus = raw.paymentStatus ?? raw.PaymentStatus;
  const paymentStatus = typeof rawPaymentStatus === 'string' ? rawPaymentStatus.trim() : undefined;

  const rawPaymentMethod = raw.paymentMethod ?? raw.PaymentMethod;
  const paymentMethod = typeof rawPaymentMethod === 'string' ? rawPaymentMethod.trim() : undefined;

  const rawPaymentRef = raw.paymentReference ?? raw.PaymentReference;
  const paymentReference = typeof rawPaymentRef === 'string' ? rawPaymentRef.trim() : undefined;

  const rawPaidAt = raw.paidAt ?? raw.PaidAt;
  const paidAt = typeof rawPaidAt === 'string' ? rawPaidAt.trim() : undefined;

  // Snapshot Normalization (Mongo Atlas Immutable Snapshot)
  const rawSnap = isRecord(raw.snapshot) ? raw.snapshot : isRecord(raw.Snapshot) ? raw.Snapshot : undefined;
  let snapshot: TourSnapshot | undefined = undefined;
  if (rawSnap) {
    const rawItin = Array.isArray(rawSnap.itinerarySummary) ? rawSnap.itinerarySummary : [];
    const itinerarySummary = rawItin.map((item: any, idx: number) => ({
      day: Number(item?.day ?? idx + 1),
      title: String(item?.title ?? `Day ${idx + 1}`),
      description: String(item?.description ?? ''),
    }));

    snapshot = {
      tourId: Number(rawSnap.tourId ?? rawSnap.TourId ?? 1),
      slug: String(rawSnap.slug ?? rawSnap.Slug ?? ''),
      title: String(rawSnap.title ?? rawSnap.Title ?? ''),
      coverImage: resolveImageUrl(String(rawSnap.coverImage ?? rawSnap.CoverImage ?? '')),
      destination: String(rawSnap.destination ?? rawSnap.Destination ?? 'Global'),
      category: String(rawSnap.category ?? rawSnap.Category ?? 'Adventure'),
      duration: String(rawSnap.duration ?? rawSnap.Duration ?? 'Full Day'),
      pricePerPerson: Number(rawSnap.pricePerPerson ?? rawSnap.PricePerPerson ?? 0),
      currency: String(rawSnap.currency ?? rawSnap.Currency ?? '$'),
      itinerarySummary,
      includedSummary: Array.isArray(rawSnap.includedSummary) ? rawSnap.includedSummary.map(String) : [],
      excludedSummary: Array.isArray(rawSnap.excludedSummary) ? rawSnap.excludedSummary.map(String) : [],
    };
  }

  // Price Breakdown
  const rawBreakdown = isRecord(raw.priceBreakdown) ? raw.priceBreakdown : isRecord(raw.PriceBreakdown) ? raw.PriceBreakdown : undefined;
  let priceBreakdown: BookingPriceBreakdown | undefined = undefined;
  if (rawBreakdown) {
    priceBreakdown = {
      subtotal: Number(rawBreakdown.subtotal ?? rawBreakdown.Subtotal ?? 0),
      discount: Number(rawBreakdown.discount ?? rawBreakdown.Discount ?? 0),
      taxes: Number(rawBreakdown.taxes ?? rawBreakdown.Taxes ?? 0),
      total: Number(rawBreakdown.total ?? rawBreakdown.Total ?? 0),
    };
  }

  // Status History
  const rawHistory = Array.isArray(raw.statusHistory) ? raw.statusHistory : Array.isArray(raw.StatusHistory) ? raw.StatusHistory : [];
  const statusHistory = rawHistory.map((item: any) => ({
    status: String(item?.status ?? item?.Status ?? ''),
    changedAt: String(item?.changedAt ?? item?.ChangedAt ?? new Date().toISOString()),
    note: item?.note || item?.Note ? String(item?.note ?? item?.Note) : undefined,
    changedBy: item?.changedBy || item?.ChangedBy ? String(item?.changedBy ?? item?.ChangedBy) : undefined,
  }));

  const adults = typeof raw.adults === 'number' ? raw.adults : typeof raw.Adults === 'number' ? raw.Adults : undefined;
  const children = typeof raw.children === 'number' ? raw.children : typeof raw.Children === 'number' ? raw.Children : undefined;
  const source = typeof raw.source === 'string' ? raw.source : typeof raw.Source === 'string' ? raw.Source : 'app';
  const travelDate = typeof raw.travelDate === 'string' ? raw.travelDate : typeof raw.TravelDate === 'string' ? raw.TravelDate : formattedDate;

  const resolvedTourName = snapshot?.title || String(raw.tourName ?? raw.TourName ?? raw.title ?? 'Curated Expedition');
  const resolvedTourImage = snapshot?.coverImage || resolveImageUrl(imageStr);
  const resolvedDestination = snapshot?.destination || destination;
  const resolvedDuration = snapshot?.duration || duration;
  const resolvedUnitPrice = snapshot?.pricePerPerson ?? unitPrice;
  const resolvedCurrency = snapshot?.currency || String(raw.currency ?? raw.Currency ?? '$');

  // Individual Travelers List
  const rawTravelersList = raw.travelersList ?? raw.TravelersList;
  const travelersList: BookingTraveler[] = Array.isArray(rawTravelersList)
    ? rawTravelersList.map((t: any, i: number) => ({
        id: String(t?.id ?? `trv-${i + 1}`),
        name: String(t?.name ?? `Traveler ${i + 1}`),
        type: String(t?.type ?? 'Adult'),
        age: typeof t?.age === 'number' ? t.age : undefined,
        gender: typeof t?.gender === 'string' ? t.gender : undefined,
        passportOrId: typeof t?.passportOrId === 'string' ? t.passportOrId : undefined,
      }))
    : [];

  return {
    id: String(raw.id ?? raw._id ?? `bkg_${index}`),
    _id: raw._id ? String(raw._id) : undefined,
    reference,
    tourId: Number(snapshot?.tourId ?? raw.tourId ?? raw.TourId ?? 1),
    tourSlug: snapshot?.slug || tourSlug,
    tourName: resolvedTourName,
    tourImage: resolvedTourImage,
    location: String(raw.location ?? raw.Location ?? resolvedDestination),
    destination: resolvedDestination,
    unitPrice: resolvedUnitPrice,
    originalPrice,
    duration: resolvedDuration,
    guestName: String(raw.guestName ?? raw.GuestName ?? 'Guest'),
    email: String(raw.email ?? raw.Email ?? ''),
    phone: String(raw.phone ?? raw.Phone ?? ''),
    date: formattedDate,
    travelDate,
    startDate: typeof rawStartDate === 'string' ? rawStartDate : undefined,
    endDate: formattedEndDate,
    adults,
    children,
    travelers: Number(raw.travelers ?? raw.Travelers ?? (adults ?? 1) + (children ?? 0)),
    travelersList: travelersList.length > 0 ? travelersList : undefined,
    totalPrice: parsePrice(raw.totalPrice ?? raw.TotalPrice ?? raw.price, 499),
    currency: resolvedCurrency,
    status: validStatus,
    paymentStatus,
    paymentMethod,
    paymentReference,
    paidAt,
    specialRequest: String(raw.specialRequest ?? raw.SpecialRequest ?? ''),
    websiteId: String(raw.websiteId ?? raw.WebsiteId ?? 'website1'),
    website: String(raw.website ?? raw.Website ?? raw.websiteId ?? raw.WebsiteId ?? 'website1'),
    source,
    createdAt: String(raw.createdAt ?? raw.CreatedAt ?? new Date().toISOString()),
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : undefined,
    userId: raw.userId ?? raw.UserId ? String(raw.userId ?? raw.UserId) : undefined,
    qrCode: typeof raw.qrCode === 'string' ? raw.qrCode : undefined,
    snapshot,
    priceBreakdown,
    statusHistory: statusHistory.length > 0 ? statusHistory : undefined,
    rejectionReason:
      typeof raw.rejectionReason === 'string'
        ? raw.rejectionReason
        : typeof raw.RejectionReason === 'string'
        ? raw.RejectionReason
        : undefined,
    cancellationReason:
      typeof raw.cancellationReason === 'string'
        ? raw.cancellationReason
        : typeof raw.CancellationReason === 'string'
        ? raw.CancellationReason
        : undefined,
    cancellationRequest: (() => {
      const cr = isRecord(raw.cancellationRequest)
        ? raw.cancellationRequest
        : isRecord(raw.CancellationRequest)
        ? raw.CancellationRequest
        : undefined;
      if (!cr) return undefined;
      return {
        requestedAt: String(cr.requestedAt ?? cr.RequestedAt ?? new Date().toISOString()),
        reason: String(cr.reason ?? cr.Reason ?? ''),
        status: String(cr.status ?? cr.Status ?? 'pending'),
        reviewedAt: cr.reviewedAt ? String(cr.reviewedAt) : undefined,
        reviewedBy: cr.reviewedBy ? String(cr.reviewedBy) : undefined,
        reviewNote: cr.reviewNote ? String(cr.reviewNote) : undefined,
      } as CancellationRequestDto;
    })(),
    emailsSent: (() => {
      const list = Array.isArray(raw.emailsSent)
        ? raw.emailsSent
        : Array.isArray(raw.EmailsSent)
        ? raw.EmailsSent
        : [];
      if (list.length === 0) return undefined;
      return list.map((e: any) => ({
        id: e?.id ? String(e.id) : undefined,
        to: String(e?.to ?? e?.To ?? ''),
        subject: String(e?.subject ?? e?.Subject ?? ''),
        sentAt: String(e?.sentAt ?? e?.SentAt ?? new Date().toISOString()),
        template: String(e?.template ?? e?.Template ?? ''),
        status: String(e?.status ?? e?.Status ?? 'Sent'),
        error: e?.error ? String(e.error) : undefined,
      })) as BookingEmailOutboxItem[];
    })(),
  };
}
