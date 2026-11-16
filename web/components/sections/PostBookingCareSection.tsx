"use client";

import React, { useState } from "react";
import type { MergedWebsiteConfig } from "@/lib/mergeWebsiteConfig";

interface PostBookingCareSectionProps {
  config: MergedWebsiteConfig;
}

export default function PostBookingCareSection({ config }: PostBookingCareSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const brandName = config.site?.name || "Our";
  const careItems = (config as any)?.content?.care || (config as any)?.careItems || [
    {
      icon: "🛡️",
      title: "Dedicated 24/7 Travel Concierge",
      summary: "A human trip manager assigned directly to your booking for itinerary tweaks, flight delays, and instant hotel coordination.",
      detail: "Unlike automated aggregators where you wait in phone queues, our verified travel specialists connect directly with hotel front desks to ensure check-in smoothness, dietary accommodations, and immediate support.",
    },
    {
      icon: "🏨",
      title: "Pre-Arrival Room Verification & Upgrades",
      summary: "We re-confirm your room booking 24 hours prior with the hotel general manager to guarantee non-smoking, high-floor, or interconnecting room requests.",
      detail: "Every reservation includes complimentary room inspection advocacy. If the property overbooks or assigns a substandard room, our team steps in with instant tier upgrades at zero extra charge.",
    },
    {
      icon: "🚗",
      title: "Chauffeur & On-Ground Ground Sync",
      summary: "Synchronized airport transfers with live flight tracking so your driver is already at arrivals when your wheels touch down.",
      detail: "Real-time airport coordination removes anxiety in international destinations. Chauffeur details and emergency standby vehicles are verified 3 hours prior to landing.",
    },
    {
      icon: "⚡",
      title: "Zero-Stress Cancellation & Rescheduling",
      summary: "Clear, transparent refund policies with fast-track processing and credit rollover options.",
      detail: "Emergencies happen. Our team processes legitimate reschedule requests without inflated supplier penalties, keeping your holiday investment completely safe.",
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-foreground">
      <div className="bg-surface-2 rounded-3xl p-6 sm:p-10 shadow-soft-sm border border-border">
        <div className="max-w-3xl mb-8">
          <span className="inline-block px-3 py-1 rounded-full bg-primary-light text-primary text-[11px] font-bold uppercase tracking-widest border border-primary/20 mb-3">
            The {brandName} Difference
          </span>
          <h2 className="text-xl sm:text-3xl font-black text-foreground tracking-tight leading-tight">
            How is post-booking care different from a basic hotel booking?
          </h2>
          <p className="text-xs sm:text-sm text-foreground-muted mt-2 leading-relaxed">
            Most travel websites leave you at confirmation. We accompany every step of your stay with verified on-ground support and human oversight.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {careItems.map((item: any, idx: number) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={item.title}
                className="rounded-2xl bg-surface border border-border p-5 transition-all shadow-soft-sm"
              >
                <div
                  className="flex items-start justify-between cursor-pointer gap-3"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-2 rounded-xl bg-surface-2 border border-border/80">
                      {item.icon}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-foreground">
                      {item.title}
                    </h3>
                  </div>
                  <span className="text-foreground-muted text-base font-bold">
                    {isOpen ? "−" : "+"}
                  </span>
                </div>

                <p className="text-xs text-foreground-muted mt-3 leading-relaxed">
                  {item.summary}
                </p>

                {isOpen && item.detail && (
                  <div className="mt-3 pt-3 border-t border-border/60 text-xs text-foreground/80 leading-relaxed bg-surface-2/50 p-3 rounded-xl">
                    {item.detail}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
