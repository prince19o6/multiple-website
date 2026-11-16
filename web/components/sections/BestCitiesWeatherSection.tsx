"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { handleImageError } from "@/lib/imageUtils";

export interface CityWeatherItem {
  id: number | string;
  name: string;
  countryName: string;
  image: string;
  weather?: {
    minTemp: number;
    maxTemp: number;
    weatherCode?: string;
    condition?: string;
  };
  slug?: string;
}

interface BestCitiesWeatherSectionProps {
  cities?: CityWeatherItem[];
  title?: string;
  siteId?: string;
}

export default function BestCitiesWeatherSection({
  cities: propCities,
  title = "Best Cities to Visit",
  siteId = "gujjutours",
}: BestCitiesWeatherSectionProps) {
  const [cities, setCities] = useState<CityWeatherItem[]>(propCities || []);
  const [loading, setLoading] = useState<boolean>(!propCities || propCities.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState("All");

  const fetchCities = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/weather/destinations?site=${encodeURIComponent(siteId)}`);
      if (!res.ok) {
        throw new Error(`Failed to load weather destinations (HTTP ${res.status})`);
      }
      const json = await res.json();
      const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
      setCities(list);
    } catch (err: any) {
      setError(err.message || "Failed to load live weather destinations");
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

  // Derived unique countries list from real API data
  const countries = useMemo(() => {
    const list = Array.from(new Set(cities.map((c) => c.countryName).filter(Boolean)));
    return ["All", ...list];
  }, [cities]);

  const filteredCities = useMemo(() => {
    if (selectedCountry === "All") return cities;
    return cities.filter(
      (c) => c.countryName?.toLowerCase() === selectedCountry.toLowerCase()
    );
  }, [cities, selectedCountry]);

  // 1. Loading Skeleton
  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-48 h-6 bg-neutral-200 dark:bg-neutral-800 rounded mb-4 animate-pulse" />
        <div className="flex gap-2 mb-6 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-20 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  // 2. Error State with Retry
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1">
            Real-time travel forecasts &amp; verified top city getaways
          </p>
        </div>
        <span className="text-xs font-semibold text-foreground-muted">
          Showing {filteredCities.length} destinations
        </span>
      </div>

      {/* Dynamic Country Filter Tabs */}
      {countries.length > 2 && (
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-2">
          {countries.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCountry(c)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                selectedCountry === c
                  ? "bg-primary text-white shadow-soft-sm"
                  : "bg-surface text-foreground-muted hover:text-foreground border border-border"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Grid of Weather Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredCities.map((city, idx) => (
          <Link
            key={city.id || city.slug || idx}
            href={`/en/tours?destination=${encodeURIComponent(city.name)}`}
            className="group relative h-48 rounded-2xl overflow-hidden bg-surface border border-border shadow-soft-sm hover:shadow-soft-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between p-3 text-white"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={city.image}
              alt={city.name}
              onError={handleImageError}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

            {/* Weather Pill */}
            <div className="relative z-10 self-end">
              {city.weather ? (
                <div className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-amber-300 flex items-center gap-1 border border-white/10">
                  <span>🌡️</span>
                  <span>
                    {Math.round(city.weather.minTemp)}° - {Math.round(city.weather.maxTemp)}°C
                  </span>
                </div>
              ) : null}
            </div>

            {/* City Title */}
            <div className="relative z-10">
              <h3 className="text-sm font-black tracking-tight drop-shadow leading-tight">
                {city.name}
              </h3>
              <p className="text-[10px] text-gray-200 font-medium line-clamp-1 drop-shadow-sm">
                {city.countryName}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
