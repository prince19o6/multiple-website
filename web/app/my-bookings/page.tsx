"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import { useAuth } from "@/lib/auth/AuthContext";
import type { Booking } from "@/lib/api";
import QrCodeSvg from "@/components/QrCodeSvg";

type StatusTab = "all" | "pending" | "confirmed" | "completed" | "cancelled";

function formatDate(dateStr: string | Date | undefined): string {
  if (!dateStr) return "Confirmed Dates";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(dateStr);
  }
}

function MyBookingsContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const config = useSiteConfig();
  const { user, loading: authLoading, getAccessToken } = useAuth();
  const siteId: string = String(
    (params?.site as string) || (config as any)?.siteId || config?.id || "gujjutours"
  );
  const lang: string = String((params?.lang as string) || "en");
  const currency = typeof config.currencySymbol === "string" ? config.currencySymbol : "$";
  const siteName = typeof config.name === "string" ? config.name : "Travel Platform";

  // Tab & Filter States
  const [activeTab, setActiveTab] = useState<StatusTab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Data States
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Authenticated User Detection
  const [userEmail, setUserEmail] = useState<string | null>(user?.email || null);
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(user));
  const [customerRefs, setCustomerRefs] = useState<string[]>([]);

  useEffect(() => {
    if (user?.email) {
      setUserEmail(user.email);
      setIsLoggedIn(true);
    }
  }, [user]);

  // Guest Lookup State
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [lookupRef, setLookupRef] = useState("");
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Detail Modal & E-Ticket Modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [ticketModalBooking, setTicketModalBooking] = useState<Booking | null>(null);

  // Customer Cancellation Request Modal
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Check login state and customer bookings on mount
  useEffect(() => {
    try {
      const refParam = searchParams.get("ref");
      if (refParam) {
        setLookupRef(refParam);
        setShowLookupModal(true);
      }

      if (user?.email) {
        setUserEmail(user.email);
        setIsLoggedIn(true);
      } else {
        // Check for user identity stored in localStorage
        const storedUser =
          localStorage.getItem(`auth_user_${siteId}`) ||
          localStorage.getItem("customer_user") ||
          localStorage.getItem("user_info") ||
          localStorage.getItem("admin_user");

        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed?.email) {
            setUserEmail(parsed.email);
            setIsLoggedIn(true);
          }
        } else {
          const directEmail = localStorage.getItem("customer_email");
          if (directEmail) {
            setUserEmail(directEmail);
            setIsLoggedIn(true);
          } else if (!authLoading) {
            setUserEmail(null);
            setIsLoggedIn(false);
          }
        }
      }

      const savedRefs = localStorage.getItem("customer_booking_refs");
      if (savedRefs) {
        const parsed = JSON.parse(savedRefs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCustomerRefs(parsed);
        }
      }
    } catch {
      // ignore parsing error
    }
  }, [searchParams, siteId, user, authLoading]);

  // Fetch bookings list scoped strictly to current user/customer
  const loadBookings = useCallback(async () => {
    if (authLoading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token =
        getAccessToken() ||
        (typeof window !== "undefined"
          ? localStorage.getItem(`auth_token_${siteId}`) ||
            localStorage.getItem("auth_token_gujjutours") ||
            localStorage.getItem("auth_token_tripgoasia") ||
            localStorage.getItem("auth_token_technoheaven") ||
            localStorage.getItem("token")
          : null);

      const effectiveEmail = user?.email || userEmail;

      if (!effectiveEmail && customerRefs.length === 0 && !token) {
        setBookings([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      const reqParams = new URLSearchParams();
      if (effectiveEmail) {
        reqParams.append("email", effectiveEmail);
      }
      if (customerRefs.length > 0) {
        reqParams.append("ids", customerRefs.join(","));
      }

      if (activeTab !== "all") reqParams.append("status", activeTab);
      if (searchTerm.trim()) reqParams.append("search", searchTerm.trim());
      reqParams.append("page", String(currentPage));
      reqParams.append("pageSize", String(pageSize));
      reqParams.append("site", siteId);

      const reqHeaders: Record<string, string> = {
        "X-Site-Id": siteId,
        "X-Website-Id": siteId,
      };
      if (token) {
        reqHeaders["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/bookings?${reqParams.toString()}`, {
        headers: reqHeaders,
        cache: "no-store",
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to load bookings");
      }

      if (Array.isArray(json.data)) {
        setBookings(json.data as Booking[]);
        setTotalCount(typeof json.count === "number" ? json.count : json.data.length);
      } else {
        setBookings([]);
        setTotalCount(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error connecting to bookings service.");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [authLoading, getAccessToken, user, userEmail, customerRefs, activeTab, searchTerm, currentPage, pageSize, siteId]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Handle Guest Lookup
  const handleGuestLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupRef.trim() || !lookupEmail.trim()) {
      setLookupError("Please enter both reservation reference and guest email.");
      return;
    }

    setLookupLoading(true);
    setLookupError(null);

    try {
      const res = await fetch(`/api/bookings/lookup?site=${encodeURIComponent(siteId)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Site-Id": siteId,
          "X-Website-Id": siteId,
        },
        body: JSON.stringify({ reference: lookupRef.trim(), email: lookupEmail.trim() }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "No reservation found matching these details.");
      }

      const found = json.data as Booking;
      setBookings((prev) => {
        const exists = prev.some((b) => b.reference === found.reference || b.id === found.id);
        return exists ? prev : [found, ...prev];
      });

      try {
        const updatedRefs = Array.from(new Set([...customerRefs, found.reference]));
        localStorage.setItem("customer_booking_refs", JSON.stringify(updatedRefs));
        setCustomerRefs(updatedRefs);
      } catch {
        // ignore
      }

      setShowLookupModal(false);
      setSelectedBooking(found);
      showToast(`Reservation ${found.reference} loaded successfully!`);
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setLookupLoading(false);
    }
  };

  // Handle Customer Cancellation Request
  const handleConfirmCancel = async () => {
    if (!cancelModalBooking) return;
    if (!cancelReason.trim()) {
      showToast("Please provide a brief reason for your cancellation request.", "error");
      return;
    }
    setCancelling(true);

    try {
      const targetId = cancelModalBooking.reference || cancelModalBooking.id;
      const res = await fetch(`/api/bookings/${encodeURIComponent(targetId)}?site=${encodeURIComponent(siteId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Site-Id": siteId,
          "X-Website-Id": siteId,
        },
        body: JSON.stringify({
          action: "request-cancellation",
          email: cancelModalBooking.email,
          reason: cancelReason.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to submit cancellation request.");
      }

      showToast(`Cancellation request for ${cancelModalBooking.reference} has been submitted for review.`);
      setCancelModalBooking(null);
      setCancelReason("");
      loadBookings();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error submitting cancellation request", "error");
    } finally {
      setCancelling(false);
    }
  };

  // Status Tab Counts
  const statusCounts = useMemo(() => {
    const counts = { all: totalCount, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    bookings.forEach((b) => {
      const st = (b.status || "").toLowerCase();
      if (st === "pending") counts.pending++;
      if (st === "confirmed") counts.confirmed++;
      if (st === "completed") counts.completed++;
      if (st === "cancelled" || st === "rejected") counts.cancelled++;
    });
    return counts;
  }, [bookings, totalCount]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Render Status Badge with accessible styles
  const renderStatusBadge = (status?: string) => {
    const s = (status || "pending").toLowerCase();
    switch (s) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Pending Confirmation
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span>✓</span> Confirmed &amp; Ticket Issued
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <span>✕</span> Request Declined
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-surface-2 text-foreground-muted border border-border">
            <span>—</span> Cancelled
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-surface-2 text-foreground-subtle border border-border">
            <span>⏱</span> Request Expired
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <span>★</span> Completed Journey
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase bg-surface-2 text-foreground border border-border">
            {status}
          </span>
        );
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Toast Alert */}
        {toastMessage && (
          <div
            className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-soft-xl text-white text-sm font-semibold flex items-center gap-2 animate-in slide-in-from-top-4 ${
              toastMessage.type === "error" ? "bg-red-600" : "bg-emerald-600"
            }`}
          >
            <span>{toastMessage.type === "error" ? "✕" : "✓"}</span>
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">My Bookings</h1>
            <p className="text-foreground-muted text-sm mt-1">
              Track live reservation statuses, review itinerary details, and view official boarding passes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setLookupError(null);
                setShowLookupModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground font-semibold text-xs shadow-soft-sm hover:bg-surface-2 transition-all cursor-pointer"
            >
              <span>🔍</span> Find by Reference
            </button>

            <Link
              href={`/${lang}/tours`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-primary-contrast font-semibold text-xs shadow-soft-sm hover:shadow-soft-md transition-all cursor-pointer"
            >
              <span>+</span> Book a Tour
            </Link>
          </div>
        </div>

        {/* Guest Banner if Unauthenticated */}
        {!isLoggedIn && (
          <div className="p-4 rounded-2xl bg-primary-light border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-foreground">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">💡</span>
              <div>
                <span className="font-bold">Looking up a reservation?</span> Click &quot;Find by Reference&quot;
                above with your booking code (e.g. <code className="bg-surface px-1.5 py-0.5 rounded border border-border">GT-2026-XXXX</code>) or sign in to view all your past travels.
              </div>
            </div>
            <Link
              href={`/${lang}/login?redirect=${encodeURIComponent(`/${lang}/my-bookings`)}`}
              className="shrink-0 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-primary-contrast font-bold text-center transition-colors shadow-soft-sm"
            >
              Sign In
            </Link>
          </div>
        )}

        {/* Search & Status Filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Segmented Filter Pills */}
          <div className="flex items-center bg-surface-2 p-1 rounded-xl gap-1 overflow-x-auto text-xs font-semibold border border-border">
            {(["all", "pending", "confirmed", "completed", "cancelled"] as StatusTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg capitalize transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab
                    ? "bg-surface text-foreground shadow-soft-sm font-bold"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                <span>{tab}</span>
                {statusCounts[tab] > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      activeTab === tab
                        ? "bg-surface-2 text-foreground font-bold"
                        : "bg-surface-3 text-foreground-muted"
                    }`}
                  >
                    {statusCounts[tab]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative max-w-xs w-full">
            <input
              type="text"
              placeholder="Search reference, tour, guest…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-surface border border-border rounded-xl focus:border-primary text-foreground outline-none shadow-soft-sm placeholder:text-foreground-subtle"
            />
            <span className="absolute left-3 top-2.5 text-foreground-subtle text-xs">🔍</span>
          </div>
        </div>

        {/* Bookings List Area */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-surface rounded-2xl border border-border p-5 space-y-4 animate-pulse">
                <div className="h-40 bg-surface-2 rounded-xl" />
                <div className="h-4 bg-surface-2 rounded w-3/4" />
                <div className="h-3 bg-surface-2 rounded w-1/2" />
                <div className="flex justify-between pt-2">
                  <div className="h-6 bg-surface-2 rounded w-20" />
                  <div className="h-6 bg-surface-2 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-surface rounded-2xl border border-red-200 dark:border-red-900/40 p-10 text-center space-y-4">
            <div className="text-3xl text-red-500">⚠️</div>
            <h3 className="text-base font-bold text-foreground">Failed to load reservations</h3>
            <p className="text-xs text-foreground-muted max-w-md mx-auto">{error}</p>
            <button
              type="button"
              onClick={loadBookings}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-primary-contrast font-semibold text-xs shadow-soft-sm cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-border p-12 text-center space-y-4 shadow-soft-sm">
            <div className="w-16 h-16 bg-surface-2 text-foreground-subtle rounded-full flex items-center justify-center mx-auto text-2xl">
              🎒
            </div>
            <h3 className="text-lg font-bold text-foreground">No reservations found</h3>
            <p className="text-xs text-foreground-muted max-w-md mx-auto">
              {activeTab !== "all"
                ? `You have no ${activeTab} tour bookings right now.`
                : "You haven't booked any experiences yet or need to look up your reservation code."}
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowLookupModal(true)}
                className="px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground font-semibold text-xs hover:bg-surface-2 cursor-pointer shadow-soft-sm"
              >
                Find by Reference Code
              </button>
              <Link
                href={`/${lang}/tours`}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-primary-contrast font-semibold text-xs shadow-soft-sm"
              >
                Explore Destinations
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bookings.map((booking) => {
              const tourTitle = booking.snapshot?.title || booking.tourName || "Tour Experience";
              const tourCover =
                booking.snapshot?.coverImage ||
                booking.tourImage ||
                (booking as any)?.image ||
                (booking as any)?.imageUrl ||
                (booking as any)?.snapshot?.image ||
                "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80";
              const ref = booking.reference || String(booking.id || "");
              const rawDest = booking.snapshot?.destination || booking.destination;
              const dest = typeof (rawDest as any) === "object" && rawDest !== null
                ? ((rawDest as any).cityName || (rawDest as any).address || (rawDest as any).country || "Destination")
                : (rawDest || "Destination");
              const dur = booking.snapshot?.duration || booking.duration || "Multi-Day";
              const travelDateText = formatDate(booking.travelDate || booking.startDate);
              const total = booking.priceBreakdown?.total ?? booking.totalPrice ?? 0;
              const source = booking.source || "web";

              const statusLower = (booking.status || "pending").toLowerCase();
              const isConfirmed = statusLower === "confirmed";
              const isPending = statusLower === "pending";
              const isCancelled = statusLower === "cancelled";
              const isRejected = statusLower === "rejected";
              const isCompleted = statusLower === "completed";

              return (
                <div
                  key={ref}
                  className="bg-surface rounded-2xl border border-border overflow-hidden shadow-soft-sm hover:shadow-soft-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {/* Card Cover */}
                    <div className="relative h-44 bg-surface-3 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={tourCover}
                        alt={tourTitle}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Reference Badge & Source */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className="font-mono text-[11px] font-extrabold bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-md border border-white/20">
                          {ref}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/20 backdrop-blur-md text-white">
                          via {source}
                        </span>
                      </div>

                      {/* Title & Location */}
                      <div className="absolute bottom-3 left-4 right-4 text-white">
                        <h3 className="font-black text-base line-clamp-1">{tourTitle}</h3>
                        <p className="text-xs text-white/80">{dest} • {dur}</p>
                      </div>
                    </div>

                    {/* Card Details */}
                    <div className="p-5 space-y-3">
                      {/* Status Announcement Banner */}
                      {isPending && (
                        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                          <span className="text-base">⏳</span>
                          <div>
                            <span className="font-bold block">Awaiting Confirmation</span>
                            Our concierge desk is reviewing your booking. You will receive an email once approved.
                          </div>
                        </div>
                      )}

                      {isRejected && (
                        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl p-3 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2">
                          <span className="text-base">✕</span>
                          <div>
                            <span className="font-bold block">Booking Request Not Approved</span>
                            Please view trip details or check your email for the reason and refund details.
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-foreground-subtle font-bold block uppercase text-[10px]">Travel Date</span>
                          <span className="font-bold text-foreground">{travelDateText}</span>
                        </div>
                        <div>
                          <span className="text-foreground-subtle font-bold block uppercase text-[10px]">Travelers</span>
                          <span className="font-bold text-foreground">
                            {booking.travelers || 1} Guests
                            {booking.adults ? ` (${booking.adults}A${booking.children ? `, ${booking.children}C` : ""})` : ""}
                          </span>
                        </div>
                        <div>
                          <span className="text-foreground-subtle font-bold block uppercase text-[10px]">Lead Passenger</span>
                          <span className="font-semibold text-foreground truncate block">{booking.guestName}</span>
                        </div>
                        <div>
                          <span className="text-foreground-subtle font-bold block uppercase text-[10px]">Current Status</span>
                          <div className="mt-0.5">{renderStatusBadge(booking.status)}</div>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="border-t border-border pt-3 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-foreground-subtle">Total Investment</span>
                          <div className="text-base font-extrabold text-primary">
                            {currency}{total.toFixed(2)}
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">
                          Payment: {booking.paymentStatus || "Unpaid"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="bg-surface-2 border-t border-border px-5 py-3 flex items-center justify-between gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSelectedBooking(booking)}
                      className="text-xs font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
                    >
                      Trip Details &amp; History →
                    </button>

                    <div className="flex items-center gap-2">
                      {/* Gated E-Ticket Button: ONLY displayed when status is CONFIRMED */}
                      {isConfirmed ? (
                        <button
                          type="button"
                          onClick={() => setTicketModalBooking(booking)}
                          className="px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 shadow-soft-sm cursor-pointer flex items-center gap-1"
                        >
                          <span>📱</span>
                          <span>E-Ticket QR</span>
                        </button>
                      ) : isPending ? (
                        <span
                          className="px-2.5 py-1 rounded-lg bg-surface-3 text-foreground-subtle text-[11px] font-semibold cursor-not-allowed"
                          title="E-ticket unlocks once concierge confirms this reservation"
                        >
                          E-Ticket (Pending Approval)
                        </span>
                      ) : null}

                      {/* WhatsApp Share Link */}
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `My booking for ${booking.snapshot?.title || booking.tourName || "trip"} (${booking.reference}) is ${booking.status}. Total: ${currency}${booking.totalPrice}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg border border-border bg-surface text-foreground-muted hover:text-emerald-600 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1"
                        title="Share on WhatsApp"
                      >
                        <span>💬</span>
                        <span className="hidden sm:inline">WhatsApp</span>
                      </a>

                      {/* Request Cancellation for pending or confirmed */}
                      {!isCancelled && !isRejected && !isCompleted && (
                        <button
                          type="button"
                          onClick={() => setCancelModalBooking(booking)}
                          className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-surface text-rose-700 dark:text-rose-300 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                        >
                          Request Cancellation
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-border bg-surface text-foreground text-xs font-semibold disabled:opacity-40 shadow-soft-sm cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs font-semibold text-foreground-muted px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-border bg-surface text-foreground text-xs font-semibold disabled:opacity-40 shadow-soft-sm cursor-pointer"
            >
              Next
            </button>
          </div>
        )}

        {/* ─── MODAL 1: TRIP DETAILS & AUDIT HISTORY SNAPSHOT ─── */}
        {selectedBooking && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface text-foreground rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-soft-xl border border-border p-6 sm:p-8 space-y-6">
              <div className="flex items-start justify-between border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-extrabold text-primary bg-primary-light px-2 py-0.5 rounded">
                      Ref: {selectedBooking.reference}
                    </span>
                    {renderStatusBadge(selectedBooking.status)}
                  </div>
                  <h2 className="text-xl font-black text-foreground">
                    {selectedBooking.snapshot?.title || selectedBooking.tourName}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="p-1.5 text-foreground-subtle hover:text-foreground text-lg font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Status History Timeline */}
              {selectedBooking.statusHistory && selectedBooking.statusHistory.length > 0 && (
                <div className="space-y-3 bg-surface-2 p-4 rounded-2xl border border-border">
                  <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                    Reservation Status Timeline
                  </h4>
                  <div className="space-y-2 text-xs">
                    {selectedBooking.statusHistory.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1 shrink-0" />
                        <div>
                          <div className="font-bold text-foreground capitalize">
                            {item.status} ({new Date(item.changedAt).toLocaleString()})
                          </div>
                          {item.note && <p className="text-foreground-muted italic">&ldquo;{item.note}&rdquo;</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Itinerary Schedule */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                  Confirmed Itinerary Plan
                </h4>
                {selectedBooking.snapshot?.itinerarySummary && selectedBooking.snapshot.itinerarySummary.length > 0 ? (
                  <div className="space-y-2.5">
                    {selectedBooking.snapshot.itinerarySummary.map((item) => (
                      <div key={item.day} className="p-3 bg-surface-2 rounded-xl border border-border text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-primary text-primary-contrast">
                            Day {item.day}
                          </span>
                          <span className="font-bold text-foreground">{item.title}</span>
                        </div>
                        {item.description && (
                          <p className="text-foreground-muted pl-8 leading-relaxed">{item.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-foreground-subtle italic">Full day-by-day plan confirmed upon check-in.</p>
                )}
              </div>

              {/* Inclusions */}
              {selectedBooking.snapshot?.includedSummary && selectedBooking.snapshot.includedSummary.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider">What&apos;s Included</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedBooking.snapshot.includedSummary.map((inc, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-100 dark:border-emerald-800">
                        ✓ {inc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Passengers Manifest */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                    Individual Passenger Manifest
                  </h4>
                  <span className="text-[11px] text-foreground-subtle font-semibold">
                    {selectedBooking.travelersList?.length || selectedBooking.travelers || 1} Traveler(s)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(selectedBooking.travelersList && selectedBooking.travelersList.length > 0
                    ? selectedBooking.travelersList
                    : [{ name: selectedBooking.guestName, type: "Adult" as const }]
                  ).map((trv, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-3 rounded-xl bg-surface-2 border border-border text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-contrast font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-foreground block">{trv.name}</span>
                          {trv.passportOrId && (
                            <span className="text-[10px] text-foreground-subtle">ID: {trv.passportOrId}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-foreground-muted text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-surface border border-border text-[10px] font-semibold text-foreground">
                          {trv.type}
                        </span>
                        {trv.gender && <span className="capitalize">{trv.gender}</span>}
                        {trv.age ? <span>{trv.age}y</span> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="px-5 py-2.5 rounded-xl border border-border bg-surface text-foreground font-semibold text-xs hover:bg-surface-2 cursor-pointer shadow-soft-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── MODAL 2: PRINTABLE E-TICKET (CONFIRMED ONLY) ─── */}
        {ticketModalBooking && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface text-foreground rounded-3xl max-w-md w-full shadow-soft-xl border border-border p-6 sm:p-8 space-y-6 relative print:border-none print:shadow-none">
              <button
                type="button"
                onClick={() => setTicketModalBooking(null)}
                className="absolute top-4 right-4 p-1.5 text-foreground-subtle hover:text-foreground text-lg font-bold print:hidden cursor-pointer"
              >
                ✕
              </button>

              <div className="text-center space-y-1">
                <div className="text-xs uppercase font-extrabold tracking-widest text-primary">{siteName}</div>
                <h3 className="text-xl font-black text-foreground">Official Boarding Pass</h3>
                <p className="text-xs text-foreground-muted">Present this QR pass to your tour guide or hotel concierge.</p>
              </div>

              {/* Center Vector QR Code */}
              <div className="flex flex-col items-center justify-center p-5 bg-surface-2 border border-border rounded-2xl">
                <QrCodeSvg value={ticketModalBooking.reference} size={150} />
                <span className="font-mono text-sm font-extrabold text-foreground mt-3 tracking-widest">
                  {ticketModalBooking.reference}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full mt-1 border border-emerald-200 dark:border-emerald-800">
                  ✓ Verified Active
                </span>
              </div>

              {/* Summary Details */}
              <div className="space-y-2 text-xs border-t border-border pt-4">
                <div className="flex justify-between">
                  <span className="text-foreground-subtle">Experience</span>
                  <span className="font-bold text-foreground text-right max-w-[65%] truncate">
                    {ticketModalBooking.snapshot?.title || ticketModalBooking.tourName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-subtle">Travel Date</span>
                  <span className="font-bold text-foreground">
                    {formatDate(ticketModalBooking.travelDate || ticketModalBooking.startDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-subtle">Passenger</span>
                  <span className="font-bold text-foreground">{ticketModalBooking.guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-subtle">Total Investment</span>
                  <span className="font-extrabold text-primary">
                    {currency}{(ticketModalBooking.priceBreakdown?.total ?? ticketModalBooking.totalPrice).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 rounded-xl border border-border bg-surface text-foreground font-semibold text-xs hover:bg-surface-2 flex items-center justify-center gap-1.5 cursor-pointer shadow-soft-sm"
                >
                  <span>🖨️</span> Print Pass
                </button>
                <button
                  type="button"
                  onClick={() => setTicketModalBooking(null)}
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-primary-contrast font-semibold text-xs shadow-soft-sm cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── MODAL 3: GUEST LOOKUP ─── */}
        {showLookupModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface text-foreground rounded-3xl max-w-md w-full shadow-soft-xl border border-border p-6 sm:p-8 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-black text-foreground">Find Your Reservation</h3>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    Enter the booking reference code from your email.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLookupModal(false)}
                  className="text-foreground-subtle hover:text-foreground text-lg font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {lookupError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-xs rounded-xl font-medium">
                  {lookupError}
                </div>
              )}

              <form onSubmit={handleGuestLookup} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-foreground mb-1">Booking Reference</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GT-2026-8F3K9Q"
                    value={lookupRef}
                    onChange={(e) => setLookupRef(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2.5 bg-surface-2 border border-border rounded-xl font-mono text-xs text-foreground focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-foreground mb-1">Guest Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. traveler@example.com"
                    value={lookupEmail}
                    onChange={(e) => setLookupEmail(e.target.value)}
                    className="w-full px-3 py-2.5 bg-surface-2 border border-border rounded-xl text-xs text-foreground focus:border-primary outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLookupModal(false)}
                    className="w-1/3 py-2.5 rounded-xl border border-border bg-surface text-foreground font-semibold cursor-pointer hover:bg-surface-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={lookupLoading}
                    className="w-2/3 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-primary-contrast font-semibold shadow-soft-sm disabled:opacity-50 cursor-pointer"
                  >
                    {lookupLoading ? "Searching…" : "Find Reservation"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── MODAL 4: CUSTOMER CANCELLATION REQUEST WITH POLICY ─── */}
        {cancelModalBooking && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface text-foreground rounded-3xl max-w-md w-full shadow-soft-xl border border-border p-6 sm:p-8 space-y-4">
              <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center text-xl mx-auto font-bold">
                ⚠️
              </div>
              <div className="text-center">
                <h3 className="text-base font-black text-foreground">Request Cancellation</h3>
                <p className="text-xs text-foreground-muted mt-1">
                  Reservation <strong>{cancelModalBooking.reference}</strong> (
                  {cancelModalBooking.snapshot?.title || cancelModalBooking.tourName})
                </p>
              </div>

              {/* Cancellation Policy Box */}
              <div className="bg-surface-2 border border-border rounded-xl p-3.5 text-xs text-foreground-muted space-y-1">
                <span className="font-bold text-foreground block">Cancellation Policy:</span>
                <p>
                  Cancellations requested at least 48 hours before departure are eligible for a full refund.
                  Requests within 48 hours may be subject to supplier fees. Our concierge desk reviews every
                  request promptly.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-foreground mb-1">
                  Reason for Cancellation <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please let us know why you need to cancel (change of plans, medical, etc.)"
                  className="w-full p-2.5 bg-surface-2 border border-border rounded-xl text-xs text-foreground outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={() => setCancelModalBooking(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-border bg-surface text-foreground font-semibold text-xs cursor-pointer hover:bg-surface-2"
                >
                  Keep Reservation
                </button>
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={handleConfirmCancel}
                  className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-soft-sm disabled:opacity-50 cursor-pointer"
                >
                  {cancelling ? "Submitting…" : "Submit Request"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function MyBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="w-10 h-10 border-4 border-border border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <MyBookingsContent />
    </Suspense>
  );
}
