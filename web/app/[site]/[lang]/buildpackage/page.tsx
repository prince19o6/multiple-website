"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import { useSite } from "@/lib/SiteContext";
import EnquiryModal from "@/components/lead/EnquiryModal";

interface DurationOption {
  id: string;
  nights: number;
  days: number;
  label: string;
  priceMultiplier: number;
}

interface FlightOption {
  id: string;
  name: string;
  type: string;
  airline: string;
  baggage: string;
  meals: string;
  pricePerPerson: number;
  netPricePerPerson?: number | null;
  image: string;
}

interface HotelTier {
  id: string;
  tierName: string;
  starRating: number;
  hotelName: string;
  highlights: string;
  inclusions: string[];
  pricePerPerson: number;
  netPricePerPerson?: number | null;
  image: string;
}

interface ActivityOption {
  id: string;
  name: string;
  duration: string;
  description: string;
  pricePerPerson: number;
  netPricePerPerson?: number | null;
  image: string;
  isRecommended: boolean;
}

interface TransferOption {
  id: string;
  name: string;
  vehicleClass: string;
  capacity: string;
  luggage: string;
  priceTotal: number;
  netPriceTotal?: number | null;
  image: string;
}

interface VisaOption {
  id: string;
  name: string;
  processingTime: string;
  validity: string;
  pricePerPerson: number;
  netPricePerPerson?: number | null;
  image: string;
  isRequired: boolean;
}

interface MealPlan {
  id: string;
  name: string;
  description: string;
  pricePerPerson: number;
  netPricePerPerson?: number | null;
}

interface DestinationTemplate {
  id: number;
  destinationNumericId: number;
  destinationId: string;
  destinationSlug: string;
  destinationName: string;
  country: string;
  flag: string;
  tagline: string;
  badge: string;
  overview: string;
  heroImage: string;
  image: string;
  images: string[];
  popular: boolean;
  featured: boolean;
  rating: number;
  reviews: number;
  startingPrice: number;
  netStartingPrice?: number | null;
  currency: string;
  currencySymbol: string;
  durations: DurationOption[];
  flightOptions: FlightOption[];
  hotelTiers: HotelTier[];
  activityOptions: ActivityOption[];
  transferOptions: TransferOption[];
  visaOptions: VisaOption[];
  mealPlans: MealPlan[];
  customInclusions: string[];
  customExclusions: string[];
}

export default function BuildPackagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const config = useSiteConfig();
  const site = useSite();

  const siteId = site.siteId || "gujjutours";
  const currencySymbol = config.currencySymbol || (siteId === "gujjutours" ? "₹" : siteId === "technoheaven" ? "AED " : "$");
  const isTechnoheaven = siteId === "technoheaven";

  // Catalog state
  const [destinations, setDestinations] = useState<DestinationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active destination selection
  const initialDestSlug = searchParams.get("dest") || searchParams.get("destination") || "";
  const [selectedDestSlug, setSelectedDestSlug] = useState<string>(initialDestSlug);

  // Configuration wizard state
  const [selectedDurationId, setSelectedDurationId] = useState<string>("");
  const [selectedFlightId, setSelectedFlightId] = useState<string>("");
  const [selectedHotelId, setSelectedHotelId] = useState<string>("");
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);
  const [selectedTransferId, setSelectedTransferId] = useState<string>("");
  const [selectedVisaId, setSelectedVisaId] = useState<string>("");
  const [selectedMealId, setSelectedMealId] = useState<string>("");

  // Travelers & Dates
  const [adultsCount, setAdultsCount] = useState<number>(2);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [travelDate, setTravelDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });

  // Modal state
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  // Fetch destinations list
  useEffect(() => {
    let mounted = true;
    async function loadCatalog() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/buildpackage?pageSize=50`);
        if (!res.ok) throw new Error("Failed to load custom package destinations");
        const json = await res.json();
        if (mounted && json.success && Array.isArray(json.data)) {
          setDestinations(json.data);
          if (json.data.length > 0) {
            // Pick requested or first destination
            const match = json.data.find((d: DestinationTemplate) => d.destinationSlug === initialDestSlug);
            const active = match || json.data[0];
            setSelectedDestSlug(active.destinationSlug);
          }
        }
      } catch (err: any) {
        if (mounted) setError(err.message || "Failed to load builder options");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadCatalog();
    return () => {
      mounted = false;
    };
  }, [initialDestSlug]);

  // Current active destination
  const activeDest = useMemo(() => {
    return destinations.find((d) => d.destinationSlug === selectedDestSlug) || destinations[0] || null;
  }, [destinations, selectedDestSlug]);

  // Synchronize builder defaults when active destination changes
  useEffect(() => {
    if (!activeDest) return;
    setSelectedDurationId(activeDest.durations[0]?.id || "");
    setSelectedFlightId(activeDest.flightOptions[0]?.id || "");
    setSelectedHotelId(activeDest.hotelTiers[1]?.id || activeDest.hotelTiers[0]?.id || "");
    // Default recommended activities
    const recommended = activeDest.activityOptions.filter((a) => a.isRecommended).map((a) => a.id);
    setSelectedActivityIds(recommended);
    setSelectedTransferId(activeDest.transferOptions[0]?.id || "");
    setSelectedVisaId(activeDest.visaOptions[0]?.id || "");
    setSelectedMealId(activeDest.mealPlans[0]?.id || "");
  }, [activeDest]);

  // Handle toggling activities
  const toggleActivity = useCallback((actId: string) => {
    setSelectedActivityIds((prev) =>
      prev.includes(actId) ? prev.filter((id) => id !== actId) : [...prev, actId]
    );
  }, []);

  // Price calculations
  const totalTravelers = Math.max(1, adultsCount + childrenCount);

  const priceBreakdown = useMemo(() => {
    if (!activeDest) {
      return {
        flightsTotal: 0,
        hotelTotal: 0,
        activitiesTotal: 0,
        transfersTotal: 0,
        visaTotal: 0,
        mealsTotal: 0,
        grandTotal: 0,
        netGrandTotal: 0,
        perTravelerPrice: 0,
      };
    }

    const duration = activeDest.durations.find((d) => d.id === selectedDurationId) || activeDest.durations[0];
    const durationMult = duration ? duration.priceMultiplier : 1.0;

    // Flight
    const flight = activeDest.flightOptions.find((f) => f.id === selectedFlightId);
    const flightPerPerson = flight ? flight.pricePerPerson : 0;
    const flightNetPerPerson = flight?.netPricePerPerson ?? flightPerPerson;
    const flightsTotal = flightPerPerson * totalTravelers;
    const flightsNetTotal = flightNetPerPerson * totalTravelers;

    // Hotel (scaled by duration multiplier)
    const hotel = activeDest.hotelTiers.find((h) => h.id === selectedHotelId);
    const hotelBase = hotel ? hotel.pricePerPerson : 0;
    const hotelNetBase = hotel?.netPricePerPerson ?? hotelBase;
    const hotelPerPerson = Math.round(hotelBase * durationMult);
    const hotelNetPerPerson = Math.round(hotelNetBase * durationMult);
    const hotelTotal = hotelPerPerson * totalTravelers;
    const hotelNetTotal = hotelNetPerPerson * totalTravelers;

    // Activities
    let activitiesTotal = 0;
    let activitiesNetTotal = 0;
    selectedActivityIds.forEach((actId) => {
      const act = activeDest.activityOptions.find((a) => a.id === actId);
      if (act) {
        activitiesTotal += act.pricePerPerson * totalTravelers;
        activitiesNetTotal += (act.netPricePerPerson ?? act.pricePerPerson) * totalTravelers;
      }
    });

    // Transfers (Fixed total for the group)
    const transfer = activeDest.transferOptions.find((t) => t.id === selectedTransferId);
    const transfersTotal = transfer ? transfer.priceTotal : 0;
    const transfersNetTotal = transfer?.netPriceTotal ?? transfersTotal;

    // Visa
    const visa = activeDest.visaOptions.find((v) => v.id === selectedVisaId);
    const visaPerPerson = visa ? visa.pricePerPerson : 0;
    const visaNetPerPerson = visa?.netPricePerPerson ?? visaPerPerson;
    const visaTotal = visaPerPerson * totalTravelers;
    const visaNetTotal = visaNetPerPerson * totalTravelers;

    // Meal Plan
    const meal = activeDest.mealPlans.find((m) => m.id === selectedMealId);
    const mealPerPerson = meal ? Math.round(meal.pricePerPerson * durationMult) : 0;
    const mealNetPerPerson = meal?.netPricePerPerson ? Math.round(meal.netPricePerPerson * durationMult) : mealPerPerson;
    const mealsTotal = mealPerPerson * totalTravelers;
    const mealsNetTotal = mealNetPerPerson * totalTravelers;

    const grandTotal = flightsTotal + hotelTotal + activitiesTotal + transfersTotal + visaTotal + mealsTotal;
    const netGrandTotal = flightsNetTotal + hotelNetTotal + activitiesNetTotal + transfersNetTotal + visaNetTotal + mealsNetTotal;
    const perTravelerPrice = Math.round(grandTotal / totalTravelers);

    return {
      flightsTotal,
      hotelTotal,
      activitiesTotal,
      transfersTotal,
      visaTotal,
      mealsTotal,
      grandTotal,
      netGrandTotal,
      perTravelerPrice,
    };
  }, [
    activeDest,
    selectedDurationId,
    selectedFlightId,
    selectedHotelId,
    selectedActivityIds,
    selectedTransferId,
    selectedVisaId,
    selectedMealId,
    totalTravelers,
  ]);

  // Proceed to Booking Workflow
  const handleProceedBooking = () => {
    if (!activeDest) return;
    const subtotal = Math.round(priceBreakdown.grandTotal / 1.05);
    const tax = priceBreakdown.grandTotal - subtotal;
    const primaryImg = activeDest.image || activeDest.heroImage || activeDest.images?.[0] || "";

    const query = new URLSearchParams({
      service: "buildpackage",
      serviceType: "buildpackage",
      destination: activeDest.destinationSlug,
      title: `${activeDest.destinationName} Custom Package`,
      name: `${activeDest.destinationName} Custom Package`,
      option: `${selectedDurationId} Custom Vacation Package`,
      duration: selectedDurationId,
      hotel: selectedHotelId,
      flight: selectedFlightId,
      activities: selectedActivityIds.join(","),
      transfer: selectedTransferId,
      visa: selectedVisaId,
      meal: selectedMealId,
      travelers: String(totalTravelers),
      adults: String(adultsCount),
      children: String(childrenCount),
      date: travelDate,
      price: String(subtotal),
      unitPrice: String(subtotal),
      subtotal: String(subtotal),
      tax: String(tax),
      total: String(priceBreakdown.grandTotal),
      totalPrice: String(priceBreakdown.grandTotal),
      currency: activeDest.currency || "INR",
      image: primaryImg,
      imageUrl: primaryImg,
    });
    router.push(`/booking?${query.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Hero Header */}
      <section className="relative bg-gradient-to-r from-blue-900 via-indigo-900 to-sky-900 text-white py-14 px-4 sm:px-6 lg:px-8 shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-sky-200 border border-sky-400/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
                <span>🛠️ Dynamic Package Builder</span>
                <span>•</span>
                <span>100% Tailored To You</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
                Build Your Dream Custom Package
              </h1>
              <p className="text-base sm:text-lg text-slate-200 max-w-2xl leading-relaxed">
                Handpick your destination, flights, resort category, daily adventures, and transfers.
                See instant real-time pricing calculated live with full transparent breakdowns.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl text-center min-w-[200px]">
              <div className="text-xs font-medium text-slate-200 uppercase tracking-wider">Demo Guarantee</div>
              <div className="text-2xl font-bold text-amber-300 mt-1">Instant Pricing</div>
              <div className="text-xs text-slate-300 mt-1">Zero Hidden Fees & 24/7 Concierge</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {loading ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mb-4"></div>
            <p className="text-slate-600 font-medium">Loading destination package options...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl shadow-sm text-center">
            <p className="font-semibold">Unable to load package builder</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : !activeDest ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-slate-600">
            No package options currently available.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left 8 Columns: Interactive Builder Steps */}
            <div className="lg:col-span-8 space-y-8">
              {/* Step 1: Destination Selection Carousel / Grid */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow">
                      1
                    </span>
                    <h2 className="text-xl font-bold text-slate-900">Choose Your Destination</h2>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {destinations.length} Curated Destinations
                  </span>
                </div>

                {/* Destination Horizontal Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
                  {destinations.map((dest) => {
                    const isSelected = dest.destinationSlug === activeDest.destinationSlug;
                    return (
                      <button
                        key={dest.destinationSlug}
                        type="button"
                        onClick={() => setSelectedDestSlug(dest.destinationSlug)}
                        className={`text-left p-3 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <span className="text-2xl">{dest.flag}</span>
                          {dest.popular && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                              Hot
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-slate-900 line-clamp-1">{dest.destinationName}</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">{dest.country}</div>
                        <div className="text-blue-700 font-semibold mt-2">
                          From {currencySymbol}
                          {dest.startingPrice.toLocaleString()}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Destination Banner Details */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-full sm:w-32 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200">
                    <Image
                      src={activeDest.heroImage || "/seed-images/buildpackage/build-destination.svg"}
                      alt={activeDest.destinationName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{activeDest.flag}</span>
                      <h3 className="text-lg font-bold text-slate-900">{activeDest.destinationName}</h3>
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                        {activeDest.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 italic">{activeDest.tagline}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{activeDest.overview}</p>
                  </div>
                </div>

                {/* Durations & Travel Party Controls */}
                <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Duration Picker */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Trip Duration
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {activeDest.durations.map((dur) => (
                        <button
                          key={dur.id}
                          type="button"
                          onClick={() => setSelectedDurationId(dur.id)}
                          className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition-all ${
                            selectedDurationId === dur.id
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {dur.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Travel Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Departure Date
                    </label>
                    <input
                      type="date"
                      value={travelDate}
                      onChange={(e) => setTravelDate(e.target.value)}
                      className="w-full text-xs font-medium p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Travelers Counter */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Travelers ({totalTravelers} Pax)
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white border border-slate-200 rounded-lg p-1.5 flex items-center justify-between">
                        <span className="text-xs text-slate-600 pl-2">Adults</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setAdultsCount(Math.max(1, adultsCount - 1))}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{adultsCount}</span>
                          <button
                            type="button"
                            onClick={() => setAdultsCount(adultsCount + 1)}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 bg-white border border-slate-200 rounded-lg p-1.5 flex items-center justify-between">
                        <span className="text-xs text-slate-600 pl-2">Kids</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{childrenCount}</span>
                          <button
                            type="button"
                            onClick={() => setChildrenCount(childrenCount + 1)}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Flight & Air Travel Selection */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow">
                    2
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Select Flights & Airfare</h2>
                    <p className="text-xs text-slate-500">Scheduled roundtrip passenger flights with luggage and meal options</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {activeDest.flightOptions.map((flight) => {
                    const isSelected = selectedFlightId === flight.id;
                    return (
                      <div
                        key={flight.id}
                        onClick={() => setSelectedFlightId(flight.id)}
                        className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="flightChoice"
                            checked={isSelected}
                            onChange={() => setSelectedFlightId(flight.id)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{flight.name}</div>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                                {flight.airline}
                              </span>
                              <span>•</span>
                              <span>🧳 {flight.baggage}</span>
                              <span>•</span>
                              <span>🍽️ {flight.meals}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right sm:flex-shrink-0">
                          <div className="text-base font-extrabold text-blue-700">
                            {flight.pricePerPerson > 0
                              ? `+ ${currencySymbol}${flight.pricePerPerson.toLocaleString()} / pax`
                              : "Included (0 Cost)"}
                          </div>
                          {isTechnoheaven && flight.netPricePerPerson && (
                            <div className="text-[11px] text-slate-500">
                              B2B Net: {currencySymbol}{flight.netPricePerPerson.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Hotel & Accommodation Tier */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow">
                    3
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Select Hotel & Stay Category</h2>
                    <p className="text-xs text-slate-500">Handpicked certified properties with guaranteed vegetarian & Jain breakfast</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {activeDest.hotelTiers.map((tier) => {
                    const isSelected = selectedHotelId === tier.id;
                    return (
                      <div
                        key={tier.id}
                        onClick={() => setSelectedHotelId(tier.id)}
                        className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col justify-between ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-sm"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                              {tier.tierName}
                            </span>
                            <span className="text-amber-500 text-xs font-bold">
                              {"★".repeat(tier.starRating)}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm">{tier.hotelName}</h4>
                          <p className="text-xs text-slate-500 mt-1 italic">{tier.highlights}</p>
                          <ul className="mt-3 space-y-1 text-xs text-slate-600">
                            {tier.inclusions.map((inc, i) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <span className="text-emerald-600 font-bold">✓</span>
                                <span className="line-clamp-1">{inc}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                          <div className="text-xs font-bold text-slate-900">
                            {currencySymbol}{tier.pricePerPerson.toLocaleString()}
                            <span className="text-[10px] text-slate-500 font-normal"> / person</span>
                          </div>
                          <span
                            className={`text-xs px-2.5 py-1 rounded-md font-semibold ${
                              isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {isSelected ? "Selected" : "Select"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 4: Sightseeing & Activity Options (Checkable) */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow">
                      4
                    </span>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Sightseeing & Experiences</h2>
                      <p className="text-xs text-slate-500">Pick the attractions you want included in your itinerary</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                    {selectedActivityIds.length} Selected
                  </span>
                </div>

                <div className="space-y-3">
                  {activeDest.activityOptions.map((act) => {
                    const isChecked = selectedActivityIds.includes(act.id);
                    return (
                      <div
                        key={act.id}
                        onClick={() => toggleActivity(act.id)}
                        className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isChecked
                            ? "border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleActivity(act.id)}
                            className="mt-1 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{act.name}</span>
                              {act.isRecommended && (
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  Must Do
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">⏱️ Duration: {act.duration}</div>
                            <p className="text-xs text-slate-600 mt-1 line-clamp-1">{act.description}</p>
                          </div>
                        </div>
                        <div className="text-right sm:flex-shrink-0">
                          <div className="text-sm font-extrabold text-slate-900">
                            +{currencySymbol}{act.pricePerPerson.toLocaleString()}
                            <span className="text-[10px] text-slate-500 font-normal"> / pax</span>
                          </div>
                          {isChecked && (
                            <span className="text-emerald-700 text-xs font-semibold">Included</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 5: Airport & Ground Transfers */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow">
                    5
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Airport & Ground Transfers</h2>
                    <p className="text-xs text-slate-500">Private dedicated vehicles with chauffeur, tolls, and parking fees included</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeDest.transferOptions.map((tr) => {
                    const isSelected = selectedTransferId === tr.id;
                    return (
                      <div
                        key={tr.id}
                        onClick={() => setSelectedTransferId(tr.id)}
                        className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col justify-between ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-sm"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-slate-900 text-sm">{tr.name}</span>
                          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                            {tr.vehicleClass}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 space-y-0.5">
                          <div>👥 Capacity: {tr.capacity}</div>
                          <div>🧳 Luggage: {tr.luggage}</div>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between">
                          <div className="text-sm font-extrabold text-blue-700">
                            {tr.priceTotal > 0 ? `+ ${currencySymbol}${tr.priceTotal.toLocaleString()} total` : "Self Managed (0 Cost)"}
                          </div>
                          <span
                            className={`text-xs px-2.5 py-1 rounded-md font-semibold ${
                              isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {isSelected ? "Selected" : "Select"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 6: Visa & Entry Processing */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow">
                    6
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Tourist Visa & Pre-Screening</h2>
                    <p className="text-xs text-slate-500">Dedicated embassy documentation screening with fast-track approval</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {activeDest.visaOptions.map((visa) => {
                    const isSelected = selectedVisaId === visa.id;
                    return (
                      <div
                        key={visa.id}
                        onClick={() => setSelectedVisaId(visa.id)}
                        className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col justify-between ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-sm"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-900 text-sm line-clamp-2">{visa.name}</div>
                          <div className="text-xs text-slate-500 mt-2 space-y-1">
                            <div>⚡ Speed: {visa.processingTime}</div>
                            <div>📅 Validity: {visa.validity}</div>
                          </div>
                        </div>
                        <div className="mt-4 pt-2 border-t border-slate-200 flex items-center justify-between">
                          <div className="text-xs font-bold text-blue-700">
                            {visa.pricePerPerson > 0 ? `+ ${currencySymbol}${visa.pricePerPerson.toLocaleString()} / pax` : "No Visa Fee"}
                          </div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-semibold ${
                              isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {isSelected ? "Selected" : "Select"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 7: Meal Plan Customization */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow">
                    7
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Meal Plan Customization</h2>
                    <p className="text-xs text-slate-500">Gujarati Thali, 100% Pure Vegetarian & Jain meal arrangements</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {activeDest.mealPlans.map((meal) => {
                    const isSelected = selectedMealId === meal.id;
                    return (
                      <div
                        key={meal.id}
                        onClick={() => setSelectedMealId(meal.id)}
                        className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col justify-between ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-sm"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{meal.name}</div>
                          <p className="text-xs text-slate-500 mt-1">{meal.description}</p>
                        </div>
                        <div className="mt-4 pt-2 border-t border-slate-200 flex items-center justify-between">
                          <div className="text-xs font-bold text-blue-700">
                            {meal.pricePerPerson > 0 ? `+ ${currencySymbol}${meal.pricePerPerson.toLocaleString()} / pax` : "Included (0 Cost)"}
                          </div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-semibold ${
                              isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {isSelected ? "Selected" : "Select"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right 4 Columns: Sticky Live Quotation & Booking Panel */}
            <div className="lg:col-span-4">
              <div className="sticky top-20 bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      Live Custom Quotation
                    </span>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      Sample Demo Data
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                    {activeDest.destinationName}
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Departure: <span className="font-semibold text-slate-700">{travelDate}</span> • {totalTravelers} Travelers
                  </div>
                </div>

                {/* Real-time Component Summary */}
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Flights ({totalTravelers} Pax):</span>
                    <span className="font-semibold text-slate-900">
                      {currencySymbol}{priceBreakdown.flightsTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Hotel Accommodation:</span>
                    <span className="font-semibold text-slate-900">
                      {currencySymbol}{priceBreakdown.hotelTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Sightseeing ({selectedActivityIds.length} tours):</span>
                    <span className="font-semibold text-slate-900">
                      {currencySymbol}{priceBreakdown.activitiesTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Ground & Airport Transfer:</span>
                    <span className="font-semibold text-slate-900">
                      {currencySymbol}{priceBreakdown.transfersTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Visa & Pre-Screening:</span>
                    <span className="font-semibold text-slate-900">
                      {currencySymbol}{priceBreakdown.visaTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Meal Plan Options:</span>
                    <span className="font-semibold text-slate-900">
                      {currencySymbol}{priceBreakdown.mealsTotal.toLocaleString()}
                    </span>
                  </div>

                  {isTechnoheaven && (
                    <div className="pt-2 border-t border-dashed border-slate-200 flex justify-between text-emerald-700 font-semibold">
                      <span>B2B Agency Net Total:</span>
                      <span>{currencySymbol}{priceBreakdown.netGrandTotal.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Grand Total Callout */}
                <div className="pt-4 border-t border-slate-200 bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-700">Total Price:</span>
                    <span className="text-2xl sm:text-3xl font-extrabold text-blue-700">
                      {currencySymbol}{priceBreakdown.grandTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 text-right mb-4">
                    ≈ {currencySymbol}{priceBreakdown.perTravelerPrice.toLocaleString()} / traveler (all taxes included)
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleProceedBooking}
                      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2"
                    >
                      <span>Book Custom Package Now</span>
                      <span>→</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnquiryOpen(true)}
                      className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-800 font-semibold border border-slate-300 rounded-xl transition-all text-xs"
                    >
                      💬 Request Custom Quotation / Talk to Specialist
                    </button>
                  </div>

                  {/* Trust Strip */}
                  <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 text-[10px] text-slate-500 text-center">
                    <div>🔒 100% Secure Checkout</div>
                    <div>⚡ Instant Confirmation</div>
                    <div>🛡️ Best Price Guarantee</div>
                    <div>📞 24/7 Concierge Support</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Package Enquiry Modal */}
      {enquiryOpen && activeDest && (
        <EnquiryModal
          isOpen={enquiryOpen}
          onClose={() => setEnquiryOpen(false)}
          serviceName={`${activeDest.destinationName} Custom Package`}
          defaultDestination={activeDest.country}
          siteId={siteId}
          currencySymbol={currencySymbol}
        />
      )}
    </div>
  );
}
