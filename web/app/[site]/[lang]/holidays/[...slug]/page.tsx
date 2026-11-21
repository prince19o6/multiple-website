"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter, notFound } from "next/navigation";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import { useSite } from "@/lib/SiteContext";
import { getPackageBySlug } from "@/lib/api/packages";
import { LoadingSkeleton, ErrorState } from "@/components/common";
import EnquiryModal from "@/components/lead/EnquiryModal";

interface HotelStay {
  hotelName: string;
  starRating: number;
  nights: number;
  city: string;
  roomType?: string;
}

interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  meals: string[];
  highlights: string[];
}

interface PackageDetail {
  id: number | string;
  packageNumericId?: number;
  packageId?: string;
  title: string;
  name?: string;
  slug: string;
  category: string;
  categorySlug?: string;
  destination: string;
  city: string;
  country: string;
  citiesCovered: string;
  duration: string;
  durationDays: number;
  durationNights: number;
  startingPrice: number;
  price: number;
  originalPrice?: number;
  currency: string;
  rating: number;
  reviews?: number;
  reviewCount?: number;
  image: string;
  images: string[];
  keyInclusions?: string[];
  hotelStays?: HotelStay[];
  itinerary: ItineraryDay[];
  inclusions: string[];
  exclusions: string[];
  departureDates?: string[];
  dietaryFeatures?: {
    pureVeg?: boolean;
    jainAvailable?: boolean;
    halalCertified?: boolean;
  };
}

export default function HolidayPackageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const config = useSiteConfig();
  const site = useSite();

  const siteId = site.siteId || "gujjutours";
  const currencySymbol = config.currencySymbol || (siteId === "gujjutours" ? "₹" : "$");

  const slugParam = params?.slug;
  const packagePath = Array.isArray(slugParam)
    ? slugParam[slugParam.length - 1]
    : typeof slugParam === "string"
      ? slugParam
      : "";

  const [pkg, setPkg] = useState<PackageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  const [isEnquiryOpen, setIsEnquiryOpen] = useState<boolean>(false);
  const [dietaryChoice, setDietaryChoice] = useState<string>("pureVeg");

  const fetchPackage = useCallback(async () => {
    if (!packagePath) return;
    setLoading(true);
    setError(null);

    try {
      let p: any = null;
      try {
        p = await getPackageBySlug(packagePath, { siteId });
      } catch {
        // Direct API call failed — query same-origin Next.js proxy
        const res = await fetch(`/api/packages/${encodeURIComponent(packagePath)}?site=${encodeURIComponent(siteId)}`);
        if (res.ok) {
          const json = await res.json();
          p = json?.data ?? json;
        }
      }

      if (!p || (!p.title && !p.name && !p.id)) {
        const localRes = await fetch(`/api/packages/${encodeURIComponent(packagePath)}?site=${encodeURIComponent(siteId)}`);
        if (localRes.ok) {
          const localJson = await localRes.json();
          p = localJson?.data ?? localJson;
        }
      }

      if (p && (p.title || p.name || p.id)) {
        const rawImages = Array.isArray(p.images) && p.images.length > 0
          ? p.images
          : p.image
            ? [p.image]
            : ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=85"];

        const durationDays = p.durationDays || 5;
        const durationNights = p.durationNights || Math.max(1, durationDays - 1);
        const city = p.city || p.destination || "Destination";
        const country = p.country || (siteId === "gujjutours" ? "India" : "Asia");

        // Parse or normalize itinerary
        const itinerary: ItineraryDay[] = Array.isArray(p.itinerary) && p.itinerary.length > 0
          ? p.itinerary.map((it: any, idx: number) => ({
            day: it.day || idx + 1,
            title: it.title || `Day ${idx + 1}: Exploration`,
            description: it.description || it.desc || "Full day sightseeing, transfers, and activities.",
            meals: it.meals || it.mealsIncluded || ["Breakfast", "Dinner"],
            highlights: it.highlights || it.activities || ["Guided Sightseeing", "Private AC Transfer"],
          }))
          : [
            {
              day: 1,
              title: `Arrival in ${city} & Hotel Check-in`,
              description: `Arrive at the destination airport or station. Private chauffeur transfer to your selected luxury hotel. Enjoy leisure evening.`,
              meals: ["Dinner"],
              highlights: ["Airport Meet & Greet", "Welcome Drink", "Overnight Stay"],
            },
            {
              day: 2,
              title: `${city} City Highlights & Heritage Tour`,
              description: `Full day exploration covering primary architectural landmarks, scenic viewpoints, and local markets.`,
              meals: ["Breakfast", "Dinner"],
              highlights: ["Guided Monument Passes", "Private AC Cab"],
            },
            {
              day: 3,
              title: "Excursion & Scenic Leisure",
              description: "Scenic day trip with photostops, experiential dining, and evening leisure strolls.",
              meals: ["Breakfast", "Dinner"],
              highlights: ["Scenic Drive", "Local Gourmet Experience"],
            },
            {
              day: 4,
              title: "Departure & Airport Drop",
              description: "Post breakfast, check-out from hotel and transfer to airport for onward journey.",
              meals: ["Breakfast"],
              highlights: ["Private Transfer", "Trip Memories"],
            },
          ];

        // Parse or normalize hotels
        const hotelStays: HotelStay[] = Array.isArray(p.hotels) && p.hotels.length > 0
          ? p.hotels.map((h: any) => ({
            hotelName: h.hotelName || h.name || "Luxury Resort",
            starRating: h.starRating || 4,
            nights: h.nights || 2,
            city: h.city || city,
            roomType: h.roomType || "Deluxe Room",
          }))
          : [
            {
              hotelName: `${city} Heritage Palace & Spa`,
              starRating: 5,
              nights: durationNights,
              city: city,
              roomType: "Premium Deluxe Suite",
            },
          ];

        const keyInclusions = Array.isArray(p.highlights) && p.highlights.length > 0
          ? p.highlights
          : p.keyInclusions || [
            "5★ / 4★ Hotel Stays with Breakfast",
            "Private AC Vehicle for all transfers",
            "Sightseeing with Monument Entry Passes",
            "24/7 Concierge Support",
          ];

        const inclusions = Array.isArray(p.inclusions) && p.inclusions.length > 0
          ? p.inclusions
          : [
            "Daily breakfast and vegetarian dinner",
            "Private sanitized AC car for all transfers and tours",
            "Toll taxes, parking charges, driver allowances",
            "Assistance upon arrival & departure",
          ];

        const exclusions = Array.isArray(p.exclusions) && p.exclusions.length > 0
          ? p.exclusions
          : [
            "Airfare / Train tickets unless explicitly chosen",
            "Personal expenses, laundry, tips",
            "Optional activity charges not listed in inclusions",
          ];

        const departureDates = Array.isArray(p.departureDates) && p.departureDates.length > 0
          ? p.departureDates
          : [
            new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
            new Date(Date.now() + 86400000 * 14).toISOString().split("T")[0],
            new Date(Date.now() + 86400000 * 21).toISOString().split("T")[0],
          ];

        const normalizedPkg: PackageDetail = {
          id: p.id || p.packageNumericId || packagePath,
          title: p.title || p.name || `${city} Holiday Package`,
          name: p.title || p.name || `${city} Holiday Package`,
          slug: p.slug || packagePath,
          category: p.category || "Holiday Getaways",
          categorySlug: p.categorySlug || "holiday-getaways",
          destination: city,
          city: city,
          country: country,
          citiesCovered: p.citiesCovered || `${city} (${durationNights}N)`,
          duration: p.duration || `${durationDays} Days / ${durationNights} Nights`,
          durationDays,
          durationNights,
          startingPrice: Number(p.startingPrice || p.price || 25000),
          price: Number(p.price || p.startingPrice || 25000),
          originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
          currency: p.currency || (siteId === "gujjutours" ? "INR" : "USD"),
          rating: Number(p.rating || 4.8),
          reviews: Number(p.reviews || p.reviewsCount || 150),
          image: rawImages[0],
          images: rawImages,
          keyInclusions,
          hotelStays,
          itinerary,
          inclusions,
          exclusions,
          departureDates,
          dietaryFeatures: {
            pureVeg: p.pureVegAvailable ?? true,
            jainAvailable: p.jainMealAvailable ?? true,
            halalCertified: p.halalCertified ?? false,
          },
        };

        setPkg(normalizedPkg);
        setSelectedImage(rawImages[0]);
        if (departureDates.length > 0) {
          setSelectedDate(departureDates[0]);
        }
      } else {
        setError("Package not found");
      }
    } catch (err: any) {
      if (err?.digest?.includes("NEXT_NOT_FOUND") || err?.message === "NEXT_NOT_FOUND") {
        throw err;
      }
      if (err?.status === 404 || err?.isNotFound) {
        setError("Package not found");
      } else {
        setError(err?.message || "Failed to load holiday package");
      }
    } finally {
      setLoading(false);
    }
  }, [packagePath, siteId]);

  useEffect(() => {
    fetchPackage();
  }, [fetchPackage]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fafbfc] dark:bg-neutral-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <LoadingSkeleton variant="detail" count={1} />
        </div>
      </main>
    );
  }

  if (error || !pkg) {
    return (
      <main className="min-h-screen bg-[#fafbfc] dark:bg-neutral-950 py-16 px-4">
        <div className="max-w-md mx-auto">
          <ErrorState message={error || "Holiday package not found"} onRetry={fetchPackage} />
        </div>
      </main>
    );
  }

  // Pricing calculation
  const unitPrice = pkg.startingPrice || pkg.price || 25000;
  const childPrice = Math.round(unitPrice * 0.65);
  const totalPrice = unitPrice * adults + childPrice * children;
  const tax = Math.round(totalPrice * 0.05);
  const grandTotal = totalPrice + tax;
  const primaryImg = pkg.image || pkg.images?.[0] || "";

  const handleBookNow = () => {
    const bookingParams = new URLSearchParams({
      service: "package",
      serviceType: "package",
      id: String(pkg.id),
      slug: pkg.slug,
      title: String(pkg.title || pkg.name || "Holiday Package"),
      name: String(pkg.title || pkg.name || "Holiday Package"),
      destination: pkg.destination || pkg.city,
      duration: pkg.duration,
      option: `${pkg.duration} - All-Inclusive Package`,
      date: selectedDate || (pkg.departureDates?.[0] || ""),
      adults: String(adults),
      children: String(children),
      dietary: dietaryChoice,
      price: String(unitPrice),
      unitPrice: String(unitPrice),
      subtotal: String(totalPrice),
      tax: String(tax),
      total: String(grandTotal),
      totalPrice: String(grandTotal),
      currency: pkg.currency || (siteId === "gujjutours" ? "INR" : "USD"),
      image: primaryImg,
      imageUrl: primaryImg,
    });

    router.push(`/booking?${bookingParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 pb-20 font-sans">
      {/* ─── Breadcrumb Bar ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <Link href="/" className="hover:text-teal-600 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/en/holidays" className="hover:text-teal-600 transition-colors">Holidays</Link>
          <span>/</span>
          <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-xs">
            {typeof (pkg.destination as any) === "object" && pkg.destination !== null ? ((pkg.destination as any).cityName || (pkg.destination as any).country || "Destination") : pkg.destination}
          </span>
          <span>/</span>
          <span className="text-neutral-400 truncate max-w-sm">{pkg.title}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ─── Header Info Block ─── */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300">
              ⏳ {pkg.duration}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300">
              🏷️ {pkg.category}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
              📍 {pkg.citiesCovered}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-900 dark:text-white leading-tight">
            {pkg.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            <div className="flex items-center gap-1.5 font-bold text-amber-500">
              <span>★</span>
              <span>{pkg.rating?.toFixed(1) || "4.8"}</span>
              <span className="font-normal text-neutral-400">({pkg.reviews} verified guest reviews)</span>
            </div>
            <span>•</span>
            <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
              ✓ Customizable Itinerary
            </div>
            <span>•</span>
            <div className="text-teal-600 dark:text-teal-400 font-semibold">
              ✓ 100% Pure Veg &amp; Jain Friendly
            </div>
          </div>
        </div>

        {/* ─── Gallery Section ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-8">
          <div className="lg:col-span-3 relative h-80 sm:h-96 lg:h-[480px] rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shadow-sm">
            <Image
              src={selectedImage || pkg.images[0]}
              alt={pkg.title}
              fill
              priority
              className="object-cover transition-all duration-300"
            />
          </div>

          <div className="grid grid-cols-3 lg:grid-cols-1 gap-3 h-full">
            {pkg.images.slice(0, 3).map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedImage(img)}
                className={`relative h-24 sm:h-28 lg:h-[152px] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${selectedImage === img
                  ? "border-teal-600 shadow-md scale-[1.02]"
                  : "border-transparent opacity-75 hover:opacity-100"
                  }`}
              >
                <Image
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* ─── Highlights Row ─── */}
        {pkg.keyInclusions && pkg.keyInclusions.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
            {pkg.keyInclusions.map((item, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3.5 flex items-center gap-2.5 shadow-sm"
              >
                <span className="text-emerald-600 dark:text-emerald-400 text-lg">✓</span>
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 line-clamp-2">
                  {item}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ─── Content Grid: Itinerary & Booking Card ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Itinerary, Stays, Inclusions */}
          <div className="lg:col-span-2 space-y-8">
            {/* Day-by-Day Itinerary */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                  Day-by-Day Detailed Itinerary
                </h2>
                <button
                  type="button"
                  onClick={() => setExpandedDay(expandedDay === null ? 1 : null)}
                  className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
                >
                  {expandedDay === null ? "Expand All" : "Collapse All"}
                </button>
              </div>

              <div className="space-y-4">
                {pkg.itinerary.map((day) => {
                  const isOpen = expandedDay === day.day || expandedDay === null;
                  return (
                    <div
                      key={day.day}
                      className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedDay(isOpen && expandedDay !== null ? null : day.day)}
                        className="w-full text-left p-4 bg-neutral-50 dark:bg-neutral-800/40 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            D{day.day}
                          </span>
                          <span className="font-bold text-sm text-neutral-900 dark:text-white">
                            {day.title}
                          </span>
                        </div>
                        <span className="text-neutral-400 font-bold text-sm">
                          {isOpen ? "▲" : "▼"}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="p-4 space-y-3 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800">
                          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                            {day.description}
                          </p>

                          {day.meals && day.meals.length > 0 && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-bold text-neutral-500">Meals:</span>
                              <div className="flex flex-wrap gap-1.5">
                                {day.meals.map((meal, mIdx) => (
                                  <span
                                    key={mIdx}
                                    className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold text-[11px]"
                                  >
                                    🍽️ {meal}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {day.highlights && day.highlights.length > 0 && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-bold text-neutral-500">Highlights:</span>
                              <div className="flex flex-wrap gap-1.5">
                                {day.highlights.map((hl, hIdx) => (
                                  <span
                                    key={hIdx}
                                    className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 font-medium text-[11px]"
                                  >
                                    ★ {hl}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hotel Stays */}
            {pkg.hotelStays && pkg.hotelStays.length > 0 && (
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white mb-4">
                  Curated Hotel Stays Included
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pkg.hotelStays.map((stay, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-neutral-900 dark:text-white">
                          {stay.hotelName}
                        </span>
                        <span className="text-amber-500 text-xs font-bold">
                          {"★".repeat(stay.starRating)}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        📍 {stay.city} • {stay.nights} Nights Stay
                      </div>
                      {stay.roomType && (
                        <div className="text-xs text-teal-600 dark:text-teal-400 font-semibold mt-1">
                          🛏️ {stay.roomType}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inclusions & Exclusions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-3 text-emerald-700 dark:text-emerald-400">
                  ✓ What&apos;s Included
                </h3>
                <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-300">
                  {pkg.inclusions.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-3 text-rose-700 dark:text-rose-400">
                  ✕ What&apos;s Excluded
                </h3>
                <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-300">
                  {pkg.exclusions.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold shrink-0">✕</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Booking Widget */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4 sticky top-6">
              <div className="flex items-baseline justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
                <div>
                  <span className="text-xs text-neutral-400">Starting from</span>
                  <div className="text-2xl font-black text-neutral-900 dark:text-white">
                    {currencySymbol}{unitPrice.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-neutral-500">per person on twin sharing</span>
                </div>
                {pkg.originalPrice && (
                  <span className="text-xs text-neutral-400 line-through">
                    {currencySymbol}{pkg.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Departure Dates Selector */}
              {pkg.departureDates && pkg.departureDates.length > 0 && (
                <div>
                  <label htmlFor="departure-date-select" className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Select Departure Date:
                  </label>
                  <select
                    id="departure-date-select"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:ring-2 focus:ring-teal-600"
                  >
                    {pkg.departureDates.map((date, idx) => (
                      <option key={idx} value={date}>
                        📅 {new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} (Guaranteed Departure)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Guest Counts */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="adults-count-select" className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Adults (12+ Yrs):
                  </label>
                  <select
                    id="adults-count-select"
                    value={adults}
                    onChange={(e) => setAdults(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                      <option key={n} value={n}>{n} Adults</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="children-count-select" className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Children (2-11 Yrs):
                  </label>
                  <select
                    id="children-count-select"
                    value={children}
                    onChange={(e) => setChildren(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold"
                  >
                    {[0, 1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>{n} Children</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dietary Preferences */}
              <div>
                <label htmlFor="dietary-preference-select" className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Meal Plan / Dietary Preference:
                </label>
                <select
                  id="dietary-preference-select"
                  value={dietaryChoice}
                  onChange={(e) => setDietaryChoice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold"
                >
                  <option value="pureVeg">🌱 100% Pure Vegetarian Meals</option>
                  <option value="jain">🌿 Jain Meals (No Root Vegetables)</option>
                  <option value="standard">🍽️ Standard Multi-Cuisine Meals</option>
                </select>
              </div>

              {/* Price Calculation */}
              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-2 text-xs">
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Adult Package ({adults} × {currencySymbol}{unitPrice.toLocaleString()})</span>
                  <span className="font-semibold">{currencySymbol}{(adults * unitPrice).toLocaleString()}</span>
                </div>
                {children > 0 && (
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                    <span>Child Package ({children} × {currencySymbol}{childPrice.toLocaleString()})</span>
                    <span className="font-semibold">{currencySymbol}{(children * childPrice).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Taxes &amp; Service Fee (5%)</span>
                  <span className="font-semibold">{currencySymbol}{tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-black text-neutral-900 dark:text-white pt-2 border-t border-neutral-200 dark:border-neutral-800">
                  <span>Total Amount</span>
                  <span>{currencySymbol}{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Booking CTAs */}
              <button
                type="button"
                onClick={handleBookNow}
                className="w-full py-3.5 rounded-xl font-black text-sm text-white bg-teal-600 hover:bg-teal-700 shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Book This Holiday</span>
                <span>→</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEnquiryOpen(true)}
                className="w-full py-2.5 rounded-xl font-bold text-xs text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all cursor-pointer"
              >
                💬 Want Custom Dates or Flights?
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enquiry Modal */}
      {isEnquiryOpen && (
        <EnquiryModal
          isOpen={isEnquiryOpen}
          onClose={() => setIsEnquiryOpen(false)}
          serviceTitle={pkg.title}
          serviceType="package"
        />
      )}
    </div>
  );
}
