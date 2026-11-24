"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import type { SuggestionItem } from "@/app/api/destinations/suggest/route";

export interface DestinationPickerProps {
  value: string;
  onChange: (destination: string, item?: SuggestionItem | null) => void;
  accentColor?: string;
  siteId?: string;
  error?: string;
  className?: string;
}

export default function DestinationPicker({
  value,
  onChange,
  accentColor = "#2882c5",
  siteId = "gujjutours",
  error,
  className = "",
}: DestinationPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [groupedResults, setGroupedResults] = useState<{
    cities: SuggestionItem[];
    hotels: SuggestionItem[];
    popular: SuggestionItem[];
  }>({
    cities: [],
    hotels: [],
    popular: [],
  });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("toursapp_recent_destinations");
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveRecentSearch = (name: string) => {
    try {
      const updated = [name, ...recentSearches.filter((item) => item.toLowerCase() !== name.toLowerCase())].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem("toursapp_recent_destinations", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const removeRecentSearch = (e: React.MouseEvent, target: string) => {
    e.stopPropagation();
    try {
      const updated = recentSearches.filter((item) => item !== target);
      setRecentSearches(updated);
      localStorage.setItem("toursapp_recent_destinations", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Fetch suggestions with debouncing
  const fetchSuggestions = useCallback(
    async (q: string) => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/destinations/suggest?query=${encodeURIComponent(q)}&site=${encodeURIComponent(siteId)}`
        );
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setGroupedResults({
              cities: json.data.cities || [],
              hotels: json.data.hotels || [],
              popular: json.data.popular || [],
            });
          }
        }
      } catch {
        // Fallback gracefully
      } finally {
        setIsLoading(false);
      }
    },
    [siteId]
  );

  useEffect(() => {
    if (!isOpen) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(searchQuery.trim());
    }, 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchQuery, isOpen, fetchSuggestions]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Flatten suggestions for keyboard navigation
  const allCurrentItems = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return groupedResults.popular;
    }
    return [...groupedResults.cities, ...groupedResults.hotels, ...groupedResults.popular];
  }, [searchQuery, groupedResults]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (allCurrentItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < allCurrentItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : allCurrentItems.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < allCurrentItems.length) {
        handleSelectItem(allCurrentItems[focusedIndex]);
      }
    }
  };

  const handleSelectItem = (item: SuggestionItem) => {
    const displayName = item.subtitle ? `${item.name}, ${item.subtitle}` : item.name;
    onChange(displayName, item);
    saveRecentSearch(displayName);
    setIsOpen(false);
  };

  const handleSelectRecent = (recentName: string) => {
    onChange(recentName);
    setIsOpen(false);
  };

  // Substring highlight helper
  const renderHighlightedText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="font-extrabold text-primary underline decoration-primary/40">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const hasResults =
    groupedResults.cities.length > 0 ||
    groupedResults.hotels.length > 0 ||
    groupedResults.popular.length > 0;

  return (
    <div ref={containerRef} className={`relative flex-1 min-w-0 ${className}`}>
      {/* ─── Trigger Button ─── */}
      <button
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Destination or hotel selection"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full min-h-[64px] py-2.5 px-3.5 sm:px-4 rounded-2xl border text-left flex items-center gap-3 transition-all duration-200 active:scale-[0.99] cursor-pointer bg-white dark:bg-neutral-900 ${
          error
            ? "border-red-400 bg-red-50/20 dark:border-red-600 ring-2 ring-red-400/20"
            : isOpen
              ? "border-primary ring-2 ring-primary/20 shadow-sm"
              : "border-neutral-200/90 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-sm"
        }`}
      >
        {/* Leading Icon in tinted circular pill */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
          style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
        </div>

        {/* Text Container */}
        <div className="flex-1 min-w-0">
          <span className="block text-[11px] font-bold tracking-wider uppercase text-neutral-400 dark:text-neutral-500 mb-0.5">
            Destination / Hotel Name
          </span>
          <div className="text-sm sm:text-[15px] font-bold text-neutral-900 dark:text-white truncate">
            {value || <span className="text-neutral-400 font-normal">Where are you going?</span>}
          </div>
        </div>

        {/* Subtle Chevron */}
        <div className="shrink-0 text-neutral-400 dark:text-neutral-500 transition-transform duration-200">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180 text-primary" : ""}`}
          >
            <path
              fillRule="evenodd"
              d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </button>

      {/* Inline Validation Error Message */}
      {error && (
        <span className="text-xs font-semibold text-red-500 dark:text-red-400 mt-1 block px-1 animate-in fade-in">
          {error}
        </span>
      )}

      {/* ─── Bottom Sheet (Mobile) & Floating Popover (Desktop) ─── */}
      {isOpen && (
        <>
          {/* Mobile Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />

          <div
            ref={popoverRef}
            className={`
              fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] bg-white dark:bg-neutral-900 rounded-t-3xl shadow-2xl border-t border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250
              md:absolute md:inset-auto md:top-[calc(100%+8px)] md:left-0 md:w-[480px] md:max-h-[500px] md:rounded-2xl md:border md:shadow-2xl md:slide-in-from-top-2 md:z-50
            `}
          >
            {/* Mobile Sheet Handle */}
            <div className="flex md:hidden items-center justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
            </div>

            {/* Header & Search Bar */}
            <div className="p-3 sm:p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search city, destination or hotel..."
                  className="w-full h-11 pl-10 pr-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm font-semibold text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:ring-2 focus:ring-primary/40 border border-transparent focus:border-primary transition-all"
                />
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                    clipRule="evenodd"
                  />
                </svg>

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 absolute right-2 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white shrink-0 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Results Scroll Body */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-4 max-h-[60vh] md:max-h-[380px]">
              {/* Loading Skeleton */}
              {isLoading && (
                <div className="space-y-2 p-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                      <div className="w-9 h-9 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-4 w-3/5 bg-neutral-200 dark:bg-neutral-800 rounded" />
                        <div className="h-3 w-2/5 bg-neutral-100 dark:bg-neutral-850 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 1. Recent Searches (when no query typed) */}
              {!searchQuery.trim() && recentSearches.length > 0 && !isLoading && (
                <div>
                  <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    <span>Recent Searches</span>
                    <button
                      type="button"
                      onClick={() => {
                        setRecentSearches([]);
                        localStorage.removeItem("toursapp_recent_destinations");
                      }}
                      className="text-[10px] text-neutral-400 hover:text-red-500 lowercase cursor-pointer"
                    >
                      clear all
                    </button>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {recentSearches.map((recent) => (
                      <div
                        key={recent}
                        onClick={() => handleSelectRecent(recent)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/80 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-neutral-400">🕒</span>
                          <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                            {recent}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => removeRecentSearch(e, recent)}
                          className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Group: Cities */}
              {groupedResults.cities.length > 0 && !isLoading && (
                <div>
                  <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
                    <span>🏙️</span>
                    <span>Cities & Destinations</span>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {groupedResults.cities.map((city) => (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => handleSelectItem(city)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/10 dark:hover:bg-neutral-800 cursor-pointer transition-all text-left group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center shrink-0">
                          📍
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                            {renderHighlightedText(city.name, searchQuery)}
                          </div>
                          {city.subtitle && (
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                              {city.subtitle}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Group: Hotels */}
              {groupedResults.hotels.length > 0 && !isLoading && (
                <div>
                  <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
                    <span>🏨</span>
                    <span>Hotels & Resorts</span>
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {groupedResults.hotels.map((hotel) => (
                      <button
                        key={hotel.id}
                        type="button"
                        onClick={() => handleSelectItem(hotel)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/10 dark:hover:bg-neutral-800 cursor-pointer transition-all text-left group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                          🏨
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                            {renderHighlightedText(hotel.name, searchQuery)}
                          </div>
                          {hotel.subtitle && (
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                              {hotel.subtitle}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Group: Popular Destinations */}
              {groupedResults.popular.length > 0 && !isLoading && (
                <div>
                  <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
                    <span>✨</span>
                    <span>Popular Destinations</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {groupedResults.popular.map((pop) => (
                      <button
                        key={pop.id}
                        type="button"
                        onClick={() => handleSelectItem(pop)}
                        className="flex items-center gap-2.5 p-2 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:border-primary/40 hover:bg-primary/5 transition-all text-left cursor-pointer"
                      >
                        {pop.image ? (
                          <img
                            src={pop.image}
                            alt={pop.name}
                            className="w-9 h-9 rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            🌴
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                            {pop.name}
                          </div>
                          <div className="text-[10px] text-neutral-400 truncate">
                            {pop.subtitle}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && searchQuery.trim() && !hasResults && (
                <div className="text-center py-8 px-4">
                  <div className="text-3xl mb-2">🔍</div>
                  <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                    No destinations found for &quot;{searchQuery}&quot;
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Try searching for Dubai, Singapore, Bali, Goa, or popular cities.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
