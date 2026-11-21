"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import { useSite } from "@/lib/SiteContext";
import { useCurrency } from "@/lib/CurrencyContext";
import { getActualImageUrl } from "@/lib/imageUtils";
import { getTours } from "@/lib/api/tours";

interface ActivityItem {
  id: string;
  tourNumericId?: number;
  title: string;
  name?: string;
  slug: string;
  category: string;
  categorySlug: string;
  destination: string;
  location: string;
  city: string;
  country: string;
  price: number;
  originalPrice?: number;
  currency: string;
  rating: number;
  reviews?: number;
  reviewCount?: number;
  duration: string;
  image: string;
  images?: string[];
  highlights?: string[];
  included?: string[];
  dietaryFeatures?: {
    pureVeg?: boolean;
    jainAvailable?: boolean;
    halalCertified?: boolean;
  };
  featured?: boolean;
  popular?: boolean;
  isNew?: boolean;
}

const CATEGORIES = [
  { slug: "all", label: "All Activities", icon: "✨" },
  { slug: "desert-safari", label: "Desert Safari", icon: "🏜️" },
  { slug: "water-sports", label: "Water Sports", icon: "🏄" },
  { slug: "city-tours", label: "City Tours", icon: "🏙️" },
  { slug: "theme-parks", label: "Theme Parks", icon: "🎢" },
  { slug: "boat-tours", label: "Boat & Cruise", icon: "⛵" },
  { slug: "walking-tours", label: "Walking Tours", icon: "🚶" },
  { slug: "wildlife-safari", label: "Wildlife Safari", icon: "🦁" },
  { slug: "cultural-experience", label: "Culture & Heritage", icon: "🏛️" },
];

export default function ToursPage() {
  const searchParams = useSearchParams();
  const config = useSiteConfig();
  const site = useSite();

  const siteId = site.siteId || "gujjutours";
  const { formatPrice } = useCurrency();
  const primaryColor = config.theme?.colors?.primary || "#2882c5";

  // URL state
  const destinationQuery = searchParams.get("destination") || searchParams.get("city") || "";
  const categoryQuery = searchParams.get("category") || "all";
  const searchQuery = searchParams.get("search") || searchParams.get("q") || "";
  const sortQuery = searchParams.get("sort") || "recommended";
  const pureVegQuery = searchParams.get("pureVeg") === "true";
  const jainQuery = searchParams.get("jainAvailable") === "true";

  // Local state
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState(destinationQuery || "all");
  const [selectedCategory, setSelectedCategory] = useState(categoryQuery);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [sortBy, setSortBy] = useState(sortQuery);
  const [pureVegOnly, setPureVegOnly] = useState(pureVegQuery);
  const [jainOnly, setJainOnly] = useState(jainQuery);

  // Available cities collected from data
  const cities = useMemo(() => {
    const set = new Set<string>();
    activities.forEach((a) => {
      if (a.city) set.add(a.city);
    });
    return ["all", ...Array.from(set)];
  }, [activities]);

  // Load activities from API
  const loadActivities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getTours({
        siteId,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        search: searchInput.trim() || (selectedCity !== "all" ? selectedCity : undefined),
        sort: sortBy,
        pageSize: 60,
      });

      const list: ActivityItem[] = (response.items || []).map((t: any) => ({
        id: String(t.id || t.tourNumericId || t.slug),
        tourNumericId: t.tourNumericId,
        title: t.title || t.name,
        name: t.name || t.title,
        slug: t.slug,
        category: t.category || "Sightseeing",
        categorySlug: t.categorySlug || "city-tours",
        destination: t.destination || t.city || "Destination",
        location: t.location || `${t.city || ""}, ${t.country || ""}`,
        city: t.city || t.destination || "",
        country: t.country || "",
        price: Number(t.price || 0),
        originalPrice: t.originalPrice ? Number(t.originalPrice) : undefined,
        currency: t.currency || (siteId === "gujjutours" ? "INR" : "USD"),
        rating: Number(t.rating || 4.8),
        reviews: Number(t.reviews || 42),
        duration: t.duration || "Half Day",
        image: t.image || t.images?.[0] || "/seed-images/activities/activity-city-tour.svg",
        images: t.images || (t.image ? [t.image] : []),
        highlights: t.highlights || [],
        included: t.inclusions || t.included || [],
        dietaryFeatures: t.dietaryFeatures,
        featured: t.featured,
      }));

      setActivities(list);
    } catch (err: any) {
      setError(err.message || "Failed to load activities");
    } finally {
      setLoading(false);
    }
  }, [siteId, selectedCity, selectedCategory, searchInput, sortBy]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadActivities();
  };

  const handleResetFilters = () => {
    setSelectedCity("all");
    setSelectedCategory("all");
    setSearchInput("");
    setPureVegOnly(false);
    setJainOnly(false);
    setSortBy("recommended");
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-neutral-950 text-gray-900 dark:text-gray-100">
      {/* ─── Hero Banner ─── */}
      <section className="relative bg-neutral-900 text-white overflow-hidden py-12 sm:py-16 px-4">
        <div className="absolute inset-0 opacity-30 mix-blend-overlay">
          <Image
            src="/seed-images/activities/activity-city-tour.svg"
            alt="Activities"
            fill
            className="object-cover"
          />
        </div>
        <div
          className="absolute inset-0 opacity-40 mix-blend-multiply"
          style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, #000000 80%)` }}
        />

        <div className="relative max-w-7xl mx-auto text-center z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-xs font-semibold uppercase tracking-wider">
            <span>✨</span>
            <span>Verified Sightseeing &amp; Experiences</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-md">
            Top Tourist Attractions &amp; Experiences
          </h1>

          <p className="text-sm sm:text-base text-white/80 max-w-2xl mx-auto font-normal">
            Skip-the-line attraction tickets, desert safaris with pure veg &amp; Jain dinners, water sports, and guided excursions across world-famous destinations.
          </p>

          {/* Search bar inside hero */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-2xl mx-auto mt-6 flex items-center bg-white dark:bg-neutral-900 rounded-full shadow-2xl p-1.5 border border-white/20"
          >
            <div className="pl-4 text-gray-400">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search experiences (e.g. Desert Safari, Watersports, Dubai)..."
              className="flex-1 px-3 py-2 text-sm bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 outline-none"
            />
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* ─── Category Quick Chips Bar ─── */}
      <section className="border-b border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setSelectedCategory(cat.slug)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                  isSelected
                    ? "text-white shadow-md scale-[1.02]"
                    : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
                }`}
                style={isSelected ? { backgroundColor: primaryColor } : undefined}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ─── Main Content Area with Filters & Grid ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* City Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-gray-100 dark:border-neutral-800">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 shrink-0 mr-1">
            Cities:
          </span>
          {cities.map((city) => {
            const isSelected = selectedCity === city;
            return (
              <button
                key={city}
                type="button"
                onClick={() => setSelectedCity(city)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  isSelected
                    ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold"
                    : "bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-300 hover:border-gray-400"
                }`}
              >
                {city === "all" ? "All Cities" : city}
              </button>
            );
          })}
        </div>

        {/* Dietary Filters & Sort Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* 100% Pure Veg Filter Button */}
            <button
              type="button"
              onClick={() => setPureVegOnly(!pureVegOnly)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                pureVegOnly
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-white dark:bg-neutral-900 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              }`}
            >
              <span>🌱</span>
              <span>100% Pure Veg Included</span>
            </button>

            {/* Jain Food Available Filter Button */}
            <button
              type="button"
              onClick={() => setJainOnly(!jainOnly)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                jainOnly
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-white dark:bg-neutral-900 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              }`}
            >
              <span>🌿</span>
              <span>Jain Meal Available</span>
            </button>

            {(selectedCity !== "all" || selectedCategory !== "all" || pureVegOnly || jainOnly || searchInput) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-red-600 hover:underline font-semibold ml-2"
              >
                Reset All Filters
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200 outline-none cursor-pointer"
            >
              <option value="recommended">Recommended</option>
              <option value="rating">Highest Rated</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* ─── Loading Skeleton ─── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 animate-pulse space-y-3"
              >
                <div className="h-44 bg-gray-200 dark:bg-neutral-800 rounded-xl" />
                <div className="h-4 bg-gray-200 dark:bg-neutral-800 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-neutral-800 rounded w-1/2" />
                <div className="h-8 bg-gray-200 dark:bg-neutral-800 rounded-lg mt-4" />
              </div>
            ))}
          </div>
        )}

        {/* ─── Error Notice ─── */}
        {!loading && error && (
          <div className="p-6 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 text-center space-y-3">
            <p className="font-bold">Unable to load activities</p>
            <p className="text-xs">{error}</p>
            <button
              type="button"
              onClick={loadActivities}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ─── Empty Results ─── */}
        {!loading && !error && activities.length === 0 && (
          <div className="p-12 text-center rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4">
            <span className="text-4xl block">🔍</span>
            <h3 className="text-lg font-bold">No experiences found</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              We couldn&apos;t find activities matching your exact filters. Try broadening your criteria or reset filters.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-5 py-2.5 rounded-full text-white text-xs font-bold shadow-md"
              style={{ backgroundColor: primaryColor }}
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* ─── Activities Grid ─── */}
        {!loading && !error && activities.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Showing {activities.length} Experiences
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {activities.map((act, idx) => {
                const detailHref = `/en/tours/${encodeURIComponent(act.city?.toLowerCase() || "city")}/${encodeURIComponent(act.categorySlug || "tour")}/${encodeURIComponent(act.slug)}`;

                return (
                  <Link
                    key={`${act.id}-${idx}`}
                    href={detailHref}
                    className="group flex flex-col rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden hover:shadow-xl hover:border-gray-300 dark:hover:border-neutral-700 transition-all duration-300"
                  >
                    {/* Activity Image & Badges */}
                    <div className="relative h-48 w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                      <Image
                        src={getActualImageUrl(act.image, {
                          title: act.title,
                          city: act.city,
                          category: act.category,
                          module: "tours",
                          id: act.id,
                        })}
                        alt={act.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Category Badge */}
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold">
                        {act.category}
                      </div>

                      {/* City Pill */}
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-white/90 dark:bg-neutral-900/90 text-gray-900 dark:text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                        📍 {act.city}
                      </div>

                      {/* Dietary Badges overlay */}
                      <div className="absolute bottom-2 left-2 flex gap-1">
                        {act.dietaryFeatures?.pureVeg && (
                          <span className="px-2 py-0.5 rounded bg-emerald-600/90 text-white text-[10px] font-bold shadow-xs">
                            🌱 Pure Veg
                          </span>
                        )}
                        {act.dietaryFeatures?.jainAvailable && (
                          <span className="px-2 py-0.5 rounded bg-emerald-700/90 text-white text-[10px] font-bold shadow-xs">
                            🌿 Jain Food
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 flex flex-col justify-between space-y-3">
                      <div>
                        {/* Rating & Reviews */}
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="flex items-center gap-1 text-xs font-bold text-amber-500">
                            ★ {act.rating}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            ({act.reviews || act.reviewCount || 120} reviews)
                          </span>
                          <span className="ml-auto text-[11px] font-semibold text-gray-500">
                            ⏱️ {act.duration}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                          {act.title}
                        </h3>

                        {/* Top Highlight bullet */}
                        {act.highlights && act.highlights[0] && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-1.5">
                            ✓ {act.highlights[0]}
                          </p>
                        )}
                      </div>

                      {/* Price & CTA */}
                      <div className="pt-3 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">From</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-black text-gray-900 dark:text-white">
                              {formatPrice(act.price, act.currency || "INR")}
                            </span>
                            {act.originalPrice && (
                              <span className="text-xs text-gray-400 line-through">
                                {formatPrice(act.originalPrice, act.currency || "INR")}
                              </span>
                            )}
                          </div>
                        </div>

                        <span
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm transition-transform active:scale-95 group-hover:opacity-90"
                          style={{ backgroundColor: primaryColor }}
                        >
                          Book Now
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
