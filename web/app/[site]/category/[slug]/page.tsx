"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import type { Tour } from "@/lib/type";

type Props = {
  params: Promise<{ site: string; slug: string }>;
};

export default function CategoryPage({ params }: Props) {
  const config = useSiteConfig();
  const { slug } = use(params);

  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categoryName = slug
    ? slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ")
    : "Category";

  const loadTours = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/tours", { cache: "no-store" });
      const json = await res.json().catch(() => null);

      if (!res.ok || (json && json.success === false)) {
        const msg = json?.error || `API returned status ${res.status}`;
        setError(msg);
        setTours([]);
      } else {
        const list: Tour[] = Array.isArray(json?.data)
          ? (json.data as Tour[])
          : Array.isArray(json)
            ? (json as Tour[])
            : [];
        setTours(list);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load tours from API";
      setError(msg);
      setTours([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTours();
  }, [loadTours]);

  // Match category slug with tour category
  const matchingTours = tours.filter((t) => {
    const tourCat = (t.category || "").toLowerCase();
    const targetSlug = slug.toLowerCase();
    return (
      tourCat === targetSlug ||
      (targetSlug === "cultural" && (tourCat === "culture" || tourCat === "cultural")) ||
      (targetSlug === "culture" && (tourCat === "cultural" || tourCat === "culture")) ||
      t.difficulty?.toLowerCase().includes(targetSlug) ||
      t.description?.toLowerCase().includes(targetSlug)
    );
  });

  const theme = config.theme || {};
  const primary = theme.primary || "#2563eb";
  const heading = theme.heading || "#111827";
  const muted = theme.mutedText || "#6b7280";
  const bg = theme.background || "#f8fafc";
  const brandName = config.name || "Tours";

  return (
    <main className="min-h-screen py-12" style={{ backgroundColor: bg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/explore" className="hover:underline text-slate-600">
            ← Explore
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-900">{categoryName}</span>
        </div>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: heading }}>
            {categoryName} Tours
          </h1>
          <p className="mt-2 text-lg" style={{ color: muted }}>
            {!loading && !error && matchingTours.length > 0
              ? `${matchingTours.length} curated ${categoryName.toLowerCase()} experience${matchingTours.length === 1 ? "" : "s"} from ${brandName}`
              : `Handcrafted ${categoryName.toLowerCase()} itineraries tailored by ${brandName}`}
          </p>
        </div>

        {/* 1. Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm animate-pulse"
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

        {/* 2. Error State with Retry Button */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center max-w-xl mx-auto my-10">
            <span className="text-3xl mb-2 block">⚠️</span>
            <p className="font-bold text-red-800 text-lg">Couldn&apos;t load tours right now.</p>
            <p className="text-sm mt-1 text-red-600 mb-6">{error}</p>
            <button
              type="button"
              onClick={loadTours}
              className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm shadow-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primary }}
            >
              ↻ Retry Connection
            </button>
          </div>
        )}

        {/* 3. Empty State */}
        {!loading && !error && matchingTours.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center max-w-md mx-auto my-10 shadow-sm">
            <span className="text-4xl mb-3 block">🧭</span>
            <h3 className="font-bold text-slate-800 text-lg">
              No tours in this category
            </h3>
            <p className="text-sm mt-2 text-slate-500 mb-6">
              There are currently no active tours listed under {categoryName}.
            </p>
            <div className="flex justify-center gap-3">
              <Link
                href="/explore"
                className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm shadow-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: primary }}
              >
                Browse All Tours
              </Link>
              <button
                type="button"
                onClick={loadTours}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        )}

        {/* 4. Tours Grid */}
        {!loading && !error && matchingTours.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {matchingTours.map((tour) => (
              <div
                key={tour.id}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tour.image}
                  alt={tour.name}
                  className="w-full h-52 object-cover"
                />
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      <span>{tour.category || categoryName}</span>
                      <span>{tour.difficulty || "Moderate"}</span>
                    </div>
                    <h2 className="text-xl font-bold" style={{ color: heading }}>
                      {tour.name}
                    </h2>
                    <p className="text-slate-600 text-sm mt-2 line-clamp-3">
                      {tour.description}
                    </p>
                  </div>
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                    <div>
                      <div className="font-extrabold text-xl" style={{ color: primary }}>
                        ${tour.price}
                      </div>
                      <div className="text-xs text-slate-500">
                        ⭐ {tour.rating ?? "—"} · {tour.duration || ""}
                      </div>
                    </div>
                    <Link
                      href={`/tour/${tour.id}`}
                      className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: primary }}
                    >
                      View Tour
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
