"use client";

import React from "react";
import type { MergedWebsiteConfig } from "@/lib/mergeWebsiteConfig";

interface TrustBadgesSectionProps {
  config: MergedWebsiteConfig;
}

export default function TrustBadgesSection({ config: _config }: TrustBadgesSectionProps) {
  return (
    <section className="bg-surface-2 border-t border-b border-border py-10 text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 1. Review Score Badges Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          {/* Trustpilot */}
          <a
            href="https://www.trustpilot.com/review/www.gujjutours.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-border shadow-soft-sm hover:shadow-soft-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00b67a]/15 text-[#00b67a] flex items-center justify-center font-black text-xl">
                ★
              </div>
              <div>
                <span className="block text-[11px] font-bold text-foreground-subtle uppercase tracking-wider">
                  Trustpilot
                </span>
                <span className="text-sm font-extrabold text-foreground group-hover:text-primary transition-colors">
                  TrustScore 4.9 | 162 Reviews
                </span>
              </div>
            </div>
            <span className="text-foreground-subtle group-hover:translate-x-1 transition-transform">→</span>
          </a>

          {/* Google Reviews */}
          <div className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-border shadow-soft-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-lg">
                G
              </div>
              <div>
                <span className="block text-[11px] font-bold text-foreground-subtle uppercase tracking-wider">
                  Google Reviews
                </span>
                <span className="text-sm font-extrabold text-foreground">
                  Overall 4.8 | 164 Reviews
                </span>
              </div>
            </div>
            <span className="text-amber-400 font-bold">★★★★★</span>
          </div>

          {/* TripAdvisor */}
          <a
            href="https://www.tripadvisor.in/Attraction_Review-g9455268-d32969228-Reviews-Gujju_Tour_Pvt_Ltd-Bilimora_Navsari_District_Gujarat.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-border shadow-soft-sm hover:shadow-soft-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00aa6c]/15 text-[#00aa6c] flex items-center justify-center font-black text-lg">
                🦉
              </div>
              <div>
                <span className="block text-[11px] font-bold text-foreground-subtle uppercase tracking-wider">
                  TripAdvisor
                </span>
                <span className="text-sm font-extrabold text-foreground group-hover:text-primary transition-colors">
                  5.0 | 65 Reviews
                </span>
              </div>
            </div>
            <span className="text-foreground-subtle group-hover:translate-x-1 transition-transform">→</span>
          </a>
        </div>

        {/* 2. Value Points Guarantee Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl shrink-0">
              0%
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">
                No Booking Fees
              </h4>
              <p className="text-xs text-foreground-muted">
                Transparent pricing with zero hidden convenience markups
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-light text-primary flex items-center justify-center font-bold text-xl shrink-0">
              🏷️
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">
                Best Price Guarantee
              </h4>
              <p className="text-xs text-foreground-muted">
                Direct wholesaler rates on Dubai, domestic &amp; global stays
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xl shrink-0">
              🌟
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">
                1000+ Happy Customers
              </h4>
              <p className="text-xs text-foreground-muted">
                Trusted by families, corporate groups &amp; spiritual travelers
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
