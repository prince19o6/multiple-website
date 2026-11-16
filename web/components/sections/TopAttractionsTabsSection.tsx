"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSiteConfig } from "@/lib/SiteConfigContext";

interface AttractionItem {
  id: number | string;
  name: string;
  category?: string;
  slug?: string;
  city?: string;
}

export default function TopAttractionsTabsSection() {
  const config = useSiteConfig();
  const siteId = config?.site?.id || "gujjutours";

  const [cities, setCities] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [attractions, setAttractions] = useState<AttractionItem[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingAttractions, setLoadingAttractions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch destination cities from backend
  const fetchCities = useCallback(async () => {
    setLoadingCities(true);
    setError(null);
    try {
      const res = await fetch(`/api/destinations?site=${encodeURIComponent(siteId)}`);
      if (!res.ok) {
        throw new Error(`Failed to load cities (HTTP ${res.status})`);
      }
      const json = await res.json();
      const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
      const cityNames: string[] = list
        .map((d: any) => d.city || d.name || d.title)
        .filter(Boolean);

      const uniqueCities = Array.from(new Set(cityNames));
      setCities(uniqueCities);
      setActiveTab(0);
    } catch (err: any) {
      setError(err.message || "Failed to load attraction cities");
    } finally {
      setLoadingCities(false);
    }
  }, [siteId]);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  // Fetch attractions for active city
  const activeCity = cities[activeTab] || "";

  const fetchAttractionsForCity = useCallback(async (cityName: string) => {
    if (!cityName) {
      setAttractions([]);
      return;
    }
    setLoadingAttractions(true);
    try {
      const res = await fetch(
        `/api/tours?destination=${encodeURIComponent(cityName)}&site=${encodeURIComponent(siteId)}&limit=4`
      );
      if (!res.ok) {
        throw new Error(`Failed to load tours (HTTP ${res.status})`);
      }
      const json = await res.json();
      const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
      const mapped: AttractionItem[] = list.map((t: any) => ({
        id: t.id || t._id || t.tourNumericId,
        name: t.name || t.title,
        category: t.category || "Sightseeing",
        slug: t.slug,
        city: t.city || cityName,
      }));
      setAttractions(mapped);
    } catch {
      setAttractions([]);
    } finally {
      setLoadingAttractions(false);
    }
  }, [siteId]);

  useEffect(() => {
    if (activeCity) {
      fetchAttractionsForCity(activeCity);
    }
  }, [activeCity, fetchAttractionsForCity]);

  // Loading skeleton for cities
  if (loadingCities) {
    return (
      <section className="py-14 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800">
        <div className="max-w-[1240px] mx-auto px-4">
          <div className="h-7 w-64 bg-neutral-200 dark:bg-neutral-800 rounded mb-2 animate-pulse" />
          <div className="h-4 w-96 bg-neutral-200 dark:bg-neutral-800 rounded mb-6 animate-pulse" />
          <div className="flex gap-3 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Error state with Retry
  if (error) {
    return (
      <section className="py-10 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800">
        <div className="max-w-[1240px] mx-auto px-4 text-center py-8">
          <p className="text-sm text-red-600 dark:text-red-400 font-semibold mb-3">{error}</p>
          <button
            type="button"
            onClick={fetchCities}
            className="px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold rounded-lg hover:opacity-90 transition-opacity"
          >
            Retry Loading Attractions
          </button>
        </div>
      </section>
    );
  }

  // Empty state if no cities
  if (cities.length === 0) {
    return null;
  }

  return (
    <section className="py-14 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800">
      <div className="max-w-[1240px] mx-auto px-4">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
            Top Attractions in Popular Cities
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Browse verified ticket options, entry passes, and activities by city.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar border-b border-neutral-200 dark:border-neutral-800">
          {cities.map((cityName, idx) => (
            <button
              key={cityName}
              type="button"
              onClick={() => setActiveTab(idx)}
              className={`px-4 py-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-all border-b-2 -mb-[2px] ${
                activeTab === idx
                  ? "border-amber-500 text-amber-600 dark:text-amber-400"
                  : "border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white"
              }`}
            >
              Top Attractions in {cityName}
            </button>
          ))}
        </div>

        {/* Attraction Links Grid */}
        {loadingAttractions ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
            ))}
          </div>
        ) : attractions.length === 0 ? (
          <div className="py-8 text-center text-sm text-neutral-400">
            No attractions currently listed for {activeCity}.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {attractions.map((att) => (
              <Link
                key={att.id}
                href={
                  att.slug
                    ? `/en/tours/${att.slug}`
                    : `/en/tours?destination=${encodeURIComponent(activeCity)}&query=${encodeURIComponent(att.name)}`
                }
                className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-sm bg-neutral-50/50 dark:bg-neutral-800/40 hover:bg-white dark:hover:bg-neutral-800 transition-all group"
              >
                <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                  {att.category || "Activity"}
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
                  {att.name}
                </h4>
                <div className="mt-2 text-[11px] font-semibold text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                  <span>View tickets</span>
                  <span>→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
