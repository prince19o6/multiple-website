"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import type { Booking } from "@/lib/api";
import QrCodeSvg from "@/components/QrCodeSvg";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const config = useSiteConfig();
  const theme = config.theme || {};
  const primary = theme.primary || "#2563eb";
  const currency = typeof config.currencySymbol === "string" ? config.currencySymbol : "$";

  const referenceParam = searchParams.get("ref") || searchParams.get("reference") || "";
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(Boolean(referenceParam));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!referenceParam) {
      // Check if temporary booking data was cached in session
      try {
        const stored = sessionStorage.getItem("toursapp_latest_booking");
        if (stored) {
          setBooking(JSON.parse(stored) as Booking);
          return;
        }
      } catch {
        // ignore
      }
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const siteId: string = String((config as any)?.siteId || "gujjutours");
    const token = typeof window !== "undefined"
      ? localStorage.getItem(`auth_token_${siteId}`) ||
        localStorage.getItem("auth_token_gujjutours") ||
        localStorage.getItem("auth_token_tripgoasia") ||
        localStorage.getItem("auth_token_technoheaven") ||
        localStorage.getItem("token")
      : null;

    const headers: Record<string, string> = {
      "X-Site-Id": siteId,
      "X-Website-Id": siteId,
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    fetch(`/api/bookings/${encodeURIComponent(referenceParam)}?site=${encodeURIComponent(siteId)}`, { headers })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.success && json.data) {
          setBooking(json.data as Booking);
        } else {
          setError(json.error || "Reservation details could not be retrieved.");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Network error");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [referenceParam]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div
            className="w-12 h-12 border-4 border-slate-200 rounded-full animate-spin mx-auto"
            style={{ borderTopColor: primary }}
          />
          <p className="text-slate-600 font-semibold text-sm">Loading your confirmation voucher…</p>
        </div>
      </main>
    );
  }

  if (error || (!booking && !referenceParam)) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-slate-200 p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ⚠️
          </div>
          <h1 className="text-xl font-bold text-slate-900">Reservation Lookup</h1>
          <p className="text-slate-600 text-sm">
            {error || "No active reservation reference found. Please visit My Bookings to track your trips."}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href="/my-bookings"
              className="flex-1 py-2.5 px-4 rounded-xl text-white font-semibold text-sm shadow hover:opacity-95 text-center"
              style={{ backgroundColor: primary }}
            >
              Go to My Bookings
            </Link>
            <Link
              href="/explore"
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 text-center"
            >
              Browse Tours
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const tourTitle = booking?.snapshot?.title || booking?.tourName || "Guided Tour Experience";
  const tourImage =
    booking?.snapshot?.coverImage ||
    booking?.tourImage ||
    (booking as any)?.image ||
    (booking as any)?.imageUrl ||
    (booking as any)?.snapshot?.image ||
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80";
  const refCode = booking?.reference || referenceParam;
  const rawDestination = booking?.snapshot?.destination || booking?.destination;
  const destination = typeof (rawDestination as any) === "object" && rawDestination !== null
    ? ((rawDestination as any).cityName || (rawDestination as any).address || (rawDestination as any).country || "Confirmed Destination")
    : (rawDestination || "Confirmed Destination");
  const duration = booking?.snapshot?.duration || booking?.duration || ((booking as any)?.nights ? `${(booking as any).nights} Nights` : "Confirmed Reservation");

  const travelDateFormatted = booking?.travelDate
    ? new Date(booking.travelDate).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" })
    : booking?.startDate
    ? new Date(booking.startDate).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" })
    : "Confirmed Dates";

  const serviceTypeLower = String((booking as any)?.serviceType || (booking as any)?.service || booking?.snapshot?.category || "").toLowerCase();
  const subtotalLabel =
    serviceTypeLower.includes("flight") ? "Flight Airfare" :
    serviceTypeLower.includes("hotel") ? "Accommodation Subtotal" :
    serviceTypeLower.includes("restaurant") || serviceTypeLower.includes("dining") ? "Dining Subtotal" :
    serviceTypeLower.includes("visa") ? "Visa Processing Fee" :
    serviceTypeLower.includes("transfer") ? "Transfer Fare" :
    serviceTypeLower.includes("package") ? "Package Tour Subtotal" :
    "Reservation Subtotal";

  const journeyHeadline =
    serviceTypeLower.includes("flight") ? `Your Flight to ${destination} is Under Review!` :
    serviceTypeLower.includes("hotel") ? `Your Stay in ${destination} is Under Review!` :
    serviceTypeLower.includes("restaurant") || serviceTypeLower.includes("dining") ? `Your Dining Reservation at ${destination} is Under Review!` :
    serviceTypeLower.includes("visa") ? `Your Visa Application for ${destination} is Under Review!` :
    `Your Journey to ${destination} is Under Review!`;

  const confirmedHeadline =
    serviceTypeLower.includes("flight") ? `You are all set for your flight to ${destination}!` :
    serviceTypeLower.includes("hotel") ? `You are all set for your stay in ${destination}!` :
    `You are all set for ${destination}!`;

  const totalAmount = booking?.priceBreakdown?.total ?? booking?.totalPrice ?? 0;
  const subtotal = booking?.priceBreakdown?.subtotal ?? (totalAmount * 0.95);
  const taxes = booking?.priceBreakdown?.taxes ?? (totalAmount * 0.05);

  const statusLower = (booking?.status || "pending").toLowerCase();
  const isConfirmed = statusLower === "confirmed";
  const isPending = statusLower === "pending";
  const isCancelled = statusLower === "cancelled";
  const isRejected = statusLower === "rejected";

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 print:bg-white print:p-0">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between print:hidden">
          <Link
            href="/my-bookings"
            className="text-sm font-semibold hover:underline inline-flex items-center gap-1.5"
            style={{ color: primary }}
          >
            ← View All My Bookings
          </Link>

          {isConfirmed && (
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm cursor-pointer"
            >
              <span>🖨️</span> Print E-Ticket
            </button>
          )}
        </div>

        {/* Dynamic Status Banner */}
        {isPending ? (
          /* Awaiting Confirmation Banner */
          <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white shadow-xl flex flex-col gap-6 print:hidden">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-2">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  Request Received — Awaiting Confirmation
                </div>
                <h1 className="text-2xl sm:text-3xl font-black">
                  {journeyHeadline}
                </h1>
                <p className="text-white/90 text-xs sm:text-sm mt-1 max-w-xl">
                  We have logged your reservation. Our travel concierge is verifying availability and
                  will confirm your booking shortly. A confirmation email has been dispatched to{" "}
                  <strong>{booking?.email}</strong>.
                </p>
              </div>

              <div className="bg-black/20 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-2xl text-center self-start sm:self-auto">
                <div className="text-[10px] uppercase font-bold tracking-widest text-white/70">Reference</div>
                <div className="text-xl font-black font-mono tracking-wide">{refCode}</div>
              </div>
            </div>

            {/* 3-Step Lifecycle Visual Progress Stepper */}
            <div className="border-t border-white/20 pt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-white text-amber-600 font-black flex items-center justify-center shrink-0">
                  ✓
                </span>
                <div>
                  <div className="font-extrabold">1. Booking Placed</div>
                  <div className="text-white/70 text-[11px]">Request logged securely</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-white/30 text-white font-black flex items-center justify-center shrink-0 border border-white">
                  ⏳
                </span>
                <div>
                  <div className="font-extrabold">2. Concierge Review</div>
                  <div className="text-white/70 text-[11px]">Currently in progress</div>
                </div>
              </div>
              <div className="flex items-center gap-3 opacity-60">
                <span className="w-7 h-7 rounded-full bg-white/20 text-white font-black flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <div className="font-extrabold">3. E-Ticket QR Issued</div>
                  <div className="text-white/70 text-[11px]">Unlocks upon confirmation</div>
                </div>
              </div>
            </div>
          </div>
        ) : isConfirmed ? (
          /* Confirmed Luxury Boarding Banner */
          <div
            className="rounded-3xl p-6 sm:p-8 text-white shadow-xl flex items-center justify-between flex-wrap gap-4 print:hidden"
            style={{ backgroundColor: primary }}
          >
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-2">
                <span>✓</span> Reservation Confirmed
              </div>
              <h1 className="text-2xl sm:text-3xl font-black">{confirmedHeadline}</h1>
              <p className="text-white/80 text-xs sm:text-sm mt-1">
                Your official e-ticket pass has been issued and emailed to <strong>{booking?.email}</strong>.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-3 rounded-2xl text-center">
              <div className="text-[10px] uppercase font-bold tracking-widest text-white/70">Reference</div>
              <div className="text-2xl font-black font-mono tracking-wide">{refCode}</div>
            </div>
          </div>
        ) : (
          /* Cancelled or Rejected Banner */
          <div className="rounded-3xl p-6 bg-slate-800 text-white shadow-lg flex items-center justify-between flex-wrap gap-4 print:hidden">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase mb-2">
                {isCancelled ? "Reservation Cancelled" : isRejected ? "Reservation Not Approved" : "Reservation Update"}
              </div>
              <h1 className="text-xl sm:text-2xl font-black">Status Update for {refCode}</h1>
              <p className="text-slate-300 text-xs mt-1">
                Please check your inbox or visit My Bookings for detailed notes and refund assistance.
              </p>
            </div>
            <Link
              href="/my-bookings"
              className="px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs"
            >
              My Bookings
            </Link>
          </div>
        )}

        {/* Boarding Pass E-Ticket Voucher Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
          {/* Card Header with Snapshot Cover */}
          <div className="relative h-48 sm:h-56 bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={tourImage}
              alt={tourTitle}
              className="w-full h-full object-cover opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between text-white">
              <div>
                <span className="px-2.5 py-1 rounded-md bg-white/20 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider">
                  {booking?.snapshot?.category || ((booking as any)?.service ? `${String((booking as any).service).toUpperCase()} RESERVATION` : "CONFIRMED RESERVATION")}
                </span>
                <h2 className="text-xl sm:text-2xl font-black mt-1.5">{tourTitle}</h2>
                <p className="text-xs text-white/80">{destination} • {duration}</p>
              </div>
            </div>
          </div>

          {/* Ticket Body */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
              <div className="sm:col-span-2 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs uppercase font-bold text-slate-400">Travel Date</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{travelDateFormatted}</div>
                </div>
                <div>
                  <div className="text-xs uppercase font-bold text-slate-400">Guests</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {booking?.travelers || 1} Travelers
                    {booking?.adults ? ` (${booking.adults}A${booking.children ? `, ${booking.children}C` : ""})` : ""}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase font-bold text-slate-400">Passenger</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{booking?.guestName}</div>
                </div>
                <div>
                  <div className="text-xs uppercase font-bold text-slate-400">Status</div>
                  <div
                    className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                      isConfirmed
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : isPending
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-slate-100 text-slate-700 border border-slate-300"
                    }`}
                  >
                    {booking?.status || "Pending"}
                  </div>
                </div>
              </div>

              {/* QR Verification Code - Displayed ONLY when Confirmed */}
              {isConfirmed ? (
                <div className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <QrCodeSvg value={refCode} size={110} />
                  <span className="text-[10px] font-mono font-bold text-slate-600 mt-2">{refCode}</span>
                  <span className="text-[9px] uppercase font-bold text-emerald-700">Verified Active</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-4 bg-amber-50/60 border border-dashed border-amber-300 rounded-2xl text-center space-y-1">
                  <span className="text-2xl">🔒</span>
                  <div className="text-xs font-extrabold text-amber-900">QR Code Locked</div>
                  <p className="text-[10px] text-amber-700 leading-tight">
                    Official pass unlocks automatically upon concierge confirmation.
                  </p>
                </div>
              )}
            </div>

            {/* Individual Passengers Manifest */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-slate-700 tracking-wider">
                  Individual Passengers Manifest
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {booking?.travelersList?.length || booking?.travelers || 1} Registered Traveler(s)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {(booking?.travelersList && booking.travelersList.length > 0
                  ? booking.travelersList
                  : [{ name: booking?.guestName || "Primary Passenger", type: "Adult" as const }]
                ).map((trv, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200 text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-full text-white font-bold flex items-center justify-center text-[10px]"
                        style={{ backgroundColor: primary }}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-slate-900 block">{trv.name}</span>
                        {trv.passportOrId && (
                          <span className="text-[10px] text-slate-400">ID: {trv.passportOrId}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-[10px] text-slate-700">
                        {trv.type}
                      </span>
                      {trv.gender && <span className="capitalize text-slate-600">{trv.gender}</span>}
                      {trv.age ? <span className="text-slate-600 font-medium">{trv.age} yrs</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Special Request */}
            {booking?.specialRequest && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <span className="font-bold text-slate-700">Special Instructions:</span>{" "}
                <span className="text-slate-600">{booking.specialRequest}</span>
              </div>
            )}

            {/* Price Breakdown */}
            <div className="border-t border-slate-100 pt-5 space-y-2">
              <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">Payment Breakdown</div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>{subtotalLabel}</span>
                <span>{currency}{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Estimated Taxes & Service Fees</span>
                <span>{currency}{taxes.toFixed(2)}</span>
              </div>
              {((booking as any)?.amountDue && (booking as any).amountDue > 0) ? (
                <div className="flex justify-between text-xs text-amber-800 bg-amber-50 p-2 rounded-lg font-medium border border-amber-200">
                  <span>Advance Paid Today: {currency}{((booking as any).amountPaid || 0).toFixed(2)}</span>
                  <span>Due on Arrival: {currency}{(booking as any).amountDue.toFixed(2)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-100 pt-2">
                <span>Total Amount</span>
                <span style={{ color: primary }}>{currency}{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 print:hidden">
          <Link
            href="/my-bookings"
            className="flex-1 py-3 px-6 rounded-2xl text-white font-bold text-sm shadow-md hover:opacity-95 text-center transition-all"
            style={{ backgroundColor: primary }}
          >
            Go to My Bookings
          </Link>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `My booking for ${tourTitle} is confirmed! Reference: ${refCode}. Total: ${currency}${totalAmount.toFixed(2)}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all shadow-md"
          >
            <span>💬</span> Share on WhatsApp
          </a>
          <Link
            href="/explore"
            className="flex-1 py-3 px-6 rounded-2xl border border-slate-200 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 text-center transition-all shadow-sm"
          >
            Book Another Experience
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-10 h-10 border-4 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
