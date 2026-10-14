"use client";

import { useRouter } from "next/navigation";
import type { SectionProps } from "@/lib/componentRegistry";
import TourCard from "@/components/tour-card";

export default function FeaturedTours({ config, data }: SectionProps) {
  const router = useRouter();
  const theme = config.theme || {};
  const primary = theme.primary || "#2563eb";
  const headingColor = theme.heading || "#0f172a";
  const mutedTextColor = theme.mutedText || "#64748b";

  const tours = data.tours || [];
  const isLoading = (data as { loading?: boolean }).loading;
  const error = (data as { error?: string | null }).error;
  const onRetry = (data as { onRetry?: () => void }).onRetry;

  return (
    <section key="featuredTours" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
          <div>
            <h2
              className="text-3xl sm:text-4xl font-extrabold tracking-tight"
              style={{ color: headingColor }}
            >
              Popular Tours
            </h2>
            <p className="mt-2 text-base sm:text-lg" style={{ color: mutedTextColor }}>
              Handpicked travel experiences and adventures
            </p>
          </div>
          <button
            onClick={() => router.push("/explore")}
            className="mt-4 sm:mt-0 text-sm font-semibold hover:underline inline-flex items-center gap-1"
            style={{ color: primary }}
          >
            View All Tours →
          </button>
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden shadow-sm animate-pulse"
              >
                <div className="h-52 bg-slate-200" />
                <div className="p-6 space-y-4">
                  <div className="h-5 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-200 rounded" />
                    <div className="h-3 bg-slate-200 rounded w-5/6" />
                  </div>
                  <div className="pt-4 flex justify-between items-center">
                    <div className="h-6 bg-slate-200 rounded w-20" />
                    <div className="h-9 bg-slate-200 rounded-lg w-28" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State with Retry */}
        {!isLoading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50/60 p-8 text-center max-w-xl mx-auto my-6">
            <span className="text-3xl mb-2 block">⚠️</span>
            <h3 className="text-lg font-bold text-red-800 mb-1">
              Could not load tours
            </h3>
            <p className="text-sm text-red-600 mb-5">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90"
                style={{ backgroundColor: primary }}
              >
                ↻ Retry Loading Tours
              </button>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && tours.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center max-w-md mx-auto my-6">
            <span className="text-3xl mb-3 block">🧭</span>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">
              No tours available
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              There are currently no active tours listed for this destination.
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="text-xs font-semibold hover:underline"
                style={{ color: primary }}
              >
                Refresh List
              </button>
            )}
          </div>
        )}

        {/* Loaded Tours Grid */}
        {!isLoading && !error && tours.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tours.slice(0, 6).map((tour) => (
              <TourCard
                key={tour.id}
                name={tour.name}
                description={tour.description}
                price={tour.price}
                rating={tour.rating}
                image={tour.image}
                duration={tour.duration}
                difficulty={tour.difficulty}
                onBook={() => router.push(`/tour/${tour.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}