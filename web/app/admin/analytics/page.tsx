"use client";

import { useEffect, useState, useCallback } from "react";
import {
  fetchAdminAnalytics,
  onAdminSessionChange,
  ADMIN_SITE_NAMES,
  getAdminSite,
  type AdminAnalyticsData,
} from "@/lib/adminApi";

export default function AdminAnalytics() {
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchAdminAnalytics();
      setData(res);
    } catch (err: any) {
      setError(err?.message || "Failed to load business analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
    return onAdminSessionChange(() => {
      loadAnalytics();
    });
  }, [loadAnalytics]);

  const activeSite = getAdminSite();
  const currentBrand = ADMIN_SITE_NAMES[activeSite] || ADMIN_SITE_NAMES.website1;

  const maxRevenue = Math.max(
    ...(data?.revenueOverTime.map((r) => r.revenue) || [1000]),
    1000
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: currentBrand.color }}
            >
              {currentBrand.label}
            </span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Performance Insights
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Business Analytics
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Revenue trends, popular destinations, and category demand.
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-all"
        >
          <span className={loading ? "animate-spin" : ""}>🔄</span>
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 text-sm">
          <span>⚠️ {error}</span>
          <button
            onClick={loadAnalytics}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gross Revenue</p>
          <p className="text-3xl font-black text-emerald-600 mt-2">
            {loading ? "..." : `$${(data?.totalRevenue ?? 0).toLocaleString()}`}
          </p>
          <p className="text-xs text-gray-400 mt-1">Total completed & pending revenue</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Bookings</p>
          <p className="text-3xl font-black text-gray-900 mt-2">
            {loading ? "..." : (data?.totalBookings ?? 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Tenant reservation volume</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Avg. Order Value
          </p>
          <p className="text-3xl font-black text-blue-600 mt-2">
            {loading ? "..." : `$${(data?.avgBookingValue ?? 0).toLocaleString()}`}
          </p>
          <p className="text-xs text-gray-400 mt-1">Average guest transaction</p>
        </div>
      </div>

      {/* Charts & Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Over Time Trend */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center justify-between">
            <span>Monthly Revenue Progression</span>
            <span className="text-xs font-normal text-gray-400">Total Volume</span>
          </h2>

          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm">Loading trend...</div>
          ) : !data?.revenueOverTime || data.revenueOverTime.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              No periodic revenue data yet.
            </div>
          ) : (
            <div className="space-y-4">
              {data.revenueOverTime.map((item, idx) => {
                const pct = Math.min(100, Math.round((item.revenue / maxRevenue) * 100));
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-gray-700">
                      <span>{item.period}</span>
                      <span>
                        ${item.revenue.toLocaleString()} ({item.bookings} bookings)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(5, pct)}%`,
                          backgroundColor: currentBrand.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bookings By Status Distribution */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center justify-between">
            <span>Reservations by Status</span>
            <span className="text-xs font-normal text-gray-400">Pipeline</span>
          </h2>

          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm">Loading statuses...</div>
          ) : !data?.bookingsByStatus || data.bookingsByStatus.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">No reservations recorded.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {data.bookingsByStatus.map((item) => (
                <div key={item.status} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase">{item.status}</p>
                  <p className="text-2xl font-black text-gray-900 mt-1">{item.count}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    ${(item.revenue || 0).toLocaleString()} volume
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tours By Category */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center justify-between">
            <span>Tour Catalog Distribution</span>
            <span className="text-xs font-normal text-gray-400">Categories</span>
          </h2>

          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm">Loading categories...</div>
          ) : !data?.toursByCategory || data.toursByCategory.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">No tours in catalog.</div>
          ) : (
            <div className="space-y-3">
              {data.toursByCategory.map((c) => (
                <div key={c.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏷️</span>
                    <span className="font-bold text-sm text-gray-800">{c.category}</span>
                  </div>
                  <span className="px-2.5 py-1 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-700">
                    {c.count} packages
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Performing Tours */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center justify-between">
            <span>Top Performing Tours</span>
            <span className="text-xs font-normal text-gray-400">By Revenue</span>
          </h2>

          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm">Loading top tours...</div>
          ) : !data?.topTours || data.topTours.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">No top tours recorded yet.</div>
          ) : (
            <div className="space-y-3">
              {data.topTours.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="truncate max-w-[200px]">
                    <p className="font-bold text-xs sm:text-sm text-gray-900 truncate">{t.name}</p>
                    <p className="text-[11px] text-gray-500">{t.bookingsCount} reservations</p>
                  </div>
                  <span className="text-xs sm:text-sm font-black text-emerald-600">
                    ${t.revenue.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
