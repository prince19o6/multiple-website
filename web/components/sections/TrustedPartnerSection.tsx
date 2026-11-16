"use client";

import React from "react";
import Link from "next/link";
import type { MergedWebsiteConfig } from "@/lib/mergeWebsiteConfig";

interface TrustedPartnerSectionProps {
  config: MergedWebsiteConfig;
}

export default function TrustedPartnerSection({ config }: TrustedPartnerSectionProps) {
  const siteName = config.name || "Gujju Tours";

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-foreground">
      <div className="bg-surface-2 rounded-3xl p-6 sm:p-10 border border-border shadow-soft-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text Narrative */}
          <div className="lg:col-span-7">
            <span className="text-xs font-extrabold uppercase tracking-widest text-primary">
              Why 10,000+ Travelers Choose Us
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-snug">
              Your Trusted Partner for Memorable Journeys
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-foreground-muted leading-relaxed font-normal">
              At {siteName}, we believe travel is more than booking a flight or room—it&apos;s about returning with stories you cherish forever. Over a decade of specialized destination mastery has allowed us to craft domestic circuits, pure vegetarian getaways, and luxury international holidays that eliminate uncertainty.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="p-3 bg-surface rounded-xl border border-border shadow-soft-sm">
                <span className="text-xl">🤝</span>
                <h3 className="text-xs font-bold text-foreground mt-1">
                  100% Verified Partners
                </h3>
                <p className="text-[10px] text-foreground-muted mt-0.5">
                  Direct contracts with 5-star hotel chains &amp; licensed operators
                </p>
              </div>

              <div className="p-3 bg-surface rounded-xl border border-border shadow-soft-sm">
                <span className="text-xl">🥗</span>
                <h3 className="text-xs font-bold text-foreground mt-1">
                  Dietary &amp; Jain Friendly
                </h3>
                <p className="text-[10px] text-foreground-muted mt-0.5">
                  Guaranteed pure vegetarian &amp; Jain meal catering worldwide
                </p>
              </div>

              <div className="p-3 bg-surface rounded-xl border border-border shadow-soft-sm">
                <span className="text-xl">💳</span>
                <h3 className="text-xs font-bold text-foreground mt-1">
                  Book Now, Pay Later
                </h3>
                <p className="text-[10px] text-foreground-muted mt-0.5">
                  Reserve with ₹0 deposit and settle upon arrival
                </p>
              </div>

              <div className="p-3 bg-surface rounded-xl border border-border shadow-soft-sm">
                <span className="text-xl">📞</span>
                <h3 className="text-xs font-bold text-foreground mt-1">
                  24/7 Human Concierge
                </h3>
                <p className="text-[10px] text-foreground-muted mt-0.5">
                  Never talk to a robot; reach dedicated trip managers instantly
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <Link
                href="/en/about-us"
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-primary-contrast text-xs font-bold transition-colors shadow-soft-sm"
              >
                Learn More About Us
              </Link>
              <Link
                href="/en/contact-us"
                className="text-xs font-bold text-foreground-muted hover:text-primary transition-colors"
              >
                Speak with an Advisor →
              </Link>
            </div>
          </div>

          {/* Right Showcase Photo Collage */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80"
              alt="Dubai Skyline"
              className="w-full h-44 object-cover rounded-2xl shadow-soft-md"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=400&q=80"
              alt="Kashmir Valley"
              className="w-full h-44 object-cover rounded-2xl shadow-soft-md translate-y-3"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400&q=80"
              alt="Maldives Island"
              className="w-full h-44 object-cover rounded-2xl shadow-soft-md -translate-y-3"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80"
              alt="Luxury Resort"
              className="w-full h-44 object-cover rounded-2xl shadow-soft-md"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
