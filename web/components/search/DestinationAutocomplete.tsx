"use client";

import React, { useState, useEffect, useRef } from "react";

export interface DestinationSuggestion {
  id: string;
  name: string;
  country?: string;
  image?: string;
  count?: number;
}

const DEFAULT_SUGGESTIONS: DestinationSuggestion[] = [
  { id: "dubai", name: "Dubai", country: "United Arab Emirates", count: 4684, image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=150&q=80" },
  { id: "goa", name: "Goa", country: "India", count: 2750, image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=150&q=80" },
  { id: "bangkok", name: "Bangkok", country: "Thailand", count: 2663, image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=150&q=80" },
  { id: "pattaya", name: "Pattaya", country: "Thailand", count: 1524, image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=150&q=80" },
  { id: "singapore", name: "Singapore", country: "Singapore", count: 709, image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=150&q=80" },
  { id: "manali", name: "Manali", country: "Himachal Pradesh, India", count: 540, image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=150&q=80" },
  { id: "jaipur", name: "Jaipur", country: "Rajasthan, India", count: 1117, image: "https://images.unsplash.com/photo-1603262110263-fb010d6e75dc?w=150&q=80" },
  { id: "udaipur", name: "Udaipur", country: "Rajasthan, India", count: 816, image: "https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?w=150&q=80" },
  { id: "kashmir", name: "Srinagar & Kashmir", country: "India", count: 420, image: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=150&q=80" },
  { id: "ayodhya", name: "Ayodhya", country: "Uttar Pradesh, India", count: 386, image: "https://images.unsplash.com/photo-1561361066-4191c7847053?w=150&q=80" },
];

interface DestinationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  siteId?: string;
}

export default function DestinationAutocomplete({
  value,
  onChange,
  label = "DESTINATION / HOTEL",
  placeholder = "City, Landmark or Hotel name",
  siteId,
}: DestinationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<DestinationSuggestion[]>(DEFAULT_SUGGESTIONS);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadDestinations = async () => {
      try {
        const res = await fetch(`/api/destinations?site=${encodeURIComponent(siteId || "gujjutours")}`);
        if (!res.ok) return;
        const json = await res.json();
        const data = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        if (data.length > 0) {
          const mapped: DestinationSuggestion[] = data.map((d: any) => ({
            id: String(d.id || d.name).toLowerCase(),
            name: String(d.name || d.title),
            country: d.country ? String(d.country) : undefined,
            count: Number(d.tours || d.hotelCount || 10),
            image: d.image ? String(d.image) : undefined,
          }));
          setSuggestions([...mapped, ...DEFAULT_SUGGESTIONS]);
        }
      } catch {
        // Fallback to DEFAULT_SUGGESTIONS
      }
    };

    loadDestinations();
  }, [siteId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = suggestions.filter((s) =>
    s.name.toLowerCase().includes((value || "").toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown") setIsOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0 && filtered[activeIndex]) {
      e.preventDefault();
      onChange(filtered[activeIndex].name);
      setIsOpen(false);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <div className="flex items-center gap-3 px-3.5 py-2.5 bg-[#f8f9fa] dark:bg-neutral-800/80 rounded-xl border border-gray-200 dark:border-neutral-700 hover:border-primary transition-colors min-h-[58px]">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="w-5 h-5 text-gray-400 dark:text-gray-500 shrink-0"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
          />
        </svg>

        <div className="flex-1 overflow-hidden">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {label}
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setIsOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full bg-transparent text-sm font-bold text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 truncate"
          />
        </div>

        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full transition-colors"
            aria-label="Clear destination"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full sm:w-80 max-w-[calc(100vw-2.5rem)] bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-gray-200 dark:border-neutral-700 py-2 z-50 max-h-72 overflow-y-auto">
          <div className="px-3 py-1 text-[11px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider">
            Popular Destinations
          </div>

          {filtered.length === 0 ? (
            <div className="px-3 py-3 text-xs text-gray-500 dark:text-gray-400 text-center">
              No matching destinations found.
            </div>
          ) : (
            filtered.map((item, index) => (
              <button
                key={item.id + index}
                type="button"
                onClick={() => {
                  onChange(item.name);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors ${
                  activeIndex === index
                    ? "bg-orange-50 dark:bg-neutral-700 text-orange-600 dark:text-orange-400"
                    : "hover:bg-gray-50 dark:hover:bg-neutral-700/60 text-gray-800 dark:text-gray-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-8 h-8 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-neutral-700 flex items-center justify-center shrink-0 text-gray-500">
                      📍
                    </div>
                  )}
                  <div>
                    <div className="text-xs sm:text-sm font-bold">{item.name}</div>
                    {item.country && (
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">{item.country}</div>
                    )}
                  </div>
                </div>

                {item.count && (
                  <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full bg-orange-100 dark:bg-neutral-700">
                    {item.count} Stays
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
