"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  fetchAdminBookings,
  updateAdminBookingStatus,
  deleteAdminBooking,
  onAdminSessionChange,
  ADMIN_SITE_NAMES,
  getAdminSite,
  type AdminBooking,
} from "@/lib/adminApi";

export default function AdminBookings() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Details Modal
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminBookings();
      setBookings(data);
    } catch (err: any) {
      showToast(err?.message || "Failed to load reservations", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
    return onAdminSessionChange(() => {
      loadBookings();
    });
  }, [loadBookings]);

  const activeSite = getAdminSite();
  const currentBrand = ADMIN_SITE_NAMES[activeSite] || ADMIN_SITE_NAMES.website1;

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const bStatus = (b.status || "").toLowerCase();
      const matchesStatus = statusFilter === "all" || bStatus === statusFilter.toLowerCase();
      const matchesSearch =
        (b.guestName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.tourName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.id || b._id || "").toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [bookings, statusFilter, searchTerm]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateAdminBookingStatus(id, newStatus);
      setBookings((prev) =>
        prev.map((b) =>
          (b.id || b._id) === id ? { ...b, status: newStatus as any } : b
        )
      );
      if (selectedBooking && (selectedBooking.id || selectedBooking._id) === id) {
        setSelectedBooking((prev) => (prev ? { ...prev, status: newStatus as any } : null));
      }
      showToast(`Booking marked as ${newStatus}`);
    } catch (err: any) {
      showToast(err?.message || "Failed to update status", "error");
    }
  };

  const handleDelete = async (id: string, guest: string) => {
    if (!confirm(`Are you sure you want to delete reservation for "${guest}"?`)) return;
    try {
      await deleteAdminBooking(id);
      setBookings((prev) => prev.filter((b) => (b.id || b._id) !== id));
      if (selectedBooking && (selectedBooking.id || selectedBooking._id) === id) {
        setSelectedBooking(null);
      }
      showToast("Booking deleted successfully.");
    } catch (err: any) {
      showToast(err?.message || "Failed to delete booking", "error");
    }
  };

  // CSV Export Generator
  const handleExportCSV = () => {
    if (filteredBookings.length === 0) {
      showToast("No reservations available to export", "error");
      return;
    }

    const headers = [
      "Booking ID",
      "Guest Name",
      "Email",
      "Phone",
      "Tour Package",
      "Travelers",
      "Total Price",
      "Status",
      "Start Date",
      "End Date",
      "Booked At",
    ];

    const rows = filteredBookings.map((b) => [
      `"${b.id || b._id || ""}"`,
      `"${b.guestName || ""}"`,
      `"${b.email || ""}"`,
      `"${b.phone || ""}"`,
      `"${(b.tourName || "").replace(/"/g, '""')}"`,
      b.travelers || 1,
      b.totalPrice || 0,
      `"${b.status || ""}"`,
      `"${b.startDate || ""}"`,
      `"${b.endDate || ""}"`,
      `"${b.createdAt || ""}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${currentBrand.label.replace(/\s+/g, "_")}_Bookings_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV export generated successfully!");
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "confirmed":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "cancelled":
        return "bg-rose-100 text-rose-800 border-rose-300";
      default:
        return "bg-amber-100 text-amber-800 border-amber-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2 transition-all ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          <span>{toast.type === "success" ? "✓" : "⚠️"}</span>
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Guest Reservations
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            View customer bookings, update operational status, and manage reservations for{" "}
            {currentBrand.label}.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all self-start sm:self-auto"
        >
          <span>📥</span>
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Search */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Search</label>
          <input
            type="text"
            placeholder="Search by guest, email, tour name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Status Filter</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading reservations...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            No bookings found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Guest Information</th>
                  <th className="px-5 py-3">Tour Package</th>
                  <th className="px-5 py-3">Travelers</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Dates</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBookings.map((b) => {
                  const bId = b.id || b._id || "";
                  return (
                    <tr key={bId} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-gray-900">{b.guestName || "Guest"}</div>
                        <div className="text-xs text-gray-500">{b.email}</div>
                        {b.phone && <div className="text-xs text-gray-400">{b.phone}</div>}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-gray-800 max-w-[220px] truncate">
                        {b.tourName || "Custom Tour"}
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">{b.travelers || 1} people</td>
                      <td className="px-5 py-3.5 font-bold text-gray-900">
                        ${(b.totalPrice || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <select
                          value={(b.status || "pending").toLowerCase()}
                          onChange={(e) => handleStatusChange(bId, e.target.value)}
                          className={`px-3 py-1 rounded-full text-xs font-bold border cursor-pointer focus:outline-none ${getStatusBadge(
                            b.status
                          )}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">
                        {b.startDate ? (
                          <div>
                            <div>{new Date(b.startDate).toLocaleDateString()}</div>
                            {b.endDate && <div>to {new Date(b.endDate).toLocaleDateString()}</div>}
                          </div>
                        ) : (
                          "Flexible"
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-all"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleDelete(bId, b.guestName)}
                          className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-8 border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Reservation Details</h2>
                <p className="text-xs text-gray-500">
                  ID: {selectedBooking.id || selectedBooking._id}
                </p>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm text-gray-700">
              <div className="bg-gray-50 p-4 rounded-2xl space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-500">Guest Name:</span>
                  <span className="font-bold text-gray-900">{selectedBooking.guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-500">Email:</span>
                  <span className="font-bold text-gray-900">{selectedBooking.email}</span>
                </div>
                {selectedBooking.phone && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-500">Phone:</span>
                    <span className="font-bold text-gray-900">{selectedBooking.phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-500">Travelers:</span>
                  <span className="font-bold text-gray-900">
                    {selectedBooking.travelers} Persons
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-500">Tour Package:</span>
                  <span className="font-bold text-gray-900 max-w-[200px] truncate text-right">
                    {selectedBooking.tourName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-500">Total Price:</span>
                  <span className="font-black text-emerald-600 text-base">
                    ${(selectedBooking.totalPrice || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-500">Status:</span>
                  <select
                    value={(selectedBooking.status || "pending").toLowerCase()}
                    onChange={(e) =>
                      handleStatusChange(
                        selectedBooking.id || selectedBooking._id || "",
                        e.target.value
                      )
                    }
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(
                      selectedBooking.status
                    )}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {selectedBooking.startDate && (
                <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-xl border border-blue-100">
                  <span className="font-semibold text-blue-900">Dates: </span>
                  {new Date(selectedBooking.startDate).toLocaleDateString()}
                  {selectedBooking.endDate &&
                    ` - ${new Date(selectedBooking.endDate).toLocaleDateString()}`}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-5 py-2.5 bg-gray-900 text-white font-bold text-sm rounded-xl hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}