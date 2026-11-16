"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import { useSite } from "@/lib/SiteContext";

interface FlightAirport {
  code: string;
  city: string;
  name: string;
  country: string;
  terminal?: string;
}

interface FlightItem {
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
  featured?: boolean;
  availableSeats?: number;
}

interface PopularRoute {
  routeSlug: string;
  fromCity: string;
  fromCode: string;
  toCity: string;
  toCode: string;
  duration: string;
  startingPrice: number;
  currency: string;
  isDomestic: boolean;
  dailyFlightsCount: number;
  image: string;
}

export default function FlightsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const config = useSiteConfig();
  const site = useSite();

  const siteId = site.siteId || "gujjutours";
  const currencySymbol = config.currencySymbol || (siteId === "gujjutours" ? "₹" : "$");

  // Search parameters from URL
  const initialFrom = searchParams.get("from") || (siteId === "gujjutours" ? "DEL" : siteId === "tripgoasia" ? "BKK" : "DXB");
  const initialTo = searchParams.get("to") || (siteId === "gujjutours" ? "BOM" : siteId === "tripgoasia" ? "SIN" : "DOH");
  const initialClass = searchParams.get("class") || "Economy";
  const initialNonStop = searchParams.get("nonStop") === "true";
  const initialPureVeg = searchParams.get("pureVeg") === "true";
  const initialSort = searchParams.get("sort") || "price-asc";

  // Form state
  const [tripType, setTripType] = useState<"oneway" | "roundtrip">("oneway");
  const [fromCode, setFromCode] = useState(initialFrom);
  const [toCode, setToCode] = useState(initialTo);
  const [departDate, setDepartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [returnDate, setReturnDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [cabinClass, setCabinClass] = useState(initialClass);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [nonStopOnly, setNonStopOnly] = useState(initialNonStop);
  const [pureVegOnly, setPureVegOnly] = useState(initialPureVeg);
  const [selectedAirline, setSelectedAirline] = useState("all");
  const [sortBy, setSortBy] = useState(initialSort);

  // Data state
  const [flights, setFlights] = useState<FlightItem[]>([]);
  const [popularRoutes, setPopularRoutes] = useState<PopularRoute[]>([]);
  const [routesTab, setRoutesTab] = useState<"domestic" | "international">("domestic");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Flights from API
  const fetchFlights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      q.set("site", siteId);
      if (fromCode) q.set("from", fromCode);
      if (toCode) q.set("to", toCode);
      if (cabinClass && cabinClass !== "all") q.set("cabinClass", cabinClass);
      if (nonStopOnly) q.set("nonStop", "true");
      if (pureVegOnly) q.set("pureVegMeals", "true");
      if (selectedAirline && selectedAirline !== "all") q.set("airline", selectedAirline);
      if (sortBy) q.set("sort", sortBy);

      const res = await fetch(`/api/flights?${q.toString()}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setFlights(json.data);
      } else {
        setFlights([]);
      }
      if (json.popularRoutes && Array.isArray(json.popularRoutes)) {
        setPopularRoutes(json.popularRoutes);
      }
    } catch (err: any) {
      console.error("[FlightsPage] Error loading flights:", err);
      setError(err.message || "Failed to load flights");
    } finally {
      setLoading(false);
    }
  }, [siteId, fromCode, toCode, cabinClass, nonStopOnly, pureVegOnly, selectedAirline, sortBy]);

  useEffect(() => {
    fetchFlights();
  }, [fetchFlights]);

  // Unique airlines from data
  const airlines = useMemo(() => {
    const set = new Set<string>();
    flights.forEach((f) => {
      if (f.airline) set.add(f.airline);
    });
    return ["all", ...Array.from(set)];
  }, [flights]);

  // Handle route click from popular routes
  const handleSelectPopularRoute = (r: PopularRoute) => {
    setFromCode(r.fromCode);
    setToCode(r.toCode);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBookFlight = (flight: FlightItem) => {
    const unitPrice = flight.price;
    const childPrice = Math.round(unitPrice * 0.75);
    const baseTotal = unitPrice * adults + childPrice * children;
    const tax = Math.round(baseTotal * 0.12);
    const grandTotal = baseTotal + tax;
    const title = `${flight.airline} ${flight.flightNumber}: ${flight.fromAirport.code} → ${flight.toAirport.code}`;
    const primaryImg = flight.airlineLogo || "";

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
      departureTime: flight.departureTime,
      date: departDate,
      option: `${flight.cabinClass} Class (${flight.stops})`,
      cabinClass: flight.cabinClass,
      adults: String(adults),
      children: String(children),
      vegMeal: String(pureVegOnly || flight.meals?.pureVegGuaranteed),
      dietary: (pureVegOnly || flight.meals?.pureVegGuaranteed) ? "pureVeg" : "standard",
      price: String(unitPrice),
      unitPrice: String(unitPrice),
      subtotal: String(baseTotal),
      tax: String(tax),
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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 pb-20 font-sans">
      {/* ─── Hero & Flight Search Widget ─── */}
      <section className="relative bg-gradient-to-r from-blue-900 via-indigo-900 to-sky-950 text-white py-12 px-4 sm:px-6 lg:px-8 shadow-md">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-sky-200 mb-4">
            <Link href="/" className="hover:underline">Home</Link>
            <span>/</span>
            <span className="text-white font-medium">Flight Booking</span>
          </nav>

          <div className="max-w-3xl mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm text-sky-100 mb-2">
              ✈️ Instant Flight Schedules &amp; Best Fare Guarantee
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Book Domestic &amp; International Flights
            </h1>
            <p className="mt-2 text-sm sm:text-base text-sky-100">
              Compare transparent fares, enjoy complimentary hot Pure Veg in-flight meals, and experience seamless booking.
            </p>
          </div>

          {/* Search Card Container */}
          <div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-2xl p-5 shadow-2xl">
            {/* Top Controls: Trip Type & Cabin Class */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTripType("oneway")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    tripType === "oneway"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                  }`}
                >
                  One Way
                </button>
                <button
                  onClick={() => setTripType("roundtrip")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    tripType === "roundtrip"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                  }`}
                >
                  Round Trip
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <label htmlFor="cabin-class-select" className="text-neutral-500 font-medium">Cabin Class:</label>
                <select
                  id="cabin-class-select"
                  value={cabinClass}
                  onChange={(e) => setCabinClass(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Economy">Economy</option>
                  <option value="Business">Business Class</option>
                  <option value="all">Any Cabin</option>
                </select>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* From Airport */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  From (City / Airport)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-neutral-400">🛫</span>
                  <input
                    type="text"
                    value={fromCode}
                    onChange={(e) => setFromCode(e.target.value.toUpperCase())}
                    placeholder="e.g. DEL or Delhi"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-bold uppercase focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* To Airport */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  To (City / Airport)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-neutral-400">🛬</span>
                  <input
                    type="text"
                    value={toCode}
                    onChange={(e) => setToCode(e.target.value.toUpperCase())}
                    placeholder="e.g. BOM or Mumbai"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm font-bold uppercase focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Departure & Return Dates */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                    Departure
                  </label>
                  <input
                    type="date"
                    value={departDate}
                    onChange={(e) => setDepartDate(e.target.value)}
                    className="w-full px-2 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                    Return
                  </label>
                  <input
                    type="date"
                    disabled={tripType !== "roundtrip"}
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className={`w-full px-2 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:ring-2 focus:ring-blue-500 ${
                      tripType !== "roundtrip" ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  />
                </div>
              </div>

              {/* Passengers & Search Action */}
              <div className="flex items-end gap-2">
                <div className="flex-1 grid grid-cols-2 gap-1.5">
                  <div>
                    <label htmlFor="passengers-adults-select" className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                      Adults
                    </label>
                    <select
                      id="passengers-adults-select"
                      value={adults}
                      onChange={(e) => setAdults(Number(e.target.value))}
                      className="w-full px-2 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                    >
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>{n} Adt</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="passengers-children-select" className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                      Kids
                    </label>
                    <select
                      id="passengers-children-select"
                      value={children}
                      onChange={(e) => setChildren(Number(e.target.value))}
                      className="w-full px-2 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                    >
                      {[0, 1, 2, 3, 4].map((n) => (
                        <option key={n} value={n}>{n} Chd</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => fetchFlights()}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all shrink-0"
                >
                  Search Fares
                </button>
              </div>
            </div>

            {/* Quick Filter Checkboxes */}
            <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center gap-4 text-xs font-semibold">
              <label className="flex items-center gap-2 cursor-pointer text-neutral-700 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={nonStopOnly}
                  onChange={(e) => setNonStopOnly(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Direct flights only (Non-stop)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-emerald-700 dark:text-emerald-400">
                <input
                  type="checkbox"
                  checked={pureVegOnly}
                  onChange={(e) => setPureVegOnly(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>🌱 Pure Veg In-Flight Meals Included</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Popular Flight Routes Section ─── */}
      {popularRoutes.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white">
                Popular Flight Routes
              </h2>
              <p className="text-xs text-neutral-500">
                Top booked domestic and international routes with instant availability
              </p>
            </div>

            {/* Domestic vs International Routes Tab */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-200/60 dark:bg-neutral-800">
              <button
                onClick={() => setRoutesTab("domestic")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  routesTab === "domestic"
                    ? "bg-white dark:bg-neutral-900 text-blue-600 shadow-sm"
                    : "text-neutral-600 dark:text-neutral-400"
                }`}
              >
                Domestic Routes
              </button>
              <button
                onClick={() => setRoutesTab("international")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  routesTab === "international"
                    ? "bg-white dark:bg-neutral-900 text-blue-600 shadow-sm"
                    : "text-neutral-600 dark:text-neutral-400"
                }`}
              >
                International Routes
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularRoutes
              .filter((r) => routesTab === "domestic" ? r.isDomestic : !r.isDomestic)
              .slice(0, 8)
              .map((route) => (
                <div
                  key={route.routeSlug}
                  className="group bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 dark:hover:border-blue-500 shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {route.dailyFlightsCount} Daily Flights
                      </span>
                      <span>⏱️ {route.duration}</span>
                    </div>

                    <div className="flex items-center justify-between font-bold text-base text-neutral-900 dark:text-white">
                      <span>{route.fromCity} ({route.fromCode})</span>
                      <span className="text-neutral-400">→</span>
                      <span>{route.toCity} ({route.toCode})</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-neutral-400 block uppercase">Fares from</span>
                      <span className="font-extrabold text-base text-neutral-900 dark:text-white">
                        {currencySymbol}{route.startingPrice.toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={() => handleSelectPopularRoute(route)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all"
                    >
                      View Fares →
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* ─── Search Results Controls & Filter Strip ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          {/* Left info */}
          <div>
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
              Showing scheduled flights {fromCode && toCode ? `for ${fromCode} → ${toCode}` : ""}
            </h3>
            <p className="text-xs text-neutral-500">
              {flights.length} {flights.length === 1 ? "flight" : "flights"} found • Guaranteed Best Fares
            </p>
          </div>

          {/* Right filters */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Airline Filter */}
            {airlines.length > 2 && (
              <select
                aria-label="Filter by airline carrier"
                value={selectedAirline}
                onChange={(e) => setSelectedAirline(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-medium"
              >
                <option value="all">✈️ All Airlines</option>
                {airlines.filter((a) => a !== "all").map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            )}

            {/* Sort Select */}
            <select
              aria-label="Sort flight results"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-medium"
            >
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="duration-asc">Duration: Fastest First</option>
              <option value="departure-asc">Departure: Earliest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── Flights Result Listing ─── */}
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
              onClick={() => fetchFlights()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
            >
              Retry Search
            </button>
          </div>
        ) : flights.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <span className="text-4xl">🛫</span>
            <h3 className="mt-3 text-lg font-bold text-neutral-800 dark:text-neutral-200">
              No flights found for this route
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              Try searching across popular hubs or clearing the direct-flight filter.
            </p>
            <button
              onClick={() => {
                setFromCode("DEL");
                setToCode("BOM");
                setNonStopOnly(false);
                setPureVegOnly(false);
                setSelectedAirline("all");
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
            >
              Show Top Domestic Flights
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {flights.map((flight, idx) => {
              const hasPureVegMeal = flight.meals?.pureVegGuaranteed;
              const hasJainMeal = flight.meals?.jainMealAvailable;

              return (
                <div
                  key={`${flight.id}-${idx}`}
                  className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 dark:hover:border-blue-500 shadow-sm hover:shadow-md transition-all p-5 flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  {/* Airline & Flight Identity */}
                  <div className="flex items-center gap-4 min-w-[200px]">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0 border border-neutral-200 dark:border-neutral-700">
                      <Image
                        src={flight.airlineLogo || "/seed-images/flights/airline-skywings.svg"}
                        alt={flight.airline}
                        fill
                        className="object-cover p-1"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                        {flight.airline}
                      </h4>
                      <p className="text-xs text-neutral-500">
                        {flight.flightNumber} • {flight.cabinClass}
                      </p>
                      {flight.aircraft && (
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          ✈️ {flight.aircraft}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Flight Schedule Times */}
                  <div className="flex items-center gap-6 sm:gap-8 flex-1 justify-center">
                    {/* Departure */}
                    <div className="text-center sm:text-left">
                      <div className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                        {flight.departureTime}
                      </div>
                      <div className="font-bold text-xs text-neutral-700 dark:text-neutral-300">
                        {flight.fromAirport.city} ({flight.fromAirport.code})
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        {flight.fromAirport.terminal}
                      </div>
                    </div>

                    {/* Flight Path Graphic */}
                    <div className="flex flex-col items-center min-w-[90px]">
                      <span className="text-[11px] font-semibold text-neutral-400 mb-1">
                        {flight.duration}
                      </span>
                      <div className="w-full flex items-center gap-1">
                        <div className="h-0.5 flex-1 bg-neutral-200 dark:bg-neutral-700" />
                        <span className="text-xs text-blue-500">✈</span>
                        <div className="h-0.5 flex-1 bg-neutral-200 dark:bg-neutral-700" />
                      </div>
                      <span className="mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                        {flight.stops}
                      </span>
                    </div>

                    {/* Arrival */}
                    <div className="text-center sm:text-right">
                      <div className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                        {flight.arrivalTime}
                      </div>
                      <div className="font-bold text-xs text-neutral-700 dark:text-neutral-300">
                        {flight.toAirport.city} ({flight.toAirport.code})
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        {flight.toAirport.terminal}
                      </div>
                    </div>
                  </div>

                  {/* Badges & Amenities */}
                  <div className="flex flex-wrap md:flex-col items-start md:items-end gap-1.5 text-[11px]">
                    {hasPureVegMeal && (
                      <span className="px-2 py-0.5 rounded-md font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        🌱 Pure Veg Meal
                      </span>
                    )}
                    {hasJainMeal && (
                      <span className="px-2 py-0.5 rounded-md font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                        🌿 Jain Meal
                      </span>
                    )}
                    {flight.refundable ? (
                      <span className="px-2 py-0.5 rounded-md font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                        ✓ Refundable Fare
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                        Standard Non-ref
                      </span>
                    )}
                    {flight.baggage && (
                      <span className="text-neutral-400 text-[10px]">
                        👜 {flight.baggage.cabin} • 🧳 {flight.baggage.checkIn}
                      </span>
                    )}
                  </div>

                  {/* Pricing & Booking CTA */}
                  <div className="pt-4 md:pt-0 border-t md:border-t-0 border-neutral-100 dark:border-neutral-800 flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-400">
                          {currencySymbol}{flight.price.toLocaleString()}
                        </span>
                        {flight.originalPrice && (
                          <span className="text-xs text-neutral-400 line-through">
                            {currencySymbol}{flight.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-400 block">per passenger</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/en/flights/${flight.slug}`}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
                      >
                        Details
                      </Link>
                      <button
                        onClick={() => handleBookFlight(flight)}
                        className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
                      >
                        Book Flight →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── "Why Book Flights With Us" Trust Strip ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Reliable Travel Partner
            </span>
            <h2 className="text-2xl font-black text-neutral-900 dark:text-white mt-1">
              Why Book Flights with {site.displayName || "Us"}?
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-2">
              We eliminate unexpected fees and cater to unique passenger preferences with dedicated support.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-700">
              <span className="text-2xl">🌱</span>
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white mt-2">
                Pure Veg &amp; Jain Meal Guarantee
              </h4>
              <p className="text-xs text-neutral-500 mt-1">
                Direct coordination with airline catering to ensure 100% vegetarian and Jain meal preference tags.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-700">
              <span className="text-2xl">💰</span>
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white mt-2">
                Zero Hidden Convenience Fees
              </h4>
              <p className="text-xs text-neutral-500 mt-1">
                Transparent upfront pricing with all airport taxes, fuel surcharges, and baggage fees included.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-700">
              <span className="text-2xl">⚡</span>
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white mt-2">
                Instant Rescheduling Support
              </h4>
              <p className="text-xs text-neutral-500 mt-1">
                Modify your flight dates or times with minimal fees and swift confirmation on all flexi tickets.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-700">
              <span className="text-2xl">📞</span>
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white mt-2">
                24x7 WhatsApp &amp; Desk Concierge
              </h4>
              <p className="text-xs text-neutral-500 mt-1">
                Live assistance with web check-in, seat selection, boarding passes, and baggage tracking.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
