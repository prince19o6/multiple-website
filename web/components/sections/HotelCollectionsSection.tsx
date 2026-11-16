"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { MergedWebsiteConfig } from "@/lib/mergeWebsiteConfig";

interface HotelCollectionsSectionProps {
  config: MergedWebsiteConfig;
}

interface CollectionItem {
  id: string;
  name: string;
  state: string;
  count: number;
  image: string;
  query: string;
}

const COLLECTIONS: Record<string, { title: string; subtitle: string; items: CollectionItem[] }> = {
  hillStations: {
    title: "Explore India’s Best Hill Station Hotels",
    subtitle: "Boutique chalets, pine forest retreats & mountain luxury",
    items: [
      { id: "manali", name: "Manali", state: "Himachal Pradesh", count: 540, image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=500&q=80", query: "Manali" },
      { id: "shimla", name: "Shimla", state: "Himachal Pradesh", count: 480, image: "https://images.unsplash.com/photo-1597074866923-dc0589150358?w=500&q=80", query: "Shimla" },
      { id: "ooty", name: "Ooty", state: "Tamil Nadu", count: 320, image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=500&q=80", query: "Ooty" },
      { id: "mount-abu", name: "Mount Abu", state: "Rajasthan", count: 190, image: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=500&q=80", query: "Mount Abu" },
      { id: "munnar", name: "Munnar", state: "Kerala", count: 350, image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=500&q=80", query: "Munnar" },
    ],
  },
  pilgrimage: {
    title: "Explore India’s Sacred Pilgrimage Destinations",
    subtitle: "Comfortable spiritual stays near historic temples and ghats",
    items: [
      { id: "ayodhya", name: "Ayodhya", state: "Uttar Pradesh", count: 386, image: "https://images.unsplash.com/photo-1561361066-4191c7847053?w=500&q=80", query: "Ayodhya" },
      { id: "varanasi", name: "Varanasi", state: "Uttar Pradesh", count: 512, image: "https://images.unsplash.com/photo-1561361066-4191c7847053?w=500&q=80", query: "Varanasi" },
      { id: "haridwar", name: "Haridwar & Rishikesh", state: "Uttarakhand", count: 430, image: "https://images.unsplash.com/photo-1600100397608-f010f443b784?w=500&q=80", query: "Haridwar" },
      { id: "shirdi", name: "Shirdi", state: "Maharashtra", count: 280, image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=500&q=80", query: "Shirdi" },
      { id: "dwarka", name: "Dwarka", state: "Gujarat", count: 175, image: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=500&q=80", query: "Dwarka" },
    ],
  },
  iconic: {
    title: "India’s Most Iconic Palace Stays",
    subtitle: "Experience royalty in legendary heritage palaces",
    items: [
      { id: "taj-lake-palace", name: "Taj Lake Palace, Udaipur", state: "Rajasthan", count: 1, image: "https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?w=500&q=80", query: "Udaipur" },
      { id: "rambagh-palace", name: "Rambagh Palace, Jaipur", state: "Rajasthan", count: 1, image: "https://images.unsplash.com/photo-1603262110263-fb010d6e75dc?w=500&q=80", query: "Jaipur" },
      { id: "taj-mahal-tower", name: "Taj Mahal Palace & Tower", state: "Mumbai", count: 1, image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=500&q=80", query: "Mumbai" },
      { id: "grand-hyatt-goa", name: "Grand Hyatt Goa", state: "Goa", count: 1, image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=500&q=80", query: "Goa" },
    ],
  },
};

export default function HotelCollectionsSection({ config: _config }: HotelCollectionsSectionProps) {
  const [activeTab, setActiveTab] = useState<"hillStations" | "pilgrimage" | "iconic">("hillStations");

  const current = COLLECTIONS[activeTab];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-foreground">
      {/* Category Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            {current.title}
          </h2>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1">
            {current.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-surface-2 border border-border rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("hillStations")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "hillStations"
                ? "bg-surface text-foreground shadow-soft-sm font-bold"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            Hill Stations
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pilgrimage")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "pilgrimage"
                ? "bg-surface text-foreground shadow-soft-sm font-bold"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            Pilgrimage
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("iconic")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "iconic"
                ? "bg-surface text-foreground shadow-soft-sm font-bold"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            Iconic Palaces
          </button>
        </div>
      </div>

      {/* Grid of Collection Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {current.items.map((item, idx) => (
          <Link
            key={`${item.id}-${idx}`}
            href={`/en/hotels?destination=${encodeURIComponent(item.query)}`}
            className="group/item relative rounded-xl overflow-hidden shadow-soft-sm hover:shadow-soft-lg transition-all duration-300 h-60 flex flex-col justify-end p-4 border border-border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image}
              alt={item.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

            <div className="relative z-10 text-white">
              <span className="text-[10px] uppercase font-bold text-primary-200 tracking-wider block">
                {item.state}
              </span>
              <h3 className="text-sm sm:text-base font-bold leading-tight drop-shadow mt-0.5">
                {item.name}
              </h3>
              <span className="text-[11px] text-gray-300 block mt-1">
                {item.count} Verified Stays
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
