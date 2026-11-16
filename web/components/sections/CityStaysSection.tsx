"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import type { MergedWebsiteConfig } from "@/lib/mergeWebsiteConfig";

interface CityStaysSectionProps {
  config?: MergedWebsiteConfig;
  cities?: any[];
}

export default function CityStaysSection({ config, cities: propCities }: CityStaysSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [cities, setCities] = useState<any[]>(propCities || []);
  const [loading, setLoading] = useState<boolean>(!propCities || propCities.length === 0);
  const [error, setError] = useState<string | null>(null);

  const siteId = config?.site?.id || "gujjutours";

  const fetchCities = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/destinations?site=${encodeURIComponent(siteId)}`);
      if (!res.ok) {
        throw new Error(`Failed to load cities (HTTP ${res.status})`);
      }
      const json = await res.json();
      const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
      setCities(list);
    } catch (err: any) {
      setError(err.message || "Failed to load destination cities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propCities && propCities.length > 0) {
      setCities(propCities);
      setLoading(false);
    } else {
      fetchCities();
    }
  }, [siteId, propCities]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const offset = direction === "left" ? -280 : 280;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  // 1. Loading Skeleton
  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-48 h-6 bg-neutral-200 dark:bg-neutral-800 rounded mb-6 animate-pulse" />
        <div className="flex gap-4 sm:gap-6 overflow-hidden py-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="min-w-[190px] sm:min-w-[210px] rounded-2xl h-[240px] bg-neutral-100 dark:bg-neutral-800 animate-pulse p-4 flex flex-col justify-end"
            >
              <div className="w-24 h-5 bg-neutral-200 dark:bg-neutral-700 rounded mb-2" />
              <div className="w-16 h-4 bg-neutral-200 dark:bg-neutral-700 rounded" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // 2. Error State
  if (error && cities.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-4 flex items-center justify-between">
          <p className="text-xs sm:text-sm text-red-700 dark:text-red-400 font-medium">⚠️ {error}</p>
          <button
            type="button"
            onClick={fetchCities}
            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  // 3. Empty State
  if (cities.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-foreground">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            Popular Cities for Your Next Stay
          </h2>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1">
            Top destinations curated for effortless booking and extraordinary memories
          </p>
        </div>
        <Link
          href="/en/hotels"
          className="text-xs sm:text-sm font-extrabold text-primary hover:underline flex items-center gap-1"
        >
          Explore all destinations →
        </Link>
      </div>

      <div className="relative group">
        <button
          type="button"
          onClick={() => scroll("left")}
          aria-label="Scroll cities left"
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-surface shadow-soft-xl border border-border items-center justify-center text-foreground hover:bg-surface-2 hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ◀
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory py-2"
          style={{ scrollbarWidth: "none" }}
        >
          {cities.map((city, idx) => {
            const cityName = city.name || city.cityName || "Destination";
            const countryName = city.country || city.countryName || "";
            const slug = city.slug || cityName.toLowerCase().replace(/\s+/g, "-");
            const image = city.image || city.imageUrl || "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80";
            const hotelCount = city.hotelCount || city.count || city.toursCount || null;

            return (
              <Link
                key={`${slug}-${idx}`}
                href={`/en/hotels?destination=${encodeURIComponent(cityName)}`}
                className="min-w-[190px] sm:min-w-[210px] max-w-[210px] snap-start rounded-2xl overflow-hidden relative group/city h-[240px] shadow-soft-sm hover:shadow-soft-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-end p-4 text-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={cityName}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/city:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                <div className="relative z-10">
                  <h3 className="text-base sm:text-lg font-black tracking-tight drop-shadow leading-tight">
                    {cityName}
                  </h3>
                  {countryName ? (
                    <p className="text-[11px] text-gray-200 font-medium mt-0.5 line-clamp-1 drop-shadow-sm">
                      {countryName}
                    </p>
                  ) : null}
                  {hotelCount ? (
                    <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-extrabold uppercase tracking-widest text-white border border-white/20">
                      {hotelCount.toLocaleString()} Properties
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scroll("right")}
          aria-label="Scroll cities right"
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-surface shadow-soft-xl border border-border items-center justify-center text-foreground hover:bg-surface-2 hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ▶
        </button>
      </div>
    </section>
  );
}
