"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId?: string;
  primaryColor?: string;
}

interface SearchItem {
  id: string;
  title: string;
  category: "tour" | "hotel" | "package";
  subtitle?: string;
  price?: number;
  image?: string;
  url: string;
}

const POPULAR_SEARCHES = [
  "Dubai Desert Safari",
  "Burj Khalifa",
  "Luxury Beach Resort Goa",
  "Bali Family Vacation",
  "Singapore City Tour",
  "Thailand Island Cruise",
];

export default function GlobalSearchModal({
  isOpen,
  onClose,
  siteId = "gujjutours",
  primaryColor = "#2882c5",
}: GlobalSearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "tours" | "hotels" | "packages">("all");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setResults([]);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  // Live search debounce
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const promises: Promise<any>[] = [];

        // 1. Tours
        if (activeTab === "all" || activeTab === "tours") {
          promises.push(
            fetch(`/api/tours?site=${encodeURIComponent(siteId)}&search=${encodeURIComponent(trimmed)}&limit=6`)
              .then((r) => (r.ok ? r.json() : null))
              .then((json) => {
                const list = Array.isArray(json?.data) ? json.data : [];
                return list.map((t: any): SearchItem => ({
                  id: String(t.id || t.slug),
                  title: t.name || t.title || "Tour",
                  category: "tour",
                  subtitle: t.destination || t.city || t.location || "Sightseeing",
                  price: t.price,
                  image: t.image || t.coverImage,
                  url: `/en/tours/${t.slug || t.id}`,
                }));
              })
              .catch(() => [])
          );
        }

        // 2. Hotels
        if (activeTab === "all" || activeTab === "hotels") {
          promises.push(
            fetch(`/api/hotels?site=${encodeURIComponent(siteId)}&destination=${encodeURIComponent(trimmed)}&limit=6`)
              .then((r) => (r.ok ? r.json() : null))
              .then((json) => {
                const list = Array.isArray(json?.data) ? json.data : [];
                return list.map((h: any): SearchItem => ({
                  id: String(h.id || h.slug),
                  title: h.title || "Hotel",
                  category: "hotel",
                  subtitle: `${h.destination?.cityName || ""}${h.destination?.country ? `, ${h.destination.country}` : ""}` || "Hotel Stay",
                  price: h.pricePerNight,
                  image: h.coverImage || (Array.isArray(h.images) ? h.images[0] : undefined),
                  url: `/en/hotels/${h.slug || h.id}`,
                }));
              })
              .catch(() => [])
          );
        }

        // 3. Packages
        if (activeTab === "all" || activeTab === "packages") {
          promises.push(
            fetch(`/api/packages?site=${encodeURIComponent(siteId)}&destination=${encodeURIComponent(trimmed)}&limit=6`)
              .then((r) => (r.ok ? r.json() : null))
              .then((json) => {
                const list = Array.isArray(json?.data) ? json.data : [];
                return list.map((p: any): SearchItem => ({
                  id: String(p.id || p.slug),
                  title: p.title || p.name || "Holiday Package",
                  category: "package",
                  subtitle: `${p.durationDays ? `${p.durationDays}D` : ""}${p.durationNights ? `/${p.durationNights}N` : ""} - ${p.destination || p.city || "Multi-City"}`,
                  price: p.startingPrice || p.price,
                  image: p.coverImage || (Array.isArray(p.images) ? p.images[0] : undefined),
                  url: `/en/packages/${p.slug || p.id}`,
                }));
              })
              .catch(() => [])
          );
        }

        const combined = (await Promise.all(promises)).flat();
        setResults(combined);
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, activeTab, siteId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    onClose();

    if (activeTab === "hotels") {
      router.push(`/en/hotels?destination=${encodeURIComponent(trimmed)}`);
    } else if (activeTab === "packages") {
      router.push(`/en/packages?destination=${encodeURIComponent(trimmed)}`);
    } else {
      router.push(`/en/tours?search=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleSelectPopular = (term: string) => {
    setQuery(term);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click dismiss */}
      <div className="fixed inset-0 -z-10" onClick={onClose} aria-hidden="true" />

      {/* Search Modal Card */}
      <div
        className="w-full max-w-2xl bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-label="Search"
      >
        {/* Search Header Bar */}
        <form onSubmit={handleSubmit} className="relative flex items-center px-4 py-3.5 border-b border-border bg-surface-2">
          {/* Magnifying Glass Icon */}
          <svg
            className="w-5 h-5 text-foreground-muted shrink-0 mr-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          {/* Search Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tours, hotels, packages, destinations..."
            className="flex-1 bg-transparent text-foreground placeholder:text-foreground-muted text-base sm:text-lg font-medium outline-none"
          />

          {/* Clear Button */}
          {query.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="p-1 rounded-full text-foreground-muted hover:text-foreground hover:bg-surface transition-colors mr-2 cursor-pointer"
              aria-label="Clear search"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Close button / ESC tag */}
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-bold text-foreground-muted hover:text-foreground bg-surface rounded-lg border border-border transition-colors cursor-pointer"
          >
            ESC
          </button>
        </form>

        {/* Filter Category Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border bg-surface overflow-x-auto">
          {(
            [
              { id: "all", label: "All Results", icon: "✨" },
              { id: "tours", label: "Tours & Sightseeing", icon: "🌴" },
              { id: "hotels", label: "Hotels & Stays", icon: "🏨" },
              { id: "packages", label: "Holidays", icon: "🎒" },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "text-white shadow-soft-sm"
                    : "text-foreground-muted hover:text-foreground hover:bg-surface-2"
                }`}
                style={isActive ? { backgroundColor: primaryColor } : {}}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-center justify-center py-8 text-foreground-muted gap-2">
              <svg className="w-5 h-5 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-sm font-semibold">Searching verified travel inventory...</span>
            </div>
          )}

          {/* Results List */}
          {!loading && results.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-foreground-muted px-1">
                <span>FOUND {results.length} RESULTS</span>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="text-primary hover:underline font-bold"
                >
                  View all in catalogue &rarr;
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {results.map((item) => (
                  <Link
                    key={`${item.category}-${item.id}`}
                    href={item.url}
                    onClick={onClose}
                    className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-surface-2 transition-all border border-transparent hover:border-border group"
                  >
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-14 h-14 rounded-xl object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-surface-2 flex items-center justify-center text-xl shrink-0">
                        {item.category === "tour" ? "🌴" : item.category === "hotel" ? "🏨" : "🎒"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                            item.category === "tour"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              : item.category === "hotel"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                          }`}
                        >
                          {item.category}
                        </span>
                        <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {item.title}
                        </p>
                      </div>
                      {item.subtitle && (
                        <p className="text-xs text-foreground-muted truncate">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                    {item.price !== undefined && (
                      <div className="text-right shrink-0">
                        <span className="text-xs text-foreground-muted block">from</span>
                        <span className="text-sm font-extrabold text-foreground">
                          ₹{item.price.toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* No results state */}
          {!loading && query.trim().length > 0 && results.length === 0 && (
            <div className="text-center py-8 px-4">
              <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center mx-auto mb-3 text-2xl">
                🔍
              </div>
              <p className="text-base font-bold text-foreground mb-1">
                No matching results for &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-foreground-muted mb-4 max-w-sm mx-auto">
                Try searching for broader keywords like Dubai, Desert, Luxury Hotel, or Beach.
              </p>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-soft-sm cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                Browse All Catalogue
              </button>
            </div>
          )}

          {/* Initial State: Popular Searches & Suggestions */}
          {!loading && !query.trim() && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-foreground-muted mb-2 px-1">
                Trending &amp; Popular Destinations
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleSelectPopular(term)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-border text-foreground text-xs font-semibold transition-colors cursor-pointer border border-border"
                  >
                    <svg className="w-3.5 h-3.5 text-foreground-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer / Shortcut info */}
        <div className="px-4 py-2.5 bg-surface-2 border-t border-border flex items-center justify-between text-[11px] text-foreground-muted">
          <span>Press <strong>Enter</strong> to browse full results</span>
          <span>Press <strong>ESC</strong> to exit</span>
        </div>
      </div>
    </div>
  );
}
