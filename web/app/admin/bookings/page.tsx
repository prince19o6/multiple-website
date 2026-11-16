"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  fetchAdminBookings,
  fetchAdminInboxCounts,
  confirmAdminBooking,
  rejectAdminBooking,
  cancelAdminBooking,
  bulkConfirmAdminBookings,
  bulkRejectAdminBookings,
  resendAdminBookingEmail,
  fetchBookingOutbox,
  reviewCancellationRequest,
  deleteAdminBooking,
  onAdminSessionChange,
  ADMIN_SITE_NAMES,
  getAdminSite,
  type AdminBooking,
  type InboxCountsDto,
  type EmailOutboxItem,
} from "@/lib/adminApi";

type StatusTab =
  | "pending"
  | "cancellation_requests"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "rejected"
  | "expired"
  | "all";

type DrawerTab = "overview" | "history" | "outbox";

export default function AdminBookings() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [inboxCounts, setInboxCounts] = useState<InboxCountsDto>({
    pending: 0,
    confirmed: 0,
    rejected: 0,
    expired: 0,
    cancelled: 0,
    completed: 0,
    cancellationRequests: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<StatusTab>("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Slide-over Drawer
  const [drawerBooking, setDrawerBooking] = useState<AdminBooking | null>(null);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("overview");
  const [outboxLogs, setOutboxLogs] = useState<EmailOutboxItem[]>([]);
  const [loadingOutbox, setLoadingOutbox] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Reject / Cancel Reason Modal
  const [reasonModal, setReasonModal] = useState<{
    isOpen: boolean;
    type: "reject" | "cancel" | "bulk_reject";
    targetId?: string;
    bookingRef?: string;
    guestName?: string;
  } | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [reasonSubmitting, setReasonSubmitting] = useState(false);

  // Review Cancellation Request Modal
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    booking: AdminBooking;
  } | null>(null);
  const [reviewAdminNote, setReviewAdminNote] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4500);
  };

  const activeSite = getAdminSite();
  const currentBrand = ADMIN_SITE_NAMES[activeSite] || ADMIN_SITE_NAMES.tripgoasia;

  // Load Bookings & Counts
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [bookingsData, countsData] = await Promise.all([
        fetchAdminBookings(),
        fetchAdminInboxCounts().catch(() => ({
          pending: 0,
          confirmed: 0,
          rejected: 0,
          expired: 0,
          cancelled: 0,
          completed: 0,
          cancellationRequests: 0,
          total: 0,
        })),
      ]);

      setBookings(bookingsData);
      setInboxCounts(countsData);
      setLastRefreshedAt(new Date());

      // If drawer is open, refresh its data snapshot
      setDrawerBooking((prev) => {
        if (!prev) return null;
        const fresh = bookingsData.find((b) => (b.id || b._id) === (prev.id || prev._id));
        return fresh || prev;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load reservations";
      if (!isSilent) showToast(msg, "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsub = onAdminSessionChange(() => {
      loadData();
    });
    return () => unsub();
  }, [loadData]);

  // 30-Second Background Auto-Refresh Timer
  useEffect(() => {
    const timer = setInterval(() => {
      loadData(true);
    }, 30000);
    return () => clearInterval(timer);
  }, [loadData]);

  // Load Outbox Logs when Drawer Tab changes
  useEffect(() => {
    if (drawerBooking && drawerTab === "outbox") {
      setLoadingOutbox(true);
      const bId = drawerBooking.id || drawerBooking._id || "";
      fetchBookingOutbox(bId)
        .then((logs) => setOutboxLogs(logs))
        .catch(() => setOutboxLogs([]))
        .finally(() => setLoadingOutbox(false));
    }
  }, [drawerBooking, drawerTab]);

  // Filter Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const bStatus = (b.status || "").toLowerCase();
      const hasCancellationRequest =
        b.cancellationRequest &&
        b.cancellationRequest.status &&
        b.cancellationRequest.status.toLowerCase() === "pending";

      let matchesTab = false;
      if (activeTab === "all") {
        matchesTab = true;
      } else if (activeTab === "cancellation_requests") {
        matchesTab = Boolean(hasCancellationRequest);
      } else {
        matchesTab = bStatus === activeTab.toLowerCase();
      }

      // Module filter
      let matchesModule = true;
      if (moduleFilter !== "all") {
        const bMod = (b.serviceType || "").toLowerCase();
        if (moduleFilter === "tour") matchesModule = bMod === "tour" || bMod === "tours" || !bMod;
        else if (moduleFilter === "hotel") matchesModule = bMod === "hotel" || bMod === "hotels";
        else if (moduleFilter === "flight") matchesModule = bMod === "flight" || bMod === "flights";
        else if (moduleFilter === "transfer") matchesModule = bMod === "transfer" || bMod === "transfers";
        else if (moduleFilter === "visa") matchesModule = bMod === "visa" || bMod === "visas";
        else if (moduleFilter === "restaurant") matchesModule = bMod === "restaurant" || bMod === "restaurants";
        else if (moduleFilter === "package") matchesModule = bMod === "package" || bMod === "packages";
        else if (moduleFilter === "buildpackage") matchesModule = bMod === "buildpackage" || bMod === "custom";
        else matchesModule = bMod === moduleFilter.toLowerCase();
      }

      // Date range filter
      let matchesDate = true;
      const bDateStr = b.createdAt || b.startDate || b.travelDate;
      if (bDateStr) {
        const bTime = new Date(bDateStr).getTime();
        if (dateFrom) {
          const fromTime = new Date(dateFrom).getTime();
          if (bTime < fromTime) matchesDate = false;
        }
        if (dateTo) {
          const toTime = new Date(dateTo).setHours(23, 59, 59, 999);
          if (bTime > toTime) matchesDate = false;
        }
      }

      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (b.guestName || "").toLowerCase().includes(q) ||
        (b.email || "").toLowerCase().includes(q) ||
        (b.phone || "").toLowerCase().includes(q) ||
        (b.tourName || "").toLowerCase().includes(q) ||
        (b.reference || "").toLowerCase().includes(q) ||
        (b.id || b._id || "").toLowerCase().includes(q);

      return matchesTab && matchesModule && matchesDate && matchesSearch;
    });
  }, [bookings, activeTab, moduleFilter, dateFrom, dateTo, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / pageSize));
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBookings.slice(start, start + pageSize);
  }, [filteredBookings, currentPage, pageSize]);

  // Selection Handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredBookings.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredBookings.map((b) => b.id || b._id || ""));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Quick Action: Approve / Confirm
  const handleConfirm = async (id: string, ref?: string) => {
    setActionInProgress(id);
    try {
      const updated = await confirmAdminBooking(id, "", activeSite);
      showToast(`Reservation ${ref || updated.reference || id} successfully confirmed!`);
      if (drawerBooking && (drawerBooking.id === id || drawerBooking._id === id)) {
        setDrawerBooking((prev) => (prev ? { ...prev, ...updated, status: "confirmed" } : null));
      }
      await loadData(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to confirm reservation";
      showToast(msg, "error");
    } finally {
      setActionInProgress(null);
    }
  };

  // Quick Action: Resend Confirmation Email
  const handleResendEmail = async (id: string, ref?: string) => {
    setActionInProgress(id);
    try {
      await resendAdminBookingEmail(id);
      showToast(`Confirmation email enqueued for ${ref || id}`);
      if (drawerBooking && drawerTab === "outbox") {
        const logs = await fetchBookingOutbox(id);
        setOutboxLogs(logs);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to resend email";
      showToast(msg, "error");
    } finally {
      setActionInProgress(null);
    }
  };

  // Open Modal for Reject / Cancel
  const openReasonModal = (
    type: "reject" | "cancel" | "bulk_reject",
    targetId?: string,
    bookingRef?: string,
    guestName?: string
  ) => {
    setActionReason("");
    setReasonModal({
      isOpen: true,
      type,
      targetId,
      bookingRef,
      guestName,
    });
  };

  // Submit Modal for Reject / Cancel
  const handleReasonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonModal) return;

    if (!actionReason.trim()) {
      showToast("A reason is mandatory to notify the customer.", "error");
      return;
    }

    setReasonSubmitting(true);
    try {
      if (reasonModal.type === "reject" && reasonModal.targetId) {
        await rejectAdminBooking(reasonModal.targetId, actionReason.trim());
        showToast(`Reservation ${reasonModal.bookingRef || reasonModal.targetId} has been rejected.`);
      } else if (reasonModal.type === "cancel" && reasonModal.targetId) {
        await cancelAdminBooking(reasonModal.targetId, actionReason.trim());
        showToast(`Reservation ${reasonModal.bookingRef || reasonModal.targetId} has been cancelled.`);
      } else if (reasonModal.type === "bulk_reject") {
        const res = await bulkRejectAdminBookings(selectedIds, actionReason.trim());
        showToast(`Bulk Rejected: ${res.successCount} succeeded, ${res.failureCount} failed.`);
        setSelectedIds([]);
      }
      setReasonModal(null);
      await loadData(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Operation failed";
      showToast(msg, "error");
    } finally {
      setReasonSubmitting(false);
    }
  };

  // Bulk Approve
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to approve ${selectedIds.length} reservation(s)?`)) return;

    setBulkActionLoading(true);
    try {
      const res = await bulkConfirmAdminBookings(selectedIds, activeSite);
      showToast(`Bulk Approved: ${res.successCount} confirmed, ${res.failureCount} failed.`);
      setSelectedIds([]);
      await loadData(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bulk approve failed";
      showToast(msg, "error");
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Review Cancellation Request
  const handleReviewCancellation = async (approve: boolean) => {
    if (!reviewModal) return;
    setReviewSubmitting(true);
    const bId = reviewModal.booking.id || reviewModal.booking._id || "";
    try {
      await reviewCancellationRequest(bId, approve, reviewAdminNote.trim(), activeSite);
      showToast(
        approve
          ? `Cancellation request approved. Booking ${reviewModal.booking.reference} is cancelled.`
          : `Cancellation request declined for ${reviewModal.booking.reference}.`
      );
      setReviewModal(null);
      setReviewAdminNote("");
      if (drawerBooking && (drawerBooking.id === bId || drawerBooking._id === bId)) {
        setDrawerBooking(null);
      }
      await loadData(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to review cancellation";
      showToast(msg, "error");
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Delete Hard
  const handleDelete = async (id: string, guest: string) => {
    if (!confirm(`Permanently delete reservation record for "${guest}"? This cannot be undone.`)) return;
    try {
      await deleteAdminBooking(id);
      setBookings((prev) => prev.filter((b) => (b.id || b._id) !== id));
      if (drawerBooking && (drawerBooking.id || drawerBooking._id) === id) {
        setDrawerBooking(null);
      }
      showToast("Booking deleted from database.");
      loadData(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete booking";
      showToast(msg, "error");
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredBookings.length === 0) {
      showToast("No reservations available to export", "error");
      return;
    }

    const headers = [
      "Booking Reference",
      "Source",
      "Guest Name",
      "Email",
      "Phone",
      "Tour Package",
      "Travelers",
      "Total Price",
      "Status",
      "Payment Status",
      "Travel Date",
      "Created At",
    ];

    const rows = filteredBookings.map((b) => [
      `"${b.reference || b.id || b._id || ""}"`,
      `"${b.source || "web"}"`,
      `"${b.guestName || ""}"`,
      `"${b.email || ""}"`,
      `"${b.phone || ""}"`,
      `"${(b.tourName || "").replace(/"/g, '""')}"`,
      b.travelers || 1,
      b.totalPrice || 0,
      `"${b.status || ""}"`,
      `"${b.paymentStatus || "unpaid"}"`,
      `"${b.travelDate || b.startDate || ""}"`,
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
    showToast("CSV export downloaded successfully!");
  };

  // Status Badge UI Helper
  const renderStatusBadge = (status?: string) => {
    const s = (status || "pending").toLowerCase();
    switch (s) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pending Review
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span>✓</span> Confirmed
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
            <span>✕</span> Rejected
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-slate-100 text-slate-700 border border-slate-300">
            <span>—</span> Cancelled
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-gray-100 text-gray-500 border border-gray-300">
            <span>⏱</span> Expired
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
            <span>★</span> Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-gray-100 text-gray-700 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-2xl text-sm font-semibold flex items-center gap-2.5 animate-in slide-in-from-top-4 ${
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
          }`}
        >
          <span>{toast.type === "success" ? "✓" : "⚠️"}</span>
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Booking Confirmation Inbox
            </h1>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-lg text-white"
              style={{ backgroundColor: currentBrand.color }}
            >
              {currentBrand.label}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Review customer bookings, approve e-tickets, manage customer cancellations, and audit
            email dispatches.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Refresh Button & Timestamp */}
          <button
            type="button"
            onClick={() => loadData(false)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            title="Auto-refreshes every 30 seconds"
          >
            <span className={refreshing ? "animate-spin" : ""}>🔄</span>
            <span>Refresh</span>
            <span className="text-[10px] text-gray-400 font-normal">
              ({lastRefreshedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
            </span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <span>📥</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Status Inbox Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
        {/* Pending (First & Primary) */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("pending");
            setSelectedIds([]);
          }}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "pending"
              ? "bg-amber-500 text-white shadow-sm font-bold"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>⏳ Pending Approval</span>
          {inboxCounts.pending > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === "pending" ? "bg-white text-amber-700" : "bg-amber-100 text-amber-800"
              }`}
            >
              {inboxCounts.pending}
            </span>
          )}
        </button>

        {/* Cancellation Requests Tab */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("cancellation_requests");
            setSelectedIds([]);
          }}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "cancellation_requests"
              ? "bg-rose-600 text-white shadow-sm font-bold"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>⚠️ Cancellation Requests</span>
          {inboxCounts.cancellationRequests > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === "cancellation_requests"
                  ? "bg-white text-rose-700"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {inboxCounts.cancellationRequests}
            </span>
          )}
        </button>

        {/* Confirmed */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("confirmed");
            setSelectedIds([]);
          }}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "confirmed"
              ? "bg-emerald-600 text-white shadow-sm font-bold"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>✓ Confirmed</span>
          {inboxCounts.confirmed > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === "confirmed"
                  ? "bg-white text-emerald-800"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {inboxCounts.confirmed}
            </span>
          )}
        </button>

        {/* Cancelled */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("cancelled");
            setSelectedIds([]);
          }}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "cancelled"
              ? "bg-slate-700 text-white shadow-sm font-bold"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>Cancelled</span>
          {inboxCounts.cancelled > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === "cancelled" ? "bg-white text-slate-800" : "bg-gray-200 text-gray-700"
              }`}
            >
              {inboxCounts.cancelled}
            </span>
          )}
        </button>

        {/* Completed */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("completed");
            setSelectedIds([]);
          }}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "completed"
              ? "bg-blue-600 text-white shadow-sm font-bold"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>Completed</span>
          {inboxCounts.completed > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === "completed" ? "bg-white text-blue-800" : "bg-gray-200 text-gray-700"
              }`}
            >
              {inboxCounts.completed}
            </span>
          )}
        </button>

        {/* Rejected */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("rejected");
            setSelectedIds([]);
          }}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "rejected"
              ? "bg-red-600 text-white shadow-sm font-bold"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>Rejected</span>
          {inboxCounts.rejected > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === "rejected" ? "bg-white text-red-800" : "bg-gray-200 text-gray-700"
              }`}
            >
              {inboxCounts.rejected}
            </span>
          )}
        </button>

        {/* Expired */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("expired");
            setSelectedIds([]);
          }}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "expired"
              ? "bg-gray-600 text-white shadow-sm font-bold"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>Expired</span>
          {inboxCounts.expired > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === "expired" ? "bg-white text-gray-800" : "bg-gray-200 text-gray-700"
              }`}
            >
              {inboxCounts.expired}
            </span>
          )}
        </button>

        {/* All */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("all");
            setSelectedIds([]);
          }}
          className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "all"
              ? "bg-gray-900 text-white shadow-sm font-bold"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>All ({inboxCounts.total})</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="flex-1 w-full flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-gray-50/50">
          <span className="text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Search by reference, guest name, email, phone, or package…"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs sm:text-sm text-gray-900 bg-transparent focus:outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Module Vertical Filter */}
        <div className="w-full md:w-auto flex items-center gap-2">
          <select
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full md:w-auto px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Modules</option>
            <option value="tour">🗺️ Tours & Activities</option>
            <option value="hotel">🏨 Hotels</option>
            <option value="flight">✈️ Flights</option>
            <option value="transfer">🚖 Transfers</option>
            <option value="visa">🛂 Visas</option>
            <option value="restaurant">🍽️ Restaurants</option>
            <option value="package">🌴 Holiday Packages</option>
            <option value="buildpackage">🧩 Custom Package</option>
          </select>

          {/* Date Range Filters */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-700 bg-white"
              title="Date From"
            />
            <span className="text-gray-400 text-xs">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-700 bg-white"
              title="Date To"
            />
          </div>

          {(moduleFilter !== "all" || dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => {
                setModuleFilter("all");
                setDateFrom("");
                setDateTo("");
                setCurrentPage(1);
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Floating / Sticky Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-40 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between flex-wrap gap-3 animate-in slide-in-from-top-2 border border-slate-700">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-blue-500 text-white font-black flex items-center justify-center text-xs">
              {selectedIds.length}
            </span>
            <span className="text-xs sm:text-sm font-bold">
              {selectedIds.length} reservation{selectedIds.length > 1 ? "s" : ""} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={bulkActionLoading}
              onClick={handleBulkApprove}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all cursor-pointer disabled:opacity-50"
            >
              ✓ Approve Selected
            </button>
            <button
              type="button"
              disabled={bulkActionLoading}
              onClick={() => openReasonModal("bulk_reject")}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition-all cursor-pointer disabled:opacity-50"
            >
              ✕ Reject Selected
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
            <p className="text-gray-500 text-xs font-semibold">Loading reservations…</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="text-4xl text-gray-300">📭</div>
            <h3 className="text-sm font-bold text-gray-800">No reservations found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {searchTerm
                ? `No bookings match your query "${searchTerm}".`
                : activeTab === "pending"
                ? "All clear! There are currently no pending bookings requiring approval."
                : activeTab === "cancellation_requests"
                ? "No open cancellation requests from customers."
                : `No reservations under status "${activeTab}".`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length > 0 &&
                        selectedIds.length === filteredBookings.length
                      }
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3.5">Reference / Guest</th>
                  <th className="px-4 py-3.5">Tour Package</th>
                  <th className="px-4 py-3.5">Travelers</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedBookings.map((b) => {
                  const bId = b.id || b._id || "";
                  const isSelected = selectedIds.includes(bId);
                  const isPending = (b.status || "").toLowerCase() === "pending";
                  const isConfirmed = (b.status || "").toLowerCase() === "confirmed";
                  const hasCancellationReq =
                    b.cancellationRequest &&
                    b.cancellationRequest.status &&
                    b.cancellationRequest.status.toLowerCase() === "pending";
                  const isProcessing = actionInProgress === bId;

                  return (
                    <tr
                      key={bId}
                      className={`hover:bg-gray-50/70 transition-colors ${
                        isSelected ? "bg-blue-50/50" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(bId)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Guest & Reference */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {b.reference || bId.slice(0, 8)}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                            {b.source || "web"}
                          </span>
                        </div>
                        <div className="font-bold text-gray-900 text-sm mt-1">
                          {b.guestName || "Guest"}
                        </div>
                        <div className="text-xs text-gray-500">{b.email}</div>
                        {b.phone && <div className="text-[11px] text-gray-400">{b.phone}</div>}
                      </td>

                      {/* Tour Package & Date */}
                      <td className="px-4 py-4 max-w-[220px]">
                        <div className="font-semibold text-gray-900 truncate">
                          {b.snapshot?.title || b.tourName || "Tour Package"}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {b.travelDate
                            ? new Date(b.travelDate).toLocaleDateString()
                            : b.startDate
                            ? new Date(b.startDate).toLocaleDateString()
                            : "Flexible"}
                        </div>
                        {b.snapshot?.destination && (
                          <div className="text-[11px] text-gray-400">
                            {typeof b.snapshot.destination === "object"
                              ? ((b.snapshot.destination as any).cityName || (b.snapshot.destination as any).address || (b.snapshot.destination as any).country || "Destination")
                              : b.snapshot.destination}
                          </div>
                        )}
                      </td>

                      {/* Travelers */}
                      <td className="px-4 py-4 text-xs text-gray-700">
                        <span className="font-bold">{b.travelers || 1} Person(s)</span>
                        {b.adults ? (
                          <div className="text-[11px] text-gray-400">
                            {b.adults}A {b.children ? `, ${b.children}C` : ""}
                          </div>
                        ) : null}
                      </td>

                      {/* Investment */}
                      <td className="px-4 py-4">
                        <div className="font-black text-gray-900 text-sm">
                          ${(b.totalPrice || 0).toLocaleString()}
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            b.paymentStatus === "paid"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {b.paymentStatus || "unpaid"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        {renderStatusBadge(b.status)}
                        {hasCancellationReq && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              ⚠️ Cancellation Requested
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* If Pending: Approve & Reject */}
                          {isPending && (
                            <>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleConfirm(bId, b.reference)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                              >
                                {isProcessing ? "…" : "✓ Approve"}
                              </button>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() =>
                                  openReasonModal("reject", bId, b.reference, b.guestName)
                                }
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold border border-rose-200 transition-all cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* If Confirmed: Cancel & Resend Email */}
                          {isConfirmed && (
                            <>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleResendEmail(bId, b.reference)}
                                className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                title="Resend digital voucher email"
                              >
                                ✉ Email
                              </button>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() =>
                                  openReasonModal("cancel", bId, b.reference, b.guestName)
                                }
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold border border-rose-200 transition-all cursor-pointer"
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {/* Cancellation Review Button */}
                          {hasCancellationReq && (
                            <button
                              type="button"
                              onClick={() => setReviewModal({ isOpen: true, booking: b })}
                              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
                            >
                              Review Request
                            </button>
                          )}

                          {/* Details Drawer */}
                          <button
                            type="button"
                            onClick={() => {
                              setDrawerBooking(b);
                              setDrawerTab("overview");
                            }}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            Details →
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {filteredBookings.length > 0 && (
              <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <span>Showing</span>
                  <span className="font-bold text-gray-900">
                    {(currentPage - 1) * pageSize + 1}
                  </span>
                  <span>to</span>
                  <span className="font-bold text-gray-900">
                    {Math.min(currentPage * pageSize, filteredBookings.length)}
                  </span>
                  <span>of</span>
                  <span className="font-bold text-gray-900">{filteredBookings.length}</span>
                  <span>reservations</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="ml-2 border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 bg-white"
                  >
                    <option value={10}>10 / page</option>
                    <option value={15}>15 / page</option>
                    <option value={25}>25 / page</option>
                    <option value={50}>50 / page</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    ← Previous
                  </button>
                  <span className="px-3 py-1.5 font-bold text-gray-900 bg-white border border-gray-200 rounded-lg">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── SLIDE-OVER DETAIL DRAWER ─── */}
      {drawerBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-black text-blue-600 bg-blue-100 px-2.5 py-0.5 rounded border border-blue-200">
                    {drawerBooking.reference || drawerBooking.id}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                    via {drawerBooking.source || "web"}
                  </span>
                  {renderStatusBadge(drawerBooking.status)}
                </div>
                <h2 className="text-xl font-black text-gray-900">
                  {drawerBooking.snapshot?.title || drawerBooking.tourName}
                </h2>
                <p className="text-xs text-gray-500">
                  Booked on{" "}
                  {drawerBooking.createdAt
                    ? new Date(drawerBooking.createdAt).toLocaleString()
                    : "Recently"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDrawerBooking(null)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-lg text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Drawer Navigation Tabs */}
            <div className="flex border-b border-gray-200 px-6 bg-white text-xs font-bold">
              <button
                type="button"
                onClick={() => setDrawerTab("overview")}
                className={`py-3 px-4 border-b-2 cursor-pointer transition-colors ${
                  drawerTab === "overview"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                Reservation Overview
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab("history")}
                className={`py-3 px-4 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
                  drawerTab === "history"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                <span>Audit Timeline</span>
                <span className="px-1.5 py-0.2 rounded-full bg-gray-100 text-[10px]">
                  {drawerBooking.statusHistory?.length || 1}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab("outbox")}
                className={`py-3 px-4 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
                  drawerTab === "outbox"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                <span>Email Dispatches</span>
                <span className="px-1.5 py-0.2 rounded-full bg-gray-100 text-[10px]">
                  {outboxLogs.length}
                </span>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* TAB 1: OVERVIEW */}
              {drawerTab === "overview" && (
                <div className="space-y-6 text-sm">
                  {/* Lead Guest Card */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Lead Traveler Information
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-400 block">Full Name</span>
                        <span className="font-bold text-gray-900 text-sm">
                          {drawerBooking.guestName}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Email Address</span>
                        <span className="font-bold text-gray-900">{drawerBooking.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Contact Phone</span>
                        <span className="font-bold text-gray-900">
                          {drawerBooking.phone || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Travel Date</span>
                        <span className="font-bold text-gray-900">
                          {drawerBooking.travelDate
                            ? new Date(drawerBooking.travelDate).toLocaleDateString()
                            : drawerBooking.startDate
                            ? new Date(drawerBooking.startDate).toLocaleDateString()
                            : "Flexible"}
                        </span>
                      </div>
                    </div>

                    {drawerBooking.specialRequest && (
                      <div className="pt-2 border-t border-gray-200 text-xs">
                        <span className="font-bold text-gray-700 block">Special Requests:</span>
                        <span className="text-gray-600">{drawerBooking.specialRequest}</span>
                      </div>
                    )}
                  </div>

                  {/* Tour Snapshot */}
                  {drawerBooking.snapshot && (
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Tour Snapshot Details
                      </h4>
                      <div className="flex gap-4 items-center">
                        {drawerBooking.snapshot.coverImage && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={drawerBooking.snapshot.coverImage}
                            alt=""
                            className="w-16 h-16 rounded-xl object-cover"
                          />
                        )}
                        <div>
                          <div className="font-bold text-gray-900">
                            {drawerBooking.snapshot.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {typeof drawerBooking.snapshot.destination === "object" && drawerBooking.snapshot.destination !== null
                              ? ((drawerBooking.snapshot.destination as any).cityName || (drawerBooking.snapshot.destination as any).address || (drawerBooking.snapshot.destination as any).country || "Destination")
                              : (drawerBooking.snapshot.destination || "Destination")} • {drawerBooking.snapshot.duration || "Standard"}
                          </div>
                        </div>
                      </div>

                      {drawerBooking.snapshot.itinerarySummary &&
                        drawerBooking.snapshot.itinerarySummary.length > 0 && (
                          <div className="pt-2 border-t border-gray-200">
                            <span className="text-xs font-bold text-gray-700 block mb-1">
                              Snapshot Itinerary Highlights:
                            </span>
                            <div className="space-y-1 text-xs text-gray-600">
                              {drawerBooking.snapshot.itinerarySummary.slice(0, 3).map((item) => (
                                <div key={item.day} className="flex gap-2">
                                  <span className="font-bold text-blue-600 shrink-0">
                                    Day {item.day}:
                                  </span>
                                  <span className="truncate">{item.title}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Individual Passengers Manifest */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Individual Travelers Manifest
                      </h4>
                      <span className="text-xs font-bold text-gray-700">
                        {drawerBooking.travelersList?.length || drawerBooking.travelers || 1} Guest(s)
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {(drawerBooking.travelersList && drawerBooking.travelersList.length > 0
                        ? drawerBooking.travelersList
                        : [{ name: drawerBooking.guestName, type: "Adult" }]
                      ).map((trv, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-gray-200 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            <div>
                              <span className="font-bold text-gray-900 block">{trv.name}</span>
                              {trv.passportOrId && (
                                <span className="text-[10px] text-gray-400">
                                  ID: {trv.passportOrId}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold text-[10px]">
                              {trv.type || "Adult"}
                            </span>
                            {trv.gender && <span className="capitalize">{trv.gender}</span>}
                            {trv.age ? <span>{trv.age}y</span> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Financial Summary
                    </h4>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Total Investment:</span>
                      <span className="font-black text-gray-900 text-base">
                        ${(drawerBooking.totalPrice || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Payment Status:</span>
                      <span className="font-bold uppercase text-emerald-700">
                        {drawerBooking.paymentStatus || "unpaid"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: STATUS AUDIT HISTORY TIMELINE */}
              {drawerTab === "history" && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Complete State Transition Audit Trail
                  </h4>

                  {drawerBooking.statusHistory && drawerBooking.statusHistory.length > 0 ? (
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                      {drawerBooking.statusHistory.map((item, idx) => (
                        <div key={idx} className="relative space-y-1">
                          <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow" />
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-gray-900 uppercase">
                              {item.action || item.status}
                            </span>
                            <span className="text-gray-400">
                              {new Date(item.changedAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">
                            {item.previousStatus ? (
                              <span>
                                Transition:{" "}
                                <strong className="text-gray-800">{item.previousStatus}</strong> →{" "}
                                <strong className="text-blue-600">{item.status}</strong>
                              </span>
                            ) : (
                              <span>
                                Status set to{" "}
                                <strong className="text-blue-600">{item.status}</strong>
                              </span>
                            )}
                          </div>
                          {(item.reason || item.note) && (
                            <div className="text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-gray-700 italic">
                              "{item.reason || item.note}"
                            </div>
                          )}
                          <div className="text-[10px] text-gray-400">
                            Triggered by: {item.actorRole || "System"}{" "}
                            {item.actorId ? `(${item.actorId})` : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No transition history logged yet.</p>
                  )}
                </div>
              )}

              {/* TAB 3: EMAIL OUTBOX LOGS */}
              {drawerTab === "outbox" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Customer & Admin Email Dispatches
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleResendEmail(drawerBooking.id || drawerBooking._id || "")}
                      className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100"
                    >
                      + Enqueue New Confirmation Email
                    </button>
                  </div>

                  {loadingOutbox ? (
                    <div className="p-8 text-center text-xs text-gray-400">
                      Loading email logs…
                    </div>
                  ) : outboxLogs.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-400 bg-gray-50 rounded-xl">
                      No emails queued or sent for this booking yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {outboxLogs.map((log) => (
                        <div
                          key={log.id}
                          className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs space-y-2"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-bold text-gray-900 block">{log.subject}</span>
                              <span className="text-[11px] text-gray-500">
                                To: {log.recipientEmail} ({log.recipientName || "Guest"})
                              </span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                log.status === "Sent"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : log.status === "Failed"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {log.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-500 pt-1 border-t border-gray-200">
                            <div>Template: {log.template}</div>
                            <div>
                              Attempts: {log.attempts} / {log.maxAttempts}
                            </div>
                            <div>Created: {new Date(log.createdAt).toLocaleString()}</div>
                            <div>
                              {log.sentAt ? `Sent: ${new Date(log.sentAt).toLocaleString()}` : "Pending"}
                            </div>
                          </div>

                          {log.lastError && (
                            <div className="p-2 bg-rose-50 text-rose-700 rounded text-[11px] font-mono">
                              Error: {log.lastError}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  handleDelete(
                    drawerBooking.id || drawerBooking._id || "",
                    drawerBooking.guestName
                  )
                }
                className="px-3 py-2 text-rose-600 hover:text-rose-800 font-bold text-xs"
              >
                Delete Record
              </button>

              <div className="flex items-center gap-2">
                {(drawerBooking.status || "").toLowerCase() === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        openReasonModal(
                          "reject",
                          drawerBooking.id || drawerBooking._id || "",
                          drawerBooking.reference,
                          drawerBooking.guestName
                        )
                      }
                      className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 font-bold text-xs hover:bg-rose-100"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleConfirm(
                          drawerBooking.id || drawerBooking._id || "",
                          drawerBooking.reference
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow"
                    >
                      ✓ Approve Reservation
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setDrawerBooking(null)}
                  className="px-4 py-2 rounded-xl bg-gray-900 text-white font-bold text-xs hover:bg-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: REJECT / CANCEL WITH MANDATORY REASON ─── */}
      {reasonModal && reasonModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-xl font-bold mx-auto">
              ⚠️
            </div>
            <div className="text-center">
              <h3 className="text-lg font-black text-gray-900">
                {reasonModal.type === "bulk_reject"
                  ? `Bulk Reject ${selectedIds.length} Reservations`
                  : reasonModal.type === "cancel"
                  ? `Cancel Reservation ${reasonModal.bookingRef || ""}`
                  : `Reject Reservation ${reasonModal.bookingRef || ""}`}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Please provide a clear reason for the customer. This explanation will be included in
                the automated email notification.
              </p>
            </div>

            <form onSubmit={handleReasonSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Reason for Decision <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="e.g. Tour fully booked for requested departure date, seasonal maintenance closure, etc."
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={reasonSubmitting}
                  onClick={() => setReasonModal(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={reasonSubmitting}
                  className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow disabled:opacity-50"
                >
                  {reasonSubmitting ? "Processing…" : "Confirm Decision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: REVIEW CUSTOMER CANCELLATION REQUEST ─── */}
      {reviewModal && reviewModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold mx-auto">
              📋
            </div>
            <div className="text-center">
              <h3 className="text-lg font-black text-gray-900">Review Cancellation Request</h3>
              <p className="text-xs text-gray-500 mt-1">
                Ref: <strong>{reviewModal.booking.reference}</strong> ({reviewModal.booking.guestName})
              </p>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-xl text-xs text-gray-700 space-y-1.5 border border-gray-200">
              <div className="font-bold text-gray-900">Customer Reason:</div>
              <p className="italic">
                "{reviewModal.booking.cancellationRequest?.reason || "No reason provided"}"
              </p>
              <div className="text-[10px] text-gray-400">
                Requested on:{" "}
                {reviewModal.booking.cancellationRequest?.requestedAt
                  ? new Date(reviewModal.booking.cancellationRequest.requestedAt).toLocaleString()
                  : "Recently"}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Admin Note to Customer (Optional)
              </label>
              <textarea
                rows={2}
                value={reviewAdminNote}
                onChange={(e) => setReviewAdminNote(e.target.value)}
                placeholder="Refund processed or policy explanation..."
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={reviewSubmitting}
                onClick={() => handleReviewCancellation(false)}
                className="w-1/2 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-50"
              >
                Decline Request
              </button>
              <button
                type="button"
                disabled={reviewSubmitting}
                onClick={() => handleReviewCancellation(true)}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow disabled:opacity-50"
              >
                {reviewSubmitting ? "Processing…" : "Approve & Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}