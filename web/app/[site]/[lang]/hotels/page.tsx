"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound, useSearchParams, useRouter } from "next/navigation";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import { useSite } from "@/lib/SiteContext";
import { useFeature } from "@/lib/features/useFeature";
import DestinationAutocomplete from "@/components/search/DestinationAutocomplete";
import { getActualImageUrl } from "@/lib/imageUtils";

interface HotelRoomPlan {
  id: string;
  name: string;
  bedConfiguration?: string;
  maxAdults?: number;
  pricePerNight: number;
  freeBreakfast?: boolean;
  cancellationPolicy?: string;
}

interface HotelEntity {
  id: string;
  slug: string;
  title: string;
  propertyType: string;
  collections?: string[];
  destination: {
    cityName: string;
    country: string;
    address: string;
    latitude?: number;
    longitude?: number;
  };
  starRating: number;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  compareAtPrice?: number;
  currency: string;
  images: string[];
  amenities: string[];
  dietaryFeatures?: {
    pureVeg: boolean;
    jainAvailable: boolean;
    halalCertified: boolean;
  };
  rooms: HotelRoomPlan[];
  featured?: boolean;
  isNew?: boolean;
}

interface CityCard {
  cityName: string;
  country: string;
  count: number;
  minPrice: number;
  image: string;
}

interface CuratedCollection {
  id: string;
  title: string;
  count: number;
  image: string;
}

export default function HotelsListingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const config = useSiteConfig();
  const site = useSite();

  const { isEnabled: hotelsEnabled } = useFeature("hotels");
  if (!hotelsEnabled) {
    notFound();
  }

  // Active tenant and theme
  const siteId = site.siteId || "gujjutours";
  const primaryColor = config.theme?.colors?.primary || "#2882c5";
  const currencySymbol = config.site?.currency?.symbol || config.currencySymbol || (siteId === "gujjutours" ? "₹" : "$");

  // Search form query params
  const initialDestination = searchParams.get("destination") || searchParams.get("city") || "";
  const initialStars = searchParams.get("stars") ? searchParams.get("stars")!.split(",").map(Number) : [];
  const initialCategory = searchParams.get("category") || searchParams.get("categories") || "";
  const initialCollection = searchParams.get("collection") || "";
  const initialPureVeg = searchParams.get("pureVeg") === "true";
  const initialJain = searchParams.get("jainAvailable") === "true";
  const initialMaxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : 100000;
  const initialSort = searchParams.get("sort") || "recommended";

  // State
  const [destination, setDestination] = useState(initialDestination);
  const [startDate, setStartDate] = useState(searchParams.get("start") || "");
  const [endDate, setEndDate] = useState(searchParams.get("end") || "");
  const [selectedStars, setSelectedStars] = useState<number[]>(initialStars);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedCollection, setSelectedCollection] = useState<string>(initialCollection);
  const [pureVegOnly, setPureVegOnly] = useState<boolean>(initialPureVeg);
  const [jainAvailable, setJainAvailable] = useState<boolean>(initialJain);
  const [maxPrice, setMaxPrice] = useState<number>(initialMaxPrice);
  const [sortBy, setSortBy] = useState<string>(initialSort);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Data State
  const [hotels, setHotels] = useState<HotelEntity[]>([]);
  const [cityCards, setCityCards] = useState<CityCard[]>([]);
  const [collections, setCollections] = useState<CuratedCollection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Fetch collections & city cards once
  useEffect(() => {
    async function fetchCollections() {
      try {
        const res = await fetch(`/api/hotels/collections?site=${encodeURIComponent(siteId)}`);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.cityCards)) setCityCards(json.cityCards);
          if (Array.isArray(json.collections)) setCollections(json.collections);
        }
      } catch (err) {
        console.error("Failed to load hotel collections", err);
      }
    }
    fetchCollections();
  }, [siteId]);

  // Fetch hotels matching filters
  const fetchHotels = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("site", siteId);
      if (destination) params.set("destination", destination);
      if (selectedStars.length > 0) params.set("stars", selectedStars.join(","));
      if (selectedCategory) params.set("propertyType", selectedCategory);
      if (selectedCollection) params.set("collection", selectedCollection);
      if (pureVegOnly) params.set("pureVeg", "true");
      if (jainAvailable) params.set("jainAvailable", "true");
      if (maxPrice < 100000) params.set("maxPrice", String(maxPrice));
      if (sortBy) params.set("sort", sortBy);

      const res = await fetch(`/api/hotels?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setHotels(Array.isArray(json.data) ? json.data : []);
        setTotalCount(json.total ?? json.count ?? 0);
      }
    } catch (err) {
      console.error("Failed to fetch hotels", err);
    } finally {
      setLoading(false);
    }
  }, [siteId, destination, selectedStars, selectedCategory, selectedCollection, pureVegOnly, jainAvailable, maxPrice, sortBy]);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  // Sync state to URL without full reload
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set("destination", destination);
    if (startDate) params.set("start", startDate);
    if (endDate) params.set("end", endDate);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedCollection) params.set("collection", selectedCollection);
    if (selectedStars.length > 0) params.set("stars", selectedStars.join(","));
    if (pureVegOnly) params.set("pureVeg", "true");
    if (jainAvailable) params.set("jainAvailable", "true");
    if (sortBy !== "recommended") params.set("sort", sortBy);

    router.push(`/en/hotels?${params.toString()}`, { scroll: false });
    fetchHotels();
  };

  const handleClearFilters = () => {
    setSelectedStars([]);
    setSelectedCategory("");
    setSelectedCollection("");
    setPureVegOnly(false);
    setJainAvailable(false);
    setMaxPrice(100000);
    setSortBy("recommended");
    router.push("/en/hotels", { scroll: false });
  };

  const toggleStar = (star: number) => {
    setSelectedStars((prev) =>
      prev.includes(star) ? prev.filter((s) => s !== star) : [...prev, star]
    );
  };

  // Property types taxonomy
  const propertyTypes = useMemo(() => [
    { id: "", label: "All Stays" },
    { id: "Hotel", label: "Hotels" },
    { id: "Resort", label: "Resorts" },
    { id: "Villa", label: "Villas" },
    { id: "Aparthotel", label: "Aparthotels" },
    { id: "Apartment", label: "Apartments" },
    { id: "Hostel", label: "Hostels" },
  ], []);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-slate-100">
      {/* ─── 1. HERO SEARCH STRIP ─── */}
      <section
        className="relative text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-black/10 shadow-inner"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, #0f172a 100%)`,
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <span className="text-xs uppercase font-black tracking-widest px-3 py-1 rounded-full bg-white/20 backdrop-blur-md">
              🏨 Verified Accommodations
            </span>
            <h1 className="text-3xl sm:text-4xl font-black mt-2 tracking-tight">
              {destination ? `Hotels in ${destination}` : "Find & Book Hand-Picked Stays"}
            </h1>
            <p className="text-sm sm:text-base text-white/80 max-w-2xl mt-1">
              Direct wholesaler allocations, zero booking fees, and 24/7 concierge assistance.
            </p>
          </div>

          {/* Interactive Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-3 sm:p-4 text-slate-900 dark:text-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end"
          >
            <div className="lg:col-span-5">
              <DestinationAutocomplete
                value={destination}
                onChange={setDestination}
                label="DESTINATION / HOTEL"
                placeholder="City, landmark or hotel name"
                siteId={siteId}
              />
            </div>

            <div className="lg:col-span-4 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-black tracking-wider uppercase text-slate-400 dark:text-neutral-500 mb-1">
                  CHECK-IN
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black tracking-wider uppercase text-slate-400 dark:text-neutral-500 mb-1">
                  CHECK-OUT
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="lg:col-span-3 flex gap-2">
              <button
                type="submit"
                className="flex-1 h-11 rounded-xl text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:brightness-110 active:scale-95 transition-all"
                style={{ backgroundColor: primaryColor }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search Hotels</span>
              </button>
            </div>
          </form>

          {/* Quick Property Type Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide mt-4 pt-1">
            {propertyTypes.map((pt) => {
              const active = selectedCategory === pt.id;
              return (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(pt.id);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                    active
                      ? "bg-white text-slate-900 shadow font-bold scale-105"
                      : "bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm"
                  }`}
                >
                  {pt.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 2. TOP DESTINATION CITIES STRIP (Gujju Tours pattern) ─── */}
      {!destination && cityCards.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Find Top Stays in Cities
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Most loved destinations with guaranteed allocations
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {cityCards.slice(0, 6).map((city) => (
              <button
                key={city.cityName}
                type="button"
                onClick={() => {
                  setDestination(city.cityName);
                }}
                className="group relative rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-3 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <div className="relative h-24 sm:h-28 rounded-xl overflow-hidden mb-2 bg-slate-100 dark:bg-neutral-800">
                  <Image
                    src={city.image || "/seed-images/hotels/hotel-1.svg"}
                    alt={city.cityName}
                    fill
                    sizes="(max-width: 768px) 50vw, 20vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute bottom-1.5 left-2 text-[10px] font-bold text-white px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-xs">
                    {city.count} Hotels
                  </span>
                </div>
                <h3 className="text-xs sm:text-sm font-bold truncate group-hover:text-primary transition-colors">
                  {city.cityName}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                  From {currencySymbol}{city.minPrice.toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ─── 3. CURATED COLLECTIONS TABS (Hill Stations, Beach, Pilgrimage, Luxury) ─── */}
      {collections.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
            <button
              type="button"
              onClick={() => setSelectedCollection("")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                !selectedCollection
                  ? "bg-slate-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-sm"
                  : "bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-300 hover:border-slate-300"
              }`}
            >
              All Collections
            </button>
            {collections.map((col) => {
              const active = selectedCollection === col.id;
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => setSelectedCollection(active ? "" : col.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                    active
                      ? "bg-slate-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-sm"
                      : "bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-300 hover:border-slate-300"
                  }`}
                >
                  <span>{col.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    active ? "bg-white/20 text-white dark:bg-black/20 dark:text-black" : "bg-slate-100 dark:bg-neutral-800 text-slate-500"
                  }`}>
                    {col.count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── 4. MAIN RESULTS & FILTER SECTION ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-neutral-800">
          <div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight">
              {loading ? (
                "Searching available hotels..."
              ) : (
                <>
                  Showing <span className="text-primary">{totalCount}</span> {destination ? `hotels in ${destination}` : "available hotels"}
                </>
              )}
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Prices include taxes and daily allocations
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="lg:hidden flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-bold shadow-xs"
            >
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Filters ({selectedStars.length + (pureVegOnly ? 1 : 0) + (jainAvailable ? 1 : 0) + (selectedCategory ? 1 : 0)})</span>
            </button>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 px-3 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
            >
              <option value="recommended">Sort: Recommended</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating_desc">Highest Traveler Rating</option>
            </select>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-slate-100 dark:bg-neutral-800 text-primary" : "text-slate-400"}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label="List view"
                className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-slate-100 dark:bg-neutral-800 text-primary" : "text-slate-400"}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* ─── 4A. FACETED FILTER SIDEBAR ─── */}
          <aside className={`lg:col-span-1 space-y-6 ${mobileFiltersOpen ? "block" : "hidden lg:block"}`}>
            <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs sticky top-20">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-neutral-800">
                <span className="text-sm font-black uppercase tracking-wider">Filters</span>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  Reset All
                </button>
              </div>

              {/* Star Rating Filter */}
              <div className="mb-6">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-3">
                  Star Rating
                </h4>
                <div className="space-y-2">
                  {[5, 4, 3].map((star) => {
                    const checked = selectedStars.includes(star);
                    return (
                      <label
                        key={star}
                        className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-neutral-300 cursor-pointer p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-neutral-800"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleStar(star)}
                            className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4"
                          />
                          <span className="flex items-center text-amber-500">
                            {"★".repeat(star)}
                            <span className="text-slate-300 dark:text-neutral-700">{"★".repeat(5 - star)}</span>
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-normal">{star} Stars</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Dietary Filters (Prominent on Gujju Tours) */}
              <div className="mb-6 pt-4 border-t border-slate-100 dark:border-neutral-800">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-3">
                  Dietary &amp; Food
                </h4>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pureVegOnly}
                      onChange={(e) => setPureVegOnly(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      <span>Pure Veg Hotel Only</span>
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={jainAvailable}
                      onChange={(e) => setJainAvailable(e.target.checked)}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                      <span>Jain Meals Available</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Property Category Filter */}
              <div className="mb-6 pt-4 border-t border-slate-100 dark:border-neutral-800">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-3">
                  Property Category
                </h4>
                <div className="space-y-2">
                  {propertyTypes.slice(1).map((type) => {
                    const checked = selectedCategory === type.id;
                    return (
                      <label
                        key={type.id}
                        className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-neutral-300 cursor-pointer p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-neutral-800"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="propertyTypeRadio"
                            checked={checked}
                            onChange={() => setSelectedCategory(checked ? "" : type.id)}
                            className="text-primary focus:ring-primary w-4 h-4"
                          />
                          <span>{type.label}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Price Range Slider */}
              <div className="mb-4 pt-4 border-t border-slate-100 dark:border-neutral-800">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2">
                  <span>Max Price</span>
                  <span className="text-primary font-bold">{currencySymbol}{maxPrice.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="100000"
                  step="1000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            </div>
          </aside>

          {/* ─── 4B. HOTEL CARDS GRID / LIST ─── */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse bg-white dark:bg-neutral-900 rounded-2xl h-80 border border-slate-200 dark:border-neutral-800" />
                ))}
              </div>
            ) : hotels.length === 0 ? (
              <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-3xl">
                  🏨
                </div>
                <h3 className="text-lg font-bold">No hotels match your filters</h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mx-auto mt-1 mb-4">
                  Try clearing your dietary, star rating or price filters to see more available accommodations.
                </p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow hover:brightness-110"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-4"}>
                {hotels.map((hotel, idx) => {
                  const citySlug = (hotel.destination?.cityName || "city").toLowerCase().replace(/\s+/g, "-");
                  const detailHref = `/en/hotels/${citySlug}/${hotel.slug}${startDate && endDate ? `?start=${startDate}&end=${endDate}` : ""}`;

                  return (
                    <article
                      key={`${hotel.id || hotel.slug}-${idx}`}
                      className={`group bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col ${
                        viewMode === "list" ? "sm:flex-row" : ""
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className={`relative overflow-hidden bg-slate-100 dark:bg-neutral-800 ${
                        viewMode === "list" ? "sm:w-72 sm:h-auto h-52 shrink-0" : "h-52 w-full"
                      }`}>
                        <Image
                          src={getActualImageUrl(hotel.images?.[0], {
                            title: hotel.title,
                            city: hotel.destination?.cityName,
                            module: "hotels",
                            id: hotel.id || hotel.slug,
                          })}
                          alt={hotel.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-white shadow-xs">
                            {hotel.propertyType}
                          </span>
                          {hotel.dietaryFeatures?.pureVeg && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-xs flex items-center gap-1">
                              <span>🌱</span> Pure Veg
                            </span>
                          )}
                          {hotel.dietaryFeatures?.jainAvailable && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                              Jain Meals
                            </span>
                          )}
                        </div>

                        {/* Star Rating Badge */}
                        <div className="absolute bottom-3 left-3 text-white text-xs font-bold flex items-center gap-1 drop-shadow">
                          <span className="text-amber-400">{"★".repeat(hotel.starRating)}</span>
                          <span className="text-[11px] opacity-90">({hotel.rating.toFixed(1)})</span>
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                        <div>
                          {/* Location */}
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-neutral-500 mb-1">
                            <svg className="w-3.5 h-3.5 text-primary shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.533l.068.034.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
                            </svg>
                            <span className="truncate">{hotel.destination?.address || hotel.destination?.cityName}</span>
                          </div>

                          {/* Title */}
                          <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug group-hover:text-primary transition-colors line-clamp-2">
                            <Link href={detailHref}>
                              {hotel.title}
                            </Link>
                          </h3>

                          {/* Key Amenities */}
                          <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
                            {(hotel.amenities || []).slice(0, 3).map((amenity, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300"
                              >
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Price & CTA */}
                        <div className="pt-3 border-t border-slate-100 dark:border-neutral-800 flex items-end justify-between gap-3">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">
                              Starting from
                            </span>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                                {currencySymbol}{hotel.pricePerNight.toLocaleString()}
                              </span>
                              <span className="text-[11px] text-slate-400">/ night</span>
                            </div>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                              Free Cancellation
                            </span>
                          </div>

                          <Link
                            href={detailHref}
                            className="px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-sm hover:brightness-110 active:scale-95 transition-all shrink-0"
                            style={{ backgroundColor: primaryColor }}
                          >
                            Select Room
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
