"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useSite } from "@/lib/SiteContext";
import { useCurrency } from "@/lib/CurrencyContext";
import { getActualImageUrl } from "@/lib/imageUtils";
import { LoadingSkeleton, ErrorState, EmptyState } from "@/components/common";

interface HotelStay {
  hotelName: string;
  starRating: number;
  nights: number;
  city: string;
  roomType?: string;
}

interface PackageItem {
  id: number | string;
  packageNumericId?: number;
  packageId?: string;
  title: string;
  name?: string;
  slug: string;
  category: string;
  categorySlug: string;
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
  images?: string[];
  keyInclusions?: string[];
  hotelStays?: HotelStay[];
  dietaryFeatures?: {
    pureVeg?: boolean;
    jainAvailable?: boolean;
    halalCertified?: boolean;
  };
  featured?: boolean;
  popular?: boolean;
  isNew?: boolean;
}

const THEME_CATEGORIES = [
  { slug: "all", label: "All Holidays", icon: "✨" },
  { slug: "scenic-escapes", label: "Scenic Escapes", icon: "🏔️" },
  { slug: "spiritual-escapes", label: "Spiritual Escapes", icon: "🛕" },
  { slug: "visa-free-escapes", label: "Visa-Free Escapes", icon: "✈️" },
  { slug: "honeymoon-getaways", label: "Dream Honeymoon", icon: "💍" },
  { slug: "dubai-packages", label: "Dubai Special", icon: "🏙️" },
  { slug: "jain-packages", label: "Jain Friendly", icon: "🌿" },
  { slug: "domestic-holidays", label: "Domestic Holidays", icon: "🇮🇳" },
  { slug: "international-packages", label: "International", icon: "🌍" },
];

export default function HolidaysPage() {
  const searchParams = useSearchParams();
  const site = useSite();

  const siteId = site.siteId || "gujjutours";
  const { formatPrice } = useCurrency();

  // URL query params
  const destinationQuery = searchParams.get("destination") || searchParams.get("city") || "";
  const categoryQuery = searchParams.get("category") || searchParams.get("categorySlug") || "all";
  const searchQuery = searchParams.get("search") || searchParams.get("q") || "";
  const sortQuery = searchParams.get("sort") || "recommended";
  const pureVegQuery = searchParams.get("pureVeg") === "true";
  const jainQuery = searchParams.get("jainAvailable") === "true";
  const domesticQuery = searchParams.get("domestic") === "true";

  // State
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState(destinationQuery || "all");
  const [selectedTheme, setSelectedTheme] = useState(categoryQuery);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [sortBy, setSortBy] = useState(sortQuery);
  const [pureVegOnly, setPureVegOnly] = useState(pureVegQuery);
  const [jainOnly, setJainOnly] = useState(jainQuery);
  const [domesticOnly, setDomesticOnly] = useState(domesticQuery);
  const [durationRange, setDurationRange] = useState<"all" | "short" | "medium" | "long">("all");

  // Fetch holiday packages from API
  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      q.set("site", siteId);
      if (selectedTheme && selectedTheme !== "all") q.set("categorySlug", selectedTheme);
      if (selectedCity && selectedCity !== "all") q.set("city", selectedCity);
      if (searchInput.trim()) q.set("q", searchInput.trim());
      if (pureVegOnly) q.set("pureVeg", "true");
      if (jainOnly) q.set("jainAvailable", "true");
      if (domesticOnly) q.set("domestic", "true");
      if (sortBy) q.set("sort", sortBy);

      if (durationRange === "short") {
        q.set("minDays", "1");
        q.set("maxDays", "4");
      } else if (durationRange === "medium") {
        q.set("minDays", "5");
        q.set("maxDays", "7");
      } else if (durationRange === "long") {
        q.set("minDays", "8");
        q.set("maxDays", "30");
      }

      const res = await fetch(`/api/packages?${q.toString()}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      const items = json?.items ?? json?.data ?? (Array.isArray(json) ? json : []);
      setPackages(items);
    } catch (err: any) {
      console.error("[HolidaysPage] Failed to fetch:", err);
      setError(err.message || "Failed to load packages");
    } finally {
      setLoading(false);
    }
  }, [siteId, selectedTheme, selectedCity, searchInput, pureVegOnly, jainOnly, domesticOnly, sortBy, durationRange]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  // Available cities from data
  const cities = useMemo(() => {
    const set = new Set<string>();
    packages.forEach((p) => {
      if (p.city) set.add(p.city);
      if (p.destination) set.add(p.destination);
    });
    return ["all", ...Array.from(set)];
  }, [packages]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 pb-20">
      {/* ─── Hero Section ─── */}
      <section className="relative bg-gradient-to-r from-teal-800 via-sky-800 to-indigo-900 text-white py-14 px-4 sm:px-6 lg:px-8 shadow-md">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-teal-200 mb-4">
            <Link href="/" className="hover:underline">Home</Link>
            <span>/</span>
            <span className="text-white font-medium">Holiday Packages</span>
          </nav>

          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm text-teal-100 mb-3">
              🏖️ Curated All-Inclusive Tour Packages
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Handcrafted Holiday Experiences
            </h1>
            <p className="mt-3 text-base sm:text-lg text-teal-100 leading-relaxed">
              Explore Scenic Escapes, Spiritual Pilgrimages, Honeymoon Getaways &amp; Dubai Extravaganzas with 100% Pure Veg and Jain meals included.
            </p>
          </div>

          {/* Quick Scope Tabs: All vs Domestic vs International */}
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => { setDomesticOnly(false); setSelectedTheme("all"); }}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${!domesticOnly && selectedTheme !== "international-packages"
                ? "bg-white text-teal-900 shadow-md font-bold"
                : "bg-white/10 hover:bg-white/20 text-white"
                }`}
            >
              All Packages
            </button>
            <button
              onClick={() => { setDomesticOnly(true); setSelectedTheme("domestic-holidays"); }}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${domesticOnly || selectedTheme === "domestic-holidays"
                ? "bg-white text-teal-900 shadow-md font-bold"
                : "bg-white/10 hover:bg-white/20 text-white"
                }`}
            >
              🇮🇳 Domestic Holidays
            </button>
            <button
              onClick={() => { setDomesticOnly(false); setSelectedTheme("international-packages"); }}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${selectedTheme === "international-packages"
                ? "bg-white text-teal-900 shadow-md font-bold"
                : "bg-white/10 hover:bg-white/20 text-white"
                }`}
            >
              🌍 International Holidays
            </button>
          </div>

          {/* Search Bar Bar Card */}
          <div className="mt-6 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-2xl p-4 sm:p-5 shadow-xl grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-400">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search packages, destinations, or sights..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* City Filter */}
            <div className="relative">
              <select
                aria-label="Filter by destination city"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">📍 All Destinations</option>
                {cities
                  .filter((c) => c !== "all")
                  .map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
              </select>
            </div>

            {/* Duration Range */}
            <div className="relative">
              <select
                aria-label="Filter by tour duration"
                value={durationRange}
                onChange={(e) => setDurationRange(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">⏳ Any Duration</option>
                <option value="short">⚡ 1 - 4 Days (Short Break)</option>
                <option value="medium">🏖️ 5 - 7 Days (Popular)</option>
                <option value="long">🌟 8+ Days (Grand Tour)</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Themed Category Carousel Chips ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {THEME_CATEGORIES.map((cat) => {
            const active = selectedTheme === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => {
                  setSelectedTheme(cat.slug);
                  if (cat.slug === "domestic-escapes") setDomesticOnly(true);
                  else if (cat.slug === "international") setDomesticOnly(false);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border ${active
                  ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                  : "bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-teal-400"
                  }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Filters & Sort Controls ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 flex flex-wrap items-center justify-between gap-4">
        {/* Dietary toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setPureVegOnly(!pureVegOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${pureVegOnly
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-500 shadow-sm"
              : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800"
              }`}
          >
            <span>🌱</span>
            <span>100% Pure Veg</span>
          </button>
          <button
            onClick={() => setJainOnly(!jainOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${jainOnly
              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-500 shadow-sm"
              : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800"
              }`}
          >
            <span>🌿</span>
            <span>Jain Food Available</span>
          </button>
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 text-xs">
          <label htmlFor="sort-select" className="text-neutral-500 dark:text-neutral-400 font-medium">Sort by:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-medium focus:ring-1 focus:ring-teal-500"
          >
            <option value="recommended">Featured / Recommended</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
            <option value="duration-asc">Duration: Shortest First</option>
            <option value="duration-desc">Duration: Longest First</option>
          </select>
        </div>
      </div>

      {/* ─── Packages Grid ─── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {loading ? (
          <LoadingSkeleton variant="card" count={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchPackages()} />
        ) : packages.length === 0 ? (
          <EmptyState
            title="No holiday packages found"
            message="Try adjusting your destination, theme, or dietary filter."
            actionLabel="Reset All Filters"
            onAction={() => {
              setSelectedCity("all");
              setSelectedTheme("all");
              setSearchInput("");
              setPureVegOnly(false);
              setJainOnly(false);
              setDomesticOnly(false);
              setDurationRange("all");
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg, idx) => {
              const currentPrice = pkg.startingPrice || pkg.price || 0;
              const hasPureVeg = pkg.dietaryFeatures?.pureVeg;
              const hasJain = pkg.dietaryFeatures?.jainAvailable;

              return (
                <div
                  key={`${pkg.id}-${idx}`}
                  className="group bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-teal-500 dark:hover:border-teal-500 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Image & Pill Badges */}
                    <div className="relative h-52 w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                      <Image
                        src={getActualImageUrl(pkg.image || pkg.images?.[0], {
                          title: pkg.title,
                          city: pkg.city || pkg.destination,
                          module: "packages",
                          id: pkg.id || pkg.slug,
                        })}
                        alt={pkg.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      {/* Top Pill Badges */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-neutral-900/80 text-white backdrop-blur-sm">
                          ⏳ {pkg.duration}
                        </span>
                        {pkg.category && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-600 text-white shadow-sm">
                            {pkg.category.split(" ")[0]}
                          </span>
                        )}
                      </div>

                      {/* Top Right: Dietary Badge */}
                      <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                        {hasPureVeg && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600 text-white shadow-sm">
                            🌱 Pure Veg
                          </span>
                        )}
                        {hasJain && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-600 text-white shadow-sm">
                            🌿 Jain Food
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-4 sm:p-5">
                      {/* Destination & Rating */}
                      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">
                        <span className="font-semibold text-teal-700 dark:text-teal-400">
                          📍 {pkg.citiesCovered || `${pkg.city}, ${pkg.country}`}
                        </span>
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <span>★</span>
                          <span>{pkg.rating?.toFixed(1) || "4.8"}</span>
                          <span className="text-neutral-400 text-[11px] font-normal">
                            ({pkg.reviews || pkg.reviewCount || 120})
                          </span>
                        </div>
                      </div>

                      {/* Package Title */}
                      <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 line-clamp-2 group-hover:text-teal-600 transition-colors">
                        {pkg.title}
                      </h3>

                      {/* Key Inclusions Bullets */}
                      {pkg.keyInclusions && pkg.keyInclusions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                          <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                            Key Inclusions:
                          </p>
                          <ul className="text-xs text-neutral-600 dark:text-neutral-300 space-y-1">
                            {pkg.keyInclusions.slice(0, 3).map((inc, i) => (
                              <li key={i} className="flex items-center gap-1.5 truncate">
                                <span className="text-teal-500 font-bold">✓</span>
                                <span className="truncate">{inc}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer: Pricing & Action Button */}
                  <div className="p-4 sm:p-5 pt-0 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 mt-2">
                    <div>
                      <p className="text-[10px] text-neutral-400 uppercase tracking-wider">
                        Starting from
                      </p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg sm:text-xl font-extrabold text-teal-700 dark:text-teal-400">
                          {formatPrice(currentPrice, pkg.currency || "INR")}
                        </span>
                        {pkg.originalPrice && (
                          <span className="text-xs text-neutral-400 line-through">
                            {formatPrice(pkg.originalPrice, pkg.currency || "INR")}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-400">per person (twin share)</p>
                    </div>

                    <Link
                      href={`/en/holidays/${pkg.slug}`}
                      className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-sm"
                    >
                      View Itinerary →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
