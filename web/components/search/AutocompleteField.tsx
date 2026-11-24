"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

export interface SuggestionItem {
  id: string;
  name: string;
  type?: string;
  subtitle?: string;
  code?: string;
  city?: string;
  country?: string;
  image?: string;
  count?: number;
}

export interface AutocompleteFieldProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (val: string, item?: SuggestionItem) => void;
  type?: "hotel" | "tour" | "airport" | "city" | "all";
  siteId?: string;
  icon?: React.ReactNode;
  className?: string;
  required?: boolean;
  error?: string;
}

const DEFAULT_POPULAR: Record<string, SuggestionItem[]> = {
  hotel: [
    { id: "h1", name: "Dubai", subtitle: "United Arab Emirates", city: "Dubai", country: "UAE", type: "hotel", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=150&q=80" },
    { id: "h2", name: "Jaipur", subtitle: "Rajasthan, India", city: "Jaipur", country: "India", type: "hotel", image: "https://images.unsplash.com/photo-1603262110263-fb010d6e75dc?w=150&q=80" },
    { id: "h3", name: "Goa", subtitle: "India", city: "Goa", country: "India", type: "hotel", image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=150&q=80" },
    { id: "h4", name: "Bangkok", subtitle: "Thailand", city: "Bangkok", country: "Thailand", type: "hotel", image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=150&q=80" },
    { id: "h5", name: "Singapore", subtitle: "Singapore", city: "Singapore", country: "Singapore", type: "hotel", image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=150&q=80" },
  ],
  tour: [
    { id: "t1", name: "Dubai Desert Safari & BBQ Dinner", subtitle: "Dubai, UAE", city: "Dubai", country: "UAE", type: "tour", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=150&q=80" },
    { id: "t2", name: "Burj Khalifa At The Top 124th Floor", subtitle: "Dubai, UAE", city: "Dubai", country: "UAE", type: "tour", image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=150&q=80" },
    { id: "t3", name: "Marina Dhow Cruise with Dinner", subtitle: "Dubai, UAE", city: "Dubai", country: "UAE", type: "tour", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150&q=80" },
    { id: "t4", name: "Bali Nusa Penida Island Speedboat Tour", subtitle: "Bali, Indonesia", city: "Bali", country: "Indonesia", type: "tour", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=150&q=80" },
    { id: "t5", name: "Singapore Gardens by the Bay & Marina Bay Sands", subtitle: "Singapore", city: "Singapore", country: "Singapore", type: "tour", image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=150&q=80" },
  ],
  airport: [
    { id: "STV", code: "STV", name: "Surat (STV)", subtitle: "Surat Gujarat Airport, India", city: "Surat", country: "India", type: "airport" },
    { id: "BOM", code: "BOM", name: "Mumbai (BOM)", subtitle: "Chhatrapati Shivaji Maharaj Intl, India", city: "Mumbai", country: "India", type: "airport" },
    { id: "DEL", code: "DEL", name: "Delhi (DEL)", subtitle: "Indira Gandhi International, India", city: "Delhi", country: "India", type: "airport" },
    { id: "AMD", code: "AMD", name: "Ahmedabad (AMD)", subtitle: "Sardar Vallabhbhai Patel Intl, India", city: "Ahmedabad", country: "India", type: "airport" },
    { id: "DXB", code: "DXB", name: "Dubai (DXB)", subtitle: "Dubai International Airport, UAE", city: "Dubai", country: "UAE", type: "airport" },
    { id: "BLR", code: "BLR", name: "Bengaluru (BLR)", subtitle: "Kempegowda International, India", city: "Bengaluru", country: "India", type: "airport" },
    { id: "SIN", code: "SIN", name: "Singapore (SIN)", subtitle: "Changi Airport, Singapore", city: "Singapore", country: "Singapore", type: "airport" },
    { id: "BKK", code: "BKK", name: "Bangkok (BKK)", subtitle: "Suvarnabhumi Airport, Thailand", city: "Bangkok", country: "Thailand", type: "airport" },
  ],
  city: [
    { id: "c1", name: "Dubai, United Arab Emirates", subtitle: "Middle East", city: "Dubai", country: "UAE", type: "city", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=150&q=80" },
    { id: "c2", name: "Goa, India", subtitle: "Beaches & Nightlife", city: "Goa", country: "India", type: "city", image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=150&q=80" },
    { id: "c3", name: "Bali, Indonesia", subtitle: "Tropical Paradise", city: "Bali", country: "Indonesia", type: "city", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=150&q=80" },
    { id: "c4", name: "Singapore", subtitle: "City in Nature", city: "Singapore", country: "Singapore", type: "city", image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=150&q=80" },
    { id: "c5", name: "Bangkok, Thailand", subtitle: "Temples & Street Food", city: "Bangkok", country: "Thailand", type: "city", image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=150&q=80" },
    { id: "c6", name: "Kashmir & Srinagar, India", subtitle: "Paradise on Earth", city: "Srinagar", country: "India", type: "city", image: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=150&q=80" },
  ],
};

export default function AutocompleteField({
  label,
  placeholder = "Search destination, hotel or city",
  value,
  onChange,
  type = "city",
  siteId = "gujjutours",
  icon,
  className = "",
  required = false,
  error,
}: AutocompleteFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 320,
  });

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(`recent_search_${type}`);
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 4));
      }
    } catch { }
  }, [type]);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const updatePopoverCoords = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const popoverWidth = Math.max(rect.width, 320);
      let left = rect.left;
      if (left + popoverWidth > window.innerWidth - 12) {
        left = window.innerWidth - popoverWidth - 12;
      }
      setCoords({
        top: rect.bottom + window.scrollY + 6,
        left: Math.max(12, left),
        width: Math.min(popoverWidth, window.innerWidth - 24),
      });
    }
  }, []);

  // Fetch suggestions with 300ms debounce
  const fetchSuggestions = useCallback(
    async (q: string) => {
      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(
          `${apiUrl}/api/core/v1/search/suggest?type=${type}&q=${encodeURIComponent(q)}&site=${encodeURIComponent(siteId)}&limit=8`,
          {
            headers: {
              "X-Website-Hostname": typeof window !== "undefined" ? window.location.hostname : "www.gujjutours.com",
            },
          }
        );

        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json?.data) && json.data.length > 0) {
            setSuggestions(json.data);
            setLoading(false);
            return;
          }
        }
      } catch {
        // Fallback to local default dataset
      }

      // Local fallback
      const list = DEFAULT_POPULAR[type] || DEFAULT_POPULAR.city;
      const clean = q.trim().toLowerCase();
      if (!clean) {
        setSuggestions(list);
      } else {
        const filtered = list.filter(
          (item) =>
            item.name.toLowerCase().includes(clean) ||
            item.subtitle?.toLowerCase().includes(clean) ||
            item.code?.toLowerCase().includes(clean) ||
            item.country?.toLowerCase().includes(clean)
        );
        setSuggestions(filtered.length > 0 ? filtered : list);
      }
      setLoading(false);
    },
    [type, siteId]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setQuery(text);
    onChange(text);
    setIsOpen(true);
    setActiveIndex(-1);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 300);
  };

  const handleSelect = (item: SuggestionItem) => {
    setQuery(item.name);
    onChange(item.name, item);
    setIsOpen(false);

    // Save to recent searches
    try {
      const updated = [item.name, ...recentSearches.filter((s) => s !== item.name)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem(`recent_search_${type}`, JSON.stringify(updated));
    } catch { }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuery("");
    onChange("");
    inputRef.current?.focus();
    fetchSuggestions("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        updatePopoverCoords();
        fetchSuggestions(query);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0 && suggestions[activeIndex]) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleFocus = () => {
    setIsOpen(true);
    updatePopoverCoords();
    fetchSuggestions(query);
  };

  return (
    <div ref={containerRef} className={`relative flex-1 ${className}`}>
      <div
        className={`flex items-center gap-2.5 px-3.5 py-2.5 bg-[#f8f9fa] dark:bg-neutral-800/80 rounded-xl border transition-colors min-h-[58px] ${
          error
            ? "border-red-500 bg-red-50/20"
            : isOpen
            ? "border-primary ring-1 ring-primary/20"
            : "border-gray-200 dark:border-neutral-700 hover:border-primary"
        }`}
      >
        <span className="text-gray-400 dark:text-gray-500 shrink-0">
          {icon || (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
          )}
        </span>

        <div className="flex-1 overflow-hidden">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full bg-transparent font-bold text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none truncate"
          />
        </div>

        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear field"
            className="w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
          >
            ×
          </button>
        )}
      </div>

      {error && <span className="text-[11px] text-red-500 font-semibold mt-1 block px-1">{error}</span>}

      {/* Popover Suggestions Dropdown rendered in Portal */}
      {isOpen &&
        mounted &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: "absolute",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 9999,
            }}
            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-800 p-2 text-gray-900 dark:text-white max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Recent Searches Header */}
            {!query && recentSearches.length > 0 && (
              <div className="px-2 py-1.5 mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center justify-between">
                <span>Recent Searches</span>
              </div>
            )}

            {!query &&
              recentSearches.map((item, idx) => (
                <button
                  key={`recent-${idx}`}
                  type="button"
                  onClick={() => handleSelect({ id: `recent-${idx}`, name: item, type })}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                >
                  <span className="text-gray-400 text-xs">🕒</span>
                  <span className="truncate">{item}</span>
                </button>
              ))}

            {/* Suggestions Header */}
            <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center justify-between">
              <span>{loading ? "Searching..." : "Suggestions"}</span>
              {suggestions.length > 0 && <span className="text-[9px]">{suggestions.length} items</span>}
            </div>

            {/* Suggestions List */}
            {suggestions.map((item, idx) => {
              const isFocused = idx === activeIndex;
              return (
                <button
                  key={`${item.id}-${idx}`}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className={`w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-colors ${
                    isFocused
                      ? "bg-primary/10 text-primary dark:text-sky-300 font-bold"
                      : "hover:bg-gray-50 dark:hover:bg-neutral-800/80 text-gray-800 dark:text-gray-100"
                  }`}
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-9 h-9 rounded-lg object-cover shrink-0 border border-gray-100 dark:border-neutral-700"
                    />
                  ) : item.code ? (
                    <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-neutral-800 flex flex-col items-center justify-center font-black text-xs text-primary shrink-0">
                      {item.code}
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-400 shrink-0">
                      📍
                    </div>
                  )}

                  <div className="flex-1 overflow-hidden">
                    <div className="text-xs font-bold truncate">{item.name}</div>
                    {item.subtitle && (
                      <div className="text-[10px] text-gray-400 dark:text-gray-400 truncate">
                        {item.subtitle}
                      </div>
                    )}
                  </div>

                  {item.count && (
                    <span className="text-[10px] font-bold text-gray-400 shrink-0">
                      {item.count} {type === "hotel" ? "★" : "tours"}
                    </span>
                  )}
                </button>
              );
            })}

            {suggestions.length === 0 && !loading && (
              <div className="p-4 text-center text-xs text-gray-400">
                No suggestions found for &quot;{query}&quot;
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
