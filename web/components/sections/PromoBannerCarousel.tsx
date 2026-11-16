"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import type { MergedWebsiteConfig } from "@/lib/mergeWebsiteConfig";
import { type ModuleBannerContract } from "@/lib/apiContracts";

interface PromoBannerCarouselProps {
  config: MergedWebsiteConfig;
  banners?: ModuleBannerContract[];
}

export default function PromoBannerCarousel({ config, banners: propBanners }: PromoBannerCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [banners, setBanners] = useState<ModuleBannerContract[]>(propBanners || []);
  const [loading, setLoading] = useState<boolean>(!propBanners || propBanners.length === 0);
  const [error, setError] = useState<string | null>(null);

  const siteId = config.site?.id || "gujjutours";

  const fetchBanners = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/core/v1/home?module=hotels&site=${encodeURIComponent(siteId)}`);
      if (!res.ok) {
        throw new Error(`Failed to load promo banners (HTTP ${res.status})`);
      }
      const json = await res.json();
      if (Array.isArray(json.banners) && json.banners.length > 0) {
        setBanners(json.banners);
      } else {
        setBanners([]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load promotions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propBanners && propBanners.length > 0) {
      setBanners(propBanners);
      setLoading(false);
    } else {
      fetchBanners();
    }
  }, [siteId, propBanners]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const offset = direction === "left" ? -350 : 350;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  // 1. Loading Skeleton State
  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-4 sm:gap-6 overflow-hidden py-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="min-w-[85%] sm:min-w-[45%] lg:min-w-[32%] rounded-2xl h-[230px] sm:h-[260px] bg-neutral-200 dark:bg-neutral-800 animate-pulse p-6 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="w-24 h-4 bg-neutral-300 dark:bg-neutral-700 rounded-full" />
                <div className="w-48 h-6 bg-neutral-300 dark:bg-neutral-700 rounded" />
                <div className="w-36 h-3 bg-neutral-300 dark:bg-neutral-700 rounded" />
              </div>
              <div className="w-28 h-8 bg-neutral-300 dark:bg-neutral-700 rounded-full" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // 2. Error State with Retry
  if (error && banners.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-4 flex items-center justify-between">
          <p className="text-xs sm:text-sm text-red-700 dark:text-red-400 font-medium">
            ⚠️ {error}
          </p>
          <button
            type="button"
            onClick={fetchBanners}
            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  // 3. Empty State: hide section cleanly
  if (banners.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="relative group">
        {/* Left Arrow */}
        <button
          type="button"
          onClick={() => scroll("left")}
          aria-label="Scroll promo banners left"
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-surface shadow-soft-xl border border-border items-center justify-center text-foreground hover:bg-surface-2 hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ◀
        </button>

        {/* Banners Scroll Container */}
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory py-2"
          style={{ scrollbarWidth: "none" }}
        >
          {banners.map((banner, idx) => (
            <div
              key={`${banner.id}-${idx}`}
              className="min-w-[85%] sm:min-w-[45%] lg:min-w-[32%] snap-start rounded-2xl overflow-hidden shadow-soft-md border border-border/80 relative flex flex-col justify-between h-[230px] sm:h-[260px] p-6 text-white group/card transition-all duration-300 hover:shadow-soft-xl hover:-translate-y-1"
            >
              {/* Background Photo */}
              {banner.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />

              {/* Card Header Content */}
              <div className="relative z-10">
                {banner.badge ? (
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-extrabold uppercase tracking-widest text-white border border-white/20">
                    {banner.badge}
                  </span>
                ) : null}
                <h3 className="mt-2 text-lg sm:text-xl font-black leading-tight drop-shadow">
                  {banner.title}
                </h3>
                {banner.subtitle ? (
                  <p className="mt-1 text-xs text-gray-200 line-clamp-2 drop-shadow-sm font-medium">
                    {banner.subtitle}
                  </p>
                ) : null}
              </div>

              {/* CTA Action */}
              <div className="relative z-10 pt-2">
                <Link
                  href={banner.link || `/en/hotels`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-neutral-900 font-bold text-xs shadow-soft-sm hover:bg-neutral-100 transition-all hover:gap-2"
                >
                  <span>{banner.buttonText || "Explore"}</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          type="button"
          onClick={() => scroll("right")}
          aria-label="Scroll promo banners right"
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-surface shadow-soft-xl border border-border items-center justify-center text-foreground hover:bg-surface-2 hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ▶
        </button>
      </div>
    </section>
  );
}
