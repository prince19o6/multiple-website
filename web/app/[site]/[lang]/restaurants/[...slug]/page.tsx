"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import { useSite } from "@/lib/SiteContext";
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

const FALLBACK_RESTAURANT: RestaurantDetail = {
  id: 1001,
  restaurantNumericId: 1001,
  title: "Kathiawad Rasoi Grand Heritage Thali",
  name: "Kathiawad Rasoi Grand Heritage Thali",
  slug: "kathiawad-rasoi-grand-heritage-thali-ahmedabad-1001",
  cuisine: "gujarati-thali",
  cuisineLabel: "Gujarati Thali",
  city: "Ahmedabad",
  country: "India",
  address: "12, Heritage Food Boulevard, Ahmedabad",
  priceRange: "$$",
  costForTwo: 850,
  currency: "INR",
  rating: 4.8,
  reviews: 420,
  isNew: true,
  featured: true,
  popular: true,
  isPureVeg: true,
  isJainAvailable: true,
  isHalalCertified: false,
  isVeganFriendly: true,
  dietaryTags: [
    "100% Pure Vegetarian",
    "Jain Options Available",
    "Air Conditioned",
    "Valet Parking",
  ],
  timings: "11:30 AM - 03:30 PM, 07:00 PM - 11:30 PM",
  image: "/seed-images/restaurants/dining-gujarati-thali.svg",
  specialties: [
    "Undhiyu & Puri",
    "Khaman Dhokla",
    "Gujarati Dal & Kadhi",
    "Kaju Kari",
    "Shrikhand & Jalebi",
  ],
  overview:
    "Kathiawad Rasoi Grand Heritage Thali is one of Ahmedabad's premier dining destinations, celebrated for its authentic Gujarati Thali culinary mastery, impeccable hospitality, and warm ambiance suitable for families and gourmet travelers.",
};

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

  const [restaurant, setRestaurant] = useState<RestaurantDetail>(FALLBACK_RESTAURANT);
  const [loading, setLoading] = useState(true);
  const [guests, setGuests] = useState(2);
  const [diningDate, setDiningDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [selectedTime, setSelectedTime] = useState(TIME_SLOTS[0]);
  const [dietaryRequest, setDietaryRequest] = useState("Regular");
  const [showEnquiry, setShowEnquiry] = useState(false);

  useEffect(() => {
    if (!restaurantSlug) return;

    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/restaurants/${encodeURIComponent(restaurantSlug)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data && isMounted) {
            setRestaurant(json.data);
          }
        }
      } catch (err) {
        console.error("[Restaurant Detail Fetch Error]", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [restaurantSlug]);

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

  if (loading && !restaurant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
      </div>
    );
  }

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

                {restaurant.isNew && (
                  <span className="bg-amber-500 text-white text-xs font-black px-2 py-0.5 rounded-full uppercase">
                    ✨ New
                  </span>
                )}

                <span className="bg-slate-900 text-amber-300 text-xs font-black px-2 py-0.5 rounded-full">
                  {restaurant.priceRange}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                {restaurant.title}
              </h1>

              <p className="text-xs text-slate-500 mt-1">
                {restaurant.address}
              </p>

              <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                <div className="flex items-center text-amber-500 font-bold">
                  <span>★</span>
                  <span className="ml-1 text-slate-800">{restaurant.rating}</span>
                </div>
                <span>•</span>
                <span>{restaurant.reviews} diner reviews</span>
                <span>•</span>
                <span className="text-slate-700 font-semibold">
                  Approx {currencySymbol}{restaurant.costForTwo.toLocaleString()} for two
                </span>
              </div>

              {/* Dietary Tags Strip */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-1.5">
                {restaurant.isPureVeg && (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-full">
                    🌱 100% Pure Vegetarian
                  </span>
                )}
                {restaurant.isJainAvailable && (
                  <span className="bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold px-2.5 py-1 rounded-full">
                    🌿 Jain Options Available
                  </span>
                )}
                {restaurant.isHalalCertified && (
                  <span className="bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold px-2.5 py-1 rounded-full">
                    🕌 Halal Certified
                  </span>
                )}
                {restaurant.isVeganFriendly && (
                  <span className="bg-lime-50 text-lime-700 border border-lime-200 text-xs font-bold px-2.5 py-1 rounded-full">
                    🥑 Vegan Friendly
                  </span>
                )}
                {restaurant.dietaryTags?.map((tag, idx) => (
                  <span key={idx} className="bg-slate-50 text-slate-600 border border-slate-200 text-xs font-medium px-2.5 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Visual Banner */}
            <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              <div className="relative h-64 bg-slate-100">
                <Image
                  src={restaurant.image || "/seed-images/restaurants/dining-indian.svg"}
                  alt={restaurant.title}
                  fill
                  className="object-contain p-6"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
              </div>

              <div className="p-6">
                <h2 className="text-base font-bold text-slate-900 mb-2">About The Venue</h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {restaurant.overview}
                </p>

                {/* Quick Specs Grid */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Timings</span>
                    <strong className="text-slate-800">{restaurant.timings}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Cost For Two</span>
                    <strong className="text-slate-800">{currencySymbol}{restaurant.costForTwo.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Cuisine Style</span>
                    <strong className="text-slate-800">{restaurant.cuisineLabel}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature Specialties */}
            {restaurant.specialties && restaurant.specialties.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">🍲</span>
                  <h2 className="text-lg font-bold text-slate-900">Signature Specialties &amp; Must-Try Dishes</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {restaurant.specialties.map((item, idx) => (
                    <div key={idx} className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 flex items-center gap-2.5">
                      <span className="text-amber-600 font-bold text-sm">★</span>
                      <span className="text-xs font-bold text-slate-800">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Table Reservation Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 bg-white rounded-2xl p-6 border border-slate-200 shadow-lg space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] uppercase font-bold text-slate-400">Table Reservation &amp; Dining Pass</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900">
                    {currencySymbol}{restaurant.costForTwo.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">approx for two</span>
                </div>
              </div>

              {/* Form Controls */}
              <div className="space-y-4 text-xs">
                {/* Date Picker */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                    Dining Date
                  </label>
                  <input
                    type="date"
                    value={diningDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setDiningDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>

                {/* Time Slot */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                    Seating Time Slot
                  </label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-600"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Number of Guests */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                    Number of Guests
                  </label>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
                    <span className="font-bold text-slate-800">{guests} Guest(s)</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setGuests((prev) => Math.max(1, prev - 1))}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-bold hover:bg-slate-100"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => setGuests((prev) => Math.min(12, prev + 1))}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-bold hover:bg-slate-100"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dietary Request */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                    Dietary Preference
                  </label>
                  <select
                    value={dietaryRequest}
                    onChange={(e) => setDietaryRequest(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-600"
                  >
                    <option value="Regular">Regular Dining</option>
                    {restaurant.isPureVeg && <option value="PureVeg">100% Pure Vegetarian</option>}
                    {restaurant.isJainAvailable && <option value="Jain">Strict Jain (No Root Veg)</option>}
                    {restaurant.isHalalCertified && <option value="Halal">Halal Preferred</option>}
                    <option value="WindowSeat">Window / Quiet Table</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <button
                type="button"
                onClick={handleReserveTable}
                className="w-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md transition text-sm flex items-center justify-center gap-2"
              >
                <span>Reserve Table Online</span>
                <span>→</span>
              </button>

              <button
                type="button"
                onClick={() => setShowEnquiry(true)}
                className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl border border-slate-200 transition text-xs"
              >
                Banquet / Group Dining Enquiry
              </button>

              {/* Trust Strip */}
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Instant Table Confirmation SMS &amp; WhatsApp</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Zero Table Reservation Fee</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Special Jain &amp; Dietary Notifications Passed to Chef</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Enquiry Modal */}
      {showEnquiry && (
        <EnquiryModal
          isOpen={showEnquiry}
          onClose={() => setShowEnquiry(false)}
          serviceName={restaurant.title}
          defaultDestination={restaurant.city}
          siteId={siteId}
          currencySymbol={currencySymbol}
        />
      )}
    </div>
  );
}

