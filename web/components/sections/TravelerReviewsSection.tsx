"use client";

import React, { useState, useRef } from "react";
import type { MergedWebsiteConfig } from "@/lib/mergeWebsiteConfig";

interface TravelerReviewsSectionProps {
  config: MergedWebsiteConfig;
}

interface ReviewItem {
  id: string;
  name: string;
  city: string;
  trip: string;
  rating: number;
  date: string;
  avatar: string;
  comment: string;
}

const REVIEWS: ReviewItem[] = [
  {
    id: "r1",
    name: "Mehul & Kinjal Shah",
    city: "Ahmedabad",
    trip: "Dubai 5N/6D Family Holiday",
    rating: 5,
    date: "October 2026",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80",
    comment: "Our Dubai tour with Gujju Tours was impeccably managed from airport pickup to Burj Khalifa VIP access. Most importantly, as strict Jains, getting warm pure Jain meals at every stop gave our elderly parents complete peace of mind.",
  },
  {
    id: "r2",
    name: "Dr. Rajesh & Sunita Patel",
    city: "Surat",
    trip: "Kashmir Autumn Explorer",
    rating: 5,
    date: "September 2026",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80",
    comment: "The post-booking concierge was remarkable. When flight schedules shifted slightly, the team automatically synchronized our Gulmarg cab without us making a single panicked phone call. True 5-star service.",
  },
  {
    id: "r3",
    name: "Bhavin & Sneha Desai",
    city: "Mumbai",
    trip: "Maldives Honeymoon Package",
    rating: 5,
    date: "August 2026",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80",
    comment: "We locked in the Book Now Pay Later option for our overwater villa. Saved nearly ₹28,000 compared to booking directly. The water villa room allocation was stunning with direct sunset views.",
  },
  {
    id: "r4",
    name: "Ankit Trivedi",
    city: "Vadodara",
    trip: "Bangkok & Pattaya Jain Package",
    rating: 5,
    date: "July 2026",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&q=80",
    comment: "Flawless execution! Coral island speedboat, private airport luxury coach, and Gujarati snacks arranged throughout the trip. Will definitely book our Europe holiday with Gujju Tours.",
  },
];

export default function TravelerReviewsSection({ config: _config }: TravelerReviewsSectionProps) {
  const [modalReview, setModalReview] = useState<ReviewItem | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const offset = direction === "left" ? -300 : 300;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-foreground">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            What Our Travelers Say
          </h2>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1">
            Over 10,000+ verified customer reviews across Trustpilot, Google Reviews, and TripAdvisor
          </p>
        </div>

        {/* Rating summary badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-bold">
          <span>★ 4.9 Average Rating</span>
          <span>(1,200+ Reviews)</span>
        </div>
      </div>

      <div className="relative group">
        <button
          type="button"
          onClick={() => scroll("left")}
          aria-label="Scroll reviews left"
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-surface shadow-soft-sm border border-border items-center justify-center text-foreground hover:bg-surface-2 hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ◀
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory py-2"
          style={{ scrollbarWidth: "none" }}
        >
          {REVIEWS.map((review, idx) => (
            <div
              key={`${review.id}-${idx}`}
              className="min-w-[85%] sm:min-w-[45%] md:min-w-[32%] lg:min-w-[24%] snap-start bg-surface rounded-2xl p-5 border border-border shadow-soft-sm hover:shadow-soft-md transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Author Info */}
                <div className="flex items-center gap-3 mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={review.avatar}
                    alt={review.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-primary/20"
                  />
                  <div className="overflow-hidden">
                    <h4 className="text-sm font-bold text-foreground truncate">
                      {review.name}
                    </h4>
                    <span className="text-[11px] text-foreground-subtle block truncate">
                      📍 {review.city} · {review.date}
                    </span>
                  </div>
                </div>

                {/* Stars & Trip tag */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex text-amber-400 text-xs">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-primary px-2 py-0.5 rounded bg-primary-light truncate max-w-[140px]">
                    {review.trip}
                  </span>
                </div>

                {/* Comment Text */}
                <p className="text-xs text-foreground-muted line-clamp-4 leading-relaxed">
                  &ldquo;{review.comment}&rdquo;
                </p>
              </div>

              {/* Read More Trigger */}
              <div className="pt-3 mt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalReview(review)}
                  className="text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  Read full review →
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scroll("right")}
          aria-label="Scroll reviews right"
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-surface shadow-soft-sm border border-border items-center justify-center text-foreground hover:bg-surface-2 hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ▶
        </button>
      </div>

      {/* Review Modal */}
      {modalReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-surface rounded-2xl p-6 shadow-soft-xl border border-border text-foreground">
            <button
              type="button"
              onClick={() => setModalReview(null)}
              className="absolute top-4 right-4 text-foreground-subtle hover:text-foreground cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={modalReview.avatar}
                alt={modalReview.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/40"
              />
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {modalReview.name}
                </h3>
                <div className="text-xs text-foreground-subtle">
                  {modalReview.city} · {modalReview.trip}
                </div>
              </div>
            </div>

            <div className="flex text-amber-400 text-sm mb-3">
              ★★★★★ <span className="ml-2 text-xs text-foreground-subtle">Verified Traveler Booking</span>
            </div>

            <p className="text-sm text-foreground-muted leading-relaxed">
              &ldquo;{modalReview.comment}&rdquo;
            </p>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setModalReview(null)}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-primary-contrast text-xs font-bold rounded-lg shadow-soft-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
