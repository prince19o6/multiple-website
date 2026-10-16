"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import type { Booking } from "@/lib/api";

function formatDate(dateStr: string | Date | undefined): string {
  if (!dateStr) return "TBD";
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

function BookingsContent() {
  const config = useSiteConfig();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<"lookup" | "email">("lookup");
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [emailBookings, setEmailBookings] = useState<Booking[]>([]);
  const [recentRefs, setRecentRefs] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);

  const primary = config?.theme?.primary || "#2563eb";
  const currency: string = typeof config?.currencySymbol === "string" ? config.currencySymbol : "$";
  const siteName: string = typeof config?.name === "string" ? config.name : "Travel Platform";
  const supportPhone = config?.contact?.phone || "+1 (800) 555-0199";
  const supportEmail = config?.contact?.email || "support@travelplatform.com";

  // Load saved recent references on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("toursapp_recent_bookings");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setRecentRefs(parsed.slice(0, 5));
      }
    } catch {
      // Ignore localStorage read errors
    }
  }, []);

  // Save reference to recent list
  const saveRecentRef = useCallback((ref: string) => {
    if (!ref) return;
    try {
      setRecentRefs((prev) => {
        const updated = Array.from(new Set([ref, ...prev])).slice(0, 5);
        try {
          localStorage.setItem("toursapp_recent_bookings", JSON.stringify(updated));
        } catch {
          // Ignore write error
        }
        return updated;
      });
    } catch {
      // Ignore localStorage write errors
    }
  }, []);

  // Lookup single booking by Reference or ID
  const handleLookupByReference = useCallback(
    async (refToSearch?: string) => {
      const searchTarget = (refToSearch || reference).trim();
      if (!searchTarget) {
        setError("Please enter a valid reservation reference (e.g. GUJ-2026-0001).");
        return;
      }

      setLoading(true);
      setError(null);
      setCancelSuccess(null);

      try {
        const res = await fetch(`/api/bookings/${encodeURIComponent(searchTarget)}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || "Reservation not found. Please verify your reference number.");
        }

        setCurrentBooking(json.data);
        saveRecentRef(json.data.reference || searchTarget);
      } catch (err) {
        setCurrentBooking(null);
        setError(err instanceof Error ? err.message : "Failed to retrieve booking.");
      } finally {
        setLoading(false);
      }
    },
    [reference, saveRecentRef]
  );

  // Auto-search if ref param exists in URL
  useEffect(() => {
    const queryRef = searchParams.get("ref");
    if (queryRef) {
      setReference(queryRef);
      handleLookupByReference(queryRef);
    }
  }, [searchParams, handleLookupByReference]);

  // Lookup all bookings by Email
  const handleLookupByEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your booking email address.");
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentBooking(null);
    setCancelSuccess(null);

    try {
      const res = await fetch(`/api/bookings?email=${encodeURIComponent(email.trim())}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "No reservations found for this email address.");
      }

      if (!json.data || json.data.length === 0) {
        setError(`No reservations found under "${email}". Please verify the email used at checkout.`);
        setEmailBookings([]);
      } else {
        setEmailBookings(json.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search reservations.");
      setEmailBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Cancel reservation
  const handleCancelBooking = async () => {
    if (!currentBooking) return;
    const confirmCancel = window.confirm(
      `Are you sure you want to cancel booking ${currentBooking.reference}? This action cannot be undone.`
    );
    if (!confirmCancel) return;

    setCancelling(true);
    try {
      const bookingId = currentBooking.id || currentBooking.reference || "";
      const res = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", email: currentBooking.email }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to cancel reservation.");
      }

      setCurrentBooking({
        ...currentBooking,
        status: "cancelled",
      });
      setCancelSuccess("Your reservation has been cancelled. A confirmation email has been dispatched.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to cancel reservation.");
    } finally {
      setCancelling(false);
    }
  };

  // Copy reference helper
  const handleCopyReference = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header Banner */}
        <div className="text-center mb-8">
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-white mb-3 shadow-sm"
            style={{ backgroundColor: primary }}
          >
            Traveler Self-Service
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Manage Your Reservations
          </h1>
          <p className="mt-2 text-base text-slate-600 max-w-xl mx-auto">
            View booking confirmations, download e-ticket vouchers, and review itinerary details for trips with {siteName}.
          </p>
        </div>

        {/* Tab Selection */}
        {!currentBooking && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 mb-8">
            <div className="flex border-b border-slate-200 mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("lookup");
                  setError(null);
                }}
                className={`pb-3 px-4 font-semibold text-sm transition-colors relative ${
                  activeTab === "lookup" ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Find by Reference
                {activeTab === "lookup" && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ backgroundColor: primary }}
                  />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("email");
                  setError(null);
                }}
                className={`pb-3 px-4 font-semibold text-sm transition-colors relative ${
                  activeTab === "email" ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Find by Email
                {activeTab === "email" && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ backgroundColor: primary }}
                  />
                )}
              </button>
            </div>

            {/* Tab: By Reference */}
            {activeTab === "lookup" && (
              <div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleLookupByReference();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label htmlFor="ref-input" className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                      Booking Reference Number
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        id="ref-input"
                        type="text"
                        value={reference}
                        onChange={(e) => setReference(e.target.value.toUpperCase())}
                        placeholder="e.g. GUJ-2026-XXXX"
                        className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-900 font-mono tracking-wider focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
                        required
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 rounded-xl font-bold text-white transition-opacity shadow-md disabled:opacity-50 hover:opacity-90"
                        style={{ backgroundColor: primary }}
                      >
                        {loading ? "Searching..." : "Look Up"}
                      </button>
                    </div>
                  </div>

                  {recentRefs.length > 0 && (
                    <div className="pt-2">
                      <span className="text-xs text-slate-500 mr-2">Recent Searches:</span>
                      <div className="inline-flex flex-wrap gap-1.5 mt-1">
                        {recentRefs.map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => {
                              setReference(r);
                              handleLookupByReference(r);
                            }}
                            className="text-xs font-mono px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Tab: By Email */}
            {activeTab === "email" && (
              <div>
                <form onSubmit={handleLookupByEmail} className="space-y-4">
                  <div>
                    <label htmlFor="email-input" className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                      Guest Email Address
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        id="email-input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@example.com"
                        className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        required
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 rounded-xl font-bold text-white transition-opacity shadow-md disabled:opacity-50 hover:opacity-90"
                        style={{ backgroundColor: primary }}
                      >
                        {loading ? "Searching..." : "Find Trips"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* List of Bookings Found By Email */}
        {!currentBooking && emailBookings.length > 0 && (
          <div className="space-y-4 mb-8">
            <h2 className="text-xl font-bold text-slate-900">
              Found {emailBookings.length} {emailBookings.length === 1 ? "Reservation" : "Reservations"}
            </h2>
            <div className="grid gap-4">
              {emailBookings.map((b) => (
                <div
                  key={b.reference || b.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{b.reference}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${
                          b.status === "confirmed"
                            ? "bg-emerald-100 text-emerald-800"
                            : b.status === "cancelled"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {b.status || "Pending"}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-slate-800">{b.tourName}</h3>
                    <p className="text-xs text-slate-500">
                      📅 {formatDate(b.startDate)} &bull; {b.travelers || 1} {b.travelers === 1 ? "Traveler" : "Travelers"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-extrabold text-slate-900">
                      {currency}
                      {b.totalPrice?.toLocaleString() ?? 0}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentBooking(b);
                        saveRecentRef(b.reference || b.id || "");
                      }}
                      className="px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90"
                      style={{ backgroundColor: primary }}
                    >
                      View Voucher
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Reservation Voucher */}
        {currentBooking && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentBooking(null)}
                className="text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
              >
                &larr; Back to Search
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 shadow-sm hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <span>🖨️</span>
                  <span>Print Voucher</span>
                </button>
              </div>
            </div>

            {cancelSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
                <span>✅</span>
                <span>{cancelSuccess}</span>
              </div>
            )}

            {/* Voucher Card */}
            <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden print:border-none print:shadow-none">
              {/* Voucher Top Header */}
              <div
                className="p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                style={{ backgroundColor: primary }}
              >
                <div>
                  <span className="text-xs uppercase tracking-widest font-semibold opacity-85">
                    Official E-Ticket Voucher
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">{siteName}</h2>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-xs uppercase tracking-wider opacity-85 block">Booking Reference</span>
                  <div className="flex items-center sm:justify-end gap-2 mt-1">
                    <span className="text-xl sm:text-2xl font-mono font-black tracking-wider">
                      {currentBooking.reference}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyReference(currentBooking.reference || currentBooking.id || "")}
                      className="p-1 rounded bg-white/20 hover:bg-white/30 text-xs transition-colors"
                      title="Copy reference code"
                    >
                      {copied ? "✓ Copied" : "📋 Copy"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Ribbon */}
              <div className="px-6 py-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 uppercase">Status:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full capitalize ${
                      currentBooking.status === "confirmed"
                        ? "bg-emerald-100 text-emerald-800"
                        : currentBooking.status === "cancelled"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {currentBooking.status || "Pending"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 uppercase">Payment:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full capitalize ${
                      currentBooking.paymentStatus === "paid"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-800"
                    }`}
                  >
                    {currentBooking.paymentStatus || "Unpaid"} ({currentBooking.paymentMethod || "standard"})
                  </span>
                </div>
              </div>

              {/* Main Voucher Body */}
              <div className="p-6 sm:p-8 space-y-8">
                {/* Tour Package Info */}
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  {currentBooking.tourImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentBooking.tourImage}
                      alt={currentBooking.tourName}
                      className="w-full sm:w-44 h-32 rounded-2xl object-cover shadow-sm border border-slate-200 shrink-0"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      Confirmed Experience
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                      {currentBooking.tourName}
                    </h3>
                    {currentBooking.location && (
                      <p className="text-sm text-slate-500 flex items-center gap-1.5">
                        <span>📍</span>
                        <span>{currentBooking.location}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Itinerary & Travel Dates Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div>
                    <span className="text-xs uppercase font-bold text-slate-400 block mb-1">Departure Date</span>
                    <span className="text-sm font-semibold text-slate-800">{formatDate(currentBooking.startDate)}</span>
                  </div>
                  <div>
                    <span className="text-xs uppercase font-bold text-slate-400 block mb-1">Return Date</span>
                    <span className="text-sm font-semibold text-slate-800">{formatDate(currentBooking.endDate)}</span>
                  </div>
                  <div>
                    <span className="text-xs uppercase font-bold text-slate-400 block mb-1">Party Size</span>
                    <span className="text-sm font-semibold text-slate-800">
                      {currentBooking.travelers} {currentBooking.travelers === 1 ? "Traveler" : "Travelers"}
                    </span>
                  </div>
                </div>

                {/* Lead Passenger & Contact Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                      Lead Passenger Information
                    </h4>
                    <dl className="text-sm space-y-1.5">
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <dt className="text-slate-500">Full Name:</dt>
                        <dd className="font-semibold text-slate-800">{currentBooking.guestName}</dd>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <dt className="text-slate-500">Email Address:</dt>
                        <dd className="font-semibold text-slate-800 break-all">{currentBooking.email}</dd>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <dt className="text-slate-500">Phone Number:</dt>
                        <dd className="font-semibold text-slate-800">{currentBooking.phone || "Not provided"}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                      Payment & Billing Summary
                    </h4>
                    <dl className="text-sm space-y-1.5">
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <dt className="text-slate-500">Total Price:</dt>
                        <dd className="font-extrabold text-lg text-slate-900">
                          {currentBooking.currency || currency}
                          {currentBooking.totalPrice?.toLocaleString() ?? 0}
                        </dd>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <dt className="text-slate-500">Payment Status:</dt>
                        <dd className="font-semibold capitalize text-slate-800">
                          {currentBooking.paymentStatus || "Unpaid"}
                        </dd>
                      </div>
                      {currentBooking.paymentReference && (
                        <div className="flex justify-between border-b border-slate-100 pb-1">
                          <dt className="text-slate-500">Transaction ID:</dt>
                          <dd className="font-mono text-xs text-slate-600">{currentBooking.paymentReference}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>

                {/* Important Notice */}
                <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
                  <p className="font-bold mb-1">Important Traveler Information:</p>
                  <p>
                    Please present this voucher along with a government-issued photo ID upon tour check-in. Pickup
                    instructions, driver contacts, and day-by-day briefing notes will be forwarded 24 hours prior to departure.
                  </p>
                </div>

                {/* Customer Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 print:hidden">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-sm hover:opacity-90"
                      style={{ backgroundColor: primary }}
                    >
                      Print E-Ticket Voucher
                    </button>
                    {currentBooking.status !== "cancelled" && (
                      <button
                        type="button"
                        onClick={handleCancelBooking}
                        disabled={cancelling}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-50"
                      >
                        {cancelling ? "Processing..." : "Cancel Reservation"}
                      </button>
                    )}
                  </div>

                  <Link
                    href="/explore"
                    className="text-sm font-semibold text-slate-600 hover:text-slate-900 underline"
                  >
                    Explore More Tours &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Support Helpline Box */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center text-xs text-slate-500 print:hidden">
              <p className="font-bold text-slate-800 text-sm mb-1">Need assistance with your booking?</p>
              <p>
                Contact our customer support team at{" "}
                <a href={`tel:${supportPhone.replace(/\s+/g, "")}`} className="text-blue-600 font-semibold hover:underline">
                  {supportPhone}
                </a>{" "}
                or email{" "}
                <a href={`mailto:${supportEmail}`} className="text-blue-600 font-semibold hover:underline">
                  {supportEmail}
                </a>
                .
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Loading bookings portal...</p>
          </div>
        </div>
      }
    >
      <BookingsContent />
    </Suspense>
  );
}
