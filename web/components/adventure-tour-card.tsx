"use client";

// Adventure World (website2) tour card — image-overlay layout driven by
// website2.js's `tourCard` config (layout: "image-overlay", bold pill
// button, difficulty-colored badge). Distinct on purpose from the plain
// white TourCard used by website1/website3.

type AdventureTourCardProps = {
  id: number;
  name: string;
  description: string;
  price: number;
  rating: number;
  image: string;
  duration: string;
  difficulty: string;
  onBook: () => void;
  tourCardConfig?: {
    bookButtonText?: string;
    pricePrefix?: string;
    currency?: string;
    badge?: { enabled?: boolean; text?: string };
    difficultyColors?: Record<string, string>;
  };
  theme?: {
    primary?: string;
    accent?: string;
  };
};

export default function AdventureTourCard({
  name,
  description,
  price,
  rating,
  image,
  duration,
  difficulty,
  onBook,
  tourCardConfig = {},
  theme = {},
}: AdventureTourCardProps) {
  const badgeEnabled = tourCardConfig.badge?.enabled !== false;
  const badgeText = tourCardConfig.badge?.text || "Adventure";
  const bookText = tourCardConfig.bookButtonText || "JOIN ADVENTURE";
  const pricePrefix = tourCardConfig.pricePrefix || "Starting";
  const currency = tourCardConfig.currency || "$";
  const accent = theme.accent || "#f97316";
  const primary = theme.primary || "#16a34a";

  const difficultyColor =
    tourCardConfig.difficultyColors?.[difficulty] || primary;

  return (
    <div className="group relative h-96 rounded-2xl overflow-hidden shadow-lg border border-black/5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
      {/* Full-bleed background image */}
      <img
        src={image}
        alt={name}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />

      {/* Dark gradient so white text stays readable over any photo */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />

      {/* Top row: adventure badge + rating */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
        {badgeEnabled && (
          <span
            className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide text-white"
            style={{ backgroundColor: accent }}
          >
            🔥 {badgeText}
          </span>
        )}
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-gray-900">
          ⭐ {rating}
        </span>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wide"
            style={{ backgroundColor: difficultyColor }}
          >
            {difficulty}
          </span>
          <span className="text-xs font-semibold text-white/80">📅 {duration}</span>
        </div>

        <h3 className="text-xl font-black uppercase leading-tight mb-1">{name}</h3>
        <p className="text-sm text-white/75 line-clamp-2 mb-4">{description}</p>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-white/60">{pricePrefix}</div>
            <div className="text-2xl font-black">{currency}{price}</div>
          </div>

          <button
            onClick={onBook}
            className="px-5 py-3 rounded-full text-xs font-black uppercase tracking-wide text-white transition-transform hover:scale-105"
            style={{ backgroundColor: accent }}
          >
            {bookText}
          </button>
        </div>
      </div>
    </div>
  );
}
