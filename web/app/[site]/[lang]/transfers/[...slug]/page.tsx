"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter, notFound } from "next/navigation";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import { useSite } from "@/lib/SiteContext";
import { getTransferBySlug } from "@/lib/api/transfers";
import { LoadingSkeleton, ErrorState } from "@/components/common";
import EnquiryModal from "@/components/lead/EnquiryModal";

interface TransferDetail {
  id: number | string;
  transferNumericId?: number;
  transferId?: string;
  title: string;
  name?: string;
  slug: string;
  transferType: string;
  transferTypeLabel: string;
  vehicleType: string;
  vehicleLabel: string;
  vehicleModel: string;
  maxPassengers: number;
  maxLuggage: number;
  airConditioned: boolean;
  pickupLocation: string;
  dropoffLocation: string;
  city: string;
  country: string;
  durationMinutes: number;
  estimatedDuration: string;
  price: number;
  originalPrice?: number;
  currency: string;
  image: string;
  freeCancellation: boolean;
  meetAndGreet: boolean;
  flightMonitoring: boolean;
  tollIncluded: boolean;
  rating: number;
  reviews: number;
}

export default function TransferDetailPage() {
  const params = useParams();
  const router = useRouter();
  const config = useSiteConfig();
  const site = useSite();

  const siteId = site.siteId || "gujjutours";
  const currencySymbol = config.currencySymbol || (siteId === "gujjutours" ? "₹" : "$");

  const slugParam = params?.slug;
  const transferPath = Array.isArray(slugParam)
    ? slugParam[slugParam.length - 1]
    : typeof slugParam === "string"
    ? slugParam
    : "";

  const [transfer, setTransfer] = useState<TransferDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pickupDate, setPickupDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  });
  const [pickupTime, setPickupTime] = useState("10:00");
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [passengers, setPassengers] = useState(2);
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);

  const fetchTransfer = useCallback(async () => {
    if (!transferPath) return;
    setLoading(true);
    setError(null);

    try {
      let t: any = null;
      try {
        t = await getTransferBySlug(transferPath, { siteId });
      } catch {
        // Direct call failed — query same-origin Next.js proxy
        const res = await fetch(`/api/transfers/${encodeURIComponent(transferPath)}?site=${encodeURIComponent(siteId)}`);
        if (res.ok) {
          const json = await res.json();
          t = json?.data ?? json;
        }
      }

      if (!t || (!t.title && !t.pickupLocation && !t.vehicleModel && !t.id)) {
        const localRes = await fetch(`/api/transfers/${encodeURIComponent(transferPath)}?site=${encodeURIComponent(siteId)}`);
        if (localRes.ok) {
          const localJson = await localRes.json();
          t = localJson?.data ?? localJson;
        }
      }

      if (t && (t.title || t.pickupLocation || t.vehicleModel || t.id)) {
        const title = t.title || t.name || `${t.pickupLocation || "Pickup"} to ${t.dropoffLocation || "Dropoff"} Transfer`;
        const vehicleType = t.vehicleType || "Sedan";
        const vehicleModel = t.vehicleModel || (vehicleType === "SUV" ? "Toyota Innova Crysta" : vehicleType === "Luxury" ? "Mercedes E-Class / BMW 5" : "Toyota Etios / Dzire");
        const vehicleLabel = t.vehicleLabel || `${vehicleType} Transfer`;
        const maxPassengers = Number(t.maxPassengers || t.capacityPassengers || 3);
        const maxLuggage = Number(t.maxLuggage || t.capacityLuggage || 2);
        const pickup = t.pickupLocation || "City Airport";
        const dropoff = t.dropoffLocation || "City Hotels";
        const durationMins = Number(t.durationMinutes || t.estimatedMinutes || 45);

        const img = t.image || (Array.isArray(t.images) && t.images[0]) || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&q=85";

        setTransfer({
          id: t.id || t.transferNumericId || transferPath,
          transferNumericId: t.transferNumericId,
          title,
          name: title,
          slug: t.slug || transferPath,
          transferType: t.transferType || "airport",
          transferTypeLabel: t.transferTypeLabel || "Airport & City Transfer",
          vehicleType,
          vehicleLabel,
          vehicleModel,
          maxPassengers,
          maxLuggage,
          airConditioned: t.airConditioned !== false,
          pickupLocation: pickup,
          dropoffLocation: dropoff,
          city: t.city || pickup.split(",")[0] || "Destination",
          country: t.country || (siteId === "gujjutours" ? "India" : "UAE"),
          durationMinutes: durationMins,
          estimatedDuration: t.estimatedDuration || `${durationMins} Mins`,
          price: Number(t.price || 1250),
          originalPrice: t.originalPrice ? Number(t.originalPrice) : undefined,
          currency: t.currency || (siteId === "gujjutours" ? "INR" : "USD"),
          image: img,
          freeCancellation: t.freeCancellation !== false,
          meetAndGreet: t.meetAndGreet !== false,
          flightMonitoring: t.flightMonitoring !== false,
          tollIncluded: t.tollIncluded !== false,
          rating: Number(t.rating || 4.8),
          reviews: Number(t.reviews || 95),
        });

        setPickupAddress(pickup);
        setDropoffAddress(dropoff);
      } else {
        setError("Transfer service not found");
      }
    } catch (err: any) {
      if (err?.digest?.includes("NEXT_NOT_FOUND") || err?.message === "NEXT_NOT_FOUND") {
        throw err;
      }
      if (err?.status === 404 || err?.isNotFound) {
        setError("Transfer service not found");
      } else {
        setError(err.message || "Failed to load transfer details");
      }
    } finally {
      setLoading(false);
    }
  }, [transferPath, siteId]);

  useEffect(() => {
    fetchTransfer();
  }, [fetchTransfer]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fafbfc] dark:bg-neutral-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <LoadingSkeleton variant="detail" count={1} />
        </div>
      </main>
    );
  }

  if (error || !transfer) {
    return (
      <main className="min-h-screen bg-[#fafbfc] dark:bg-neutral-950 py-16 px-4">
        <div className="max-w-md mx-auto">
          <ErrorState message={error || "Transfer route not found"} onRetry={fetchTransfer} />
        </div>
      </main>
    );
  }

  const handleBookNow = () => {
    const baseFare = transfer.price;
    const tax = Math.round(baseFare * 0.05);
    const grandTotal = baseFare + tax;
    const primaryImg = transfer.image || "";

    const bookingParams = new URLSearchParams({
      service: "transfer",
      serviceType: "transfer",
      id: String(transfer.id),
      title: transfer.title,
      name: transfer.title,
      vehicle: transfer.vehicleModel,
      option: `${transfer.vehicleLabel} (${transfer.vehicleModel})`,
      pickup: pickupAddress || transfer.pickupLocation,
      dropoff: dropoffAddress || transfer.dropoffLocation,
      date: pickupDate,
      time: pickupTime,
      flightNo: flightNumber,
      passengers: String(passengers),
      adults: String(passengers),
      price: String(baseFare),
      unitPrice: String(baseFare),
      subtotal: String(baseFare),
      tax: String(tax),
      total: String(grandTotal),
      totalPrice: String(grandTotal),
      currency: transfer.currency || (siteId === "gujjutours" ? "INR" : "USD"),
      image: primaryImg,
      imageUrl: primaryImg,
    });

    router.push(`/booking?${bookingParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 pb-20 font-sans">
      {/* ─── Breadcrumb ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <Link href="/" className="hover:underline">Home</Link>
          <span>/</span>
          <Link href="/en/transfers" className="hover:underline">Transfers</Link>
          <span>/</span>
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
            {transfer.city}
          </span>
          <span>/</span>
          <span className="text-neutral-400 truncate max-w-sm">{transfer.vehicleLabel}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ─── Header Information Block ─── */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 uppercase">
              {transfer.transferTypeLabel}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
              📍 {transfer.city}, {transfer.country}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60">
              ★ {transfer.rating} ({transfer.reviews} verified rides)
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white mb-2 leading-tight">
            {transfer.title}
          </h1>

          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
            <span>⏱ Estimated Ride Time: {transfer.estimatedDuration}</span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ Flight Delay Guarantee</span>
          </p>
        </div>

        {/* ─── Main Content Layout ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Vehicle & Route Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle Hero Card */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
              <div className="relative h-64 sm:h-80 w-full bg-neutral-100 dark:bg-neutral-800">
                <Image
                  src={transfer.image}
                  alt={transfer.vehicleModel}
                  fill
                  priority
                  className="object-cover"
                />
                <div className="absolute top-4 left-4 bg-neutral-900/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-xl">
                  {transfer.vehicleType} Class
                </div>
              </div>

              <div className="p-6">
                <h2 className="text-xl font-black text-neutral-900 dark:text-white mb-1">
                  {transfer.vehicleModel}
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">
                  {transfer.vehicleLabel} — Professional chauffeur, sanitized cabin, sanitized air conditioning.
                </p>

                {/* Key Specifications Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👥</span>
                    <div>
                      <div className="text-xs text-neutral-400">Capacity</div>
                      <div className="text-xs font-bold">Max {transfer.maxPassengers} Pax</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🧳</span>
                    <div>
                      <div className="text-xs text-neutral-400">Luggage</div>
                      <div className="text-xs font-bold">Max {transfer.maxLuggage} Bags</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-2xl">❄️</span>
                    <div>
                      <div className="text-xs text-neutral-400">Climate</div>
                      <div className="text-xs font-bold">Air Conditioned</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🛡️</span>
                    <div>
                      <div className="text-xs text-neutral-400">Cancellation</div>
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Free Cancel</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ride Inclusions */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <h3 className="text-base font-black text-neutral-900 dark:text-white mb-4">
                What&apos;s Included In Your Fare
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Meet &amp; Greet with Name Signboard at Arrival Hall</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Complimentary 60 mins airport waiting time</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>All Highway Tolls, Parking Fees &amp; State Taxes</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Flight tracking with automated delayed pickup</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Luggage assistance by uniformed driver</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>24/7 dedicated dispatch hotline support</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Booking Configuration Panel */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-4 sticky top-6">
              <div className="flex items-baseline justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
                <div>
                  <span className="text-xs text-neutral-400">Total Price</span>
                  <div className="text-2xl font-black text-neutral-900 dark:text-white">
                    {currencySymbol}{transfer.price.toLocaleString()}
                  </div>
                </div>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                  All-Inclusive Fare
                </span>
              </div>

              {/* Pickup Address */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Pickup Location / Airport:
                </label>
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="e.g. Airport Arrival Gate"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:ring-2 focus:ring-neutral-700"
                />
              </div>

              {/* Dropoff Address */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Dropoff Location / Hotel Name:
                </label>
                <input
                  type="text"
                  value={dropoffAddress}
                  onChange={(e) => setDropoffAddress(e.target.value)}
                  placeholder="e.g. Hotel Grand Hyatt"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:ring-2 focus:ring-neutral-700"
                />
              </div>

              {/* Date & Time Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="detail-pickup-date-input" className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Pickup Date:
                  </label>
                  <input
                    id="detail-pickup-date-input"
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:ring-2 focus:ring-neutral-700"
                  />
                </div>
                <div>
                  <label htmlFor="detail-pickup-time-input" className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Pickup Time:
                  </label>
                  <input
                    id="detail-pickup-time-input"
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:ring-2 focus:ring-neutral-700"
                  />
                </div>
              </div>

              {/* Flight Number (Optional) */}
              {transfer.transferType === "airport" && (
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Flight Number (For delay tracking):
                  </label>
                  <input
                    type="text"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. 6E-1452 or EK-501"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold uppercase focus:ring-2 focus:ring-neutral-700"
                  />
                </div>
              )}

              {/* Passengers Count */}
              <div>
                <label htmlFor="detail-passengers-select" className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Total Passengers (Max {transfer.maxPassengers}):
                </label>
                <select
                  id="detail-passengers-select"
                  value={passengers}
                  onChange={(e) => setPassengers(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:ring-2 focus:ring-neutral-700"
                >
                  {Array.from({ length: transfer.maxPassengers }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n} {n === 1 ? "Passenger" : "Passengers"}</option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <button
                onClick={handleBookNow}
                className="w-full py-3.5 rounded-xl font-black text-sm text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <span>Book This Transfer</span>
                <span>→</span>
              </button>

              <button
                onClick={() => setIsEnquiryOpen(true)}
                className="w-full py-2.5 rounded-xl font-bold text-xs text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
              >
                💬 Need Custom Multi-Day / Outstation Cab?
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enquiry Modal */}
      {isEnquiryOpen && (
        <EnquiryModal
          isOpen={isEnquiryOpen}
          onClose={() => setIsEnquiryOpen(false)}
          serviceTitle={transfer.title}
          serviceType="transfer"
        />
      )}
    </div>
  );
}
