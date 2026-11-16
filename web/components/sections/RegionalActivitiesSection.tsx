"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { handleImageError } from "@/lib/imageUtils";
import type { CatalogItem } from "@/lib/catalog/types";

interface RegionalActivitiesSectionProps {
  title: string;
  items: CatalogItem[];
  accentColor?: string;
}

export default function RegionalActivitiesSection({
  title,
  items,
  accentColor = "#ff932c"
}: RegionalActivitiesSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = direction === "left" ? -340 : 340;
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="py-12 bg-neutral-50/60 border-t border-neutral-100">
      <div className="max-w-[1240px] mx-auto px-4">
        {/* Header with Title and Scroll Controls */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Popular attractions and handpicked local excursions with instant voucher confirmation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Scroll left"
              className="p-2 rounded-full border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 shadow-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Scroll right"
              className="p-2 rounded-full border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 shadow-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Carousel Row */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-4 no-scrollbar scroll-smooth snap-x snap-mandatory"
        >
          {items.map((item, idx) => {
            const hasDiscount = item.originalPrice && item.originalPrice > item.price;
            const discountPercent = item.discountPercent || (hasDiscount ? Math.round(((item.originalPrice! - item.price) / item.originalPrice!) * 100) : null);

            return (
              <div
                key={`${item.id}-${idx}`}
                className="w-[280px] sm:w-[300px] flex-shrink-0 snap-start bg-white rounded-2xl border border-neutral-200/90 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Image Container with Badges */}
                  <div className="relative h-44 w-full bg-neutral-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={handleImageError}
                    />

                    {/* "New" Badge */}
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                      New
                    </div>

                    {/* Discount Badge */}
                    {discountPercent && discountPercent > 0 && (
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-extrabold shadow-sm">
                        Save {discountPercent}%
                      </div>
                    )}

                    {/* Category Chip */}
                    {item.category && (
                      <div className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold">
                        {item.category}
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4">
                    {/* Location */}
                    {item.cityName && (
                      <div className="text-[11px] font-medium text-neutral-400 mb-1">
                        📍 {item.cityName}, {item.countryName || "Asia"}
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="text-sm font-bold text-neutral-900 line-clamp-2 leading-snug group-hover:text-amber-600 transition-colors">
                      {item.title}
                    </h3>

                    {/* Star Rating & Reviews */}
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-neutral-600">
                      <span className="text-amber-500 font-bold">★ {item.rating}</span>
                      <span className="text-neutral-400">({item.reviewsCount || 12} reviews)</span>
                    </div>
                  </div>
                </div>

                {/* Footer with Price and Book Button */}
                <div className="p-4 pt-0 border-t border-neutral-100 mt-2 flex items-center justify-between">
                  <div>
                    {hasDiscount && (
                      <div className="text-[11px] text-neutral-400 line-through">
                        ${item.originalPrice?.toFixed(2)}
                      </div>
                    )}
                    <div className="text-base font-extrabold text-neutral-900">
                      ${item.price.toFixed(2)}
                    </div>
                  </div>

                  <Link
                    href={`/en/tours?tourId=${item.id}`}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all hover:opacity-95"
                    style={{ backgroundColor: accentColor }}
                  >
                    View Tour
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
