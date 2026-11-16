"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import { useSite } from "@/lib/SiteContext";
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

const FALLBACK_PACKAGE: PackageDetail = {
  id: 1001,
  title: "Kashmir Valley Paradise: Srinagar, Gulmarg & Pahalgam with Shikara Ride",
  slug: "kashmir-valley-paradise-srinagar-gulmarg-pahalga-4n-1001",
  category: "Scenic Escapes Across India & Beyond",
  categorySlug: "scenic-escapes",
  destination: "Srinagar",
  city: "Srinagar",
  country: "India",
  citiesCovered: "Srinagar (2N), Gulmarg (1N), Pahalgam (1N)",
  duration: "5 Days / 4 Nights",
  durationDays: 5,
  durationNights: 4,
  startingPrice: 37400,
  price: 37400,
  originalPrice: 45500,
  currency: "INR",
  rating: 4.9,
  reviews: 691,
  image: "/seed-images/packages/package-scenic.svg",
  images: [
    "/seed-images/packages/package-scenic.svg",
    "/seed-images/packages/package-family.svg",
    "/seed-images/packages/package-honeymoon.svg",
  ],
  keyInclusions: [
    "5★ Hotel Stays",
    "Daily Pure Veg Meals",
    "AC Private Cab Transfers",
    "All Landmark Entry Passes",
    "24/7 Concierge Support",
  ],
  hotelStays: [
    {
      hotelName: "Grand Srinagar Resort & Spa",
      starRating: 5,
      nights: 2,
      city: "Srinagar",
      roomType: "Deluxe Lake View Heritage Room",
    },
    {
      hotelName: "Gulmarg Highland Peaks Hotel",
      starRating: 5,
      nights: 1,
      city: "Gulmarg",
      roomType: "Pine Valley Alpine Suite",
    },
    {
      hotelName: "Pahalgam Valley View Luxury Cottage",
      starRating: 5,
      nights: 1,
      city: "Pahalgam",
      roomType: "Riverside Wooden Cottage",
    },
  ],
  itinerary: [
    {
      day: 1,
      title: "Arrival in Srinagar & Traditional Shikara Ride on Dal Lake",
      description: "Arrive at Srinagar Airport. Receive a warm traditional welcome from our representative and transfer in private comfort to your luxury hotel. In the evening, enjoy a sunset Shikara ride across serene Dal Lake, visiting floating gardens.",
      meals: ["Pure Veg Dinner"],
      highlights: ["Airport Pickup", "Dal Lake Shikara Ride", "Floating Gardens"],
    },
    {
      day: 2,
      title: "Srinagar to Gulmarg Excursion & Gondola Cable Car Ride",
      description: "After an early morning breakfast, drive towards Gulmarg through scenic pine-clad valleys. Ascend on the world-famous Gulmarg Gondola to Kongdoori and Apharwat Peak for breathtaking views of snow-draped Himalayan summits.",
      meals: ["Breakfast", "Pure Veg Lunch", "Jain Dinner"],
      highlights: ["Gulmarg Gondola", "Snow Viewpoint", "Highland Meadows"],
    },
    {
      day: 3,
      title: "Scenic Transfer to Pahalgam & Betaab Valley Discovery",
      description: "Depart towards the enchanting valley of Pahalgam along the roaring Lidder River. En route, explore the saffron fields of Pampore and historic Awantipora ruins. In the afternoon, visit Betaab Valley and Aru Valley.",
      meals: ["Breakfast", "Pure Veg Lunch", "Jain Dinner"],
      highlights: ["Saffron Fields", "Awantipora Ruins", "Betaab Valley"],
    },
    {
      day: 4,
      title: "Pahalgam Pine Trails & Return to Srinagar Heritage Houseboat",
      description: "Enjoy horse riding along Baisaran meadows (Mini Switzerland). Post lunch, journey back to Srinagar and check in to a deluxe carved cedar wood houseboat with dinner served under starlit skies.",
      meals: ["Breakfast", "Pure Veg Lunch", "Jain Dinner"],
      highlights: ["Baisaran Valley", "Cedar Wood Houseboat", "Sunset Over Waters"],
    },
    {
      day: 5,
      title: "Mughal Gardens Tour & Airport Departure",
      description: "Visit the iconic Shalimar and Nishat Mughal Gardens before completing your final souvenir shopping for Kashmiri saffron, dry fruits, and pashmina shawls. Transfer to Srinagar Airport for your onward flight.",
      meals: ["Breakfast"],
      highlights: ["Shalimar Bagh", "Nishat Garden", "Airport Transfer"],
    },
  ],
  inclusions: [
    "Accommodation for 4 nights in 4★/5★ verified hotels and luxury houseboats",
    "Daily 100% Pure Vegetarian breakfast & dinners (dedicated Jain catering)",
    "Private air-conditioned vehicle for all airport transfers and sightseeing excursions",
    "Complimentary Shikara ride voucher for Dal Lake",
    "All driver allowances, toll taxes, state permits, and fuel surcharges",
    "Dedicated 24/7 concierge support via WhatsApp and phone",
  ],
  exclusions: [
    "Airfare and rail tickets (can be booked via flight module)",
    "Gulmarg Gondola Phase 2 tickets and pony/horse ride charges",
    "Personal laundry, room telephone calls, and mini-bar expenses",
    "Travel and medical insurance (available as an optional add-on)",
  ],
  departureDates: [
    "2026-11-15",
    "2026-11-25",
    "2026-12-05",
    "2026-12-18",
    "2026-12-28",
    "2027-01-10",
    "2027-01-24",
  ],
  dietaryFeatures: {
    pureVeg: true,
    jainAvailable: true,
  },
};

export default function HolidayDetailPage() {
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

  const [pkg, setPkg] = useState<PackageDetail>(FALLBACK_PACKAGE);
  const [selectedImage, setSelectedImage] = useState<string>(FALLBACK_PACKAGE.image);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  const [isEnquiryOpen, setIsEnquiryOpen] = useState<boolean>(false);
  const [dietaryChoice, setDietaryChoice] = useState<string>("pureVeg");

  useEffect(() => {
    if (!packagePath) return;

    const fetchPackage = async () => {
      try {
        const res = await fetch(`/api/packages/${encodeURIComponent(packagePath)}?site=${encodeURIComponent(siteId)}`);
        if (res.ok) {
          const json = await res.json();
          const p = json?.data || json;
          if (p && (p.title || p.name)) {
            const rawImages = Array.isArray(p.images) && p.images.length > 0
              ? p.images
              : p.image
              ? [p.image]
              : FALLBACK_PACKAGE.images;

            setPkg({
              id: p.id || p.packageNumericId || packagePath,
              title: p.title || p.name,
              slug: p.slug || packagePath,
              category: p.category || "Scenic Escapes",
              categorySlug: p.categorySlug || "scenic-escapes",
              destination: p.destination || p.city || "Srinagar",
              city: p.city || p.destination || "Srinagar",
              country: p.country || "India",
              citiesCovered: p.citiesCovered || `${p.city} (${p.durationNights || 4}N)`,
              duration: p.duration || `${p.durationDays || 5} Days / ${p.durationNights || 4} Nights`,
              durationDays: p.durationDays || 5,
              durationNights: p.durationNights || 4,
              startingPrice: Number(p.startingPrice || p.price || 37400),
              price: Number(p.price || p.startingPrice || 37400),
              originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
              currency: p.currency || currencySymbol,
              rating: Number(p.rating || 4.8),
              reviews: Number(p.reviews || p.reviewCount || 150),
              image: rawImages[0] || "/seed-images/packages/package-scenic.svg",
              images: rawImages,
              keyInclusions: p.keyInclusions || FALLBACK_PACKAGE.keyInclusions,
              hotelStays: p.hotelStays || FALLBACK_PACKAGE.hotelStays,
              itinerary: p.itinerary || FALLBACK_PACKAGE.itinerary,
              inclusions: p.inclusions || FALLBACK_PACKAGE.inclusions,
              exclusions: p.exclusions || FALLBACK_PACKAGE.exclusions,
              departureDates: p.departureDates || FALLBACK_PACKAGE.departureDates,
              dietaryFeatures: p.dietaryFeatures || FALLBACK_PACKAGE.dietaryFeatures,
            });

            setSelectedImage(rawImages[0] || "/seed-images/packages/package-scenic.svg");
            if (p.departureDates && p.departureDates.length > 0) {
              setSelectedDate(p.departureDates[0]);
            }
          }
        }
      } catch (err) {
        console.error("[HolidayDetail] Failed to load package:", err);
      }
    };

    fetchPackage();
  }, [packagePath, siteId, currencySymbol]);

  // Pricing calculation
  const unitPrice = pkg.startingPrice || pkg.price || 37400;
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
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
              🌱 Dedicated Pure Veg &amp; Jain Meals
            </span>
            <span>•</span>
            <span className="text-teal-700 dark:text-teal-400 font-semibold">
              🔒 100% Refundable Booking Available
            </span>
          </div>
        </div>

        {/* ─── Gallery Section ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="md:col-span-2 relative h-72 sm:h-96 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800">
            <Image
              src={selectedImage}
              alt={pkg.title}
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible">
            {pkg.images.slice(0, 3).map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(img)}
                className={`relative flex-1 min-w-[120px] h-28 rounded-xl overflow-hidden border-2 transition-all ${
                  selectedImage === img
                    ? "border-teal-500 shadow-md scale-[1.02]"
                    : "border-transparent opacity-75 hover:opacity-100"
                }`}
              >
                <Image src={img} alt={`View ${idx + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* ─── Main Content & Sidebar Layout ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Key Inclusions Card */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                <span>🌟</span>
                <span>Package Highlights &amp; Inclusions</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pkg.keyInclusions?.map((inc, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
                    <span className="w-5 h-5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center font-bold text-xs shrink-0">
                      ✓
                    </span>
                    <span>{inc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hotel Accommodations */}
            {pkg.hotelStays && pkg.hotelStays.length > 0 && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                  <span>🏨</span>
                  <span>Accommodations Included ({pkg.durationNights} Nights)</span>
                </h2>
                <div className="space-y-3">
                  {pkg.hotelStays.map((h, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-500">
                            {"★".repeat(h.starRating)} {h.starRating}★ Verified
                          </span>
                          <span className="text-xs text-neutral-400">•</span>
                          <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                            {h.city} ({h.nights} {h.nights > 1 ? "Nights" : "Night"})
                          </span>
                        </div>
                        <h4 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 mt-1">
                          {h.hotelName}
                        </h4>
                        {h.roomType && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                            Room: {h.roomType}
                          </p>
                        )}
                      </div>
                      <span className="self-start sm:self-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                        Breakfast Included
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Day-by-Day Itinerary Accordion */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <span>🗓️</span>
                  <span>Day-by-Day Detailed Itinerary</span>
                </h2>
                <button
                  onClick={() => setExpandedDay(expandedDay === null ? 1 : null)}
                  className="text-xs font-bold text-teal-600 hover:underline"
                >
                  {expandedDay === null ? "Expand First Day" : "Collapse All"}
                </button>
              </div>

              <div className="space-y-4">
                {pkg.itinerary.map((day) => {
                  const isOpen = expandedDay === day.day;
                  return (
                    <div
                      key={day.day}
                      className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedDay(isOpen ? null : day.day)}
                        className="w-full p-4 text-left flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/40 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            D{day.day}
                          </span>
                          <div>
                            <h4 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100">
                              {day.title}
                            </h4>
                            {day.meals && day.meals.length > 0 && (
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                Meals: {day.meals.join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-lg text-neutral-400">{isOpen ? "−" : "+"}</span>
                      </button>

                      {isOpen && (
                        <div className="p-4 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                          <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                            {day.description}
                          </p>

                          {day.highlights && day.highlights.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-2">
                              {day.highlights.map((h, i) => (
                                <span
                                  key={i}
                                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                                >
                                  ✨ {h}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Inclusions & Exclusions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Inclusions */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <h3 className="text-base font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                  <span>✅</span>
                  <span>What&apos;s Included</span>
                </h3>
                <ul className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 space-y-2">
                  {pkg.inclusions.map((inc, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold shrink-0">✓</span>
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Exclusions */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <h3 className="text-base font-bold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                  <span>❌</span>
                  <span>What&apos;s Excluded</span>
                </h3>
                <ul className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 space-y-2">
                  {pkg.exclusions.map((exc, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-red-500 font-bold shrink-0">✕</span>
                      <span>{exc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column (Sticky Booking Sidebar) */}
          <div className="space-y-6">
            <div className="sticky top-20 bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-lg space-y-5">
              {/* Price Banner */}
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-4">
                <p className="text-xs text-neutral-400 uppercase tracking-wider">
                  Twin Sharing Rate
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-teal-700 dark:text-teal-400">
                    {currencySymbol}{unitPrice.toLocaleString()}
                  </span>
                  {pkg.originalPrice && (
                    <span className="text-sm text-neutral-400 line-through">
                      {currencySymbol}{pkg.originalPrice.toLocaleString()}
                    </span>
                  )}
                  <span className="text-xs text-neutral-500">/ person</span>
                </div>
              </div>

              {/* Departure Date Selector */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Select Departure Date:
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-teal-500"
                >
                  {pkg.departureDates?.map((d) => (
                    <option key={d} value={d}>
                      📅 {new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </option>
                  ))}
                </select>
              </div>

              {/* Guest Counts */}
              <div className="grid grid-cols-2 gap-3">
                {/* Adults */}
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700">
                  <span className="block text-[11px] font-semibold text-neutral-500">Adults (12+ yrs)</span>
                  <div className="flex items-center justify-between mt-2">
                    <button
                      onClick={() => setAdults(Math.max(1, adults - 1))}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-neutral-700 font-bold text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-600 flex items-center justify-center hover:bg-neutral-100"
                    >
                      −
                    </button>
                    <span className="font-bold text-sm">{adults}</span>
                    <button
                      onClick={() => setAdults(adults + 1)}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-neutral-700 font-bold text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-600 flex items-center justify-center hover:bg-neutral-100"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Children */}
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700">
                  <span className="block text-[11px] font-semibold text-neutral-500">Children (2-11 yrs)</span>
                  <div className="flex items-center justify-between mt-2">
                    <button
                      onClick={() => setChildren(Math.max(0, children - 1))}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-neutral-700 font-bold text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-600 flex items-center justify-center hover:bg-neutral-100"
                    >
                      −
                    </button>
                    <span className="font-bold text-sm">{children}</span>
                    <button
                      onClick={() => setChildren(children + 1)}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-neutral-700 font-bold text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-600 flex items-center justify-center hover:bg-neutral-100"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Dietary Preferences */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Meal Catering Preference:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setDietaryChoice("pureVeg")}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold transition-all ${
                      dietaryChoice === "pureVeg"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "border-neutral-200 text-neutral-600 dark:border-neutral-700"
                    }`}
                  >
                    🌱 Pure Veg
                  </button>
                  <button
                    type="button"
                    onClick={() => setDietaryChoice("jain")}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold transition-all ${
                      dietaryChoice === "jain"
                        ? "bg-amber-50 text-amber-800 border-amber-500 dark:bg-amber-950/60 dark:text-amber-300"
                        : "border-neutral-200 text-neutral-600 dark:border-neutral-700"
                    }`}
                  >
                    🌿 Jain Meals
                  </button>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-neutral-500">Estimated Total:</span>
                  <div className="text-xl sm:text-2xl font-black text-teal-700 dark:text-teal-400">
                    {currencySymbol}{totalPrice.toLocaleString()}
                  </div>
                </div>
                <span className="text-[11px] text-neutral-400">All Taxes &amp; GST Included</span>
              </div>

              {/* Book Button */}
              <button
                onClick={handleBookNow}
                className="w-full py-3.5 rounded-xl font-extrabold text-sm text-white bg-teal-600 hover:bg-teal-700 transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <span>Proceed to Book Holiday</span>
                <span>→</span>
              </button>

              {/* Custom Quote / Enquiry */}
              <button
                onClick={() => setIsEnquiryOpen(true)}
                className="w-full py-2.5 rounded-xl font-bold text-xs text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
              >
                💬 Need Custom Dates or Group Quote?
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
          serviceName={pkg.title}
          defaultDestination={
            typeof (pkg.destination as any) === "object" && pkg.destination !== null
              ? ((pkg.destination as any).cityName || (pkg.destination as any).country || "Destination")
              : (pkg.destination || "")
          }
          siteId={siteId}
          currencySymbol={currencySymbol}
        />
      )}
    </div>
  );
}
