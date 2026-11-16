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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard metrics");
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
  const currentBrand = ADMIN_SITE_NAMES[activeSite] || ADMIN_SITE_NAMES.tripgoasia;

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

  const moduleRevenue = [
    { key: "tour", label: "Tours & Activities", icon: "🗺️", amount: stats?.revenueByModule?.["tour"] ?? stats?.revenueByModule?.["tours"] ?? 0 },
    { key: "hotel", label: "Hotels & Stays", icon: "🏨", amount: stats?.revenueByModule?.["hotel"] ?? stats?.revenueByModule?.["hotels"] ?? 0 },
    { key: "flight", label: "Flights", icon: "✈️", amount: stats?.revenueByModule?.["flight"] ?? stats?.revenueByModule?.["flights"] ?? 0 },
    { key: "transfer", label: "Airport Transfers", icon: "🚖", amount: stats?.revenueByModule?.["transfer"] ?? stats?.revenueByModule?.["transfers"] ?? 0 },
    { key: "visa", label: "Visas", icon: "🛂", amount: stats?.revenueByModule?.["visa"] ?? stats?.revenueByModule?.["visas"] ?? 0 },
    { key: "restaurant", label: "Restaurants", icon: "🍽️", amount: stats?.revenueByModule?.["restaurant"] ?? stats?.revenueByModule?.["restaurants"] ?? 0 },
    { key: "package", label: "Holiday Packages", icon: "🌴", amount: stats?.revenueByModule?.["package"] ?? stats?.revenueByModule?.["packages"] ?? 0 },
    { key: "buildpackage", label: "Custom Package", icon: "🧩", amount: stats?.revenueByModule?.["buildpackage"] ?? stats?.revenueByModule?.["custom"] ?? 0 },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 font-sans">
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
            Real-time business performance, database records, and guest reservations.
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
        {/* Today's Bookings */}
        <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wide">
              Today&apos;s Bookings
            </span>
            <span className="text-2xl">⚡</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">
            {loading ? "..." : (stats?.todayBookings ?? 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Total lifetime: <strong className="text-gray-700">{stats?.totalBookings ?? 0}</strong>
          </p>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-amber-600 uppercase tracking-wide">
              Pending Approvals
            </span>
            <span className="text-2xl">⏳</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-2">
            {loading ? "..." : (stats?.pendingApprovals ?? stats?.pendingBookings ?? 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Requires admin review</p>
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
            {loading ? "..." : `₹${(stats?.totalRevenue ?? 0).toLocaleString()}`}
          </p>
          <p className="text-xs text-gray-400 mt-1">Excludes cancelled</p>
        </div>

        {/* New Users Today */}
        <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-blue-600 uppercase tracking-wide">
              New Users Today
            </span>
            <span className="text-2xl">👥</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-600 mt-2">
            {loading ? "..." : (stats?.newUsers ?? 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Total users: <strong className="text-gray-700">{stats?.totalUsers ?? 0}</strong>
          </p>
        </div>
      </div>

      {/* ─── Revenue Per Module Breakdown ─── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Revenue per Module</h2>
            <p className="text-xs text-gray-500">Live breakdown of revenue across all 8 verticals</p>
          </div>
          <Link
            href="/admin/catalog"
            className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700"
          >
            Manage Catalog →
          </Link>
        </div>

        <div className="p-5 sm:p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {moduleRevenue.map((mod) => (
            <div
              key={mod.key}
              className="p-4 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between text-lg mb-1">
                <span>{mod.icon}</span>
                <span className="text-xs font-bold text-gray-400 uppercase">{mod.key}</span>
              </div>
              <div className="text-xs font-semibold text-gray-600 truncate">{mod.label}</div>
              <div className="text-lg font-black text-gray-900 mt-1">
                ₹{mod.amount.toLocaleString()}
              </div>
            </div>
          ))}
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
            View All Reservations →
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading recent reservations...</div>
        ) : !stats?.recentBookings || stats.recentBookings.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No bookings recorded for this tenant database yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Guest Details</th>
                  <th className="px-5 py-3">Module & Item</th>
                  <th className="px-5 py-3">Travelers</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recentBookings.map((b) => (
                  <tr key={b.id || b._id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-gray-900">{b.guestName}</div>
                      <div className="text-xs text-gray-500">{b.email}</div>
                      {b.reference && (
                        <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          {b.reference}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-gray-800 line-clamp-1">{b.tourName || "Reservation"}</div>
                      <span className="text-[10px] uppercase font-bold text-gray-400">
                        {b.snapshot?.category || "Direct Booking"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {b.travelers || 1} guest{(b.travelers || 1) > 1 ? "s" : ""}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-gray-900">
                      ₹{(b.totalPrice || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${getStatusBadge(
                          b.status
                        )}`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                      {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href="/admin/bookings"
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold text-gray-700 transition-colors"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
