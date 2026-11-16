"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import { useSite } from "@/lib/SiteContext";
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

const FALLBACK_TRANSFER: TransferDetail = {
  id: 1001,
  transferNumericId: 1001,
  title: "Jaipur: Comfort Executive Sedan - Jaipur Airport to City Hotels One-Way Transfer",
  name: "Jaipur Airport to City Hotels Private Sedan Transfer",
  slug: "jaipur-airport-sedan-transfer-1001",
  transferType: "airport",
  transferTypeLabel: "Airport Transfer",
  vehicleType: "Sedan",
  vehicleLabel: "Comfort Executive Sedan",
  vehicleModel: "Toyota Etios / Suzuki Dzire or equivalent",
  maxPassengers: 3,
  maxLuggage: 2,
  airConditioned: true,
  pickupLocation: "Jaipur International Airport (Arrivals Gate)",
  dropoffLocation: "Jaipur City Center & Verified Hotels",
  city: "Jaipur",
  country: "India",
  durationMinutes: 45,
  estimatedDuration: "45 Mins",
  price: 1250,
  originalPrice: 1550,
  currency: "INR",
  image: "/seed-images/transfers/transfer-sedan.svg",
  freeCancellation: true,
  meetAndGreet: true,
  flightMonitoring: true,
  tollIncluded: true,
  rating: 4.8,
  reviews: 140,
};

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

  const [transfer, setTransfer] = useState<TransferDetail>(FALLBACK_TRANSFER);
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

  useEffect(() => {
    if (!transferPath) return;

    const fetchTransfer = async () => {
      try {
        const res = await fetch(`/api/transfers/${encodeURIComponent(transferPath)}?site=${encodeURIComponent(siteId)}`);
        if (res.ok) {
          const json = await res.json();
          const t = json?.data || json;
          if (t && (t.title || t.vehicleModel)) {
            setTransfer({
              id: t.id || t.transferNumericId || transferPath,
              transferNumericId: t.transferNumericId,
              title: t.title || t.name,
              name: t.name || t.title,
              slug: t.slug || transferPath,
              transferType: t.transferType || "airport",
              transferTypeLabel: t.transferTypeLabel || "Airport Transfer",
              vehicleType: t.vehicleType || "Sedan",
              vehicleLabel: t.vehicleLabel || "Comfort Sedan",
              vehicleModel: t.vehicleModel || "Toyota Etios or equivalent",
              maxPassengers: Number(t.maxPassengers || 3),
              maxLuggage: Number(t.maxLuggage || 2),
              airConditioned: t.airConditioned !== false,
              pickupLocation: t.pickupLocation || FALLBACK_TRANSFER.pickupLocation,
              dropoffLocation: t.dropoffLocation || FALLBACK_TRANSFER.dropoffLocation,
              city: t.city || "Jaipur",
              country: t.country || "India",
              durationMinutes: Number(t.durationMinutes || 45),
              estimatedDuration: t.estimatedDuration || "45 Mins",
              price: Number(t.price || 1250),
              originalPrice: t.originalPrice ? Number(t.originalPrice) : undefined,
              currency: t.currency || currencySymbol,
              image: t.image || "/seed-images/transfers/transfer-sedan.svg",
              freeCancellation: t.freeCancellation !== false,
              meetAndGreet: t.meetAndGreet !== false,
              flightMonitoring: t.flightMonitoring !== false,
              tollIncluded: t.tollIncluded !== false,
              rating: Number(t.rating || 4.8),
              reviews: Number(t.reviews || 95),
            });

            setPickupAddress(t.pickupLocation || "");
            setDropoffAddress(t.dropoffLocation || "");
          }
        }
      } catch (err) {
        console.error("[TransferDetail] Error loading transfer:", err);
      }
    };

    fetchTransfer();
  }, [transferPath, siteId, currencySymbol]);

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
            <span className="px-3 py-1 rounded-full text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40">
              ★ {transfer.rating.toFixed(1)} ({transfer.reviews} verified reviews)
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
            {transfer.title}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Vehicle: <span className="font-semibold text-neutral-800 dark:text-neutral-200">{transfer.vehicleModel}</span> • Air Conditioned • Licensed Commercial Chauffeur
          </p>
        </div>

        {/* ─── Main Details & Booking Sidebar ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle Hero Graphic */}
            <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <Image
                src={transfer.image || "/seed-images/transfers/transfer-sedan.svg"}
                alt={transfer.vehicleLabel}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-black/75 text-white backdrop-blur-sm">
                  👥 Max {transfer.maxPassengers} Passengers
                </span>
                <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-black/75 text-white backdrop-blur-sm">
                  🧳 Max {transfer.maxLuggage} Luggage Bags
                </span>
              </div>
            </div>

            {/* Inclusions & Guarantees */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <h3 className="font-bold text-base text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                <span>🛡️</span>
                <span>Included with Every Private Transfer</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700">
                  <span className="font-bold text-neutral-900 dark:text-white block">✈️ Flight Delay Protection</span>
                  <p className="text-neutral-500 text-xs mt-1">
                    Your chauffeur monitors your flight and waits up to 60 minutes after actual landing at no extra cost.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700">
                  <span className="font-bold text-neutral-900 dark:text-white block">🤝 Free Meet &amp; Greet</span>
                  <p className="text-neutral-500 text-xs mt-1">
                    Your driver waits inside the arrivals hall holding a personalized name signboard to assist with bags.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700">
                  <span className="font-bold text-neutral-900 dark:text-white block">💰 All Tolls &amp; Parking Included</span>
                  <p className="text-neutral-500 text-xs mt-1">
                    Highway expressways, state entry permits, and airport parking fees are 100% covered in the fare.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700">
                  <span className="font-bold text-neutral-900 dark:text-white block">🔄 100% Free 24h Cancellation</span>
                  <p className="text-neutral-500 text-xs mt-1">
                    Full refund on cancellation up to 24 hours prior to scheduled pickup time.
                  </p>
                </div>
              </div>
            </div>

            {/* Route Details */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <h3 className="font-bold text-base text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                <span>📍</span>
                <span>Transfer Route &amp; Pickup Instructions</span>
              </h3>
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                    A
                  </span>
                  <div>
                    <span className="font-bold text-neutral-900 dark:text-white">Pickup Location:</span>
                    <p className="text-neutral-500">{transfer.pickupLocation}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center shrink-0">
                    B
                  </span>
                  <div>
                    <span className="font-bold text-neutral-900 dark:text-white">Drop-off Destination:</span>
                    <p className="text-neutral-500">{transfer.dropoffLocation}</p>
                  </div>
                </div>

                <div className="pt-2 text-xs text-neutral-400">
                  Estimated Travel Duration: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{transfer.estimatedDuration}</span> (traffic dependent)
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Sticky Booking Sidebar) */}
          <div>
            <div className="sticky top-20 bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-4">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <span className="text-xs text-neutral-400 uppercase tracking-wider block">
                  All-Inclusive Total Fare
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-neutral-900 dark:text-white">
                    {currencySymbol}{transfer.price.toLocaleString()}
                  </span>
                  {transfer.originalPrice && (
                    <span className="text-sm text-neutral-400 line-through">
                      {currencySymbol}{transfer.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-neutral-400 block mt-0.5">Fixed vehicle price • No surge</span>
              </div>

              {/* Pickup Date & Time */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Pickup Date:
                  </label>
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:ring-2 focus:ring-neutral-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Pickup Time:
                  </label>
                  <input
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:ring-2 focus:ring-neutral-700"
                  />
                </div>
              </div>

              {/* Specific Pickup Address */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Specific Pickup Address / Terminal:
                </label>
                <input
                  type="text"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Terminal, hotel name or street"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:ring-2 focus:ring-neutral-700"
                />
              </div>

              {/* Specific Dropoff Address */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Specific Dropoff Address:
                </label>
                <input
                  type="text"
                  value={dropoffAddress}
                  onChange={(e) => setDropoffAddress(e.target.value)}
                  placeholder="Hotel name or address"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:ring-2 focus:ring-neutral-700"
                />
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
          serviceName={transfer.title}
          defaultDestination={`${transfer.city}: ${transfer.vehicleLabel}`}
          siteId={siteId}
          currencySymbol={currencySymbol}
        />
      )}
    </div>
  );
}

