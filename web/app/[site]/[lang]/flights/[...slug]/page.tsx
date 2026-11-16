"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import { useSite } from "@/lib/SiteContext";
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

const FALLBACK_FLIGHT: FlightDetail = {
  id: 1001,
  flightNumericId: 1001,
  airline: "SkyWings Airlines",
  airlineCode: "SW",
  flightNumber: "SW-302",
  airlineLogo: "/seed-images/flights/airline-skywings.svg",
  fromAirport: {
    code: "DEL",
    city: "Delhi",
    name: "Indira Gandhi International Airport",
    country: "India",
    terminal: "Terminal 3",
  },
  toAirport: {
    code: "BOM",
    city: "Mumbai",
    name: "Chhatrapati Shivaji Maharaj International",
    country: "India",
    terminal: "Terminal 2",
  },
  departureTime: "06:15",
  arrivalTime: "08:35",
  duration: "2h 20m",
  durationMinutes: 140,
  stops: "Non-stop",
  stopsCount: 0,
  cabinClass: "Economy",
  price: 4850,
  originalPrice: 5800,
  currency: "INR",
  refundable: true,
  cancellationPolicy: "Free cancellation up to 24 hours prior to departure. Modifiable fare.",
  baggage: {
    cabin: "7 kg (1 handbag + 1 laptop pouch)",
    checkIn: "15 kg (1 piece checked baggage)",
  },
  meals: {
    included: true,
    pureVegGuaranteed: true,
    jainMealAvailable: true,
    description: "Complimentary hot Pure Veg breakfast with fresh tea/coffee and fruit bowl",
  },
  aircraft: "Airbus A320neo",
  routeSlug: "delhi-to-mumbai-flights-del-bom",
  slug: "delhi-to-mumbai-flights-del-bom-sw-302",
  isDomestic: true,
  rating: 4.8,
  reviews: 320,
  availableSeats: 14,
};

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

  const [flight, setFlight] = useState<FlightDetail>(FALLBACK_FLIGHT);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [travelDate, setTravelDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [mealPreference, setMealPreference] = useState<"pureVeg" | "jain" | "standard">("pureVeg");
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);

  useEffect(() => {
    if (!flightPath) return;

    const fetchFlight = async () => {
      try {
        const res = await fetch(`/api/flights/${encodeURIComponent(flightPath)}?site=${encodeURIComponent(siteId)}`);
        if (res.ok) {
          const json = await res.json();
          const f = json?.data || json;
          if (f && f.flightNumber) {
            setFlight({
              id: f.id || f.flightNumericId || flightPath,
              flightNumericId: f.flightNumericId,
              airline: f.airline || "SkyWings Airlines",
              airlineCode: f.airlineCode || "SW",
              flightNumber: f.flightNumber || "SW-101",
              airlineLogo: f.airlineLogo || "/seed-images/flights/airline-skywings.svg",
              fromAirport: f.fromAirport || FALLBACK_FLIGHT.fromAirport,
              toAirport: f.toAirport || FALLBACK_FLIGHT.toAirport,
              departureTime: f.departureTime || "06:15",
              arrivalTime: f.arrivalTime || "08:35",
              duration: f.duration || "2h 20m",
              durationMinutes: f.durationMinutes || 140,
              stops: f.stops || "Non-stop",
              stopsCount: f.stopsCount || 0,
              cabinClass: f.cabinClass || "Economy",
              price: Number(f.price || 4850),
              originalPrice: f.originalPrice ? Number(f.originalPrice) : undefined,
              currency: f.currency || currencySymbol,
              refundable: f.refundable !== false,
              cancellationPolicy: f.cancellationPolicy || FALLBACK_FLIGHT.cancellationPolicy,
              baggage: f.baggage || FALLBACK_FLIGHT.baggage,
              meals: f.meals || FALLBACK_FLIGHT.meals,
              aircraft: f.aircraft || "Airbus A320neo",
              routeSlug: f.routeSlug || "route",
              slug: f.slug || flightPath,
              isDomestic: f.isDomestic !== false,
              rating: f.rating || 4.8,
              reviews: f.reviews || 210,
              availableSeats: f.availableSeats || 12,
            });
          }
        }
      } catch (err) {
        console.error("[FlightDetail] Error loading flight:", err);
      }
    };

    fetchFlight();
  }, [flightPath, siteId, currencySymbol]);

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
                  className="object-cover"
                />
              </div>
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                  {flight.isDomestic ? "Domestic Scheduled Flight" : "International Flight"}
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                  {flight.airline} • {flight.flightNumber}
                </h1>
                <p className="text-xs text-neutral-500">
                  Aircraft: {flight.aircraft} • Cabin: {flight.cabinClass}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300">
                ★ {flight.rating?.toFixed(1) || "4.8"} ({flight.reviews} Reviews)
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                Seats Available: {flight.availableSeats}
              </span>
            </div>
          </div>

          {/* Schedule Visualization */}
          <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Origin */}
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60">
              <span className="text-xs font-semibold text-neutral-400">Departure Airport</span>
              <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white mt-1">
                {flight.departureTime}
              </div>
              <div className="font-bold text-sm text-neutral-900 dark:text-white">
                {flight.fromAirport.city} ({flight.fromAirport.code})
              </div>
              <div className="text-xs text-neutral-500 mt-0.5">
                {flight.fromAirport.name} • {flight.fromAirport.terminal}
              </div>
            </div>

            {/* Flight Path */}
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-neutral-500">
                ⏱️ Total Duration: {flight.duration}
              </span>
              <div className="w-full flex items-center gap-2 my-2">
                <div className="h-0.5 flex-1 bg-blue-300 dark:bg-blue-800" />
                <span className="text-base text-blue-600">✈</span>
                <div className="h-0.5 flex-1 bg-blue-300 dark:bg-blue-800" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                {flight.stops}
              </span>
            </div>

            {/* Destination */}
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 text-right">
              <span className="text-xs font-semibold text-neutral-400">Arrival Airport</span>
              <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white mt-1">
                {flight.arrivalTime}
              </div>
              <div className="font-bold text-sm text-neutral-900 dark:text-white">
                {flight.toAirport.city} ({flight.toAirport.code})
              </div>
              <div className="text-xs text-neutral-500 mt-0.5">
                {flight.toAirport.name} • {flight.toAirport.terminal}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Main Details & Booking Sidebar ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Baggage Policy */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <h3 className="font-bold text-base text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                <span>🧳</span>
                <span>Baggage Allowance Included</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700">
                  <span className="text-xs font-bold text-neutral-400 block uppercase">Cabin Baggage</span>
                  <p className="font-bold text-sm text-neutral-900 dark:text-white mt-1">
                    👜 {flight.baggage?.cabin || "7 kg (1 handbag/laptop bag)"}
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Standard overhead bin space or under seat stowage.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700">
                  <span className="text-xs font-bold text-neutral-400 block uppercase">Check-in Baggage</span>
                  <p className="font-bold text-sm text-neutral-900 dark:text-white mt-1">
                    🧳 {flight.baggage?.checkIn || "15 kg (1 checked luggage piece)"}
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Extra baggage can be added directly during check-in.
                  </p>
                </div>
              </div>
            </div>

            {/* In-Flight Dining Guarantee */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                  <span>🍽️</span>
                  <span>In-Flight Dining &amp; Pure Veg Guarantee</span>
                </h3>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  Complimentary
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">
                {flight.meals?.description || "Hot gourmet meals served with beverages."}
              </p>

              {/* Meal Selector */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                  Select Your In-Flight Meal Preference:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMealPreference("pureVeg")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      mealPreference === "pureVeg"
                        ? "bg-emerald-50 text-emerald-900 border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-200 font-bold shadow-sm"
                        : "border-neutral-200 text-neutral-700 dark:border-neutral-700"
                    }`}
                  >
                    <span className="block text-xs font-bold">🌱 Pure Vegetarian</span>
                    <span className="text-[11px] opacity-80">Hot veg meal with no onion/garlic options</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMealPreference("jain")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      mealPreference === "jain"
                        ? "bg-amber-50 text-amber-900 border-amber-500 dark:bg-amber-950/60 dark:text-amber-200 font-bold shadow-sm"
                        : "border-neutral-200 text-neutral-700 dark:border-neutral-700"
                    }`}
                  >
                    <span className="block text-xs font-bold">🌿 Jain Friendly</span>
                    <span className="text-[11px] opacity-80">100% strictly verified Jain kitchen catering</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMealPreference("standard")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      mealPreference === "standard"
                        ? "bg-blue-50 text-blue-900 border-blue-500 dark:bg-blue-950/60 dark:text-blue-200 font-bold shadow-sm"
                        : "border-neutral-200 text-neutral-700 dark:border-neutral-700"
                    }`}
                  >
                    <span className="block text-xs font-bold">🍱 Standard In-flight</span>
                    <span className="text-[11px] opacity-80">Regular airline hot beverage and snack box</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Cancellation & Rescheduling Terms */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <h3 className="font-bold text-base text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                <span>📋</span>
                <span>Cancellation &amp; Rescheduling Policies</span>
              </h3>
              <ul className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>{flight.cancellationPolicy}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Date changes permitted up to 12 hours before scheduled departure.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Direct ticket issuance with PNR and digital boarding pass upon payment.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column (Sticky Fare Summary & Booking Action) */}
          <div>
            <div className="sticky top-20 bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-5">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-4">
                <span className="text-xs text-neutral-400 uppercase tracking-wider block">
                  Fare per Passenger
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-blue-700 dark:text-blue-400">
                    {currencySymbol}{unitPrice.toLocaleString()}
                  </span>
                  {flight.originalPrice && (
                    <span className="text-sm text-neutral-400 line-through">
                      {currencySymbol}{flight.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Travel Date */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Travel Date:
                </label>
                <input
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Passenger Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  <span className="text-[11px] font-semibold text-neutral-500 block">Adults (12+)</span>
                  <div className="flex items-center justify-between mt-2">
                    <button
                      onClick={() => setAdults(Math.max(1, adults - 1))}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-neutral-700 font-bold border border-neutral-200 dark:border-neutral-600 flex items-center justify-center"
                    >
                      −
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

                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  <span className="text-[11px] font-semibold text-neutral-500 block">Children (2-11)</span>
                  <div className="flex items-center justify-between mt-2">
                    <button
                      onClick={() => setChildren(Math.max(0, children - 1))}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-neutral-700 font-bold border border-neutral-200 dark:border-neutral-600 flex items-center justify-center"
                    >
                      −
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
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Hot Pure Veg Meal Preference:</span>
                  <span>FREE</span>
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

