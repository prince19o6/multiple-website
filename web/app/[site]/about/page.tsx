"use client";

import Link from "next/link";
import { useSiteConfig } from "@/lib/SiteConfigContext";

export default function AboutPage() {
  const config = useSiteConfig();
  const theme = config?.theme;
  const primary = theme?.primary || "#2563eb";
  const siteName = config?.name || "Travel Platform";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Hero Section */}
      <section
        className="text-white py-20 px-4 sm:px-6 lg:px-8"
        style={{
          background: `linear-gradient(135deg, ${primary} 0%, #0f172a 100%)`,
        }}
      >
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <span className="inline-block px-3 py-1 text-xs font-bold tracking-wider uppercase bg-white/10 backdrop-blur-md rounded-full border border-white/20">
            About Our Journeys
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Discover {siteName}
          </h1>
          <p className="text-lg sm:text-xl text-slate-200 max-w-2xl mx-auto font-medium">
            Connecting passionate explorers with authentic, unforgettable guided travel experiences worldwide.
          </p>
        </div>
      </section>

      {/* Story & Mission */}
      <section className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Crafted For Those Who Seek More Than Just Sightseeing
            </h2>
            <p className="text-slate-600 leading-relaxed">
              At {siteName}, we believe that travel has the power to transform. We curate expeditions and bespoke itineraries that take you beyond conventional tourist tracks into deep cultural immersions, breathtaking landscapes, and personalized adventures.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Every package is vetted for safety, certified local guides, authentic culinary experiences, and sustainable tourism practices that protect local communities.
            </p>
            <div className="pt-2">
              <Link
                href="/explore"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-white font-semibold shadow-md transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: primary }}
              >
                Explore Curated Tours
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-3xl font-extrabold" style={{ color: primary }}>
                500+
              </span>
              <h3 className="font-bold text-slate-900 text-sm">Destinations</h3>
              <p className="text-xs text-slate-500">Curated locations across continents</p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-3xl font-extrabold" style={{ color: primary }}>
                99%
              </span>
              <h3 className="font-bold text-slate-900 text-sm">Satisfaction</h3>
              <p className="text-xs text-slate-500">Verified traveler satisfaction rate</p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-3xl font-extrabold" style={{ color: primary }}>
                24/7
              </span>
              <h3 className="font-bold text-slate-900 text-sm">Concierge</h3>
              <p className="text-xs text-slate-500">Round-the-clock support on all bookings</p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-3xl font-extrabold" style={{ color: primary }}>
                100%
              </span>
              <h3 className="font-bold text-slate-900 text-sm">Verified</h3>
              <p className="text-xs text-slate-500">Licensed guides and secure payments</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
