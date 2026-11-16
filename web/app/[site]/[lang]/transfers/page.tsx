"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import { useSite } from "@/lib/SiteContext";
import { getActualImageUrl } from "@/lib/imageUtils";

interface TransferItem {
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
  featured?: boolean;
}

const TRANSFER_TYPES = [
  { type: "all", label: "All Transfers", icon: "✨" },
  { type: "airport", label: "Airport Transfer", icon: "✈️" },
  { type: "attraction", label: "Sightseeing & Attractions", icon: "🏛️" },
  { type: "hotel", label: "Hotel to Hotel", icon: "🏨" },
  { type: "intercity", label: "Intercity Outstation", icon: "🛣️" },
];

const VEHICLE_FILTERS = [
  { type: "all", label: "All Vehicles" },
  { type: "Sedan", label: "Sedan (1-3 Pax)" },
  { type: "SUV", label: "SUV (4-6 Pax)" },
  { type: "Van", label: "Van / Minibus (7-12 Pax)" },
  { type: "Luxury", label: "VIP Luxury" },
];

export default function TransfersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const config = useSiteConfig();
  const site = useSite();

  const siteId = site.siteId || "gujjutours";
  const currencySymbol = config.currencySymbol || (siteId === "gujjutours" ? "₹" : "$");

  // Query params
  const initialType = searchParams.get("type") || searchParams.get("transferType") || "all";
  const initialCity = searchParams.get("city") || searchParams.get("destination") || "all";
  const initialVehicle = searchParams.get("vehicle") || searchParams.get("vehicleType") || "all";
  const initialPickup = searchParams.get("pickup") || "";
  const initialDropoff = searchParams.get("dropoff") || "";
  const initialSort = searchParams.get("sort") || "price-asc";

  // State
  const [selectedType, setSelectedType] = useState(initialType);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedVehicle, setSelectedVehicle] = useState(initialVehicle);
  const [pickupInput, setPickupInput] = useState(initialPickup);
  const [dropoffInput, setDropoffInput] = useState(initialDropoff);
  const [pickupDate, setPickupDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  });
  const [pickupTime, setPickupTime] = useState("10:00");
  const [passengers, setPassengers] = useState(2);
  const [sortBy, setSortBy] = useState(initialSort);

  // Data
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch transfers from API
  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      q.set("site", siteId);
      if (selectedType && selectedType !== "all") q.set("transferType", selectedType);
      if (selectedCity && selectedCity !== "all") q.set("city", selectedCity);
      if (selectedVehicle && selectedVehicle !== "all") q.set("vehicleType", selectedVehicle);
      if (pickupInput.trim()) q.set("pickup", pickupInput.trim());
      if (dropoffInput.trim()) q.set("dropoff", dropoffInput.trim());
      if (passengers > 0) q.set("passengers", String(passengers));
      if (sortBy) q.set("sort", sortBy);

      const res = await fetch(`/api/transfers?${q.toString()}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setTransfers(json.data);
      } else {
        setTransfers([]);
      }
    } catch (err: any) {
      console.error("[TransfersPage] Error loading transfers:", err);
      setError(err.message || "Failed to load transfers");
    } finally {
      setLoading(false);
    }
  }, [siteId, selectedType, selectedCity, selectedVehicle, pickupInput, dropoffInput, passengers, sortBy]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  // Unique cities from data
  const cities = useMemo(() => {
    const set = new Set<string>();
    transfers.forEach((t) => {
      if (t.city) set.add(t.city);
    });
    return ["all", ...Array.from(set)];
  }, [transfers]);

  const handleBookTransfer = (transfer: TransferItem) => {
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
      pickup: pickupInput || transfer.pickupLocation,
      dropoff: dropoffInput || transfer.dropoffLocation,
      date: pickupDate,
      time: pickupTime,
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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 pb-20 font-sans">
      {/* ─── Hero & Search Card ─── */}
      <section className="relative bg-gradient-to-r from-slate-900 via-zinc-900 to-neutral-900 text-white py-12 px-4 sm:px-6 lg:px-8 shadow-md">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-neutral-400 mb-4">
            <Link href="/" className="hover:underline">Home</Link>
            <span>/</span>
            <span className="text-white font-medium">Private Airport &amp; City Transfers</span>
          </nav>

          <div className="max-w-3xl mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm text-neutral-200 mb-2">
              🚗 Door-to-Door Private Chauffeur Fleet
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Airport &amp; Intercity Transfers
            </h1>
            <p className="mt-2 text-sm sm:text-base text-neutral-300">
              Guaranteed flight tracking with 60-minute free waiting time, all-inclusive toll charges, and professional verified drivers.
            </p>
          </div>

          {/* Search Card Container */}
          <div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-2xl p-5 shadow-2xl">
            {/* Transfer Type Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 border-b border-neutral-100 dark:border-neutral-800 scrollbar-none">
              {TRANSFER_TYPES.map((t) => {
                const active = selectedType === t.type;
                return (
                  <button
                    key={t.type}
                    onClick={() => setSelectedType(t.type)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      active
                        ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200"
                    }`}
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Pickup Location */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Pick-up Point (Airport / Hotel)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-neutral-400">📍</span>
                  <input
                    type="text"
                    value={pickupInput}
                    onChange={(e) => setPickupInput(e.target.value)}
                    placeholder="e.g. Airport Arrivals Gate or Hotel"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-neutral-700"
                  />
                </div>
              </div>

              {/* Drop-off Location */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Drop-off Destination
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-neutral-400">🏁</span>
                  <input
                    type="text"
                    value={dropoffInput}
                    onChange={(e) => setDropoffInput(e.target.value)}
                    placeholder="e.g. City Hotel, Resort or Address"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-neutral-700"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full px-2 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:ring-2 focus:ring-neutral-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full px-2 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:ring-2 focus:ring-neutral-700"
                  />
                </div>
              </div>

              {/* Passengers & Search Action */}
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label htmlFor="transfer-passengers-select" className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                    Passengers
                  </label>
                  <select
                    id="transfer-passengers-select"
                    value={passengers}
                    onChange={(e) => setPassengers(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:ring-2 focus:ring-neutral-700"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                      <option key={n} value={n}>{n} {n === 1 ? "Passenger" : "Passengers"}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => fetchTransfers()}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 shadow-md transition-all shrink-0"
                >
                  Find Rides
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Vehicle Filters Strip ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {VEHICLE_FILTERS.map((vf) => {
            const active = selectedVehicle === vf.type;
            return (
              <button
                key={vf.type}
                onClick={() => setSelectedVehicle(vf.type)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                  active
                    ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-sm"
                    : "bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400"
                }`}
              >
                {vf.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Results Controls Bar ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div>
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
              Available Transfer Vehicles ({transfers.length})
            </h3>
            <p className="text-xs text-neutral-500">
              All prices include toll fees, fuel, driver allowances &amp; flight delay protection
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {cities.length > 2 && (
              <select
                aria-label="Filter by destination city"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-medium"
              >
                <option value="all">📍 All Cities</option>
                {cities.filter((c) => c !== "all").map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}

            <select
              aria-label="Sort transfer vehicles"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-medium"
            >
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating-desc">Top Rated Chauffeurs</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── Vehicles Listing ─── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-red-200 dark:border-red-900/40">
            <p className="text-red-500 text-sm font-semibold">{error}</p>
            <button
              onClick={() => fetchTransfers()}
              className="mt-4 px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-bold"
            >
              Retry
            </button>
          </div>
        ) : transfers.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <span className="text-4xl">🚗</span>
            <h3 className="mt-3 text-lg font-bold text-neutral-800 dark:text-neutral-200">
              No transfer vehicles match your criteria
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              Try adjusting your passenger count or clearing vehicle filters.
            </p>
            <button
              onClick={() => {
                setSelectedType("all");
                setSelectedVehicle("all");
                setSelectedCity("all");
                setPickupInput("");
                setDropoffInput("");
                setPassengers(2);
              }}
              className="mt-4 px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {transfers.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-500 dark:hover:border-neutral-500 shadow-sm hover:shadow-md transition-all p-5 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Vehicle Thumbnail & Basic Info */}
                <div className="flex items-center gap-4 min-w-[240px]">
                  <div className="relative w-28 h-20 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0 border border-neutral-200 dark:border-neutral-700">
                    <Image
                      src={getActualImageUrl(item.image, {
                        title: item.vehicleLabel,
                        city: item.city,
                        module: "transfers",
                        id: item.id || item.slug,
                      })}
                      alt={item.vehicleLabel}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 uppercase">
                      {item.transferTypeLabel}
                    </span>
                    <h4 className="font-bold text-base text-neutral-900 dark:text-white mt-1">
                      {item.vehicleLabel}
                    </h4>
                    <p className="text-xs text-neutral-500">
                      {item.vehicleModel}
                    </p>
                  </div>
                </div>

                {/* Capacity Badges & Route Highlights */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                    <span className="px-2.5 py-1 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                      👥 Max {item.maxPassengers} Passengers
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                      🧳 {item.maxLuggage} Luggage Bags
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                      ❄️ Air Conditioned
                    </span>
                  </div>

                  <div className="text-xs text-neutral-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>📍 {item.pickupLocation}</span>
                    <span>→</span>
                    <span>🏁 {item.dropoffLocation}</span>
                    <span>⏱️ Est. {item.estimatedDuration}</span>
                  </div>

                  {/* Trust Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                    <span>✓ Free cancellation up to 24h</span>
                    <span>•</span>
                    <span>✓ 60 Min Free Waiting</span>
                    <span>•</span>
                    <span>✓ Tolls &amp; Parking Included</span>
                  </div>
                </div>

                {/* Pricing & Booking CTA */}
                <div className="pt-4 md:pt-0 border-t md:border-t-0 border-neutral-100 dark:border-neutral-800 flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                        {currencySymbol}{item.price.toLocaleString()}
                      </span>
                      {item.originalPrice && (
                        <span className="text-xs text-neutral-400 line-through">
                          {currencySymbol}{item.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-neutral-400 block">all-inclusive vehicle fare</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/en/transfers/${item.slug}`}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
                    >
                      Details
                    </Link>
                    <button
                      onClick={() => handleBookTransfer(item)}
                      className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 text-white shadow-sm transition-all"
                    >
                      Book Ride →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ─── "Why Book Transfers With Us" Trust Strip ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
              Premium Chauffeur Standards
            </span>
            <h2 className="text-2xl font-black text-neutral-900 dark:text-white mt-1">
              Why Book Transfers with {site.displayName || "Us"}?
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-2">
              Fixed transparent fares with zero surge charges and verified professional local drivers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-700">
              <span className="text-2xl">✈️</span>
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white mt-2">
                Live Flight Monitoring
              </h4>
              <p className="text-xs text-neutral-500 mt-1">
                Drivers track your inbound flight in real time and automatically adjust pickup times for delays.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-700">
              <span className="text-2xl">⏱️</span>
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white mt-2">
                60 Min Free Waiting Time
              </h4>
              <p className="text-xs text-neutral-500 mt-1">
                Take your time clearing immigration and collecting baggage with complimentary 60 minutes airport waiting.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-700">
              <span className="text-2xl">🛡️</span>
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white mt-2">
                All-Inclusive Transparent Fares
              </h4>
              <p className="text-xs text-neutral-500 mt-1">
                No hidden surprises: airport parking, state entry taxes, highway tolls, and fuel are 100% included.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-700">
              <span className="text-2xl">🔄</span>
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white mt-2">
                Free 24h Cancellation
              </h4>
              <p className="text-xs text-neutral-500 mt-1">
                Plans changed? Cancel your private transfer up to 24 hours prior to pickup for a 100% refund.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
