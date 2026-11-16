"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import { useSite } from "@/lib/SiteContext";
import { getActualImageUrl } from "@/lib/imageUtils";

interface VisaItem {
  id: number | string;
  visaNumericId?: number;
  visaId?: string;
  country: string;
  countryCode: string;
  countrySlug: string;
  flag: string;
  continent: string;
  title: string;
  name?: string;
  slug: string;
  visaType: string;
  visaTypeLabel: string;
  validity: string;
  stayDuration: string;
  processingTime: string;
  entryType: string;
  fastTrackAvailable: boolean;
  price: number;
  originalPrice?: number;
  currency: string;
  image: string;
  documentsRequired: string[];
  approvalRate: number;
  rating: number;
  reviews: number;
  featured?: boolean;
  overview?: string;
}

const VISA_TYPE_FILTERS = [
  { type: "all", label: "All Visas", icon: "🌐" },
  { type: "tourist", label: "Tourist eVisa", icon: "🏖️" },
  { type: "express", label: "Express (24-48h)", icon: "⚡" },
  { type: "business", label: "Business eVisa", icon: "💼" },
  { type: "multiple-entry", label: "Multiple Entry", icon: "🔄" },
];

const NATIONALITY_OPTIONS = [
  "India",
  "United States",
  "United Kingdom",
  "United Arab Emirates",
  "Canada",
  "Australia",
  "Singapore",
  "Malaysia",
  "Germany",
  "France",
];

export default function VisasPage() {
  const searchParams = useSearchParams();
  const config = useSiteConfig();
  const site = useSite();

  const siteId = site.siteId || "gujjutours";
  const currencySymbol = config.currencySymbol || (siteId === "gujjutours" ? "₹" : "$");

  // Query params
  const initialCountry = searchParams.get("country") || searchParams.get("destination") || "all";
  const initialType = searchParams.get("type") || searchParams.get("visaType") || "all";
  const initialNationality = searchParams.get("nationality") || (siteId === "gujjutours" ? "India" : siteId === "tripgoasia" ? "Singapore" : "United Arab Emirates");
  const initialResident = searchParams.get("livingCountry") || initialNationality;
  const initialSort = searchParams.get("sort") || "popular";

  // State
  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [selectedType, setSelectedType] = useState(initialType);
  const [nationality, setNationality] = useState(initialNationality);
  const [residentCountry, setResidentCountry] = useState(initialResident);
  const [travelDate, setTravelDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [sortBy, setSortBy] = useState(initialSort);

  // Data
  const [visas, setVisas] = useState<VisaItem[]>([]);
  const [countrySummaries, setCountrySummaries] = useState<{ name: string; flag: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch full countries list for dropdown from API
  useEffect(() => {
    let isMounted = true;
    async function loadCountryList() {
      try {
        const res = await fetch(`/api/visas?countries=true&site=${encodeURIComponent(siteId)}`);
        if (res.ok) {
          const json = await res.json();
          if (json?.data && Array.isArray(json.data) && isMounted) {
            const list = json.data.map((c: any) => ({
              name: c.country,
              flag: c.flag || "🌐",
              slug: c.countrySlug,
            }));
            setCountrySummaries(list);
          }
        }
      } catch (err) {
        console.warn("[Visas Page] Could not preload country summaries:", err);
      }
    }
    loadCountryList();
    return () => {
      isMounted = false;
    };
  }, [siteId]);

  // Fetch visas from API
  const fetchVisas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedCountry && selectedCountry !== "all") {
        const cleanCountry = selectedCountry.replace(/\s*\([^)]*\)/g, "").trim();
        params.set("country", cleanCountry);
      }
      if (selectedType && selectedType !== "all") {
        params.set("visaType", selectedType);
      }
      if (sortBy) params.set("sort", sortBy);
      params.set("pageSize", "60");
      params.set("site", siteId);

      const res = await fetch(`/api/visas?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load visa catalog");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setVisas(json.data);
      } else {
        setVisas([]);
      }
    } catch (err: any) {
      console.error("[Visas Page Fetch Error]", err);
      setError(err.message || "Unable to load visas");
    } finally {
      setLoading(false);
    }
  }, [selectedCountry, selectedType, sortBy, siteId]);

  useEffect(() => {
    fetchVisas();
  }, [fetchVisas]);

  // Distinct countries for destination dropdown
  const availableCountries = useMemo(() => {
    const map = new Map<string, { name: string; flag: string; slug: string }>();
    countrySummaries.forEach((c) => {
      if (!map.has(c.slug)) {
        map.set(c.slug, c);
      }
    });
    visas.forEach((v) => {
      if (!map.has(v.countrySlug)) {
        map.set(v.countrySlug, { name: v.country, flag: v.flag, slug: v.countrySlug });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [countrySummaries, visas]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVisas();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* 1. Hero & Search Banner */}
      <section className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800 text-white py-12 px-4 sm:px-6 lg:px-8 shadow-md">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-700/60 text-blue-200 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
            <span>🛡️ Fast-Track Travel Visas</span>
            <span>•</span>
            <span>99.4% Approval Rate</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Apply Online For International Travel Visas
          </h1>
          <p className="mt-2 text-base sm:text-lg text-blue-100 max-w-3xl">
            Hassle-free tourist and business eVisas. Upload your documents in 3 minutes, get expert verification within 2 hours, and receive your visa approval on WhatsApp and Email.
          </p>

          {/* Search Card */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-8 bg-white text-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {/* Destination Country */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Traveling To (Destination)
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">All Available Countries</option>
                {availableCountries.map((c) => (
                  <option key={c.slug} value={c.name}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Passport Nationality */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Citizen Of (Nationality)
              </label>
              <select
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {NATIONALITY_OPTIONS.map((nat) => (
                  <option key={nat} value={nat}>
                    {nat}
                  </option>
                ))}
              </select>
            </div>

            {/* Resident Of */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Resident Of (Living In)
              </label>
              <select
                value={residentCountry}
                onChange={(e) => setResidentCountry(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {NATIONALITY_OPTIONS.map((nat) => (
                  <option key={nat} value={nat}>
                    {nat}
                  </option>
                ))}
              </select>
            </div>

            {/* Travel Date & Submit */}
            <div className="flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Expected Travel Date
                </label>
                <input
                  type="date"
                  value={travelDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <button
                type="submit"
                className="mt-3 w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-2.5 px-4 rounded-xl transition duration-150 shadow-md text-sm"
              >
                Search Visas
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 2. Trust Strip - "What Makes Our Approach Different" */}
      <section className="bg-white border-b border-slate-200 py-6 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-3">
            <div className="text-2xl font-black text-blue-600">99.4%</div>
            <div className="text-xs font-bold text-slate-800 mt-1">Approval Guarantee</div>
            <div className="text-[11px] text-slate-500">Rigorous pre-embassy file screening</div>
          </div>
          <div className="p-3 border-l border-slate-100">
            <div className="text-2xl font-black text-indigo-600">2 Hours</div>
            <div className="text-xs font-bold text-slate-800 mt-1">Pre-Verification</div>
            <div className="text-[11px] text-slate-500">Instant feedback on document quality</div>
          </div>
          <div className="p-3 border-l border-slate-100">
            <div className="text-2xl font-black text-emerald-600">24-48h</div>
            <div className="text-xs font-bold text-slate-800 mt-1">Express Turnaround</div>
            <div className="text-[11px] text-slate-500">Priority embassy dispatch available</div>
          </div>
          <div className="p-3 border-l border-slate-100">
            <div className="text-2xl font-black text-amber-600">100%</div>
            <div className="text-xs font-bold text-slate-800 mt-1">Transparent Pricing</div>
            <div className="text-[11px] text-slate-500">Government fee + service all included</div>
          </div>
        </div>
      </section>

      {/* 3. Main Content: Category Filter Chips + Visa Cards Grid */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Visa Type Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap gap-2">
            {VISA_TYPE_FILTERS.map((cat) => {
              const active = selectedType === cat.type;
              return (
                <button
                  key={cat.type}
                  onClick={() => setSelectedType(cat.type)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                    active
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none"
            >
              <option value="popular">Most Popular</option>
              <option value="price-asc">Lowest Price</option>
              <option value="price-desc">Highest Price</option>
              <option value="rating-desc">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Results Banner */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Showing {visas.length} Available Visa Packages
          </p>
          <span className="text-xs text-slate-500">
            For Citizen of <strong className="text-slate-700">{nationality}</strong>
          </span>
        </div>

        {/* Loading / Error / Empty States */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm animate-pulse h-64" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200 text-center">
            <p className="font-semibold">Unable to load visas</p>
            <p className="text-xs mt-1">{error}</p>
            <button
              onClick={fetchVisas}
              className="mt-3 bg-red-600 text-white text-xs px-4 py-1.5 rounded-lg font-bold"
            >
              Try Again
            </button>
          </div>
        ) : visas.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center">
            <span className="text-4xl">🛂</span>
            <h3 className="mt-3 text-base font-bold text-slate-800">No visas found for this combination</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Try changing the destination country or visa category filters above to view other international clearances.
            </p>
            <button
              onClick={() => {
                setSelectedCountry("all");
                setSelectedType("all");
              }}
              className="mt-4 bg-blue-600 text-white text-xs px-4 py-2 rounded-xl font-bold hover:bg-blue-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visas.map((v, idx) => (
              <article
                key={`${v.slug || v.id}-${idx}`}
                className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition duration-200 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Card Header & Actual Photo Image */}
                  <div className="relative h-48 bg-slate-100 overflow-hidden border-b border-slate-100">
                    <Image
                      src={getActualImageUrl(v.image, {
                        title: v.title,
                        city: v.country,
                        module: "visas",
                        id: v.id || v.slug,
                      })}
                      alt={v.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm flex items-center gap-1.5 z-10">
                      <span>{v.flag}</span>
                      <span>{v.country}</span>
                    </div>

                    {v.fastTrackAvailable && (
                      <div className="absolute top-3 right-3 bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase shadow-sm z-10">
                        ⚡ Fast-Track
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5">
                    <div className="inline-block bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2 py-0.5 rounded mb-2 uppercase tracking-wide">
                      {v.visaTypeLabel}
                    </div>

                    <h2 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                      {v.title}
                    </h2>

                    {/* Quick Specs */}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Stay Duration</span>
                        <strong className="text-slate-800">{v.stayDuration}</strong>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Processing Time</span>
                        <strong className="text-slate-800">{v.processingTime}</strong>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Entry Type</span>
                        <span className="text-slate-800">{v.entryType}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Approval Rate</span>
                        <span className="text-emerald-700 font-bold">{v.approvalRate}%</span>
                      </div>
                    </div>

                    {/* Document count snippet */}
                    <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-500">
                      <span>📄</span>
                      <span>{v.documentsRequired?.length || 4} simple documents required</span>
                    </div>
                  </div>
                </div>

                {/* Footer Strip */}
                <div className="p-4 pt-0">
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">All-Inclusive Fee</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-black text-slate-900">
                          {currencySymbol}{v.price.toLocaleString()}
                        </span>
                        {v.originalPrice && v.originalPrice > v.price && (
                          <span className="text-xs text-slate-400 line-through">
                            {currencySymbol}{v.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/visas/${v.slug}?travelDate=${travelDate}&nationality=${encodeURIComponent(nationality)}&livingCountry=${encodeURIComponent(residentCountry)}`}
                      className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-sm"
                    >
                      Apply Now →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* 4. Simple 4-Step Application Guide */}
        <section className="mt-16 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-2xl font-extrabold text-slate-900">How It Works in 4 Simple Steps</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              No embassy visits, no standing in queues. Complete your visa process 100% online from home.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center p-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-black text-lg flex items-center justify-center mb-3">
                1
              </div>
              <h3 className="text-sm font-bold text-slate-900">Select Visa Type</h3>
              <p className="text-xs text-slate-500 mt-1">Choose your destination and preferred entry type.</p>
            </div>
            <div className="flex flex-col items-center text-center p-3">
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-black text-lg flex items-center justify-center mb-3">
                2
              </div>
              <h3 className="text-sm font-bold text-slate-900">Upload Documents</h3>
              <p className="text-xs text-slate-500 mt-1">Upload clear phone photos of your passport and photograph.</p>
            </div>
            <div className="flex flex-col items-center text-center p-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 font-black text-lg flex items-center justify-center mb-3">
                3
              </div>
              <h3 className="text-sm font-bold text-slate-900">Pre-Screening Check</h3>
              <p className="text-xs text-slate-500 mt-1">Our visa officers inspect every document to prevent rejections.</p>
            </div>
            <div className="flex flex-col items-center text-center p-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 font-black text-lg flex items-center justify-center mb-3">
                4
              </div>
              <h3 className="text-sm font-bold text-slate-900">Receive eVisa PDF</h3>
              <p className="text-xs text-slate-500 mt-1">Approved electronic visa delivered directly to your email.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
