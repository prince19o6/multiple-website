"use client";

// Holiday Paradise (website3) tour card — elegant editorial layout driven
// by website3.js's `tourCard` config (layout: "luxury", small radius,
// image-zoom hover, "Reserve Package" button, $ currency, gold badge).
// Deliberately quiet and refined next to Adventure World's bold overlay
// card and the plain default TourCard.

type LuxuryTourCardProps = {
  id: number;
  name: string;
  description: string;
  price: number;
  rating: number;
  image: string;
  duration: string;
  location?: string;
  onBook: () => void;
  tourCardConfig?: {
    bookButtonText?: string;
    pricePrefix?: string;
    currency?: string;
    badge?: { enabled?: boolean; text?: string };
  };
  theme?: {
    primary?: string;
    accent?: string;
    heading?: string;
    mutedText?: string;
    border?: string;
    surface?: string;
  };
  headingFontFamily?: string;
};

export default function LuxuryTourCard({
  name,
  description,
  price,
  rating,
  image,
  duration,
  location,
  onBook,
  tourCardConfig = {},
  theme = {},
  headingFontFamily,
}: LuxuryTourCardProps) {
  const badgeEnabled = tourCardConfig.badge?.enabled !== false;
  const badgeText = tourCardConfig.badge?.text || "Luxury Escape";
  const bookText = tourCardConfig.bookButtonText || "Reserve Package";
  const pricePrefix = tourCardConfig.pricePrefix || "Package from";
  const currency = tourCardConfig.currency || "$";
  const primary = theme.primary || "#dc2626";
  const accent = theme.accent || "#d4af37";
  const heading = theme.heading || "#27120f";
  const mutedText = theme.mutedText || "#71717a";
  const border = theme.border || "#e4d4cf";
  const surface = theme.surface || "#ffffff";

  return (
    <div
      className="group overflow-hidden border transition-shadow hover:shadow-xl"
      style={{ borderColor: border, backgroundColor: surface }}
    >
      {/* Image with a small gold badge, no gradient — quiet by design */}
      <div className="relative h-[280px] overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        {badgeEnabled && (
          <span
            className="absolute top-4 left-4 px-3 py-1 text-[11px] tracking-widest uppercase font-semibold text-white"
            style={{ backgroundColor: accent }}
          >
            {badgeText}
          </span>
        )}
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          {location ? (
            <span className="text-xs tracking-wide uppercase" style={{ color: mutedText }}>
              📍 {location}
            </span>
          ) : (
            <span />
          )}
          <span className="text-xs font-semibold" style={{ color: accent }}>
            ★ {rating}
          </span>
        </div>

        <h3
          className="text-2xl mb-2 leading-snug"
          style={{ color: heading, fontFamily: headingFontFamily || "Georgia, serif" }}
        >
          {name}
        </h3>

        <p className="text-sm mb-4 leading-relaxed" style={{ color: mutedText }}>
          {description}
        </p>

        <div className="flex items-center justify-between text-xs mb-5 pb-5 border-b" style={{ borderColor: border, color: mutedText }}>
          <span>⏱ {duration}</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wide" style={{ color: mutedText }}>
              {pricePrefix}
            </div>
            <div className="text-xl font-semibold" style={{ color: heading }}>
              {currency}{price}
            </div>
          </div>

          <button
            onClick={onBook}
            className="px-5 py-2.5 text-xs uppercase tracking-widest font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: primary }}
          >
            {bookText}
          </button>
        </div>
      </div>
    </div>
  );
}
