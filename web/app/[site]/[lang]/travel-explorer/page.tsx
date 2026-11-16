"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSiteConfig } from "@/lib/SiteConfigContext";

interface ExplorerDestination {
  id: string;
  name: string;
  country: string;
  image: string;
  tagline: string;
  bestTimeToVisit: string;
  recommendedDays: string;
  visaType: string;
  style: "beaches" | "adventure" | "family" | "culture";
  highlights: string[];
  packageLink: string;
}

const DESTINATIONS: ExplorerDestination[] = [
  {
    id: "dubai",
    name: "Dubai",
    country: "United Arab Emirates",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
    tagline: "Futuristic skyscrapers, red dune safaris, and ultra-luxury shopping.",
    bestTimeToVisit: "November to April",
    recommendedDays: "5 - 7 Days",
    visaType: "Easy Online eVisa (24-48 hrs)",
    style: "adventure",
    highlights: ["Burj Khalifa 124th/148th Floor", "Red Dune Desert Safari", "Dubai Marina Yacht Cruise", "Museum of the Future"],
    packageLink: "/en/holidays?destination=Dubai",
  },
  {
    id: "bali",
    name: "Bali",
    country: "Indonesia",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
    tagline: "Lush rice terraces, sacred sea temples, and idyllic tropical beach villas.",
    bestTimeToVisit: "April to October",
    recommendedDays: "6 - 8 Days",
    visaType: "Visa on Arrival / Online eVOA",
    style: "beaches",
    highlights: ["Uluwatu Cliff Sunset", "Ubud Monkey Forest & Rice Terraces", "Nusa Penida Kelingking Beach", "Mount Batur Sunrise Trek"],
    packageLink: "/en/holidays?destination=Bali",
  },
  {
    id: "singapore",
    name: "Singapore",
    country: "Singapore",
    image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80",
    tagline: "A garden city of wonder with world-class theme parks and vibrant culinary hubs.",
    bestTimeToVisit: "Year-Round",
    recommendedDays: "4 - 5 Days",
    visaType: "Online eVisa",
    style: "family",
    highlights: ["Gardens by the Bay Supertree Grove", "Universal Studios Singapore", "Sentosa Cable Car", "Marina Bay Sands SkyPark"],
    packageLink: "/en/holidays?destination=Singapore",
  },
  {
    id: "thailand",
    name: "Phuket & Krabi",
    country: "Thailand",
    image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80",
    tagline: "Emerald waters, limestone sea karsts, and lively street night markets.",
    bestTimeToVisit: "November to March",
    recommendedDays: "5 - 7 Days",
    visaType: "Visa Exemption / eVOA",
    style: "beaches",
    highlights: ["Phi Phi Islands Speedboat", "James Bond Island Phang Nga", "Four Island Krabi Sunset Tour", "Big Buddha Viewpoint"],
    packageLink: "/en/holidays?destination=Thailand",
  },
  {
    id: "kashmir",
    name: "Kashmir & Gulmarg",
    country: "India",
    image: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=800&q=80",
    tagline: "Paradise on Earth with snow-capped peaks, Dal Lake shikaras, and pine valleys.",
    bestTimeToVisit: "March to October (Summer) / Dec-Feb (Snow)",
    recommendedDays: "5 - 6 Days",
    visaType: "Domestic (No Visa Required)",
    style: "culture",
    highlights: ["Dal Lake Houseboat Stay", "Gulmarg Gondola Phase 1 & 2", "Pahalgam Betaab Valley", "Sonamarg Thajiwas Glacier"],
    packageLink: "/en/holidays?destination=Kashmir",
  },
  {
    id: "vietnam",
    name: "Da Nang & Hanoi",
    country: "Vietnam",
    image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80",
    tagline: "Golden Hand bridge, emerald limestone bays, and rich historical heritage.",
    bestTimeToVisit: "February to August",
    recommendedDays: "6 - 8 Days",
    visaType: "Online eVisa (3 Days)",
    style: "culture",
    highlights: ["Ba Na Hills Sun World & Golden Bridge", "Hoi An Lantern Ancient Town", "Ha Long Bay Luxury Cruise", "Marble Mountains"],
    packageLink: "/en/holidays?destination=Vietnam",
  },
];

export default function TravelExplorerPage() {
  const config = useSiteConfig();
  const brandName = config.name || "Gujju Tours";

  const [selectedStyle, setSelectedStyle] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const filtered = DESTINATIONS.filter((d) => {
    const matchesStyle = selectedStyle === "all" || d.style === selectedStyle;
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.country.toLowerCase().includes(search.toLowerCase()) ||
      d.tagline.toLowerCase().includes(search.toLowerCase());
    return matchesStyle && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 py-12 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <Link href="/en" className="hover:text-primary-600 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-neutral-800 dark:text-neutral-200 font-semibold">
            Travel Explorer &amp; Destination Guides
          </span>
        </nav>

        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-primary-100 dark:bg-primary-950/80 border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 text-xs font-bold uppercase tracking-wider">
            Destination Inspiration
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
            Explore the World with {brandName}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Compare weather seasons, visa requirements, top must-see highlights, and curated itineraries across our most popular holiday destinations.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
          {/* Style Pills */}
          <div className="flex flex-wrap gap-2 text-xs font-bold justify-center">
            {[
              { id: "all", label: "All Destinations" },
              { id: "beaches", label: "🏝️ Beaches & Islands" },
              { id: "adventure", label: "🏜️ Adventure & Safaris" },
              { id: "family", label: "🎡 Family & Theme Parks" },
              { id: "culture", label: "🏔️ Nature & Heritage" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedStyle(tab.id)}
                className={`px-3.5 py-2 rounded-xl transition-all ${
                  selectedStyle === tab.id
                    ? "bg-primary-600 text-white shadow-sm"
                    : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search destination..."
              className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs outline-none focus:border-primary-500 shadow-sm"
            />
          </div>
        </div>

        {/* Destinations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((dest) => (
            <div
              key={dest.id}
              className="bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
            >
              <div className="relative h-56 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold">
                  📍 {dest.country}
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-xl font-black text-neutral-900 dark:text-white group-hover:text-primary-600 transition-colors">
                    {dest.name}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                    {dest.tagline}
                  </p>

                  <div className="mt-4 space-y-2 text-xs border-t border-neutral-100 dark:border-neutral-800 pt-3">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Best Season:</span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">{dest.bestTimeToVisit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Ideal Trip:</span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">{dest.recommendedDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Visa:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{dest.visaType}</span>
                    </div>
                  </div>

                  {/* Highlights Tags */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {dest.highlights.slice(0, 3).map((h, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[10px] font-medium"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href={dest.packageLink}
                    className="w-full block py-2.5 text-center rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow-sm transition-colors"
                  >
                    View {dest.name} Holiday Packages →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
