"use client";

import { useRouter } from "next/navigation";
import type { SectionProps } from "@/lib/componentRegistry";

export default function Destinations({ config, data }: SectionProps) {
  const router = useRouter();
  const theme = config.theme || {};
  const primary = theme.primary || "#2563eb";
  const headingColor = theme.heading || "#0f172a";
  const mutedTextColor = theme.mutedText || "#64748b";

  const destinations = data.destinations || [];
  const isLoading = (data as { loading?: boolean }).loading;
  const error = (data as { error?: string | null }).error;
  const onRetry = (data as { onRetry?: () => void }).onRetry;

  return (
    <section key="destinations" className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2
            className="text-3xl sm:text-4xl font-extrabold tracking-tight"
            style={{ color: headingColor }}
          >
            Explore Top Destinations
          </h2>
          <p className="mt-3 text-base sm:text-lg" style={{ color: mutedTextColor }}>
            Find inspiration for your next dream getaway
          </p>
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-72 rounded-2xl bg-slate-200 animate-pulse overflow-hidden"
              />
            ))}
          </div>
        )}

        {/* Error State with Retry */}
        {!isLoading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50/60 p-8 text-center max-w-xl mx-auto my-6">
            <span className="text-3xl mb-2 block">⚠️</span>
            <h3 className="text-lg font-bold text-red-800 mb-1">
              Could not load destinations
            </h3>
            <p className="text-sm text-red-600 mb-5">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90"
                style={{ backgroundColor: primary }}
              >
                ↻ Retry Loading Destinations
              </button>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && destinations.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center max-w-md mx-auto my-6">
            <span className="text-3xl mb-3 block">📍</span>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">
              No destinations listed
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Featured destinations will appear here once configured in the API.
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="text-xs font-semibold hover:underline"
                style={{ color: primary }}
              >
                Refresh Destinations
              </button>
            )}
          </div>
        )}

        {/* Loaded Destinations Grid */}
        {!isLoading && !error && destinations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {destinations.map((dest, idx) => (
              <div
                key={dest.id || dest.name || idx}
                className="relative overflow-hidden rounded-2xl group cursor-pointer shadow-md hover:shadow-xl transition-shadow"
                onClick={() => {
                  const primary = dest.name.split(',')[0].trim();
                  router.push(`/explore?q=${encodeURIComponent(primary)}`);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <h3 className="text-xl font-bold">{dest.name}</h3>
                  <p className="text-sm text-white/80">
                    {dest.tours} {dest.tours === 1 ? 'tour' : 'tours'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}