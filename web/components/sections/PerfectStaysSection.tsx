"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import type { MergedWebsiteConfig } from "@/lib/mergeWebsiteConfig";
import { useCurrency } from "@/lib/CurrencyContext";

interface PerfectStaysSectionProps {
  config: MergedWebsiteConfig;
  hotels?: any[];
}

export default function PerfectStaysSection({ config, hotels: propHotels }: PerfectStaysSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hotels, setHotels] = useState<any[]>(propHotels || []);
  const [loading, setLoading] = useState<boolean>(!propHotels || propHotels.length === 0);
  const [error, setError] = useState<string | null>(null);

  const siteId = config.site?.id || "gujjutours";
  const { formatPrice } = useCurrency();

  const fetchHotels = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/hotels?featured=true&site=${encodeURIComponent(siteId)}&pageSize=8`);
      if (!res.ok) {
        throw new Error(`Failed to load hotels (HTTP ${res.status})`);
      }
      const json = await res.json();
      const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
      setHotels(list);
    } catch (err: any) {
      setError(err.message || "Failed to load featured hotels");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propHotels && propHotels.length > 0) {
      setHotels(propHotels);
      setLoading(false);
    } else {
      fetchHotels();
    }
  }, [siteId, propHotels]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const offset = direction === "left" ? -320 : 320;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  // 1. Loading Skeletons
  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-48 h-6 bg-neutral-200 dark:bg-neutral-800 rounded mb-6 animate-pulse" />
        <div className="flex gap-4 sm:gap-6 overflow-hidden py-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="min-w-[280px] sm:min-w-[300px] rounded-2xl h-[340px] bg-neutral-100 dark:bg-neutral-800 animate-pulse p-4 flex flex-col justify-between"
            >
              <div className="w-full h-44 bg-neutral-200 dark:bg-neutral-700 rounded-xl" />
              <div className="space-y-2 mt-3">
                <div className="w-32 h-4 bg-neutral-200 dark:bg-neutral-700 rounded" />
                <div className="w-48 h-5 bg-neutral-200 dark:bg-neutral-700 rounded" />
              </div>
              <div className="w-24 h-6 bg-neutral-200 dark:bg-neutral-700 rounded mt-4" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // 2. Error State with Retry
  if (error && hotels.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-5 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-red-800 dark:text-red-300">Unable to load featured stays</h4>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={fetchHotels}
            className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  // 3. Empty State
  if (hotels.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-foreground">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            Handpicked Stays &amp; Luxury Resorts
          </h2>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1">
            Top-rated hotels with verified cleanliness and transparent pricing
          </p>
        </div>
        <Link
          href="/en/hotels"
          className="text-xs sm:text-sm font-extrabold text-primary hover:underline flex items-center gap-1"
        >
          View all hotels →
        </Link>
      </div>

      <div className="relative group">
        <button
          type="button"
          onClick={() => scroll("left")}
          aria-label="Scroll stays left"
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-surface shadow-soft-xl border border-border items-center justify-center text-foreground hover:bg-surface-2 hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ◀
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory py-2"
          style={{ scrollbarWidth: "none" }}
        >
          {hotels.map((stay, idx) => {
            const rawImg = Array.isArray(stay.images) ? stay.images[0] : stay.image || stay.imageUrl;
            const imgSrc = rawImg || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80";
            const cityName = stay.destination?.cityName || stay.city || stay.location || "Prime Location";
            const price = stay.pricePerNight || stay.price || 0;
            const starCount = stay.starRating || stay.stars || 4;

            return (
              <div
                key={stay.id || stay.slug || idx}
                className="min-w-[270px] sm:min-w-[290px] max-w-[290px] snap-start rounded-2xl overflow-hidden bg-surface border border-border shadow-soft-sm hover:shadow-soft-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 w-full overflow-hidden bg-surface-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgSrc}
                      alt={stay.title || stay.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-[11px] font-bold text-amber-400 flex items-center gap-1">
                      <span>★</span>
                      <span>{stay.rating ? Number(stay.rating).toFixed(1) : "4.8"}</span>
                    </div>
                    {stay.badge ? (
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-primary text-[10px] font-extrabold text-white uppercase tracking-wider">
                        {stay.badge}
                      </div>
                    ) : null}
                  </div>

                  <div className="p-4">
                    <p className="text-[11px] font-semibold text-foreground-muted flex items-center gap-1">
                      📍 {cityName}
                    </p>
                    <h3 className="text-sm font-bold text-foreground mt-1 line-clamp-1">
                      {stay.title || stay.name}
                    </h3>
                    <div className="flex items-center gap-1 text-amber-400 text-xs mt-1">
                      {Array.from({ length: starCount }).map((_, s) => (
                        <span key={s}>★</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-border/50 mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-foreground-muted block font-medium">Starts from</span>
                    <span className="text-base font-extrabold text-foreground">
                      {formatPrice(Number(price), stay.currency || "INR")}
                    </span>
                    <span className="text-[11px] text-foreground-muted"> / night</span>
                  </div>
                  <Link
                    href={`/en/hotels/${stay.slug || stay.id}`}
                    className="px-3.5 py-1.5 rounded-xl bg-primary-light text-primary hover:bg-primary hover:text-white transition-colors text-xs font-bold"
                  >
                    View Stay
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scroll("right")}
          aria-label="Scroll stays right"
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-surface shadow-soft-xl border border-border items-center justify-center text-foreground hover:bg-surface-2 hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ▶
        </button>
      </div>
    </section>
  );
}
