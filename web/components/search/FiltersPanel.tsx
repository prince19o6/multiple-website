"use client";

import React from "react";

export interface SearchFilterState {
  starRatings: number[];
  categories: string[];
  nationality: string;
}

interface FiltersPanelProps {
  filters: SearchFilterState;
  onChange: (filters: SearchFilterState) => void;
  isOpen: boolean;
  onClose: () => void;
}

const PROPERTY_CATEGORIES = [
  "Hotel",
  "Aparthotel",
  "Apartment",
  "Hostel",
  "Villa",
  "Resort",
];

const NATIONALITIES = [
  "Indian",
  "Malaysian",
  "Emirati",
  "American",
  "British",
  "Australian",
  "Singaporean",
  "Thai",
  "Canadian",
];

export default function FiltersPanel({
  filters,
  onChange,
  isOpen,
  onClose,
}: FiltersPanelProps) {
  if (!isOpen) return null;

  const toggleStar = (star: number) => {
    const next = filters.starRatings.includes(star)
      ? filters.starRatings.filter((s) => s !== star)
      : [...filters.starRatings, star];
    onChange({ ...filters, starRatings: next });
  };

  const toggleCategory = (cat: string) => {
    const next = filters.categories.includes(cat)
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat];
    onChange({ ...filters, categories: next });
  };

  const setNationality = (nat: string) => {
    onChange({ ...filters, nationality: nat });
  };

  return (
    <div className="pt-4 mt-3 border-t border-border transition-all text-foreground">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-subtle">
          Refine Search Filters
        </h4>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-primary font-semibold hover:underline"
        >
          Hide Filters ▲
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
        {/* Star Rating Filter */}
        <div>
          <label className="block font-bold text-foreground mb-2">
            Star Rating
          </label>
          <div className="flex flex-wrap gap-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const active = filters.starRatings.includes(star);
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => toggleStar(star)}
                  className={`px-3 py-1.5 rounded-lg border flex items-center gap-1 font-semibold transition-all ${
                    active
                      ? "border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                      : "border-border hover:border-border-strong text-foreground bg-surface hover:bg-surface-2"
                  }`}
                >
                  <span>{star}</span>
                  <span className="text-amber-400">★</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Property Category Filter */}
        <div>
          <label className="block font-bold text-foreground mb-2">
            Property Category
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PROPERTY_CATEGORIES.map((cat) => {
              const active = filters.categories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-all ${
                    active
                      ? "border-primary bg-primary-light text-primary font-bold"
                      : "border-border hover:border-border-strong text-foreground bg-surface hover:bg-surface-2"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Traveller Nationality */}
        <div>
          <label className="block font-bold text-foreground mb-2">
            Traveller Nationality
          </label>
          <select
            value={filters.nationality}
            onChange={(e) => setNationality(e.target.value)}
            className="w-full px-3 py-1.5 bg-surface-2 border border-border rounded-lg text-xs font-semibold text-foreground outline-none focus:border-primary"
          >
            {NATIONALITIES.map((nat) => (
              <option key={nat} value={nat} className="bg-surface text-foreground">
                {nat}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-foreground-subtle mt-1">
            Required for local tourism tax &amp; visa compliance
          </p>
        </div>
      </div>
    </div>
  );
}
