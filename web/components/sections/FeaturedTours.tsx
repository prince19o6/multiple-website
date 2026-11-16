"use client";

import { useRouter } from "next/navigation";
import type { SectionProps } from "@/lib/componentRegistry";
import TourCard from "@/components/tour-card";

export default function FeaturedTours({ data }: SectionProps) {
  const router = useRouter();

  const tours = data.tours || [];
  const isLoading = (data as { loading?: boolean }).loading;
  const error = (data as { error?: string | null }).error;
  const onRetry = (data as { onRetry?: () => void }).onRetry;

  return (
    <section key="featuredTours" className="py-16 bg-surface text-foreground transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Popular Tours
            </h2>
            <p className="mt-2 text-base sm:text-lg text-foreground-muted">
              Handpicked travel experiences and adventures
            </p>
          </div>
          <button
            onClick={() => router.push("/explore")}
            className="mt-4 sm:mt-0 text-sm font-semibold hover:underline inline-flex items-center gap-1 text-primary"
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
                className="rounded-2xl border border-border bg-surface-2 overflow-hidden shadow-soft-sm animate-pulse"
              >
                <div className="h-52 bg-neutral-200 dark:bg-neutral-800" />
                <div className="p-6 space-y-4">
                  <div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
                  <div className="space-y-2">
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded" />
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-5/6" />
                  </div>
                  <div className="pt-4 flex justify-between items-center">
                    <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-20" />
                    <div className="h-9 bg-neutral-200 dark:bg-neutral-800 rounded-lg w-28" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State with Retry */}
        {!isLoading && error && (
          <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/60 dark:bg-red-950/20 p-8 text-center max-w-xl mx-auto my-6">
            <span className="text-3xl mb-2 block">⚠️</span>
            <h3 className="text-lg font-bold text-red-800 dark:text-red-300 mb-1">
              Could not load tours
            </h3>
            <p className="text-sm text-red-600 dark:text-red-400 mb-5">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-contrast shadow-soft-sm transition-all hover:opacity-90"
              >
                ↻ Retry Loading Tours
              </button>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && tours.length === 0 && (
          <div className="rounded-2xl border border-border bg-surface-2 p-12 text-center max-w-md mx-auto my-6">
            <span className="text-3xl mb-3 block">🧭</span>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              No tours available
            </h3>
            <p className="text-sm text-foreground-muted mb-4">
              There are currently no active tours listed for this destination.
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="text-xs font-semibold hover:underline text-primary"
              >
                Refresh List
              </button>
            )}
          </div>
        )}

        {/* Loaded Tours Grid */}
        {!isLoading && !error && tours.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tours.slice(0, 6).map((tour, idx) => (
              <TourCard
                key={`${tour.id || 'tour'}-${idx}`}
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