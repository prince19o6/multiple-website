"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import { useSite } from "@/lib/SiteContext";
import { getActualImageUrl } from "@/lib/imageUtils";

interface RestaurantItem {
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

const CUISINE_FILTERS = [
  { slug: "all", label: "All Cuisines", icon: "🍽️" },
  { slug: "gujarati-thali", label: "Gujarati Thali", icon: "🥘" },
  { slug: "jain", label: "Jain Friendly", icon: "🌿" },
  { slug: "vegetarian", label: "100% Pure Veg", icon: "🥗" },
  { slug: "indian", label: "Indian Cuisine", icon: "🍛" },
  { slug: "asian", label: "Pan-Asian", icon: "🥢" },
  { slug: "seafood", label: "Seafood", icon: "🐟" },
  { slug: "fine-dining", label: "Fine Dining", icon: "🍷" },
  { slug: "cafe", label: "Artisan Cafe", icon: "☕" },
  { slug: "street-food", label: "Street Food", icon: "🌮" },
];

export default function RestaurantsPage() {
  const searchParams = useSearchParams();
  const config = useSiteConfig();
  const site = useSite();

  const siteId = site.siteId || "gujjutours";
  const currencySymbol = config.currencySymbol || (siteId === "gujjutours" ? "₹" : "$");

  // Query params
  const initialCity = searchParams.get("city") || searchParams.get("destination") || "all";
  const initialCuisine = searchParams.get("cuisine") || searchParams.get("category") || "all";
  const initialQuery = searchParams.get("q") || "";
  const initialSort = searchParams.get("sort") || "popular";

  // State
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedCuisine, setSelectedCuisine] = useState(initialCuisine);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [pureVegOnly, setPureVegOnly] = useState(false);
  const [jainOnly, setJainOnly] = useState(false);
  const [halalOnly, setHalalOnly] = useState(false);
  const [sortBy, setSortBy] = useState(initialSort);

  // Data
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch restaurants from API
  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedCity && selectedCity !== "all") params.set("city", selectedCity);
      if (selectedCuisine && selectedCuisine !== "all") params.set("cuisine", selectedCuisine);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (pureVegOnly) params.set("pureVeg", "true");
      if (jainOnly) params.set("jain", "true");
      if (halalOnly) params.set("halal", "true");
      if (sortBy) params.set("sort", sortBy);
      params.set("pageSize", "60");

      const res = await fetch(`/api/restaurants?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load restaurant venues");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setRestaurants(json.data);
      } else {
        setRestaurants([]);
      }
    } catch (err: any) {
      console.error("[Restaurants Page Fetch Error]", err);
      setError(err.message || "Unable to load restaurants");
    } finally {
      setLoading(false);
    }
  }, [selectedCity, selectedCuisine, searchQuery, pureVegOnly, jainOnly, halalOnly, sortBy]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  // Distinct cities for location dropdown
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    restaurants.forEach((r) => {
      if (r.city) set.add(r.city);
    });
    return Array.from(set).sort();
  }, [restaurants]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRestaurants();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* 1. Hero & Search Banner: "Where would you like to eat?" */}
      <section className="bg-gradient-to-r from-amber-900 via-orange-950 to-amber-900 text-white py-12 px-4 sm:px-6 lg:px-8 shadow-md">
        <div className="max-w-6xl mx-auto text-center sm:text-left">
          <div className="inline-flex items-center gap-2 bg-amber-800/70 text-amber-200 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase mb-3">
            <span>🍴 Gourmet Dining &amp; Culinary Explorer</span>
            <span>•</span>
            <span>{site.displayName}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
            Where would you like to eat?
          </h1>
          <p className="mt-2 text-base sm:text-lg text-amber-100/90 max-w-2xl">
            Discover authentic local flavours, unlimited Gujarati thalis, pure Jain dining, specialty cafes, and premier fine dining bistros across your favorite destinations.
          </p>

          {/* Search Bar Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-8 bg-white text-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl border border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-3"
          >
            {/* Search Input */}
            <div className="sm:col-span-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 text-left">
                Search Restaurant, Dish, or Cuisine
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Gujarati Thali, Paneer Tikka, Dim Sum, Sourdough..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>
            </div>

            {/* City Dropdown */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 text-left">
                Destination City
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-600"
              >
                <option value="all">All Cities</option>
                {availableCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <div className="sm:col-span-3 flex items-end">
              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold py-2.5 px-4 rounded-xl transition duration-150 shadow-md text-sm"
              >
                Find Restaurants
              </button>
            </div>
          </form>

          {/* Quick Dietary Toggles */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase text-amber-200 tracking-wider mr-1">
              Dietary Preferences:
            </span>

            <button
              type="button"
              onClick={() => setPureVegOnly(!pureVegOnly)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                pureVegOnly
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "bg-amber-950/70 text-amber-200 border border-amber-800/80 hover:bg-amber-900"
              }`}
            >
              <span>🌱</span>
              <span>100% Pure Veg</span>
            </button>

            <button
              type="button"
              onClick={() => setJainOnly(!jainOnly)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                jainOnly
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "bg-amber-950/70 text-amber-200 border border-amber-800/80 hover:bg-amber-900"
              }`}
            >
              <span>🌿</span>
              <span>Jain Friendly</span>
            </button>

            <button
              type="button"
              onClick={() => setHalalOnly(!halalOnly)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                halalOnly
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "bg-amber-950/70 text-amber-200 border border-amber-800/80 hover:bg-amber-900"
              }`}
            >
              <span>🕌</span>
              <span>Halal Certified</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Trust Strip */}
      <section className="bg-white border-b border-slate-200 py-4 px-4 shadow-sm">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-2">
            <div className="text-xl">✨</div>
            <div className="text-xs font-extrabold text-slate-800 mt-0.5">Verified Dining Partners</div>
            <div className="text-[11px] text-slate-500">Inspected for hygiene &amp; authenticity</div>
          </div>
          <div className="p-2 border-l border-slate-100">
            <div className="text-xl">🥗</div>
            <div className="text-xs font-extrabold text-slate-800 mt-0.5">Strict Dietary Filters</div>
            <div className="text-[11px] text-slate-500">Pure Veg &amp; Jain friendly certified</div>
          </div>
          <div className="p-2 border-l border-slate-100">
            <div className="text-xl">⭐</div>
            <div className="text-xs font-extrabold text-slate-800 mt-0.5">Top Rated Flavours</div>
            <div className="text-[11px] text-slate-500">Real verified diner reviews &amp; scores</div>
          </div>
          <div className="p-2 border-l border-slate-100">
            <div className="text-xl">📍</div>
            <div className="text-xs font-extrabold text-slate-800 mt-0.5">Prime City Locations</div>
            <div className="text-[11px] text-slate-500">Close to city hotels &amp; landmarks</div>
          </div>
        </div>
      </section>

      {/* 3. Main Content: Cuisines Tabs + Restaurant Cards Grid */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cuisine Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap gap-2">
            {CUISINE_FILTERS.map((cat) => {
              const active = selectedCuisine === cat.slug;
              return (
                <button
                  key={cat.slug}
                  onClick={() => setSelectedCuisine(cat.slug)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${
                    active
                      ? "bg-amber-600 text-white shadow-sm"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none"
            >
              <option value="popular">Most Popular</option>
              <option value="rating-desc">Highest Rated</option>
              <option value="newest">Newest Additions</option>
              <option value="cost-asc">Cost: Low to High</option>
              <option value="cost-desc">Cost: High to Low</option>
            </select>
          </div>
        </div>

        {/* Results Banner */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Showing {restaurants.length} Dining Venues
          </p>
          {selectedCity !== "all" && (
            <span className="text-xs text-slate-500">
              In <strong className="text-slate-700">{selectedCity}</strong>
            </span>
          )}
        </div>

        {/* Loading / Error / Empty States */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm animate-pulse h-72" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200 text-center">
            <p className="font-semibold">Unable to load restaurants</p>
            <p className="text-xs mt-1">{error}</p>
            <button
              onClick={fetchRestaurants}
              className="mt-3 bg-red-600 text-white text-xs px-4 py-1.5 rounded-lg font-bold"
            >
              Try Again
            </button>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center">
            <span className="text-4xl">🍲</span>
            <h3 className="mt-3 text-base font-bold text-slate-800">No restaurants match your search</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Try adjusting your dietary filters, cuisine category, or destination city to see other gourmet venues.
            </p>
            <button
              onClick={() => {
                setSelectedCity("all");
                setSelectedCuisine("all");
                setSearchQuery("");
                setPureVegOnly(false);
                setJainOnly(false);
                setHalalOnly(false);
              }}
              className="mt-4 bg-amber-600 text-white text-xs px-4 py-2 rounded-xl font-bold hover:bg-amber-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((res, idx) => (
              <article
                key={`${res.slug || res.id}-${idx}`}
                className="group bg-white rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition duration-200 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Restaurant Image Banner with Actual Photography */}
                  <div className="relative h-48 bg-slate-100 overflow-hidden border-b border-slate-100">
                    <Image
                      src={getActualImageUrl(res.image, {
                        title: res.title,
                        city: res.city,
                        module: "restaurants",
                        id: res.id || res.slug,
                      })}
                      alt={res.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />

                    {/* New Badge */}
                    {res.isNew && (
                      <div className="absolute top-3 left-3 bg-amber-500 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm z-10">
                        ✨ New
                      </div>
                    )}

                    {/* City Badge */}
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-bold text-slate-800 shadow-sm flex items-center gap-1 z-10">
                      <span>📍</span>
                      <span>{res.city}</span>
                    </div>

                    {/* Price Range Pill */}
                    <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-xs font-black text-amber-300 z-10">
                      {res.priceRange}
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-extrabold uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        {res.cuisineLabel}
                      </span>
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                        <span>★</span>
                        <span className="text-slate-800">{res.rating}</span>
                        <span className="text-slate-400 text-[10px]">({res.reviews})</span>
                      </div>
                    </div>

                    <h2 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                      {res.title}
                    </h2>

                    <p className="text-xs text-slate-500 mt-1 truncate">
                      {res.address}
                    </p>

                    {/* Dietary Tags Strip */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {res.isPureVeg && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          🌱 100% Pure Veg
                        </span>
                      )}
                      {res.isJainAvailable && (
                        <span className="bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          🌿 Jain Options
                        </span>
                      )}
                      {res.isHalalCertified && (
                        <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          🕌 Halal
                        </span>
                      )}
                    </div>

                    {/* Specialties snippet */}
                    {res.specialties && res.specialties.length > 0 && (
                      <div className="mt-3 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="font-bold text-slate-700">Must Try: </span>
                        <span>{res.specialties.slice(0, 3).join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Strip */}
                <div className="p-4 pt-0">
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Cost For Two</span>
                      <span className="text-sm font-extrabold text-slate-900">
                        {currencySymbol}{res.costForTwo.toLocaleString()} <span className="text-xs font-normal text-slate-500">approx</span>
                      </span>
                    </div>

                    <Link
                      href={`/restaurants/${res.slug}/${res.id}`}
                      className="bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-sm"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
