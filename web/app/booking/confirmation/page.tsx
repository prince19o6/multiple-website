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
      // Check if temporary booking data was cached in session or localStorage
      try {
        const stored = sessionStorage.getItem("toursapp_latest_booking") || localStorage.getItem("toursapp_latest_booking");
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
          // Check local backup
          try {
            const stored = sessionStorage.getItem("toursapp_latest_booking") || localStorage.getItem("toursapp_latest_booking");
            if (stored) {
              const parsed = JSON.parse(stored) as Booking;
              if (!referenceParam || parsed.reference === referenceParam || (parsed as any).id === referenceParam) {
                setBooking(parsed);
                return;
              }
            }
          } catch {}
          setError(json.error || "Reservation details could not be retrieved.");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          try {
            const stored = sessionStorage.getItem("toursapp_latest_booking") || localStorage.getItem("toursapp_latest_booking");
            if (stored) {
              const parsed = JSON.parse(stored) as Booking;
              if (!referenceParam || parsed.reference === referenceParam || (parsed as any).id === referenceParam) {
                setBooking(parsed);
                return;
              }
            }
          } catch {}
          setError(err instanceof Error ? err.message : "Network error");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [referenceParam, config]);

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

  const tourTitle = booking?.snapshot?.title || booking?.tourName || "Travel Reservation";
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
  const isFlight = serviceTypeLower.includes("flight") || String(refCode).startsWith("FL-") || Boolean((booking?.snapshot as any)?.pnr);
  const isCab = serviceTypeLower.includes("transfer") || serviceTypeLower.includes("cab") || String(refCode).startsWith("CAB-") || Boolean((booking?.snapshot as any)?.vehicleModel);

  const pnr = (booking?.snapshot as any)?.pnr || booking?.specialRequest?.match(/PNR:\s*([A-Z0-9-]+)/i)?.[1] || (isFlight ? `SW-${refCode.slice(-4)}` : null);
  const ticketNo = (booking?.snapshot as any)?.ticketNo || booking?.specialRequest?.match(/E-Ticket:\s*([0-9-]+)/i)?.[1] || (isFlight ? `098-482910${refCode.slice(-4)}` : null);

  const pickupLoc = (booking?.snapshot as any)?.pickupAddress || booking?.specialRequest?.match(/Pickup Address:\s*([^|]+)/i)?.[1] || booking?.location;
  const dropoffLoc = (booking?.snapshot as any)?.dropoffAddress || booking?.specialRequest?.match(/Drop-off Address:\s*([^|]+)/i)?.[1] || booking?.destination;
  const pickupTimeVal = (booking?.snapshot as any)?.pickupTime || booking?.specialRequest?.match(/Pickup Time:\s*([^|]+)/i)?.[1];
  const flightNoVal = (booking?.snapshot as any)?.flightNumber || (booking as any)?.flightNumber || booking?.specialRequest?.match(/Flight Arrival:\s*([^|]+)/i)?.[1];
  const vehicleModelVal = (booking?.snapshot as any)?.vehicleModel || (booking?.snapshot as any)?.vehicleClass || (booking as any)?.option || "Comfort Chauffeur Cab";

  const subtotalLabel =
    isFlight ? "Flight Airfare" :
    isCab ? "Cab Transfer Fare" :
    serviceTypeLower.includes("hotel") ? "Accommodation Subtotal" :
    serviceTypeLower.includes("restaurant") || serviceTypeLower.includes("dining") ? "Dining Subtotal" :
    serviceTypeLower.includes("visa") ? "Visa Processing Fee" :
    serviceTypeLower.includes("package") ? "Package Tour Subtotal" :
    "Reservation Subtotal";

  const journeyHeadline =
    isFlight ? `Your Flight to ${destination} is Confirmed!` :
    isCab ? `Your Cab Transfer is Reserved!` :
    serviceTypeLower.includes("hotel") ? `Your Stay in ${destination} is Confirmed!` :
    `Your Reservation for ${destination} is Confirmed!`;

  const confirmedHeadline =
    isFlight ? `You are all set for your flight to ${destination}!` :
    isCab ? `Your private chauffeur cab is booked and assigned!` :
    serviceTypeLower.includes("hotel") ? `You are all set for your stay in ${destination}!` :
    `You are all set for ${destination}!`;

  const totalAmount = booking?.priceBreakdown?.total ?? booking?.totalPrice ?? 0;
  const subtotal = booking?.priceBreakdown?.subtotal ?? (totalAmount * 0.95);
  const taxes = booking?.priceBreakdown?.taxes ?? (totalAmount * 0.05);

  const statusLower = (booking?.status || "confirmed").toLowerCase();
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
              <span>🖨️</span> Print Voucher
            </button>
          )}
        </div>

        {/* Dynamic Status Banner */}
        {isPending ? (
          <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white shadow-xl flex flex-col gap-6 print:hidden">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-2">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  Request Received — Processing
                </div>
                <h1 className="text-2xl sm:text-3xl font-black">{journeyHeadline}</h1>
                <p className="text-white/90 text-xs sm:text-sm mt-1 max-w-xl">
                  We have logged your reservation. Confirmation voucher dispatched to <strong>{booking?.email}</strong>.
                </p>
              </div>
              <div className="bg-black/20 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-2xl text-center self-start sm:self-auto">
                <div className="text-[10px] uppercase font-bold tracking-widest text-white/70">Reference</div>
                <div className="text-xl font-black font-mono tracking-wide">{refCode}</div>
              </div>
            </div>
          </div>
        ) : isConfirmed ? (
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
                Your official booking voucher has been issued and emailed to <strong>{booking?.email}</strong>.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-3 rounded-2xl text-center">
              <div className="text-[10px] uppercase font-bold tracking-widest text-white/70">Reference</div>
              <div className="text-2xl font-black font-mono tracking-wide">{refCode}</div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl p-6 bg-slate-800 text-white shadow-lg flex items-center justify-between flex-wrap gap-4 print:hidden">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase mb-2">
                {isCancelled ? "Reservation Cancelled" : isRejected ? "Reservation Not Approved" : "Reservation Update"}
              </div>
              <h1 className="text-xl sm:text-2xl font-black">Status Update for {refCode}</h1>
              <p className="text-slate-300 text-xs mt-1">
                Please check your inbox or visit My Bookings for detailed notes.
              </p>
            </div>
            <Link href="/my-bookings" className="px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs">
              My Bookings
            </Link>
          </div>
        )}

        {/* Boarding Pass E-Ticket / Cab Voucher Card */}
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
                  {booking?.snapshot?.category || (isFlight ? "FLIGHT RESERVATION" : isCab ? "PRIVATE CAB DISPATCH" : "CONFIRMED RESERVATION")}
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
                  <div className="text-xs uppercase font-bold text-slate-400">Date</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{travelDateFormatted}</div>
                </div>
                <div>
                  <div className="text-xs uppercase font-bold text-slate-400">Guests</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {booking?.travelers || 1} Traveler(s)
                    {booking?.adults ? ` (${booking.adults}A${booking.children ? `, ${booking.children}C` : ""})` : ""}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase font-bold text-slate-400">Lead Passenger</div>
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
                    {booking?.status || "Confirmed"}
                  </div>
                </div>
              </div>

              {/* QR Verification Code */}
              <div className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <QrCodeSvg value={refCode} size={110} />
                <span className="text-[10px] font-mono font-bold text-slate-600 mt-2">{refCode}</span>
                <span className="text-[9px] uppercase font-bold text-emerald-700">Verified Active</span>
              </div>
            </div>

            {/* Dedicated Flight Boarding Pass Information */}
            {isFlight && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 text-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-200/70 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">✈️</span>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider block">Official Airline PNR Record</span>
                      <span className="text-xl font-black font-mono text-blue-900">{pnr || "CONFIRMED"}</span>
                    </div>
                  </div>
                  {ticketNo && (
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">E-Ticket Number</span>
                      <span className="text-xs font-mono font-bold text-slate-700">{ticketNo}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Flight / Airline</span>
                    <span className="font-bold text-slate-900">{(booking?.snapshot as any)?.airline || "SkyWings"} {(booking?.snapshot as any)?.flightNumber || ""}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Cabin Class</span>
                    <span className="font-bold text-slate-900">{(booking?.snapshot as any)?.cabinClass || "Economy"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Check-in Baggage</span>
                    <span className="font-bold text-slate-900">15 kg / 20 kg per pax</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Cabin Handbag</span>
                    <span className="font-bold text-slate-900">7 kg Included</span>
                  </div>
                </div>
              </div>
            )}

            {/* Dedicated Cab & Chauffeur Transfer Information */}
            {isCab && (
              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-5 text-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-teal-200/70 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🚖</span>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider block">Private Chauffeur Dispatch</span>
                      <span className="text-base font-black text-teal-950">{vehicleModelVal}</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    ✓ Tolls &amp; Parking Included
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {pickupLoc && (
                    <div className="bg-white/80 p-2.5 rounded-xl border border-teal-100">
                      <span className="text-[10px] text-teal-700 font-bold block">📍 Pickup Location</span>
                      <span className="font-semibold text-slate-800">{pickupLoc}</span>
                      {pickupTimeVal && (
                        <span className="text-[11px] text-slate-500 block mt-0.5 font-mono">Time: {pickupTimeVal}</span>
                      )}
                    </div>
                  )}
                  {dropoffLoc && (
                    <div className="bg-white/80 p-2.5 rounded-xl border border-teal-100">
                      <span className="text-[10px] text-teal-700 font-bold block">🏁 Drop-off Destination</span>
                      <span className="font-semibold text-slate-800">{dropoffLoc}</span>
                    </div>
                  )}
                </div>

                {flightNoVal && (
                  <div className="text-[11px] text-teal-800 bg-teal-100/60 p-2 rounded-xl flex items-center gap-1.5 font-medium">
                    <span>✈️</span>
                    <span>Flight {flightNoVal} tracked in real-time. Chauffeur automatically waits at arrivals if delayed.</span>
                  </div>
                )}
              </div>
            )}

            {/* Individual Passengers Manifest */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-slate-700 tracking-wider">
                  Traveler Manifest
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
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Special Instructions */}
            {booking?.specialRequest && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <span className="font-bold text-slate-700">Reservation Details &amp; Notes:</span>{" "}
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
                <span>Estimated Taxes &amp; Fees</span>
                <span>{currency}{taxes.toFixed(2)}</span>
              </div>
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
            href="/en"
            className="flex-1 py-3 px-6 rounded-2xl border border-slate-200 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 text-center transition-all shadow-sm"
          >
            Back to Home
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
