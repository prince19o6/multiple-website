"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import { useSite } from "@/lib/SiteContext";
import { getRestaurantBySlug } from "@/lib/api/restaurants";
import { LoadingSkeleton, ErrorState } from "@/components/common";
import EnquiryModal from "@/components/lead/EnquiryModal";

interface RestaurantDetail {
  id: number | string;
  restaurantNumericId?: number;
  restaurantId?: string;
  title: string;
  name?: string;
  slug: string;
  cuisine: string;
  cuisineLabel: string;
  city: string;
  country: string;
  address: string;
  priceRange: string;
  costForTwo: number;
  currency: string;
  rating: number;
  reviews: number;
  isNew: boolean;
  featured?: boolean;
  popular?: boolean;
  isPureVeg: boolean;
  isJainAvailable: boolean;
  isHalalCertified: boolean;
  isVeganFriendly: boolean;
  dietaryTags: string[];
  timings: string;
  image: string;
  specialties: string[];
  overview: string;
}

const TIME_SLOTS = [
  "12:30 PM (Lunch)",
  "01:15 PM (Lunch)",
  "02:00 PM (Lunch)",
  "07:30 PM (Dinner)",
  "08:15 PM (Dinner)",
  "09:00 PM (Dinner)",
  "09:45 PM (Dinner)",
];

export default function RestaurantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const config = useSiteConfig();
  const site = useSite();

  const siteId = site.siteId || "gujjutours";
  const currencySymbol = config.currencySymbol || (siteId === "gujjutours" ? "₹" : "$");

  const slugParam = params?.slug;
  const restaurantSlug = Array.isArray(slugParam)
    ? slugParam[0]
    : typeof slugParam === "string"
      ? slugParam
      : "";

  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [guests, setGuests] = useState(2);
  const [diningDate, setDiningDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [selectedTime, setSelectedTime] = useState(TIME_SLOTS[0]);
  const [dietaryRequest, setDietaryRequest] = useState("Regular");
  const [showEnquiry, setShowEnquiry] = useState(false);

  const loadData = useCallback(async () => {
    if (!restaurantSlug) return;
    setLoading(true);
    setError(null);
    try {
      let raw: any = null;
      try {
        raw = await getRestaurantBySlug(restaurantSlug, { siteId });
      } catch (directErr) {
        // Direct API call failed (e.g. cross-origin port 5000 offline) — query same-origin Next.js proxy
        const res = await fetch(`/api/restaurants/${encodeURIComponent(restaurantSlug)}?site=${siteId}`);
        if (res.ok) {
          raw = await res.json();
        } else {
          throw directErr;
        }
      }

      let r = Array.isArray(raw)
        ? (raw.find((x: any) => x?.slug === restaurantSlug || x?.id === restaurantSlug) || raw[0])
        : (raw?.data ?? raw);

      // If wrapper response contained error, attempt local proxy fallback
      if (!r || (!r.title && !r.name && !r.id)) {
        const localRes = await fetch(`/api/restaurants/${encodeURIComponent(restaurantSlug)}?site=${siteId}`);
        if (localRes.ok) {
          const localJson = await localRes.json();
          r = localJson?.data ?? localJson;
        }
      }

      if (r && (r.title || r.name || r.id)) {
        const title = r.title || r.name || "Dining Experience";
        const cuisine = r.cuisine || (Array.isArray(r.cuisines) ? r.cuisines[0] : "Multi-Cuisine");
        const cuisineLabel = r.cuisineLabel || cuisine;
        const city = r.city || "City";
        const country = r.country || (siteId === "gujjutours" ? "India" : "Global");
        const costForTwo = Number(r.costForTwo || r.averageCostForTwo || r.price || 850);
        const img = r.image || r.imageUrl || r.coverImage || (Array.isArray(r.images) && r.images[0]) || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=85";

        const dietaryTags: string[] = (Array.isArray(r.dietaryTags) && r.dietaryTags.length > 0)
          ? r.dietaryTags
          : (Array.isArray(r.features) && r.features.length > 0)
            ? r.features
            : [
              r.pureVeg ? "100% Pure Vegetarian" : "Vegetarian Options",
              r.jainAvailable ? "Jain Options Available" : null,
              r.halalCertified ? "Halal Certified" : null,
              "Air Conditioned",
            ].filter(Boolean) as string[];

        const specialties: string[] = (Array.isArray(r.specialties) && r.specialties.length > 0)
          ? r.specialties
          : (Array.isArray(r.signatureDishes) && r.signatureDishes.length > 0)
            ? r.signatureDishes
            : (Array.isArray(r.features) && r.features.length > 0)
              ? r.features
              : ["Chef's Signature Platter", "Traditional Specialties", "Gourmet Dessert"];

        const normalizedRestaurant: RestaurantDetail = {
          id: r.id || r.restaurantNumericId || restaurantSlug,
          restaurantNumericId: r.restaurantNumericId,
          title,
          name: title,
          slug: r.slug || restaurantSlug,
          cuisine,
          cuisineLabel,
          city,
          country,
          address: r.address || `${city}, ${country}`,
          priceRange: r.priceRange || "$$",
          costForTwo,
          currency: r.currency || (siteId === "gujjutours" ? "INR" : "USD"),
          rating: Number(r.rating || 4.8),
          reviews: Number(r.reviews || r.reviewsCount || 150),
          isNew: Boolean(r.isNew),
          featured: Boolean(r.featured),
          popular: Boolean(r.popular),
          isPureVeg: Boolean(r.pureVeg ?? r.isPureVeg ?? true),
          isJainAvailable: Boolean(r.jainAvailable ?? r.isJainAvailable ?? true),
          isHalalCertified: Boolean(r.halalCertified ?? r.isHalalCertified),
          isVeganFriendly: Boolean(r.isVeganFriendly ?? true),
          dietaryTags,
          timings: r.timings || r.operatingHours || "11:30 AM - 03:30 PM, 07:00 PM - 11:30 PM",
          image: img,
          specialties,
          overview: r.overview || r.description || `${title} is a premier dining destination in ${city}, celebrated for its culinary mastery and warm ambiance.`,
        };

        setRestaurant(normalizedRestaurant);
      } else {
        setError("Restaurant not found");
      }
    } catch (err: any) {
      if (err?.digest?.includes("NEXT_NOT_FOUND") || err?.message === "NEXT_NOT_FOUND") {
        throw err;
      }
      if (err?.status === 404 || err?.isNotFound) {
        setError("Restaurant not found");
      } else {
        setError(err.message || "Failed to load restaurant details");
      }
    } finally {
      setLoading(false);
    }
  }, [restaurantSlug, siteId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <LoadingSkeleton variant="detail" count={1} />
        </div>
      </main>
    );
  }

  if (error || !restaurant) {
    return (
      <main className="min-h-screen bg-slate-50 py-16 px-4">
        <div className="max-w-md mx-auto text-center space-y-4">
          <ErrorState message={error || "Restaurant not found"} onRetry={loadData} />
          <Link
            href={`/${siteId}/en/restaurants`}
            className="inline-block text-sm font-semibold text-rose-600 hover:text-rose-700 underline"
          >
            ← Back to all restaurants
          </Link>
        </div>
      </main>
    );
  }

  const handleReserveTable = () => {
    const costPerGuest = Math.round((restaurant.costForTwo || 1000) / 2);
    const subtotal = costPerGuest * guests;
    const tax = Math.round(subtotal * 0.05);
    const grandTotal = subtotal + tax;
    const primaryImg = restaurant.image || "";

    const bookingParams = new URLSearchParams({
      service: "restaurant",
      serviceType: "restaurant",
      id: String(restaurant.id || restaurant.slug),
      slug: restaurant.slug,
      title: restaurant.title || restaurant.name || "Restaurant Dining Experience",
      name: restaurant.title || restaurant.name || "Restaurant Dining Experience",
      city: restaurant.city || "",
      option: `${selectedTime} Table Reservation (${guests} Guests)`,
      date: diningDate,
      time: selectedTime,
      guests: String(guests),
      adults: String(guests),
      dietary: dietaryRequest,
      price: String(costPerGuest),
      unitPrice: String(costPerGuest),
      subtotal: String(subtotal),
      tax: String(tax),
      total: String(grandTotal),
      totalPrice: String(grandTotal),
      currency: restaurant.currency || (siteId === "gujjutours" ? "INR" : "USD"),
      image: primaryImg,
      imageUrl: primaryImg,
    });
    router.push(`/booking?${bookingParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* 1. Breadcrumbs */}
      <nav className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex items-center gap-2">
          <Link href="/" className="hover:text-amber-600">Home</Link>
          <span>/</span>
          <Link href="/restaurants" className="hover:text-amber-600">Restaurants</Link>
          <span>/</span>
          <span className="font-semibold text-slate-800">{restaurant.city}</span>
          <span>/</span>
          <span className="text-slate-500 truncate max-w-xs">{restaurant.title}</span>
        </div>
      </nav>

      {/* 2. Main Content Grid */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Columns: Overview, Specialties, Timings, Dietary Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="bg-amber-50 text-amber-800 text-xs font-black uppercase px-2.5 py-0.5 rounded-full">
                  {restaurant.cuisineLabel}
                </span>

                <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span>📍</span>
                  <span>{restaurant.city}, {restaurant.country}</span>
                </span>

                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span>★</span>
                  <span>{restaurant.rating} ({restaurant.reviews} reviews)</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
                {restaurant.title}
              </h1>

              <p className="text-xs text-slate-500 flex items-center gap-1 mb-4">
                <span>📍 {restaurant.address}</span>
              </p>

              {/* Badges / Dietary Highlights */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                {restaurant.dietaryTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                  >
                    <span>✓</span>
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden bg-slate-100 shadow-sm border border-slate-200">
              <Image
                src={restaurant.image}
                alt={restaurant.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 66vw"
                className="object-cover"
              />
            </div>

            {/* Overview / Story */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
              <h2 className="text-base font-bold text-slate-900">About the Culinary Experience</h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {restaurant.overview}
              </p>
            </div>

            {/* Chef Specialties */}
            {restaurant.specialties && restaurant.specialties.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>👨‍🍳</span>
                  <span>Chef&apos;s Signature Specialties</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {restaurant.specialties.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/50 text-slate-800 font-medium"
                    >
                      <span className="text-amber-600 font-bold">★</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Operating Hours */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                <span>⏱️</span>
                <span>Timings &amp; Operating Hours</span>
              </h2>
              <p className="text-xs text-slate-600">
                {restaurant.timings}
              </p>
            </div>
          </div>

          {/* Right Column: Reservation Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xl space-y-4 sticky top-6">
              <div className="flex items-baseline justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[11px] text-slate-400">Approximate Cost</span>
                  <div className="text-2xl font-black text-slate-900">
                    {currencySymbol}{restaurant.costForTwo.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-slate-500">for two guests</span>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-md">
                  {restaurant.priceRange}
                </span>
              </div>

              {/* Date */}
              <div>
                <label htmlFor="restaurant-dining-date-input" className="block text-xs font-bold text-slate-700 mb-1">
                  Dining Date:
                </label>
                <input
                  id="restaurant-dining-date-input"
                  type="date"
                  value={diningDate}
                  onChange={(e) => setDiningDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                />
              </div>

              {/* Time Slot */}
              <div>
                <label htmlFor="restaurant-time-slot-select" className="block text-xs font-bold text-slate-700 mb-1">
                  Select Seating Time Slot:
                </label>
                <select
                  id="restaurant-time-slot-select"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              {/* Guests Count */}
              <div>
                <label htmlFor="restaurant-guests-count-select" className="block text-xs font-bold text-slate-700 mb-1">
                  Number of Guests:
                </label>
                <select
                  id="restaurant-guests-count-select"
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((n) => (
                    <option key={n} value={n}>{n} {n === 1 ? "Guest" : "Guests"}</option>
                  ))}
                </select>
              </div>

              {/* Dietary Note */}
              <div>
                <label htmlFor="restaurant-dietary-request-select" className="block text-xs font-bold text-slate-700 mb-1">
                  Dietary Request:
                </label>
                <select
                  id="restaurant-dietary-request-select"
                  value={dietaryRequest}
                  onChange={(e) => setDietaryRequest(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                >
                  <option value="Regular">Standard Preparation</option>
                  <option value="100% Pure Veg">100% Pure Vegetarian</option>
                  <option value="Jain (No Onion / Garlic)">Jain (No Onion, No Garlic, No Root Veg)</option>
                  <option value="Vegan">Vegan (Plant-Based)</option>
                </select>
              </div>

              {/* Summary */}
              <div className="pt-3 border-t border-slate-100 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Cover Charge / Guest</span>
                  <span>{currencySymbol}{Math.round(restaurant.costForTwo / 2).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Guests ({guests})</span>
                  <span>{currencySymbol}{Math.round((restaurant.costForTwo / 2) * guests).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold pt-2 border-t border-slate-200 text-sm">
                  <span>Estimated Total</span>
                  <span>{currencySymbol}{Math.round((restaurant.costForTwo / 2) * guests * 1.05).toLocaleString()}</span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="button"
                onClick={handleReserveTable}
                className="w-full py-3.5 rounded-xl font-bold text-xs text-white bg-amber-600 hover:bg-amber-700 shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Reserve Dining Experience</span>
                <span>→</span>
              </button>

              <button
                type="button"
                onClick={() => setShowEnquiry(true)}
                className="w-full py-2.5 rounded-xl font-semibold text-xs text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
              >
                💬 Banquet &amp; Group Booking Enquiry
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Enquiry Modal */}
      {showEnquiry && (
        <EnquiryModal
          isOpen={showEnquiry}
          onClose={() => setShowEnquiry(false)}
          serviceTitle={restaurant.title}
          serviceType="restaurant"
        />
      )}
    </div>
  );
}
