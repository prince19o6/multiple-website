"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import type { Tour } from "@/lib/type";

export default function ExplorePage() {
  const config = useSiteConfig();

  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const loadTours = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/tours", { cache: "no-store" });
      const json = await res.json().catch(() => null);

      if (!res.ok || (json && json.success === false)) {
        const msg = json?.error || `API returned status ${res.status}`;
        setError(msg);
        setTours([]);
      } else {
        const list: Tour[] = Array.isArray(json?.data)
          ? (json.data as Tour[])
          : Array.isArray(json)
            ? (json as Tour[])
            : [];
        setTours(list);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load tours from API";
      setError(msg);
      setTours([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTours();
  }, [loadTours]);

  const categories = ["All", "Adventure", "Beach", "Cultural", "Wildlife"];

  const filteredTours = useMemo(() => {
    return tours.filter((t) => {
      // 1. Category filter
      if (selectedCategory !== "All") {
        const cat = (t.category || "").toLowerCase();
        const target = selectedCategory.toLowerCase();
        const matchesCategory =
          cat === target ||
          (target === "cultural" && (cat === "culture" || cat === "cultural")) ||
          (target === "culture" && (cat === "cultural" || cat === "culture")) ||
          t.difficulty?.toLowerCase().includes(target);

        if (!matchesCategory) return false;
      }

      // 2. Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.location && t.location.toLowerCase().includes(q)) ||
        (t.destination && t.destination.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        t.difficulty.toLowerCase().includes(q)
      );
    });
  }, [tours, selectedCategory, searchQuery]);

  const hasActiveFilters = selectedCategory !== "All" || searchQuery.trim().length > 0;

  const clearFilters = () => {
    setSelectedCategory("All");
    setSearchQuery("");
  };

  const theme = config.theme || {};
  const primary = theme.primary || "#2563eb";
  const heading = theme.heading || "#111827";
  const muted = theme.mutedText || "#6b7280";
  const bg = theme.background || "#f8fafc";
  const brandName = config.name || "Tours";

  return (
    <main className="min-h-screen py-12" style={{ backgroundColor: bg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: heading }}>
            Explore Tours & Adventures
          </h1>
          <p className="mt-2 text-lg" style={{ color: muted }}>
            {!loading && !error && tours.length > 0
              ? `${filteredTours.length} of ${tours.length} tour${tours.length === 1 ? "" : "s"} available from ${brandName}`
              : `Discover handcrafted experiences from ${brandName}`}
          </p>
        </div>

        {/* Search Bar & Category Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-10 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tours by destination, style, or title..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-sm"
                >
                  ✕
                </button>
              )}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
              >
                Clear Filters ✕
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isSelected
                      ? "text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                  style={{
                    backgroundColor: isSelected ? primary : undefined,
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* 1. Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm animate-pulse"
              >
                <div className="h-52 bg-slate-200" />
                <div className="p-6 space-y-4">
                  <div className="h-5 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-200 rounded" />
                    <div className="h-3 bg-slate-200 rounded w-5/6" />
                  </div>
                  <div className="pt-4 flex justify-between items-center">
                    <div className="h-6 bg-slate-200 rounded w-20" />
                    <div className="h-9 bg-slate-200 rounded-lg w-28" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. Error State with Retry Button */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center max-w-xl mx-auto my-10">
            <span className="text-3xl mb-2 block">⚠️</span>
            <p className="font-bold text-red-800 text-lg">Couldn&apos;t load tours right now.</p>
            <p className="text-sm mt-1 text-red-600 mb-6">{error}</p>
            <button
              type="button"
              onClick={loadTours}
              className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm shadow-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primary }}
            >
              ↻ Retry Connection
            </button>
          </div>
        )}

        {/* 3. Empty States */}
        {!loading && !error && filteredTours.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center max-w-md mx-auto my-10 shadow-sm">
            <span className="text-4xl mb-3 block">🧭</span>
            {hasActiveFilters ? (
              <>
                <h3 className="font-bold text-slate-800 text-lg">
                  {selectedCategory !== "All"
                    ? `No tours in "${selectedCategory}"`
                    : "No results for your search"}
                </h3>
                <p className="text-sm mt-2 text-slate-500 mb-6">
                  {searchQuery
                    ? `We couldn't find any tours matching "${searchQuery}".`
                    : `There are currently no tours listed under the ${selectedCategory} category.`}
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm shadow-sm hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: primary }}
                >
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <h3 className="font-bold text-slate-800 text-lg">
                  No tours found for this website.
                </h3>
                <p className="text-sm mt-2 text-slate-500 mb-6">
                  Check back soon for exciting upcoming itineraries.
                </p>
                <button
                  type="button"
                  onClick={loadTours}
                  className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm shadow-sm hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: primary }}
                >
                  ↻ Refresh Catalog
                </button>
              </>
            )}
          </div>
        )}

        {/* 4. Tours Grid */}
        {!loading && !error && filteredTours.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTours.map((tour) => (
              <div
                key={tour.id}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tour.image}
                  alt={tour.name}
                  className="w-full h-52 object-cover"
                />
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      <span>{tour.category || "Expedition"}</span>
                      <span>{tour.difficulty || "Moderate"}</span>
                    </div>
                    <h2 className="text-xl font-bold" style={{ color: heading }}>
                      {tour.name}
                    </h2>
                    <p className="text-slate-600 text-sm mt-2 line-clamp-3">
                      {tour.description}
                    </p>
                  </div>
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                    <div>
                      <div className="font-extrabold text-xl" style={{ color: primary }}>
                        ${tour.price}
                      </div>
                      <div className="text-xs text-slate-500">
                        ⭐ {tour.rating ?? "—"} · {tour.duration || ""}
                      </div>
                    </div>
                    <Link
                      href={`/tour/${tour.id}`}
                      className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: primary }}
                    >
                      View Tour
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}