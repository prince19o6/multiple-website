"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter, notFound } from "next/navigation";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import { useSite } from "@/lib/SiteContext";
import { getTourBySlug } from "@/lib/api/tours";
import { LoadingSkeleton, ErrorState } from "@/components/common";
import EnquiryModal from "@/components/lead/EnquiryModal";

interface PackageOption {
  id: string;
  title: string;
  description: string;
  price: number;
  hotelPickup?: boolean;
  mealsIncluded?: boolean;
}

interface TourDetail {
  id: string;
  tourNumericId?: number;
  name: string;
  title: string;
  category: string;
  categorySlug?: string;
  destination: string;
  city: string;
  location: string;
  duration: string;
  price: number;
  originalPrice?: number;
  currency: string;
  rating: number;
  reviewsCount: number;
  images: string[];
  highlights: string[];
  overview: string;
  itinerary: { title: string; desc: string; time?: string }[];
  inclusions: string[];
  exclusions: string[];
  importantNotes: string[];
  cancellationPolicy: string;
  packageOptions?: PackageOption[];
  dietaryFeatures?: {
    pureVeg?: boolean;
    jainAvailable?: boolean;
    halalCertified?: boolean;
  };
}

export default function TourDetailPage() {
  const params = useParams();
  const router = useRouter();
  const config = useSiteConfig();
  const site = useSite();

  const slugParam = params?.slug;
  const slugArray = Array.isArray(slugParam) ? slugParam : [String(slugParam || "")];
  const tourPath = slugArray.join("/");

  const siteId = site.siteId || "gujjutours";
  const currencySymbol = config.currencySymbol || (siteId === "gujjutours" ? "₹" : "$");
  const primaryColor = config.theme?.colors?.primary || "#2882c5";

  const [tour, setTour] = useState<TourDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [dietaryChoice, setDietaryChoice] = useState<string>("pureVeg");
  const [isEnquiryOpen, setIsEnquiryOpen] = useState<boolean>(false);

  // Set tomorrow as default date
  useEffect(() => {
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    setSelectedDate(tmrw.toISOString().split("T")[0]);
  }, []);

  // Fetch tour details from backend API
  const fetchTour = useCallback(async () => {
    if (!tourPath) return;
    setLoading(true);
    setError(null);

    try {
      const idOrSlug = slugArray[slugArray.length - 1] || tourPath;
      let t: any = null;
      try {
        t = await getTourBySlug(idOrSlug, { siteId });
      } catch {
        // Direct call failed — query same-origin Next.js proxy
        const res = await fetch(`/api/tours/${encodeURIComponent(idOrSlug)}?site=${encodeURIComponent(siteId)}`);
        if (res.ok) {
          const json = await res.json();
          t = json?.data ?? json;
        }
      }

      if (!t || (!t.name && !t.title)) {
        const localRes = await fetch(`/api/tours/${encodeURIComponent(idOrSlug)}?site=${encodeURIComponent(siteId)}`);
        if (localRes.ok) {
          const localJson = await localRes.json();
          t = localJson?.data ?? localJson;
        }
      }

      if (t && (t.name || t.title)) {
        const rawImages = Array.isArray(t.images) && t.images.length > 0
          ? t.images
          : t.image
          ? [t.image]
          : [];

        const opts: PackageOption[] = Array.isArray((t as any).packageOptions) && (t as any).packageOptions.length > 0
          ? (t as any).packageOptions
          : [
              {
                id: "std",
                title: "Standard Admission Pass",
                description: "Direct entry pass with comprehensive inclusions",
                price: t.price || 199,
                hotelPickup: false,
                mealsIncluded: false,
              },
            ];

        const destStr = typeof t.destination === "object" && t.destination !== null
          ? ((t.destination as any).cityName || (t.destination as any).name || (t.destination as any).address || "Destination")
          : String(t.destination || (t as any).city || "Destination");
        const cityStr = typeof (t as any).city === "object" && (t as any).city !== null
          ? ((t as any).city.cityName || (t as any).city.name || destStr)
          : String((t as any).city || destStr);

        const tourDetail: TourDetail = {
          id: String(t.id || (t as any).tourNumericId || tourPath),
          tourNumericId: (t as any).tourNumericId,
          name: String(t.title || t.name),
          title: String(t.title || t.name),
          category: String(t.category || "Sightseeing"),
          categorySlug: String(t.categorySlug || "city-tours"),
          destination: destStr,
          city: cityStr,
          location: String(t.location || `${cityStr}, ${t.country || ""}`),
          duration: String(t.duration || "Half Day"),
          price: Number(t.price || 199),
          originalPrice: t.originalPrice ? Number(t.originalPrice) : undefined,
          currency: String(t.currency || currencySymbol),
          rating: Number(t.rating || 4.8),
          reviewsCount: Number(t.reviews || (t as any).reviewCount || 120),
          images: rawImages,
          highlights: Array.isArray(t.highlights) && t.highlights.length > 0 ? t.highlights : [],
          overview: String((t as any).overview || t.description || ""),
          itinerary: Array.isArray(t.itinerary) && t.itinerary.length > 0
            ? t.itinerary.map((it: any) => ({ title: it.title || "Day Highlight", desc: it.description || "" }))
            : [],
          inclusions: Array.isArray(t.inclusions) && t.inclusions.length > 0
            ? t.inclusions
            : Array.isArray(t.included)
            ? t.included
            : [],
          exclusions: Array.isArray(t.exclusions) && t.exclusions.length > 0
            ? t.exclusions
            : Array.isArray(t.excluded)
            ? t.excluded
            : [],
          importantNotes: Array.isArray((t as any).importantNotes) ? (t as any).importantNotes : [],
          cancellationPolicy: String((t as any).cancellationPolicy || "Free cancellation up to 24 hours prior to activity start time with 100% refund."),
          packageOptions: opts,
          dietaryFeatures: (t as any).dietaryFeatures,
        };

        setTour(tourDetail);
        if (rawImages[0]) {
          setSelectedImage(rawImages[0]);
        }
      } else {
        setError("Tour experience not found");
      }
    } catch (err: any) {
      if (err?.digest?.includes("NEXT_NOT_FOUND") || err?.message === "NEXT_NOT_FOUND") {
        throw err;
      }
      if (err?.status === 404 || err?.isNotFound) {
        setError("Tour experience not found");
      } else {
        setError(err?.message || "Failed to load tour details");
      }
    } finally {
      setLoading(false);
    }
  }, [tourPath, slugArray, siteId, currencySymbol]);

  useEffect(() => {
    fetchTour();
  }, [fetchTour]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fafbfc] dark:bg-neutral-950 text-gray-900 dark:text-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <LoadingSkeleton type="detail" />
      </main>
    );
  }

  if (error || !tour) {
    return (
      <main className="min-h-screen bg-[#fafbfc] dark:bg-neutral-950 text-gray-900 dark:text-gray-100 py-16 px-4">
        <ErrorState
          title="Tour Experience Not Found"
          message={error || "The requested tour experience could not be loaded."}
          onRetry={fetchTour}
        />
      </main>
    );
  }

  const activeOption = tour.packageOptions?.[selectedOptionIndex] || {
    id: "std",
    title: "Standard Admission",
    description: "Standard ticket",
    price: tour.price,
  };

  const currentUnitPrice = activeOption.price || tour.price;
  const totalPrice = currentUnitPrice * adults + Math.round(currentUnitPrice * 0.7) * children;
  const tax = Math.round(totalPrice * 0.05);
  const grandTotal = totalPrice + tax;
  const primaryImg = tour.images?.[0] || selectedImage || "";

  const handleBookNow = () => {
    const bookingParams = new URLSearchParams({
      service: "tour",
      serviceType: "tour",
      id: String(tour.id),
      slug: tourPath,
      title: tour.title || tour.name,
      name: tour.title || tour.name,
      city: tour.city,
      destination: tour.destination,
      option: activeOption.title,
      date: selectedDate,
      adults: String(adults),
      children: String(children),
      dietary: dietaryChoice,
      price: String(currentUnitPrice),
      unitPrice: String(currentUnitPrice),
      subtotal: String(totalPrice),
      tax: String(tax),
      total: String(grandTotal),
      totalPrice: String(grandTotal),
      currency: tour.currency || (siteId === "gujjutours" ? "INR" : "USD"),
      image: primaryImg,
      imageUrl: primaryImg,
    });

    router.push(`/booking?${bookingParams.toString()}`);
  };

  return (
    <main className="min-h-screen bg-[#fafbfc] dark:bg-neutral-950 text-gray-900 dark:text-gray-100 pb-20 font-sans">
      {/* ─── Breadcrumbs ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Link href="/en" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/en/tours" className="hover:text-primary transition-colors">
            Tours &amp; Activities
          </Link>
          <span>/</span>
          <span className="font-semibold text-gray-800 dark:text-gray-200 truncate max-w-xs">
            {tour.city}
          </span>
          <span>/</span>
          <span className="font-semibold text-gray-900 dark:text-white truncate max-w-sm">
            {tour.title}
          </span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ─── Header Info ─── */}
        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="px-3 py-1 rounded-full text-white text-xs font-bold uppercase tracking-wider shadow-xs"
              style={{ backgroundColor: primaryColor }}
            >
              {tour.category}
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-gray-100 dark:bg-neutral-800 text-xs font-semibold text-gray-700 dark:text-gray-300">
              📍 {tour.location}
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-gray-100 dark:bg-neutral-800 text-xs font-semibold text-gray-700 dark:text-gray-300">
              ⏱️ {tour.duration}
            </span>

            {/* Dietary Badge */}
            {tour.dietaryFeatures?.pureVeg && (
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                🌱 100% Pure Veg Dinner Included
              </span>
            )}
            {tour.dietaryFeatures?.jainAvailable && (
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                🌿 Jain Food Counter Available
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {tour.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1 font-bold text-amber-500">
              <span>★</span>
              <span>{tour.rating}</span>
              <span className="text-gray-400 font-normal">({tour.reviewsCount} reviews)</span>
            </div>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              ✓ Instant Digital Confirmation
            </span>
            <span>•</span>
            <span>Free Cancellation Up to 24 Hours</span>
          </div>
        </div>

        {/* ─── Gallery Grid ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8 rounded-3xl overflow-hidden shadow-lg border border-gray-100 dark:border-neutral-800">
          <div className="md:col-span-2 relative h-72 sm:h-96 md:h-[440px] bg-neutral-900 group">
            {primaryImg ? (
              <Image
                src={primaryImg}
                alt={tour.title}
                fill
                priority
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-500">
                No Photo Available
              </div>
            )}
          </div>

          <div className="hidden md:flex flex-col gap-3 h-[440px]">
            {tour.images.slice(1, 3).map((imgUrl, i) => (
              <div
                key={i}
                onClick={() => setSelectedImage(imgUrl)}
                className="relative flex-1 bg-neutral-900 overflow-hidden cursor-pointer group"
              >
                <Image
                  src={imgUrl}
                  alt={`Tour Gallery ${i + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </div>

        {/* ─── Main Content & Booking Panel ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Highlights */}
            {tour.highlights.length > 0 && (
              <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-gray-100 dark:border-neutral-800 space-y-4 shadow-xs">
                <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>✨</span>
                  <span>Experience Highlights</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  {tour.highlights.map((item, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Overview */}
            {tour.overview && (
              <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-gray-100 dark:border-neutral-800 space-y-3 shadow-xs">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  About This Experience
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {tour.overview}
                </p>
              </div>
            )}

            {/* Itinerary */}
            {tour.itinerary.length > 0 && (
              <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-gray-100 dark:border-neutral-800 space-y-4 shadow-xs">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Program Schedule
                </h2>
                <div className="space-y-4">
                  {tour.itinerary.map((step, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {idx + 1}
                        </div>
                        {idx !== tour.itinerary.length - 1 && (
                          <div className="w-0.5 flex-1 bg-gray-200 dark:bg-neutral-800 my-1" />
                        )}
                      </div>
                      <div className="space-y-1 pb-4">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                          {step.title}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inclusions & Exclusions */}
            {(tour.inclusions.length > 0 || tour.exclusions.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tour.inclusions.length > 0 && (
                  <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-gray-100 dark:border-neutral-800 space-y-3 shadow-xs">
                    <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                      <span>✓</span> What&apos;s Included
                    </h3>
                    <ul className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                      {tour.inclusions.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-500 font-bold shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {tour.exclusions.length > 0 && (
                  <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-gray-100 dark:border-neutral-800 space-y-3 shadow-xs">
                    <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                      <span>✕</span> What&apos;s Not Included
                    </h3>
                    <ul className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                      {tour.exclusions.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-rose-500 font-bold shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── Sticky Booking Card ─── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 p-6 space-y-5 shadow-xl">
              <div>
                <span className="text-xs text-gray-500 font-semibold block mb-0.5">Starting from</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                    {currencySymbol}{currentUnitPrice.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-500">/ person</span>
                </div>
              </div>

              {/* Package Options */}
              {tour.packageOptions && tour.packageOptions.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    Select Package Option
                  </label>
                  <div className="space-y-2">
                    {tour.packageOptions.map((opt, i) => (
                      <div
                        key={opt.id || i}
                        onClick={() => setSelectedOptionIndex(i)}
                        className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                          selectedOptionIndex === i
                            ? "border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary"
                            : "border-gray-200 dark:border-neutral-800 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-gray-900 dark:text-white">
                          <span>{opt.title}</span>
                          <span style={{ color: primaryColor }}>
                            {currencySymbol}{opt.price}
                          </span>
                        </div>
                        {opt.description && (
                          <p className="text-[11px] text-gray-500 mt-1">{opt.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Date Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Travel Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white outline-none cursor-pointer font-semibold"
                />
              </div>

              {/* Guests Count */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Adults (12+ yrs)
                  </label>
                  <div className="flex items-center border border-gray-200 dark:border-neutral-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-neutral-800">
                    <button
                      type="button"
                      disabled={adults <= 1}
                      onClick={() => setAdults((prev) => Math.max(1, prev - 1))}
                      className="px-3 py-1.5 text-xs font-bold hover:bg-gray-200 dark:hover:bg-neutral-700 disabled:opacity-30"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center text-xs font-bold">{adults}</span>
                    <button
                      type="button"
                      onClick={() => setAdults((prev) => prev + 1)}
                      className="px-3 py-1.5 text-xs font-bold hover:bg-gray-200 dark:hover:bg-neutral-700"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Children (3-11 yrs)
                  </label>
                  <div className="flex items-center border border-gray-200 dark:border-neutral-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-neutral-800">
                    <button
                      type="button"
                      disabled={children <= 0}
                      onClick={() => setChildren((prev) => Math.max(0, prev - 1))}
                      className="px-3 py-1.5 text-xs font-bold hover:bg-gray-200 dark:hover:bg-neutral-700 disabled:opacity-30"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center text-xs font-bold">{children}</span>
                    <button
                      type="button"
                      onClick={() => setChildren((prev) => prev + 1)}
                      className="px-3 py-1.5 text-xs font-bold hover:bg-gray-200 dark:hover:bg-neutral-700"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Dietary Preference Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Meal / Dining Preference
                </label>
                <select
                  value={dietaryChoice}
                  onChange={(e) => setDietaryChoice(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white outline-none cursor-pointer font-semibold"
                >
                  <option value="pureVeg">🌱 100% Pure Vegetarian Meal</option>
                  <option value="jain">🌿 Jain Meal (No Onion / No Garlic)</option>
                  <option value="standard">Standard International Meal</option>
                </select>
              </div>

              {/* Price Breakdown */}
              <div className="bg-gray-50 dark:bg-neutral-800 p-3.5 rounded-2xl space-y-2 text-xs border border-gray-100 dark:border-neutral-700">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{adults} Adult(s) × {currencySymbol}{currentUnitPrice}</span>
                  <span>{currencySymbol}{(currentUnitPrice * adults).toLocaleString()}</span>
                </div>
                {children > 0 && (
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>{children} Child(ren) × {currencySymbol}{Math.round(currentUnitPrice * 0.7)}</span>
                    <span>{currencySymbol}{(Math.round(currentUnitPrice * 0.7) * children).toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-200 dark:border-neutral-700 flex justify-between font-black text-sm text-gray-900 dark:text-white">
                  <span>Total Amount</span>
                  <span style={{ color: primaryColor }}>
                    {currencySymbol}{totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleBookNow}
                  className="w-full py-3.5 rounded-2xl text-white font-black text-sm shadow-md transition-all hover:opacity-95 active:scale-98"
                  style={{ backgroundColor: primaryColor }}
                >
                  Instant Book Now
                </button>
                <button
                  type="button"
                  onClick={() => setIsEnquiryOpen(true)}
                  className="w-full py-2.5 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200 font-bold text-xs hover:bg-gray-50 transition-colors"
                >
                  Request Custom Group Quote
                </button>
              </div>

              <div className="text-[11px] text-gray-400 text-center space-y-1 pt-1">
                <p>🔒 256-Bit SSL Encrypted Direct Checkout</p>
                <p>📞 24/7 Dedicated Concierge Support via WhatsApp</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enquiry Modal */}
      <EnquiryModal
        isOpen={isEnquiryOpen}
        onClose={() => setIsEnquiryOpen(false)}
        serviceName={tour.title}
        defaultDestination={tour.destination}
        siteId={siteId}
        currencySymbol={currencySymbol}
      />
    </main>
  );
}
