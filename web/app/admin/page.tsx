"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  fetchAdminStats,
  onAdminSessionChange,
  ADMIN_SITE_NAMES,
  getAdminSite,
  type AdminStats,
} from "@/lib/adminApi";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminStats();
      setStats(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    return onAdminSessionChange(() => {
      loadStats();
    });
  }, [loadStats]);

  const activeSite = getAdminSite();
  const currentBrand = ADMIN_SITE_NAMES[activeSite] || ADMIN_SITE_NAMES.website1;

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "confirmed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "cancelled":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ─── Header & Tenant Banner ─── */}
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
              Management Overview
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Real-time business performance, catalog scope, and guest reservations.
          </p>
        </div>

        <button
          onClick={loadStats}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-all"
        >
          <span className={loading ? "animate-spin" : ""}>🔄</span>
          <span>Refresh</span>
        </button>
      </div>

      {/* ─── Error Notification ─── */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 text-sm">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button
            onClick={loadStats}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* ─── KPI Cards Grid ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Bookings */}
        <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wide">
              Total Bookings
            </span>
            <span className="text-2xl">📅</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">
            {loading ? "..." : (stats?.totalBookings ?? 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Tenant reservations</p>
        </div>

        {/* Pending Bookings */}
        <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-amber-600 uppercase tracking-wide">
              Pending Action
            </span>
            <span className="text-2xl">⏳</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-2">
            {loading ? "..." : (stats?.pendingBookings ?? 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Awaiting confirmation</p>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-emerald-600 uppercase tracking-wide">
              Gross Revenue
            </span>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">
            {loading ? "..." : `$${(stats?.totalRevenue ?? 0).toLocaleString()}`}
          </p>
          <p className="text-xs text-gray-400 mt-1">Excluding cancelled</p>
        </div>

        {/* Total Tours */}
        <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-blue-600 uppercase tracking-wide">
              Active Catalog
            </span>
            <span className="text-2xl">🗺️</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-600 mt-2">
            {loading ? "..." : (stats?.totalTours ?? 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Live packages</p>
        </div>
      </div>

      {/* ─── Recent Bookings Section ─── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Recent Guest Reservations</h2>
            <p className="text-xs text-gray-500">Latest activity scoped to {currentBrand.label}</p>
          </div>
          <Link
            href="/admin/bookings"
            className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700"
          >
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading recent reservations...</div>
        ) : !stats?.recentBookings || stats.recentBookings.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No bookings recorded for this tenant yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Guest Details</th>
                  <th className="px-5 py-3">Tour Package</th>
                  <th className="px-5 py-3">Travelers</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Booked Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recentBookings.map((b) => (
                  <tr key={b.id || b._id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-gray-900">{b.guestName || "Guest"}</div>
                      <div className="text-xs text-gray-500">{b.email}</div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-800 font-medium max-w-[200px] truncate">
                      {b.tourName || "Custom Tour"}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">{b.travelers || 1} travelers</td>
                    <td className="px-5 py-3.5 font-bold text-gray-900">
                      ${(b.totalPrice || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(
                          b.status
                        )}`}
                      >
                        {b.status || "pending"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">
                      {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "Recent"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Quick Actions Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/admin/tours"
          className="p-5 bg-white rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all group"
        >
          <div className="text-2xl mb-2">🗺️</div>
          <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            Manage Tours Catalog
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Create, edit, toggle highlights and itineraries.
          </p>
        </Link>

        <Link
          href="/admin/bookings"
          className="p-5 bg-white rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all group"
        >
          <div className="text-2xl mb-2">📋</div>
          <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            Process Reservations
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Update confirmation statuses or export CSV reports.
          </p>
        </Link>

        <Link
          href="/admin/users"
          className="p-5 bg-white rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all group"
        >
          <div className="text-2xl mb-2">👥</div>
          <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            User Accounts & Roles
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Manage administrators, staff roles, and statuses.
          </p>
        </Link>
      </div>
    </div>
  );
}