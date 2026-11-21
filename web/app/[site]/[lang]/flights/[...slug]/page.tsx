"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter, notFound } from "next/navigation";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import { useSite } from "@/lib/SiteContext";
import { getFlightBySlug } from "@/lib/api/flights";
import { LoadingSkeleton, ErrorState } from "@/components/common";
import EnquiryModal from "@/components/lead/EnquiryModal";

interface FlightAirport {
  code: string;
  city: string;
  name: string;
  country: string;
  terminal?: string;
}

interface FlightDetail {
  id: number | string;
  flightNumericId?: number;
  flightId?: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  airlineLogo: string;
  fromAirport: FlightAirport;
  toAirport: FlightAirport;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  durationMinutes: number;
  stops: string;
  stopsCount: number;
  cabinClass: string;
  price: number;
  originalPrice?: number;
  currency: string;
  refundable: boolean;
  cancellationPolicy?: string;
  baggage?: {
    cabin: string;
    checkIn: string;
  };
  meals?: {
    included: boolean;
    pureVegGuaranteed: boolean;
    jainMealAvailable: boolean;
    description: string;
  };
  aircraft?: string;
  routeSlug: string;
  slug: string;
  isDomestic: boolean;
  rating?: number;
  reviews?: number;
  availableSeats?: number;
}

export default function FlightDetailPage() {
  const params = useParams();
  const router = useRouter();
  const config = useSiteConfig();
  const site = useSite();

  const siteId = site.siteId || "gujjutours";
  const currencySymbol = config.currencySymbol || (siteId === "gujjutours" ? "₹" : "$");

  const slugParam = params?.slug;
  const flightPath = Array.isArray(slugParam)
    ? slugParam[slugParam.length - 1]
    : typeof slugParam === "string"
    ? slugParam
    : "";

  const [flight, setFlight] = useState<FlightDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [travelDate, setTravelDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [mealPreference, setMealPreference] = useState<"pureVeg" | "jain" | "standard">("pureVeg");
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);

  const fetchFlight = useCallback(async () => {
    if (!flightPath) return;
    setLoading(true);
    setError(null);

    try {
      let f: any = null;
      try {
        f = await getFlightBySlug(flightPath, { siteId });
      } catch {
        // Direct call failed — query same-origin Next.js proxy
        const res = await fetch(`/api/flights/${encodeURIComponent(flightPath)}?site=${encodeURIComponent(siteId)}`);
        if (res.ok) {
          const json = await res.json();
          f = json?.data ?? json;
        }
      }

      if (!f || !f.flightNumber) {
        const localRes = await fetch(`/api/flights/${encodeURIComponent(flightPath)}?site=${encodeURIComponent(siteId)}`);
        if (localRes.ok) {
          const localJson = await localRes.json();
          f = localJson?.data ?? localJson;
        }
      }

      if (f && f.flightNumber) {
        setFlight({
          id: f.id || f.flightNumericId || flightPath,
          flightNumericId: f.flightNumericId,
          airline: f.airline || "Airline Partner",
          airlineCode: f.airlineCode || "FL",
          flightNumber: f.flightNumber || "FL-101",
          airlineLogo: f.airlineLogo || "/seed-images/flights/airline-skywings.svg",
          fromAirport: f.fromAirport || {
            code: "DEL",
            city: "Delhi",
            name: "Indira Gandhi International Airport",
            country: "India",
          },
          toAirport: f.toAirport || {
            code: "BOM",
            city: "Mumbai",
            name: "Chhatrapati Shivaji Maharaj International",
            country: "India",
          },
          departureTime: f.departureTime || "06:15",
          arrivalTime: f.arrivalTime || "08:35",
          duration: f.durationFormatted || `${Math.floor((f.durationMinutes || 120) / 60)}h ${(f.durationMinutes || 120) % 60}m`,
          durationMinutes: f.durationMinutes || 120,
          stops: f.stops === 0 ? "Non-stop" : `${f.stops} stop(s)`,
          stopsCount: f.stops || 0,
          cabinClass: f.cabinClass || "Economy",
          price: Number(f.price || 4850),
          originalPrice: (f as any).originalPrice ? Number((f as any).originalPrice) : undefined,
          currency: f.currency || currencySymbol,
          refundable: f.refundable !== false,
          cancellationPolicy: (f as any).cancellationPolicy || "Free cancellation up to 24 hours prior to departure.",
          baggage: (f as any).baggage || {
            cabin: "7 kg (1 handbag + 1 laptop pouch)",
            checkIn: "15 kg (1 piece checked baggage)",
          },
          meals: (f as any).meals || {
            included: true,
            pureVegGuaranteed: true,
            jainMealAvailable: true,
            description: "Complimentary Pure Veg meal with fresh beverage",
          },
          aircraft: (f as any).aircraft || "Airbus A320neo",
          routeSlug: (f as any).routeSlug || "route",
          slug: f.slug || flightPath,
          isDomestic: (f as any).isDomestic !== false,
          rating: f.rating || 4.8,
          reviews: f.reviews || 210,
          availableSeats: f.availableSeats || 12,
        });
      } else {
        setError("Flight itinerary not found");
      }
    } catch (err: any) {
      if (err?.digest?.includes("NEXT_NOT_FOUND") || err?.message === "NEXT_NOT_FOUND") {
        throw err;
      }
      if (err?.status === 404 || err?.isNotFound) {
        setError("Flight itinerary not found");
      } else {
        setError(err?.message || "Failed to load flight details");
      }
    } finally {
      setLoading(false);
    }
  }, [flightPath, siteId, currencySymbol]);

  useEffect(() => {
    fetchFlight();
  }, [fetchFlight]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fafbfc] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 py-12 px-4 sm:px-6 lg:px-8">
        <LoadingSkeleton type="detail" />
      </main>
    );
  }

  if (error || !flight) {
    return (
      <main className="min-h-screen bg-[#fafbfc] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 py-16 px-4">
        <ErrorState
          title="Flight Not Found"
          message={error || "The requested flight details could not be loaded."}
          onRetry={fetchFlight}
        />
      </main>
    );
  }

  // Pricing calculations
  const unitPrice = flight.price;
  const childPrice = Math.round(unitPrice * 0.75);
  const baseTotal = unitPrice * adults + childPrice * children;
  const airportTax = Math.round(baseTotal * 0.12);
  const grandTotal = baseTotal + airportTax;
  const title = `${flight.airline} ${flight.flightNumber}: ${flight.fromAirport.code} → ${flight.toAirport.code}`;
  const primaryImg = flight.airlineLogo || "";

  const handleBookNow = () => {
    const bookingParams = new URLSearchParams({
      service: "flight",
      serviceType: "flight",
      id: String(flight.flightNumericId || flight.id),
      itemId: String(flight.flightNumericId || flight.id),
      flightId: flight.flightId || String(flight.id),
      flightNumber: flight.flightNumber,
      airline: flight.airline,
      slug: flight.slug,
      tourSlug: flight.slug,
      title: title,
      name: title,
      destination: `${flight.toAirport.city} (${flight.toAirport.code})`,
      location: `${flight.fromAirport.city} (${flight.fromAirport.code})`,
      from: flight.fromAirport.code,
      to: flight.toAirport.code,
      date: travelDate,
      departureTime: flight.departureTime,
      option: `${flight.cabinClass} Class (${flight.stops})`,
      cabinClass: flight.cabinClass,
      adults: String(adults),
      children: String(children),
      mealPreference,
      dietary: mealPreference,
      price: String(unitPrice),
      unitPrice: String(unitPrice),
      subtotal: String(baseTotal),
      tax: String(airportTax),
      total: String(grandTotal),
      totalPrice: String(grandTotal),
      currency: flight.currency || (siteId === "gujjutours" ? "INR" : "USD"),
      image: primaryImg,
      imageUrl: primaryImg,
      site: siteId,
    });

    router.push(`/booking?${bookingParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 pb-20 font-sans">
      {/* ─── Breadcrumb ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/en/flights" className="hover:text-blue-600 transition-colors">Flights</Link>
          <span>/</span>
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
            {flight.fromAirport.code} → {flight.toAirport.code}
          </span>
          <span>/</span>
          <span className="text-neutral-400">{flight.flightNumber}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ─── Route Title Card ─── */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 p-1 border border-neutral-200 dark:border-neutral-700">
                <Image
                  src={flight.airlineLogo || "/seed-images/flights/airline-skywings.svg"}
                  alt={flight.airline}
                  fill
                  className="object-contain p-2"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                    {flight.fromAirport.city} ({flight.fromAirport.code}) → {flight.toAirport.city} ({flight.toAirport.code})
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {flight.cabinClass}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Operated by {flight.airline} • Flight {flight.flightNumber} • {flight.aircraft}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs text-neutral-400">Total Price from</span>
                <p className="text-2xl sm:text-3xl font-black text-blue-700 dark:text-blue-400">
                  {currencySymbol}{unitPrice.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Flight Details and Booking Panel ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Flight Timings Card */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Schedule</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span>●</span> On-Time Reliability 96%
                </span>
              </div>

              <div className="grid grid-cols-3 items-center gap-4 text-center">
                <div className="space-y-1">
                  <span className="text-2xl sm:text-3xl font-black">{flight.departureTime}</span>
                  <p className="font-bold text-sm text-neutral-800 dark:text-neutral-200">{flight.fromAirport.code}</p>
                  <p className="text-xs text-neutral-500">{flight.fromAirport.name}</p>
                  {flight.fromAirport.terminal && (
                    <span className="inline-block mt-1 text-[11px] font-semibold text-neutral-400">
                      {flight.fromAirport.terminal}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-neutral-400">{flight.duration}</span>
                  <div className="flex items-center justify-center gap-1 my-1">
                    <div className="h-0.5 w-12 bg-neutral-200 dark:bg-neutral-700" />
                    <span className="text-xs">✈</span>
                    <div className="h-0.5 w-12 bg-neutral-200 dark:bg-neutral-700" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                    {flight.stops}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-2xl sm:text-3xl font-black">{flight.arrivalTime}</span>
                  <p className="font-bold text-sm text-neutral-800 dark:text-neutral-200">{flight.toAirport.code}</p>
                  <p className="text-xs text-neutral-500">{flight.toAirport.name}</p>
                  {flight.toAirport.terminal && (
                    <span className="inline-block mt-1 text-[11px] font-semibold text-neutral-400">
                      {flight.toAirport.terminal}
                    </span>
                  )}
                </div>
              </div>

              {/* Baggage Policy */}
              {flight.baggage && (
                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                    <span>🧳 Cabin:</span>
                    <span className="font-semibold">{flight.baggage.cabin}</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                    <span>📦 Check-in:</span>
                    <span className="font-semibold">{flight.baggage.checkIn}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Meals & Dietary Notice */}
            {flight.meals && (
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌱</span>
                  <h3 className="font-bold text-sm text-emerald-900 dark:text-emerald-100">
                    Pure Veg &amp; Jain Meals Included
                  </h3>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  {flight.meals.description}
                </p>
              </div>
            )}
          </div>

          {/* ─── Booking Card ─── */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-md sticky top-24 space-y-4">
              <h2 className="font-bold text-base text-neutral-900 dark:text-white">Reserve Flight</h2>

              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                  Departure Date
                </label>
                <input
                  type="date"
                  value={travelDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 outline-none"
                />
              </div>

              {/* Meal Preference */}
              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                  In-Flight Meal Preference
                </label>
                <select
                  value={mealPreference}
                  onChange={(e) => setMealPreference(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 outline-none font-semibold"
                >
                  <option value="pureVeg">🌱 100% Pure Vegetarian Meal</option>
                  <option value="jain">🌿 Jain Friendly Meal</option>
                  <option value="standard">🍽️ Standard Airline Meal</option>
                </select>
              </div>

              {/* Passengers */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                    Adults (12+)
                  </label>
                  <div className="flex items-center justify-between border border-neutral-200 dark:border-neutral-700 rounded-xl p-1 bg-neutral-50 dark:bg-neutral-800">
                    <button
                      disabled={adults <= 1}
                      onClick={() => setAdults(Math.max(1, adults - 1))}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-neutral-700 font-bold border border-neutral-200 dark:border-neutral-600 disabled:opacity-40 flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="font-bold text-sm">{adults}</span>
                    <button
                      onClick={() => setAdults(adults + 1)}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-neutral-700 font-bold border border-neutral-200 dark:border-neutral-600 flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                    Children (2-11)
                  </label>
                  <div className="flex items-center justify-between border border-neutral-200 dark:border-neutral-700 rounded-xl p-1 bg-neutral-50 dark:bg-neutral-800">
                    <button
                      disabled={children <= 0}
                      onClick={() => setChildren(Math.max(0, children - 1))}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-neutral-700 font-bold border border-neutral-200 dark:border-neutral-600 disabled:opacity-40 flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="font-bold text-sm">{children}</span>
                    <button
                      onClick={() => setChildren(children + 1)}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-neutral-700 font-bold border border-neutral-200 dark:border-neutral-600 flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2 text-xs">
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Base Airfare ({adults} {adults === 1 ? "Adult" : "Adults"}{children > 0 ? `, ${children} Child` : ""}):</span>
                  <span>{currencySymbol}{baseTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Airport Fees &amp; Fuel Surcharges:</span>
                  <span>{currencySymbol}{airportTax.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-baseline font-bold">
                  <span className="text-sm text-neutral-900 dark:text-white">Total Amount:</span>
                  <span className="text-xl font-black text-blue-700 dark:text-blue-400">
                    {currencySymbol}{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <button
                onClick={handleBookNow}
                className="w-full py-3.5 rounded-xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <span>Proceed to Book Flight</span>
                <span>→</span>
              </button>

              <button
                onClick={() => setIsEnquiryOpen(true)}
                className="w-full py-2.5 rounded-xl font-bold text-xs text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
              >
                💬 Need Corporate or Group Fares?
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
          serviceName={`Flight ${flight.flightNumber}: ${flight.fromAirport.city} to ${flight.toAirport.city}`}
          defaultDestination={`${flight.toAirport.city} (${flight.toAirport.code})`}
          siteId={siteId}
          currencySymbol={currencySymbol}
        />
      )}
    </div>
  );
}
