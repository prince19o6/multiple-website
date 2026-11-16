"use client";

import React from "react";
import type { MergedWebsiteConfig } from "@/lib/mergeWebsiteConfig";

interface OfficialPartnersSectionProps {
  config: MergedWebsiteConfig;
}

export default function OfficialPartnersSection({ config }: OfficialPartnersSectionProps) {
  const airlinePartners: string[] = (config as any)?.partners?.airlines || (config as any)?.site?.partners?.airlines || [];
  const attractionPartners: string[] = (config as any)?.partners?.attractions || (config as any)?.site?.partners?.attractions || [];

  if (airlinePartners.length === 0 && attractionPartners.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-border text-foreground">
      {/* Airline Partners */}
      {airlinePartners.length > 0 && (
        <div className="mb-8">
          <h3 className="text-center text-xs font-bold uppercase tracking-widest text-foreground-subtle mb-4">
            Official Airline &amp; Global Partners
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 opacity-85 grayscale hover:grayscale-0 transition-all">
            {airlinePartners.map((airline) => (
              <div
                key={airline}
                className="px-4 py-2 rounded-xl bg-surface-2 text-xs sm:text-sm font-extrabold text-foreground tracking-wide border border-border shadow-soft-sm"
              >
                ✈ {airline}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ticketing Partners */}
      {attractionPartners.length > 0 && (
        <div>
          <h3 className="text-center text-xs font-bold uppercase tracking-widest text-foreground-subtle mb-4">
            Official Attraction &amp; Ticketing Partners
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 opacity-85 grayscale hover:grayscale-0 transition-all">
            {attractionPartners.map((ticket) => (
              <div
                key={ticket}
                className="px-3.5 py-1.5 rounded-lg bg-surface text-xs font-semibold text-foreground-muted border border-border shadow-soft-sm"
              >
                🎟 {ticket}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
